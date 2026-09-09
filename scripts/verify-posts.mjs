import fs from 'node:fs';
import path from 'node:path';

const postsDir = path.resolve('src/content/posts');
const publicDir = path.resolve('public');
const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'));

console.log('Total de posts encontrados:', files.length);
let missingImages = 0;
let errors = 0;

for (const file of files) {
  const content = fs.readFileSync(path.join(postsDir, file), 'utf8');
  const match = content.match(/imagem_capa:\s*["']?([^"'\r\n]+)["']?/);
  if (!match) {
    console.error(`Post sem imagem_capa: ${file}`);
    errors++;
    continue;
  }
  let imgPath = match[1].trim();
  if (imgPath.startsWith('/')) imgPath = imgPath.slice(1);
  const fullPath = path.join(publicDir, imgPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`FALTA IMAGEM em ${file}: ${imgPath}`);
    missingImages++;
    errors++;
  }
}

console.log(`Verificação concluída. Imagens faltando: ${missingImages}, Erros gerais: ${errors}`);
if (errors > 0) process.exit(1);
