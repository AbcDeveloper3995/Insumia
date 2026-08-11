-- 1. Agregar columna activo a insumos
ALTER TABLE insumos ADD COLUMN activo BOOLEAN NOT NULL DEFAULT true;

-- 2. Función RPC para eliminar de forma segura
CREATE OR REPLACE FUNCTION eliminar_insumo_seguro(p_insumo_id UUID)
RETURNS JSON AS $$
DECLARE
    v_usado_recetas BOOLEAN;
    v_usado_compras BOOLEAN;
    v_usado_movimientos BOOLEAN;
BEGIN
    -- Revisar si el usuario autenticado tiene permisos sobre el insumo
    IF NOT EXISTS (
        SELECT 1 FROM insumos 
        WHERE id = p_insumo_id 
        AND restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario())
    ) THEN
        RAISE EXCEPTION 'Permiso denegado o insumo no encontrado';
    END IF;

    SELECT EXISTS(SELECT 1 FROM receta_ingredientes WHERE insumo_id = p_insumo_id) INTO v_usado_recetas;
    SELECT EXISTS(SELECT 1 FROM compra_detalles WHERE insumo_id = p_insumo_id) INTO v_usado_compras;
    SELECT EXISTS(SELECT 1 FROM insumo_movimientos WHERE insumo_id = p_insumo_id) INTO v_usado_movimientos;
    
    IF v_usado_recetas OR v_usado_compras OR v_usado_movimientos THEN
        -- Archivar
        UPDATE insumos SET activo = false WHERE id = p_insumo_id;
        RETURN json_build_object('success', true, 'action', 'archived');
    ELSE
        -- Hard delete
        DELETE FROM insumos WHERE id = p_insumo_id;
        RETURN json_build_object('success', true, 'action', 'deleted');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Función RPC para restaurar
CREATE OR REPLACE FUNCTION restaurar_insumo(p_insumo_id UUID)
RETURNS JSON AS $$
BEGIN
    -- Revisar permisos
    IF NOT EXISTS (
        SELECT 1 FROM insumos 
        WHERE id = p_insumo_id 
        AND restaurante_id IN (SELECT public.obtener_restaurantes_del_usuario())
    ) THEN
        RAISE EXCEPTION 'Permiso denegado o insumo no encontrado';
    END IF;

    UPDATE insumos SET activo = true WHERE id = p_insumo_id;
    RETURN json_build_object('success', true, 'action', 'restored');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
