@echo off
echo ==============================================
echo 🔎 INICIANDO MONITORAMENTO DE SEO (ANIMOTEM)
echo ==============================================

echo [1/3] Rastreando sitemaps da concorrencia...
node scripts\seo-competitors.mjs

echo.
echo [2/3] Verificando Rankings na SERP (Google)...
node --env-file=.env scripts\seo-serper.mjs

echo.
echo [3/3] Coletando tráfego do Cloudflare...
node --env-file=.env scripts\seo-cloudflare.mjs

echo.
echo ==============================================
echo ✅ MONITORAMENTO CONCLUIDO!
echo Relatorios salvos na pasta 'concorrencia/'.
echo ==============================================
