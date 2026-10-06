// @ts-check
import { chromium } from '@playwright/test';
import path from 'node:path';

const debugDir = path.resolve(process.env.LOCALAPPDATA || '', 'Google/Chrome/User Data Debug');

async function run() {
  console.log('🚀 Iniciando Playwright com perfil do Chrome em:', debugDir);
  const context = await chromium.launchPersistentContext(debugDir, {
    channel: 'chrome',
    headless: false, // Mantém a janela visível para o usuário
    viewport: { width: 1280, height: 850 },
    args: ['--disable-blink-features=AutomationControlled', '--start-maximized'],
  });

  const page = context.pages()[0] || (await context.newPage());
  console.log('🌐 Acessando https://www.facebook.com/groups/feed/ ...');
  await page.goto('https://www.facebook.com/groups/feed/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);

  const title = await page.title();
  console.log('📄 Título da página:', title);

  const screenshotPath = path.resolve('test-results/social-share/persistent-direct-feed.png');
  await page.screenshot({ path: screenshotPath });
  console.log('📸 Screenshot salvo em:', screenshotPath);

  // Mapeia os grupos visíveis na barra lateral
  const groups = await page.$$eval('a[href*="/groups/"]', (anchors) => {
    const list = [];
    const seen = new Set();
    for (const a of anchors) {
      const name = (a.innerText || '').trim();
      const href = a.href;
      if (
        name &&
        !name.includes('\n') &&
        name.length > 3 &&
        !['feed', 'discover', 'joins', 'create', 'search'].some((w) => href.endsWith(`/${w}/`))
      ) {
        const match = href.match(/https:\/\/www\.facebook\.com\/groups\/[^/?]+/);
        if (match) {
          const cleanUrl = match[0] + '/';
          if (!seen.has(cleanUrl)) {
            seen.add(cleanUrl);
            list.push({ name, url: cleanUrl });
          }
        }
      }
    }
    return list;
  });

  console.log(`\n🎯 Grupos encontrados (${groups.length}):`);
  console.table(groups);

  // Mantém a janela aberta e interativa enquanto você quiser
  console.log('\n✅ Janela do Chrome mantida aberta e conectada!');
  console.log('Aguardando 30 segundos mantendo a janela aberta...');
  await page.waitForTimeout(30000);

  await context.close();
  console.log('🏁 Concluído.');
}

run().catch(console.error);
