import fs from 'fs';
import path from 'path';
import https from 'https';

const outputDir = path.resolve('public/images/recomendacoes');

const targets = [
  {
    id: 'cartas-xamanicas',
    url: 'https://images.unsplash.com/photo-1601024445121-e5b82f020549?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'medicina-da-terra',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'oraculo-sagrado-animais',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
  },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return download(res.headers.location, dest).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Status ${res.statusCode}`));
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`Saved ${dest} (${fs.statSync(dest).size} bytes)`);
          resolve(true);
        });
      }
    ).on('error', reject);
  });
}

async function main() {
  for (const t of targets) {
    const dest = path.join(outputDir, `${t.id}.jpg`);
    try {
      await download(t.url, dest);
    } catch (e) {
      console.error(`Failed ${t.id}: ${e.message}`);
    }
  }
}

main();
