import { createClient } from '@supabase/supabase-js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  DEFAULT_SEO_DESCRIPTION,
  DEFAULT_SEO_IMAGE,
  SITE_URL,
  STA_BUSINESS_PROFILE,
  absoluteUrl,
  createBreadcrumbJsonLd,
  createEventJsonLd,
  createOrganizationJsonLd,
  formatSeoTitle,
  stripHtmlToText,
  truncateText,
} from '../src/lib/seo';
import { PROGRAMS } from '../src/lib/programs';

type JsonLd = Record<string, unknown>;

type RouteHtml = {
  path: string;
  title: string;
  description: string;
  image?: string | null;
  type?: 'website' | 'article';
  robots?: string;
  contentTitle: string;
  contentDescription: string;
  structuredData?: JsonLd | JsonLd[];
};

type ImpactLocation = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  slug?: string | null;
  province?: string | null;
  locationLabel?: string | null;
};

const DIST_DIR = resolve(process.cwd(), 'dist');
const TEMPLATE_PATH = join(DIST_DIR, 'index.html');

function loadEnvFile(fileName: string) {
  const path = resolve(process.cwd(), fileName);
  if (!existsSync(path)) return;

  const content = readFileSync(path, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return;
    const [key, ...valueParts] = trimmed.split('=');
    if (process.env[key]) return;
    process.env[key] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizePath(path: string) {
  if (!path || path === '/') return '/';
  return `/${path.replace(/^\/+|\/+$/g, '')}`;
}

function outputPathForRoute(path: string) {
  const normalizedPath = normalizePath(path);
  if (normalizedPath === '/') return join(DIST_DIR, 'index.html');
  return join(DIST_DIR, normalizedPath.replace(/^\/+/, ''), 'index.html');
}

function getImage(row: Record<string, any>) {
  if (Array.isArray(row.images) && row.images[0]) return row.images[0] as string;
  return row.image_url ?? row.imageUrl ?? null;
}

function parseImpactLocations(value: unknown): ImpactLocation[] {
  if (!value || typeof value !== 'object' || !('locations' in value)) return [];
  const locations = (value as { locations?: unknown }).locations;
  if (!Array.isArray(locations)) return [];

  return locations.flatMap((location, index) => {
    if (!location || typeof location !== 'object') return [];
    const item = location as Record<string, unknown>;
    const title = typeof item.title === 'string' && item.title.trim()
      ? item.title.trim()
      : typeof item.name === 'string' && item.name.trim()
        ? item.name.trim()
        : `Lokasi ${index + 1}`;
    const id = typeof item.id === 'string' && item.id.trim()
      ? item.id.trim()
      : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    return [{
      id,
      title,
      slug: typeof item.slug === 'string' && item.slug.trim() ? item.slug.trim() : null,
      description: typeof item.description === 'string' && item.description.trim()
        ? item.description.trim()
        : `Dokumentasi kegiatan Sekolah Tanah Air di ${title}.`,
      imageUrl: typeof item.image_url === 'string' && item.image_url.trim()
        ? item.image_url.trim()
        : typeof item.imageUrl === 'string' && item.imageUrl.trim()
          ? item.imageUrl.trim()
          : DEFAULT_SEO_IMAGE,
      province: typeof item.province === 'string' ? item.province : null,
      locationLabel: typeof item.location_label === 'string'
        ? item.location_label
        : typeof item.locationLabel === 'string'
          ? item.locationLabel
          : null,
    }];
  });
}

function renderStructuredData(route: RouteHtml) {
  const data = [
    createOrganizationJsonLd(),
    ...(Array.isArray(route.structuredData)
      ? route.structuredData
      : route.structuredData
        ? [route.structuredData]
        : []),
  ];

  return data
    .map((item) => `<script type="application/ld+json" data-seo-jsonld="true">${JSON.stringify(item)}</script>`)
    .join('\n  ');
}

function renderFallbackContent(route: RouteHtml) {
  return `<div id="root"><main data-static-prerender="true" style="max-width: 760px; margin: 0 auto; padding: 96px 24px; font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #111827;">
    <p style="margin: 0 0 12px; font-size: 12px; text-transform: uppercase; letter-spacing: .16em; color: #047857; font-weight: 700;">Sekolah Tanah Air</p>
    <h1 style="margin: 0 0 16px; font-size: clamp(32px, 5vw, 56px); line-height: 1.05;">${escapeHtml(route.contentTitle)}</h1>
    <p style="margin: 0; font-size: 18px; color: #4b5563;">${escapeHtml(route.contentDescription)}</p>
    <p style="margin-top: 28px; font-size: 14px; color: #6b7280;">Halaman resmi: ${escapeHtml(absoluteUrl(route.path))}</p>
  </main></div>`;
}

function renderRouteHtml(template: string, route: RouteHtml) {
  const title = formatSeoTitle(route.title);
  const description = route.description || DEFAULT_SEO_DESCRIPTION;
  const canonical = absoluteUrl(route.path);
  const image = absoluteUrl(route.image || DEFAULT_SEO_IMAGE);
  const robots = route.robots || 'index,follow';
  const type = route.type || 'website';

  let html = template;
  html = html.replace(/<html[^>]*>/, '<html lang="id">');
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/<meta name="description" content=".*?"\s*\/?>/s, `<meta name="description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta name="robots" content=".*?"\s*\/?>/s, `<meta name="robots" content="${escapeHtml(robots)}" />`);
  html = html.replace(/<link rel="canonical" href=".*?"\s*\/?>/s, `<link rel="canonical" href="${escapeHtml(canonical)}" />`);
  html = html.replace(/<meta property="og:title" content=".*?"\s*\/?>/s, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta property="og:description" content=".*?"\s*\/?>/s, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta property="og:type" content=".*?"\s*\/?>/s, `<meta property="og:type" content="${escapeHtml(type)}" />`);
  html = html.replace(/<meta property="og:url" content=".*?"\s*\/?>/s, `<meta property="og:url" content="${escapeHtml(canonical)}" />`);
  html = html.replace(/<meta property="og:image" content=".*?"\s*\/?>/s, `<meta property="og:image" content="${escapeHtml(image)}" />`);
  html = html.replace(/<meta name="twitter:title" content=".*?"\s*\/?>/s, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta name="twitter:description" content=".*?"\s*\/?>/s, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta name="twitter:image" content=".*?"\s*\/?>/s, `<meta name="twitter:image" content="${escapeHtml(image)}" />`);
  html = html.replace('</head>', `  ${renderStructuredData(route)}\n</head>`);
  html = html.replace(/<div id="root"><\/div>/, renderFallbackContent(route));
  return html;
}

function addRoute(routes: Map<string, RouteHtml>, route: RouteHtml) {
  routes.set(normalizePath(route.path), { ...route, path: normalizePath(route.path) });
}

function baseRoutes() {
  const routes = new Map<string, RouteHtml>();

  [
    {
      path: '/',
      title: 'Sekolah Tanah Air | Bersama Membangun Negeri',
      description: 'Sekolah Tanah Air menghubungkan aksi pendidikan, relawan, campaign donasi, dan pemetaan kebutuhan sekolah untuk membangun masa depan anak Indonesia.',
      contentTitle: 'Sekolah Tanah Air',
      contentDescription: 'Gerakan pendidikan dan kerelawanan untuk memperkuat akses belajar, fasilitas sekolah, dan aksi lapangan di Indonesia.',
    },
    {
      path: '/campaigns',
      title: 'Campaign Donasi Pendidikan',
      description: 'Jelajahi campaign Sekolah Tanah Air dan dukung kebutuhan pendidikan, fasilitas sekolah, komunitas belajar, serta program sosial di Indonesia.',
      contentTitle: 'Campaign Donasi Pendidikan',
      contentDescription: 'Pilih campaign yang ingin Anda dukung dan bantu sekolah, komunitas, atau wilayah yang sedang membutuhkan aksi nyata.',
    },
    {
      path: '/kontak',
      title: 'Kontak Sekolah Tanah Air',
      description: 'Hubungi Sekolah Tanah Air untuk kolaborasi, donasi, program relawan, atau laporan kebutuhan pendidikan di Indonesia.',
      contentTitle: 'Hubungi Kami',
      contentDescription: `${STA_BUSINESS_PROFILE.email} | ${STA_BUSINESS_PROFILE.telephone} | ${STA_BUSINESS_PROFILE.addressLabel}`,
    },
    {
      path: '/tentang-kami',
      title: 'Tentang Sekolah Tanah Air',
      description: 'Kenali visi, misi, nilai, dan gerakan Sekolah Tanah Air dalam memperkuat akses pendidikan Indonesia melalui data, kolaborasi, dan aksi nyata.',
      contentTitle: 'Tentang Sekolah Tanah Air',
      contentDescription: 'Pendidikan yang layak adalah hak setiap anak bangsa. Sekolah Tanah Air hadir untuk menjembatani niat baik dengan aksi nyata.',
    },
    {
      path: '/events',
      title: 'Event, Relawan, dan Peta Dampak',
      description: 'Lihat program relawan, event lapangan, peta dampak, dan cerita perjalanan Sekolah Tanah Air di berbagai wilayah Indonesia.',
      contentTitle: 'Event, Relawan, dan Peta Dampak',
      contentDescription: 'Temukan program relawan, dokumentasi perjalanan, dan peta dampak kegiatan Sekolah Tanah Air.',
    },
    {
      path: '/laporkan',
      title: 'Laporkan Sekolah yang Membutuhkan Bantuan',
      description: 'Laporkan kondisi sekolah atau komunitas belajar yang membutuhkan dukungan agar tim Sekolah Tanah Air dapat melakukan verifikasi dan pemetaan kebutuhan.',
      contentTitle: 'Laporkan Sekolah',
      contentDescription: 'Bantu tim Sekolah Tanah Air memetakan sekolah dan komunitas belajar yang membutuhkan dukungan.',
    },
    {
      path: '/leaderboard',
      title: 'Leaderboard Donatur',
      description: 'Lihat apresiasi untuk para pejuang kebaikan yang mendukung campaign pendidikan Sekolah Tanah Air.',
      contentTitle: 'Leaderboard Donatur',
      contentDescription: 'Apresiasi untuk para pendukung campaign pendidikan Sekolah Tanah Air.',
    },
  ].forEach((route) => addRoute(routes, route));

  return routes;
}

async function collectRoutes() {
  loadEnvFile('.env');
  loadEnvFile('.env.local');

  const routes = baseRoutes();

  PROGRAMS.forEach((program) => {
    addRoute(routes, {
      path: `/programs/${program.slug}`,
      title: program.title,
      description: truncateText(stripHtmlToText(program.overview || program.short_description)),
      contentTitle: program.title,
      contentDescription: stripHtmlToText(program.overview || program.short_description),
      type: 'article',
      structuredData: createBreadcrumbJsonLd([
        { name: 'Beranda', path: '/' },
        { name: 'Program', path: '/' },
        { name: program.title, path: `/programs/${program.slug}` },
      ]),
    });
  });

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[static-prerender] Supabase env not found. Wrote static route HTML only.');
    return routes;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [campaigns, programs, volunteerPrograms, impactMap] = await Promise.all([
    supabase.from('campaigns').select('*').neq('status', 'draft').limit(500),
    supabase.from('programs').select('*').limit(100),
    supabase.from('volunteer_programs').select('*').limit(200),
    supabase.from('site_content').select('value').eq('key', 'impact_map').maybeSingle(),
  ]);

  if (campaigns.error) console.warn(`[static-prerender] Campaign routes skipped: ${campaigns.error.message}`);
  if (programs.error) console.warn(`[static-prerender] Program routes skipped: ${programs.error.message}`);
  if (volunteerPrograms.error) console.warn(`[static-prerender] Volunteer routes skipped: ${volunteerPrograms.error.message}`);
  if (impactMap.error) console.warn(`[static-prerender] Journey routes skipped: ${impactMap.error.message}`);

  (campaigns.data ?? []).forEach((campaign: any) => {
    const description = truncateText(stripHtmlToText(campaign.description) || `Dukung campaign ${campaign.title} bersama Sekolah Tanah Air.`);
    addRoute(routes, {
      path: `/campaigns/${campaign.slug}`,
      title: campaign.title,
      description,
      image: getImage(campaign),
      type: 'article',
      contentTitle: campaign.title,
      contentDescription: description,
      structuredData: [
        createBreadcrumbJsonLd([
          { name: 'Beranda', path: '/' },
          { name: 'Campaign', path: '/campaigns' },
          { name: campaign.title, path: `/campaigns/${campaign.slug}` },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: campaign.title,
          description,
          image: getImage(campaign) ? absoluteUrl(getImage(campaign)) : absoluteUrl(DEFAULT_SEO_IMAGE),
          datePublished: campaign.created_at,
          mainEntityOfPage: absoluteUrl(`/campaigns/${campaign.slug}`),
        },
      ],
    });
  });

  (programs.data ?? []).forEach((program: any) => {
    const description = truncateText(stripHtmlToText(program.description) || `Pelajari program ${program.title} dari Sekolah Tanah Air.`);
    addRoute(routes, {
      path: `/programs/${program.slug}`,
      title: program.title,
      description,
      type: 'article',
      contentTitle: program.title,
      contentDescription: description,
      structuredData: createBreadcrumbJsonLd([
        { name: 'Beranda', path: '/' },
        { name: 'Program', path: '/' },
        { name: program.title, path: `/programs/${program.slug}` },
      ]),
    });
  });

  (volunteerPrograms.data ?? []).forEach((program: any) => {
    const description = truncateText(stripHtmlToText(program.short_description || program.description) || `Detail program relawan ${program.title} bersama Sekolah Tanah Air.`);
    const eventSchema = createEventJsonLd({
      name: program.title,
      description,
      path: `/eduxplore/${program.slug}`,
      image: program.image_url,
      location: program.location,
      startDate: program.registration_start,
      endDate: program.program_end ?? program.registration_end,
    });

    addRoute(routes, {
      path: `/eduxplore/${program.slug}`,
      title: program.title,
      description,
      image: program.image_url,
      type: 'article',
      contentTitle: program.title,
      contentDescription: description,
      structuredData: [
        createBreadcrumbJsonLd([
          { name: 'Beranda', path: '/' },
          { name: 'Event', path: '/events' },
          { name: program.title, path: `/eduxplore/${program.slug}` },
        ]),
        ...(eventSchema ? [eventSchema] : []),
      ],
    });
  });

  const locations = parseImpactLocations(impactMap.data?.value ?? null);
  locations.forEach((journey) => {
    const slug = journey.slug ?? journey.id;
    const description = truncateText(stripHtmlToText(journey.description) || `Cerita perjalanan Sekolah Tanah Air di ${journey.locationLabel ?? journey.province ?? journey.title}.`);
    addRoute(routes, {
      path: `/journey/${slug}`,
      title: journey.title,
      description,
      image: journey.imageUrl,
      type: 'article',
      contentTitle: journey.title,
      contentDescription: description,
      structuredData: createBreadcrumbJsonLd([
        { name: 'Beranda', path: '/' },
        { name: 'Event', path: '/events' },
        { name: journey.title, path: `/journey/${slug}` },
      ]),
    });
  });

  return routes;
}

async function main() {
  if (!existsSync(TEMPLATE_PATH)) {
    throw new Error('dist/index.html not found. Run vite build before static prerender.');
  }

  const template = readFileSync(TEMPLATE_PATH, 'utf8');
  const routes = await collectRoutes();

  for (const route of routes.values()) {
    const outPath = outputPathForRoute(route.path);
    mkdirSync(resolve(outPath, '..'), { recursive: true });
    writeFileSync(outPath, renderRouteHtml(template, route), 'utf8');
  }

  console.log(`[static-prerender] Wrote ${routes.size} route HTML files.`);
}

main().catch((error) => {
  console.error('[static-prerender] Failed.');
  console.error(error);
  process.exitCode = 1;
});
