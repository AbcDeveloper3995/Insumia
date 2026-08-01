-- ==============================================================================
-- Función: registrar_venta
-- Propósito: Registra una venta, sus detalles y descuenta el inventario atómicamente.
-- ==============================================================================

CREATE OR REPLACE FUNCTION registrar_venta(
  p_restaurante_id UUID,
  p_articulos JSONB -- Arreglo de { receta_id: UUID, cantidad: INTEGER }
) RETURNS UUID AS $$
DECLARE
  v_venta_id UUID;
  v_articulo JSONB;
  v_ingrediente RECORD;
BEGIN
  -- 1. Insertar la cabecera de la venta
  INSERT INTO ventas (restaurante_id, estado)
  VALUES (p_restaurante_id, 'completada')
  RETURNING id INTO v_venta_id;

  -- 2. Iterar sobre los artículos vendidos (recetas)
  FOR v_articulo IN SELECT * FROM jsonb_array_elements(p_articulos)
  LOOP
    -- A. Insertar el detalle de la venta
    INSERT INTO venta_detalles (venta_id, receta_id, cantidad)
    VALUES (
      v_venta_id, 
      (v_articulo->>'receta_id')::UUID, 
      (v_articulo->>'cantidad')::INTEGER
    );

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

  RETURN v_venta_id;
EXCEPTION WHEN OTHERS THEN
  -- Si algo falla, se hace un rollback automático de toda la transacción
  RAISE EXCEPTION 'Error al registrar la venta: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
