import { supabase } from './client';

export const cajaService = {
  /**
   * Obtiene la caja abierta actual para el restaurante
   */
  async getCajaAbierta(restauranteId) {
    const { data, error } = await supabase
      .from('cajas')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .eq('estado', 'abierta')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 es 'No rows found'
    return data;
  },

  /**
   * Abre un nuevo turno de caja
   */
  async abrirCaja(restauranteId, montoInicial, notas = '') {
    // Verificar si ya hay una abierta
    const cajaActiva = await this.getCajaAbierta(restauranteId);
    if (cajaActiva) throw new Error('Ya existe una caja abierta.');

    const { data, error } = await supabase
      .from('cajas')
      .insert({
        restaurante_id: restauranteId,
        estado: 'abierta',
        monto_inicial: montoInicial,
        notas
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Registrar el fondo inicial como movimiento
    if (montoInicial > 0) {
        await supabase.from('movimientos_caja').insert({
            caja_id: data.id,
            tipo: 'ingreso',
            monto: montoInicial,
            concepto: 'Fondo de Caja Inicial',
            metodo_pago: 'efectivo'
        });
    }
    
    return data;
  },

  /**
   * Cierra la caja actual
   */
  async cerrarCaja(cajaId, montoFinalReal, notasCierre = '') {
    // Calcular monto final esperado primero
    const { data: movimientos, error: movError } = await supabase
      .from('movimientos_caja')
      .select('monto, tipo, metodo_pago')
      .eq('caja_id', cajaId);
      
    if (movError) throw movError;
    
    // El esperado en caja física normalmente es solo EFECTIVO. 
    // Los ingresos por tarjeta van directo al banco.
    let esperadoEfectivo = 0;
    
    movimientos.forEach(m => {
        if (m.metodo_pago === 'efectivo') {
            if (m.tipo === 'ingreso') esperadoEfectivo += Number(m.monto);
            if (m.tipo === 'egreso') esperadoEfectivo -= Number(m.monto);
        }
    });

    const { data, error } = await supabase
      .from('cajas')
      .update({
        estado: 'cerrada',
        fecha_cierre: new Date().toISOString(),
        monto_final_esperado: esperadoEfectivo,
        monto_final_real: montoFinalReal,
        notas: notasCierre // Sobrescribir notas para añadir observaciones de cierre
      })
      .eq('id', cajaId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Obtiene todos los movimientos de una caja específica
   */
  async getMovimientos(cajaId) {
    const { data, error } = await supabase
      .from('movimientos_caja')
      .select('*')
      .eq('caja_id', cajaId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
  
  /**
   * Agrega un movimiento manual (ej. retiro de efectivo)
   */
  async agregarMovimiento(cajaId, tipo, monto, concepto, metodo_pago = 'efectivo') {
      const { data, error } = await supabase
        .from('movimientos_caja')
        .insert({
            caja_id: cajaId,
            tipo,
            monto,
            concepto,
            metodo_pago
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
  }
};
