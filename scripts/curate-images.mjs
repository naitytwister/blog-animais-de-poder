#!/usr/bin/env node
/**
 * scripts/curate-images.mjs
 * 
 * Motor Corporativo de Curadoria de Imagens Documentais & Acervos Abertos.
 * Padrão de Engenharia Sênior:
 * 1. Provedor Aberto de Alta Resolução: Wikimedia Commons (Fauna Documental, Taxonomia & Acervos Históricos).
 * 2. Filtragem de Enquadramento: Orientação horizontal (landscape) e resolução mínima de 1000px.
 * 3. Validação Binária por Magic Bytes (previne falsos positivos/páginas de erro).
 * 4. Escrita Atômica no Disco (.tmp + rename).
 * 5. Backoff Exponencial com Jitter contra Rate Limits (HTTP 429).
 * 6. Injeção de Legendas e Fontes de Atribuição no Frontmatter Markdown.
 * 7. Zero dependências externas (Usa Node.js nativo 18+).
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// --- CONFIGURAÇÕES BÁSICAS ---
const POSTS_DIR = path.resolve('src/content/posts');
const IMAGES_DIR = path.resolve('public/images');
const USER_AGENT = 'AnimotemCurator/1.0 (+https://animotem.com; contato@animotem.com)';
const DEFAULT_TIMEOUT_MS = 15000;

// Mapeamento taxonômico e documental de alta fidelidade
const ANIMAL_TAXONOMY = {
  'coruja': { common: 'owl', scientific: 'Tyto alba OR Strigiformes', namePt: 'Coruja' },
  'lobo': { common: 'wolf', scientific: 'Canis lupus', namePt: 'Lobo' },
  'onca': { common: 'jaguar', scientific: 'Panthera onca', namePt: 'Onça-Pintada' },
  'jaguar': { common: 'jaguar', scientific: 'Panthera onca', namePt: 'Jaguar / Onça' },
  'aguia': { common: 'eagle', scientific: 'Aquila chrysaetos OR Haliaeetus leucocephalus', namePt: 'Águia' },
  'serpente': { common: 'serpent', scientific: 'Serpentes OR Crotalus', namePt: 'Serpente' },
  'cobra': { common: 'snake', scientific: 'Serpentes OR Bothrops', namePt: 'Serpente' },
  'tartaruga': { common: 'sea turtle tortoise', scientific: 'Chelonia mydas OR Testudinidae', namePt: 'Tartaruga' },
  'aranha': { common: 'spider', scientific: 'Araneae', namePt: 'Aranha' },
  'urso': { common: 'bear', scientific: 'Ursus arctos', namePt: 'Urso' },
  'borboleta': { common: 'butterfly', scientific: 'Lepidoptera', namePt: 'Borboleta' },
  'cavalo': { common: 'wild horse', scientific: 'Equus caballus', namePt: 'Cavalo' },
  'leao': { common: 'lion', scientific: 'Panthera leo', namePt: 'Leão' },
  'tigre': { common: 'tiger', scientific: 'Panthera tigris', namePt: 'Tigre' },
  'golfinho': { common: 'dolphin', scientific: 'Delphinidae', namePt: 'Golfinho' },
  'baleia': { common: 'whale', scientific: 'Cetacea OR Megaptera novaeangliae', namePt: 'Baleia' },
  'tubarao': { common: 'shark', scientific: 'Selachimorpha', namePt: 'Tubarão' },
  'elefante': { common: 'elephant', scientific: 'Elephas maximus OR Loxodonta', namePt: 'Elefante' },
  'morcego': { common: 'bat', scientific: 'Chiroptera', namePt: 'Morcego' },
  'beija-flor': { common: 'hummingbird', scientific: 'Trochilidae', namePt: 'Beija-flor' },
  'raposa': { common: 'fox', scientific: 'Vulpes vulpes', namePt: 'Raposa' },
  'sapo': { common: 'frog toad', scientific: 'Anura OR Bufonidae', namePt: 'Sapo' },
  'peixe': { common: 'fish', scientific: 'Actinopterygii', namePt: 'Peixe' },
  'jacare': { common: 'alligator caiman', scientific: 'Caiman crocodilus', namePt: 'Jacaré' },
  'abelha': { common: 'honeybee bee', scientific: 'Apis mellifera', namePt: 'Abelha' },
  'cachorro': { common: 'dog domestic', scientific: 'Canis lupus familiaris', namePt: 'Cão' },
  'gato': { common: 'cat domestic', scientific: 'Felis catus', namePt: 'Gato' },
  'corvo': { common: 'raven crow', scientific: 'Corvus corax', namePt: 'Corvo' }
};

// --- LOGGERS COLORIDOS ---
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  warn: (msg) => console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`),
  error: (msg) => console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`)
};

// --- FETCH COM RETRY & TIMEOUT ---
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT_MS);

      const headers = {
        'User-Agent': USER_AGENT,
        ...(options.headers || {})
      };

      const res = await fetch(url, { ...options, signal: controller.signal, headers });
      clearTimeout(timer);

      if (res.status === 429) {
        const jitter = Math.random() * 500;
        const delay = Math.pow(2, attempt) * 1000 + jitter;
        log.warn(`Rate limit 429 em ${url}. Aguardando ${Math.round(delay)}ms antes da tentativa ${attempt + 1}...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return res;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const jitter = Math.random() * 400;
      const delay = Math.pow(2, attempt) * 800 + jitter;
      log.warn(`Tentativa ${attempt} falhou (${err.message}). Nova tentativa em ${Math.round(delay)}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// --- VALIDAÇÃO POR MAGIC BYTES ---
function validateImageMagicBytes(buffer) {
  if (!buffer || buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'jpg';
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'png';
  }

  // WebP: RIFF .... WEBP
  const riff = buffer.subarray(0, 4).toString('ascii');
  const webp = buffer.subarray(8, 12).toString('ascii');
  if (riff === 'RIFF' && webp === 'WEBP') {
    return 'webp';
  }

  return false;
}

// --- ESCRITA ATÔMICA EM DISCO ---
async function writeAtomicImage(destPath, buffer) {
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const tempName = `.tmp_${crypto.randomUUID()}_${path.basename(destPath)}`;
  const tempPath = path.join(dir, tempName);

  await fs.promises.writeFile(tempPath, buffer);
  await fs.promises.rename(tempPath, destPath);
}

// --- BUSCA PRECISA DE FAUNA DOCUMENTAL NO WIKIMEDIA COMMONS ---
async function searchWikimediaDocumentary(animalKey) {
  const tax = ANIMAL_TAXONOMY[animalKey];
  if (!tax) return null;

  try {
    const query = `"${tax.scientific}" OR "${tax.common}" filetype:bitmap -chair -diagram -map -flag -icon`;
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&prop=imageinfo&iiprop=url|size|extmetadata&format=json&gsrlimit=8`;

    const res = await fetchWithRetry(url, { timeout: 12000 });
    const data = await res.json();

    if (!data.query || !data.query.pages) return null;

    const pages = Object.values(data.query.pages);
    for (const page of pages) {
      const info = page.imageinfo && page.imageinfo[0];
      if (!info || !info.url) continue;

      // Validação de enquadramento: paisagem (horizontal) e resolução mínima 1000px
      if (info.width && info.width >= 1000 && info.width > info.height) {
        const meta = info.extmetadata || {};
        const titleClean = page.title.replace(/^File:/, '').replace(/\.[^.]+$/, '').replace(/_/g, ' ');
        const license = (meta.LicenseShortName && meta.LicenseShortName.value) || 'Domínio Público / CC';
        const artist = (meta.Artist && meta.Artist.value.replace(/<[^>]*>/g, '').trim()) || 'Wikimedia Commons';

        return {
          source: 'wikimedia',
          imageUrl: info.url,
          fonteUrl: info.descriptionurl || 'https://commons.wikimedia.org',
          legenda: `Fotografia documental de ${tax.namePt}: ${titleClean}. Registro fotográfico: ${artist} (${license}).`,
          alt: `Registro fotográfico documental de ${tax.namePt} em habitat natural`
        };
      }
    }
  } catch (err) {
    log.warn(`Wikimedia API falhou para '${animalKey}': ${err.message}`);
  }
  return null;
}

// --- IDENTIFICADOR DO ANIMAL A PARTIR DO SLUG OU TÍTULO ---
function detectAnimalKey(slug, title) {
  const text = `${slug} ${title}`.toLowerCase();
  for (const key of Object.keys(ANIMAL_TAXONOMY)) {
    if (text.includes(key)) {
      return key;
    }
  }
  return null;
}

// --- PARSER DE FRONTMATTER SIMPLES E SEGURO ---
function parseMarkdownPost(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  if (!raw.startsWith('---')) return null;

  const parts = raw.split('---');
  if (parts.length < 3) return null;

  const yamlContent = parts[1];
  const body = parts.slice(2).join('---');

  const meta = {};
  for (const line of yamlContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf(':');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
      meta[key] = val;
    }
  }

  return { raw, yamlContent, body, meta };
}

// --- ATUALIZAÇÃO DO FRONTMATTER PRESERVANDO ESTRUTURA ---
function updateMarkdownFrontmatter(filePath, post, newFields) {
  const meta = { ...post.meta, ...newFields };
  const lines = ['---'];

  for (const [key, val] of Object.entries(meta)) {
    if (val === undefined || val === null) continue;
    if (typeof val === 'string' && (val.includes(':') || val.includes('#') || val.includes("'") || val.includes('"'))) {
      lines.push(`${key}: "${val.replace(/"/g, '\\"')}"`);
    } else {
      lines.push(`${key}: ${val}`);
    }
  }

  lines.push('---');
  lines.push(post.body.trimStart());

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
}

// --- EXECUÇÃO PRINCIPAL ---
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const targetSlug = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;
  const batchSizeArg = args.includes('--batch-size') ? parseInt(args[args.indexOf('--batch-size') + 1], 10) : 3;

  log.info(`Iniciando Curadoria Corporativa de Imagens ${isDryRun ? '(MODO DRY-RUN)' : ''}...`);

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  log.info(`Catálogo total: ${files.length} artigos.`);

  let processedCount = 0;

  for (const file of files) {
    if (processedCount >= batchSizeArg) break;

    const filePath = path.join(POSTS_DIR, file);
    const post = parseMarkdownPost(filePath);
    if (!post) continue;

    const slug = post.meta.slug || path.basename(file, '.md');
    if (targetSlug && slug !== targetSlug) continue;

    // Se já tiver imagem_legenda com curadoria, pula para dar prioridade aos que ainda não têm
    if (post.meta.imagem_legenda && post.meta.imagem_fonte_url && !targetSlug) {
      continue;
    }

    const animalKey = detectAnimalKey(slug, post.meta.title || '');
    if (!animalKey) continue;

    log.info(`Processando: '${post.meta.title || slug}' (Animal: ${animalKey})`);

    const curated = await searchWikimediaDocumentary(animalKey);
    if (!curated) {
      log.warn(`Nenhuma imagem documental em formato paisagem encontrada para '${animalKey}'.`);
      continue;
    }

    log.info(`Imagem documental localizada: ${curated.imageUrl}`);

    if (isDryRun) {
      log.info(`[DRY-RUN] Legenda que seria aplicada: "${curated.legenda}"`);
      log.info(`[DRY-RUN] Fonte URL: ${curated.fonteUrl}`);
      processedCount++;
      continue;
    }

    // Download da imagem com validação binária de magic bytes
    try {
      const imgRes = await fetchWithRetry(curated.imageUrl, { timeout: 20000 });
      const arrayBuf = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      const format = validateImageMagicBytes(buffer);
      if (!format) {
        log.error(`Magic Bytes inválidos na URL ${curated.imageUrl}. Rejeitado por segurança.`);
        continue;
      }

      const destFilename = `${slug}-documental.${format}`;
      const destPath = path.join(IMAGES_DIR, destFilename);
      const webPath = `/images/${destFilename}`;

      await writeAtomicImage(destPath, buffer);
      log.success(`Imagem atômica salva: ${destFilename} (${Math.round(buffer.length / 1024)} KB)`);

      // Atualiza o Post Markdown
      updateMarkdownFrontmatter(filePath, post, {
        imagem_capa: webPath,
        imagem_alt: curated.alt,
        imagem_legenda: curated.legenda,
        imagem_fonte_url: curated.fonteUrl
      });

      log.success(`Frontmatter do post atualizado com legenda e fonte com sucesso!`);
      processedCount++;
    } catch (err) {
      log.error(`Erro ao baixar/processar imagem para ${slug}: ${err.message}`);
    }
  }

  log.success(`Curadoria concluída. Total de artigos processados nesta rodada: ${processedCount}.`);
}

main().catch((err) => {
  log.error(`Falha fatal no script de curadoria: ${err.message}`);
  process.exit(1);
});
