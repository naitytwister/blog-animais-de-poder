import { getCollection } from 'astro:content';
import { SITE, SUBNICHOS } from '../lib/consts';

const posts = await getCollection('posts');
const pilares = posts
  .filter((p) => p.data.tipo === 'pilar')
  .sort((a, b) => a.data.data.valueOf() - b.data.data.valueOf());

const lines: string[] = [];
lines.push(`# ${SITE.name}`);
lines.push('');
lines.push(`> ${SITE.description}`);
lines.push('');
lines.push('Páginas principais:');
lines.push(`- [Início](${SITE.url}/)`);
lines.push(`- [Sobre](${SITE.url}/sobre/)`);
lines.push(`- [Contato](${SITE.url}/contato/)`);
lines.push(`- [Termos de Uso](${SITE.url}/termos/)`);
lines.push(`- [Política de Privacidade](${SITE.url}/privacidade/)`);
lines.push(`- [Política de Cookies](${SITE.url}/cookies/)`);
lines.push('');
lines.push('Categorias:');
for (const [, sub] of Object.entries(SUBNICHOS)) {
  lines.push(`- [${sub.titulo}](${SITE.url}/categoria/${sub.slug_categoria}/)`);
}
lines.push('');
lines.push('Guias completos (pilares):');
for (const p of pilares) {
  lines.push(`- [${p.data.title}](${SITE.url}/posts/${p.id}/) — ${p.data.description}`);
}

export const GET = () =>
  new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
