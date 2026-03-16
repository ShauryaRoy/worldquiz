-- Create leaderboard table for WorldQuiz
create table if not exists public.leaderboard_scores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  quiz_type text not null,
  score integer not null check (score >= 0),
  time_taken numeric not null check (time_taken >= 0),
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_leaderboard_quiz_type on public.leaderboard_scores (quiz_type);
create index if not exists idx_leaderboard_score_time on public.leaderboard_scores (score desc, time_taken asc);
create index if not exists idx_leaderboard_created_at on public.leaderboard_scores (created_at desc);

-- Enable RLS and allow public app reads/writes via publishable key (anon role)
alter table public.leaderboard_scores enable row level security;

drop policy if exists "Public can read leaderboard" on public.leaderboard_scores;
create policy "Public can read leaderboard"
  on public.leaderboard_scores
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can insert leaderboard" on public.leaderboard_scores;
create policy "Public can insert leaderboard"
  on public.leaderboard_scores
  for insert
  to anon, authenticated
  with check (true);
