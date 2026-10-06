// @ts-check
/**
 * scripts/seo-cloudflare.mjs
 * 
 * Puxa os relatórios de SEO/Analytics do Cloudflare via GraphQL API.
 * Busca visitantes únicos, total de pageviews e principais origens de tráfego.
 */
import fs from 'node:fs';
import path from 'node:path';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const REPORT_FILE = path.resolve('concorrencia/cloudflare-stats.md');

async function getAnalytics() {
  const query = `
    query {
      viewer {
        accounts(filter: {accountTag: "${ACCOUNT_ID}"}) {
          webTrafficStats: httpRequests1dGroups(
            limit: 1, 
            filter: {date_geq: "${new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]}"}
          ) {
            sum {
              pageViews
              requests
            }
            uniq {
              uniques
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    if (json.errors) {
      console.error("GraphQL Errors:", json.errors);
      return null;
    }

    const data = json.data?.viewer?.accounts?.[0]?.webTrafficStats?.[0];
    return data || null;
  } catch (e) {
    console.error("Erro ao puxar dados do Cloudflare:", e.message);
    return null;
  }
}

async function run() {
  if (!API_TOKEN || !ACCOUNT_ID) {
    console.error("❌ CLOUDFLARE_API_TOKEN ou CLOUDFLARE_ACCOUNT_ID faltando no arquivo .env");
    process.exit(1);
  }
  
  if (API_TOKEN.startsWith("{")) {
    console.error("❌ O CLOUDFLARE_API_TOKEN no .env parece ser o JSON da Policy. Por favor, cole o Token Bearer gerado pelo Cloudflare (string alfanumérica).");
    process.exit(1);
  }

  console.log("📊 Puxando métricas dos últimos 7 dias do Cloudflare...");
  const stats = await getAnalytics();
  
  if (stats) {
    const md = `## 📊 Estatísticas Cloudflare (Últimos 7 dias)
    
- **PageViews (Total):** ${stats.sum?.pageViews || 0}
- **Visitantes Únicos:** ${stats.uniq?.uniques || 0}
- **Requisições Totais:** ${stats.sum?.requests || 0}

*(Atualizado em ${new Date().toLocaleString()})*
`;
    fs.writeFileSync(REPORT_FILE, md);
    console.log(`✅ Relatório salvo em: ${REPORT_FILE}`);
  } else {
    console.log("⚠️ Nenhum dado retornado ou erro na requisição.");
  }
}

run().catch(console.error);
