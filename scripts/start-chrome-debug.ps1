# scripts/start-chrome-debug.ps1
$chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$debugDataDir = "$env:LOCALAPPDATA\Google\Chrome\User Data Debug"

Write-Host "Iniciando Chrome com porta de depuracao 9222..." -ForegroundColor Cyan
Write-Host "Perfil: $debugDataDir" -ForegroundColor Gray

Start-Process -FilePath $chromePath -ArgumentList @(
    '--remote-debugging-port=9222',
    '--remote-allow-origins=*',
    "--user-data-dir=$debugDataDir",
    'https://www.facebook.com'
)

Start-Sleep -Seconds 3
$open = $false
try {
    $res = Invoke-RestMethod -Uri 'http://127.0.0.1:9222/json/version' -TimeoutSec 2
    if ($res.Browser) {
        $open = $true
        Write-Host "Sucesso! Chrome conectado via CDP: $($res.Browser)" -ForegroundColor Green
    }
} catch {
    Write-Host "Aguardando inicializacao do Chrome..." -ForegroundColor Yellow
}
