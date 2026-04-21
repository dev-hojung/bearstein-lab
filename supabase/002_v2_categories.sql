-- ════════════════════════════════════════════════════════
-- 002 — v2 categories (5-way split)
-- Adds cat_v2 column for the new lab-scene flow.
-- Run after schema.sql has been applied.
-- ════════════════════════════════════════════════════════

ALTER TABLE public.parts
  ADD COLUMN IF NOT EXISTS cat_v2 TEXT
    CHECK (cat_v2 IS NULL OR cat_v2 IN ('ears','eyes','ghost','hands','shoes'));

CREATE INDEX IF NOT EXISTS idx_parts_cat_v2_active
  ON public.parts(cat_v2, sort_order)
  WHERE is_active = true AND cat_v2 IS NOT NULL;

-- Seed: backfill cat_v2 from existing cat so the prototype has data.
-- head → eyes (ears intentionally left NULL; admin should assign manually)
-- body → ghost, arm → hands, leg → shoes
UPDATE public.parts SET cat_v2 = 'eyes'  WHERE cat = 'head' AND cat_v2 IS NULL;
UPDATE public.parts SET cat_v2 = 'ghost' WHERE cat = 'body' AND cat_v2 IS NULL;
UPDATE public.parts SET cat_v2 = 'hands' WHERE cat = 'arm'  AND cat_v2 IS NULL;
UPDATE public.parts SET cat_v2 = 'shoes' WHERE cat = 'leg'  AND cat_v2 IS NULL;
