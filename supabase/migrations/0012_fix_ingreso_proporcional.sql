-- Migración 0012: Fix de cálculo matemático de ingreso_proporcional en ventas
-- 
-- El cálculo anterior multiplicaba por la cantidad vendida dos veces,
-- inflando incorrectamente el aporte bruto del insumo en el Kardex.

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
  
  v_lote RECORD;
  v_cantidad_restante NUMERIC;
BEGIN
  INSERT INTO ventas (restaurante_id, estado, metodo_pago, caja_id, total)
  VALUES (p_restaurante_id, 'completada', p_metodo_pago, p_caja_id, 0)
  RETURNING id INTO v_venta_id;

  FOR v_articulo IN SELECT * FROM jsonb_array_elements(p_detalles)
  LOOP
    SELECT precio_venta, nombre 
    INTO v_precio_venta, v_receta_nombre 
    FROM recetas 
    WHERE id = (v_articulo->>'receta_id')::UUID;
    
    IF v_precio_venta IS NULL THEN v_precio_venta := 0; END IF;

    -- Calcular el costo total exacto resolviendo recursivamente subrecetas
    WITH RECURSIVE receta_tree AS (
        SELECT 
            ri.insumo_id, 
            ri.subreceta_id, 
            (ri.cantidad / COALESCE(r.rendimiento, 1)) AS cantidad_necesaria
        FROM receta_ingredientes ri
        JOIN recetas r ON r.id = ri.receta_id
        WHERE ri.receta_id = (v_articulo->>'receta_id')::UUID
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
    SELECT COALESCE(SUM(
      (COALESCE(i.costo_unidad_compra, 0) / GREATEST(COALESCE(i.factor_conversion, 1), 1) / (GREATEST(COALESCE(i.porcentaje_rendimiento, 100), 1) / 100.0)) * rt.cantidad_necesaria
    ), 0)
    INTO v_rec_costo_total
    FROM receta_tree rt
    JOIN insumos i ON i.id = rt.insumo_id
    WHERE rt.insumo_id IS NOT NULL;

    INSERT INTO venta_detalles (venta_id, receta_id, cantidad)
    VALUES (
      v_venta_id, 
      (v_articulo->>'receta_id')::UUID, 
      (v_articulo->>'cantidad')::INTEGER
    );

    v_total := v_total + ((v_articulo->>'cantidad')::INTEGER * v_precio_venta);

    -- Procesar cada insumo base (hojas del árbol de la receta)
    FOR v_ingrediente IN 
      WITH RECURSIVE receta_tree AS (
          SELECT 
              ri.insumo_id, 
              ri.subreceta_id, 
              (ri.cantidad / COALESCE(r.rendimiento, 1)) AS cantidad_necesaria
          FROM receta_ingredientes ri
          JOIN recetas r ON r.id = ri.receta_id
          WHERE ri.receta_id = (v_articulo->>'receta_id')::UUID
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
      v_cantidad_total_consumida := v_ingrediente.cantidad_uso * (v_articulo->>'cantidad')::INTEGER;
      
      v_factor := COALESCE(v_ingrediente.factor_conversion, 1);
      IF v_factor = 0 THEN v_factor := 1; END IF;
      v_rendi := COALESCE(v_ingrediente.porcentaje_rendimiento, 100);
      IF v_rendi = 0 THEN v_rendi := 100; END IF;

      v_costo_ingrediente := (COALESCE(v_ingrediente.costo_unidad_compra, 0) / v_factor / (v_rendi / 100)) * v_cantidad_total_consumida;
      
      IF v_rec_costo_total > 0 THEN
         -- FIX: Calculamos la proporcion matematicamente correcta evitando la doble multiplicacion por la cantidad vendida.
         v_ingreso_proporcional := (v_costo_ingrediente / v_rec_costo_total) * v_precio_venta;
      ELSE
         v_ingreso_proporcional := 0;
      END IF;

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
         -- Insertamos un lote compensatorio negativo si consumimos más de lo que teníamos en lotes (inventario en negativo)
         INSERT INTO lotes_insumo (insumo_id, restaurante_id, cantidad_inicial, cantidad_actual, fecha_caducidad)
         VALUES (v_ingrediente.insumo_id, p_restaurante_id, 0, -v_cantidad_restante, NULL);
      END IF;

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
        'Consumido en ' || (v_articulo->>'cantidad') || 'x ' || v_receta_nombre || ' (incluye subrecetas)'
      );
    END LOOP;
  END LOOP;

  UPDATE ventas SET total = v_total WHERE id = v_venta_id;

  IF p_caja_id IS NOT NULL THEN
    INSERT INTO movimientos_caja (caja_id, tipo, monto, concepto, metodo_pago, referencia_id)
    VALUES (p_caja_id, 'ingreso', v_total, 'Venta en mostrador', p_metodo_pago, v_venta_id);
  END IF;

  RETURN v_venta_id;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error al registrar la venta: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
