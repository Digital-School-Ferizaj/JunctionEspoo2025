import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from workspace root
dotenv.config({ path: resolve(process.cwd(), '..', '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
  console.log('🔍 Checking database tables...\n');

  const tables = ['users', 'entries', 'memories', 'buddies', 'messages', 'shares', 'share_audit'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('id').limit(1);
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          console.log(`❌ Table "${table}" does NOT exist`);
        } else {
          console.log(`⚠️  Table "${table}": ${error.message}`);
        }
      } else {
        console.log(`✅ Table "${table}" exists (${data?.length || 0} sample rows)`);
      }
    } catch (err: any) {
      console.log(`❌ Table "${table}": ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\nIf tables are missing, create them by:');
  console.log('1. Go to: https://supabase.com/dashboard/project/wvmrnrlouqxzxikqzmio/sql');
  console.log('2. Click "New Query"');
  console.log('3. Copy and paste the contents of: supabase/schema.sql');
  console.log('4. Click "Run"');
  console.log('='.repeat(60) + '\n');
}

checkTables().catch(console.error);
