-- 0015_validar_stock_venta.sql
-- Asegurar que registrar_venta valide el stock disponible de la receta antes de procesar

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
  v_receta RECORD;
BEGIN
  INSERT INTO ventas (restaurante_id, estado, metodo_pago, caja_id, total)
  VALUES (p_restaurante_id, 'completada', p_metodo_pago, p_caja_id, 0)
  RETURNING id INTO v_venta_id;

  FOR v_articulo IN SELECT * FROM jsonb_array_elements(p_detalles)
  LOOP
    SELECT id, nombre, precio_venta, stock_actual 
    INTO v_receta 
    FROM recetas 
    WHERE id = (v_articulo->>'receta_id')::UUID AND restaurante_id = p_restaurante_id;
    
    IF v_receta.id IS NULL THEN
      RAISE EXCEPTION 'Receta no encontrada';
    END IF;

    IF v_receta.precio_venta IS NULL THEN 
      v_receta.precio_venta := 0; 
    END IF;

    -- Validar que haya suficiente stock preparado
    IF COALESCE(v_receta.stock_actual, 0) < (v_articulo->>'cantidad')::INTEGER THEN
      RAISE EXCEPTION 'Stock insuficiente para el platillo % (solicitado: %, disponible: %)', 
                      v_receta.nombre, 
                      (v_articulo->>'cantidad')::INTEGER, 
                      COALESCE(v_receta.stock_actual, 0);
    END IF;

    -- Registrar el detalle de la venta
    INSERT INTO venta_detalles (venta_id, receta_id, cantidad)
    VALUES (
      v_venta_id, 
      v_receta.id, 
      (v_articulo->>'cantidad')::INTEGER
    );

    v_total := v_total + ((v_articulo->>'cantidad')::INTEGER * v_receta.precio_venta);

    -- Descontar directamente del stock de la receta
    UPDATE recetas
    SET stock_actual = stock_actual - (v_articulo->>'cantidad')::INTEGER
    WHERE id = v_receta.id;
    
  END LOOP;

  UPDATE ventas SET total = v_total WHERE id = v_venta_id;

  IF p_caja_id IS NOT NULL THEN
    INSERT INTO movimientos_caja (caja_id, tipo, monto, concepto, metodo_pago, referencia_id)
    VALUES (p_caja_id, 'ingreso', v_total, 'Venta en mostrador', p_metodo_pago, v_venta_id);
  END IF;

  RETURN v_venta_id;
EXCEPTION 
  WHEN RAISE_EXCEPTION THEN
    RAISE; -- Re-lanzar la excepción controlada de stock
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al registrar la venta: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
