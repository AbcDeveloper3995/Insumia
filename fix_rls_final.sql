-- =========================================================================================
-- SCRIPT FINAL Y MÁS ROBUSTO PARA RLS (Políticas de Seguridad)
-- =========================================================================================

-- 1. Eliminamos la función anterior ya que usaremos una estrategia más directa y segura (EXISTS)
DROP FUNCTION IF EXISTS public.obtener_restaurantes_del_usuario() CASCADE;

-- 2. Limpiamos las políticas existentes para recrearlas
DROP POLICY IF EXISTS "Restaurantes visibles por sus usuarios" ON restaurantes;
DROP POLICY IF EXISTS "Usuarios del mismo restaurante o sí mismo" ON usuarios;
DROP POLICY IF EXISTS "Usuario_restaurantes visibles" ON usuario_restaurantes;
DROP POLICY IF EXISTS "Datos restaurante proveedores" ON proveedores;
DROP POLICY IF EXISTS "Datos restaurante cajas" ON cajas;
DROP POLICY IF EXISTS "Datos restaurante compras" ON compras;
DROP POLICY IF EXISTS "Datos restaurante insumos" ON insumos;
DROP POLICY IF EXISTS "Datos restaurante recetas" ON recetas;
DROP POLICY IF EXISTS "Datos restaurante ventas" ON ventas;
DROP POLICY IF EXISTS "Datos restaurante Kardex" ON insumo_movimientos;
DROP POLICY IF EXISTS "Datos detalles_compra" ON compra_detalles;
DROP POLICY IF EXISTS "Datos receta_ingredientes" ON receta_ingredientes;
DROP POLICY IF EXISTS "Datos venta_detalles" ON venta_detalles;
DROP POLICY IF EXISTS "Datos movimientos_caja" ON movimientos_caja;

-- 3. RECREAR POLÍTICAS USANDO EXISTS DIRECTO (A prueba de balas)

-- A. El usuario solo ve su propio registro de relación
CREATE POLICY "Usuario_restaurantes visibles" ON usuario_restaurantes
    FOR ALL USING (usuario_id = auth.uid());

-- B. Restaurantes: visibles si existe una relación tuya con ese restaurante
CREATE POLICY "Restaurantes visibles por sus usuarios" ON restaurantes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.usuario_restaurantes ur
            WHERE ur.restaurante_id = restaurantes.id 
            AND ur.usuario_id = auth.uid()
        )
    );

-- C. Perfil de Usuario: visible para sí mismo
CREATE POLICY "Usuarios del mismo restaurante o sí mismo" ON usuarios
    FOR ALL USING (id = auth.uid());

-- D. Resto de tablas maestras (Proveedores, Cajas, Compras, Insumos, Recetas, Ventas, Kardex)
-- Son visibles si su restaurante_id coincide con alguno tuyo
CREATE POLICY "Datos restaurante proveedores" ON proveedores FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuario_restaurantes ur WHERE ur.restaurante_id = proveedores.restaurante_id AND ur.usuario_id = auth.uid())
);

CREATE POLICY "Datos restaurante cajas" ON cajas FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuario_restaurantes ur WHERE ur.restaurante_id = cajas.restaurante_id AND ur.usuario_id = auth.uid())
);

CREATE POLICY "Datos restaurante compras" ON compras FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuario_restaurantes ur WHERE ur.restaurante_id = compras.restaurante_id AND ur.usuario_id = auth.uid())
);

CREATE POLICY "Datos restaurante insumos" ON insumos FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuario_restaurantes ur WHERE ur.restaurante_id = insumos.restaurante_id AND ur.usuario_id = auth.uid())
);

CREATE POLICY "Datos restaurante recetas" ON recetas FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuario_restaurantes ur WHERE ur.restaurante_id = recetas.restaurante_id AND ur.usuario_id = auth.uid())
);

CREATE POLICY "Datos restaurante ventas" ON ventas FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuario_restaurantes ur WHERE ur.restaurante_id = ventas.restaurante_id AND ur.usuario_id = auth.uid())
);

CREATE POLICY "Datos restaurante Kardex" ON insumo_movimientos FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuario_restaurantes ur WHERE ur.restaurante_id = insumo_movimientos.restaurante_id AND ur.usuario_id = auth.uid())
);

-- E. Tablas de detalle (Compra detalles, Receta Ingredientes, Venta Detalles, Movimientos Caja)
-- Revisan si la tabla padre pertenece a un restaurante tuyo
CREATE POLICY "Datos detalles_compra" ON compra_detalles FOR ALL USING (
    EXISTS (
        SELECT 1 FROM compras c 
        JOIN public.usuario_restaurantes ur ON ur.restaurante_id = c.restaurante_id 
        WHERE c.id = compra_detalles.compra_id AND ur.usuario_id = auth.uid()
    )
);

CREATE POLICY "Datos receta_ingredientes" ON receta_ingredientes FOR ALL USING (
    EXISTS (
        SELECT 1 FROM recetas r 
        JOIN public.usuario_restaurantes ur ON ur.restaurante_id = r.restaurante_id 
        WHERE r.id = receta_ingredientes.receta_id AND ur.usuario_id = auth.uid()
    )
);

CREATE POLICY "Datos venta_detalles" ON venta_detalles FOR ALL USING (
    EXISTS (
        SELECT 1 FROM ventas v 
        JOIN public.usuario_restaurantes ur ON ur.restaurante_id = v.restaurante_id 
        WHERE v.id = venta_detalles.venta_id AND ur.usuario_id = auth.uid()
    )
);

CREATE POLICY "Datos movimientos_caja" ON movimientos_caja FOR ALL USING (
    EXISTS (
        SELECT 1 FROM cajas c 
        JOIN public.usuario_restaurantes ur ON ur.restaurante_id = c.restaurante_id 
        WHERE c.id = movimientos_caja.caja_id AND ur.usuario_id = auth.uid()
    )
);
