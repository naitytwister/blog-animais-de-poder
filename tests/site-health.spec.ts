import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'https://animotem.com';

test.describe('Saúde e Diagnóstico Completo do Site - Animotem', () => {

  test('1. Homepage: Carregamento, SEO e Integridade dos Assets', async ({ page, request }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const startTime = Date.now();
    const response = await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    const loadDuration = Date.now() - startTime;

    console.log(`[Homepage] HTTP Status: ${response?.status()}, Tempo: ${loadDuration}ms`);
    expect(response?.status()).toBe(200);

    // SEO Básico
    const title = await page.title();
    console.log(`[Homepage] Title: "${title}"`);
    expect(title).toContain('Animo Tem');

    const description = await page.locator('meta[name="description"]').getAttribute('content');
    console.log(`[Homepage] Meta Description: "${description?.slice(0, 80)}..."`);
    expect(description).toBeTruthy();

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    console.log(`[Homepage] Canonical: "${canonical}"`);
    expect(canonical).toBe('https://animotem.com/');

    const h1Count = await page.locator('h1').count();
    console.log(`[Homepage] Contagem de H1: ${h1Count}`);
    expect(h1Count).toBe(1);

    // Estrutura Principal
    await expect(page.locator('header.site-header, header')).toBeVisible();
    await expect(page.locator('footer.site-footer, footer')).toBeVisible();

    // Verificação real de todas as imagens da homepage via requisição HTTP direta
    const imageUrls = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .map((img) => img.getAttribute('src') || img.src)
        .filter((src) => Boolean(src));
    });

    const uniqueImages = [...new Set(imageUrls)];
    console.log(`[Homepage] Total de imagens únicas encontradas: ${uniqueImages.length}`);

    const failedImages: string[] = [];
    for (const src of uniqueImages) {
      const fullUrl = src.startsWith('http') ? src : `${BASE_URL}${src.startsWith('/') ? '' : '/'}${src}`;
      const imgRes = await request.get(fullUrl);
      if (imgRes.status() !== 200) {
        failedImages.push(`${fullUrl} (HTTP ${imgRes.status()})`);
      }
    }

    console.log(`[Homepage] Imagens com falha HTTP: ${failedImages.length}`);
    expect(failedImages).toEqual([]);
    console.log(`[Homepage] Erros no console do navegador: ${consoleErrors.length}`, consoleErrors);
  });

  test('2. Quiz Interativo: Fluxo completo de 6 perguntas e tela de resultado', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/quiz/animal-de-poder/`, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    const startBtn = page.locator('#quiz-start [data-start]');
    await expect(startBtn).toBeVisible({ timeout: 5000 });
    console.log('[Quiz] Botão "Começar o teste" visível. Clicando...');
    await startBtn.click();

    // Responder às 6 perguntas
    for (let i = 0; i < 6; i++) {
      const questionTitle = page.locator('#quiz-questions .quiz-question');
      await expect(questionTitle).toBeVisible({ timeout: 5000 });
      const qText = await questionTitle.textContent();
      console.log(`[Quiz] Pergunta ${i + 1}: "${qText?.trim()}"`);

      const firstOption = page.locator('#quiz-questions .quiz-option').first();
      await expect(firstOption).toBeVisible({ timeout: 5000 });
      await firstOption.click();
      await page.waitForTimeout(150);
    }

    // Validação da tela de resultado
    const resultCard = page.locator('#quiz-result .quiz-result-card');
    await expect(resultCard).toBeVisible({ timeout: 5000 });

    const animalName = await resultCard.locator('h2').textContent();
    const medicinaText = await resultCard.locator('.quiz-result-medicina').textContent();
    console.log(`[Quiz] Resultado gerado com sucesso: ${animalName} - ${medicinaText}`);
    expect(animalName).toBeTruthy();

    const guideLink = resultCard.locator('a.btn-primary');
    await expect(guideLink).toBeVisible();
    const guideHref = await guideLink.getAttribute('href');
    console.log(`[Quiz] Link para o guia completo: ${guideHref}`);
    expect(guideHref).toContain('/posts/');
  });

  test('3. Artigo / Post: SEO Schema, Conteúdo, Imagem de Capa e Widget de Avaliação', async ({ page, request }) => {
    const postUrl = `${BASE_URL}/posts/o-que-significa-sonhar-com-peixe/`;
    const response = await page.goto(postUrl, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    // Schemas JSON-LD
    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    console.log(`[Post] Blocos JSON-LD encontrados: ${schemas.length}`);
    expect(schemas.length).toBeGreaterThanOrEqual(1);

    const hasArticleSchema = schemas.some(s => s.includes('Article') || s.includes('BlogPosting'));
    console.log(`[Post] Schema BlogPosting/Article presente: ${hasArticleSchema}`);
    expect(hasArticleSchema).toBe(true);

    // Imagem de capa
    const coverImage = page.locator('.post-cover img, article img').first();
    await expect(coverImage).toBeVisible();
    const coverSrc = await coverImage.getAttribute('src');
    if (coverSrc) {
      const fullCoverUrl = coverSrc.startsWith('http') ? coverSrc : `${BASE_URL}${coverSrc}`;
      const imgRes = await request.get(fullCoverUrl);
      expect(imgRes.status()).toBe(200);
      console.log(`[Post] Imagem de capa válida HTTP 200: ${fullCoverUrl}`);
    }

    // Título e leitura
    const articleTitle = await page.locator('h1').textContent();
    console.log(`[Post] Título H1: "${articleTitle?.trim()}"`);
    expect(articleTitle).toBeTruthy();

    // Widget de avaliação / Ratings
    const ratingWidget = page.locator('.rating-widget, #ratings, [data-rating]');
    const ratingCount = await ratingWidget.count();
    console.log(`[Post] Widget de avaliação presente na página: ${ratingCount > 0}`);
  });

  test('4. Responsividade Mobile: Viewport 390x844 sem overflow horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    const overflow = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });

    console.log(`[Mobile] Largura de scroll: ${overflow.scrollWidth}px, Viewport: ${overflow.innerWidth}px, Overflow: ${overflow.hasOverflow}`);
    expect(overflow.hasOverflow).toBe(false);

    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('5. Redirecionamentos 301 e Tratamento de 404', async ({ page }) => {
    // Redirecionamento 301 válido no Netlify
    const redirectUrl = `${BASE_URL}/posts/o-rio-dentro-do-sonho-o-que-significa-sonhar-com-peixe/`;
    await page.goto(redirectUrl, { waitUntil: 'domcontentloaded' });
    console.log(`[Redirect] URL acessada: ${redirectUrl}`);
    console.log(`[Redirect] URL final: ${page.url()}`);
    expect(page.url()).toBe('https://animotem.com/posts/o-que-significa-sonhar-com-peixe/');

    // Página 404 customizada
    const notFoundUrl = `${BASE_URL}/rota-inexistente-teste-404`;
    const res = await page.goto(notFoundUrl, { waitUntil: 'domcontentloaded' });
    console.log(`[404] Status retornado para página inexistente: ${res?.status()}`);
    expect(res?.status()).toBe(404);
  });

  test('6. Verificação dos Novos Artigos do GitHub no Ambiente de Produção', async ({ request }) => {
    // Artigos recentes commitados pelo bot no GitHub:
    const recentPosts = [
      '/posts/o-voo-no-sonho-o-que-significa-sonhar-com-passaros-e-aves/',
      '/posts/uivo-no-escuro-sonhar-com-lobo/',
      '/posts/olhar-da-onca-jaguar-animal-de-poder/',
      '/posts/guardiao-do-tempo-rapido-animal-de-poder-beija-flor/',
      '/posts/animal-de-poder-coruja-chamado-secreto-adiar-fim/'
    ];

    console.log('[Deploy Check] Verificando se os 5 últimos artigos do GitHub foram publicados na Netlify...');
    const results: Record<string, number> = {};

    for (const path of recentPosts) {
      const res = await request.get(`${BASE_URL}${path}`);
      results[path] = res.status();
    }

    console.log('[Deploy Check] Status de publicação dos artigos:', results);
    const allPublished = Object.values(results).every(status => status === 200);
    console.log(`[Deploy Check] Todos os novos artigos do GitHub estão online? ${allPublished ? 'SIM' : 'NÃO (Deploy pendente ou com falha)'}`);
  });

});
