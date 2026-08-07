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
    nombre TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    telefono TEXT NOT NULL
);

-- 3. Tabla: usuario_restaurantes (Relación N:M)
CREATE TABLE usuario_restaurantes (
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    rol TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (usuario_id, restaurante_id)
);

-- 4. Tabla: insumos
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

-- 5. Tabla: recetas
CREATE TABLE recetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio_venta NUMERIC,
    es_subreceta BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabla: receta_ingredientes
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

-- 7. Tabla: ventas
CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
    estado TEXT NOT NULL DEFAULT 'tomada',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabla: venta_detalles
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
ALTER TABLE usuario_restaurantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE receta_ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_detalles ENABLE ROW LEVEL SECURITY;

-- Función de ayuda para obtener los restaurantes del usuario autenticado
CREATE OR REPLACE FUNCTION public.obtener_restaurantes_del_usuario() 
RETURNS SETOF UUID AS $$
  SELECT restaurante_id FROM public.usuario_restaurantes WHERE usuario_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

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

-- Políticas para insumos
CREATE POLICY "Insumos del mismo restaurante" ON insumos
    FOR ALL USING (restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario()));

-- Políticas para recetas
CREATE POLICY "Recetas del mismo restaurante" ON recetas
    FOR ALL USING (restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario()));

-- Políticas para receta_ingredientes (A través de la receta)
CREATE POLICY "Ingredientes del mismo restaurante" ON receta_ingredientes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM recetas 
            WHERE recetas.id = receta_ingredientes.receta_id 
            AND recetas.restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario())
        )
    );

-- Políticas para ventas
CREATE POLICY "Ventas del mismo restaurante" ON ventas
    FOR ALL USING (restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario()));

-- Políticas para venta_detalles (A través de ventas)
CREATE POLICY "Detalles de venta del mismo restaurante" ON venta_detalles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ventas 
            WHERE ventas.id = venta_detalles.venta_id 
            AND ventas.restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario())
        )
    );
