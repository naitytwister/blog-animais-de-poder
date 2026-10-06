@echo off
chcp 65001 >nul
echo ============================================================
echo 🗑️ ANIMOTEM — Remoção de Tarefas Agendadas do Windows
echo ============================================================

schtasks /Delete /TN "Animotem_Daily_Distribution" /F 2>nul
schtasks /Delete /TN "Animotem_Post_Tracker" /F 2>nul
schtasks /Delete /TN "Animotem_Weekly_Audit" /F 2>nul

echo.
echo ✅ Todas as tarefas do Animotem foram removidas do Agendador do Windows.
echo.
