create extension if not exists pgcrypto;

create table if not exists public.auth_invites (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  label text,
  max_uses integer not null default 1 check (max_uses > 0),
  uses integer not null default 0 check (uses >= 0),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.auth_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.auth_users(id) on delete cascade,
  token_hash text not null unique,
  user_agent_hint text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'auth_invites_used_by_fkey'
  ) then
    alter table public.auth_invites
      add constraint auth_invites_used_by_fkey
      foreign key (used_by) references public.auth_users(id) on delete set null;
  end if;
end $$;

create index if not exists auth_invites_code_hash_idx on public.auth_invites(code_hash);
create index if not exists auth_users_email_idx on public.auth_users(email);
create index if not exists auth_sessions_token_hash_idx on public.auth_sessions(token_hash);
create index if not exists auth_sessions_user_id_idx on public.auth_sessions(user_id);

alter table public.auth_invites enable row level security;
alter table public.auth_users enable row level security;
alter table public.auth_sessions enable row level security;

-- Sem policies públicas: apenas as funções do Vercel usam a service role key.
