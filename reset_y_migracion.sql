-- =========================================================================================
-- SCRIPT DE REINICIO Y MIGRACIÓN MULTI-INQUILINO (MULTI-TENANT)
-- ¡ADVERTENCIA: ESTE SCRIPT BORRARÁ TODAS LAS TABLAS Y DATOS ACTUALES!
-- Ejecutar en el SQL Editor de Supabase
-- =========================================================================================

-- 0. Limpiar esquema público
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. CREACIÓN DE TABLAS
-- ==========================================

-- Tabla: restaurantes
CREATE TABLE restaurantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    telefono TEXT NOT NULL
);

-- Tabla: usuario_restaurantes (Relación N:M)
CREATE TABLE usuario_restaurantes (
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    rol TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (usuario_id, restaurante_id)
);

-- Tabla: proveedores
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: cajas
CREATE TABLE cajas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
    estado TEXT NOT NULL CHECK (estado IN ('abierta', 'cerrada')),
    fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    monto_inicial NUMERIC(10, 2) NOT NULL DEFAULT 0,
    monto_final_esperado NUMERIC(10, 2),
    monto_final_real NUMERIC(10, 2),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: compras
CREATE TABLE compras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
    proveedor_id UUID REFERENCES proveedores(id),
    total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    estado TEXT NOT NULL CHECK (estado IN ('pagada', 'pendiente')),
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: insumos
CREATE TABLE insumos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    unidad_base TEXT NOT NULL,
    unidad_compra TEXT NOT NULL,
    factor_conversion NUMERIC NOT NULL,
    costo_unidad_compra NUMERIC NOT NULL,
    porcentaje_rendimiento NUMERIC NOT NULL DEFAULT 100,
    cantidad_actual_base NUMERIC NOT NULL DEFAULT 0,
    umbral_minimo NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: compra_detalles
CREATE TABLE compra_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    compra_id UUID REFERENCES compras(id) ON DELETE CASCADE,
    insumo_id UUID NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
    cantidad NUMERIC(10, 2) NOT NULL,
    precio_unitario NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: recetas
CREATE TABLE recetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio_venta NUMERIC,
    es_subreceta BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: receta_ingredientes
CREATE TABLE receta_ingredientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receta_id UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
    insumo_id UUID REFERENCES insumos(id) ON DELETE CASCADE,
    subreceta_id UUID REFERENCES recetas(id) ON DELETE CASCADE,
    cantidad NUMERIC NOT NULL,
    CONSTRAINT chk_ingrediente CHECK (
        (insumo_id IS NOT NULL AND subreceta_id IS NULL) OR 
        (insumo_id IS NULL AND subreceta_id IS NOT NULL)
    )
);

-- Tabla: ventas
CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
    estado TEXT NOT NULL DEFAULT 'completada',
    total NUMERIC DEFAULT 0,
    metodo_pago TEXT DEFAULT 'efectivo',
    caja_id UUID REFERENCES cajas(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: venta_detalles
CREATE TABLE venta_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    receta_id UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL
);

-- Tabla: movimientos_caja
CREATE TABLE movimientos_caja (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caja_id UUID REFERENCES cajas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    monto NUMERIC(10, 2) NOT NULL,
    concepto TEXT NOT NULL,
    metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'otro')),
    referencia_id UUID, -- venta_id o compra_id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: insumo_movimientos (Kardex)
CREATE TABLE insumo_movimientos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insumo_id UUID NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('compra', 'venta', 'ajuste', 'merma')),
  cantidad NUMERIC NOT NULL,
  costo_movimiento NUMERIC NOT NULL DEFAULT 0,
  ingreso_generado NUMERIC DEFAULT 0,
  referencia_id UUID,
  notas TEXT, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. FUNCIONES Y PROCEDIMIENTOS ALMACENADOS
-- ==========================================

-- Función de ayuda para obtener los restaurantes del usuario autenticado
CREATE OR REPLACE FUNCTION public.obtener_restaurantes_del_usuario() 
RETURNS SETOF UUID AS $$
  SELECT restaurante_id FROM public.usuario_restaurantes WHERE usuario_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Función RPC para completar perfil de usuario tras registro
CREATE OR REPLACE FUNCTION public.completar_perfil_usuario(
    p_nombre TEXT,
    p_apellidos TEXT,
    p_telefono TEXT
)
RETURNS JSON AS $$
DECLARE
    v_usuario_id UUID;
