-- Migración 0014: Modelo de Inventario "Descuento al Preparar"

-- 1. Añadir stock a las recetas
ALTER TABLE recetas 
ADD COLUMN IF NOT EXISTS stock_actual NUMERIC NOT NULL DEFAULT 0;

-- 2. Crear RPC para Preparar Receta
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
        'ajuste', -- Se usa ajuste o se podría crear 'consumo_produccion' pero 'ajuste' es seguro por ahora
        -v_cantidad_consumida, 
        v_costo_ingrediente, 
        'Consumido en preparación de ' || p_cantidad || 'x ' || v_receta.nombre
      );

    ELSIF v_ingrediente.subreceta_id IS NOT NULL THEN
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


-- 3. Modificar registrar_venta para que descuente de recetas.stock_actual
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
  v_precio_venta NUMERIC;
  v_rec_costo_total NUMERIC;
BEGIN
  INSERT INTO ventas (restaurante_id, estado, metodo_pago, caja_id, total)
  VALUES (p_restaurante_id, 'completada', p_metodo_pago, p_caja_id, 0)
  RETURNING id INTO v_venta_id;

  FOR v_articulo IN SELECT * FROM jsonb_array_elements(p_detalles)
  LOOP
    SELECT precio_venta 
    INTO v_precio_venta 
    FROM recetas 
    WHERE id = (v_articulo->>'receta_id')::UUID;
    
    IF v_precio_venta IS NULL THEN v_precio_venta := 0; END IF;

    -- Registrar el detalle de la venta
    INSERT INTO venta_detalles (venta_id, receta_id, cantidad)
    VALUES (
      v_venta_id, 
      (v_articulo->>'receta_id')::UUID, 
      (v_articulo->>'cantidad')::INTEGER
    );

    v_total := v_total + ((v_articulo->>'cantidad')::INTEGER * v_precio_venta);

    -- NUEVO MODELO: Descontar directamente del stock de la receta
    UPDATE recetas
    SET stock_actual = stock_actual - (v_articulo->>'cantidad')::INTEGER
    WHERE id = (v_articulo->>'receta_id')::UUID AND restaurante_id = p_restaurante_id;
    
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
