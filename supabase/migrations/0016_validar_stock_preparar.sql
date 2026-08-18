-- 0016_validar_stock_preparar.sql
-- Asegurar que preparar_receta valide el stock de los insumos y subrecetas antes de descontar.

CREATE OR REPLACE FUNCTION preparar_receta(
  p_restaurante_id UUID,
  p_receta_id UUID,
  p_cantidad NUMERIC
) RETURNS JSON AS $$
DECLARE
  v_receta RECORD;
  v_ingrediente RECORD;
  v_cantidad_consumida NUMERIC;
  
  v_factor NUMERIC;
  v_rendi NUMERIC;
  v_costo_ingrediente NUMERIC;
  
  v_lote RECORD;
  v_cantidad_restante NUMERIC;

  v_stock_disponible NUMERIC;
  v_nombre_item TEXT;
BEGIN
  -- Validar que la receta exista y pertenezca al restaurante
  SELECT * INTO v_receta FROM recetas WHERE id = p_receta_id AND restaurante_id = p_restaurante_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receta no encontrada';
  END IF;

  -- Descontar ingredientes directos
  FOR v_ingrediente IN 
    SELECT 
      ri.insumo_id, 
      ri.subreceta_id, 
      ri.cantidad,
      i.costo_unidad_compra,
      i.factor_conversion,
      i.porcentaje_rendimiento
    FROM receta_ingredientes ri
    LEFT JOIN insumos i ON ri.insumo_id = i.id
    WHERE ri.receta_id = p_receta_id
  LOOP
    -- La cantidad a consumir es (cantidad_en_receta / rendimiento_receta) * cantidad_producida
    v_cantidad_consumida := (v_ingrediente.cantidad / COALESCE(v_receta.rendimiento, 1)) * p_cantidad;

    IF v_ingrediente.insumo_id IS NOT NULL THEN
      -- Validar stock de insumo
      SELECT cantidad_actual_base, nombre INTO v_stock_disponible, v_nombre_item 
      FROM insumos 
      WHERE id = v_ingrediente.insumo_id AND restaurante_id = p_restaurante_id;
      
      IF v_stock_disponible < v_cantidad_consumida THEN
         RAISE EXCEPTION 'No tienes suficiente % para elaborar % % (necesitas %, tienes %)', 
                         v_nombre_item, p_cantidad, v_receta.nombre, ROUND(v_cantidad_consumida, 2), ROUND(v_stock_disponible, 2);
      END IF;

      -- Es un insumo base: descontar stock
      UPDATE insumos
      SET cantidad_actual_base = cantidad_actual_base - v_cantidad_consumida
      WHERE id = v_ingrediente.insumo_id AND restaurante_id = p_restaurante_id;
      
      -- Calcular costo para kardex
      v_factor := COALESCE(v_ingrediente.factor_conversion, 1);
      IF v_factor = 0 THEN v_factor := 1; END IF;
      v_rendi := COALESCE(v_ingrediente.porcentaje_rendimiento, 100);
      IF v_rendi = 0 THEN v_rendi := 100; END IF;
      v_costo_ingrediente := (COALESCE(v_ingrediente.costo_unidad_compra, 0) / v_factor / (v_rendi / 100)) * v_cantidad_consumida;

      -- Lógica FIFO
      v_cantidad_restante := v_cantidad_consumida;
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

      -- Kardex
      INSERT INTO insumo_movimientos (insumo_id, restaurante_id, tipo, cantidad, costo_movimiento, notas)
      VALUES (
        v_ingrediente.insumo_id, 
        p_restaurante_id, 
        'ajuste', 
        -v_cantidad_consumida, 
        v_costo_ingrediente, 
        'Consumido en preparación de ' || p_cantidad || 'x ' || v_receta.nombre
      );

    ELSIF v_ingrediente.subreceta_id IS NOT NULL THEN
      -- Validar stock de subreceta
      SELECT stock_actual, nombre INTO v_stock_disponible, v_nombre_item 
      FROM recetas 
      WHERE id = v_ingrediente.subreceta_id AND restaurante_id = p_restaurante_id;
      
      IF v_stock_disponible < v_cantidad_consumida THEN
         RAISE EXCEPTION 'No tienes suficiente % para elaborar % % (necesitas %, tienes %)', 
                         v_nombre_item, p_cantidad, v_receta.nombre, ROUND(v_cantidad_consumida, 2), ROUND(v_stock_disponible, 2);
      END IF;

      -- Es una subreceta: descontar de su stock_actual
      UPDATE recetas
      SET stock_actual = stock_actual - v_cantidad_consumida
      WHERE id = v_ingrediente.subreceta_id AND restaurante_id = p_restaurante_id;
    END IF;
  END LOOP;

  -- Aumentar el stock de la receta producida
  UPDATE recetas
  SET stock_actual = stock_actual + p_cantidad
  WHERE id = p_receta_id;

  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
