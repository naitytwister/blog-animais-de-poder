// @ts-check
import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const debugDir = path.resolve(process.env.LOCALAPPDATA || '', 'Google/Chrome/User Data Debug');

async function extract() {
  console.log('🔍 Extraindo links dos seus grupos de espiritualidade...');
  const context = await chromium.launchPersistentContext(debugDir, {
    channel: 'chrome',
    headless: true,
  });

  const page = context.pages()[0] || (await context.newPage());
  await page.goto('https://www.facebook.com/groups/feed/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const groups = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="/groups/"]'));
    const map = new Map();

    for (const a of anchors) {
      const href = a.getAttribute('href') || a.href || '';
      const lines = (a.innerText || '').split('\n').map((l) => l.trim()).filter(Boolean);
      const text = lines[0] || '';
      
      // Filtra links da barra lateral
      if (
        text &&
        text.length > 3 &&
        !['feed', 'discover', 'joins', 'create', 'search', 'notifications'].some((w) => href.includes(`/${w}`))
      ) {
        const fullUrl = a.href.split('?')[0].replace(/\/$/, '') + '/';
        if (!map.has(fullUrl)) {
          map.set(fullUrl, text);
        }
      }
    }

    return Array.from(map.entries()).map(([url, name]) => ({ name, url }));
  });

  // Filtra apenas os grupos relevantes ao nicho
  const spiritualKeywords = ['espiritual', 'espirita', 'magia', 'ocultismo', 'wicca', 'bruxaria', 'xaman', 'feitiço', 'oraculo', 'filosof'];
  const filtered = groups.filter((g) => {
    const lower = g.name.toLowerCase();
    return spiritualKeywords.some((k) => lower.includes(k));
  });

  console.log('\n🔮 Grupos Filtrados (Espiritualidade, Xamanismo e Ocultismo):');
  console.table(filtered);

  const outputPath = path.resolve('scripts/groups.json');
  fs.writeFileSync(outputPath, JSON.stringify(filtered, null, 2), 'utf-8');
  console.log(`\n💾 Salvo em: ${outputPath}`);

  await context.close();
}

extract().catch(console.error);
