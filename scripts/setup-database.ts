import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wvmrnrlouqxzxikqzmio.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

// Create admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function setupDatabase() {
  console.log('🔧 Setting up Supabase database...');
  console.log(`📍 URL: ${SUPABASE_URL}`);

  // Read schema file
  const schemaPath = join(__dirname, '..', 'supabase', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // Split into individual statements (basic split by semicolon)
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`\n📝 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comments and storage instructions
    if (statement.includes('Storage instructions') || statement.startsWith('--')) {
      continue;
    }

    const preview = statement.substring(0, 60).replace(/\n/g, ' ');
    process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        // Try direct execution as fallback
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ sql: statement + ';' }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      }
      
      console.log('✅');
      successCount++;
    } catch (err: any) {
      // Some errors are expected (like "already exists")
      if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
        console.log('⚠️  (already exists)');
        successCount++;
      } else {
        console.log(`❌ ${err.message}`);
        errorCount++;
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`${'='.repeat(60)}\n`);

  if (errorCount === 0) {
    console.log('🎉 Database setup complete!');
  } else {
    console.log('⚠️  Setup completed with some errors. This may be normal if tables already exist.');
  }
}

setupDatabase().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
