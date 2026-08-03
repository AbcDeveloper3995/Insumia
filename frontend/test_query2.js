
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1];
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: recetas, error: err1 } = await supabase.from('recetas').select('*').limit(1);
  if (err1) { console.error('err1', err1); return; }
  
  if (!recetas.length) { console.log('no recetas'); return; }
  const id = recetas[0].id;
  
  const { data, error } = await supabase
      .from('recetas')
      .select(`
        *,
        ingredientes:receta_ingredientes!receta_id(
          cantidad,
          insumo:insumos(costo_unidad_compra, factor_conversion, porcentaje_rendimiento)
        )
      `)
      .order('nombre');
      
  console.log('Result:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
}

test();
