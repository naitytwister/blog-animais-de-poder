#!/usr/bin/env node
// Consulta dados do Cloudflare Web Analytics (RUM) via GraphQL Analytics API.
// Uso: node scripts/analytics.mjs [--horas 24] [--path /quiz/animal-de-poder/]
// Config via .env na raiz do projeto:
//   CLOUDFLARE_API_TOKEN=<token com Account > Account Analytics > Read>
//   CLOUDFLARE_ACCOUNT_ID=<id da conta>
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const env = { ...process.env };
  try {
    for (const line of readFileSync(join(root, '.env'), 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
  return env;
}

const env = loadEnv();
const TOKEN = env.CLOUDFLARE_API_TOKEN;
const ACCOUNT = env.CLOUDFLARE_ACCOUNT_ID;

if (!TOKEN || !ACCOUNT) {
  console.error(
    'Faltam credenciais. Crie um .env na raiz com:\n' +
      '  CLOUDFLARE_API_TOKEN=<token>\n' +
      '  CLOUDFLARE_ACCOUNT_ID=<id>\n' +
      '(token: My Profile > API Tokens > Create Token > Account > Account Analytics > Read)',
  );
  process.exit(1);
}

function flagArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) return process.argv[i + 1];
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  return eq?.split('=')[1];
}

const horas = Number(flagArg('horas') ?? 24);
const pathFilter = flagArg('path');
const from = new Date(Date.now() - horas * 3600_000).toISOString();
const to = new Date().toISOString();

async function gql(query) {
  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join('; '));
  return json.data;
}

function rows(data) {
  return data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups ?? [];
}

function queryNode(args, fields) {
  return `accounts(filter: { accountTag: "${ACCOUNT}" }) { rumPageloadEventsAdaptiveGroups(${args}, limit: 2000) { count dimensions { ${fields} } } }`;
}

const baseArgs = pathFilter
  ? `filter: { datetime_geq: "${from}", datetime_lt: "${to}", requestPath: "${pathFilter}" }`
  : `filter: { datetime_geq: "${from}", datetime_lt: "${to}" }`;

const fmt = new Intl.NumberFormat('pt-BR');
const pct = (v, t) => (t ? ` ${((v / t) * 100).toFixed(1)}%` : '');

async function main() {
  const pathClause = pathFilter ? `filter: { datetime_geq: "${from}", datetime_lt: "${to}", requestPath: "${pathFilter}" }` : `filter: { datetime_geq: "${from}", datetime_lt: "${to}" }`;
  const base = `accounts(filter: { accountTag: "${ACCOUNT}" }) { rumPageloadEventsAdaptiveGroups(${pathClause}, limit: 2000`;

  const [total, porDia, topPath, topPais, topBrowser, topOS, topDevice, topRef, ultimos] =
    await Promise.all([
      gql(`{ viewer { ${queryNode(baseArgs, 'date')} } }`).catch(() => ({})),
      gql(`{ viewer { ${queryNode(baseArgs + ', orderBy: [date_DESC]', 'date')} } }`),
      gql(`{ viewer { ${queryNode(baseArgs + ', orderBy: [count_DESC]', 'requestPath')} } }`),
      gql(`{ viewer { ${queryNode(baseArgs + ', orderBy: [count_DESC]', 'countryName')} } }`),
      gql(`{ viewer { ${queryNode(baseArgs + ', orderBy: [count_DESC]', 'userAgentBrowser')} } }`),
      gql(`{ viewer { ${queryNode(baseArgs + ', orderBy: [count_DESC]', 'userAgentOS')} } }`),
      gql(`{ viewer { ${queryNode(baseArgs + ', orderBy: [count_DESC]', 'deviceType')} } }`),
      gql(`{ viewer { ${queryNode(baseArgs + ', orderBy: [count_DESC]', 'refererHost')} } }`),
      gql(`{ viewer { ${queryNode(baseArgs + ', orderBy: [datetimeFiveMinutes_DESC]', 'datetimeFiveMinutes requestPath')} } }`),
    ]);

  const totalViews = rows(total).reduce((s, r) => s + r.count, 0);
  console.log(`\n=== Cloudflare Web Analytics (ultimas ${horas}h) ===`);
  if (pathFilter) console.log(`Filtro: ${pathFilter}`);
  console.log(`Page views: ${fmt.format(totalViews)}`);

  console.log('\n-- Por dia --');
  for (const r of rows(porDia)) console.log(`  ${r.dimensions.date}: ${fmt.format(r.count)}`);

  console.log('\n-- Top 10 paginas --');
  for (const r of rows(topPath).slice(0, 10))
    console.log(`  ${fmt.format(r.count).padStart(8)}${pct(r.count, totalViews).padStart(7)}  ${r.dimensions.requestPath || '(vazio)'}`);

  console.log('\n-- Paises --');
  for (const r of rows(topPais).slice(0, 8))
    console.log(`  ${fmt.format(r.count).padStart(8)}  ${r.dimensions.countryName || '(desconhecido)'}`);

  console.log('\n-- Browsers --');
  for (const r of rows(topBrowser).slice(0, 6))
    console.log(`  ${fmt.format(r.count).padStart(8)}  ${r.dimensions.userAgentBrowser || '(desconhecido)'}`);

  console.log('\n-- SO --');
  for (const r of rows(topOS).slice(0, 6))
    console.log(`  ${fmt.format(r.count).padStart(8)}  ${r.dimensions.userAgentOS || '(desconhecido)'}`);

  console.log('\n-- Dispositivos --');
  for (const r of rows(topDevice).slice(0, 5))
    console.log(`  ${fmt.format(r.count).padStart(8)}  ${r.dimensions.deviceType || '(desconhecido)'}`);

  console.log('\n-- Referrers --');
  for (const r of rows(topRef).slice(0, 6))
    console.log(`  ${fmt.format(r.count).padStart(8)}  ${r.dimensions.refererHost || '(direto)'}`);

  console.log('\n-- Ultimas 5 janelas de 5 min --');
  for (const r of rows(ultimos).slice(0, 5))
    console.log(`  ${r.dimensions.datetimeFiveMinutes}: ${fmt.format(r.count)}  ${r.dimensions.requestPath || ''}`);
}

main().catch((e) => {
  console.error('Erro:', e.message);
  process.exit(1);
});