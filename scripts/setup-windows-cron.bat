@echo off
set SCRIPT_DIR=%~dp0

echo ============================================================
echo ANIMOTEM - Agendando Cron Jobs no Windows
echo ============================================================

echo.
echo [1/3] Agendando Tarefa Diaria (Animotem_Daily_Distribution)...
schtasks /Create /TN "Animotem_Daily_Distribution" /TR "\"%SCRIPT_DIR%run-daily.bat\"" /SC DAILY /ST 09:30 /F

echo.
echo [2/3] Agendando Rastreador (Animotem_Post_Tracker)...
schtasks /Create /TN "Animotem_Post_Tracker" /TR "\"%SCRIPT_DIR%run-tracker.bat\"" /SC HOURLY /MO 2 /F

echo.
echo [3/3] Agendando Auditoria Semanal (Animotem_Weekly_Audit)...
schtasks /Create /TN "Animotem_Weekly_Audit" /TR "\"%SCRIPT_DIR%run-weekly.bat\"" /SC WEEKLY /D MON /ST 08:00 /F

echo.
echo ============================================================
echo Tarefas agendadas com sucesso no Agendador do Windows!
echo ============================================================
