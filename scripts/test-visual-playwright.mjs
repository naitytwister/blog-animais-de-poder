import { chromium } from '@playwright/test';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Servidor estático simples servindo a pasta dist/
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
  console.log(`Servidor local rodando na porta ${PORT}`);
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });

    console.log('Navegando para http://localhost:4321/recomendacoes/...');
    await page.goto(`http://localhost:${PORT}/recomendacoes/`, { waitUntil: 'networkidle' });

    const resultsDir = path.resolve('test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const screenshotPath = path.join(resultsDir, 'recomendacoes-visual.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot salvo com sucesso em: ${screenshotPath}`);

    // Testar carregamento das imagens de produtos
    const images = await page.$$eval('.amazon-card-image-wrap img', (imgs) =>
      imgs.map((img) => ({
        src: img.src,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
      }))
    );

    console.log('\n--- VERIFICAÇÃO VISUAL DAS IMAGENS ---');
    let allPassed = true;
    images.forEach((img, idx) => {
      const ok = img.complete && img.naturalWidth > 0;
      if (!ok) allPassed = false;
      console.log(`[Card ${idx + 1}] ${img.src} -> ${ok ? 'OK ✅' : 'FALHA ❌'}`);
    });

    console.log(allPassed ? '\n✅ TODAS AS IMAGENS CARREGARAM PERFEITAMENTE!' : '\n❌ ALGUMAS IMAGENS FALHARAM');

    await browser.close();
  } catch (err) {
    console.error('Erro durante teste visual:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
