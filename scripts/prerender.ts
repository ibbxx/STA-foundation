import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const DIST_DIR = resolve(process.cwd(), 'dist');
const SITE_URL = 'https://www.sekolahtanahair.org';
const IS_VERCEL = process.env.VERCEL === '1';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function readSitemapPaths() {
  const sitemapPath = join(DIST_DIR, 'sitemap.xml');
  if (!existsSync(sitemapPath)) {
    throw new Error('dist/sitemap.xml not found. Run SEO generation before prerender.');
  }

  const sitemap = readFileSync(sitemapPath, 'utf8');
  const paths = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map((match) => match[1])
    .filter((url) => url.startsWith(SITE_URL))
    .map((url) => new URL(url).pathname)
    .filter((path) => !path.startsWith('/admin'));

  return [...new Set(paths)];
}

function safeFilePath(pathname: string) {
  const decoded = decodeURIComponent(pathname.split('?')[0]);
  const normalized = decoded === '/' ? '/index.html' : decoded;
  const candidate = resolve(DIST_DIR, `.${normalized}`);
  return candidate.startsWith(DIST_DIR) ? candidate : join(DIST_DIR, 'index.html');
}

function findStaticFile(pathname: string) {
  const direct = safeFilePath(pathname);
  if (existsSync(direct) && statSync(direct).isFile()) return direct;

  const indexPath = join(safeFilePath(pathname), 'index.html');
  if (existsSync(indexPath) && statSync(indexPath).isFile()) return indexPath;

  return join(DIST_DIR, 'index.html');
}

function startServer() {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const filePath = findStaticFile(url.pathname);
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.end(readFileSync(filePath));
  });

  return new Promise<{ port: number; close: () => Promise<void> }>((resolveServer, reject) => {
    server.once('error', reject);
    server.listen(Number(process.env.PRERENDER_PORT ?? 0), '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Unable to resolve prerender server port.'));
        return;
      }

      resolveServer({
        port: address.port,
        close: () => new Promise((resolveClose, rejectClose) => {
          server.close((error) => error ? rejectClose(error) : resolveClose());
        }),
      });
    });
  });
}

function outputPathForRoute(pathname: string) {
  if (pathname === '/') return join(DIST_DIR, 'index.html');
  return join(DIST_DIR, pathname.replace(/^\/+/, ''), 'index.html');
}

async function main() {
  if (!existsSync(DIST_DIR)) {
    throw new Error('dist directory not found. Run vite build first.');
  }

  const paths = readSitemapPaths();
  if (paths.length === 0) {
    throw new Error('No prerenderable URLs found in sitemap.');
  }

  if (IS_VERCEL && process.env.FORCE_VERCEL_PRERENDER !== '1') {
    console.warn(
      '[prerender] Skipped on Vercel build environment. Local prerender remains available.',
    );
    return;
  }

  const server = await startServer();
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 1366, height: 900 },
      userAgent: 'SekolahTanahAir-Prerender/1.0',
    });

    for (const pathname of paths) {
      const localUrl = `http://127.0.0.1:${server.port}${pathname}`;
      console.log(`[prerender] ${pathname}`);
      await page.goto(localUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => undefined);
      await page.waitForFunction(() => {
        const root = document.getElementById('root');
        const text = root?.textContent?.trim() ?? '';
        return text.length > 80 && !text.includes('Memuat halaman...');
      }, { timeout: 15000 }).catch(() => undefined);
      await page.waitForTimeout(750);

      const html = await page.content();
      const outPath = outputPathForRoute(pathname);
      mkdirSync(resolve(outPath, '..'), { recursive: true });
      writeFileSync(outPath, html, 'utf8');
    }
  } finally {
    await browser.close();
    await server.close();
  }

  console.log(`[prerender] Wrote ${paths.length} route HTML files.`);
}

main().catch((error) => {
  console.error('[prerender] Failed.');
  console.error(error);
  process.exitCode = 1;
});
