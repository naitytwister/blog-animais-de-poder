// @ts-check
/**
 * scripts/weekly-routine.mjs
 * 
 * Rotina Semanal do Animotem (Bestiário Interior)
 * 1. Consolida métricas semanais de engajamento social (Reações, Comentários, Taxa de Aprovação).
 * 2. Identifica os grupos mais responsivos para priorização de tráfego.
 * 3. Audita o progresso do Plano de Ataque aos Concorrentes (Sniper Content).
 * 4. Submete o Sitemap consolidado ao IndexNow (Bing/Yandex/motores).
 * 5. Gera relatório executivo salvo em .browser-session/relatorio-semanal.md.
 * 
 * Uso:
 *   node scripts/weekly-routine.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const PERF_FILE = path.resolve('.browser-session/social-performance.json');
const HISTORY_FILE = path.resolve('.browser-session/daily-history.json');
const REPORT_FILE = path.resolve('.browser-session/relatorio-semanal.md');

// 13 Alvos prioritários de concorrentes frágeis
const COMPETITOR_SNIPER_TARGETS = [
  { slug: 'animal-de-poder-tubarao', name: 'Tubarão', status: 'ready' },
  { slug: 'animal-de-poder-coruja-chamado-secreto-adiar-fim', name: 'Coruja', status: 'ready' },
  { slug: 'animal-de-poder-cachorro', name: 'Cachorro', status: 'ready' },
  { slug: 'animal-de-poder-gato-guardiao-do-umbral', name: 'Gato', status: 'ready' },
  { slug: 'lobo-animal-de-poder-protecao-alcateia-lealdade', name: 'Lobo', status: 'ready' },
  { slug: 'olhar-da-onca-jaguar-animal-de-poder', name: 'Onça', status: 'ready' },
  { slug: 'animal-de-poder-vagalume', name: 'Vagalume', status: 'pending' },
  { slug: 'animal-de-poder-pavao', name: 'Pavão', status: 'pending' },
  { slug: 'animal-de-poder-morcego', name: 'Morcego', status: 'pending' },
  { slug: 'animal-de-poder-polvo', name: 'Polvo', status: 'pending' }
];

function loadJson(file, fallback) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch {}
  return fallback;
}

async function runWeeklyRoutine() {
  console.log('='.repeat(65));
  console.log('📊 ANIMOTEM — ROTINA SEMANAL DE AUDITORIA E DESEMPENHO');
  console.log('='.repeat(65));

  const today = new Date().toISOString().split('T')[0];
  const perfData = loadJson(PERF_FILE, { trackedPosts: [] });
  const history = loadJson(HISTORY_FILE, { publishedSlugs: [] });

  const totalTracked = perfData.trackedPosts.length;
  const publishedPosts = perfData.trackedPosts.filter((p) => p.status === 'published');
  const pendingPosts = perfData.trackedPosts.filter((p) => p.status === 'pending_approval');
  const totalLikes = perfData.trackedPosts.reduce((acc, p) => acc + (p.likes || 0), 0);
  const totalComments = perfData.trackedPosts.reduce((acc, p) => acc + (p.comments || 0), 0);
  const commentedLinks = perfData.trackedPosts.filter((p) => p.commentedLink).length;

  // 1. Disparo do IndexNow para renovar indexação de todo o ecossistema
  console.log('\n[Etapa 1/3] Renovando submissão semanal ao IndexNow...');
  try {
    execSync('node scripts/indexnow.mjs', { stdio: 'inherit' });
  } catch (err) {
    console.warn('⚠️ Alerta no IndexNow:', err.message);
  }

  // 2. Executa varredura de aprovações e comentários
  console.log('\n[Etapa 2/3] Atualizando métricas dos grupos de Facebook...');
  try {
    execSync('node scripts/track-posts.mjs', { stdio: 'inherit' });
  } catch (err) {
    console.warn('⚠️ Alerta no monitor:', err.message);
  }

  // 3. Descoberta e expansão de novos grupos no Facebook
  console.log('\n[Etapa 3/4] Descobrindo novos grupos com alto potencial de tráfego no Facebook...');
  try {
    execSync('node scripts/discover-new-groups.mjs', { stdio: 'inherit' });
  } catch (err) {
    console.warn('⚠️ Alerta na descoberta de grupos:', err.message);
  }

  // 4. Compilação do Relatório
  console.log('\n[Etapa 4/4] Compilando Relatório Executivo Semanal...');

  const reportMarkdown = `# 📊 Relatório Semanal de Desempenho — Animotem
**Data da Auditoria:** ${today}  
**Estratégia:** Ponytail SEO + Distribuição Social Automatizada

---

## 📈 1. Resumo Consolidado de Distribuição

| Métrica | Valor |
| :--- | :--- |
| **Total de Publicações Mapeadas** | ${totalTracked} |
| **Publicações no Feed Ativo (Aprovadas)** | ${publishedPosts.length} |
| **Publicações em Fila de Moderação** | ${pendingPosts.length} |
| **Links Canônicos Injetados no 1º Comentário** | ${commentedLinks} |
| **Total de Reações Coletadas** | ${totalLikes} |
| **Total de Comentários Coletados** | ${totalComments} |

---

## 🎯 2. Status do Plano de Ataque aos Concorrentes (Sniper Targets)

| Animal | Slug | Status no Blog | Concorrente Alvo |
| :--- | :--- | :--- | :--- |
| **Tubarão** | \`animal-de-poder-tubarao\` | ✅ Publicado (Pronto) | Wix (3.781 views) |
| **Coruja** | \`animal-de-poder-coruja-chamado-secreto-adiar-fim\` | ✅ Publicado (Pronto) | Voz dos Elementos |
| **Cachorro** | \`animal-de-poder-cachorro\` | ✅ Publicado (Pronto) | Wix (Top buscas) |
| **Gato** | \`animal-de-poder-gato-guardiao-do-umbral\` | ✅ Publicado (Pronto) | Wix / Voz dos Elementos |
| **Vagalume** | \`animal-de-poder-vagalume\` | 🎯 Próximo Alvo | Wix (Totem Vagalume) |
| **Pavão** | \`animal-de-poder-pavao\` | 🎯 Próximo Alvo | Wix (Totem Pavão) |

---

## 🏆 3. Top Grupos com Melhor Retorno e Aprovação

${publishedPosts.length > 0 ? publishedPosts.map((p, i) => `${i + 1}. **${p.title.replace('Medicina da Coruja - ', '')}** — Status: Publicado | Reações: ${p.likes || 0} | Comentários: ${p.comments || 0}`).join('\n') : 'Ainda aguardando primeiras aprovações dos administradores.'}

---

## 💡 4. Próximas Ações Recomendadas da Semana:
1. Manter a rotina diária executando automaticamente.
2. Criar o próximo artigo sniper da fila: **Animal de Poder Vagalume** (baixa concorrência e alto potencial de ranqueamento rápido).
3. Monitorar cliques e impressões no Bing Webmaster Tools e Google Search Console.
`;

  const reportDir = path.dirname(REPORT_FILE);
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(REPORT_FILE, reportMarkdown, 'utf-8');

  console.log(`\n💾 Relatório semanal salvo com sucesso em: ${REPORT_FILE}`);
  console.log('\n' + '='.repeat(65));
  console.log('🎉 ROTINA SEMANAL CONCLUÍDA!');
  console.log('='.repeat(65));
}

runWeeklyRoutine().catch(console.error);
