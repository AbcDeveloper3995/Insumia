-- Migración 0010: Módulo de Mermas

-- 1. Crear tabla mermas
CREATE TABLE IF NOT EXISTS mermas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  total_perdida NUMERIC NOT NULL DEFAULT 0,
  notas TEXT,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE mermas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios pueden ver mermas de su restaurante"
ON mermas FOR SELECT
USING (restaurante_id IN (SELECT restaurante_id FROM public.usuario_restaurantes WHERE usuario_id = auth.uid()));

CREATE POLICY "Usuarios pueden insertar mermas de su restaurante"
ON mermas FOR INSERT
WITH CHECK (restaurante_id IN (SELECT restaurante_id FROM public.usuario_restaurantes WHERE usuario_id = auth.uid()));

-- 2. Crear tabla merma_detalles
CREATE TABLE IF NOT EXISTS merma_detalles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merma_id UUID NOT NULL REFERENCES mermas(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  tipo_item TEXT NOT NULL CHECK (tipo_item IN ('insumo', 'receta')),
  cantidad NUMERIC NOT NULL,
  motivo TEXT NOT NULL,
  costo_total NUMERIC NOT NULL DEFAULT 0
);

ALTER TABLE merma_detalles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios pueden ver detalles de merma de su restaurante"
ON merma_detalles FOR SELECT
USING (merma_id IN (SELECT id FROM mermas WHERE restaurante_id IN (SELECT restaurante_id FROM public.usuario_restaurantes WHERE usuario_id = auth.uid())));

CREATE POLICY "Usuarios pueden insertar detalles de merma de su restaurante"
ON merma_detalles FOR INSERT
WITH CHECK (merma_id IN (SELECT id FROM mermas WHERE restaurante_id IN (SELECT restaurante_id FROM public.usuario_restaurantes WHERE usuario_id = auth.uid())));

