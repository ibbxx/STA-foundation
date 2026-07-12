import DOMPurify from 'dompurify';
import type { Config } from 'dompurify';
import type { Json } from './supabase/types';

const SAFE_EXTERNAL_REL = 'noopener noreferrer nofollow ugc';

const ALLOWED_HOSTS = [
  'sekolahtanahair.org',
  'www.sekolahtanahair.org',
  'sekolahtanahair.com',
  'www.sekolahtanahair.com',
  'instagram.com',
  'www.instagram.com',
  'wa.me',
  'api.whatsapp.com',
  'whatsapp.com',
  'www.whatsapp.com',
  'maps.google.com',
  'www.google.com',
  'google.com',
  'maps.app.goo.gl',
  'drive.google.com',
  'docs.google.com',
  'supabase.co',
  'supabase.in',
  'unsplash.com',
  'images.unsplash.com',
  'arcgisonline.com',
  'cloudflare.com',
  'challenges.cloudflare.com',
];

const URL_KEY_PATTERN = /(url|href|link|src|avatar|image|video|media)/i;
const HTML_PATTERN = /<\/?[a-z][\s\S]*>/i;
const CONTROL_CHARS_PATTERN = /[\u0000-\u001f\u007f]/g;

const SUSPICIOUS_KEYWORDS = [
  /\bjud(?:i|ol)\b/i,
  /\btogel\b/i,
  /\bcasino\b/i,
  /\bslot\s*(?:gacor|online|88|777|deposit|pulsa)?\b/i,
  /\bgacor\b/i,
  /\bmaxwin\b/i,
  /\bscatter\b/i,
  /\bpragmatic\s*play\b/i,
  /\bsbobet\b/i,
  /\btaruhan\b/i,
  /\bagen\s+slot\b/i,
  /\bdeposit\s+pulsa\b/i,
];

export const GUIDEBOOK_SHORTENER_HOSTS = ['bit.ly'] as const;

const SHORTENER_HOSTS = [
  'bit.ly',
  'tinyurl.com',
  't.co',
  'ow.ly',
  'is.gd',
  'rebrand.ly',
  'cutt.ly',
  's.id',
  'shorturl.at',
  'lnkd.in',
  'bitly.ws',
  'rb.gy',
];

const DANGEROUS_PROTOCOL_PATTERN = /\b(?:javascript|data|vbscript|file|blob):/i;
const ENCODED_DANGEROUS_PATTERN = /%(?:0[0-9a-f]|1[0-9a-f]|3c|3e|22|27|2f|5c|6a|64|76)/i;
const INLINE_EVENT_PATTERN = /\son[a-z]+\s*=/i;

export type SuspiciousContentResult = {
  suspicious: boolean;
  reasons: string[];
  matches: string[];
};

export class SecurityValidationError extends Error {
  constructor(message: string, public reasons: string[] = []) {
    super(message);
    this.name = 'SecurityValidationError';
  }
}

type SafeUrlOptions = {
  allowEmpty?: boolean;
  allowExternal?: boolean;
  fieldName?: string;
  extraAllowedHosts?: readonly string[];
};

function isAllowedHost(hostname: string, extraAllowedHosts: readonly string[] = []) {
  const host = hostname.toLowerCase();
  return [...ALLOWED_HOSTS, ...extraAllowedHosts].some((allowedHost) => {
    const normalized = allowedHost.toLowerCase();
    return host === normalized || host.endsWith(`.${normalized}`);
  });
}

