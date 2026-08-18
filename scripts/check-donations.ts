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
// Gunakan SERVICE ROLE KEY untuk bypass RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Fetching all success donations via service role...');
  const { data, error } = await supabase
    .from('donations')
    .select('id, donor_name, payment_status, is_anonymous, amount, created_at, campaign_id')
    .eq('payment_status', 'success');

  if (error) {
    console.error('Error fetching donations:', error);
    return;
  }

  console.log(`Found ${data.length} successful donations in the database.`);
  data.forEach((d, i) => {
    console.log(`[${i+1}] ID: ${d.id}, Name: ${d.donor_name}, Anonymous: ${d.is_anonymous}, Amount: ${d.amount}, Campaign: ${d.campaign_id}`);
  });
}

main();
