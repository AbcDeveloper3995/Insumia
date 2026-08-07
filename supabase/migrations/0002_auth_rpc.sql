-- ==============================================================================
-- Función RPC para completar perfil de usuario tras registro
-- ==============================================================================
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


-- ==============================================================================
-- Función RPC para Crear un Restaurante
-- ==============================================================================
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

    -- Insertar el restaurante
    INSERT INTO public.restaurantes (nombre)
    VALUES (p_nombre_restaurante)
    RETURNING id INTO v_restaurante_id;

    -- Asociar usuario al restaurante como admin
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