function safeDecode(value: string) {
  let decoded = value;
  for (let i = 0; i < 3; i += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

function cleanUrlInput(value: string) {
  return value.trim().replace(CONTROL_CHARS_PATTERN, '');
}

export function isSafeInternalPath(value: string) {
  const trimmed = cleanUrlInput(value);
  if (!trimmed || !trimmed.startsWith('/') || trimmed.startsWith('//')) return false;
  if (/[<>"'`\\]/.test(trimmed)) return false;
  return !DANGEROUS_PROTOCOL_PATTERN.test(safeDecode(trimmed));
}

export function isExternalUrl(value: string) {
  const trimmed = cleanUrlInput(value);
  try {
    return new URL(trimmed).origin !== window.location.origin;
  } catch {
    return /^https:\/\//i.test(trimmed);
  }
}

export function normalizeSafeUrl(
  value: string | null | undefined,
  options: SafeUrlOptions = {},
) {
  const trimmed = cleanUrlInput(value ?? '');
  const fieldName = options.fieldName ?? 'URL';

  if (!trimmed) {
    if (options.allowEmpty ?? true) return '';
    throw new SecurityValidationError(`${fieldName} wajib diisi.`);
  }

  const decoded = safeDecode(trimmed);
  if (DANGEROUS_PROTOCOL_PATTERN.test(decoded) || ENCODED_DANGEROUS_PATTERN.test(trimmed)) {
    throw new SecurityValidationError(`${fieldName} tidak aman. Gunakan link HTTPS atau path internal yang valid.`, [
      'dangerous-protocol',
    ]);
  }

  if (isSafeInternalPath(trimmed) || trimmed.startsWith('#')) {
    return trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new SecurityValidationError(`${fieldName} harus berupa path internal atau link HTTPS yang valid.`, [
      'invalid-url',
    ]);
  }

  if (parsed.protocol !== 'https:') {
    throw new SecurityValidationError(`${fieldName} harus menggunakan HTTPS.`, ['non-https-url']);
  }

  if (options.allowExternal === false) {
    throw new SecurityValidationError(`${fieldName} harus berupa path internal.`, ['external-url-blocked']);
  }

  if (!isAllowedHost(parsed.hostname, options.extraAllowedHosts)) {
    throw new SecurityValidationError(`${fieldName} memakai domain yang belum diizinkan.`, [
      `untrusted-domain:${parsed.hostname}`,
    ]);
  }

  return parsed.toString();
}

export function safeNormalizeUrl(value: string | null | undefined, fallback = '') {
  try {
    return normalizeSafeUrl(value, { allowEmpty: true });
  } catch {
    return fallback;
  }
}

export function normalizeGuidebookUrl(value: string | null | undefined) {
  return normalizeSafeUrl(value, {
    allowEmpty: true,
    fieldName: 'Link guidebook',
    extraAllowedHosts: GUIDEBOOK_SHORTENER_HOSTS,
  });
}

export function safeNormalizeGuidebookUrl(value: string | null | undefined, fallback = '') {
  try {
    return normalizeGuidebookUrl(value);
  } catch {
    return fallback;
  }
}

export function detectSuspiciousContent(input: unknown): SuspiciousContentResult {
  const text = typeof input === 'string' ? input : JSON.stringify(input ?? '');
  const decoded = safeDecode(text);
  const haystacks = [text, decoded];
  const reasons = new Set<string>();
  const matches = new Set<string>();

  for (const haystack of haystacks) {
    if (DANGEROUS_PROTOCOL_PATTERN.test(haystack)) {
      reasons.add('dangerous-protocol');
      matches.add('javascript/data/vbscript/file/blob protocol');
    }
    if (INLINE_EVENT_PATTERN.test(haystack)) {
      reasons.add('inline-event-handler');
      matches.add('inline event handler');
    }
    if (/<\s*(script|iframe|object|embed|meta|base|form)\b/i.test(haystack)) {
      reasons.add('dangerous-html-tag');
      matches.add('blocked html tag');
    }
    for (const pattern of SUSPICIOUS_KEYWORDS) {
      const match = haystack.match(pattern);
      if (match?.[0]) {
        reasons.add('suspicious-keyword');
        matches.add(match[0]);
      }
    }
  }

  const urlMatches = decoded.match(/(?:https?:\/\/|www\.)[^\s"'<>]+/gi) ?? [];
  for (const rawUrl of urlMatches) {
    const normalized = rawUrl.startsWith('www.') ? `https://${rawUrl}` : rawUrl;
    try {
      const parsed = new URL(normalized);
      const host = parsed.hostname.toLowerCase();
      if (SHORTENER_HOSTS.some((shortHost) => host === shortHost || host.endsWith(`.${shortHost}`))) {
        reasons.add('url-shortener');
        matches.add(host);
      }
      if (!isAllowedHost(host)) {
        for (const pattern of SUSPICIOUS_KEYWORDS) {
          if (pattern.test(host)) {
            reasons.add('suspicious-domain');
            matches.add(host);
          }
        }
      }
    } catch {
      reasons.add('malformed-url');
      matches.add(rawUrl);
    }
  }

  return {
    suspicious: reasons.size > 0,
    reasons: Array.from(reasons),
    matches: Array.from(matches),
  };
}

export function assertContentSafe(input: unknown, fieldName = 'Konten') {
  const result = detectSuspiciousContent(input);
  if (!result.suspicious) return;

  throw new SecurityValidationError(
    `${fieldName} terdeteksi mengandung link atau payload yang tidak aman.`,
    result.reasons,
  );
}

function sanitizeStyle(value: string | null) {
  if (!value) return '';
  const safeRules: string[] = [];

  value.split(';').forEach((rule) => {
    const [rawProperty, ...rawValueParts] = rule.split(':');
    const property = rawProperty?.trim().toLowerCase();
    const rawValue = rawValueParts.join(':').trim();
    if (!property || !rawValue) return;

    const lowerValue = rawValue.toLowerCase();
    if (/url\s*\(|expression\s*\(|@import|behavior\s*:|-moz-binding|javascript:|data:/i.test(lowerValue)) {
      return;
    }

    if (property === 'text-align' && /^(left|right|center|justify)$/.test(lowerValue)) {
      safeRules.push(`${property}: ${lowerValue}`);
      return;
    }
    if (property === 'font-size' && /^(12|16|20|28|36|48|64)px$/.test(lowerValue)) {
      safeRules.push(`${property}: ${lowerValue}`);
      return;
    }
    if (['color', 'background-color'].includes(property) && /^(#[0-9a-f]{3,8}|rgba?\([\d\s,%.]+\)|[a-z]+)$/i.test(rawValue)) {
      safeRules.push(`${property}: ${rawValue}`);
      return;
    }
    if (['font-weight', 'font-style', 'text-decoration', 'list-style-type'].includes(property) && /^[a-z0-9 -]+$/i.test(rawValue)) {
      safeRules.push(`${property}: ${rawValue}`);
      return;
    }
    if (['margin', 'padding', 'margin-left', 'padding-left'].includes(property) && /^-?(?:0|[0-9.]+(?:px|rem|em|%))(?:\s+-?(?:0|[0-9.]+(?:px|rem|em|%))){0,3}$/.test(lowerValue)) {
      safeRules.push(`${property}: ${lowerValue}`);
    }
  });

  return safeRules.join('; ');
}

let hooksConfigured = false;
const purifier = DOMPurify as unknown as {
  sanitize?: (dirty: string, config?: Config) => string;
  addHook?: (hook: string, callback: (node: Node) => void) => void;
};

function configureDOMPurifyHooks() {
  if (hooksConfigured) return;
  if (typeof purifier.addHook !== 'function') return;
  hooksConfigured = true;

  purifier.addHook('afterSanitizeAttributes', (node) => {
    if (typeof Element !== 'undefined' && !(node instanceof Element)) return;
    const element = node as Element;
    if (typeof element.getAttribute !== 'function') return;

    const style = sanitizeStyle(element.getAttribute('style'));
    if (style) {
      element.setAttribute('style', style);
    } else {
      element.removeAttribute('style');
    }

    if (element.tagName === 'A') {
      const href = element.getAttribute('href');
      try {
        const safeHref = normalizeSafeUrl(href, { fieldName: 'Link' });
        if (safeHref) {
          element.setAttribute('href', safeHref);
          if (/^https:\/\//i.test(safeHref)) {
            element.setAttribute('target', '_blank');
            element.setAttribute('rel', SAFE_EXTERNAL_REL);
          } else {
            element.removeAttribute('target');
            element.removeAttribute('rel');
          }
        } else {
          element.removeAttribute('href');
          element.removeAttribute('target');
          element.removeAttribute('rel');
        }
      } catch {
        element.removeAttribute('href');
        element.removeAttribute('target');
        element.removeAttribute('rel');
      }
    }

    if (element.tagName === 'IMG') {
      try {
        const safeSrc = normalizeSafeUrl(element.getAttribute('src'), { fieldName: 'Gambar' });
        if (safeSrc) {
          element.setAttribute('src', safeSrc);
        } else {
          element.removeAttribute('src');
        }
      } catch {
        element.removeAttribute('src');
      }
    }
  });
}

const SANITIZE_CONFIG: Config = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a',
    'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre', 'hr', 'img', 'span', 'div',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'class',
    'width', 'height', 'style',
  ],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'meta', 'base', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onmouseenter'],
  ADD_ATTR: ['target'],
  ALLOWED_URI_REGEXP: /^(?:(?:https:\/\/)|(?:\/(?!\/))|(?:#))/i,
};

function fallbackSanitizeHtml(dirty: string) {
  return dirty
    .replace(/<\s*(script|iframe|object|embed|meta|base|form|input|button)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*\/?\s*(script|iframe|object|embed|meta|base|form|input|button)\b[^>]*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(href|src)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi, (_match, attr: string, _raw: string, doubleQuoted: string, singleQuoted: string, bare: string) => {
      try {
        const safeUrl = normalizeSafeUrl(doubleQuoted ?? singleQuoted ?? bare ?? '', { fieldName: attr });
        return safeUrl ? ` ${attr.toLowerCase()}="${safeUrl.replace(/"/g, '&quot;')}"` : '';
      } catch {
        return '';
      }
    })
    .replace(/\s+style\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi, (_match, _raw: string, doubleQuoted: string, singleQuoted: string, bare: string) => {
      const safeStyle = sanitizeStyle(doubleQuoted ?? singleQuoted ?? bare ?? '');
      return safeStyle ? ` style="${safeStyle.replace(/"/g, '&quot;')}"` : '';
    });
}

export function sanitizeRichTextForRender(dirty: string | null | undefined): string {
  configureDOMPurifyHooks();
  const input = dirty ?? '';
  if (typeof purifier.sanitize !== 'function') {
    return fallbackSanitizeHtml(input);
  }
  return purifier.sanitize(input, SANITIZE_CONFIG);
}

export function sanitizeRichTextForStorage(dirty: string | null | undefined, fieldName = 'Konten'): string {
  assertContentSafe(dirty ?? '', fieldName);
  return sanitizeRichTextForRender(dirty);
}

export function sanitizePlainTextForStorage(value: string | null | undefined, fieldName = 'Konten'): string {
  const text = (value ?? '').trim();
  assertContentSafe(text, fieldName);
  return text.replace(CONTROL_CHARS_PATTERN, '');
}

export function sanitizeJsonForStorage(value: Json, fieldName = 'Konten'): Json {
  if (typeof value === 'string') {
    if (URL_KEY_PATTERN.test(fieldName)) {
      return normalizeSafeUrl(value, { allowEmpty: true, fieldName });
    }
    if (HTML_PATTERN.test(value)) {
      return sanitizeRichTextForStorage(value, fieldName);
    }
    return sanitizePlainTextForStorage(value, fieldName);
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => sanitizeJsonForStorage(item, `${fieldName}[${index}]`));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, sanitizeJsonForStorage(item as Json, key)]),
    ) as Json;
  }

  return value;
}

/**
 * Backward-compatible alias for existing render sites.
 */
export function sanitizeHTML(dirty: string): string {
  return sanitizeRichTextForRender(dirty);
}
