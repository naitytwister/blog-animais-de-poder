// @ts-check
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const debugDir = path.resolve(process.env.LOCALAPPDATA || '', 'Google/Chrome/User Data Debug');

async function mapGroups() {
  console.log('🚀 Conectando ao Chrome (User Data Debug)...');
  const context = await chromium.launchPersistentContext(debugDir, {
    channel: 'chrome',
    headless: true,
  });
  const page = context.pages()[0] || (await context.newPage());

  console.log('🌐 Acessando https://www.facebook.com/groups/joins/ (Seus Grupos)...');
  await page.goto('https://www.facebook.com/groups/joins/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Extrai todos os links de grupos
  const groups = await page.$$eval('a[href*="/groups/"]', (anchors) => {
    const map = new Map();
    for (const a of anchors) {
      const text = (a.innerText || '').trim();
      const href = a.href;
      // Filtra links de navegação interna
      if (
        text &&
        !text.includes('\n') &&
        text.length > 3 &&
        !['feed', 'discover', 'joins', 'create', 'search'].some((w) => href.endsWith(`/${w}/`))
      ) {
        // Normaliza a URL do grupo
        const match = href.match(/https:\/\/www\.facebook\.com\/groups\/[^/?]+/);
        if (match) {
          const cleanUrl = match[0] + '/';
          if (!map.has(cleanUrl)) {
            map.set(cleanUrl, text);
          }
        }
      }
    }
    return Array.from(map.entries()).map(([url, name]) => ({ name, url }));
  });

  console.log(`\n🎯 Encontrados ${groups.length} grupos mapeados:`);
  console.table(groups);

  const outputPath = path.resolve('scripts/groups.json');
  fs.writeFileSync(outputPath, JSON.stringify(groups, null, 2), 'utf-8');
  console.log(`\n💾 Lista de grupos salva em: ${outputPath}`);
}

mapGroups().catch(console.error);
