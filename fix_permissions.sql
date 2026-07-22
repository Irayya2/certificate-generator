-- ============================================================
-- Supabase SQL Fix: Table Permissions & Row Level Security
-- Target Table: public.students
-- Run this script in: Supabase Dashboard -> SQL Editor
-- Project: pqahmhvawczlnjhocmnt
-- ============================================================

-- Step 1: Ensure public schema usage is granted to API roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Step 2: Create the table (safe — skips if already exists)
CREATE TABLE IF NOT EXISTS public.students (
    roll_no VARCHAR(20) PRIMARY KEY,
    sem INTEGER NOT NULL CHECK (sem IN (1, 3, 5)),
    full_name VARCHAR(150) NOT NULL
);

-- Step 3: Create index on semester
CREATE INDEX IF NOT EXISTS idx_students_sem ON public.students (sem);

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policy (SELECT only — app is read-only)
DROP POLICY IF EXISTS "Allow public read access" ON public.students;
CREATE POLICY "Allow public read access"
ON public.students
FOR SELECT
USING (true);

-- Clean up any leftover write policies (not needed for this app)
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.students;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.students;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.students;

-- Step 6: Grant SELECT-only to API roles
GRANT SELECT ON public.students TO anon;
GRANT SELECT ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;

-- ============================================================
-- Diagnostic Queries (verify the fix)
-- ============================================================

-- Diagnostic 1: Is RLS enabled?
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class WHERE relname = 'students';

-- Diagnostic 2: What policies exist?
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE tablename = 'students';

-- Diagnostic 3: Who owns the table?
SELECT tableowner FROM pg_tables WHERE tablename = 'students';

-- Diagnostic 4: Verify grants
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'students';
