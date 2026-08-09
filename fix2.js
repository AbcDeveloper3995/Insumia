const fs = require('fs');
const path = require('path');
const dir = 'd:/Trabajo/Proyectos/Insumia/frontend/src';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Replace the supabase call with nothing
  content = content.replace(/const\s*{\s*data\s*:\s*userData\s*}\s*=\s*await\s*supabase\.from\('usuario_restaurantes'\)\.select\('restaurante_id'\)\.eq\('usuario_id',\s*(session\.user\.id|user\.id)\)\.single\(\);\s*/g, '');
  content = content.replace(/const\s*{\s*data\s*:\s*userData\s*}\s*=\s*await\s*supabase\s*\n\s*\.from\('usuario_restaurantes'\)\.select\('restaurante_id'\)\.eq\('usuario_id',\s*(session\.user\.id|user\.id)\)\s*\n\s*\.single\(\);\s*/g, '');
  
  // Replace const restauranteId = userData.restaurante_id; with const restauranteId = currentRestaurant?.id;
  content = content.replace(/const restauranteId = userData\.restaurante_id;/g, 'const restauranteId = currentRestaurant?.id;');
  
  if (content !== original) {
    if (!content.includes('currentRestaurant')) {
        content = content.replace(/const\s*{\s*session/g, 'const { session, currentRestaurant');
        content = content.replace(/const\s*{\s*user\s*}/g, 'const { user, currentRestaurant }'); // for NotificationBell
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      replaceInFile(fullPath);
    }
  }
}

traverse(dir);
console.log('Done fix2');
