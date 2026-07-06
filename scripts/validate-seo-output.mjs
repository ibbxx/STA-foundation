import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.cwd();
const distDir = resolve(root, 'dist');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readRequired(path) {
  assert(existsSync(path), `${path} is missing`);
  return readFileSync(path, 'utf8');
}

function validateRoute(pathname, expectedText) {
  const htmlPath = pathname === '/'
    ? join(distDir, 'index.html')
    : join(distDir, pathname.replace(/^\/+/, ''), 'index.html');
  const html = readRequired(htmlPath);

  assert(html.includes('<title>'), `${pathname} is missing a title`);
  assert(html.includes('name="description"'), `${pathname} is missing meta description`);
  assert(html.includes('rel="canonical"'), `${pathname} is missing canonical link`);
  assert(html.includes('property="og:title"'), `${pathname} is missing Open Graph tags`);
  assert(html.includes('application/ld+json'), `${pathname} is missing JSON-LD`);
  assert(!html.includes('<div id="root"></div>'), `${pathname} still looks like an empty SPA shell`);
  assert(html.includes(expectedText), `${pathname} does not contain expected rendered content: ${expectedText}`);
}

const sitemap = readRequired(join(distDir, 'sitemap.xml'));
assert(sitemap.includes('<urlset'), 'sitemap.xml is not an XML sitemap');
assert(sitemap.includes('https://www.sekolahtanahair.org/campaigns'), 'sitemap.xml is missing canonical campaign route');

const robots = readRequired(join(distDir, 'robots.txt'));
assert(robots.includes('Disallow: /admin/'), 'robots.txt must disallow /admin/');
assert(robots.includes('Sitemap: https://www.sekolahtanahair.org/sitemap.xml'), 'robots.txt points to the wrong sitemap');

const llms = readRequired(join(distDir, 'llms.txt'));
assert(llms.includes('Official source: https://www.sekolahtanahair.org'), 'llms.txt is missing canonical source statement');

validateRoute('/', 'Sekolah Tanah Air');
validateRoute('/campaigns', 'Campaign Donasi Pendidikan');
validateRoute('/kontak', 'Hubungi Kami');

console.log('[seo] SEO output validation passed.');
