-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla: restaurantes
CREATE TABLE restaurantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla: usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'admin'
);

-- 3. Tabla: insumos
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

-- 4. Tabla: recetas
CREATE TABLE recetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio_venta NUMERIC,
    es_subreceta BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla: receta_ingredientes
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

-- 6. Tabla: ventas
CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
    estado TEXT NOT NULL DEFAULT 'tomada',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabla: venta_detalles
CREATE TABLE venta_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    receta_id UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE restaurantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE receta_ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_detalles ENABLE ROW LEVEL SECURITY;

-- Función de ayuda para obtener el restaurante del usuario autenticado
CREATE OR REPLACE FUNCTION public.obtener_restaurante_id() 
RETURNS UUID AS $$
  SELECT restaurante_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Políticas para restaurantes (Un usuario solo ve su propio restaurante)
CREATE POLICY "Restaurantes visibles por sus usuarios" ON restaurantes
    FOR SELECT USING (id = public.obtener_restaurante_id());

-- Políticas para usuarios (Ven usuarios de su mismo restaurante)
CREATE POLICY "Usuarios del mismo restaurante" ON usuarios
    FOR ALL USING (restaurante_id = public.obtener_restaurante_id());

-- Políticas para insumos
CREATE POLICY "Insumos del mismo restaurante" ON insumos
    FOR ALL USING (restaurante_id = public.obtener_restaurante_id());

-- Políticas para recetas
CREATE POLICY "Recetas del mismo restaurante" ON recetas
    FOR ALL USING (restaurante_id = public.obtener_restaurante_id());

-- Políticas para receta_ingredientes (A través de la receta)
CREATE POLICY "Ingredientes del mismo restaurante" ON receta_ingredientes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM recetas 
            WHERE recetas.id = receta_ingredientes.receta_id 
            AND recetas.restaurante_id = public.obtener_restaurante_id()
        )
    );

-- Políticas para ventas
CREATE POLICY "Ventas del mismo restaurante" ON ventas
    FOR ALL USING (restaurante_id = public.obtener_restaurante_id());

-- Políticas para venta_detalles (A través de ventas)
CREATE POLICY "Detalles de venta del mismo restaurante" ON venta_detalles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ventas 
            WHERE ventas.id = venta_detalles.venta_id 
            AND ventas.restaurante_id = public.obtener_restaurante_id()
        )
    );
