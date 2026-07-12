import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { detectSuspiciousContent } from '../src/lib/sanitize';

type AuditTarget = {
  table: string;
  select: string;
  fields: string[];
};

const TARGETS: AuditTarget[] = [
  {
    table: 'campaigns',
    select: 'id, slug, title, description, image_url, images, collaborators',
    fields: ['slug', 'title', 'description', 'image_url', 'images', 'collaborators'],
  },
  {
    table: 'campaign_updates',
    select: 'id, campaign_id, title, content, image_url, images',
    fields: ['title', 'content', 'image_url', 'images'],
  },
  {
    table: 'programs',
    select: 'id, slug, title, description, content',
    fields: ['slug', 'title', 'description', 'content'],
  },
  {
    table: 'volunteer_programs',
    select: 'id, slug, title, description, short_description, image_url, timeline, requirements, form_config, external_link',
    fields: ['slug', 'title', 'description', 'short_description', 'image_url', 'timeline', 'requirements', 'form_config', 'external_link'],
  },
  {
    table: 'site_content',
    select: 'id, key, value',
    fields: ['key', 'value'],
  },
];

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

function rowLabel(row: Record<string, unknown>) {
  return String(row.slug ?? row.key ?? row.title ?? row.id ?? 'unknown');
}

async function main() {
  loadEnvFile('.env');
  loadEnvFile('.env.local');

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? process.env.VITE_SUPABASE_ANON_KEY
    ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase env tidak ditemukan. Set VITE_SUPABASE_URL dan key yang punya akses baca.');
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let findingCount = 0;

  for (const target of TARGETS) {
    const { data, error } = await supabase
      .from(target.table)
      .select(target.select)
      .limit(1000);

    if (error) {
      console.warn(`[security-audit] ${target.table}: gagal dibaca - ${error.message}`);
      continue;
    }

    for (const row of ((data ?? []) as unknown as Record<string, unknown>[])) {
      for (const field of target.fields) {
        const value = row[field];
        if (value === null || value === undefined || value === '') continue;

        const result = detectSuspiciousContent(value);
        if (!result.suspicious) continue;

        findingCount += 1;
        console.log(JSON.stringify({
          table: target.table,
          row: rowLabel(row),
          id: row.id ?? null,
          field,
          reasons: result.reasons,
          matches: result.matches,
        }));
      }
    }
  }

  if (findingCount === 0) {
    console.log('[security-audit] Tidak ada konten mencurigakan pada target yang discan.');
    return;
  }

  console.log(`[security-audit] ${findingCount} temuan perlu direview manual. Tidak ada data yang diubah.`);
}

main().catch((error) => {
  console.error(`[security-audit] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
