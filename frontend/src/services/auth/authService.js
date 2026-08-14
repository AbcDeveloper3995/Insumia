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
   * Registrar nuevo usuario
   */
  async registerUser(email, password, nombre, apellidos, telefono) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          apellidos,
          telefono
        }
      }
    });
    
    if (authError) throw authError;

    return { authData };
  },

  /**
   * Crear nuevo restaurante
   */
  async createRestaurant(nombreRestaurante) {
    const { data: rpcData, error: rpcError } = await supabase.rpc('crear_restaurante', {
      p_nombre_restaurante: nombreRestaurante
    });

    if (rpcError) throw rpcError;
    if (rpcData && !rpcData.success) {
      throw new Error(rpcData.error || 'Error al crear restaurante');
    }
    return rpcData;
  },

  /**
   * Actualizar nombre de restaurante
   */
  async updateRestaurant(id, nombre) {
    const { error } = await supabase
      .from('restaurantes')
      .update({ nombre })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  },

  /**
   * Eliminar restaurante
   */
  async deleteRestaurant(id) {
    const { error } = await supabase
      .from('restaurantes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  },

  /**
   * Obtener restaurantes del usuario
   */
  async getMyRestaurants() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    
    // Consulta directa a la tabla restaurantes, RLS filtrará por los del usuario
    const { data, error } = await supabase
      .from('restaurantes')
      .select('id, nombre, created_at');

    if (error) {
      console.error("Error fetching restaurants:", error);
      throw error;
    }
    
    console.log("Restaurantes obtenidos:", data);
    return data || [];
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
