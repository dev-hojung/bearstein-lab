-- ════════════════════════════════════════════════════════
-- Bearstein Virtual Laboratory — Supabase schema
-- Run this in your Supabase project's SQL Editor once.
-- ════════════════════════════════════════════════════════

-- 1. Allowed phone numbers (whitelist for user access)
CREATE TABLE IF NOT EXISTS public.allowed_phones (
  phone        TEXT        PRIMARY KEY,    -- Normalized: 01012345678 (digits only)
  label        TEXT,                       -- Optional memo ("엄마", "친구 A")
  session_minutes INTEGER  NOT NULL DEFAULT 1440, -- Session duration in minutes (1 min ~ 365 days)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ
);

-- 2. Parts catalog (replaces hardcoded PARTS_DATA)
CREATE TABLE IF NOT EXISTS public.parts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  cat         TEXT        NOT NULL CHECK (cat IN ('head', 'body', 'arm', 'leg')),
  url         TEXT        NOT NULL,
  uploaded_by TEXT,                        -- phone (or 'admin') who uploaded
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parts_cat_active
  ON public.parts(cat, sort_order)
  WHERE is_active = true;

-- 3. Row Level Security
--
-- Server-side code uses the service_role key, which bypasses RLS entirely.
-- For safety we still forbid anonymous client access so the anon key can't
-- be misused if it leaks.
ALTER TABLE public.allowed_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts          ENABLE ROW LEVEL SECURITY;

-- No policies → anon/authenticated cannot read or write. Only service_role does.

-- 4. Storage bucket for part images
-- Create it via the dashboard (Storage → New bucket → name: "parts" → public).
-- Or run this once to create it programmatically:
INSERT INTO storage.buckets (id, name, public)
VALUES ('parts', 'parts', true)
ON CONFLICT (id) DO NOTHING;

-- 5. (Optional) Seed the 16 default SVG parts so the catalog is not empty.
-- These reference files already bundled in /public/images/parts/ — they are
-- served from the Next.js static assets, not from Supabase Storage.
INSERT INTO public.parts (name, cat, url, uploaded_by, sort_order) VALUES
  ('Head Part α', 'head', '/images/parts/h0.svg', 'seed', 0),
  ('Head Part β', 'head', '/images/parts/h1.svg', 'seed', 1),
  ('Head Part γ', 'head', '/images/parts/h2.svg', 'seed', 2),
  ('Head Part δ', 'head', '/images/parts/h3.svg', 'seed', 3),
  ('Body Part α', 'body', '/images/parts/b0.svg', 'seed', 0),
  ('Body Part β', 'body', '/images/parts/b1.svg', 'seed', 1),
  ('Body Part γ', 'body', '/images/parts/b2.svg', 'seed', 2),
  ('Body Part δ', 'body', '/images/parts/b3.svg', 'seed', 3),
  ('Arm Part α',  'arm',  '/images/parts/a0.svg', 'seed', 0),
  ('Arm Part β',  'arm',  '/images/parts/a1.svg', 'seed', 1),
  ('Arm Part γ',  'arm',  '/images/parts/a2.svg', 'seed', 2),
  ('Arm Part δ',  'arm',  '/images/parts/a3.svg', 'seed', 3),
  ('Leg Part α',  'leg',  '/images/parts/l0.svg', 'seed', 0),
  ('Leg Part β',  'leg',  '/images/parts/l1.svg', 'seed', 1),
  ('Leg Part γ',  'leg',  '/images/parts/l2.svg', 'seed', 2),
  ('Leg Part δ',  'leg',  '/images/parts/l3.svg', 'seed', 3)
ON CONFLICT DO NOTHING;
