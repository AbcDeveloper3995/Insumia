-- ==============================================================================
-- Función RPC para Registrar Restaurante y Usuario de forma segura
-- ==============================================================================
-- Esta función se ejecuta con permisos de "SECURITY DEFINER", lo que le permite
-- insertar registros en las tablas de negocio evadiendo las políticas RLS 
-- únicamente durante el registro inicial.

CREATE OR REPLACE FUNCTION public.registrar_restaurante_y_usuario(
    p_nombre_restaurante TEXT,
    p_nombre_usuario TEXT
)
RETURNS JSON AS $$
DECLARE
    v_restaurante_id UUID;
    v_usuario_id UUID;
BEGIN
    -- 1. Obtener el ID del usuario autenticado (creado previamente por Supabase Auth)
    v_usuario_id := auth.uid();

    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    -- 2. Insertar el restaurante y obtener su ID
    INSERT INTO public.restaurantes (nombre)
    VALUES (p_nombre_restaurante)
    RETURNING id INTO v_restaurante_id;

    -- 3. Insertar el perfil del usuario administrador asociado al restaurante
    INSERT INTO public.usuarios (id, restaurante_id, nombre, rol)
    VALUES (v_usuario_id, v_restaurante_id, p_nombre_usuario, 'admin');

    -- 4. Retornar éxito
    RETURN json_build_object(
        'success', true,
        'restaurante_id', v_restaurante_id,
        'usuario_id', v_usuario_id
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Retornar error si falla alguna inserción
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
