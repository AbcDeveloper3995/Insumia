import { supabase } from './client';

export const ventasService = {
  /**
   * Registra una venta en la base de datos usando RPC,
   * lo que descuenta el inventario automáticamente de forma segura.
   * 
   * @param {string} restauranteId UUID del restaurante
   * @param {Array} articulos Arreglo de { receta_id, cantidad }
   */
  async registrarVenta(restauranteId, articulos, cajaId = null, metodoPago = 'efectivo') {
    const { data, error } = await supabase.rpc('registrar_venta', {
      p_restaurante_id: restauranteId,
      p_detalles: articulos,
      p_caja_id: cajaId,
      p_metodo_pago: metodoPago
    });

    if (error) throw error;
    return data; // Retorna el UUID de la venta
  },

  /**
   * Obtiene todas las ventas de hoy (para KPI)
   */
  async getVentasHoy() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('ventas')
      .select('id, created_at')
      .gte('created_at', hoy.toISOString());

    if (error) throw error;
    return data || [];
  },

  /**
   * Obtiene el desglose de platillos vendidos para gráficos del Dashboard (histórico agrupado)
   */
  async getVentasPorPlatillo() {
    const { data, error } = await supabase
      .from('venta_detalles')
      .select(`
        cantidad,
        receta_id,
        recetas (
          nombre,
          precio_venta
        )
      `);

    if (error) throw error;

    const agrupado = {};
    if (data) {
      data.forEach(item => {
        const id = item.receta_id;
        const nombre = item.recetas?.nombre || 'Desconocido';
        if (!agrupado[id]) {
          agrupado[id] = { receta_id: id, nombre, cantidad: 0, ingreso: 0 };
        }
        agrupado[id].cantidad += item.cantidad;
        agrupado[id].ingreso += item.cantidad * (item.recetas?.precio_venta || 0);
      });
    }
    return Object.values(agrupado).sort((a, b) => b.cantidad - a.cantidad);
  },

  /**
   * Obtiene datos planos de ventas con fechas para el módulo de Informes
   */
  async getVentasReporte(startDate = null, endDate = null) {
    let query = supabase
      .from('venta_detalles')
      .select(`
        cantidad,
        receta_id,
        recetas (
          nombre,
          precio_venta,
          es_subreceta
        ),
        ventas!inner (
          id,
          created_at,
          metodo_pago
        )
      `);

    if (startDate) {
      query = query.gte('ventas.created_at', startDate.toISOString());
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte('ventas.created_at', end.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
};
