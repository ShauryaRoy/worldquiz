-- ============================================================
-- WorldQuiz New Features: Duels, Daily Challenge, Speed Boards
-- Run this in your Supabase SQL editor
-- ============================================================

-- ── User Profiles ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  email          TEXT        UNIQUE NOT NULL,
  rating         INTEGER     NOT NULL DEFAULT 1000,
  wins           INTEGER     NOT NULL DEFAULT 0,
  losses         INTEGER     NOT NULL DEFAULT 0,
  draws          INTEGER     NOT NULL DEFAULT 0,
  current_streak INTEGER     NOT NULL DEFAULT 0,
  longest_streak INTEGER     NOT NULL DEFAULT 0,
  last_challenge_date DATE,
  badges         TEXT[]      NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email  ON public.user_profiles (email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_rating ON public.user_profiles (rating DESC);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read profiles"   ON public.user_profiles;
CREATE POLICY "Public read profiles"   ON public.user_profiles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public insert profiles" ON public.user_profiles;
CREATE POLICY "Public insert profiles" ON public.user_profiles FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public update profiles" ON public.user_profiles;
CREATE POLICY "Public update profiles" ON public.user_profiles FOR UPDATE TO anon, authenticated USING (true);


-- ── Duels ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.duels (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code        TEXT        UNIQUE NOT NULL,
  host_name        TEXT        NOT NULL,
  host_email       TEXT        NOT NULL,
  guest_name       TEXT,
  guest_email      TEXT,
  quiz_type        TEXT        NOT NULL DEFAULT 'capitals',
  questions        JSONB       NOT NULL DEFAULT '[]',
  status           TEXT        NOT NULL DEFAULT 'waiting'
                               CHECK (status IN ('waiting','active','finished','abandoned')),
  host_score       INTEGER     NOT NULL DEFAULT 0,
  guest_score      INTEGER     NOT NULL DEFAULT 0,
  host_answers     JSONB       NOT NULL DEFAULT '[]',
  guest_answers    JSONB       NOT NULL DEFAULT '[]',
  winner_email     TEXT,
  total_questions  INTEGER     NOT NULL DEFAULT 10,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_duels_room_code   ON public.duels (room_code);
CREATE INDEX IF NOT EXISTS idx_duels_status      ON public.duels (status);
CREATE INDEX IF NOT EXISTS idx_duels_created_at  ON public.duels (created_at DESC);

ALTER TABLE public.duels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read duels"   ON public.duels;
CREATE POLICY "Public read duels"   ON public.duels FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public insert duels" ON public.duels;
CREATE POLICY "Public insert duels" ON public.duels FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public update duels" ON public.duels;
CREATE POLICY "Public update duels" ON public.duels FOR UPDATE TO anon, authenticated USING (true);

-- Enable Realtime for live duel sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.duels;


-- ── Daily Challenge Completions ────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_challenge_completions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT        NOT NULL,
  name           TEXT        NOT NULL,
  challenge_date DATE        NOT NULL DEFAULT CURRENT_DATE,
  quiz_type      TEXT        NOT NULL,
  score          INTEGER     NOT NULL,
  total          INTEGER     NOT NULL,
  time_taken     NUMERIC     NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email, challenge_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_email ON public.daily_challenge_completions (email);
CREATE INDEX IF NOT EXISTS idx_daily_date  ON public.daily_challenge_completions (challenge_date DESC);

ALTER TABLE public.daily_challenge_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read daily"   ON public.daily_challenge_completions;
CREATE POLICY "Public read daily"   ON public.daily_challenge_completions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public insert daily" ON public.daily_challenge_completions;
CREATE POLICY "Public insert daily" ON public.daily_challenge_completions FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public upsert daily" ON public.daily_challenge_completions;
CREATE POLICY "Public upsert daily" ON public.daily_challenge_completions FOR UPDATE TO anon, authenticated USING (true);


-- ── Speed Leaderboard Views ────────────────────────────────
-- These reuse the existing leaderboard_scores table.
-- Minimum score of 5 correct answers required to qualify.

CREATE OR REPLACE VIEW public.speed_leaderboard_weekly AS
  SELECT *,
    RANK() OVER (PARTITION BY quiz_type ORDER BY time_taken ASC) AS speed_rank
  FROM public.leaderboard_scores
  WHERE created_at >= NOW() - INTERVAL '7 days'
    AND score >= 5
  ORDER BY quiz_type, time_taken ASC;

CREATE OR REPLACE VIEW public.speed_leaderboard_monthly AS
  SELECT *,
    RANK() OVER (PARTITION BY quiz_type ORDER BY time_taken ASC) AS speed_rank
  FROM public.leaderboard_scores
  WHERE created_at >= NOW() - INTERVAL '30 days'
    AND score >= 5
  ORDER BY quiz_type, time_taken ASC;

-- ── Duel Rank Leaderboard View ─────────────────────────────
CREATE OR REPLACE VIEW public.duel_rankings AS
  SELECT
    name,
    email,
    rating,
    wins,
    losses,
    draws,
    RANK() OVER (ORDER BY rating DESC) AS rank_position
  FROM public.user_profiles
  ORDER BY rating DESC;
