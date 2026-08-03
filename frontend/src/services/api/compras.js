import { supabase } from './client';

export const comprasService = {
  // PROVEEDORES
  async getProveedores(restauranteId) {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .eq('activo', true)
      .order('nombre');
    if (error) throw error;
    return data || [];
  },

  async createProveedor(restauranteId, proveedorData) {
    const { data, error } = await supabase
      .from('proveedores')
      .insert({ restaurante_id: restauranteId, ...proveedorData })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateProveedor(id, data) {
    const { data: updated, error } = await supabase
      .from('proveedores')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  },

  async deleteProveedor(id) {
    const { error } = await supabase
      .from('proveedores')
      .update({ activo: false })
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // COMPRAS
  async getCompras(restauranteId, estado = null) {
    let query = supabase
      .from('compras')
      .select(`
        *,
        proveedores (nombre)
      `)
      .eq('restaurante_id', restauranteId)
      .order('fecha', { ascending: false });
      
    if (estado) {
        query = query.eq('estado', estado); // 'pagada' o 'pendiente'
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  
  async getDetallesCompra(compraId) {
      const { data, error } = await supabase
        .from('compra_detalles')
        .select(`
            *,
            insumos (nombre, unidad_medida)
        `)
        .eq('compra_id', compraId);
        
      if (error) throw error;
      return data || [];
  },

  async registrarCompra(restauranteId, proveedorId, estado, detalles, cajaId = null) {
    // Llama al RPC
    const { data, error } = await supabase.rpc('registrar_compra', {
      p_restaurante_id: restauranteId,
      p_proveedor_id: proveedorId,
      p_estado: estado,
      p_detalles: detalles,
      p_caja_id: cajaId
    });

    if (error) throw error;
    return data; // retorna compra_id
  },
  
  // CUENTAS POR PAGAR
  async marcarCompraComoPagada(compraId, cajaId = null) {
      // 1. Obtener total de la compra
      const { data: compra, error: errCompra } = await supabase
        .from('compras')
        .select('total, estado')
        .eq('id', compraId)
        .single();
        
      if (errCompra) throw errCompra;
      if (compra.estado === 'pagada') throw new Error('Esta compra ya está pagada');
      
      // 2. Actualizar estado a pagada
      const { error: errUpdate } = await supabase
        .from('compras')
        .update({ estado: 'pagada' })
        .eq('id', compraId);
        
      if (errUpdate) throw errUpdate;
      
      // 3. Si se especificó caja, sacar dinero
      if (cajaId) {
          const { error: errCaja } = await supabase.from('movimientos_caja').insert({
              caja_id: cajaId,
              tipo: 'egreso',
              monto: compra.total,
              concepto: 'Pago de cuenta por cobrar (Compra)',
              metodo_pago: 'efectivo',
              referencia_id: compraId
          });
          if (errCaja) throw errCaja;
      }
      
      return true;
  }
};
