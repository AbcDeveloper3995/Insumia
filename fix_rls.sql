-- =========================================================================================
-- SCRIPT PARA REPARAR POLÍTICAS DE SEGURIDAD (RLS)
-- Ejecutar en el SQL Editor de Supabase
-- =========================================================================================

-- 1. Modificar la función para que retorne un Arreglo de UUIDs (más compatible con RLS)
DROP FUNCTION IF EXISTS public.obtener_restaurantes_del_usuario() CASCADE;
CREATE OR REPLACE FUNCTION public.obtener_restaurantes_del_usuario() 
RETURNS UUID[] AS $$
  SELECT array_agg(restaurante_id) FROM public.usuario_restaurantes WHERE usuario_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Reemplazar todas las políticas para usar = ANY() en lugar de IN ()

-- Restaurantes
DROP POLICY IF EXISTS "Restaurantes visibles por sus usuarios" ON restaurantes;
CREATE POLICY "Restaurantes visibles por sus usuarios" ON restaurantes
    FOR ALL USING (id = ANY (public.obtener_restaurantes_del_usuario()));

-- Usuarios
DROP POLICY IF EXISTS "Usuarios del mismo restaurante o sí mismo" ON usuarios;
CREATE POLICY "Usuarios del mismo restaurante o sí mismo" ON usuarios
    FOR ALL USING (
        id = auth.uid() OR
        id IN (
            SELECT usuario_id FROM usuario_restaurantes 
            WHERE restaurante_id = ANY (public.obtener_restaurantes_del_usuario())
        )
    );

-- Usuario_restaurantes
DROP POLICY IF EXISTS "Usuario_restaurantes visibles" ON usuario_restaurantes;
CREATE POLICY "Usuario_restaurantes visibles" ON usuario_restaurantes
    FOR ALL USING (
        usuario_id = auth.uid() OR
        restaurante_id = ANY (public.obtener_restaurantes_del_usuario())
    );

-- Proveedores
DROP POLICY IF EXISTS "Datos restaurante proveedores" ON proveedores;
CREATE POLICY "Datos restaurante proveedores" ON proveedores 
    FOR ALL USING (restaurante_id = ANY (public.obtener_restaurantes_del_usuario()));

-- Cajas
DROP POLICY IF EXISTS "Datos restaurante cajas" ON cajas;
CREATE POLICY "Datos restaurante cajas" ON cajas 
    FOR ALL USING (restaurante_id = ANY (public.obtener_restaurantes_del_usuario()));

-- Compras
DROP POLICY IF EXISTS "Datos restaurante compras" ON compras;
CREATE POLICY "Datos restaurante compras" ON compras 
    FOR ALL USING (restaurante_id = ANY (public.obtener_restaurantes_del_usuario()));

-- Insumos
DROP POLICY IF EXISTS "Datos restaurante insumos" ON insumos;
CREATE POLICY "Datos restaurante insumos" ON insumos 
    FOR ALL USING (restaurante_id = ANY (public.obtener_restaurantes_del_usuario()));

-- Recetas
DROP POLICY IF EXISTS "Datos restaurante recetas" ON recetas;
CREATE POLICY "Datos restaurante recetas" ON recetas 
    FOR ALL USING (restaurante_id = ANY (public.obtener_restaurantes_del_usuario()));

-- Ventas
DROP POLICY IF EXISTS "Datos restaurante ventas" ON ventas;
CREATE POLICY "Datos restaurante ventas" ON ventas 
    FOR ALL USING (restaurante_id = ANY (public.obtener_restaurantes_del_usuario()));

-- Kardex
DROP POLICY IF EXISTS "Datos restaurante Kardex" ON insumo_movimientos;
CREATE POLICY "Datos restaurante Kardex" ON insumo_movimientos 
    FOR ALL USING (restaurante_id = ANY (public.obtener_restaurantes_del_usuario()));

-- Detalles de Compra
DROP POLICY IF EXISTS "Datos detalles_compra" ON compra_detalles;
CREATE POLICY "Datos detalles_compra" ON compra_detalles FOR ALL USING (
    EXISTS (SELECT 1 FROM compras WHERE compras.id = compra_detalles.compra_id AND compras.restaurante_id = ANY (public.obtener_restaurantes_del_usuario()))
);

-- Receta Ingredientes
DROP POLICY IF EXISTS "Datos receta_ingredientes" ON receta_ingredientes;
CREATE POLICY "Datos receta_ingredientes" ON receta_ingredientes FOR ALL USING (
    EXISTS (SELECT 1 FROM recetas WHERE recetas.id = receta_ingredientes.receta_id AND recetas.restaurante_id = ANY (public.obtener_restaurantes_del_usuario()))
);

-- Venta Detalles
DROP POLICY IF EXISTS "Datos venta_detalles" ON venta_detalles;
CREATE POLICY "Datos venta_detalles" ON venta_detalles FOR ALL USING (
    EXISTS (SELECT 1 FROM ventas WHERE ventas.id = venta_detalles.venta_id AND ventas.restaurante_id = ANY (public.obtener_restaurantes_del_usuario()))
);

-- Movimientos Caja
DROP POLICY IF EXISTS "Datos movimientos_caja" ON movimientos_caja;
CREATE POLICY "Datos movimientos_caja" ON movimientos_caja FOR ALL USING (
    EXISTS (SELECT 1 FROM cajas WHERE cajas.id = movimientos_caja.caja_id AND cajas.restaurante_id = ANY (public.obtener_restaurantes_del_usuario()))
);
