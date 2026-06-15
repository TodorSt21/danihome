-- ═══════════════════════════════════════════════════════════════
-- ПАМЕТ — Supabase Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- 1. MEMORIES TABLE
CREATE TABLE IF NOT EXISTS public.memories (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text        TEXT NOT NULL DEFAULT '',
  event_date  DATE,
  location    TEXT DEFAULT '',
  person      TEXT DEFAULT '',
  item        TEXT DEFAULT '',
  notes       TEXT DEFAULT '',
  pin         JSONB,
  tags        JSONB DEFAULT '{"general":[],"activity":[],"emotion":[]}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PEOPLE TABLE
CREATE TABLE IF NOT EXISTS public.people (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  photo_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MEMORY MEDIA TABLE
CREATE TABLE IF NOT EXISTS public.memory_media (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id     UUID REFERENCES public.memories(id) ON DELETE CASCADE NOT NULL,
  storage_path  TEXT NOT NULL,
  position      INTEGER DEFAULT 0
);

-- 4. ROW LEVEL SECURITY
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_media ENABLE ROW LEVEL SECURITY;

-- Memories: users only access their own rows
CREATE POLICY "user_memories" ON public.memories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- People: users only access their own rows
CREATE POLICY "user_people" ON public.people
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Memory media: accessible if the parent memory belongs to the user
CREATE POLICY "user_memory_media" ON public.memory_media
  FOR ALL
  USING  (EXISTS (SELECT 1 FROM public.memories WHERE id = memory_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.memories WHERE id = memory_id AND user_id = auth.uid()));


-- ═══════════════════════════════════════════════════════════════
-- STORAGE — run AFTER creating the buckets in the dashboard
-- Dashboard → Storage → New Bucket:
--   • "memory-photos"  (Public: ON)
--   • "people-photos"  (Public: ON)
-- Then run the policies below:
-- ═══════════════════════════════════════════════════════════════

-- memory-photos: only the owner can upload/delete; public read
CREATE POLICY "mem_photos_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'memory-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "mem_photos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'memory-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "mem_photos_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'memory-photos');

-- people-photos: same pattern
CREATE POLICY "ppl_photos_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'people-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "ppl_photos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'people-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "ppl_photos_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'people-photos');
