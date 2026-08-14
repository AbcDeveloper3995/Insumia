import { supabase } from './client';

export const insumosService = {
  /**
   * Obtiene la lista de insumos del restaurante
   */
  async getInsumos(restauranteId) {
    if (!restauranteId) throw new Error('Se requiere el ID del restaurante');
    const { data, error } = await supabase
      .from('insumos')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .order('nombre');
      
    if (error) throw error;
    return data;
  },

  /**
   * Crea un nuevo insumo
   */
  async createInsumo(insumoData) {
    const { data, error } = await supabase
      .from('insumos')
      .insert([insumoData])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  /**
   * Actualiza un insumo existente
   */
  async updateInsumo(id, insumoData) {
    const { data, error } = await supabase
      .from('insumos')
      .update(insumoData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  /**
   * Elimina un insumo (Físico si no tiene historial, Lógico si lo tiene)
   */
  async deleteInsumo(id) {
    const { data, error } = await supabase.rpc('eliminar_insumo_seguro', {
      p_insumo_id: id
    });
      
    if (error) throw error;
    return data;
  },

  /**
   * Restaura un insumo archivado lógicamente
   */
  async restoreInsumo(id) {
    const { data, error } = await supabase.rpc('restaurar_insumo', {
      p_insumo_id: id
    });
      
    if (error) throw error;
    return data;
  },

  /**
   * Obtiene el Kardex (historial de movimientos) de un insumo
   */
  async getKardex(insumoId) {
    const { data, error } = await supabase
      .from('insumo_movimientos')
      .select('*')
      .eq('insumo_id', insumoId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  }
};
