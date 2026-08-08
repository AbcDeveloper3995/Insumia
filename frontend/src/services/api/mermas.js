import { supabase } from './client';

export const mermasService = {
  /**
   * Obtiene el historial de mermas de un restaurante
   */
  async getMermas(restauranteId) {
    const { data, error } = await supabase
      .from('mermas')
      .select(`
        *,
        detalles:merma_detalles(*)
      `)
      .eq('restaurante_id', restauranteId)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Registra una nueva merma y descuenta el inventario
   */
  async registrarMerma(restauranteId, detalles, notas = '') {
    const { data, error } = await supabase.rpc('registrar_merma', {
      p_restaurante_id: restauranteId,
      p_detalles: detalles,
      p_notas: notas
    });

    if (error) throw error;
    return data;
  }
};
