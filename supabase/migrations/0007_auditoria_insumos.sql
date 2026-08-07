-- Crear tabla de auditoria de insumos (Kardex)
CREATE TABLE IF NOT EXISTS insumo_movimientos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insumo_id UUID NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('compra', 'venta', 'ajuste', 'merma')),
  cantidad NUMERIC NOT NULL, -- Positiva para compra, negativa para venta
  costo_movimiento NUMERIC NOT NULL DEFAULT 0, -- Valor de costo de este movimiento
  ingreso_generado NUMERIC DEFAULT 0, -- Dinero aportado en caso de venta (proporcional)
  referencia_id UUID, -- venta_id o compra_id
  notas TEXT, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS y crear políticas para que el Frontend pueda leer los datos
ALTER TABLE insumo_movimientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver movimientos de su restaurante" ON insumo_movimientos;
CREATE POLICY "Usuarios pueden ver movimientos de su restaurante"
ON insumo_movimientos FOR SELECT
USING (
  restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario())
);

-- Actualizar la función registrar_venta para que llene el Kardex
CREATE OR REPLACE FUNCTION registrar_venta(
  p_restaurante_id UUID,
  p_detalles JSONB, 
  p_caja_id UUID DEFAULT NULL,
  p_metodo_pago TEXT DEFAULT 'efectivo'
) RETURNS UUID AS $$
DECLARE
  v_venta_id UUID;
  v_total NUMERIC := 0;
  v_articulo JSONB;
  v_ingrediente RECORD;
  v_precio_venta NUMERIC;
  v_rec_costo_total NUMERIC;
  v_receta_nombre TEXT;
  
  v_cantidad_total_consumida NUMERIC;
  v_costo_ingrediente NUMERIC;
  v_ingreso_proporcional NUMERIC;
  
  v_factor NUMERIC;
  v_rendi NUMERIC;
BEGIN
  -- 1. Insertar la cabecera de la venta
  INSERT INTO ventas (restaurante_id, estado, metodo_pago, caja_id, total)
  VALUES (p_restaurante_id, 'completada', p_metodo_pago, p_caja_id, 0)
  RETURNING id INTO v_venta_id;

  -- 2. Iterar sobre los artículos vendidos
  FOR v_articulo IN SELECT * FROM jsonb_array_elements(p_detalles)
  LOOP
    -- Obtener datos de la receta
    SELECT precio_venta, nombre 
    INTO v_precio_venta, v_receta_nombre 
    FROM recetas 
    WHERE id = (v_articulo->>'receta_id')::UUID;
    
    IF v_precio_venta IS NULL THEN v_precio_venta := 0; END IF;

    -- Calcular costo_total de la receta al vuelo
    SELECT COALESCE(SUM(
      (COALESCE(i.costo_unidad_compra, 0) / GREATEST(COALESCE(i.factor_conversion, 1), 1) / (GREATEST(COALESCE(i.porcentaje_rendimiento, 100), 1) / 100.0)) * ri.cantidad
    ), 0)
    INTO v_rec_costo_total
    FROM receta_ingredientes ri
    JOIN insumos i ON ri.insumo_id = i.id
    WHERE ri.receta_id = (v_articulo->>'receta_id')::UUID;

    -- A. Insertar el detalle de la venta
    INSERT INTO venta_detalles (venta_id, receta_id, cantidad)
    VALUES (
      v_venta_id, 
      (v_articulo->>'receta_id')::UUID, 
      (v_articulo->>'cantidad')::INTEGER
    );

    v_total := v_total + ((v_articulo->>'cantidad')::INTEGER * v_precio_venta);

    -- B. Descontar ingredientes y registrar Kardex
    FOR v_ingrediente IN 
      SELECT i.id as insumo_id, ri.cantidad as cantidad_uso, i.costo_unidad_compra, i.factor_conversion, i.porcentaje_rendimiento 
      FROM receta_ingredientes ri
      JOIN insumos i ON ri.insumo_id = i.id
      WHERE ri.receta_id = (v_articulo->>'receta_id')::UUID
    LOOP
      v_cantidad_total_consumida := v_ingrediente.cantidad_uso * (v_articulo->>'cantidad')::INTEGER;
      
      -- Asegurar que divisores no sean cero
      v_factor := COALESCE(v_ingrediente.factor_conversion, 1);
      IF v_factor = 0 THEN v_factor := 1; END IF;
      v_rendi := COALESCE(v_ingrediente.porcentaje_rendimiento, 100);
      IF v_rendi = 0 THEN v_rendi := 100; END IF;

      -- Costo exacto de los gramos consumidos
      v_costo_ingrediente := (COALESCE(v_ingrediente.costo_unidad_compra, 0) / v_factor / (v_rendi / 100)) * v_cantidad_total_consumida;
      
      -- Calcular el ingreso proporcional basado en el costo_total del platillo
      IF v_rec_costo_total > 0 THEN
         v_ingreso_proporcional := (v_costo_ingrediente / v_rec_costo_total) * (v_precio_venta * (v_articulo->>'cantidad')::INTEGER);
      ELSE
         v_ingreso_proporcional := 0;
      END IF;

      -- Actualizar Stock
      UPDATE insumos
      SET cantidad_actual_base = cantidad_actual_base - v_cantidad_total_consumida
      WHERE id = v_ingrediente.insumo_id AND restaurante_id = p_restaurante_id;
      
      -- Registrar en Kardex
      INSERT INTO insumo_movimientos (insumo_id, restaurante_id, tipo, cantidad, costo_movimiento, ingreso_generado, referencia_id, notas)
      VALUES (
        v_ingrediente.insumo_id, 
        p_restaurante_id, 
        'venta', 
        -v_cantidad_total_consumida, 
        v_costo_ingrediente, 
        v_ingreso_proporcional, 
        v_venta_id, 
        'Consumido en ' || (v_articulo->>'cantidad') || 'x ' || v_receta_nombre
      );

    END LOOP;
    
  END LOOP;

  -- 3. Actualizar total de la venta
  UPDATE ventas SET total = v_total WHERE id = v_venta_id;

  -- 4. Registrar ingreso en caja si se especificó
  IF p_caja_id IS NOT NULL THEN
    INSERT INTO movimientos_caja (caja_id, tipo, monto, concepto, metodo_pago, referencia_id)
    VALUES (p_caja_id, 'ingreso', v_total, 'Venta en mostrador', p_metodo_pago, v_venta_id);
  END IF;

  RETURN v_venta_id;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error al registrar la venta: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Actualizar registrar_compra para llenar Kardex
