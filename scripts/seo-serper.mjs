// @ts-check
import fs from 'node:fs';
import path from 'node:path';

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const REPORT_FILE = path.resolve('concorrencia/serp-rankings.md');

// Nossas palavras-chave semente
const KEYWORDS = [
  "animais de poder",
  "o que significa sonhar com onça",
  "coruja animal de poder",
  "borboleta xamanismo",
  "sinais espirito animal",
  "totem animal",
  "significado espiritual paralisia do sono"
];

// Nossos domínios de interesse (Nós e os concorrentes mapeados)
const TARGET_DOMAINS = [
  "animotem.com",
  "animaisdepoder.com.br",
  "vozdoselementos.com.br",
  "xamanismoseteraios.com.br"
];

async function checkKeyword(keyword) {
  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: keyword,
        gl: "br", // Brasil
        hl: "pt-br", // Idioma
        num: 20 // Pega os top 20 resultados
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.organic || [];
  } catch (err) {
    console.error(`Erro ao checar SERP para "${keyword}":`, err.message);
    return [];
  }
}

async function run() {
  if (!SERPER_API_KEY) {
    console.error("❌ SERPER_API_KEY não definida no .env");
    process.exit(1);
  }

  console.log("🔍 Iniciando checagem de SERP (Rankings Google)...");
  let report = `## 🏆 Rankings no Google (Top 20)\n\nData: ${new Date().toISOString().split('T')[0]}\n\n`;

  for (const kw of KEYWORDS) {
    console.log(`Buscando: "${kw}"...`);
    const results = await checkKeyword(kw);
    
    report += `### Palavra-chave: **${kw}**\n`;
    let foundAny = false;

    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      // Verifica se o link pertence a um dos nossos domínios alvo
      const domainMatch = TARGET_DOMAINS.find(d => res.link.includes(d));
      if (domainMatch) {
        foundAny = true;
        const icon = domainMatch === 'animotem.com' ? '🌟' : '⚔️';
        report += `- ${icon} **Pos #${i + 1}** - ${domainMatch}\n  - URL: [${res.title}](${res.link})\n`;
      }
    }

    if (!foundAny) {
      report += `- _Nenhum dos domínios monitorados apareceu no Top 20._\n`;
    }
    report += `\n`;
  }

  // Atualizar / Salvar o relatório de SERP
  const reportDir = path.dirname(REPORT_FILE);
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  fs.writeFileSync(REPORT_FILE, report);
  console.log(`✅ Relatório de Rankings salvo em: ${REPORT_FILE}`);
}

run().catch(console.error);
