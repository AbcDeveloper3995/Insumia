import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1];
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function calc() {
  const { data: detalles, error: err1 } = await supabase.from('venta_detalles').select('*');
  const { data: recetas, error: err2 } = await supabase.from('recetas').select('*');
  
  if (err1 || err2) {
    console.error(err1, err2);
    return;
  }
  
  console.log(`Encontrados ${detalles.length} venta_detalles y ${recetas.length} recetas`);
  
  const agrupado = {};
  detalles.forEach(item => {
    if (!agrupado[item.receta_id]) {
      agrupado[item.receta_id] = 0;
    }
    agrupado[item.receta_id] += item.cantidad;
  });
  
  let gananciaTotal = 0;
  console.log("Desglose de Ganancia Real:");
  for (const recetaId in agrupado) {
    const receta = recetas.find(r => r.id === recetaId);
    if (!receta) {
      console.log(`No se encontro la receta con ID ${recetaId}`);
      continue;
    }
    const cantidad = agrupado[recetaId];
    const costo = Number(receta.costo_total) || 0;
    const precio = Number(receta.precio_venta) || 0;
    const gananciaUnitaria = precio - costo;
    const gananciaItem = gananciaUnitaria * cantidad;
    gananciaTotal += gananciaItem;
    console.log(`- ${receta.nombre}: vendiste ${cantidad} unidad(es). Precio Venta: $${precio.toFixed(2)}, Costo: $${costo.toFixed(2)} -> Ganancia Unitaria: $${gananciaUnitaria.toFixed(2)} -> Ganancia Total = $${gananciaItem.toFixed(2)}`);
  }
  console.log(`\nGran Total: $${gananciaTotal.toFixed(2)}`);
}

calc();
