// @ts-check
/**
 * scripts/daily-routine.mjs
 * 
 * Rotina Diária Automática do Animotem (Ponytail Mode)
 * 1. Verifica se a rotina já foi executada hoje (evita duplicatas).
 * 2. Seleciona o próximo animal prioritário da fila de roubo de tráfego.
 * 3. Valida a integridade do post e das imagens.
 * 4. Dispara a indexação instantânea no Bing/IndexNow (status 200/202).
 * 5. Publica no grupo de Espiritualidade/Ocultismo via Playwright.
 * 6. Registra no histórico local (ignorado pelo git).
 * 
 * Uso:
 *   node scripts/daily-routine.mjs
 *   node scripts/daily-routine.mjs --force
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = path.resolve('.');
const HISTORY_FILE = path.join(ROOT, '.browser-session/daily-history.json');

// Fila ordenada dos 13 animais mais vulneráveis da concorrência
const TARGET_QUEUE = [
  { slug: 'animal-de-poder-coruja-chamado-secreto-adiar-fim', name: 'Coruja' },
  { slug: 'animal-de-poder-tubarao', name: 'Tubarão' },
  { slug: 'animal-de-poder-cachorro', name: 'Cachorro' },
  { slug: 'animal-de-poder-gato-guardiao-do-umbral', name: 'Gato' },
  { slug: 'lobo-animal-de-poder-protecao-alcateia-lealdade', name: 'Lobo' },
  { slug: 'olhar-da-onca-jaguar-animal-de-poder', name: 'Onça' },
  { slug: 'a-visao-mais-ampla-que-o-horizonte-sabedoria-aguia', name: 'Águia' },
  { slug: 'a-metamorfose-silenciosa-medicina-transformativa-borboleta', name: 'Borboleta' },
  { slug: 'guardiao-do-tempo-rapido-animal-de-poder-beija-flor', name: 'Beija-Flor' },
  { slug: 'cobra-serpente-animal-de-poder-renascimento', name: 'Cobra' },
  { slug: 'cavalo-de-poder-travessia-liberdade-interior', name: 'Cavalo' },
  { slug: 'o-grande-retiro-urso-medicina-forca-silenciosa', name: 'Urso' },
  { slug: 'a-tecelaa-do-universo-animal-de-poder-aranha-medicina-da-criacao', name: 'Aranha' },
];

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    }
  } catch {}
  return { lastRunDate: null, publishedSlugs: [] };
}

function saveHistory(history) {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
}

async function run() {
  console.log('='.repeat(60));
  console.log('🌅 ANIMOTEM — Rotina Diária de Publicação e Indexação');
  console.log('='.repeat(60));

  const today = getTodayString();
  const history = loadHistory();
  const isForce = process.argv.includes('--force');

  if (history.lastRunDate === today && !isForce) {
    console.log(`✅ A rotina diária de hoje (${today}) JÁ FOI EXECUTADA.`);
    console.log(`Último animal compartilhado: ${history.publishedSlugs[history.publishedSlugs.length - 1]}`);
    console.log(`(Para forçar uma nova execução hoje, use: node scripts/daily-routine.mjs --force)`);
    return;
  }

  // Encontra o próximo da fila que ainda não foi compartilhado
  let nextItem = TARGET_QUEUE.find((item) => !history.publishedSlugs.includes(item.slug));
  if (!nextItem) {
    // Se todos da lista já foram, pega o primeiro novamente (rotação)
    nextItem = TARGET_QUEUE[0];
  }

  console.log(`\n📅 Data: ${today}`);
  console.log(`🎯 Animal do Dia: ${nextItem.name} (${nextItem.slug})`);

  // 1. Verificação de integridade
  console.log('\n[Etapa 1/3] Validando integridade de imagens e posts...');
  try {
    execSync('node scripts/verify-posts.mjs', { stdio: 'inherit' });
  } catch {
    console.error('❌ Falha na verificação de posts. Abortando rotina.');
    process.exit(1);
  }

  // 2. Disparo IndexNow para busca
  console.log('\n[Etapa 2/3] Submetendo URLs ao IndexNow (Bing/Yandex/motores)...');
  try {
    execSync('node scripts/indexnow.mjs', { stdio: 'inherit' });
  } catch (err) {
    console.warn('⚠️ Alerta no IndexNow:', err.message);
  }

  // 3. Publicação em todos os grupos de afinidade do nicho
  console.log('\n[Etapa 3/4] Publicando em todos os grupos de afinidade via Playwright...');
  try {
    execSync(`node scripts/post-to-all-affinity-groups.mjs --post ${nextItem.slug} --headless`, { stdio: 'inherit' });
    console.log('✅ Distribuição em grupos finalizada com sucesso!');
  } catch (err) {
    console.warn('⚠️ Alerta na distribuição do Facebook:', err.message);
  }

  // Aguarda liberação do lock do Chrome entre etapas que usam o mesmo perfil
  console.log('\n⏳ Aguardando liberação do perfil Chrome (5s)...');
  await new Promise((r) => setTimeout(r, 5000));

  // 4. Monitoramento de desempenho e comentário de links em posts aprovados
  console.log('\n[Etapa 4/4] Monitorando desempenho e comentários dos posts...');
  try {
    execSync('node scripts/track-posts.mjs', { stdio: 'inherit' });
  } catch (err) {
    console.warn('⚠️ Alerta no monitoramento:', err.message);
  }

  // Atualiza histórico
  history.lastRunDate = today;
  if (!history.publishedSlugs.includes(nextItem.slug)) {
    history.publishedSlugs.push(nextItem.slug);
  }
  saveHistory(history);

  console.log('\n🎉 ROTINA DIÁRIA CONCLUÍDA COM SUCESSO!');
  console.log(`Próxima execução agendada para amanhã ou na próxima abertura do Antigravity.`);
}

run().catch(console.error);
