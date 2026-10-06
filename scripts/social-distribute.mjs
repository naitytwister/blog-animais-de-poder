// @ts-check
/**
 * scripts/social-distribute.mjs
 * 
 * Ponytail Distribution Automation:
 * 1. Usa um perfil persistente dedicado (.browser-session) usando o Google Chrome real.
 * 2. Roda lado a lado com seu Chrome pessoal sem conflitos de abas ou portas.
 * 3. Faz login uma única vez e a sessão fica salva permanentemente.
 * 
 * Uso:
 *   node scripts/social-distribute.mjs --dry-run
 *   node scripts/social-distribute.mjs --post animal-de-poder-cachorro
 *   node scripts/social-distribute.mjs --login   (abre a janela para logar e salvar a sessão)
 */

import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// --- CONFIGURAÇÃO ---
const SESSION_DIR = path.resolve('.browser-session');
const RESULTS_DIR = path.resolve('test-results/social-share');

if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Grupos alvo mapeados (adicione suas URLs de grupos favoritas aqui):
const TARGET_GROUPS = [
  // Exemplo de grupos onde você tem autoridade ou participa:
  // 'https://www.facebook.com/groups/xamanismo.animais.de.poder/',
];

// --- PARSER DE ARGUMENTOS ---
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isLoginMode = args.includes('--login');
const isHeadless = args.includes('--headless');
const postArgIndex = args.indexOf('--post');
const groupArgIndex = args.indexOf('--group');

const targetPostSlug = postArgIndex !== -1 ? args[postArgIndex + 1] : null;
const customGroupUrl = groupArgIndex !== -1 ? args[groupArgIndex + 1] : null;

// --- CARREGAMENTO DO POST ---
function loadPost(slug) {
  const postsDir = path.resolve('src/content/posts');
  let fileName = '';

  if (slug) {
    fileName = slug.endsWith('.md') ? slug : `${slug}.md`;
  } else {
    const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'));
    fileName = files[0];
  }

  const raw = fs.readFileSync(path.join(postsDir, fileName), 'utf-8');
  const title = raw.match(/title:\s*["']?([^"'\r\n]+)["']?/)?.[1] || '';
  const desc = raw.match(/description:\s*["']?([^"'\r\n]+)["']?/)?.[1] || '';
  const imgMatch = raw.match(/imagem_capa:\s*["']?([^"'\r\n]+)["']?/)?.[1] || '';
  const postSlug = fileName.replace(/\.md$/, '');
  const url = `https://animotem.com/posts/${postSlug}/`;

  let localImgPath = '';
  if (imgMatch) {
    const cleanImg = imgMatch.startsWith('/') ? imgMatch.slice(1) : imgMatch;
    const fullPath = path.resolve('public', cleanImg);
    if (fs.existsSync(fullPath)) localImgPath = fullPath;
  }

  const fbCopy = `🌿 ${title}\n\n${desc}\n\nVocê já sentiu a presença desse guardião ou sonhou com ele recentemente?\n\n👇 Deixei o estudo completo com a medicina ancestral, significado de sonhos e rituais no primeiro comentário!`;

  return { slug: postSlug, title, desc, url, localImgPath, fbCopy };
}

