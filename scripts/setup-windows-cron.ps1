# scripts/setup-windows-cron.ps1
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "⏰ ANIMOTEM — Configuração de Tarefas Agendadas no Windows" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$projectDir = (Get-Item $PSScriptRoot).Parent.FullName
$nodeExe = "node"

Write-Host "`n📁 Diretório do Projeto: $projectDir" -ForegroundColor Gray

# 1. Tarefa Diária (09:30 AM)
Write-Host "`n[1/3] Registrando Tarefa Diária (Animotem_Daily_Distribution)..." -ForegroundColor Yellow
$dailyCmd = "cmd.exe /c cd /d `"$projectDir`" && $nodeExe scripts\daily-routine.mjs"
schtasks /Create /TN "Animotem_Daily_Distribution" /TR $dailyCmd /SC DAILY /ST 09:30 /F | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Tarefa Diária agendada com sucesso (Todos os dias às 09:30 AM)!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Falha ao agendar tarefa diária." -ForegroundColor Red
}

# 2. Tarefa Rastreador (A cada 2 horas)
Write-Host "`n[2/3] Registrando Tarefa de Monitoramento (Animotem_Post_Tracker)..." -ForegroundColor Yellow
$trackCmd = "cmd.exe /c cd /d `"$projectDir`" && $nodeExe scripts\track-posts.mjs"
schtasks /Create /TN "Animotem_Post_Tracker" /TR $trackCmd /SC HOURLY /MO 2 /F | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Rastreador agendado com sucesso (A cada 2 horas)!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Falha ao agendar rastreador." -ForegroundColor Red
}

# 3. Tarefa Semanal (Segunda-feira às 08:00 AM)
Write-Host "`n[3/3] Registrando Auditoria Semanal (Animotem_Weekly_Audit)..." -ForegroundColor Yellow
$weeklyCmd = "cmd.exe /c cd /d `"$projectDir`" && $nodeExe scripts\weekly-routine.mjs"
schtasks /Create /TN "Animotem_Weekly_Audit" /TR $weeklyCmd /SC WEEKLY /D MON /ST 08:00 /F | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Auditoria Semanal agendada com sucesso (Segundas às 08:00 AM)!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Falha ao agendar auditoria semanal." -ForegroundColor Red
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "🎉 CRON JOBS NATIVOS ATIVADOS NO WINDOWS COM SUCESSO!" -ForegroundColor Green
Write-Host "As tarefas agora rodam em segundo plano automaticamente." -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan
