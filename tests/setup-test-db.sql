-- Test Database Setup for Playwright E2E Tests
-- This script creates test users and sets up authentication state

-- ==========================================
-- 1. Create Test Users
-- ==========================================

-- Test user 1: Regular user
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'testuser@flowai.test',
  crypt('TestPassword123!', gen_salt('bf')),
  now(),
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Test user 2: Creator user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'creator@flowai.test',
  crypt('TestPassword123!', gen_salt('bf')),
  now(),
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Test user 3: Admin user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'admin@flowai.test',
  crypt('TestPassword123!', gen_salt('bf')),
  now(),
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 2. Create User Profiles
-- ==========================================

INSERT INTO public.profiles (user_id, username, full_name)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'testuser', 'Test User'),
  ('00000000-0000-0000-0000-000000000002', 'creator', 'Test Creator'),
  ('00000000-0000-0000-0000-000000000003', 'admin', 'Test Admin')
ON CONFLICT (user_id) DO NOTHING;

-- ==========================================
-- 3. Assign User Roles
-- ==========================================

INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'user'),
  ('00000000-0000-0000-0000-000000000002', 'creator'),
  ('00000000-0000-0000-0000-000000000003', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- ==========================================
-- 4. Seed Test Data
-- ==========================================

-- Create a test project for the creator
INSERT INTO public.projects (
  id,
  user_id,
  title,
  description,
  status
)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000002',
  'Test Video Project',
  'A test project for E2E testing',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- Verification Queries
-- ==========================================

-- Verify test users were created
-- SELECT id, email FROM auth.users WHERE email LIKE '%@flowai.test';

-- Verify roles were assigned
-- SELECT u.email, ur.role 
-- FROM auth.users u
-- JOIN user_roles ur ON u.id = ur.user_id
-- WHERE u.email LIKE '%@flowai.test';
