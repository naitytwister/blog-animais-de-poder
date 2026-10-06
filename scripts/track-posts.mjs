// @ts-check
/**
 * scripts/track-posts.mjs
 * 
 * Monitor de Desempenho e Comentador Automático:
 * 1. Acessa os grupos onde foram feitas publicações.
 * 2. Verifica se o post saiu de 'Aguardando aprovação' para 'Publicado'.
 * 3. Se publicado e ainda sem o comentário do link, publica o 1º comentário imediatamente!
 * 4. Coleta métricas de engajamento (Reações e Comentários) e salva em histórico local.
 * 
 * Uso:
 *   node scripts/track-posts.mjs
 */

import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const debugDir = path.resolve(process.env.LOCALAPPDATA || '', 'Google/Chrome/User Data Debug');
const PERF_FILE = path.resolve('.browser-session/social-performance.json');

// Carrega histórico de postagens a monitorar
function loadPerformanceData() {
  try {
    if (fs.existsSync(PERF_FILE)) {
      return JSON.parse(fs.readFileSync(PERF_FILE, 'utf-8'));
    }
  } catch {}
  return {
    trackedPosts: [
      {
        slug: 'animal-de-poder-coruja-chamado-secreto-adiar-fim',
        title: 'Medicina da Coruja',
        groupUrl: 'https://www.facebook.com/groups/245822958802180/',
        canonicalUrl: 'https://animotem.com/posts/animal-de-poder-coruja-chamado-secreto-adiar-fim/',
        status: 'pending_approval', // ou 'published'
        commentedLink: false,
        likes: 0,
        comments: 0,
        lastChecked: null,
      },
    ],
  };
}

function savePerformanceData(data) {
  const dir = path.dirname(PERF_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(PERF_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function track() {
  console.log('='.repeat(60));
  console.log('📊 ANIMOTEM — Monitor de Desempenho & Comentador de Links');
  console.log('='.repeat(60));

  const data = loadPerformanceData();
  console.log(`📡 Monitorando ${data.trackedPosts.length} publicação(ões)...`);

  const context = await chromium.launchPersistentContext(debugDir, {
    channel: 'chrome',
    headless: true, // Roda 100% invisível em background
    viewport: { width: 1280, height: 800 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || (await context.newPage());

  for (const item of data.trackedPosts) {
    console.log(`\n🔍 Verificando: "${item.title}" no grupo: ${item.groupUrl}`);
    
    try {
      await page.goto(item.groupUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await page.waitForTimeout(3000);

      const pageText = await page.innerText('body');

      // Extrai palavras-chave do post e do animal
      const postTitlePrefix = item.title.includes(' - ') ? item.title.split(' - ')[0].trim() : item.title.trim();
      const animalSlugKeyword = item.slug.replace(/^animal-de-poder-/, '').split('-')[0].trim();

      // Verifica se o post ainda está na fila de aprovação
      const isPending = pageText.includes('Aguardando aprovação do administrador') || pageText.includes('enviada aos administradores');
      
      // Procura pelo post no feed público do grupo
      const isPublicInFeed = pageText.toLowerCase().includes(animalSlugKeyword.toLowerCase()) || 
                             pageText.toLowerCase().includes(postTitlePrefix.toLowerCase()) ||
                             pageText.includes('Medicina da Coruja') || 
                             pageText.includes('Guardião dos Mistérios');

      if (isPending && !isPublicInFeed) {
        item.status = 'pending_approval';
        console.log('⏳ Status: O post AINDA ESTÁ na fila de moderação dos administradores.');
        console.log('ℹ️ O Facebook só permite comentar quando o administrador aprovar.');
      } else if (isPublicInFeed) {
        item.status = 'published';
        console.log('🎉 Status: POST APROVADO E PÚBLICO NO GRUPO!');

        // Se ainda não comentou o link, adiciona o primeiro comentário agora!
        if (!item.commentedLink) {
          console.log(`💬 Comentando o link do blog no post aprovado (${item.title})...`);
          try {
            // Localiza o card do post no feed
            let postCard = page.locator('div[role="article"], div[role="feed"] > div').filter({ hasText: postTitlePrefix }).first();
            if ((await postCard.count()) === 0 || !(await postCard.isVisible())) {
              postCard = page.locator('div[role="article"]').filter({ hasText: new RegExp(animalSlugKeyword, 'i') }).first();
            }
            
            // Clica no botão Comentar caso a caixa esteja recolhida
            const commentActionBtn = postCard.locator('div[role="button"]:has-text("Comentar"), div[role="button"][aria-label*="Comentar"]').first();
            if (await commentActionBtn.isVisible()) {
              await commentActionBtn.click();
              await page.waitForTimeout(1000);
            }

            // Seleciona a caixa de texto identificada pelo Facebook
            const commentBox = postCard.locator('div[role="textbox"][contenteditable="true"], div[role="textbox"][aria-label*="Comente como"], div[role="textbox"][aria-label*="Comentar"]').first();
            if (await commentBox.isVisible()) {
              await commentBox.click();
              await commentBox.pressSequentially(`🔗 Estudo completo com a sabedoria ancestral, significado nos sonhos e rituais: ${item.canonicalUrl}`, { delay: 20 });
              await page.keyboard.press('Enter');
              await page.waitForTimeout(2000);
              console.log('✅ Link nos comentários publicado com sucesso!');
              item.commentedLink = true;
              item.comments = (item.comments || 0) + 1;
            }
          } catch (cErr) {
            console.warn('⚠️ Erro ao inserir comentário:', cErr.message);
          }
        }

        // Tenta capturar métricas de reações e comentários
        console.log('📈 Coletando métricas de engajamento...');
        try {
          const metrics = await page.evaluate(() => {
            let likes = 0;
            let comments = 0;

            // Busca elementos com contagem de reações
            const reactionEls = Array.from(document.querySelectorAll('[aria-label*="reaç"], [aria-label*="reag"], [aria-label*="curtid"], [aria-label*="Like"]'));
            for (const el of reactionEls) {
              const text = el.getAttribute('aria-label') || el.textContent || '';
              const match = text.match(/(\d+)/);
              if (match) {
                likes = Math.max(likes, parseInt(match[1], 10));
              }
            }

            // Busca elementos de contagem de comentários
            const commentEls = Array.from(document.querySelectorAll('*'));
            for (const el of commentEls) {
              const text = el.textContent || '';
              if (/(\d+)\s+comentário/i.test(text)) {
                const match = text.match(/(\d+)\s+comentário/i);
                if (match) {
                  comments = Math.max(comments, parseInt(match[1], 10));
                }
              }
            }

            return { likes, comments };
          });

          if (metrics.likes > 0) item.likes = metrics.likes;
          if (metrics.comments > 0) item.comments = metrics.comments;
          console.log(`📊 Métricas capturadas — Curtidas/Reações: ${item.likes} | Comentários: ${item.comments}`);
        } catch (mErr) {
          console.warn('⚠️ Não foi possível coletar métricas detalhadas:', mErr.message);
        }
      }

      item.lastChecked = new Date().toISOString();
    } catch (err) {
      console.warn(`⚠️ Alerta ao verificar ${item.title}:`, err.message);
    }
  }

  savePerformanceData(data);
  await context.close();

  try {
    const { execSync } = await import('node:child_process');
    execSync('node scripts/show-dashboard.mjs', { stdio: 'inherit' });
  } catch {}

  console.log('\n🏁 Monitoramento concluído com sucesso.');
}

track().catch(console.error);
