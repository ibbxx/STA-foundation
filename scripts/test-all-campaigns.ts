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
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('id, title');
    
  if (error) {
    console.error("Error fetching campaigns", error);
    return;
  }
  
  console.log(`Testing ${campaigns.length} campaigns...`);
  for (const campaign of campaigns) {
    const { data } = await supabase.functions.invoke('get-public-campaign-donations', {
      body: { campaign_id: campaign.id, limit: 10 },
    });
    if (data?.donations && data.donations.length > 0) {
      console.log(`Campaign "${campaign.title}" has ${data.donations.length} successful donations!`);
    }
  }
  console.log("Done checking all campaigns.");
}

main();
