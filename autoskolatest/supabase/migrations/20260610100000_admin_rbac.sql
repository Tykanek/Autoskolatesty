create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.profiles
  add column if not exists role text not null default 'user';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('user', 'admin'));
  end if;
end;
$$;

insert into public.profiles (id, role)
select
  id,
  case
    when raw_app_meta_data ->> 'role' = 'admin' then 'admin'
    else 'user'
  end
from auth.users
on conflict (id) do nothing;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role)
  values (
    new.id,
    case
      when new.raw_app_meta_data ->> 'role' = 'admin' then 'admin'
      else 'user'
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.questions enable row level security;

drop policy if exists "Anyone can read questions" on public.questions;
create policy "Anyone can read questions"
  on public.questions
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert questions" on public.questions;
create policy "Admins can insert questions"
  on public.questions
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update questions" on public.questions;
create policy "Admins can update questions"
  on public.questions
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete questions" on public.questions;
create policy "Admins can delete questions"
  on public.questions
  for delete
  to authenticated
  using (public.is_admin());

alter table public.answers enable row level security;

drop policy if exists "Anyone can read answers" on public.answers;
create policy "Anyone can read answers"
  on public.answers
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert answers" on public.answers;
create policy "Admins can insert answers"
  on public.answers
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update answers" on public.answers;
create policy "Admins can update answers"
  on public.answers
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete answers" on public.answers;
create policy "Admins can delete answers"
  on public.answers
  for delete
  to authenticated
  using (public.is_admin());
