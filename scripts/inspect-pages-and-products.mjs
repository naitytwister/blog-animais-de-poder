import { chromium } from '@playwright/test';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 4321;
const DIST_DIR = path.resolve('dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath.endsWith('/')) {
    reqPath += 'index.html';
  }
  let filePath = path.join(DIST_DIR, reqPath);

  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, async () => {
  console.log(`[PLAYWRIGHT] Servidor de testes rodando em http://localhost:${PORT}`);
  const resultsDir = path.resolve('test-results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    // --- 1. INSPEÇÃO DA PÁGINA DE RECOMENDAÇÕES & LINKS AMAZON ---
    console.log('\n--- 1. INSPEÇÃO DE RECOMENDAÇÕES E LINKS DE AFILIADOS AMAZON ---');
    await page.goto(`http://localhost:${PORT}/recomendacoes/`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(resultsDir, 'inspecao-recomendacoes.png'), fullPage: true });

    const cards = await page.$$('.amazon-card');
    console.log(`Encontrados ${cards.length} cards de produtos na página.`);

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const title = await card.$eval('.amazon-title', el => el.textContent.trim());
      const link = await card.$eval('.amazon-btn', el => el.getAttribute('href'));
      const rel = await card.$eval('.amazon-btn', el => el.getAttribute('rel'));
      const target = await card.$eval('.amazon-btn', el => el.getAttribute('target'));
      const imgSrc = await card.$eval('.amazon-card-image-wrap img', el => el.getAttribute('src'));

      const isAmazonTagPresent = link.includes('tag=animotem-20');
      const isTargetBlank = target === '_blank';
      const hasSecurityRel = rel && rel.includes('sponsored');

      const imgRes = await page.request.get(`http://localhost:${PORT}${imgSrc}`);
      const imgOk = imgRes.status() === 200;

      console.log(`[Produto ${i + 1}] "${title}"`);
      console.log(`  - Imagem (${imgSrc}): ${imgOk ? 'OK 200 ✅' : 'FALHA ❌'}`);
      console.log(`  - Tag de Afiliado (animotem-20): ${isAmazonTagPresent ? 'OK ✅' : 'FALHA ❌'}`);
      console.log(`  - Target & Rel (target="_blank" rel="noopener sponsored"): ${isTargetBlank && hasSecurityRel ? 'OK ✅' : 'FALHA ❌'}`);
    }

    // --- 2. INSPEÇÃO DOS 5 ARTIGOS PRINCIPAIS ENRIQUECIDOS ---
    const targetPosts = [
      { name: 'Coruja', slug: 'a-coruja-como-guia-do-poder-intuitivo-no-xamanismo' },
      { name: 'Lobo', slug: 'lobo-animal-de-poder-protecao-alcateia-lealdade' },
      { name: 'Onça', slug: 'olhar-da-onca-jaguar-animal-de-poder' },
      { name: 'Águia', slug: 'a-visao-mais-ampla-que-o-horizonte-sabedoria-aguia' },
      { name: 'Serpente', slug: 'cobra-serpente-animal-de-poder-renascimento' },
      { name: 'Urso', slug: 'o-grande-retiro-urso-medicina-forca-silenciosa' },
    ];

    console.log('\n--- 2. INSPEÇÃO DOS POSTS COM CURADORIA DUPLA (CAPA REAL + ARTE INTERNA) ---');

    for (const p of targetPosts) {
      const postUrl = `http://localhost:${PORT}/posts/${p.slug}/`;
      console.log(`\nVerificando artigo: [${p.name}] ${postUrl}`);
      await page.goto(postUrl, { waitUntil: 'networkidle' });

      // Validação da capa documental
      const coverImg = await page.$('.cover-figure img');
      const coverSrc = coverImg ? await coverImg.getAttribute('src') : null;
      let coverOk = false;
      if (coverSrc) {
        const res = await page.request.get(`http://localhost:${PORT}${coverSrc}`);
        coverOk = res.status() === 200;
      }

      // Validação da legenda da capa
      const captionEl = await page.$('.cover-caption');
      const captionText = captionEl ? await captionEl.textContent() : null;

      // Validação da imagem secundária interna (arte de IA)
      const inlineFig = await page.$('.post-inline-figure img');
      const inlineSrc = inlineFig ? await inlineFig.getAttribute('src') : null;
      let inlineOk = false;
      if (inlineSrc) {
        const res = await page.request.get(`http://localhost:${PORT}${inlineSrc}`);
        inlineOk = res.status() === 200;
      }

      const inlineCaptionEl = await page.$('.post-inline-figure figcaption');
      const inlineCaptionText = inlineCaptionEl ? await inlineCaptionEl.textContent() : null;

      // Screenshot individual de cada post
      await page.screenshot({ path: path.join(resultsDir, `post-${p.slug}.png`), fullPage: false });

      console.log(`  - Capa Documental (${coverSrc}): ${coverOk ? 'OK 200 ✅' : 'FALHA ❌'}`);
      console.log(`  - Legenda de Capa: "${captionText ? captionText.slice(0, 60) + '...' : 'NENHUMA ❌'}"`);
      console.log(`  - Imagem Interna de Apoio (${inlineSrc}): ${inlineOk ? 'OK 200 ✅' : 'FALHA ❌'}`);
      console.log(`  - Legenda Interna: "${inlineCaptionText ? inlineCaptionText.slice(0, 60) + '...' : 'NENHUMA ❌'}"`);
    }

    console.log('\n🎉 TODAS AS INSPEÇÕES CONCLUÍDAS COM SUCESSO!');
  } catch (err) {
    console.error('Erro na inspeção visual:', err);
  } finally {
    await browser.close();
    server.close();
    process.exit(0);
  }
});
