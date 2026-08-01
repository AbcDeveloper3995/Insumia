import { supabase } from '../api/client';

export const authService = {
  /**
   * Iniciar sesión con email y contraseña
   */
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Cerrar sesión
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Registrar nuevo usuario y restaurante (Flujo combinado)
   * 1. Crea el usuario en Supabase Auth
   * 2. Llama al RPC para crear Restaurante y Perfil de Usuario
   */
  async registerNewRestaurant(email, password, restauranteNombre, usuarioNombre) {
    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) throw authError;

    // 2. Ejecutar RPC para negocio
    const { data: rpcData, error: rpcError } = await supabase.rpc('registrar_restaurante_y_usuario', {
      p_nombre_restaurante: restauranteNombre,
      p_nombre_usuario: usuarioNombre
    });

    if (rpcError) {
      // Idealmente, se haría un rollback del usuario de auth si falla el negocio,
      // pero para el MVP lanzamos el error
      throw rpcError;
    }

    if (rpcData && !rpcData.success) {
      throw new Error(rpcData.error || 'Error al registrar el restaurante');
    }

    return { authData, rpcData };
  },

  /**
   * Obtener sesión actual
   */
  async getCurrentSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },
};
