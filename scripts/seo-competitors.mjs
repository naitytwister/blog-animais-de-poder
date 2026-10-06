// @ts-check
/**
 * scripts/seo-competitors.mjs
 * 
 * Verifica os sitemaps dos principais concorrentes para identificar novos artigos (lacunas de conteúdo).
 * Mantém um cache local das URLs já vistas para notificar apenas as novidades.
 */

import fs from 'node:fs';
import path from 'node:path';

const CACHE_FILE = path.resolve('.browser-session/competitors-cache.json');
const REPORT_FILE = path.resolve('concorrencia/novidades-concorrentes.md');

const COMPETITORS = [
  { name: 'Animais de Poder', sitemapUrl: 'https://www.animaisdepoder.com.br/blog-posts-sitemap.xml' },
  { name: 'Voz dos Elementos', sitemapUrl: 'https://vozdoselementos.com.br/post-sitemap.xml' },
  { name: 'Xamanismo Sete Raios', sitemapUrl: 'https://xamanismoseteraios.com.br/post-sitemap.xml' }
];

async function fetchSitemapLocs(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const regex = /<loc>(.*?)<\/loc>/g;
    let match;
    const urls = new Set();
    while ((match = regex.exec(xml)) !== null) {
      if (match[1]) urls.add(match[1].trim());
    }
    return Array.from(urls);
  } catch (error) {
    console.error(`❌ Erro ao buscar sitemap ${url}:`, error.message);
    return [];
  }
}

async function run() {
  console.log('🔍 Iniciando verificação de Sitemaps de concorrentes...');
  
  // Garantir diretório
  if (!fs.existsSync('.browser-session')) {
    fs.mkdirSync('.browser-session', { recursive: true });
  }

  // Carregar Cache
  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    } catch (e) {
      cache = {};
    }
  }

  const dateStr = new Date().toISOString().split('T')[0];
  let hasNews = false;
  let reportMd = `\n## 📝 Relatório de Monitoramento (${dateStr})\n\n`;

  for (const comp of COMPETITORS) {
    console.log(`Buscando ${comp.name}...`);
    const urls = await fetchSitemapLocs(comp.sitemapUrl);
    console.log(`Encontradas ${urls.length} URLs.`);

    if (!cache[comp.name]) {
      cache[comp.name] = [];
    }

    const previousUrls = new Set(cache[comp.name]);
    const newUrls = urls.filter(u => !previousUrls.has(u));

    if (newUrls.length > 0) {
      hasNews = true;
      reportMd += `### ${comp.name} (Novos: ${newUrls.length})\n`;
      newUrls.forEach(u => {
        reportMd += `- ${u}\n`;
      });
      reportMd += `\n`;
      console.log(`⭐ ${newUrls.length} novos links encontrados em ${comp.name}!`);
    }

    // Atualiza cache
    cache[comp.name] = urls;
  }

  // Salva cache
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));

  // Adiciona ao relatório se houver novidades
  if (hasNews) {
    const reportDir = path.dirname(REPORT_FILE);
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
    
    let existingReport = '';
    if (fs.existsSync(REPORT_FILE)) {
      existingReport = fs.readFileSync(REPORT_FILE, 'utf-8');
    } else {
      existingReport = '# Rastreador de Novidades da Concorrência\n\nEste arquivo registra automaticamente novos artigos detectados nos sitemaps.\n';
    }

    const newContent = existingReport.replace(/# Rastreador.*?\n\n/is, `$&${reportMd}`);
    if (newContent === existingReport) {
      fs.writeFileSync(REPORT_FILE, existingReport + reportMd);
    } else {
      fs.writeFileSync(REPORT_FILE, newContent);
    }
    console.log('📄 Relatório atualizado em:', REPORT_FILE);
  } else {
    console.log('✅ Nenhuma novidade detectada. SiteTracker finalizado.');
  }
}

run().catch(console.error);
