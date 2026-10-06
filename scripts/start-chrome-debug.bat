@echo off
REM scripts/start-chrome-debug.bat
REM Inicia uma instância do Chrome com a porta de depuração 9222 ativa.
REM Usa um perfil dedicado de automação para que você NÃO precise fechar seu Chrome atual!

echo ============================================================
echo   Iniciando Chrome para Automacao Social Animotem
echo ============================================================
echo Porta CDP: 9222
echo Perfil: %LOCALAPPDATA%\Google\Chrome\User Data Debug
echo.
echo Ao abrir a janela:
echo 1. Faca login no Facebook e no Pinterest (apenas 1 vez).
echo 2. Deixe a janela aberta ou minimizada.
echo 3. Execute: node scripts/social-distribute.mjs
echo ============================================================

start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --remote-allow-origins=* --user-data-dir="%LOCALAPPDATA%\Google\Chrome\User Data Debug" "https://www.facebook.com"
