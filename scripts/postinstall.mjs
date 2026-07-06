import { spawnSync } from 'node:child_process';

const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  console.log('[postinstall] Skipping Playwright browser download on Vercel.');
  process.exit(0);
}

const result = spawnSync('npx', ['playwright', 'install', 'chromium'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
