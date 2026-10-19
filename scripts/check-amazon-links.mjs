import https from 'https';
import http from 'http';
import { CURATED_PRODUCTS } from '../src/lib/amazon.ts';

async function checkUrl(product) {
  return new Promise((resolve) => {
    const url = product.url;
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          const is404 = res.statusCode === 404 || body.includes('não foi encontrada') || body.includes('Page Not Found') || body.includes('Não encontramos');
          const isAvailable = !body.includes('Não temos previsão de quando este produto estará novamente em estoque') && !body.includes('Atualmente indisponível');
          resolve({
            id: product.id,
            title: product.title,
            url,
            statusCode: res.statusCode,
            is404,
            isAvailable,
          });
        });
      }
    );
    req.on('error', (err) => {
      resolve({
        id: product.id,
        title: product.title,
        url,
        statusCode: 0,
        error: err.message,
      });
    });
  });
}

async function run() {
  console.log('Verificando status dos links da Amazon...');
  for (const p of CURATED_PRODUCTS) {
    const result = await checkUrl(p);
    console.log(`[${result.statusCode}] ${result.id}: ${result.is404 ? '❌ QUEBRADO/404' : (result.isAvailable ? '✅ DISPONÍVEL' : '⚠️ INDISPONÍVEL')}`);
  }
}

run();
