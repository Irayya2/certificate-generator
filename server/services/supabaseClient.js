import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import logger from '../utils/logger.js';

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
logger.info(`[Supabase] Client initialized | URL: ${supabaseUrl} | Key: ${keySource}`);

/**
 * Executes a Supabase query with automatic retry for transient network fetch errors.
 * @param {Function} queryFn 
 * @param {string} queryName 
 * @param {number} maxRetries 
 */
async function executeWithRetry(queryFn, queryName = 'SupabaseQuery', maxRetries = 2) {
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      const { data, error } = await queryFn();

      if (error) {
        const isFetchFailed = error.message?.includes('fetch failed') || error.message?.includes('TypeError');
        if (isFetchFailed && attempt < maxRetries) {
          logger.warn(`[Supabase] Network fetch error on ${queryName} (Attempt ${attempt}/${maxRetries}): ${error.message}. Retrying...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        const formattedMsg = isFetchFailed
          ? `Supabase network connectivity error (${error.message}). Check server internet / DNS / project status.`
          : `Database error: ${error.message}`;

        const err = new Error(formattedMsg);
        err.statusCode = isFetchFailed ? 503 : 500;
        err.originalError = error;
        throw err;
      }

      return data;
    } catch (err) {
      const isFetchFailed = err.message?.includes('fetch failed') || err.name === 'TypeError';
      if (isFetchFailed && attempt < maxRetries) {
        logger.warn(`[Supabase] Caught exception on ${queryName} (Attempt ${attempt}/${maxRetries}): ${err.message}. Retrying in 1s...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      if (isFetchFailed) {
        logger.error(`[Supabase] Network failure on ${queryName} after ${attempt} attempts: ${err.message}`);
        const connectivityErr = new Error(`Supabase connection failed (${err.message}). Verify network connectivity to ${supabaseUrl}`);
        connectivityErr.statusCode = 503;
        throw connectivityErr;
      }

      throw err;
    }
  }
}

/**
 * Look up a student by their full name (case-insensitive).
 * Returns the student row or null if not found.
 * @param {string} name
 * @returns {Promise<{roll_no: string, sem: number, full_name: string} | null>}
 */
export async function findStudentByName(name) {
  return executeWithRetry(
    () => supabase
      .from('students')
      .select('roll_no, sem, full_name')
      .ilike('full_name', name.trim())
      .maybeSingle(),
    `findStudentByName("${name.trim()}")`
  );
}

/**
 * Look up a student by their roll number (exact match, case-insensitive).
 * Returns the student row or null if not found.
 * @param {string} rollNo
 * @returns {Promise<{roll_no: string, sem: number, full_name: string} | null>}
 */
export async function findStudentByRollNo(rollNo) {
  return executeWithRetry(
    () => supabase
      .from('students')
      .select('roll_no, sem, full_name')
      .ilike('roll_no', rollNo.trim())
      .maybeSingle(),
    `findStudentByRollNo("${rollNo.trim()}")`
  );
}


