// @ts-check
import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const debugDir = path.resolve(process.env.LOCALAPPDATA || '', 'Google/Chrome/User Data Debug');

async function findAllGroups() {
  console.log('🚀 Conectando ao Chrome para mapear TODOS os grupos com scroll profundo...');
  const context = await chromium.launchPersistentContext(debugDir, {
    channel: 'chrome',
    headless: true,
  });

  const page = context.pages()[0] || (await context.newPage());
  
  // 1. Acessa a página de grupos
  await page.goto('https://www.facebook.com/groups/joins/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);

  // 2. Faz scroll para baixo várias vezes para carregar a lista completa de grupos
  console.log('📜 Rolando a página para carregar todos os grupos vinculados...');
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(1500);
  }

  // 3. Extrai links e nomes
  const rawGroups = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="/groups/"]'));
    const map = new Map();

    for (const a of anchors) {
      const href = a.getAttribute('href') || a.href || '';
      const rawText = (a.innerText || '').trim();
      const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
      const name = lines[0] || '';

      // Ignora links de menu/sistema
      if (
        name &&
        name.length > 2 &&
        !['feed', 'discover', 'joins', 'create', 'search', 'notifications', 'Grupos', 'Seus grupos'].includes(name) &&
        !['/feed/', '/discover/', '/joins/', '/create/'].some(s => href.includes(s))
      ) {
        const cleanMatch = href.match(/https:\/\/www\.facebook\.com\/groups\/([^/?]+)/) || href.match(/\/groups\/([^/?]+)/);
        if (cleanMatch) {
          const cleanUrl = `https://www.facebook.com/groups/${cleanMatch[1]}/`;
          if (!map.has(cleanUrl)) {
            map.set(cleanUrl, name);
          }
        }
      }
    }

    return Array.from(map.entries()).map(([url, name]) => ({ name, url }));
  });

  // Também pega grupos pelo feed lateral se tiver
  await page.goto('https://www.facebook.com/groups/feed/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(1000);
  }

  const feedGroups = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="/groups/"]'));
    const map = new Map();

    for (const a of anchors) {
      const href = a.getAttribute('href') || a.href || '';
      const lines = (a.innerText || '').split('\n').map(l => l.trim()).filter(Boolean);
      const name = lines[0] || '';

      if (
        name &&
        name.length > 2 &&
        !['feed', 'discover', 'joins', 'create', 'search', 'notifications', 'Grupos', 'Seus grupos'].includes(name) &&
        !['/feed/', '/discover/', '/joins/', '/create/'].some(s => href.includes(s))
      ) {
        const cleanMatch = href.match(/https:\/\/www\.facebook\.com\/groups\/([^/?]+)/) || href.match(/\/groups\/([^/?]+)/);
        if (cleanMatch) {
          const cleanUrl = `https://www.facebook.com/groups/${cleanMatch[1]}/`;
          map.set(cleanUrl, name);
        }
      }
    }
    return Array.from(map.entries()).map(([url, name]) => ({ name, url }));
  });

  await context.close();

  // Combina e remove duplicatas
  const allMap = new Map();
  for (const g of [...rawGroups, ...feedGroups]) {
    if (!allMap.has(g.url)) {
      allMap.set(g.url, g.name);
    }
  }

  const allGroups = Array.from(allMap.entries()).map(([url, name]) => ({ name, url }));

  // Palavras-chave de afinidade espiritual / xamânica / esotérica / autoconhecimento / sonhos
  const affinityKeywords = [
    'espirit', 'magia', 'ocultis', 'wicca', 'bruxa', 'xaman', 'feitiç', 'oracul', 'filosof',
    'mistica', 'esoter', 'sonho', 'arquetip', 'jung', 'conscien', 'reiki', 'terapia', 'astrolog',
    'sagrado', 'tarot', 'holistic', 'energia', 'insights', 'animotem'
  ];

  const affinityGroups = allGroups.filter(g => {
    const lower = g.name.toLowerCase();
    return affinityKeywords.some(k => lower.includes(k));
  });

  // Sempre inclui o grupo que já testamos com 212k membros se não estiver
  const testGroupUrl = 'https://www.facebook.com/groups/245822958802180/';
  if (!affinityGroups.some(g => g.url === testGroupUrl)) {
    affinityGroups.unshift({
      name: 'Wicca, Magia, Bruxaria, Paganismo, Ocultismo, Espiritualidade e Feitiçaria',
      url: testGroupUrl
    });
  }

  console.log(`\n🔮 Grupos de Afinidade e Potencial de Viralização Identificados (${affinityGroups.length}):`);
  console.table(affinityGroups);

  const outputPath = path.resolve('scripts/affinity-groups.json');
  fs.writeFileSync(outputPath, JSON.stringify(affinityGroups, null, 2), 'utf-8');
  console.log(`\n💾 Salvo em: ${outputPath}`);
}

findAllGroups().catch(console.error);
