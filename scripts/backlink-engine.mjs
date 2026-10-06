// @ts-check
/**
 * scripts/backlink-engine.mjs
 * 
 * Motor Automático de Descoberta e Oportunidades de Backlinks para o Animotem.
 * 
 * Conecta:
 * 1. Pesquisa de SERP via Serper API (usando scripts/seo-serper.mjs logic)
 * 2. Mapeamento de Ativos Citáveis (Linkable Assets):
 *    - Quiz Interativo: /quiz/animal-de-poder
 *    - Enciclopédia & LLMs: /llms.txt e Artigos Canônicos
 * 3. Classificação de Oportunidades (Blogs de Nicho, Listas de Recursos, Referências de Arquétipos)
 * 4. Geração de abordagens (Pitches de E-mail / Contato) prontas para cópia em concorrencia/oportunidades-backlinks.md
 */

import fs from 'node:fs';
import path from 'node:path';

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const REPORT_FILE = path.resolve('concorrencia/oportunidades-backlinks.md');
const LEDGER_FILE = path.resolve('.browser-session/backlink-opportunities.json');

// Nossos Ativos Citáveis (Linkable Assets)
const LINKABLE_ASSETS = [
  {
    id: 'quiz-animal-de-poder',
    name: 'Quiz Interativo: Descubra seu Animal de Poder',
    url: 'https://animotem.com/quiz/animal-de-poder',
    type: 'Interactive Tool / Quiz',
    targetNiche: 'Blogs de holismo, testes, comportamento, espiritualidade e autoconhecimento',
    pitchHook: 'Oferecer um teste gratuito e interativo para engajar os leitores do artigo deles.'
  },
  {
    id: 'enciclopedia-arquetipos',
    name: 'Enciclopédia de Arquétipos e Simbologia Animal',
    url: 'https://animotem.com/llms.txt',
    type: 'Reference Guide / Encyclopedia',
    targetNiche: 'Artigos sobre sonhos, mitologia, psicologia junguiana e xamanismo',
    pitchHook: 'Citar o Animotem como fonte de referência técnica e simbólica para termos específicos.'
  }
];

// Palavras-chave semente para buscar parceiros e blogs no Google
const SEARCH_QUERIES = [
  "melhores testes espiritualidade autoconhecimento",
  "o que significa sonhar com coruja blog",
  "arquétipos de animais xamanismo artigo",
  "simbologia dos sonhos animais significado",
  "totem animal guia espiritual blog",
  "descoberta do animal de poder significado"
];

// Domínios a ignorar (redes sociais, grandes portais genéricos, e-commerce)
const EXCLUDED_DOMAINS = [
  'animotem.com', 'facebook.com', 'instagram.com', 'youtube.com',
  'pinterest.com', 'amazon.com.br', 'wikipedia.org', 'globo.com', 'uol.com.br'
];

async function fetchSerpResults(query) {
  if (!SERPER_API_KEY) {
    console.warn(`⚠️ SERPER_API_KEY não encontrada no ambiente. Gerando modelo estático de prospecção.`);
    return null;
  }

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: query,
        gl: "br",
        hl: "pt-br",
        num: 15
      })
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.organic || [];
  } catch (err) {
    console.error(`❌ Erro ao buscar SERP para "${query}":`, err.message);
    return null;
  }
}

function analyzeOpportunity(item, query) {
  const url = item.link || '';
  const title = item.title || '';
  const snippet = item.snippet || '';

  // Verifica se é domínio excluído
  if (EXCLUDED_DOMAINS.some(domain => url.includes(domain))) {
    return null;
  }

  // Identifica tipo de oportunidade
  let type = 'Blog de Nicho (Citação Complementar)';
  let matchedAsset = LINKABLE_ASSETS[0]; // Quiz por padrão

  const lowerText = (title + ' ' + snippet).toLowerCase();

  if (lowerText.includes('teste') || lowerText.includes('quiz') || lowerText.includes('descubra') || lowerText.includes('lista')) {
    type = 'Página de Recursos / Listicles (Inserção de Quiz)';
    matchedAsset = LINKABLE_ASSETS[0];
  } else if (lowerText.includes('sonhar') || lowerText.includes('significado') || lowerText.includes('simbologia')) {
    type = 'Artigo de Conteúdo (Link de Referência / Leitura Recomendada)';
    matchedAsset = LINKABLE_ASSETS[1];
  }

  // Gera pitch personalizado
  const domainName = new URL(url).hostname.replace('www.', '');
  const pitch = generatePitch(domainName, title, matchedAsset, type);

  return {
    domain: domainName,
    pageTitle: title,
    pageUrl: url,
    snippet: snippet,
    keywordFound: query,
    opportunityType: type,
    recommendedAsset: matchedAsset.name,
    assetUrl: matchedAsset.url,
    pitchTemplate: pitch
  };
}

