import { spawn } from 'node:child_process';
import process from 'node:process';

const startedAt = performance.now();

const command = process.platform === 'win32' ? 'cmd' : 'npm';
const args = process.platform === 'win32' ? ['/d', '/s', '/c', 'npm run build'] : ['run', 'build'];

const child = spawn(command, args, {
  shell: false,
  stdio: ['inherit', 'pipe', 'pipe'],
  env: process.env,
});

let logBuffer = '';

child.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  logBuffer += text;
  process.stdout.write(text);
});

child.stderr.on('data', (chunk) => {
  const text = chunk.toString();
  logBuffer += text;
  process.stderr.write(text);
});

child.on('close', (code) => {
  const totalMs = performance.now() - startedAt;
  const totalSec = (totalMs / 1000).toFixed(2);

  const entryMatch = logBuffer.match(/Building static entrypoints\.\.\.[\s\S]*?\[build\] ✓ Completed in ([0-9.]+s)\./i);
  const clientMatch = logBuffer.match(/building client \(vite\)[\s\S]*?\[vite\] ✓ built in ([0-9a-z. ]+)/i);

  console.log('\n----------------------------------------');
  console.log('Build profile summary');
  console.log(`Total wall time: ${totalSec}s`);
  if (entryMatch?.[1]) {
    console.log(`Static entrypoints: ${entryMatch[1]}`);
  }
  if (clientMatch?.[1]) {
    console.log(`Client bundle: ${clientMatch[1].trim()}`);
  }
  console.log('----------------------------------------\n');

  process.exit(code ?? 0);
});
