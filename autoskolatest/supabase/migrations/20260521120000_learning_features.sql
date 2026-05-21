alter table public.questions
  add column if not exists explanation text;

alter table public.test_results
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists total_questions integer not null default 0,
  add column if not exists correct_questions integer not null default 0,
  add column if not exists duration_seconds integer not null default 0,
  add column if not exists answers jsonb not null default '[]'::jsonb;

create index if not exists test_results_user_created_at_idx
  on public.test_results (user_id, created_at desc);

create index if not exists test_results_answers_gin_idx
  on public.test_results using gin (answers);
