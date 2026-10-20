import { chromium } from '@playwright/test';

// Lista dos 11 produtos com suas URLs completas com tag de afiliado
const PRODUCTS = [
  {
    id: 'cartas-xamanicas',
    name: 'Cartas Xamânicas (Jamie Sams)',
    url: 'https://www.amazon.com.br/dp/8532511112?tag=animotem-20',
  },
  {
    id: 'oraculo-poder-animal',
    name: 'Oráculo do Poder Animal (Cláudia Oliveira)',
    url: 'https://www.amazon.com.br/dp/6556161357?tag=animotem-20',
  },
  {
    id: 'the-wild-unknown-animal-spirit',
    name: 'The Wild Unknown Animal Spirit (Kim Krans)',
    url: 'https://www.amazon.com.br/dp/0062742868?tag=animotem-20',
  },
  {
    id: 'oraculo-magico-animais',
    name: 'Oráculo Mágico dos Animais Sagrados',
    url: 'https://www.amazon.com.br/dp/658790565X?tag=animotem-20',
  },
  {
    id: 'o-caminho-do-xama',
    name: 'O Caminho do Xamã (Michael Harner)',
    url: 'https://www.amazon.com.br/dp/8576575485?tag=animotem-20',
  },
  {
    id: 'xamanismo-para-iniciantes',
    name: 'Xamanismo para Iniciantes (James Endredy)',
    url: 'https://www.amazon.com.br/dp/6556200883?tag=animotem-20',
  },
  {
    id: 'a-sabedoria-dos-xamas',
    name: 'A Sabedoria dos Xamãs (Don Jose Ruiz)',
    url: 'https://www.amazon.com.br/dp/6557135503?tag=animotem-20',
  },
  {
    id: 'animal-speak-ted-andrews',
    name: 'Animal Speak (Ted Andrews)',
    url: 'https://www.amazon.com.br/dp/0875420281?tag=animotem-20',
  },
  {
    id: 'power-animals-steven-farmer',
    name: 'Power Animals (Steven Farmer)',
    url: 'https://www.amazon.com.br/dp/1401907334?tag=animotem-20',
  },
  {
    id: 'a-biblia-dos-cristais',
    name: 'A Bíblia dos Cristais (Judy Hall)',
    url: 'https://www.amazon.com.br/dp/8531515246?tag=animotem-20',
  },
  {
    id: 'palo-santo-natural',
    name: 'Incenso Natural de Palo Santo e Breu',
    url: 'https://www.amazon.com.br/dp/B0951C5N3M?tag=animotem-20',
  },
];

async function checkLiveAmazonProducts() {
  console.log('--- AUDITORIA AO VIVO: STATUS E DISPONIBILIDADE NA AMAZON BR ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    locale: 'pt-BR',
    viewport: { width: 1280, height: 800 }
  });

  const report = [];

  for (let i = 0; i < PRODUCTS.length; i++) {
    const prod = PRODUCTS[i];
    const page = await context.newPage();
    console.log(`\n[${i + 1}/${PRODUCTS.length}] Checando: ${prod.name}`);
    console.log(`URL: ${prod.url}`);

    try {
      const response = await page.goto(prod.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const status = response ? response.status() : 0;
      await page.waitForTimeout(1500); // Aguarda renderizar elementos

      const currentUrl = page.url();
      const pageTitle = await page.title();

      // Checa se é página de erro clássica da Amazon (cachorro / página não encontrada)
      const isNotFound = pageTitle.includes('Página não encontrada') || 
                         pageTitle.includes('Page Not Found') || 
                         (await page.content()).includes('procurando por um endereço que não existe');

      // Checa se tem título de produto
      const productTitleEl = await page.$('#productTitle');
      const amazonTitle = productTitleEl ? (await productTitleEl.textContent()).trim() : null;

      // Checa disponibilidade / botões de compra
      const hasAddToCart = (await page.$('#add-to-cart-button')) !== null;
      const hasBuyNow = (await page.$('#buy-now-button')) !== null;
      const hasKindleBuy = (await page.$('#one-click-button')) !== null || (await page.$('#buy-now-button')) !== null;
      
      const availabilityEl = await page.$('#availability');
      const availabilityText = availabilityEl ? (await availabilityEl.textContent()).trim().replace(/\s+/g, ' ') : '';

      const isAvailable = hasAddToCart || hasBuyNow || hasKindleBuy || availabilityText.toLowerCase().includes('em estoque') || availabilityText.toLowerCase().includes('disponível');

      const isUnavailable = availabilityText.toLowerCase().includes('não disponível') || 
                            availabilityText.toLowerCase().includes('temporariamente indisponível') || 
                            availabilityText.toLowerCase().includes('esgotado');

      const itemResult = {
        name: prod.name,
        url: prod.url,
        httpStatus: status,
        isPageFound: !isNotFound && amazonTitle !== null,
        amazonTitle: amazonTitle || 'NÃO ENCONTRADO',
        hasBuyButton: hasAddToCart || hasBuyNow,
        availability: availabilityText || (isAvailable ? 'Opções de compra ativas' : 'Indeterminado'),
        isReadyForPurchase: isAvailable && !isUnavailable
      };

      report.push(itemResult);

      console.log(`  - Status HTTP: ${status}`);
      console.log(`  - Página Existe: ${itemResult.isPageFound ? 'SIM ✅' : 'NÃO / 404 ❌'}`);
      console.log(`  - Título Amazon: ${itemResult.amazonTitle.slice(0, 50)}...`);
      console.log(`  - Botão de Compra: ${itemResult.hasBuyButton ? 'SIM ✅' : 'Outras opções'}`);
      console.log(`  - Disponibilidade: ${itemResult.availability}`);
      console.log(`  - Apto para Compra: ${itemResult.isReadyForPurchase ? 'APTO PARA VENDA 🟢' : 'REQUER ATENÇÃO ⚠️'}`);

    } catch (err) {
      console.error(`  - Erro ao acessar: ${err.message}`);
      report.push({
        name: prod.name,
        url: prod.url,
        httpStatus: 0,
        isPageFound: false,
        amazonTitle: 'ERRO DE ACESSO',
        hasBuyButton: false,
        availability: err.message,
        isReadyForPurchase: false
      });
    } finally {
      await page.close();
      await new Promise(r => setTimeout(r, 1000)); // Delay para não tomar captcha
    }
  }

  await browser.close();

  console.log('\n================ RESUMO FINAL DA AUDITORIA ================');
  const readyCount = report.filter(r => r.isReadyForPurchase).length;
  console.log(`Total Auditado: ${report.length}`);
  console.log(`Aptos e Prontos para Compra: ${readyCount} / ${report.length}`);
  if (readyCount < report.length) {
    console.log('Itens que requerem ajuste:');
    report.filter(r => !r.isReadyForPurchase).forEach(r => {
      console.log(` - ${r.name}: ${r.availability}`);
    });
  } else {
    console.log('✅ TODOS OS 11 PRODUTOS ESTÃO NO AR E PRONTOS PARA COMPRA!');
  }
}

checkLiveAmazonProducts();
