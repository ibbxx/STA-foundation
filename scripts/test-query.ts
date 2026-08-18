import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.slice(0, idx).trim();
          let value = trimmed.slice(idx + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  } catch {}
}
loadEnv();
const supabaseUrl = process.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  // Query via REST RPC directly to test raw output
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/get_public_leaderboard?p_limit=100`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`
    }
  });
  const json = await res.json();
  console.log('Leaderboard direct JSON:', json);
}
main();
