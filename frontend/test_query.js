import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bgadjpxziaakmakweugx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnYWRqcHh6aWFha21ha3dldWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2MDE4OTgsImV4cCI6MjEwMTE3Nzg5OH0.d0jyNPZF0tmbuyqNVv9J9xyXcmsH0QfZRokUMv4_Pqo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log("Iniciando test...");
  
  // Login
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'anthuan@insumia.com',
    password: 'adminadmin'
  });
  
  if (authError) {
    console.error("Error login:", authError);
    return;
  }
  
  console.log("Logged in. User ID:", authData.user.id);
  
  // Check usuarios table
  const { data: userData, error: userError } = await supabase
    .from('usuarios')
    .select('*');
    
  console.log("Usuarios devueltos (RLS):", userData);
  
  // Check insumos table
  const { data: insumosData, error: insumosError } = await supabase
    .from('insumos')
    .select('*');
    
  console.log("Insumos devueltos (RLS):", insumosData);
}

test();