function generatePitch(domain, title, asset, type) {
  return `Olá, equipe do ${domain}!

Estava lendo o excelente artigo "${title}" e achei o conteúdo incrível e muito esclarecedor sobre o tema.

No Animotem (Bestiário Interior), desenvolvemos um ${asset.name} que se complementa perfeitamente com o seu texto (${asset.url}).

Acredito que seria um acréscimo de enorme valor para os seus leitores caso queiram testar ou aprofundar no assunto logo no final do artigo. 

Se achar pertinente, ficaria muito honrado com a citação!

Um grande abraço,
Equipe Animotem — Bestiário Interior`;
}

async function run() {
  console.log('🚀 Iniciando Motor de Descoberta de Backlinks Naturais...');

  if (!fs.existsSync('.browser-session')) {
    fs.mkdirSync('.browser-session', { recursive: true });
  }

  const opportunities = [];

  for (const query of SEARCH_QUERIES) {
    console.log(`🔍 Pesquisando oportunidades para: "${query}"...`);
    const results = await fetchSerpResults(query);

    if (results && results.length > 0) {
      for (const item of results) {
        const opp = analyzeOpportunity(item, query);
        if (opp) {
          opportunities.push(opp);
        }
      }
    }
  }

  // Se não temos SERPER_API_KEY ou não vieram resultados, insere exemplos estratégicos de alta conversão
  if (opportunities.length === 0) {
    console.log('ℹ️ Alimentando com matriz de alvos estratégicos do nicho...');
    opportunities.push(
      {
        domain: 'blog-exemplo-espiritualidade.com.br',
        pageTitle: 'Os Melhores Testes e Quizzes de Autoconhecimento',
        pageUrl: 'https://blog-exemplo-espiritualidade.com.br/quizzes-autoconhecimento',
        snippet: 'Confira os testes mais populares para descobrir seus arquétipos...',
        keywordFound: 'melhores testes espiritualidade autoconhecimento',
        opportunityType: 'Página de Recursos / Listicles (Inserção de Quiz)',
        recommendedAsset: LINKABLE_ASSETS[0].name,
        assetUrl: LINKABLE_ASSETS[0].url,
        pitchTemplate: generatePitch('blog-exemplo-espiritualidade.com.br', 'Os Melhores Testes e Quizzes', LINKABLE_ASSETS[0], 'Página de Recursos')
      }
    );
  }

  // Remover duplicatas de domínio
  const uniqueOpportunities = [];
  const seenDomains = new Set();
  for (const opp of opportunities) {
    if (!seenDomains.has(opp.domain)) {
      seenDomains.add(opp.domain);
      uniqueOpportunities.push(opp);
    }
  }

  // Salvar Ledger JSON
  fs.writeFileSync(LEDGER_FILE, JSON.stringify(uniqueOpportunities, null, 2));

  // Gerar Relatório Markdown
  const dateStr = new Date().toISOString().split('T')[0];
  let markdown = `# 🔗 Motor de Oportunidades de Backlinks Naturais\n\n`;
  markdown += `*Data da Análise:* ${dateStr}\n`;
  markdown += `*Total de Alvos Identificados:* ${uniqueOpportunities.length}\n\n`;
  markdown += `--- \n\n`;

  markdown += `## 🎯 Nossos Ativos Citáveis (Linkable Assets Prontos)\n`;
  LINKABLE_ASSETS.forEach(a => {
    markdown += `- **${a.name}**: [${a.url}](${a.url}) — *${a.type}*\n`;
  });
  markdown += `\n--- \n\n`;

  markdown += `## 📋 Fila de Prospecção de Backlinks\n\n`;

  uniqueOpportunities.forEach((opp, idx) => {
    markdown += `### ${idx + 1}. Portal: **${opp.domain}**\n`;
    markdown += `- **Página Alvo:** [${opp.pageTitle}](${opp.pageUrl})\n`;
    markdown += `- **Palavra-chave Relacionada:** \`${opp.keywordFound}\`\n`;
    markdown += `- **Tipo de Oportunidade:** ${opp.opportunityType}\n`;
    markdown += `- **Ativo do Animotem Sugerido:** [${opp.recommendedAsset}](${opp.assetUrl})\n\n`;
    markdown += `> ✉️ **Pitch Sugerido para Contato:**\n`;
    markdown += `\`\`\`text\n${opp.pitchTemplate}\n\`\`\`\n\n`;
    markdown += `---\n\n`;
  });

  const reportDir = path.dirname(REPORT_FILE);
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  fs.writeFileSync(REPORT_FILE, markdown);

  console.log(`✅ Motor de Backlinks finalizado! Relatório salvo em: ${REPORT_FILE}`);
}

run().catch(console.error);
