import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const outputDir = path.resolve('public/images/recomendacoes');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const items = [
  {
    id: 'cartas-xamanicas',
    urls: [
      'https://books.google.com/books/content?id=t-n4swEACAAJ&printsec=frontcover&img=1&zoom=1',
      'https://covers.openlibrary.org/b/isbn/9788531501173-L.jpg',
    ],
  },
  {
    id: 'o-caminho-do-xama',
    urls: [
      'https://images-na.ssl-images-amazon.com/images/P/8531505397.01._SCLZZZZZZZ_SX500_.jpg',
      'https://covers.openlibrary.org/b/isbn/9788531505393-L.jpg',
    ],
  },
  {
    id: 'medicina-da-terra',
    urls: [
      'https://books.google.com/books/content?id=xM9mDwAAQBAJ&printsec=frontcover&img=1&zoom=1',
      'https://covers.openlibrary.org/b/isbn/9788531510489-L.jpg',
    ],
  },
  {
    id: 'oraculo-sagrado-animais',
    urls: [
      'https://books.google.com/books/content?id=c7tEEAAAQBAJ&printsec=frontcover&img=1&zoom=1',
      'https://covers.openlibrary.org/b/isbn/9788531521508-L.jpg',
    ],
  },
  {
    id: 'animal-speak-ted-andrews',
    urls: [
      'https://images-na.ssl-images-amazon.com/images/P/0875420281.01._SCLZZZZZZZ_SX500_.jpg',
      'https://covers.openlibrary.org/b/isbn/9780875420288-L.jpg',
    ],
  },
  {
    id: 'animais-de-poder-steven-farmer',
    urls: [
      'https://images-na.ssl-images-amazon.com/images/P/1401907334.01._SCLZZZZZZZ_SX500_.jpg',
      'https://covers.openlibrary.org/b/isbn/9781401907334-L.jpg',
    ],
  },
  {
    id: 'the-wild-unknown-animal-spirit',
    urls: [
      'https://images-na.ssl-images-amazon.com/images/P/0062742868.01._SCLZZZZZZZ_SX500_.jpg',
      'https://covers.openlibrary.org/b/isbn/9780062742865-L.jpg',
    ],
  },
  {
    id: 'palo-santo-natural',
    urls: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&auto=format&fit=crop',
    ],
  },
  {
    id: 'tambor-xamanico-lakota',
    urls: [
      'https://images-na.ssl-images-amazon.com/images/P/B09Y8N776F.01._SCLZZZZZZZ_SX500_.jpg',
      'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?q=80&w=600&auto=format&fit=crop',
    ],
  },
  {
    id: 'kit-cristais-7-chakras',
    urls: [
      'https://images-na.ssl-images-amazon.com/images/P/B08DFG45KL.01._SCLZZZZZZZ_SX500_.jpg',
      'https://images.unsplash.com/photo-1567225557594-88d73e55f2cb?q=80&w=600&auto=format&fit=crop',
    ],
  },
];

function downloadFile(url, targetPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const request = client.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      },
      (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          return downloadFile(response.headers.location, targetPath).then(resolve).catch(reject);
        }

        if (response.statusCode !== 200) {
          return reject(new Error(`Status ${response.statusCode} for ${url}`));
        }

        const fileStream = fs.createWriteStream(targetPath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          const stats = fs.statSync(targetPath);
          // Verificar se é uma imagem válida e não uma imagem transparente de 1px (comum em Amazon 404 fake)
          if (stats.size < 1500) {
            fs.unlinkSync(targetPath);
            return reject(new Error(`Imagem muito pequena (${stats.size} bytes - possível gif 1px)`));
          }
          resolve(true);
        });

        fileStream.on('error', (err) => {
          fs.unlink(targetPath, () => {});
          reject(err);
        });
      }
    );

    request.on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  console.log('Baixando capas originais dos livros e produtos...');
  for (const item of items) {
    const targetPath = path.join(outputDir, `${item.id}.jpg`);
    let downloaded = false;

    for (const url of item.urls) {
      try {
        console.log(`Tentando baixar ${item.id} de: ${url}`);
        await downloadFile(url, targetPath);
        console.log(`✅ Sucesso para ${item.id}`);
        downloaded = true;
        break;
      } catch (err) {
        console.warn(`⚠️ Falha em ${url}: ${err.message}`);
      }
    }

    if (!downloaded) {
      console.error(`❌ Não foi possível baixar capa real para ${item.id}`);
    }
  }
}

run();
