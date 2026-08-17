import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('..', import.meta.url)).replace(/[\\/]$/, '');
const POSTS = join(REPO, 'src', 'content', 'posts');
const IMAGES = join(REPO, 'public', 'images');

const CATS = { guia: 'guia-completo', animais: 'enciclopedia-animal', sonhos: 'sonhos-e-sinais', xamanismo: 'xamanismo-e-tradicoes', ferramentas: 'ferramentas-e-quiz' };

const PLAN = [
  { slug: '3-sinais-espirito-animal-falar-com-voce', pilar: 'o-que-e-animal-de-poder' },
  { slug: 'animal-espiritual-significado', pilar: 'o-que-e-animal-de-poder' },
  { slug: 'boto-cor-de-rosa-lenda-significado', pilar: 'curupira-boto-mula-sem-cabeca-animais-poder-brasil' },
  { slug: 'curupira-boto-mula-sem-cabeca-animais-poder-brasil', pilar: null },
  { slug: 'curupira-significado-animal-de-poder', pilar: 'curupira-boto-mula-sem-cabeca-animais-poder-brasil' },
  { slug: 'diferenca-entre-animal-de-poder-e-totem', pilar: 'o-que-e-animal-de-poder' },
  { slug: 'mula-sem-cabeca-significado', pilar: 'curupira-boto-mula-sem-cabeca-animais-poder-brasil' },
];

const ENT = { nbsp: ' ', amp: '&', quot: '"', '#39': "'", lt: '<', gt: '>', '#xE1': 'á', '#xE9': 'é', '#xED': 'í', '#xE3': 'ã', '#xF5': 'õ', '#xE2': 'â', '#xEA': 'ê', '#xF4': 'ô', '#xE0': 'à', '#xE7': 'ç', '#xFA': 'ú', '#xF3': 'ó', '#xFC': 'ü', '#xE4': 'ä', '#xEB': 'ë', '#xE8': 'è', '#xEC': 'ì', '#xF2': 'ò', '#xF9': 'ù', '#xE6': 'æ', '#xF8': 'ø', '#xDF': 'ß' };
const dec = (s) => s.replace(/&([^;]+);/g, (m, k) => (k in ENT ? ENT[k] : k.startsWith('#x') ? String.fromCodePoint(parseInt(k.slice(2), 16)) : k.startsWith('#') ? String.fromCodePoint(+k.slice(1)) : m));

const inline = (h) => dec(
  h.replace(/<br\s*\/?>/gi, '\n')
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<code>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<img\s[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
    .replace(/<[^>]+>/g, '')
).replace(/\n{3,}/g, '\n\n').trim();

const block = (html) => {
  const out = [];
  const re = /<(h[234]|p|blockquote|ul|ol|hr)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m, last = 0;
  while ((m = re.exec(html)) !== null) {
    const gap = html.slice(last, m.index).trim();
    if (gap) out.push(dec(gap.replace(/<[^>]+>/g, '')).trim());
    last = re.lastIndex;
    const tag = m[1].toLowerCase(), inner = m[2];
    if (tag === 'hr') { out.push('---'); continue; }
    if (tag === 'h2' || tag === 'h3' || tag === 'h4') { out.push('#'.repeat(+tag[1] + 1) + ' ' + inline(inner)); continue; }
    if (tag === 'p') { out.push(inline(inner)); continue; }
    if (tag === 'blockquote') { out.push(block(inner).map((l) => `> ${l}`).join('\n')); continue; }
    const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
    let lm, items = [];
    while ((lm = liRe.exec(inner)) !== null) items.push(inline(lm[1]).replace(/\n+/g, ' '));
    out.push(items.map((it) => `${tag === 'ul' ? '-' : '1.'} ${it}`).join('\n'));
  }
  const tail = html.slice(last).trim();
  if (tail) out.push(dec(tail.replace(/<[^>]+>/g, '')).trim());
  return out;
};

const get = async (u) => {
  const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; restore/1.0)' } });
  if (!r.ok) throw new Error(`${u} -> ${r.status}`);
  return r.text();
};

const getBuf = async (u) => {
  const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; restore/1.0)' } });
  if (!r.ok) throw new Error(`${u} -> ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
};

for (const { slug, pilar } of PLAN) {
  try {
    const html = await get(`https://animotem.com/posts/${slug}/`);
    const prose = html.match(/<div class="prose"[^>]*>([\s\S]*?)<div class="support-cta/);
    if (!prose) throw new Error('sem .prose');
    const body = block(prose[1]).filter(Boolean);

    const faqs = [...html.matchAll(/<details class="faq-item">[\s\S]*?<summary>([\s\S]*?)<\/summary>[\s\S]*?<\/details>/gi)];
    if (faqs.length) {
      body.push('', '## Perguntas Frequentes');
      for (const f of faqs) {
        const q = f[1].replace(/<[^>]+>/g, '');
        const a = f[0].match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? '';
        body.push('', `**${dec(q).trim()}**`, inline(a));
      }
    }

    const title = dec(html.match(/<meta property="og:title" content="([^"]*)"/)?.[1] ?? '').replace(/\s*[—–-]+\s*Animo Tem\s*$/i, '').trim();
    const description = dec(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '').trim();
    const datePublished = html.match(/"datePublished":"([^"]+)"/)?.[1] ?? new Date().toISOString();
    const cat = html.match(/<a class="chip" href="\/categoria\/([a-z]+)\/"/)?.[1];
    const subnicho = CATS[cat] ?? 'guia-completo';
    const kw = dec(html.match(/<p class="kw"[^>]*>[\s\S]*?<strong[^>]*>([\s\S]*?)<\/strong>/)?.[1] ?? '').trim();
    const isPilar = html.includes('chip-pilar');
    const cover = html.match(/<div class="post-cover"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/);
    const coverUrl = cover?.[1] ?? `https://animotem.com/images/${slug}.jpg`;
    const coverPath = coverUrl.replace(/^https?:\/\/animotem\.com/, '');
    const coverAlt = dec(cover?.[2] ?? '').trim();
    const ext = coverPath.match(/\.(\w+)$/)?.[1] ?? 'jpg';

    let fm = `---\ntitle: "${title.replace(/"/g, "'")}"\ndescription: "${description.replace(/"/g, "'")}"\nslug: "${slug}"\nsubnicho: "${subnicho}"\npalavra_chave: "${kw.replace(/"/g, "'")}"\ntipo: "${isPilar ? 'pilar' : 'cluster'}"`;
    if (pilar) fm += `\npilar_slug: "${pilar}"`;
    fm += `\ndata: "${datePublished}"\nimagem_capa: "/images/${slug}.${ext}"\nimagem_alt: "${coverAlt.replace(/"/g, "'")}"\nautor: "Cecília Aranha"\n---\n\n`;

    writeFileSync(join(POSTS, `${slug}.md`), fm + body.join('\n\n') + '\n', 'utf8');

    const img = await getBuf(`https://animotem.com${coverPath}`);
    writeFileSync(join(IMAGES, `${slug}.${ext}`), img);
    console.log(`OK ${slug} | ${title.slice(0, 40)} | ${body.length} blocos | subnicho=${subnicho} | tipo=${isPilar ? 'pilar' : 'cluster'} | data=${datePublished.slice(0, 10)} | img=${slug}.${ext}`);
  } catch (e) {
    console.error(`FAIL ${slug}: ${e.message}`);
  }
}