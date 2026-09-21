import { GoogleGenAI } from '@google/genai';
import { insumosService } from '../api/insumos';
import { ventasService } from '../api/ventas';
import { recetasService } from '../api/recetas';
import { supabase } from '../api/client';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
// Instanciamos el cliente
const ai = new GoogleGenAI({ apiKey });

export const auditorService = {
  
  async getRestaurantContext(restaurantId) {
    if (!restaurantId) throw new Error("Restaurante ID requerido");
    
    // 1. Insumos actuales y lotes
    const insumos = await insumosService.getInsumos(restaurantId) || [];
    const { data: lotes } = await supabase
      .from('lotes_insumo')
      .select('id, cantidad_actual, fecha_caducidad, insumos(nombre)')
      .eq('restaurante_id', restaurantId)
      .gt('cantidad_actual', 0);
      
    // 2. Ventas recientes
    const ventas = await ventasService.getVentasHoy(restaurantId) || [];
    const productosTop = await ventasService.getVentasPorPlatillo(restaurantId) || [];
    
    // 3. Recetas (Menú activo)
    const recetas = await recetasService.getRecetas(restaurantId) || [];
    
    return {
      insumos: insumos.map(i => ({ nombre: i.nombre, stock: i.stock_actual, min: i.punto_reorden, unidad: i.unidad_base })),
      lotes_activos: lotes?.map(l => ({ producto: l.insumos?.nombre, cantidad: l.cantidad_actual, caduca: l.fecha_caducidad })) || [],
      ventas_hoy: ventas.length,
      productos_top: productosTop.slice(0, 5),
      menu_activo: recetas.length
    };
  },

  async askAuditor(message, restaurantId, chatHistory = []) {
    try {
      const context = await this.getRestaurantContext(restaurantId);
      
      const systemPrompt = `Eres Insumia IA, el Auditor y Copiloto Financiero de este restaurante. 
Usa el siguiente contexto real de la base de datos para responder cualquier pregunta del gerente. 
Si preguntan por el stock, caducidades o ventas, básate SOLO en esta información.
Responde de manera ejecutiva, clara, y usando Markdown (como negritas y listas).
      
DATOS DEL RESTAURANTE AHORA MISMO:
${JSON.stringify(context, null, 2)}`;

      const formattedHistory = chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: "Entendido, estoy listo para asistir basándome en los datos actuales." }] },
          ...formattedHistory,
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          temperature: 0.2
        }
      });
      
      return response.text;
    } catch (error) {
      console.error("Error en askAuditor:", error);
      throw new Error("No pude comunicarme con el motor de IA. Verifica tu conexión o intenta más tarde.");
    }
  },

  async suggestPurchaseOrder(restaurantId) {
    try {
      const context = await this.getRestaurantContext(restaurantId);
      
      const prompt = `Actúa como un gerente de compras experto.
Revisa el siguiente contexto de mi restaurante y determina qué insumos necesito comprar urgentemente (aquellos cuyo stock es cercano o menor al punto mínimo, o lotes vencidos que deba reponer).
Devuelve ÚNICAMENTE un arreglo JSON válido (sin formato Markdown \`\`\`json) con los insumos recomendados. Formato esperado de ejemplo: [{"nombre": "Tomate", "cantidad_sugerida": 5, "unidad": "kg", "motivo": "Stock por debajo del mínimo"}].

Contexto:
${JSON.stringify(context, null, 2)}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          temperature: 0.1
        }
      });
      
      // Intentar parsear el JSON de la respuesta
      let rawResponse = response.text;
      rawResponse = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(rawResponse);
    } catch (error) {
      console.error("Error en suggestPurchaseOrder:", error);
      throw new Error("Hubo un problema al generar la sugerencia inteligente. Por favor intenta de nuevo.");
    }
  }
};
