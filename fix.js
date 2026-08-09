const fs = require('fs');
const path = require('path');
const dir = 'd:/Trabajo/Proyectos/Insumia/frontend/src';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  content = content.replace(/from\('usuarios'\)\.select\('restaurante_id'\)\.eq\('id',/g, "from('usuario_restaurantes').select('restaurante_id').eq('usuario_id',");
  
  content = content.replace(/from\('usuarios'\)\s*\.select\('restaurante_id'\)\s*\.eq\('id',/g, "from('usuario_restaurantes').select('restaurante_id').eq('usuario_id',");

  if (content !== original) {
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
console.log('Done');
