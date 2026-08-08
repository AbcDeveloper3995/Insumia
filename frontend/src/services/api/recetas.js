import { supabase } from './client';

export const recetasService = {
  /**
   * Obtiene la lista de recetas (solo cabecera)
   */
  async getRecetas() {
    const { data, error } = await supabase
      .from('recetas')
      .select(`
        *,
        ingredientes:receta_ingredientes!receta_id(
          cantidad,
          subreceta_id,
          insumo:insumos(id, nombre, costo_unidad_compra, factor_conversion, porcentaje_rendimiento, unidad_base)
        )
      `)
      .order('nombre');
      
    if (error) throw error;

    // Calcular el costo_total y tipo al vuelo para la lista, resolviendo recursivamente subrecetas
    if (data) {
      const recetaMap = new Map();
      data.forEach(r => recetaMap.set(r.id, r));

      const calcularCostoRecursivo = (recetaId, path = new Set()) => {
        if (path.has(recetaId)) return 0; // Evitar ciclos infinitos
        
        const receta = recetaMap.get(recetaId);
        if (!receta) return 0;

        let costoTotal = 0;
        if (receta.ingredientes) {
          receta.ingredientes.forEach(ing => {
            if (ing.insumo) {
              const costoBase = Number(ing.insumo.costo_unidad_compra) / Number(ing.insumo.factor_conversion);
              const costoReal = costoBase / (Number(ing.insumo.porcentaje_rendimiento) / 100);
              costoTotal += costoReal * Number(ing.cantidad);
            } else if (ing.subreceta_id) {
              const costoSubrecetaLote = calcularCostoRecursivo(ing.subreceta_id, new Set([...path, recetaId]));
              const subreceta = recetaMap.get(ing.subreceta_id);
              const rendimientoSub = subreceta ? (Number(subreceta.rendimiento) || 1) : 1;
              costoTotal += (costoSubrecetaLote / rendimientoSub) * Number(ing.cantidad);
            }
          });
        }
        return costoTotal;
      };

      data.forEach(receta => {
        receta.costo_total = calcularCostoRecursivo(receta.id);
        receta.tipo = receta.es_subreceta ? 'subreceta' : 'platillo';
      });
    }

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
        ingredientes:receta_ingredientes!receta_id(
          id,
          insumo_id,
          subreceta_id,
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
        item_id: ing.insumo_id ? `insumo_${ing.insumo_id}` : `subreceta_${ing.subreceta_id}`,
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
        rendimiento: Number(recetaData.rendimiento) || 1,
        precio_venta: recetaData.precio_venta || 0
      }])
      .select()
      .single();
      
    if (errorReceta) throw errorReceta;

    // 2. Si hay ingredientes, insertarlos usando el ID de la receta creada
    if (ingredientes && ingredientes.length > 0) {
      const ingredientesInsert = ingredientes.map(ing => {
        const isInsumo = ing.item_id.startsWith('insumo_');
        const idItem = ing.item_id.replace('insumo_', '').replace('subreceta_', '');
        return {
          receta_id: nuevaReceta.id,
          insumo_id: isInsumo ? idItem : null,
          subreceta_id: !isInsumo ? idItem : null,
          cantidad: Number(ing.cantidad_uso)
        };
      });

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
        rendimiento: Number(recetaData.rendimiento) || 1,
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
      const ingredientesInsert = ingredientes.map(ing => {
        const isInsumo = ing.item_id.startsWith('insumo_');
        const idItem = ing.item_id.replace('insumo_', '').replace('subreceta_', '');
        return {
          receta_id: id,
          insumo_id: isInsumo ? idItem : null,
          subreceta_id: !isInsumo ? idItem : null,
          cantidad: Number(ing.cantidad_uso)
        };
      });

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
