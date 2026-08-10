import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import worker from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(__dirname, '..', 'schema.sql'), 'utf8');

const sqlite = new DatabaseSync(':memory:');
sqlite.exec(schema);

const db = {
  prepare(sql) {
    return {
      bind(...args) {
        this.args = args;
        return this;
      },
      async first() {
        const stmt = sqlite.prepare(sql);
        return stmt.get(...(this.args || [])) ?? null;
      },
      async run() {
        const stmt = sqlite.prepare(sql);
        const result = stmt.run(...(this.args || []));
        return { success: true, meta: result };
      },
    };
  },
};

const env = { DB: db, IP_HASH_SALT: 'test-salt' };
const base = 'https://test.example.com';

async function call(path, method = 'GET', body = null, ip = '1.2.3.4') {
  const opts = {
    method,
    headers: { 'CF-Connecting-IP': ip },
  };
  if (body !== null) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const request = new Request(base + path, opts);
  return worker.fetch(request, env);
}

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${msg}`);
  } else {
    fail++;
    console.error(`  ✗ ${msg}`);
  }
}

// 1. Início: sem votos
console.log('1. GET avg sem votos');
let res = await call('/api/avg/meu-post');
let data = await res.json();
assert(res.status === 200, 'status 200');
assert(data.avg === 0 && data.count === 0, `avg=0 count=0 (recebido avg=${data.avg}, count=${data.count})`);

// 2. POST voto válido
console.log('2. POST rate estrelas=4');
res = await call('/api/rate/meu-post', 'POST', { stars: 4 });
data = await res.json();
assert(res.status === 200, 'status 200');
assert(data.ok === true && data.count === 1, `ok=true count=1 (recebido ${JSON.stringify(data)})`);

// 3. GET avg agora
console.log('3. GET avg após 1 voto');
res = await call('/api/avg/meu-post');
data = await res.json();
assert(data.avg === 4 && data.count === 1, `avg=4 count=1 (recebido avg=${data.avg}, count=${data.count})`);

// 4. Voto de outro IP (vira 2 votos)
console.log('4. POST voto de outro IP estrelas=2');
res = await call('/api/rate/meu-post', 'POST', { stars: 2 }, '5.6.7.8');
data = await res.json();
assert(data.count === 2 && data.avg === 3, `count=2 avg=3 (recebido count=${data.count}, avg=${data.avg})`);

// 5. Mesmo IP re-vota (atualiza, NÃO cria novo)
console.log('5. POST mesmo IP re-vota estrelas=5');
res = await call('/api/rate/meu-post', 'POST', { stars: 5 }, '1.2.3.4');
data = await res.json();
assert(data.count === 2 && data.avg === 3.5, `count continua 2, avg=3.5 (recebido count=${data.count}, avg=${data.avg})`);

// 6. Validação: estrelas fora do range
console.log('6. POST estrelas inválidas');
res = await call('/api/rate/meu-post', 'POST', { stars: 7 });
assert(res.status === 400, 'status 400 para stars=7');
res = await call('/api/rate/meu-post', 'POST', { stars: 0 });
assert(res.status === 400, 'status 400 para stars=0');

// 7. Slug inválido
console.log('7. Slug inválido');
res = await call('/api/rate/../evil');
assert(res.status === 400 || res.status === 404, `status 400/404 (recebido ${res.status})`);

// 8. Slug separado: votos não vazam entre posts
console.log('8. Isolamento por slug');
res = await call('/api/rate/outro-post', 'POST', { stars: 1 });
data = await res.json();
assert(data.count === 1, `outro-post count=1 (recebido ${data.count})`);
res = await call('/api/avg/meu-post');
data = await res.json();
assert(data.count === 2, `meu-post continua count=2 (recebido ${data.count})`);

// 9. OPTIONS preflight CORS
console.log('9. OPTIONS preflight');
res = await call('/api/rate/meu-post', 'OPTIONS');
assert(res.status === 204, 'status 204');
assert(res.headers.get('Access-Control-Allow-Origin') === '*', 'ACAO: * presente');

// 10. CORS nas respostas
console.log('10. CORS na resposta');
res = await call('/api/avg/meu-post');
assert(res.headers.get('Access-Control-Allow-Origin') === '*', 'ACAO: * presente');

console.log(`\nResultado: ${pass} passaram, ${fail} falharam`);
process.exit(fail > 0 ? 1 : 0);