-- 3. Crear función registrar_merma
CREATE OR REPLACE FUNCTION registrar_merma(
  p_restaurante_id UUID,
  p_detalles JSONB,
  p_notas TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_merma_id UUID;
  v_total_perdida NUMERIC := 0;
  v_articulo JSONB;
  v_ingrediente RECORD;
  
  v_cantidad_total_consumida NUMERIC;
  v_costo_ingrediente NUMERIC;
  
  v_factor NUMERIC;
  v_rendi NUMERIC;
  
  v_lote RECORD;
  v_cantidad_restante NUMERIC;
  
  v_item_nombre TEXT;
  v_costo_item NUMERIC := 0;
BEGIN
  -- 1. Insertar la cabecera de la merma
  INSERT INTO mermas (restaurante_id, total_perdida, notas)
  VALUES (p_restaurante_id, 0, p_notas)
  RETURNING id INTO v_merma_id;

  -- 2. Iterar sobre los artículos mermados
  FOR v_articulo IN SELECT * FROM jsonb_array_elements(p_detalles)
  LOOP
    v_costo_item := 0;

    IF (v_articulo->>'tipo_item') = 'insumo' THEN
      -- Es un insumo crudo
      SELECT nombre INTO v_item_nombre FROM insumos WHERE id = (v_articulo->>'item_id')::UUID;
      
      FOR v_ingrediente IN 
        SELECT id as insumo_id, 1 as cantidad_uso, costo_unidad_compra, factor_conversion, porcentaje_rendimiento 
        FROM insumos
        WHERE id = (v_articulo->>'item_id')::UUID
      LOOP
        v_cantidad_total_consumida := (v_articulo->>'cantidad')::NUMERIC;
        v_factor := COALESCE(v_ingrediente.factor_conversion, 1);
        IF v_factor = 0 THEN v_factor := 1; END IF;
        v_rendi := COALESCE(v_ingrediente.porcentaje_rendimiento, 100);
        IF v_rendi = 0 THEN v_rendi := 100; END IF;

        v_costo_ingrediente := (COALESCE(v_ingrediente.costo_unidad_compra, 0) / v_factor / (v_rendi / 100)) * v_cantidad_total_consumida;
        v_costo_item := v_costo_item + v_costo_ingrediente;
        
        -- Actualizar Stock global
        UPDATE insumos
        SET cantidad_actual_base = cantidad_actual_base - v_cantidad_total_consumida
        WHERE id = v_ingrediente.insumo_id AND restaurante_id = p_restaurante_id;
        
        -- Lógica FIFO en lotes
        v_cantidad_restante := v_cantidad_total_consumida;
        FOR v_lote IN 
          SELECT id, cantidad_actual FROM lotes_insumo 
          WHERE insumo_id = v_ingrediente.insumo_id 
            AND restaurante_id = p_restaurante_id 
            AND cantidad_actual > 0
          ORDER BY fecha_caducidad ASC NULLS LAST, created_at ASC
          FOR UPDATE
        LOOP
          IF v_lote.cantidad_actual >= v_cantidad_restante THEN
            UPDATE lotes_insumo SET cantidad_actual = cantidad_actual - v_cantidad_restante WHERE id = v_lote.id;
            v_cantidad_restante := 0;
            EXIT;
          ELSE
            UPDATE lotes_insumo SET cantidad_actual = 0 WHERE id = v_lote.id;
            v_cantidad_restante := v_cantidad_restante - v_lote.cantidad_actual;
          END IF;
        END LOOP;
        
        IF v_cantidad_restante > 0 THEN
           INSERT INTO lotes_insumo (insumo_id, restaurante_id, cantidad_inicial, cantidad_actual, fecha_caducidad)
           VALUES (v_ingrediente.insumo_id, p_restaurante_id, 0, -v_cantidad_restante, NULL);
        END IF;

        -- Registrar en Kardex
        INSERT INTO insumo_movimientos (insumo_id, restaurante_id, tipo, cantidad, costo_movimiento, ingreso_generado, referencia_id, notas)
        VALUES (
          v_ingrediente.insumo_id, 
          p_restaurante_id, 
          'merma', 
          -v_cantidad_total_consumida, 
          v_costo_ingrediente, 
          0, 
          v_merma_id, 
          'Merma: ' || (v_articulo->>'motivo')
        );
      END LOOP;

    ELSE
      -- Es una receta o subreceta (Descomponer)
      SELECT nombre INTO v_item_nombre FROM recetas WHERE id = (v_articulo->>'item_id')::UUID;
      
      FOR v_ingrediente IN 
        WITH RECURSIVE receta_tree AS (
            SELECT 
                ri.insumo_id, 
                ri.subreceta_id, 
                (ri.cantidad / COALESCE(r.rendimiento, 1)) AS cantidad_necesaria
            FROM receta_ingredientes ri
            JOIN recetas r ON r.id = ri.receta_id
            WHERE ri.receta_id = (v_articulo->>'item_id')::UUID
            UNION ALL
            SELECT 
                ri.insumo_id, 
                ri.subreceta_id, 
                (rt.cantidad_necesaria * (ri.cantidad / COALESCE(r_sub.rendimiento, 1)))
            FROM receta_tree rt
            JOIN receta_ingredientes ri ON ri.receta_id = rt.subreceta_id
            JOIN recetas r_sub ON r_sub.id = ri.receta_id
            WHERE rt.subreceta_id IS NOT NULL
        )
        SELECT 
            rt.insumo_id, 
            SUM(rt.cantidad_necesaria) as cantidad_uso,
            i.costo_unidad_compra, 
            i.factor_conversion, 
            i.porcentaje_rendimiento 
        FROM receta_tree rt
        JOIN insumos i ON rt.insumo_id = i.id
        WHERE rt.insumo_id IS NOT NULL
        GROUP BY rt.insumo_id, i.costo_unidad_compra, i.factor_conversion, i.porcentaje_rendimiento
      LOOP
        v_cantidad_total_consumida := v_ingrediente.cantidad_uso * (v_articulo->>'cantidad')::NUMERIC;
        
        v_factor := COALESCE(v_ingrediente.factor_conversion, 1);
        IF v_factor = 0 THEN v_factor := 1; END IF;
        v_rendi := COALESCE(v_ingrediente.porcentaje_rendimiento, 100);
        IF v_rendi = 0 THEN v_rendi := 100; END IF;

        v_costo_ingrediente := (COALESCE(v_ingrediente.costo_unidad_compra, 0) / v_factor / (v_rendi / 100)) * v_cantidad_total_consumida;
        v_costo_item := v_costo_item + v_costo_ingrediente;
        
        -- Actualizar Stock global
        UPDATE insumos
        SET cantidad_actual_base = cantidad_actual_base - v_cantidad_total_consumida
        WHERE id = v_ingrediente.insumo_id AND restaurante_id = p_restaurante_id;
        
        -- Lógica FIFO en lotes
        v_cantidad_restante := v_cantidad_total_consumida;
        FOR v_lote IN 
          SELECT id, cantidad_actual FROM lotes_insumo 
          WHERE insumo_id = v_ingrediente.insumo_id 
            AND restaurante_id = p_restaurante_id 
            AND cantidad_actual > 0
          ORDER BY fecha_caducidad ASC NULLS LAST, created_at ASC
          FOR UPDATE
        LOOP
          IF v_lote.cantidad_actual >= v_cantidad_restante THEN
            UPDATE lotes_insumo SET cantidad_actual = cantidad_actual - v_cantidad_restante WHERE id = v_lote.id;
            v_cantidad_restante := 0;
            EXIT;
          ELSE
            UPDATE lotes_insumo SET cantidad_actual = 0 WHERE id = v_lote.id;
            v_cantidad_restante := v_cantidad_restante - v_lote.cantidad_actual;
          END IF;
        END LOOP;
        
        IF v_cantidad_restante > 0 THEN
           INSERT INTO lotes_insumo (insumo_id, restaurante_id, cantidad_inicial, cantidad_actual, fecha_caducidad)
           VALUES (v_ingrediente.insumo_id, p_restaurante_id, 0, -v_cantidad_restante, NULL);
        END IF;

        -- Registrar en Kardex
        INSERT INTO insumo_movimientos (insumo_id, restaurante_id, tipo, cantidad, costo_movimiento, ingreso_generado, referencia_id, notas)
        VALUES (
          v_ingrediente.insumo_id, 
          p_restaurante_id, 
          'merma', 
          -v_cantidad_total_consumida, 
          v_costo_ingrediente, 
          0, 
          v_merma_id, 
          'Merma en ' || (v_articulo->>'cantidad') || 'x ' || v_item_nombre || ': ' || (v_articulo->>'motivo')
        );
      END LOOP;
    END IF;

    -- Insertar en merma_detalles
    INSERT INTO merma_detalles (merma_id, item_id, tipo_item, cantidad, motivo, costo_total)
    VALUES (
      v_merma_id, 
      (v_articulo->>'item_id')::UUID, 
      v_articulo->>'tipo_item', 
      (v_articulo->>'cantidad')::NUMERIC, 
      v_articulo->>'motivo',
      v_costo_item
    );
    
    v_total_perdida := v_total_perdida + v_costo_item;
  END LOOP;

  -- 3. Actualizar total_perdida en mermas
  UPDATE mermas SET total_perdida = v_total_perdida WHERE id = v_merma_id;

  RETURN v_merma_id;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error al registrar la merma: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
