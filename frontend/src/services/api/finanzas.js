import { supabase } from './client';

export const finanzasService = {
  /**
   * Obtiene el capital actual del restaurante (desde la tabla restaurantes)
   */
  async getCapitalActual(restauranteId) {
    const { data, error } = await supabase
      .from('restaurantes')
      .select('capital_actual')
      .eq('id', restauranteId)
      .single();

    if (error) throw error;
    return Number(data.capital_actual) || 0;
  },

  /**
   * Obtiene el historial del libro mayor (movimientos de capital)
   */
  async getMovimientosCapital(restauranteId) {
    const { data, error } = await supabase
      .from('movimientos_capital')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Inyecta capital inicial al negocio
   */
  async establecerCapitalInicial(restauranteId, monto, notas = 'Establecimiento de Capital Inicial') {
    const { data, error } = await supabase
      .from('movimientos_capital')
      .insert({
        restaurante_id: restauranteId,
        tipo: 'ingreso',
        monto: monto,
        categoria: 'inversion_inicial',
        concepto: notas
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Registra un movimiento general (Ej. Cierre de caja, compra desde banco)
   */
  async registrarMovimientoGlobal(restauranteId, tipo, monto, categoria, concepto, referenciaId = null) {
    if (monto <= 0) return null;

    const { data, error } = await supabase
      .from('movimientos_capital')
      .insert({
        restaurante_id: restauranteId,
        tipo,
        monto,
        categoria,
        concepto,
        referencia_id: referenciaId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
