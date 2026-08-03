-- 1. TABLAS PARA CONTROL DE CAJA
CREATE TABLE cajas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('abierta', 'cerrada')),
    fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    monto_inicial NUMERIC(10, 2) NOT NULL DEFAULT 0,
    monto_final_esperado NUMERIC(10, 2),
    monto_final_real NUMERIC(10, 2),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE movimientos_caja (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caja_id UUID REFERENCES cajas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    monto NUMERIC(10, 2) NOT NULL,
    concepto TEXT NOT NULL,
    metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'otro')),
    referencia_id UUID, -- Puede ser venta_id o compra_id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLAS PARA COMPRAS Y PROVEEDORES
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID NOT NULL,
    nombre TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE compras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID NOT NULL,
    proveedor_id UUID REFERENCES proveedores(id),
    total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    estado TEXT NOT NULL CHECK (estado IN ('pagada', 'pendiente')),
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE compra_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    compra_id UUID REFERENCES compras(id) ON DELETE CASCADE,
    insumo_id UUID NOT NULL,
    cantidad NUMERIC(10, 2) NOT NULL,
    precio_unitario NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. POLÍTICAS DE SEGURIDAD (Habilitar RLS)
ALTER TABLE cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE compra_detalles ENABLE ROW LEVEL SECURITY;

-- Asumiendo acceso público anónimo para el MVP (igual que las demás tablas)
CREATE POLICY "Public access to cajas" ON cajas FOR ALL USING (true);
CREATE POLICY "Public access to movimientos_caja" ON movimientos_caja FOR ALL USING (true);
CREATE POLICY "Public access to proveedores" ON proveedores FOR ALL USING (true);
CREATE POLICY "Public access to compras" ON compras FOR ALL USING (true);
CREATE POLICY "Public access to compra_detalles" ON compra_detalles FOR ALL USING (true);

-- 4. ACTUALIZAR RPC registrar_venta PARA INCLUIR CAJA Y METODO DE PAGO
CREATE OR REPLACE FUNCTION registrar_venta(
  p_restaurante_id UUID,
  p_detalles JSONB,
  p_caja_id UUID DEFAULT NULL,
  p_metodo_pago TEXT DEFAULT 'efectivo'
) RETURNS UUID AS $$
DECLARE
  v_venta_id UUID;
  v_total NUMERIC := 0;
  v_detalle JSONB;
  v_receta_id UUID;
  v_cantidad INTEGER;
  v_precio NUMERIC;
  
  v_insumo_receta RECORD;
  v_cantidad_descontar NUMERIC;
BEGIN
  -- Insertar la cabecera de la venta
  INSERT INTO ventas (restaurante_id, total, created_at)
  VALUES (p_restaurante_id, 0, NOW())
  RETURNING id INTO v_venta_id;

  -- Procesar los detalles
  FOR v_detalle IN SELECT * FROM jsonb_array_elements(p_detalles)
  LOOP
    v_receta_id := (v_detalle->>'receta_id')::UUID;
    v_cantidad := (v_detalle->>'cantidad')::INTEGER;
    
    -- Obtener precio de la receta
    SELECT precio_venta INTO v_precio FROM recetas WHERE id = v_receta_id;
    
    -- Insertar en venta_detalles
    INSERT INTO venta_detalles (venta_id, receta_id, cantidad, precio_unitario)
    VALUES (v_venta_id, v_receta_id, v_cantidad, v_precio);
    
    v_total := v_total + (v_precio * v_cantidad);

    -- Descontar inventario
    FOR v_insumo_receta IN 
        SELECT insumo_id, cantidad 
        FROM receta_insumos 
        WHERE receta_id = v_receta_id
    LOOP
        v_cantidad_descontar := v_insumo_receta.cantidad * v_cantidad;
        UPDATE insumos 
        SET cantidad_actual_base = cantidad_actual_base - v_cantidad_descontar
        WHERE id = v_insumo_receta.insumo_id;
    END LOOP;
  END LOOP;

  -- Actualizar el total de la venta
  UPDATE ventas SET total = v_total WHERE id = v_venta_id;

  -- Si se proporcionó un ID de caja, registrar el ingreso
  IF p_caja_id IS NOT NULL THEN
    INSERT INTO movimientos_caja (caja_id, tipo, monto, concepto, metodo_pago, referencia_id)
    VALUES (p_caja_id, 'ingreso', v_total, 'Venta en POS', p_metodo_pago, v_venta_id);
  END IF;

  RETURN v_venta_id;
END;
$$ LANGUAGE plpgsql;

-- 5. NUEVO RPC: registrar_compra
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

    -- 3. Aumentar inventario de insumos
    UPDATE insumos 
    SET cantidad_actual_base = cantidad_actual_base + v_cantidad,
        ultimo_costo_base = v_precio_unitario -- Opcional: Actualizar el último costo
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
