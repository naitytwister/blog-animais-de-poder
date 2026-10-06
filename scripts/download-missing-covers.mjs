import fs from 'fs';
import path from 'path';
import https from 'https';

const outputDir = path.resolve('public/images/recomendacoes');

const missing = [
  {
    id: 'cartas-xamanicas',
    url: 'https://m.media-amazon.com/images/I/81+c+L8N85L.jpg',
  },
  {
    id: 'medicina-da-terra',
    url: 'https://m.media-amazon.com/images/I/81fH+0Q8GSL.jpg',
  },
  {
    id: 'oraculo-sagrado-animais',
    url: 'https://m.media-amazon.com/images/I/71-0jN2mQGL.jpg',
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
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return download(res.headers.location, dest).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Status ${res.statusCode}`));
        }
        const stream = fs.createWriteStream(dest);
        res.pipe(stream);
        stream.on('finish', () => {
          stream.close();
          const size = fs.statSync(dest).size;
          console.log(`Downloaded ${dest} (${size} bytes)`);
          resolve(true);
        });
      }
    ).on('error', reject);
  });
}

async function main() {
  for (const item of missing) {
    const dest = path.join(outputDir, `${item.id}.jpg`);
    try {
      await download(item.url, dest);
    } catch (e) {
      console.error(`Failed ${item.id}: ${e.message}`);
    }
  }
}

main();
