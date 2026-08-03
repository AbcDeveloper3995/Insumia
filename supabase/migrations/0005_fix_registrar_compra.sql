-- 5. NUEVO RPC: registrar_compra (ACTUALIZADO para usar factor_conversion)
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
    
    -- Insertar en compra_detalles
    INSERT INTO compra_detalles (compra_id, insumo_id, cantidad, precio_unitario)
    VALUES (v_compra_id, v_insumo_id, v_cantidad, v_precio_unitario);
    
    v_total := v_total + (v_cantidad * v_precio_unitario);

    -- Obtener factor de conversión del insumo
    SELECT factor_conversion INTO v_factor_conversion FROM insumos WHERE id = v_insumo_id;

    -- Si por alguna razón no se encuentra, asumir 1
    IF v_factor_conversion IS NULL THEN
        v_factor_conversion := 1;
    END IF;

    -- 3. Aumentar inventario de insumos
    UPDATE insumos 
    SET cantidad_actual_base = cantidad_actual_base + (v_cantidad * v_factor_conversion),
        costo_unidad_compra = v_precio_unitario
    WHERE id = v_insumo_id;
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
$$ LANGUAGE plpgsql;
