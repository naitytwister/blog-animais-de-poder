import fs from 'node:fs';
import path from 'node:path';

const SERPER_API_KEY = process.env.SERPER_API_KEY;
if (!SERPER_API_KEY) {
  console.error("Faltou SERPER_API_KEY no .env");
  process.exit(1);
}

const TOP_KEYWORDS = [
  "animais de poder significado",
  "o que significa sonhar com onça",
  "totem animal"
];

const OUR_DOMAIN = "animotem.com";

// Função para buscar no Google via Serper.dev
async function getSerp(keyword) {
  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: keyword,
        gl: "br",
        hl: "pt-br",
        num: 10 // Apenas Top 10
      })
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    return null;
  }
}

// Tenta raspar a página para extrair algumas métricas On-Page
async function analyzeOnPage(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 segs max

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });
    clearTimeout(timeout);

    if (!res.ok) return { words: 0, title: "", h1: "" };

    let html = await res.text();
    
    // Pega title e h1
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    
    // Conta palavras tirando scripts e tags
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    text = text.replace(/<[^>]+>/g, ' '); // remove as tags html
    
    const words = text.split(/\s+/).filter(w => w.trim().length > 1).length;

    return {
      title: titleMatch ? titleMatch[1].trim() : "",
      h1: h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : "",
      words: words
    };
  } catch (e) {
    return { words: 0, title: "", h1: "Erro ou Timeout" };
  }
}

async function run() {
  console.log("🚀 Iniciando Deep Crawl de Concorrentes (SEMRush Killer)...");
  
  let report = `# 📊 Relatório Avançado de SEO: Top 10 Concorrência\n\n`;
  report += `*Gerado com Serper API + Scraping Nativo*\n\n`;

  for (const kw of TOP_KEYWORDS) {
    console.log(`\n🔍 Analisando SERP para: "${kw}"...`);
    const serpData = await getSerp(kw);
    if (!serpData || !serpData.organic) {
      console.log(`Falhou ao obter SERP para ${kw}`);
      continue;
    }

    report += `## 🏆 Palavra-chave: **${kw}**\n\n`;
    report += `**Features da SERP Detectadas:** `;
    const features = [];
    if (serpData.knowledgeGraph) features.push("Knowledge Graph");
    if (serpData.peopleAlsoAsk) features.push("People Also Ask");
    if (serpData.relatedSearches) features.push("Related Searches");
    report += `${features.length ? features.join(', ') : 'Apenas Orgânico'}\n\n`;

    report += `| Pos | Domínio / Site | Word Count (aprox) | H1 Identificado | Ação Estratégica |\n`;
    report += `|---|---|---|---|---|\n`;

    const organics = serpData.organic.slice(0, 10);
    for (let i = 0; i < organics.length; i++) {
      const res = organics[i];
      const domain = new URL(res.link).hostname.replace('www.', '');
      console.log(`   [${i+1}] Analisando ${domain}...`);
      
      const onPage = await analyzeOnPage(res.link);
      
      const isUs = domain.includes(OUR_DOMAIN);
      const icon = isUs ? "🌟" : "⚔️";
      
      // Classificando a força
      let wordCount = onPage.words > 0 ? onPage.words.toString() : 'N/A';
      let strategy = "Superar c/ 2000+ words";
      if (onPage.words > 2500) strategy = "Requer Guia Definitivo";
      if (onPage.words > 0 && onPage.words < 800) strategy = "Alvo Fácil (Conteúdo Raso)";
      if (isUs) strategy = "Nosso Site!";
      if (onPage.words === 0) strategy = "Vídeo/Portal Bloqueado";

      let cleanH1 = onPage.h1.substring(0, 40).replace(/\n/g, ' ') + (onPage.h1.length > 40 ? '...' : '');
      if (!cleanH1) cleanH1 = "-";

      report += `| ${icon} ${i+1} | [${domain}](${res.link}) | ${wordCount} | ${cleanH1} | ${strategy} |\n`;
    }
    report += `\n---\n`;
  }

  const outPath = path.resolve('concorrencia/super-relatorio-seo.md');
  fs.writeFileSync(outPath, report);
  console.log(`\n✅ Relatório completo gerado em: ${outPath}`);
}

run();
