import { supabase } from './client';

export const ventasService = {
  /**
   * Registra una venta en la base de datos usando RPC,
   * lo que descuenta el inventario automáticamente de forma segura.
   * 
   * @param {string} restauranteId UUID del restaurante
   * @param {Array} articulos Arreglo de { receta_id, cantidad }
   */
  async registrarVenta(restauranteId, articulos) {
    const { data, error } = await supabase.rpc('registrar_venta', {
      p_restaurante_id: restauranteId,
      p_articulos: articulos
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
   * Obtiene el desglose de platillos vendidos para gráficos
   */
  async getVentasPorPlatillo() {
    // Para gráficos básicos, traemos todos los detalles (en producción filtraríamos por fecha)
    const { data, error } = await supabase
      .from('venta_detalles')
      .select(`
        cantidad,
        recetas (
          nombre,
          precio_venta
        )
      `);

    if (error) throw error;

    // Agrupar y sumar
    const agrupado = {};
    if (data) {
      data.forEach(item => {
        const nombre = item.recetas?.nombre || 'Desconocido';
        if (!agrupado[nombre]) {
          agrupado[nombre] = { 
            nombre, 
            cantidad: 0, 
            ingreso: 0 
          };
        }
        agrupado[nombre].cantidad += item.cantidad;
        agrupado[nombre].ingreso += item.cantidad * (item.recetas?.precio_venta || 0);
      });
    }

    return Object.values(agrupado).sort((a, b) => b.cantidad - a.cantidad); // Ordenar por más vendidos
  }
};
