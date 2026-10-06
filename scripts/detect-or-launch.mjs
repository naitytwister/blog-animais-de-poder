// @ts-check
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function checkPort(port = 9222) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(1000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function run() {
  console.log('1. Testando conexão com porta 9222...');
  const open = await checkPort(9222);
  console.log('Porta 9222 aberta?', open);

  if (!open) {
    console.log('\nTentando verificar se há outros navegadores ou se podemos iniciar o Chrome com debug...');
    try {
      const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq chrome.exe" /NH');
      const lines = stdout.trim().split('\n').filter(Boolean);
      console.log(`Processos do Chrome encontrados: ${lines.length}`);
    } catch (e) {
      console.error(e.message);
    }
  }
}

run();
