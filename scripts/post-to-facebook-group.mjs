// @ts-check
import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const debugDir = path.resolve(process.env.LOCALAPPDATA || '', 'Google/Chrome/User Data Debug');
const resultsDir = path.resolve('test-results/social-share');

if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Configuração do grupo e post
const GROUP_URL = process.argv[2] || 'https://www.facebook.com/groups/245822958802180/';
const POST_SLUG = 'animal-de-poder-coruja-chamado-secreto-adiar-fim';
const IMG_PATH = path.resolve('public/images/animal-de-poder-coruja-chamado-secreto-adiar-fim.jpg');
const CANONICAL_URL = `https://animotem.com/posts/${POST_SLUG}/`;

const POST_TEXT = `🦉 Medicina da Coruja: O Guardião dos Mistérios e da Visão Noturna

Na sabedoria ancestral e nas tradições xamânicas, a coruja não teme o escuro — ela enxerga exatamente onde a maioria fecha os olhos. Ela nos ensina a ver além das aparências, a reconhecer ilusões e a confiar na nossa intuição mais profunda.

Você tem sentido a presença ou sonhado com a coruja ultimamente?

👇 Compartilhei o estudo completo com o simbolismo ancestral e rituais no primeiro comentário.`;

async function publish() {
  console.log('='.repeat(60));
  console.log('🦉 ANIMOTEM — Publicação Automatizada em Grupo de Espiritualidade');
  console.log('='.repeat(60));
  console.log(`🎯 Grupo: ${GROUP_URL}`);
  console.log(`📄 Artigo: ${POST_SLUG}`);
  console.log(`🖼️  Imagem: ${IMG_PATH}`);

  console.log('\n🚀 Preparando conexão com o navegador Chrome...');
  let context, page;
  let isCdp = false;

  const isCdpOpen = await fetch('http://127.0.0.1:9222/json/version').then((r) => r.ok).catch(() => false);

  if (isCdpOpen) {
    console.log('🔌 Chrome detectado com porta 9222 ativa! Conectando via CDP...');
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    context = browser.contexts()[0] || (await browser.newContext());
    page = context.pages().find((p) => p.url().includes('facebook.com')) || (await context.newPage());
    isCdp = true;
  } else {
    console.log('🌐 Iniciando navegador Chrome dedicado (User Data Debug)...');
    context = await chromium.launchPersistentContext(debugDir, {
      channel: 'chrome',
      headless: false,
      viewport: { width: 1280, height: 850 },
      args: ['--disable-blink-features=AutomationControlled', '--start-maximized'],
    });
    page = context.pages()[0] || (await context.newPage());
  }

  try {
    console.log(`\n🌐 Acessando o grupo no Facebook...`);
    await page.goto(GROUP_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(4000);

    const groupTitle = await page.title();
    console.log(`📌 Título da página: "${groupTitle}"`);

    const initialShot = path.join(resultsDir, 'group-loaded.png');
    await page.screenshot({ path: initialShot });
    console.log(`📸 Screenshot da página do grupo salvo em: ${initialShot}`);

    // Procura o gatilho para abrir o modal de postagem
    console.log('🔍 Procurando a caixa de criação de publicação...');
    const postBoxSelectors = [
      'text=Escreva algo...',
      'text=No que você está pensando',
      'div[role="button"]:has-text("Escreva algo")',
      'div[role="button"]:has-text("No que você está pensando")',
      'div[role="button"]:has-text("Crie uma publicação")',
    ];

    let opened = false;
    for (const sel of postBoxSelectors) {
      const loc = page.locator(sel).first();
      if ((await loc.count()) > 0 && (await loc.isVisible())) {
        console.log(`👉 Clicando no gatilho: "${sel}"`);
        await loc.click();
        opened = true;
        break;
      }
    }

    if (!opened) {
      // Tenta clicar no primeiro botão do formulário de postagem
      console.log('Tentando seletor de fallback para caixa de postagem...');
      const fallback = page.locator('div[role="region"] div[role="button"]').first();
      await fallback.click();
    }

    await page.waitForTimeout(3000);

    // Localiza a caixa de texto ativa no modal
    console.log('✍️ Digitando o texto da postagem com cadência humana...');
    const editor = page.locator('div[role="dialog"] div[role="textbox"][contenteditable="true"]').first();
    await editor.waitFor({ state: 'visible', timeout: 10000 });
    await editor.click();
    await page.waitForTimeout(500);

    // Digitação humanizada
    await editor.pressSequentially(POST_TEXT, { delay: 25 });
    await page.waitForTimeout(1500);

    // Upload da imagem
    if (fs.existsSync(IMG_PATH)) {
      console.log('🖼️ Fazendo upload da imagem da capa...');
      const fileInput = page.locator('div[role="dialog"] input[type="file"][accept*="image"]').first();
      if ((await fileInput.count()) > 0) {
        await fileInput.setInputFiles(IMG_PATH);
      } else {
        // Clica no ícone de Foto/Vídeo
        const photoBtn = page.locator('div[role="dialog"] div[aria-label*="Foto/vídeo"], div[role="dialog"] div[aria-label*="Photo/video"]').first();
        if (await photoBtn.isVisible()) {
          const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null);
          await photoBtn.click();
          const fileChooser = await fileChooserPromise;
          if (fileChooser) await fileChooser.setFiles(IMG_PATH);
        }
      }
      await page.waitForTimeout(4000); // Espera o Facebook processar a miniatura
    }

    const previewShot = path.join(resultsDir, 'post-preview-ready.png');
    await page.screenshot({ path: previewShot });
    console.log(`📸 Screenshot da publicação PRONTA salvo em: ${previewShot}`);

    // Aguarda o upload da foto finalizar e o botão Postar ficar habilitado
    console.log('⏳ Aguardando processamento da imagem e liberação do botão Postar...');
    await page.waitForTimeout(3000);

    const submitBtn = page.locator('div[role="dialog"] div[aria-label="Postar"][role="button"]').first();
    
    // Aguarda o botão não estar com aria-disabled="true"
    await page.waitForFunction(() => {
      const btn = document.querySelector('div[role="dialog"] div[aria-label="Postar"][role="button"]');
      return btn && btn.getAttribute('aria-disabled') !== 'true';
    }, { timeout: 15000 }).catch(() => null);

    console.log('🚀 Clicando no botão "Postar"...');
    await submitBtn.click({ force: true });

    // Fallback nativo via DOM click
    await page.evaluate(() => {
      const btn = document.querySelector('div[role="dialog"] div[aria-label="Postar"][role="button"]');
      if (btn && btn.getAttribute('aria-disabled') !== 'true') {
        /** @type {HTMLElement} */ (btn).click();
      }
    });

    console.log('⏳ Aguardando fechamento do modal e confirmação...');
    // Aguarda o modal fechar
    await page.waitForSelector('div[role="dialog"]', { state: 'hidden', timeout: 15000 }).catch(() => null);
    await page.waitForTimeout(4000);

    const publishedShot = path.join(resultsDir, 'post-submitted.png');
    await page.screenshot({ path: publishedShot });
    console.log(`📸 Screenshot após envio salvo em: ${publishedShot}`);

    // Verifica se o post caiu em moderação ou foi publicado diretamente
    const pageText = await page.innerText('body');
    const isPending = pageText.includes('Aguardando aprovação do administrador');

    // Carrega e atualiza o arquivo de performance
    const perfFile = path.resolve('.browser-session/social-performance.json');
    let perfData = { trackedPosts: [] };
    try {
      if (fs.existsSync(perfFile)) {
        perfData = JSON.parse(fs.readFileSync(perfFile, 'utf-8'));
      }
    } catch {}

    let postRecord = perfData.trackedPosts.find(p => p.slug === POST_SLUG && p.groupUrl === GROUP_URL);
    if (!postRecord) {
      postRecord = {
        slug: POST_SLUG,
        title: 'Medicina da Coruja',
        groupUrl: GROUP_URL,
        canonicalUrl: CANONICAL_URL,
        status: isPending ? 'pending_approval' : 'published',
        commentedLink: false,
        likes: 0,
        comments: 0,
        lastChecked: new Date().toISOString()
      };
      perfData.trackedPosts.push(postRecord);
    }

    if (isPending) {
      console.log('⏳ Post submetido para moderação ("Aguardando aprovação do administrador").');
      console.log('ℹ️ O Facebook bloqueia a caixa de comentários até o administrador aprovar.');
      console.log('🤖 O monitor automático (track-posts.mjs) comentará o link assim que for aprovado!');
      postRecord.status = 'pending_approval';
    } else {
      console.log('🎉 Post publicado diretamente no feed público do grupo!');
      postRecord.status = 'published';

      // Comenta o link imediatamente no primeiro comentário
      console.log('💬 Publicando o link no 1º comentário agora...');
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
          postRecord.commentedLink = true;
          postRecord.comments = (postRecord.comments || 0) + 1;
        }
      } catch (commentErr) {
        console.warn('⚠️ Não foi possível comentar de imediato. O monitor tentará na próxima checagem:', commentErr.message);
      }
    }

    // Salva o rastreador
    const perfDir = path.dirname(perfFile);
    if (!fs.existsSync(perfDir)) fs.mkdirSync(perfDir, { recursive: true });
    fs.writeFileSync(perfFile, JSON.stringify(perfData, null, 2), 'utf-8');

    // Deixa a janela aberta por 10 segundos para conferência visual
    console.log('\n👁️ Janela mantida aberta brevemente para conferência...');
    await page.waitForTimeout(10000);

  } catch (err) {
    console.error('❌ Erro durante a publicação:', err.message);
    const errorShot = path.join(resultsDir, 'publish-error.png');
    await page.screenshot({ path: errorShot }).catch(() => null);
    console.log(`📸 Screenshot do erro salvo em: ${errorShot}`);
  } finally {
    await context.close();
    console.log('\n🏁 Script finalizado.');
  }
}

publish().catch(console.error);
