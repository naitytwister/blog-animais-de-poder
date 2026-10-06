// @ts-check
/**
 * scripts/post-to-all-affinity-groups.mjs
 * 
 * Distribuição Massiva em Grupos de Afinidade (Ponytail Multi-Group Engine)
 * - Mapeia e itera por todos os grupos de espiritualidade, xamanismo e ocultismo.
 * - Evita republicação no mesmo grupo no mesmo dia.
 * - Aplica variações de chamada (anti-spam) e upload da imagem oficial.
 * - Comenta o link canônico imediatamente caso o grupo não exija aprovação prévia.
 * - Se exigir aprovação prévia, registra em social-performance.json para o monitor comentar assim que aprovado.
 * 
 * Uso:
 *   node scripts/post-to-all-affinity-groups.mjs
 *   node scripts/post-to-all-affinity-groups.mjs --post animal-de-poder-coruja-chamado-secreto-adiar-fim
 */

import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const debugDir = path.resolve(process.env.LOCALAPPDATA || '', 'Google/Chrome/User Data Debug');
const resultsDir = path.resolve('test-results/social-share');
const PERF_FILE = path.resolve('.browser-session/social-performance.json');
const GROUPS_FILE = path.resolve('scripts/affinity-groups.json');

if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Argumentos
const args = process.argv.slice(2);
const postIdx = args.indexOf('--post');
const POST_SLUG = postIdx !== -1 ? args[postIdx + 1] : 'animal-de-poder-tubarao';
const CANONICAL_URL = `https://animotem.com/posts/${POST_SLUG}/`;
const isHeadless = args.includes('--headless') || process.env.HEADLESS === 'true';

