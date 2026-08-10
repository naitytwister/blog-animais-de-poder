# Animo Tem — Bestiário Interior

Blog estático sobre **animais de poder, sonhos com animais e sabedoria ancestral**, construído
com **Astro** (SSG). Recebe os artigos aprovados pelo pipeline Reart e publica no **Netlify**.

## Stack

- **Astro 7** — SSG, zero JS por padrão no cliente
- **Content Layer** com schema Zod (loader `glob()`)
- **@astrojs/sitemap** — sitemap + sitemap-index automáticos
- **@astrojs/rss** — feed RSS
- Fontes self-hosted: Fraunces (títulos) + Public Sans (corpo)

## Rodando

```bash
npm install
npm run dev      # ambiente de desenvolvimento
npm run build    # gera dist/
npm run check    # typecheck + diagnóstico Astro
npm run preview  # serve dist/ localmente
```

## Estrutura

```
src/
  content/
    posts/*.md       # artigos aprovados pelo pipeline
  layouts/
    BaseLayout.astro # SEO global, JSON-LD Organization/WebSite, header/footer
    PostLayout.astro # Article + BreadcrumbList + FAQPage, autor, relacionados
  components/        # Header, Footer, PostCard, Newsletter, RatingStars, AdSlot, ...
  pages/             # Home, posts/[...slug], categoria/[slug], institucionais
  lib/               # consts.ts (marca/categorias), utils.ts, faq.ts
public/
  images/            # capas 1200x800 (3:2, sem texto)
  robots.txt, favicon.svg, og-default.jpg
ratings-worker/      # Worker Cloudflare (avaliações por estrelas) + D1
```

## SEO e AdSense

- **Páginas obrigatórias presentes:** Home, Página de Detalhes, Sobre, Contato, Termos,
  Privacidade (LGPD), Cookies e 404 (noindex).
- **Dados estruturados:** Article, FAQPage, BreadcrumbList, WebSite e Organization.
- **Monetização-ready:** componente `AdSlot` ativo apenas quando `PUBLIC_ADSENSE_CLIENT` é
  definido no build.

## Deploy (Netlify)

O `netlify.toml` já configura build (`npm run build`), pasta de publicação (`dist`) e headers
de cache/segurança. No dashboard do Netlify:

1. Conecte o repositório (import from GitHub).
2. Build command: `npm run build` · Publish directory: `dist` (já definidos pelo `netlify.toml`).
3. Em **Environment variables**, defina `PUBLIC_SITE_URL=https://animotem.com` (e, quando
   houver, `PUBLIC_RATINGS_API_URL`).
4. Aponte o DNS do domínio para o Netlify e ative HTTPS.

## Variáveis de ambiente

| Variável | Uso | Padrão |
|---|---|---|
| `PUBLIC_SITE_URL` | URL canônica do site (sitemap/OG) | `https://animotem.com` |
| `BLOG_AUTHOR` | Nome da autora (fallback) | `Cecília Aranha` |
| `PUBLIC_ADSENSE_CLIENT` | Client ID do AdSense (`ca-pub-...`) | vazio (anúncios desativados) |
| `PUBLIC_BUTTONDOWN_USER` | Usuário do Buttondown para o embed da newsletter | `animotem` |
| `PUBLIC_PIX_KEY` | Chave Pix exibida na página `/apoie/` | vazio (seção Pix oculta) |
| `PUBLIC_KOFI_URL` | URL do perfil Ko-fi (botão na página `/apoie/`) | `https://ko-fi.com/animotem` |
| `PUBLIC_RATINGS_API_URL` | URL base do Worker de avaliações | vazio (widget oculto) |