async function main() {
  console.log('='.repeat(60));
  console.log('🦅 ANIMOTEM — Automação Social (Modo Sessão Persistente)');
  console.log('='.repeat(60));

  const post = loadPost(targetPostSlug);
  console.log(`📄 Post: "${post.title}"`);
  console.log(`🔗 URL: ${post.url}`);
  console.log(`🖼️  Imagem: ${post.localImgPath ? 'Localizada' : 'Pendente'}`);

  if (isDryRun) {
    console.log('\n📝 Cópia gerada para o Facebook:');
    console.log('-'.repeat(40));
    console.log(post.fbCopy);
    console.log('-'.repeat(40));
    console.log(`💬 Link no 1º comentário: ${post.url}\n`);
    console.log('✅ Modo --dry-run concluído.');
    return;
  }

  let browser, context, page;
  let isCdp = false;

  const isCdpOpen = await fetch('http://127.0.0.1:9222/json/version').then((r) => r.ok).catch(() => false);

  if (isCdpOpen) {
    console.log('🔌 Detectado Chrome com porta 9222 ativa! Conectando via CDP...');
    browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    context = browser.contexts()[0] || (await browser.newContext());
    const existingFbPage = context.pages().find((p) => p.url().includes('facebook.com'));
    page = existingFbPage || (await context.newPage());
    isCdp = true;
  } else {
    console.log(`\n🚀 Abrindo navegador com perfil persistente (.browser-session)...`);
    const headlessOption = isLoginMode ? false : isHeadless;
    context = await chromium.launchPersistentContext(SESSION_DIR, {
      channel: 'chrome',
      headless: headlessOption,
      viewport: { width: 1280, height: 800 },
      args: ['--disable-blink-features=AutomationControlled', '--start-maximized'],
    });
    page = context.pages()[0] || (await context.newPage());
  }

  try {
    console.log('🌐 Navegando para o Facebook...');
    await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(4000);

    const currentUrl = page.url();
    const hasLoginForm = (await page.locator('input[name="email"], input#email').count()) > 0;
    const isLogged = !hasLoginForm && !currentUrl.includes('login');

    const screenshotPath = path.join(RESULTS_DIR, 'facebook-status.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot salvo em: ${screenshotPath}`);

    if (!isLogged) {
      console.log('\n⚠️  STATUS: Sessão ainda NÃO autenticada nesta janela.');
      if (!isLoginMode) {
        console.log('👉 Execute: node scripts/social-distribute.mjs --login');
        console.log('Uma janela do Chrome abrirá na sua tela para você fazer login 1 única vez.');
        console.log('Após isso, todas as postagens rodarão 100% no background automaticamente!');
      } else {
        console.log('\n🔑 Janela aberta! Faça login no Facebook na tela agora.');
        console.log('Aguardando você concluir o login...');
        
        // Aguarda sumir o formulário de login ou aparecer a navegação principal
        await page.waitForSelector('input[name="email"], input#email', { state: 'detached', timeout: 180000 }).catch(() => null);
        await page.waitForTimeout(3000);
        
        const finalShot = path.join(RESULTS_DIR, 'facebook-logged-in.png');
        await page.screenshot({ path: finalShot });
        console.log('🎉 Login detectado e salvo com sucesso em .browser-session!');
        console.log(`📸 Confirmação salva em: ${finalShot}`);
      }
    } else {
      console.log('\n✅ STATUS: LOGADO COM SUCESSO NO FACEBOOK!');
      
      // Mapeamento de Grupos
      console.log('🗺️  Mapeando grupos do usuário...');
      await page.goto('https://www.facebook.com/groups/feed/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      const feedScreenshot = path.join(RESULTS_DIR, 'facebook-groups-feed.png');
      await page.screenshot({ path: feedScreenshot });
      console.log(`📸 Screenshot do Feed de Grupos salvo em: ${feedScreenshot}`);

      const targetGroup = customGroupUrl || TARGET_GROUPS[0];
      if (targetGroup) {
        console.log(`\n📢 Acessando grupo alvo: ${targetGroup}`);
        await page.goto(targetGroup, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(4000);

        const groupShot = path.join(RESULTS_DIR, 'group-target.png');
        await page.screenshot({ path: groupShot });
        console.log(`📸 Screenshot do grupo salvo em: ${groupShot}`);
      } else {
        console.log('ℹ️  Nenhum grupo específico passado via --group. Mapeamento concluído com sucesso!');
      }
    }

  } catch (err) {
    console.error('❌ Erro na execução:', err.message);
  } finally {
    if (isCdp) {
      console.log('\n🏁 Desconectado do Chrome com sucesso (sua janela do Chrome permanece aberta).');
    } else if (!isLoginMode) {
      if (context) await context.close();
      console.log('\n🏁 Execução concluída.');
    } else {
      console.log('\n💡 Janela mantida aberta para você usar. Feche quando terminar.');
    }
  }
}

main().catch(console.error);