// Carrega dados do post a partir do Markdown
function loadPostMeta(slug) {
  const postsDir = path.resolve('src/content/posts');
  const filePath = path.join(postsDir, `${slug}.md`);
  let title = 'Animal de Poder';
  let desc = 'Descubra a medicina ancestral e os ensinamentos espirituais desse arquétipo sagrado.';
  let imgPath = path.resolve(`public/images/${slug}.jpg`);

  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const t = raw.match(/title:\s*["']?([^"'\r\n]+)["']?/);
    const d = raw.match(/description:\s*["']?([^"'\r\n]+)["']?/);
    const img = raw.match(/imagem_capa:\s*["']?([^"'\r\n]+)["']?/);
    if (t) title = t[1];
    if (d) desc = d[1];
    if (img) imgPath = path.resolve('public', img[1].replace(/^\//, ''));
  }

  return { title, desc, imgPath };
}

const postMeta = loadPostMeta(POST_SLUG);
const IMG_PATH = postMeta.imgPath;

// Variações de texto dinâmicas para qualquer animal (Anti-Spam Facebook)
const HOOK_VARIATIONS = [
  `🌿 ${postMeta.title}

${postMeta.desc}

Você tem sentido a presença ou sonhado com essa energia ultimamente?

👇 Compartilhei o estudo completo com a medicina ancestral e rituais no primeiro comentário.`,

  `✨ Sabedoria Ancestral & Xamanismo: ${postMeta.title}

${postMeta.desc}

Quem aqui carrega esse arquétipo como guardião ou totem pessoal?

👇 Deixei o estudo completo com o significado dos sonhos e mitologia no primeiro comentário.`,

  `🌊 O Chamado do Guardião Interior: ${postMeta.title}

${postMeta.desc}

Você costuma ter sonhos ou sincronicidades com esse animal de poder?

👇 Compartilhei o guia aprofundado com a sabedoria ancestral no 1º comentário.`
];

function loadPerformanceData() {
  try {
    if (fs.existsSync(PERF_FILE)) {
      return JSON.parse(fs.readFileSync(PERF_FILE, 'utf-8'));
    }
  } catch {}
  return { trackedPosts: [] };
}

function savePerformanceData(data) {
  const dir = path.dirname(PERF_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(PERF_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function loadAffinityGroups() {
  if (fs.existsSync(GROUPS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(GROUPS_FILE, 'utf-8'));
    } catch {}
  }
  return [];
}

async function runMultiGroupDistribution() {
  console.log('='.repeat(65));
  console.log('🚀 ANIMOTEM — DISTRIBUIÇÃO MULTI-GRUPOS DE ALTA AFINIDADE');
  console.log('='.repeat(65));
  console.log(`📄 Post Alvo: ${POST_SLUG}`);
  console.log(`📌 Título: "${postMeta.title}"`);
  console.log(`🔗 Link Canônico: ${CANONICAL_URL}`);
  console.log(`🖼️  Imagem: ${fs.existsSync(IMG_PATH) ? IMG_PATH : 'Pendente'}`);
  console.log(`🕶️  Modo: ${isHeadless ? 'Headless (Segundo Plano Silencioso)' : 'Visível (Janela Aberta)'}`);

  const allGroups = loadAffinityGroups();
  if (allGroups.length === 0) {
    console.error('❌ Nenhum grupo de afinidade encontrado em scripts/affinity-groups.json.');
    return;
  }

  const perfData = loadPerformanceData();

  console.log(`\n📋 ${allGroups.length} grupos de afinidade mapeados na fila:`);
  allGroups.forEach((g, i) => console.log(`  [${i + 1}] ${g.name} -> ${g.url}`));

  console.log('\n🚀 Conectando ao Chrome (User Data Debug)...');
  const context = await chromium.launchPersistentContext(debugDir, {
    channel: 'chrome',
    headless: isHeadless,
    viewport: { width: 1280, height: 850 },
    args: ['--disable-blink-features=AutomationControlled', '--start-maximized'],
  });

  const page = context.pages()[0] || (await context.newPage());

  let successCount = 0;
  let alreadyPostedCount = 0;

  for (let idx = 0; idx < allGroups.length; idx++) {
    const group = allGroups[idx];
    console.log('\n' + '-'.repeat(65));
    console.log(`📢 [${idx + 1}/${allGroups.length}] Processando Grupo: ${group.name}`);
    console.log(`🌐 URL: ${group.url}`);

    // Verifica se já postamos este slug neste grupo
    const existing = perfData.trackedPosts.find(p => p.slug === POST_SLUG && (p.groupUrl === group.url || group.url.includes(p.groupUrl) || p.groupUrl.includes(group.url)));
    if (existing) {
      console.log(`⏩ Já postado anteriormente neste grupo (Status atual: ${existing.status}). Pulando.`);
      alreadyPostedCount++;
      continue;
    }

    try {
      await page.goto(group.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(4000);

      // Verifica se a página carregou
      const pageTitle = await page.title();
      console.log(`📌 Página do grupo carregada: "${pageTitle}"`);

      // Procura caixa de criação de publicação
      const postBoxSelectors = [
        'text=Escreva algo...',
        'text=No que você está pensando',
        'div[role="button"]:has-text("Escreva algo")',
        'div[role="button"]:has-text("No que você está pensando")',
        'div[role="button"]:has-text("Crie uma publicação")',
        'div[role="region"] div[role="button"]'
      ];

      let opened = false;
      for (const sel of postBoxSelectors) {
        const loc = page.locator(sel).first();
        if ((await loc.count()) > 0 && (await loc.isVisible())) {
          console.log(`👉 Abrindo formulário de postagem...`);
          await loc.click();
          opened = true;
          break;
        }
      }

      if (!opened) {
        console.warn(`⚠️ Não foi possível encontrar a caixa de publicação em: ${group.name}. O grupo pode ter regras restritas de postagem.`);
        continue;
      }

      await page.waitForTimeout(3000);

      // Localiza o editor de texto
      const editor = page.locator('div[role="dialog"] div[role="textbox"][contenteditable="true"]').first();
      await editor.waitFor({ state: 'visible', timeout: 10000 });
      await editor.click();
      await page.waitForTimeout(500);

      // Seleciona uma variação de copy
      const copyText = HOOK_VARIATIONS[idx % HOOK_VARIATIONS.length];
      console.log('✍️ Digitando post com variação anti-spam...');
      await editor.pressSequentially(copyText, { delay: 20 });
      await page.waitForTimeout(1500);

      // Upload da imagem
      if (fs.existsSync(IMG_PATH)) {
        console.log('🖼️ Anexando imagem...');
        const fileInput = page.locator('div[role="dialog"] input[type="file"][accept*="image"]').first();
        if ((await fileInput.count()) > 0) {
          await fileInput.setInputFiles(IMG_PATH);
        } else {
          const photoBtn = page.locator('div[role="dialog"] div[aria-label*="Foto/vídeo"], div[role="dialog"] div[aria-label*="Photo/video"]').first();
          if (await photoBtn.isVisible()) {
            const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null);
            await photoBtn.click();
            const fileChooser = await fileChooserPromise;
            if (fileChooser) await fileChooser.setFiles(IMG_PATH);
          }
        }
        // Aguarda processamento da imagem pelo Facebook
        await page.waitForTimeout(5000);
      }

      // Aguarda botão Postar ficar habilitado
      console.log('⏳ Aguardando liberação do botão Postar...');
      await page.waitForFunction(() => {
        const btn = document.querySelector('div[role="dialog"] div[aria-label="Postar"][role="button"]');
        return btn && btn.getAttribute('aria-disabled') !== 'true';
      }, { timeout: 20000 }).catch(() => null);

      const submitBtn = page.locator('div[role="dialog"] div[aria-label="Postar"][role="button"]').first();
      console.log('🚀 Clicando em "Postar"...');
      await submitBtn.click({ force: true });

      // Fallback nativo
      await page.evaluate(() => {
        const btn = document.querySelector('div[role="dialog"] div[aria-label="Postar"][role="button"]');
        if (btn && btn.getAttribute('aria-disabled') !== 'true') {
          /** @type {HTMLElement} */ (btn).click();
        }
      });

      // Aguarda fechamento do modal
      await page.waitForSelector('div[role="dialog"]', { state: 'hidden', timeout: 20000 }).catch(() => null);
      await page.waitForTimeout(4000);

      // Verifica status de aprovação
      const pageText = await page.innerText('body');
      const isPending = pageText.includes('Aguardando aprovação do administrador') || pageText.includes('enviada aos administradores');

      const record = {
        slug: POST_SLUG,
        title: `${postMeta.title} - ${group.name}`,
        groupUrl: group.url,
        canonicalUrl: CANONICAL_URL,
        status: isPending ? 'pending_approval' : 'published',
        commentedLink: false,
        likes: 0,
        comments: 0,
        lastChecked: new Date().toISOString()
      };

      if (isPending) {
        console.log(`⏳ Post em moderação no grupo "${group.name}".`);
        console.log('ℹ️ O link será adicionado automaticamente pelo monitor (track-posts) assim que o admin aprovar.');
      } else {
        console.log(`🎉 Post publicado diretamente no feed de "${group.name}"!`);
        console.log('💬 Comentando o link canônico agora no 1º comentário...');
        try {
          const commentActionBtn = page.locator('div[role="button"]:has-text("Comentar")').first();
          if (await commentActionBtn.isVisible()) {
            await commentActionBtn.click();
            await page.waitForTimeout(1000);
          }

          const commentBox = page.locator('div[role="textbox"][aria-label*="Comentar"], div[role="textbox"][aria-label*="Escreva um comentário"]').first();
          if (await commentBox.isVisible()) {
            await commentBox.click();
            await commentBox.pressSequentially(`🔗 Estudo completo com a medicina ancestral, significado nos sonhos e rituais: ${CANONICAL_URL}`, { delay: 20 });
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
            console.log('✅ Link publicado no primeiro comentário com sucesso!');
            record.commentedLink = true;
            record.comments = 1;
          }
        } catch (cErr) {
          console.warn('⚠️ Não foi possível comentar imediatamente. O monitor tentará na próxima checagem:', cErr.message);
        }
      }

      perfData.trackedPosts.push(record);
      savePerformanceData(perfData);
      successCount++;

      // Cadência humana de segurança entre grupos (12 a 18 segundos)
      console.log('⏳ Pausa de segurança anti-bot antes do próximo grupo (15s)...');
      await page.waitForTimeout(15000);

    } catch (err) {
      console.error(`❌ Erro ao publicar no grupo ${group.name}:`, err.message);
      const errShot = path.join(resultsDir, `error-group-${idx}.png`);
      await page.screenshot({ path: errShot }).catch(() => null);
    }
  }

  await context.close();

  console.log('\n' + '='.repeat(65));
  console.log('🏁 DISTRIBUIÇÃO CONCLUÍDA!');
  console.log(`✅ Novos grupos publicados com sucesso: ${successCount}`);
  console.log(`⏩ Grupos já publicados anteriormente: ${alreadyPostedCount}`);
  console.log(`📊 Total de posts sob monitoramento agora: ${perfData.trackedPosts.length}`);
  console.log('='.repeat(65));
}

runMultiGroupDistribution().catch(console.error);
