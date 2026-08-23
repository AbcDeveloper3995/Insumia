-- 1. Añadir la columna fuente_pago a la tabla compras
ALTER TABLE compras ADD COLUMN IF NOT EXISTS fuente_pago TEXT DEFAULT 'pendiente' CHECK (fuente_pago IN ('pendiente', 'caja', 'banco'));

-- 2. Actualizar el RPC registrar_compra para aceptar p_fuente_pago y mantener Lotes y Kardex
CREATE OR REPLACE FUNCTION registrar_compra(
  p_restaurante_id UUID,
  p_proveedor_id UUID,
  p_estado TEXT,
  p_detalles JSONB,
  p_caja_id UUID DEFAULT NULL,
  p_fuente_pago TEXT DEFAULT 'pendiente'
) RETURNS UUID AS $$
DECLARE
  v_compra_id UUID;
  v_total NUMERIC := 0;
  v_detalle JSONB;
  v_insumo_id UUID;
  v_cantidad NUMERIC;
  v_precio_unitario NUMERIC;
  v_factor_conversion NUMERIC;
  v_fecha_cad_str TEXT;
  v_fecha_caducidad DATE;
  v_cantidad_base NUMERIC;
BEGIN
  -- 1. Insertar la cabecera de la compra
  INSERT INTO compras (restaurante_id, proveedor_id, estado, total, fecha, fuente_pago)
  VALUES (p_restaurante_id, p_proveedor_id, p_estado, 0, NOW(), p_fuente_pago)
  RETURNING id INTO v_compra_id;

  -- 2. Procesar detalles
  FOR v_detalle IN SELECT * FROM jsonb_array_elements(p_detalles)
  LOOP
    v_insumo_id := (v_detalle->>'insumo_id')::UUID;
    v_cantidad := (v_detalle->>'cantidad')::NUMERIC;
    v_precio_unitario := (v_detalle->>'precio_unitario')::NUMERIC;
    v_fecha_cad_str := v_detalle->>'fecha_caducidad';
    
    IF v_fecha_cad_str IS NOT NULL AND v_fecha_cad_str != '' THEN
        v_fecha_caducidad := v_fecha_cad_str::DATE;
    ELSE
        v_fecha_caducidad := NULL;
    END IF;
    
    -- Insertar en compra_detalles
    INSERT INTO compra_detalles (compra_id, insumo_id, cantidad, precio_unitario)
    VALUES (v_compra_id, v_insumo_id, v_cantidad, v_precio_unitario);
    
    v_total := v_total + (v_cantidad * v_precio_unitario);

    -- Obtener factor de conversión del insumo
    SELECT factor_conversion INTO v_factor_conversion FROM insumos WHERE id = v_insumo_id;
    IF v_factor_conversion IS NULL OR v_factor_conversion = 0 THEN
        v_factor_conversion := 1;
    END IF;

    v_cantidad_base := v_cantidad * v_factor_conversion;

    -- 3. Aumentar inventario de insumos
    UPDATE insumos 
    SET cantidad_actual_base = cantidad_actual_base + v_cantidad_base,
        costo_unidad_compra = v_precio_unitario
    WHERE id = v_insumo_id;

    -- 4. Crear Lote
    INSERT INTO lotes_insumo (insumo_id, restaurante_id, cantidad_inicial, cantidad_actual, fecha_caducidad, compra_id)
    VALUES (v_insumo_id, p_restaurante_id, v_cantidad_base, v_cantidad_base, v_fecha_caducidad, v_compra_id);

    -- 5. Registrar en Kardex
    INSERT INTO insumo_movimientos (insumo_id, restaurante_id, tipo, cantidad, costo_movimiento, ingreso_generado, referencia_id, notas)
    VALUES (
        v_insumo_id, 
        p_restaurante_id, 
        'compra', 
        v_cantidad_base, 
        (v_cantidad * v_precio_unitario), 
        0, 
        v_compra_id, 
        'Compra de Insumos (' || v_cantidad || ' unid.)'
    );
  END LOOP;

  -- 6. Actualizar total de compra
  UPDATE compras SET total = v_total WHERE id = v_compra_id;

  -- 7. Si estado es 'pagada' y la fuente es 'caja', registrar egreso en movimientos_caja
  IF p_estado = 'pagada' AND p_fuente_pago = 'caja' AND p_caja_id IS NOT NULL THEN
    INSERT INTO movimientos_caja (caja_id, tipo, monto, concepto, metodo_pago, referencia_id)
    VALUES (p_caja_id, 'egreso', v_total, 'Pago a proveedor', 'efectivo', v_compra_id);
  END IF;
  
  RETURN v_compra_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
