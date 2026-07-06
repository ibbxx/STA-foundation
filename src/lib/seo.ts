import React from 'react';

type JsonLd = Record<string, unknown>;

export const SITE_URL = 'https://www.sekolahtanahair.org';
export const DEFAULT_SEO_TITLE = 'Sekolah Tanah Air | Bersama Membangun Negeri';
export const DEFAULT_SEO_DESCRIPTION =
  'Sekolah Tanah Air adalah gerakan pendidikan dan kerelawanan yang membantu sekolah, komunitas, dan wilayah di Indonesia melalui program sosial, donasi, dan aksi lapangan.';
export const DEFAULT_SEO_IMAGE = '/cropped-PRIMARY_1@300x-scaled-1.webp';

export const STA_BUSINESS_PROFILE = {
  name: 'Sekolah Tanah Air',
  url: SITE_URL,
  telephone: '+6287882799026',
  whatsappUrl: 'https://wa.me/6287882799026',
  email: 'admin@sekolahtanahair.com',
  addressLocality: 'Tangerang Selatan',
  addressCountry: 'ID',
  addressLabel: 'Tangerang Selatan, Indonesia',
  instagramUrl: 'https://www.instagram.com/sekolah.tanahair',
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Sekolah%20Tanah%20Air%20Tangerang%20Selatan',
  googleBusinessProfileUrl: '',
} as const;

export type SeoOptions = {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  type?: 'website' | 'article';
  robots?: string;
  structuredData?: JsonLd | JsonLd[];
  includeOrganizationSchema?: boolean;
};

export function absoluteUrl(pathOrUrl = '/') {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${normalizedPath}`;
}

export function canonicalPath(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return `/${pathname.replace(/^\/+|\/+$/g, '')}`;
}

export function stripHtmlToText(value: string | null | undefined) {
  return (value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function truncateText(value: string, maxLength = 155) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3).trim()}...`;
}

export function formatSeoTitle(title?: string) {
  if (!title) return DEFAULT_SEO_TITLE;
  return title.includes('Sekolah Tanah Air') ? title : `${title} | Sekolah Tanah Air`;
}

export function createOrganizationJsonLd(): JsonLd {
  const sameAs = [
    STA_BUSINESS_PROFILE.instagramUrl,
    STA_BUSINESS_PROFILE.googleBusinessProfileUrl,
  ].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'EducationalOrganization'],
    name: STA_BUSINESS_PROFILE.name,
    url: STA_BUSINESS_PROFILE.url,
    logo: absoluteUrl(DEFAULT_SEO_IMAGE),
    email: STA_BUSINESS_PROFILE.email,
    telephone: STA_BUSINESS_PROFILE.telephone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: STA_BUSINESS_PROFILE.addressLocality,
      addressCountry: STA_BUSINESS_PROFILE.addressCountry,
    },
    sameAs,
  };
}

export function createBreadcrumbJsonLd(items: Array<{ name: string; path: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function createEventJsonLd(event: {
  name: string;
  description?: string | null;
  path: string;
  image?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}): JsonLd | null {
  if (!event.startDate && !event.endDate) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description ?? DEFAULT_SEO_DESCRIPTION,
    url: absoluteUrl(event.path),
    image: event.image ? absoluteUrl(event.image) : absoluteUrl(DEFAULT_SEO_IMAGE),
    startDate: event.startDate ?? event.endDate,
    endDate: event.endDate ?? event.startDate,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: event.location ?? STA_BUSINESS_PROFILE.addressLabel,
      address: {
        '@type': 'PostalAddress',
        addressLocality: STA_BUSINESS_PROFILE.addressLocality,
        addressCountry: STA_BUSINESS_PROFILE.addressCountry,
      },
    },
    organizer: {
      '@type': 'Organization',
      name: STA_BUSINESS_PROFILE.name,
      url: STA_BUSINESS_PROFILE.url,
    },
  };
}

function setMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element!.setAttribute(key, value);
  });
}

function setLink(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element!.setAttribute(key, value);
  });
}

export function useSeo(options: SeoOptions = {}) {
  React.useEffect(() => {
    const title = formatSeoTitle(options.title);
    const description = options.description || DEFAULT_SEO_DESCRIPTION;
    const canonical = absoluteUrl(canonicalPath(options.path ?? window.location.pathname));
    const image = absoluteUrl(options.image || DEFAULT_SEO_IMAGE);
    const robots = options.robots || 'index,follow';
    const type = options.type || 'website';

    document.documentElement.lang = 'id';
    document.title = title;

    setMeta('meta[name="description"]', { name: 'description', content: description });
    setMeta('meta[name="robots"]', { name: 'robots', content: robots });
    setMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    setMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    setMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    setMeta('meta[property="og:image"]', { property: 'og:image', content: image });
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image });
    setLink('link[rel="canonical"]', { rel: 'canonical', href: canonical });
    setLink('link[rel="alternate"][type="text/plain"]', {
      rel: 'alternate',
      type: 'text/plain',
      href: '/llms.txt',
      title: 'LLMs.txt',
    });

    document.querySelectorAll('script[data-seo-jsonld="true"]').forEach((node) => node.remove());
    const structuredData = [
      ...(options.includeOrganizationSchema === false ? [] : [createOrganizationJsonLd()]),
      ...(Array.isArray(options.structuredData)
        ? options.structuredData
        : options.structuredData
          ? [options.structuredData]
          : []),
    ].filter(Boolean);

    structuredData.forEach((item) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seoJsonld = 'true';
      script.textContent = JSON.stringify(item);
      document.head.appendChild(script);
    });
  }, [
    options.description,
    options.image,
    options.includeOrganizationSchema,
    options.path,
    options.robots,
    options.structuredData,
    options.title,
    options.type,
  ]);
}
