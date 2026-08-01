import { supabase } from './client';

export const insumosService = {
  /**
   * Obtiene la lista de insumos del restaurante
   */
  async getInsumos() {
    const { data, error } = await supabase
      .from('insumos')
      .select('*')
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
   * Elimina un insumo
   */
  async deleteInsumo(id) {
    const { error } = await supabase
      .from('insumos')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  }
};