CREATE OR REPLACE FUNCTION registrar_compra(
  p_restaurante_id UUID,
  p_proveedor_id UUID,
  p_estado TEXT,
  p_detalles JSONB,
  p_caja_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_compra_id UUID;
  v_total NUMERIC := 0;
  v_detalle JSONB;
  v_insumo_id UUID;
  v_cantidad NUMERIC;
  v_precio_unitario NUMERIC;
  v_factor_conversion NUMERIC;
BEGIN
  -- 1. Insertar la cabecera de la compra
  INSERT INTO compras (restaurante_id, proveedor_id, estado, total, fecha)
  VALUES (p_restaurante_id, p_proveedor_id, p_estado, 0, NOW())
  RETURNING id INTO v_compra_id;

  -- 2. Procesar detalles
  FOR v_detalle IN SELECT * FROM jsonb_array_elements(p_detalles)
  LOOP
    v_insumo_id := (v_detalle->>'insumo_id')::UUID;
    v_cantidad := (v_detalle->>'cantidad')::NUMERIC;
    v_precio_unitario := (v_detalle->>'precio_unitario')::NUMERIC;
    
    INSERT INTO compra_detalles (compra_id, insumo_id, cantidad, precio_unitario)
    VALUES (v_compra_id, v_insumo_id, v_cantidad, v_precio_unitario);
    
    v_total := v_total + (v_cantidad * v_precio_unitario);

    SELECT factor_conversion INTO v_factor_conversion FROM insumos WHERE id = v_insumo_id;
    IF v_factor_conversion IS NULL OR v_factor_conversion = 0 THEN
        v_factor_conversion := 1;
    END IF;

    -- 3. Aumentar inventario de insumos
    UPDATE insumos 
    SET cantidad_actual_base = cantidad_actual_base + (v_cantidad * v_factor_conversion),
        costo_unidad_compra = v_precio_unitario
    WHERE id = v_insumo_id;

    -- Registrar en Kardex
    INSERT INTO insumo_movimientos (insumo_id, restaurante_id, tipo, cantidad, costo_movimiento, ingreso_generado, referencia_id, notas)
    VALUES (
        v_insumo_id, 
        p_restaurante_id, 
        'compra', 
        (v_cantidad * v_factor_conversion), 
        (v_cantidad * v_precio_unitario), 
        0, 
        v_compra_id, 
        'Compra de Insumos (' || v_cantidad || ' unid.)'
    );
  END LOOP;

  -- 4. Actualizar total de compra
  UPDATE compras SET total = v_total WHERE id = v_compra_id;

  -- 5. Si estado es 'pagada' y tenemos caja, registrar egreso
  IF p_estado = 'pagada' AND p_caja_id IS NOT NULL THEN
    INSERT INTO movimientos_caja (caja_id, tipo, monto, concepto, metodo_pago, referencia_id)
    VALUES (p_caja_id, 'egreso', v_total, 'Pago a proveedor', 'efectivo', v_compra_id);
  END IF;

  RETURN v_compra_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
