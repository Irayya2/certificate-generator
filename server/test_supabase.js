/**
 * Supabase connection diagnostic.
 * Run: node test_supabase.js
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const keyType = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role Key (Secret)' : 'Anon Key (Public)';

console.log('SUPABASE_URL             :', url);
console.log('SUPABASE_KEY_TYPE        :', keyType);
console.log('SUPABASE_KEY (first 30)  :', key?.slice(0, 30) + '...');
console.log();

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Test 1: simple select
console.log('Test 1: SELECT * FROM students LIMIT 3');
const { data, error } = await supabase
  .from('students')
  .select('roll_no, sem, full_name')
  .limit(3);

if (error) {
  console.error('❌ Error:', error.message);
  console.error('   Code:', error.code);
  console.error('   Details:', error.details);
  console.error('   Hint:', error.hint);
} else {
  console.log('✅ Connected! Sample rows:');
  console.table(data);
}

// Test 2: name lookup
console.log('\nTest 2: ILIKE lookup for "Aadarsh Hiroji"');
const { data: row, error: err2 } = await supabase
  .from('students')
  .select('*')
  .ilike('full_name', 'Aadarsh Hiroji')
  .maybeSingle();

if (err2) {
  console.error('❌ Lookup error:', err2.message);
} else {
  console.log(row ? `✅ Found: ${JSON.stringify(row)}` : '⚠️ Not found (name not in DB)');
}

