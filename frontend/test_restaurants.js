import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  const email = 'test' + Math.random().toString().slice(2, 8) + '@gmail.com';
  const password = 'password123';
  
  console.log('Signing up...');
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (authError) return console.error('Auth Error:', authError);

  console.log('Creating profile...');
  await supabase.rpc('completar_perfil_usuario', {
    p_nombre: 'Test',
    p_apellidos: 'User',
    p_telefono: '123'
  });

  console.log('Creating restaurant...');
  const { data: rpcData, error: rpcError } = await supabase.rpc('crear_restaurante', {
    p_nombre_restaurante: 'Test Restaurant'
  });
  if (rpcError) return console.error('Create Restaurant Error:', rpcError);
  
  console.log('Restaurant created:', rpcData);

  console.log('Fetching restaurants...');
  const { data, error } = await supabase
    .from('usuario_restaurantes')
    .select(`
      restaurante_id,
      rol,
      restaurantes (
        id,
        nombre,
        created_at
      )
    `)
    .eq('usuario_id', authData.user.id);
    
  if (error) return console.error('Fetch Error:', error);
  console.log('Fetched data:', JSON.stringify(data, null, 2));
}

test();
