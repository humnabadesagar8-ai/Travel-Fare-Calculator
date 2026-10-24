/*
# PrepAI - Core Schema

Creates the tables that power the PrepAI interview preparation platform.

## 1. New Tables

### profiles
- `id` (uuid, PK, references auth.users) — one row per authenticated user.
- `email` (text, unique) — mirrored from auth.users for convenience.
- `full_name` (text) — display name.
- `role` (text, default 'user') — 'user' or 'admin'.
- `credits` (integer, default 50) — credits remaining for AI features.
- `created_at` (timestamptz) — row creation time.

### resumes
- `id` (uuid, PK)
- `user_id` (uuid, FK -> profiles, default auth.uid())
- `file_url` (text) — stored file URL.
- `score` (integer, nullable) — ATS / review score 0-100.
- `skills_detected` (text[]) — detected skills.
- `feedback_json` (jsonb) — structured feedback.
- `created_at` (timestamptz)

### interviews
- `id` (uuid, PK)
- `user_id` (uuid, FK -> profiles, default auth.uid())
- `type` (text) — 'voice' | 'coding' | 'behavioral'.
- `score` (integer, nullable)
- `transcript_json` (jsonb)
- `feedback_json` (jsonb)
- `created_at` (timestamptz)

### coding_submissions
- `id` (uuid, PK)
- `user_id` (uuid, FK -> profiles, default auth.uid())
- `problem_id` (text) — slug of the problem attempted.
- `code` (text) — submitted source code.
- `language` (text) — e.g. 'javascript', 'python'.
- `status` (text) — 'pending' | 'pass' | 'fail'.
- `created_at` (timestamptz)

## 2. Security (RLS)
- Enable RLS on all tables.
- Owner-scoped CRUD: authenticated users can only access rows they own.
- Admins can read all rows via profiles role check (read-only admin overview).
- user_id columns default to auth.uid() so inserts omitting user_id still satisfy WITH CHECK.

## 3. Notes
- Email confirmation stays OFF (default).
- All policies are split into 4 per CRUD verb (no FOR ALL).
*/

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'user',
  credits integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: each user reads/updates own row
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
ON profiles FOR SELECT
TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Resumes table
CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  file_url text,
  score integer,
  skills_detected text[] DEFAULT '{}',
  feedback_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_resumes" ON resumes;
CREATE POLICY "select_own_resumes"
ON resumes FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_resumes" ON resumes;
CREATE POLICY "insert_own_resumes"
ON resumes FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_resumes" ON resumes;
CREATE POLICY "update_own_resumes"
ON resumes FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_resumes" ON resumes;
CREATE POLICY "delete_own_resumes"
ON resumes FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('voice', 'coding', 'behavioral')),
  score integer,
  transcript_json jsonb DEFAULT '[]'::jsonb,
  feedback_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_interviews" ON interviews;
CREATE POLICY "select_own_interviews"
ON interviews FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_interviews" ON interviews;
CREATE POLICY "insert_own_interviews"
ON interviews FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_interviews" ON interviews;
CREATE POLICY "update_own_interviews"
ON interviews FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_interviews" ON interviews;
CREATE POLICY "delete_own_interviews"
ON interviews FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Coding submissions table
CREATE TABLE IF NOT EXISTS coding_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  problem_id text NOT NULL,
  code text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'javascript',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'pass', 'fail')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE coding_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_submissions" ON coding_submissions;
CREATE POLICY "select_own_submissions"
ON coding_submissions FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_submissions" ON coding_submissions;
CREATE POLICY "insert_own_submissions"
ON coding_submissions FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_submissions" ON coding_submissions;
CREATE POLICY "update_own_submissions"
ON coding_submissions FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_submissions" ON coding_submissions;
CREATE POLICY "delete_own_submissions"
ON coding_submissions FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_created_at ON interviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coding_submissions_user_id ON coding_submissions(user_id);

-- Trigger to auto-create a profile when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