BEGIN
    v_usuario_id := auth.uid();
    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    INSERT INTO public.usuarios (id, nombre, apellidos, telefono)
    VALUES (v_usuario_id, p_nombre, p_apellidos, p_telefono)
    ON CONFLICT (id) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        apellidos = EXCLUDED.apellidos,
        telefono = EXCLUDED.telefono;

    RETURN json_build_object('success', true, 'usuario_id', v_usuario_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función RPC para Crear un Restaurante
CREATE OR REPLACE FUNCTION public.crear_restaurante(
    p_nombre_restaurante TEXT
)
RETURNS JSON AS $$
DECLARE
    v_restaurante_id UUID;
    v_usuario_id UUID;
BEGIN
    v_usuario_id := auth.uid();

    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    INSERT INTO public.restaurantes (nombre)
    VALUES (p_nombre_restaurante)
    RETURNING id INTO v_restaurante_id;

    INSERT INTO public.usuario_restaurantes (usuario_id, restaurante_id, rol)
    VALUES (v_usuario_id, v_restaurante_id, 'admin');

    RETURN json_build_object(
        'success', true,
        'restaurante_id', v_restaurante_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar venta
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

    SELECT COALESCE(SUM(
      (COALESCE(i.costo_unidad_compra, 0) / GREATEST(COALESCE(i.factor_conversion, 1), 1) / (GREATEST(COALESCE(i.porcentaje_rendimiento, 100), 1) / 100.0)) * ri.cantidad
    ), 0)
    INTO v_rec_costo_total
    FROM receta_ingredientes ri
    JOIN insumos i ON ri.insumo_id = i.id
    WHERE ri.receta_id = (v_articulo->>'receta_id')::UUID;

    INSERT INTO venta_detalles (venta_id, receta_id, cantidad)
    VALUES (
      v_venta_id, 
      (v_articulo->>'receta_id')::UUID, 
      (v_articulo->>'cantidad')::INTEGER
    );

    v_total := v_total + ((v_articulo->>'cantidad')::INTEGER * v_precio_venta);

    FOR v_ingrediente IN 
      SELECT i.id as insumo_id, ri.cantidad as cantidad_uso, i.costo_unidad_compra, i.factor_conversion, i.porcentaje_rendimiento 
      FROM receta_ingredientes ri
      JOIN insumos i ON ri.insumo_id = i.id
      WHERE ri.receta_id = (v_articulo->>'receta_id')::UUID
    LOOP
      v_cantidad_total_consumida := v_ingrediente.cantidad_uso * (v_articulo->>'cantidad')::INTEGER;
      
      v_factor := COALESCE(v_ingrediente.factor_conversion, 1);
      IF v_factor = 0 THEN v_factor := 1; END IF;
      v_rendi := COALESCE(v_ingrediente.porcentaje_rendimiento, 100);
      IF v_rendi = 0 THEN v_rendi := 100; END IF;

      v_costo_ingrediente := (COALESCE(v_ingrediente.costo_unidad_compra, 0) / v_factor / (v_rendi / 100)) * v_cantidad_total_consumida;
      
      IF v_rec_costo_total > 0 THEN
         v_ingreso_proporcional := (v_costo_ingrediente / v_rec_costo_total) * (v_precio_venta * (v_articulo->>'cantidad')::INTEGER);
      ELSE
         v_ingreso_proporcional := 0;
      END IF;

      UPDATE insumos
      SET cantidad_actual_base = cantidad_actual_base - v_cantidad_total_consumida
      WHERE id = v_ingrediente.insumo_id AND restaurante_id = p_restaurante_id;
      
      INSERT INTO insumo_movimientos (insumo_id, restaurante_id, tipo, cantidad, costo_movimiento, ingreso_generado, referencia_id, notas)
      VALUES (
        v_ingrediente.insumo_id, p_restaurante_id, 'venta', -v_cantidad_total_consumida, 
        v_costo_ingrediente, v_ingreso_proporcional, v_venta_id, 
        'Consumido en ' || (v_articulo->>'cantidad') || 'x ' || v_receta_nombre
      );

    END LOOP;
  END LOOP;

  UPDATE ventas SET total = v_total WHERE id = v_venta_id;

  IF p_caja_id IS NOT NULL THEN
    INSERT INTO movimientos_caja (caja_id, tipo, monto, concepto, metodo_pago, referencia_id)
    VALUES (p_caja_id, 'ingreso', v_total, 'Venta en mostrador', p_metodo_pago, v_venta_id);
  END IF;

  RETURN v_venta_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Función para registrar compra
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
  INSERT INTO compras (restaurante_id, proveedor_id, estado, total, fecha)
  VALUES (p_restaurante_id, p_proveedor_id, p_estado, 0, NOW())
  RETURNING id INTO v_compra_id;

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

    UPDATE insumos 
    SET cantidad_actual_base = cantidad_actual_base + (v_cantidad * v_factor_conversion),
        costo_unidad_compra = v_precio_unitario
    WHERE id = v_insumo_id;

    INSERT INTO insumo_movimientos (insumo_id, restaurante_id, tipo, cantidad, costo_movimiento, ingreso_generado, referencia_id, notas)
    VALUES (
        v_insumo_id, p_restaurante_id, 'compra', (v_cantidad * v_factor_conversion), 
        (v_cantidad * v_precio_unitario), 0, v_compra_id, 'Compra de Insumos (' || v_cantidad || ' unid.)'
    );
  END LOOP;

  UPDATE compras SET total = v_total WHERE id = v_compra_id;

  IF p_estado = 'pagada' AND p_caja_id IS NOT NULL THEN
    INSERT INTO movimientos_caja (caja_id, tipo, monto, concepto, metodo_pago, referencia_id)
    VALUES (p_caja_id, 'egreso', v_total, 'Pago a proveedor', 'efectivo', v_compra_id);
  END IF;

  RETURN v_compra_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE restaurantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_restaurantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE compra_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE receta_ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumo_movimientos ENABLE ROW LEVEL SECURITY;

-- Políticas para restaurantes (Un usuario solo ve los restaurantes a los que pertenece)
CREATE POLICY "Restaurantes visibles por sus usuarios" ON restaurantes
    FOR ALL USING (id IN (SELECT public.obtener_restaurantes_del_usuario()));

-- Políticas para usuarios (Un usuario se ve a sí mismo, y a otros de sus restaurantes)
CREATE POLICY "Usuarios del mismo restaurante o sí mismo" ON usuarios
    FOR ALL USING (
        id = auth.uid() OR
        id IN (
            SELECT usuario_id FROM usuario_restaurantes 
            WHERE restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario())
        )
    );

-- Políticas para usuario_restaurantes
CREATE POLICY "Usuario_restaurantes visibles" ON usuario_restaurantes
    FOR ALL USING (
        usuario_id = auth.uid() OR
        restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario())
    );

