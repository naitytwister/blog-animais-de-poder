// @ts-check
/**
 * scripts/deep-map-all-groups.mjs
 * 
 * Mapeamento Profundo de Todos os Grupos do Usuário:
 * - Rola a página de grupos 20 vezes para vencer o infinite scroll do Facebook.
 * - Coleta tanto grupos gerenciados quanto grupos onde é membro.
 * - Classifica por relevância ao nicho de animais de poder, espiritualidade, sonhos e afins.
 */

import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const debugDir = path.resolve(process.env.LOCALAPPDATA || '', 'Google/Chrome/User Data Debug');
const OUTPUT_ALL = path.resolve('scripts/all-user-groups.json');
const OUTPUT_AFFINITY = path.resolve('scripts/affinity-groups.json');

async function deepMap() {
  console.log('🚀 Conectando ao Chrome para Mapeamento Profundo de Grupos...');
  const context = await chromium.launchPersistentContext(debugDir, {
    channel: 'chrome',
    headless: true,
  });

  const page = context.pages()[0] || (await context.newPage());

  console.log('🌐 Acessando https://www.facebook.com/groups/joins/ ...');
  await page.goto('https://www.facebook.com/groups/joins/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5000);

  console.log('📜 Realizando 15 ciclos de scroll para carregar todos os grupos...');
  for (let i = 0; i < 15; i++) {
    await page.evaluate(() => window.scrollBy(0, 2000));
    await page.waitForTimeout(1500);
  }

  // Extrai da página de joins
  const joinedGroups = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="/groups/"]'));
    const map = new Map();

    for (const a of anchors) {
      const href = a.getAttribute('href') || a.href || '';
      const rawText = (a.innerText || '').trim();
      const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
      const name = lines[0] || '';

      const ignored = ['feed', 'discover', 'joins', 'create', 'search', 'notifications', 'Grupos', 'Seus grupos'];
      if (
        name &&
        name.length > 2 &&
        !ignored.includes(name) &&
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

  // Também acessa a página inicial de grupos para pegar grupos gerenciados e atalhos
  console.log('🌐 Acessando https://www.facebook.com/groups/feed/ ...');
  await page.goto('https://www.facebook.com/groups/feed/', { waitUntil: 'domcontentloaded', timeout: 35000 });
  await page.waitForTimeout(4000);

  for (let i = 0; i < 8; i++) {
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(1200);
  }

  const feedGroups = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="/groups/"]'));
    const map = new Map();

    for (const a of anchors) {
      const href = a.getAttribute('href') || a.href || '';
      const rawText = (a.innerText || '').trim();
      const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
      const name = lines[0] || '';

      const ignored = ['feed', 'discover', 'joins', 'create', 'search', 'notifications', 'Grupos', 'Seus grupos'];
      if (
        name &&
        name.length > 2 &&
        !ignored.includes(name) &&
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

  await context.close();

  // Une todos os grupos
  const masterMap = new Map();
  for (const g of [...joinedGroups, ...feedGroups]) {
    if (!masterMap.has(g.url)) {
      masterMap.set(g.url, g.name);
    }
  }

  const allGroups = Array.from(masterMap.entries()).map(([url, name]) => ({ name, url }));
  fs.writeFileSync(OUTPUT_ALL, JSON.stringify(allGroups, null, 2), 'utf-8');
  console.log(`\n📦 Total de grupos descobertos no Facebook: ${allGroups.length}`);

  // Palavras-chave amplas de nicho e afinidade
  const keywords = [
    'espirit', 'magia', 'ocultis', 'wicca', 'bruxa', 'xaman', 'feitiç', 'oracul', 'filosof',
    'mistica', 'esoter', 'sonho', 'arquetip', 'jung', 'conscien', 'reiki', 'terapia', 'astrolog',
    'sagrado', 'tarot', 'holistic', 'energia', 'insights', 'animotem', 'cura', 'psico', 'umbanda',
    'candombl', 'natureza', 'pagan', 'deus', 'universo', 'mental', 'vibrac', 'fronteiras', 'livro', 'pdf'
  ];

  const affinity = allGroups.filter(g => {
    const lower = g.name.toLowerCase();
    return keywords.some(k => lower.includes(k));
  });

  // Garante que os grupos já testados permaneçam
  const existingAffinity = fs.existsSync(OUTPUT_AFFINITY) ? JSON.parse(fs.readFileSync(OUTPUT_AFFINITY, 'utf-8')) : [];
  for (const eg of existingAffinity) {
    if (!affinity.some(a => a.url === eg.url)) {
      affinity.push(eg);
    }
  }

  fs.writeFileSync(OUTPUT_AFFINITY, JSON.stringify(affinity, null, 2), 'utf-8');

  console.log(`\n🔮 Grupos de Afinidade Filtrados (${affinity.length}):`);
  console.table(affinity.map((g, i) => ({ '#': i + 1, Nome: g.name, URL: g.url })));

  console.log(`\n💾 Lista completa salva em: ${OUTPUT_ALL}`);
  console.log(`💾 Lista de afinidade salva em: ${OUTPUT_AFFINITY}`);
}

deepMap().catch(console.error);
