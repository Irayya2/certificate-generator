import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
// Prefer Service Role Key for secure server-side access; fall back to Anon Key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Startup diagnostic (no secrets logged)
const keySource = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE_KEY' : 'ANON_KEY (fallback)';
console.log(`[Supabase] URL: ${supabaseUrl}`);
console.log(`[Supabase] Key: ${keySource}`);

/**
 * Look up a student by their full name (case-insensitive).
 * Returns the student row or null if not found.
 * @param {string} name
 * @returns {Promise<{roll_no: string, sem: number, full_name: string} | null>}
 */
export async function findStudentByName(name) {
  const { data, error } = await supabase
    .from('students')
    .select('roll_no, sem, full_name')
    .ilike('full_name', name.trim())
    .maybeSingle();

  if (error) {
    const err = new Error(`Database error: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  return data; // null if no match
}

/**
 * Look up a student by their roll number (exact match, case-insensitive).
 * Returns the student row or null if not found.
 * @param {string} rollNo
 * @returns {Promise<{roll_no: string, sem: number, full_name: string} | null>}
 */
export async function findStudentByRollNo(rollNo) {
  const { data, error } = await supabase
    .from('students')
    .select('roll_no, sem, full_name')
    .ilike('roll_no', rollNo.trim())
    .maybeSingle();

  if (error) {
    const err = new Error(`Database error: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  return data; // null if no match
}

