/**
 * Animo Tem — API de avaliação com estrelas (1-5)
 * Roda em Cloudflare Workers + D1 (SQLite).
 *
 * Endpoints:
 *   GET  /api/avg/:slug     -> { slug, avg, count }  (média e total de votos)
 *   POST /api/rate/:slug    -> body { stars: 1..5 }  (registra/atualiza voto)
 *
 * Anti-spam: voto único por IP (hash de IP + slug). O IP cru nunca é gravado.
 * CORS aberto (leitura pública) para o blog servir de qualquer domínio.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function validSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9-]{1,120}$/.test(slug);
}

async function hashIp(ip, salt) {
  const input = `${salt}:${ip}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const match = url.pathname.match(/^\/api\/(avg|rate)\/([^/]+)\/?$/);

    if (!match) {
      return json({ error: 'Rota não encontrada. Use /api/avg/:slug ou /api/rate/:slug' }, 404);
    }

    const [, action, slug] = match;
    if (!validSlug(slug)) {
      return json({ error: 'Slug inválido' }, 400);
    }

    try {
      if (action === 'avg' && request.method === 'GET') {
        return await handleAvg(env.DB, slug);
      }

      if (action === 'rate' && request.method === 'POST') {
        return await handleRate(env.DB, slug, request, env.IP_HASH_SALT || 'animotem');
      }

      return json({ error: 'Método não permitido' }, 405);
    } catch (err) {
      console.error('rating error:', err);
      return json({ error: 'Erro interno' }, 500);
    }
  },
};

async function handleAvg(db, slug) {
  const row = await db
    .prepare('SELECT COUNT(*) AS count, AVG(stars) AS avg FROM ratings WHERE slug = ?')
    .bind(slug)
    .first();

  const count = Number(row?.count ?? 0);
  const avg = count > 0 ? Math.round((Number(row.avg) || 0) * 100) / 100 : 0;

  return json({ slug, avg, count });
}

async function handleRate(db, slug, request, salt) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Corpo da requisição deve ser JSON' }, 400);
  }

  const stars = Number(body?.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return json({ error: 'stars deve ser um inteiro entre 1 e 5' }, 400);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipHash = await hashIp(ip, salt);

  const existing = await db
    .prepare('SELECT id FROM ratings WHERE slug = ? AND ip_hash = ?')
    .bind(slug, ipHash)
    .first();

  if (existing) {
    await db
      .prepare('UPDATE ratings SET stars = ? WHERE id = ?')
      .bind(stars, existing.id)
      .run();
  } else {
    await db
      .prepare('INSERT INTO ratings (slug, stars, ip_hash) VALUES (?, ?, ?)')
      .bind(slug, stars, ipHash)
      .run();
  }

  const row = await db
    .prepare('SELECT COUNT(*) AS count, AVG(stars) AS avg FROM ratings WHERE slug = ?')
    .bind(slug)
    .first();

  const count = Number(row?.count ?? 0);
  const avg = count > 0 ? Math.round((Number(row.avg) || 0) * 100) / 100 : 0;

  return json({ ok: true, slug, avg, count });
}
