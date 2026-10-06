import fs from 'fs';
import path from 'path';
import https from 'https';

const outputDir = path.resolve('public/images/recomendacoes');

const targets = [
  { id: 'cartas-xamanicas', query: 'Cartas Xamanicas Jamie Sams' },
  { id: 'medicina-da-terra', query: 'Medicina da Terra Jamie Sams' },
  { id: 'oraculo-sagrado-animais', query: 'Oraculo Animais Poder' },
];

function fetchJson(url) {
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
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }
    ).on('error', reject);
  });
}

function downloadImage(url, dest) {
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
          return downloadImage(res.headers.location, dest).then(resolve).catch(reject);
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

async function run() {
  for (const t of targets) {
    try {
      console.log(`Searching Google Books for ${t.query}...`);
      const data = await fetchJson(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(t.query)}`);
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        const imageLinks = item.volumeInfo?.imageLinks;
        console.log(`Found volume: ${item.volumeInfo?.title}`);
        let imgUrl = imageLinks?.thumbnail || imageLinks?.smallThumbnail;
        if (imgUrl) {
          imgUrl = imgUrl.replace('http://', 'https://');
          const dest = path.join(outputDir, `${t.id}.jpg`);
          await downloadImage(imgUrl, dest);
        } else {
          console.warn(`No imageLinks for ${t.id}`);
        }
      } else {
        console.warn(`No items found for ${t.query}`);
      }
    } catch (e) {
      console.error(`Error for ${t.id}: ${e.message}`);
    }
  }
}

run();
