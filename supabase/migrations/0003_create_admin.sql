DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
    new_restaurante_id UUID := gen_random_uuid();
BEGIN
    -- 1. Crear usuario en Auth de Supabase con email confirmado y contraseña
    INSERT INTO auth.users (
        id, instance_id, aud, role, email,
        encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
        new_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'anthuan@insumia.com',
        crypt('adminadmin', gen_salt('bf')), NOW(),
        '{"provider":"email","providers":["email"]}', '{}',
        NOW(), NOW(), '', '', '', ''
    );

    -- Insertar identidad requerida por Supabase v2
    INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), new_user_id, new_user_id::text, 
        jsonb_build_object('sub', new_user_id::text, 'email', 'anthuan@insumia.com'), 
        'email', NOW(), NOW(), NOW()
    );

    -- 2. Crear Restaurante "Sistema/Admin"
    INSERT INTO public.restaurantes (id, nombre)
    VALUES (new_restaurante_id, 'Insumia Sistema');

    -- 3. Crear Perfil de Usuario Administrador en el negocio
    INSERT INTO public.usuarios (id, restaurante_id, nombre, rol)
    VALUES (new_user_id, new_restaurante_id, 'anthuan', 'admin');

END $$;