-- Políticas genéricas para las tablas que dependen de restaurante_id
CREATE POLICY "Datos restaurante proveedores" ON proveedores FOR ALL USING (restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario()));
CREATE POLICY "Datos restaurante cajas" ON cajas FOR ALL USING (restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario()));
CREATE POLICY "Datos restaurante compras" ON compras FOR ALL USING (restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario()));
CREATE POLICY "Datos restaurante insumos" ON insumos FOR ALL USING (restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario()));
CREATE POLICY "Datos restaurante recetas" ON recetas FOR ALL USING (restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario()));
CREATE POLICY "Datos restaurante ventas" ON ventas FOR ALL USING (restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario()));
CREATE POLICY "Datos restaurante Kardex" ON insumo_movimientos FOR ALL USING (restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario()));

-- Políticas para tablas hijas (detalles, movimientos)
CREATE POLICY "Datos detalles_compra" ON compra_detalles FOR ALL USING (
    EXISTS (SELECT 1 FROM compras WHERE compras.id = compra_detalles.compra_id AND compras.restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario()))
);

CREATE POLICY "Datos receta_ingredientes" ON receta_ingredientes FOR ALL USING (
    EXISTS (SELECT 1 FROM recetas WHERE recetas.id = receta_ingredientes.receta_id AND recetas.restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario()))
);

CREATE POLICY "Datos venta_detalles" ON venta_detalles FOR ALL USING (
    EXISTS (SELECT 1 FROM ventas WHERE ventas.id = venta_detalles.venta_id AND ventas.restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario()))
);

CREATE POLICY "Datos movimientos_caja" ON movimientos_caja FOR ALL USING (
    EXISTS (SELECT 1 FROM cajas WHERE cajas.id = movimientos_caja.caja_id AND cajas.restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario()))
);
