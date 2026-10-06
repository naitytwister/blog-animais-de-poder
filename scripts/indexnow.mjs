// @ts-check
/**
 * scripts/indexnow.mjs
 * 
 * Submete as URLs do Animotem diretamente ao IndexNow (Bing, Yandex, Naver, Seznam)
 * para indexação rápida em horas, sem depender do crawl passivo.
 * 
 * Uso:
 *   node scripts/indexnow.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const SITE_HOST = 'animotem.com';
const INDEXNOW_KEY = 'animotem2026indexnowkey0909';
const KEY_LOCATION = `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`;

// Garante o arquivo de verificação pública no Astro/Netlify
const publicDir = path.resolve('public');
const keyFile = path.join(publicDir, `${INDEXNOW_KEY}.txt`);
if (!fs.existsSync(keyFile)) {
  fs.writeFileSync(keyFile, INDEXNOW_KEY, 'utf-8');
  console.log(`🔑 Arquivo de chave IndexNow criado: public/${INDEXNOW_KEY}.txt`);
}

// Coleta as URLs dos posts
const postsDir = path.resolve('src/content/posts');
const postFiles = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'));
const urlList = postFiles.map((file) => {
  const slug = file.replace(/\.md$/, '');
  return `https://${SITE_HOST}/posts/${slug}/`;
});

// Adiciona rotas principais
urlList.unshift(`https://${SITE_HOST}/`);
urlList.push(`https://${SITE_HOST}/sobre/`);
urlList.push(`https://${SITE_HOST}/autora/`);

console.log(`📡 Preparando envio de ${urlList.length} URLs para o IndexNow...`);

async function submitIndexNow() {
  const payload = {
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urlList.slice(0, 100), // Lote inicial
  };

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 200 || res.status === 202) {
      console.log(`✅ Sucesso! ${payload.urlList.length} URLs submetidas ao IndexNow (Status: ${res.status}).`);
    } else {
      const text = await res.text();
      console.warn(`⚠️ Resposta do IndexNow: ${res.status} - ${text}`);
    }
  } catch (err) {
    console.error('❌ Erro de conexão com IndexNow:', err.message);
  }
}

submitIndexNow();
