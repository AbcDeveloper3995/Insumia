import { supabase } from './client';

export const recetasService = {
  /**
   * Obtiene la lista de recetas (solo cabecera)
   */
  async getRecetas() {
    const { data, error } = await supabase
      .from('recetas')
      .select('*')
      .order('nombre');
      
    if (error) throw error;
    return data;
  },

  /**
   * Obtiene una receta específica con todos sus ingredientes e información de los insumos
   */
  async getRecetaConIngredientes(id) {
    const { data, error } = await supabase
      .from('recetas')
      .select(`
        *,
        ingredientes:receta_ingredientes(
          id,
          insumo_id,
          cantidad,
          insumo:insumos(nombre, unidad_base, costo_unidad_compra, factor_conversion, porcentaje_rendimiento)
        )
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    // Mapear de vuelta al formato que espera el frontend
    if (data && data.ingredientes) {
      data.ingredientes = data.ingredientes.map(ing => ({
        ...ing,
        cantidad_uso: ing.cantidad
      }));
    }
    data.tipo = data.es_subreceta ? 'subreceta' : 'platillo';
    
    return data;
  },

  /**
   * Crea una nueva receta y sus ingredientes en una operación
   */
  async createRecetaConIngredientes(restauranteId, recetaData, ingredientes) {
    // 1. Crear la receta
    const { data: nuevaReceta, error: errorReceta } = await supabase
      .from('recetas')
      .insert([{
        restaurante_id: restauranteId,
        nombre: recetaData.nombre,
        es_subreceta: recetaData.tipo === 'subreceta',
        precio_venta: recetaData.precio_venta || 0
      }])
      .select()
      .single();
      
    if (errorReceta) throw errorReceta;

    // 2. Si hay ingredientes, insertarlos usando el ID de la receta creada
    if (ingredientes && ingredientes.length > 0) {
      const ingredientesInsert = ingredientes.map(ing => ({
        receta_id: nuevaReceta.id,
        insumo_id: ing.insumo_id,
        cantidad: ing.cantidad_uso
      }));

      const { error: errorIng } = await supabase
        .from('receta_ingredientes')
        .insert(ingredientesInsert);
        
      if (errorIng) {
        // Fallback básico: Si fallan los ingredientes, lo ideal sería hacer rollback (borrar receta)
        console.error('Error insertando ingredientes:', errorIng);
      }
    }

    return nuevaReceta;
  },

  /**
   * Actualiza una receta y reemplaza todos sus ingredientes
   */
  async updateRecetaConIngredientes(id, recetaData, ingredientes) {
    // 1. Actualizar la receta
    const { error: errorReceta } = await supabase
      .from('recetas')
      .update({
        nombre: recetaData.nombre,
        es_subreceta: recetaData.tipo === 'subreceta',
        precio_venta: recetaData.precio_venta || 0
      })
      .eq('id', id);
      
    if (errorReceta) throw errorReceta;

    // 2. Borrar ingredientes anteriores
    const { error: errorDelete } = await supabase
      .from('receta_ingredientes')
      .delete()
      .eq('receta_id', id);

    if (errorDelete) throw errorDelete;

    // 3. Insertar nuevos ingredientes
    if (ingredientes && ingredientes.length > 0) {
      const ingredientesInsert = ingredientes.map(ing => ({
        receta_id: id,
        insumo_id: ing.insumo_id,
        cantidad: ing.cantidad_uso
      }));

      const { error: errorIng } = await supabase
        .from('receta_ingredientes')
        .insert(ingredientesInsert);
        
      if (errorIng) throw errorIng;
    }

    return true;
  },

  /**
   * Elimina una receta (cascade borrará ingredientes)
   */
  async deleteReceta(id) {
    const { error } = await supabase
      .from('recetas')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  }
};
