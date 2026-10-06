// @ts-check
import { execSync } from 'node:child_process';

try {
  const output = execSync('powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"name = \'chrome.exe\'\\" | Select-Object ProcessId, CommandLine | ConvertTo-Json"').toString();
  const processes = JSON.parse(output);
  const list = Array.isArray(processes) ? processes : [processes];
  
  let killed = 0;
  for (const proc of list) {
    if (proc && proc.CommandLine && proc.CommandLine.includes('User Data Debug')) {
      console.log(`Encerrando processo residual de debug: PID ${proc.ProcessId}`);
      try {
        process.kill(proc.ProcessId);
        killed++;
      } catch {}
    }
  }
  console.log(`Total de processos de debug liberados: ${killed}`);
} catch (err) {
  console.log('Nenhum processo residual encontrado ou erro:', err.message);
}
