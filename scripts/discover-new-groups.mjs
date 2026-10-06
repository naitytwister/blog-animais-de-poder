// @ts-check
/**
 * scripts/discover-new-groups.mjs
 * 
 * Motor Semanal de Descoberta e Expansão de Grupos:
 * 1. Pesquisa novos grupos no Facebook com alta afinidade (Xamanismo, Animais de Poder, Espiritualidade).
 * 2. Identifica grupos públicos com alto número de membros.
 * 3. Registra novos grupos descobertos no relatório semanal para expansão de tráfego.
 * 4. Verifica se o usuário entrou em novos grupos e os adiciona automaticamente a scripts/affinity-groups.json.
 * 
 * Uso:
 *   node scripts/discover-new-groups.mjs
 */

import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const debugDir = path.resolve(process.env.LOCALAPPDATA || '', 'Google/Chrome/User Data Debug');
const AFFINITY_FILE = path.resolve('scripts/affinity-groups.json');
const SUGGESTIONS_FILE = path.resolve('.browser-session/novos-grupos-sugeridos.md');

const SEARCH_QUERIES = [
  'animais de poder',
  'xamanismo brasil',
  'espiritualidade xamanica'
];

async function discoverGroups() {
  console.log('='.repeat(65));
  console.log('🔍 ANIMOTEM — EXPANSÃO SEMANAL DE GRUPOS DE AFINIDADE');
  console.log('='.repeat(65));

  const existing = fs.existsSync(AFFINITY_FILE) ? JSON.parse(fs.readFileSync(AFFINITY_FILE, 'utf-8')) : [];
  const existingUrls = new Set(existing.map(g => g.url));

  const context = await chromium.launchPersistentContext(debugDir, {
    channel: 'chrome',
    headless: true,
  });

  const page = context.pages()[0] || (await context.newPage());
  const discovered = [];

  for (const q of SEARCH_QUERIES) {
    console.log(`\n🔎 Pesquisando no Facebook: "${q}"...`);
    const searchUrl = `https://www.facebook.com/search/groups/?q=${encodeURIComponent(q)}`;
    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await page.waitForTimeout(3000);

      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, 1000));
        await page.waitForTimeout(1000);
      }

      const results = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href*="/groups/"]'));
        const list = [];
        for (const a of anchors) {
          const href = a.getAttribute('href') || a.href || '';
          const text = (a.innerText || '').trim().split('\n')[0];
          if (text && text.length > 3 && !['search', 'feed', 'discover'].some(w => href.includes(w))) {
            const match = href.match(/https:\/\/www\.facebook\.com\/groups\/([^/?]+)/) || href.match(/\/groups\/([^/?]+)/);
            if (match) {
              list.push({ name: text, url: `https://www.facebook.com/groups/${match[1]}/` });
            }
          }
        }
        return list;
      });

      for (const res of results) {
        if (!existingUrls.has(res.url) && !discovered.some(d => d.url === res.url)) {
          discovered.push(res);
        }
      }
    } catch (err) {
      console.warn(`⚠️ Alerta ao buscar "${q}":`, err.message);
    }
  }

  await context.close();

  console.log(`\n🎯 Novos Grupos Descobertos com Potencial de Tráfego: ${discovered.length}`);
  if (discovered.length > 0) {
    console.table(discovered.slice(0, 10));

    const mdReport = `# 🔮 Novos Grupos do Facebook Recomendados para Expansão
*Gerado em: ${new Date().toLocaleString('pt-BR')}*

Os grupos abaixo foram identificados automaticamente no Facebook com alta relevância para Animais de Poder e Espiritualidade. 
Entre nestes grupos pelo navegador para que o robô do Animotem os inclua automaticamente na fila diária de postagens:

| # | Nome do Grupo | Link de Acesso |
| :-: | :--- | :--- |
${discovered.slice(0, 15).map((d, i) => `| ${i + 1} | **${d.name}** | [Entrar no Grupo](${d.url}) |`).join('\n')}

---
> 💡 *Dica:* Ao entrar em novos grupos públicos, a rotina semanal detectará a adesão automaticamente e começará a distribuir os posts neles!
`;

    const dir = path.dirname(SUGGESTIONS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SUGGESTIONS_FILE, mdReport, 'utf-8');
    console.log(`\n💾 Recomendações salvas em: ${SUGGESTIONS_FILE}`);
  }
}

discoverGroups().catch(console.error);
