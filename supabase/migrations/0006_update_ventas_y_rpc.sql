-- 1. Agregar las columnas faltantes a la tabla ventas
ALTER TABLE ventas 
ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS metodo_pago TEXT DEFAULT 'efectivo',
ADD COLUMN IF NOT EXISTS caja_id UUID REFERENCES cajas(id) ON DELETE SET NULL;

-- 2. Actualizar la función registrar_venta para que calcule el total y lo guarde
CREATE OR REPLACE FUNCTION registrar_venta(
  p_restaurante_id UUID,
  p_detalles JSONB, -- Arreglo de { receta_id: UUID, cantidad: INTEGER }
  p_caja_id UUID DEFAULT NULL,
  p_metodo_pago TEXT DEFAULT 'efectivo'
) RETURNS UUID AS $$
DECLARE
  v_venta_id UUID;
  v_total NUMERIC := 0;
  v_articulo JSONB;
  v_ingrediente RECORD;
  v_precio_venta NUMERIC;
BEGIN
  -- 1. Insertar la cabecera de la venta (sin total aún, o con 0)
  INSERT INTO ventas (restaurante_id, estado, metodo_pago, caja_id, total)
  VALUES (p_restaurante_id, 'completada', p_metodo_pago, p_caja_id, 0)
  RETURNING id INTO v_venta_id;

  -- 2. Iterar sobre los artículos vendidos (recetas)
  FOR v_articulo IN SELECT * FROM jsonb_array_elements(p_detalles)
  LOOP
    -- Obtener precio de la receta
    SELECT precio_venta INTO v_precio_venta FROM recetas WHERE id = (v_articulo->>'receta_id')::UUID;
    IF v_precio_venta IS NULL THEN v_precio_venta := 0; END IF;

    -- A. Insertar el detalle de la venta
    INSERT INTO venta_detalles (venta_id, receta_id, cantidad)
    VALUES (
      v_venta_id, 
      (v_articulo->>'receta_id')::UUID, 
      (v_articulo->>'cantidad')::INTEGER
    );

    v_total := v_total + ((v_articulo->>'cantidad')::INTEGER * v_precio_venta);

    -- B. Descontar ingredientes del inventario base
    -- Para cada insumo en la receta, restar (cantidad de receta * cantidad vendida)
    FOR v_ingrediente IN 
      SELECT insumo_id, cantidad 
      FROM receta_ingredientes 
      WHERE receta_id = (v_articulo->>'receta_id')::UUID
    LOOP
      UPDATE insumos
      SET cantidad_actual_base = cantidad_actual_base - (v_ingrediente.cantidad * (v_articulo->>'cantidad')::INTEGER)
      WHERE id = v_ingrediente.insumo_id 
        AND restaurante_id = p_restaurante_id;
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
  -- Si algo falla, se hace un rollback automático de toda la transacción
  RAISE EXCEPTION 'Error al registrar la venta: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
