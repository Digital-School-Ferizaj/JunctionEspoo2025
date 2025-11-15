import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..', '..', '..');
dotenv.config({ path: resolve(rootDir, '.env') });

console.log('🔍 SUPABASE DEEP DIAGNOSTIC CHECK\n');
console.log('='.repeat(70));

// Check 1: Environment Variables
console.log('\n1️⃣  ENVIRONMENT VARIABLES CHECK');
console.log('-'.repeat(70));
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`SUPABASE_URL: ${SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`  Value: ${SUPABASE_URL || 'NOT SET'}`);

console.log(`\nSUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
if (SUPABASE_ANON_KEY) {
  const anonPayload = JSON.parse(Buffer.from(SUPABASE_ANON_KEY.split('.')[1], 'base64').toString());
  console.log(`  Role: ${anonPayload.role}`);
  console.log(`  Ref: ${anonPayload.ref}`);
  console.log(`  Expires: ${new Date(anonPayload.exp * 1000).toLocaleDateString()}`);
}

console.log(`\nSUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
if (SUPABASE_SERVICE_ROLE_KEY) {
  try {
    const servicePayload = JSON.parse(Buffer.from(SUPABASE_SERVICE_ROLE_KEY.split('.')[1], 'base64').toString());
    console.log(`  Role: ${servicePayload.role}`);
    console.log(`  Ref: ${servicePayload.ref}`);
    console.log(`  Expires: ${new Date(servicePayload.exp * 1000).toLocaleDateString()}`);
    
    if (servicePayload.role !== 'service_role') {
      console.log('  ⚠️  WARNING: This is NOT a service_role key!');
    }
  } catch (e) {
    console.log('  ❌ Invalid JWT format');
  }
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\n❌ Missing required environment variables. Cannot continue.\n');
  process.exit(1);
}

// Check 2: Connection Test
console.log('\n2️⃣  CONNECTION TEST');
console.log('-'.repeat(70));

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

try {
  console.log('Testing anon client connection...');
  const { data: anonData, error: anonError } = await anonClient.from('users').select('count').limit(0);
  if (anonError) {
    console.log(`❌ Anon client error: ${anonError.message}`);
    console.log(`   Code: ${anonError.code}`);
  } else {
    console.log('✅ Anon client connected successfully');
  }
} catch (e: any) {
  console.log(`❌ Anon client exception: ${e.message}`);
}

try {
  console.log('\nTesting service role client connection...');
  const { data: serviceData, error: serviceError } = await serviceClient.from('users').select('count').limit(0);
  if (serviceError) {
    console.log(`❌ Service client error: ${serviceError.message}`);
    console.log(`   Code: ${serviceError.code}`);
  } else {
    console.log('✅ Service role client connected successfully');
  }
} catch (e: any) {
  console.log(`❌ Service client exception: ${e.message}`);
}

// Check 3: Tables Existence
console.log('\n3️⃣  DATABASE TABLES CHECK');
console.log('-'.repeat(70));

const tables = ['users', 'entries', 'memories', 'buddies', 'messages', 'shares', 'share_audit'];
const tableStatus: any = {};

for (const table of tables) {
  try {
    const { data, error } = await serviceClient.from(table).select('id').limit(1);
    
    if (error) {
      tableStatus[table] = { exists: false, error: error.message, code: error.code };
      console.log(`❌ ${table}: ${error.message} (${error.code})`);
    } else {
      tableStatus[table] = { exists: true, sampleCount: data?.length || 0 };
      console.log(`✅ ${table}: exists`);
    }
  } catch (e: any) {
    tableStatus[table] = { exists: false, error: e.message };
    console.log(`❌ ${table}: ${e.message}`);
  }
}

// Check 4: RLS Policies
console.log('\n4️⃣  ROW LEVEL SECURITY (RLS) CHECK');
console.log('-'.repeat(70));

try {
  console.log('Testing RLS with service role (should bypass)...');
  const { data, error } = await serviceClient.from('users').insert({
    email: `test-${Date.now()}@test.com`,
    passcode_hash: 'test_hash',
    name: 'Test User',
  }).select().single();
  
  if (error) {
    console.log(`❌ Cannot insert with service role: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    console.log(`   Details: ${error.details}`);
    console.log(`   Hint: ${error.hint}`);
    
    if (error.code === '42501') {
      console.log('\n⚠️  RLS ISSUE: Service role is being blocked by RLS policies!');
      console.log('   This should NOT happen with a proper service_role key.');
    }
  } else {
    console.log(`✅ Successfully created test user with service role`);
    console.log(`   User ID: ${data.id}`);
    
    // Clean up
    await serviceClient.from('users').delete().eq('id', data.id);
    console.log(`   (Test user deleted)`);
  }
} catch (e: any) {
  console.log(`❌ Exception: ${e.message}`);
}

// Check 5: Auth Registration Flow
console.log('\n5️⃣  REGISTRATION ENDPOINT TEST');
console.log('-'.repeat(70));

try {
  const testEmail = `test-${Date.now()}@amily.test`;
  const testPasscode = '1234';
  
  console.log(`Testing registration with: ${testEmail}`);
  
  const response = await fetch('http://localhost:4000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      passcode: testPasscode,
      name: 'Test User',
    }),
  });
  
  const responseData = await response.json();
  
  if (response.ok) {
    console.log(`✅ Registration successful!`);
    console.log(`   Token received: ${responseData.token ? 'Yes' : 'No'}`);
    console.log(`   User ID: ${responseData.user?.id}`);
    
    // Clean up
    if (responseData.user?.id) {
      await serviceClient.from('users').delete().eq('id', responseData.user.id);
      console.log(`   (Test user deleted)`);
    }
  } else {
    console.log(`❌ Registration failed: ${response.status} ${response.statusText}`);
    console.log(`   Error: ${JSON.stringify(responseData, null, 2)}`);
  }
} catch (e: any) {
  console.log(`❌ Cannot test registration: ${e.message}`);
  console.log(`   Is the server running on http://localhost:4000?`);
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('📋 DIAGNOSTIC SUMMARY');
console.log('='.repeat(70));

const missingTables = Object.entries(tableStatus).filter(([_, status]: any) => !status.exists);
if (missingTables.length > 0) {
  console.log(`\n❌ Missing tables: ${missingTables.map(([t]) => t).join(', ')}`);
  console.log('\n📝 ACTION REQUIRED: Run the SQL schema in Supabase dashboard:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/wvmrnrlouqxzxikqzmio/sql');
  console.log('   2. Paste the contents of: supabase/schema.sql');
  console.log('   3. Click "Run"');
} else {
  console.log('\n✅ All tables exist');
}

console.log('\n');
