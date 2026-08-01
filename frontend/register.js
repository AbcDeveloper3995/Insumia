import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bgadjpxziaakmakweugx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnYWRqcHh6aWFha21ha3dldWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2MDE4OTgsImV4cCI6MjEwMTE3Nzg5OH0.d0jyNPZF0tmbuyqNVv9J9xyXcmsH0QfZRokUMv4_Pqo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function registerAdmin() {
  console.log('Iniciando registro...');
  
  const email = 'admin@insumia.com';
  const password = 'adminadmin';
  
  // Try signup
  let { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
      console.log('Signup failed, trying login (user might exist)...', authError.message);
      let { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginError) {
          console.log('Login also failed:', loginError.message);
          return;
      }
      console.log('Login success!', loginData.session.user.id);
  } else {
      console.log('Signup success! User id:', authData.user?.id);
  }

  // Ejecutar RPC para crear Restaurante y Perfil
  const { data: rpcData, error: rpcError } = await supabase.rpc('registrar_restaurante_y_usuario', {
    p_nombre_restaurante: 'Insumia Default',
    p_nombre_usuario: 'anthuan'
  });

  if (rpcError) {
      console.log('RPC Error:', rpcError.message);
      return;
  }

  if (rpcData && !rpcData.success) {
      console.log('RPC falló internamente:', rpcData.error);
      return;
  }

  console.log('¡Éxito! Restaurante y perfil de usuario creados exitosamente:', rpcData);
}

registerAdmin();
