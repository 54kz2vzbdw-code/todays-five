-- Today's Five v3 — 002: end-to-end encryption, write tokens, caps, rate limit, reaping. Paste once into the SQL Editor (Checkpoint 1).
--
-- Additive and idempotent: the live v2 app keeps working until v3 deploys (its three RPCs keep their
-- signatures), and running this file twice changes nothing. What it adds:
--   * lists.token_hash  — sha256 of the write token, set when a v3 list is created; null marks a legacy v2 row
--   * lists.last_seen   — for reaping lists nobody has read or written in 12 months
--   * get_list_v3 / put_list_v3 / delete_list_v3 — the v3 RPCs (token-checked writes, unchanged-rev polling)
--   * schema private     — salted-hash create log for the per-IP rate limit, state row, reaper
--   * pg_cron daily reap if the extension is available (the RPCs also reap opportunistically once a day)
-- Design and limits: PLAN.md, "Today's Five v3 — plan".

-- ---------------------------------------------------------------- table

create table if not exists public.lists (
  id         text primary key,
  doc        jsonb not null,
  rev        bigint not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.lists add column if not exists token_hash text;
alter table public.lists add column if not exists last_seen timestamptz not null default now();
create index if not exists lists_last_seen_idx on public.lists (last_seen);

alter table public.lists enable row level security;
revoke all on table public.lists from public, anon, authenticated;

-- ---------------------------------------------------------------- private schema: limits and state

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.state (
  k text primary key,
  v text not null
);
create table if not exists private.creates (
  ip_hash text not null,
  at      timestamptz not null default now()
);
create index if not exists creates_at_idx on private.creates (at);
create index if not exists creates_ip_at_idx on private.creates (ip_hash, at);
revoke all on table private.state, private.creates from public, anon, authenticated;

-- a random salt, generated once; the log stores sha256(salt || ip), never the address
insert into private.state (k, v)
  values ('ip_salt', gen_random_uuid()::text || gen_random_uuid()::text)
  on conflict (k) do nothing;
insert into private.state (k, v) values ('last_reap', '1970-01-01T00:00:00Z') on conflict (k) do nothing;

-- Limits. Worst case 2400 rows × 96 KB = 230 MB, under half of the 500 MB free database.
create or replace function private.limits()
returns table (max_rows int, max_doc_bytes int, creates_per_hour int, creates_per_day int, reap_after interval)
language sql immutable
set search_path = ''
as $$ select 2400, 98304, 12, 40, interval '12 months' $$;
revoke all on function private.limits() from public;

-- The caller's address as PostgREST passes it (Cloudflare first, then the first x-forwarded-for hop). Null when absent.
create or replace function private.client_ip()
returns text
language plpgsql stable
set search_path = ''
as $$
declare
  h jsonb;
  ip text;
begin
  begin
    h := current_setting('request.headers', true)::jsonb;
  exception when others then
    h := null;
  end;
  if h is null then return null; end if;
  ip := coalesce(nullif(trim(h->>'cf-connecting-ip'), ''), nullif(trim(split_part(coalesce(h->>'x-forwarded-for', ''), ',', 1)), ''), nullif(trim(h->>'x-real-ip'), ''));
  return ip;
end
$$;
revoke all on function private.client_ip() from public;

-- Delete lists idle for 12 months and rate-limit rows older than 24 h.
create or replace function private.reap()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
begin
  delete from public.lists where last_seen < now() - (select reap_after from private.limits());
  get diagnostics n = row_count;
  delete from private.creates where at < now() - interval '24 hours';
  update private.state set v = to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') where k = 'last_reap';
  return n;
end
$$;
revoke all on function private.reap() from public;

-- Run the reaper at most once a day, from whichever RPC happens to be called first.
create or replace function private.maybe_reap()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  last text;
begin
  select v into last from private.state where k = 'last_reap';
  if last is null or last::timestamptz < now() - interval '1 day' then
    perform private.reap();
  end if;
exception when others then
  null; -- never let housekeeping break a user's request
end
$$;
revoke all on function private.maybe_reap() from public;

-- Count a create against the caller's address; raise 429 over the limit, 507 when the table is full.
create or replace function private.check_create()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  ip text;
  h text;
  salt text;
  n_hour int;
  n_day int;
  mult int := 1;
  l record;
begin
  select * into l from private.limits();
  if (select count(*) from public.lists) >= l.max_rows then
    raise exception 'The service is full. Nothing was saved to the server; your list stays on this device.' using errcode = 'PT507';
  end if;
  ip := private.client_ip();
  if ip is null then ip := 'unknown'; mult := 10; end if; -- no address header: one shared bucket, wider limits
  select v into salt from private.state where k = 'ip_salt';
  h := encode(sha256(convert_to(coalesce(salt, '') || '|' || ip, 'UTF8')), 'hex');
  delete from private.creates where at < now() - interval '24 hours';
  select count(*) into n_day from private.creates where ip_hash = h;
  select count(*) into n_hour from private.creates where ip_hash = h and at > now() - interval '1 hour';
  if n_hour >= l.creates_per_hour * mult or n_day >= l.creates_per_day * mult then
    raise exception 'Too many new lists from this network. Try again in a few minutes.' using errcode = 'PT429';
  end if;
  insert into private.creates (ip_hash, at) values (h, now());
end
$$;
revoke all on function private.check_create() from public;

create or replace function private.token_hash(p_token text)
returns text
language sql immutable
set search_path = ''
as $$ select encode(sha256(convert_to(p_token, 'UTF8')), 'hex') $$;
revoke all on function private.token_hash(text) from public;

-- ---------------------------------------------------------------- v3 RPCs

-- Read. p_rev is the revision the caller already has: when nothing changed the answer is {unchanged:true, rev}
-- (bytes, not the document). Touches last_seen at most once a day per row.
create or replace function public.get_list_v3(p_id text, p_rev bigint default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  if p_id is null or p_id !~ '^[0-9A-Za-z]{22,64}$' then
    raise exception 'bad id' using errcode = 'PT400';
  end if;
  select doc, rev, last_seen into r from public.lists where id = p_id;
  if not found then
    return null;
  end if;
  if r.last_seen < now() - interval '1 day' then
    update public.lists set last_seen = now() where id = p_id;
    perform private.maybe_reap();
  end if;
  if p_rev is not null and r.rev = p_rev then
    return jsonb_build_object('unchanged', true, 'rev', r.rev);
  end if;
  return jsonb_build_object('doc', r.doc, 'rev', r.rev);
end
$$;

-- Write with optimistic concurrency. p_doc must be an encrypted envelope; p_token is the write token,
-- hashed and stored on create, required to match afterwards. Returns {ok:true, rev} or {ok:false, rev, doc}
-- (stale base → merge client-side and retry). Never recreates a row that was deleted (rotated).
create or replace function public.put_list_v3(p_id text, p_doc jsonb, p_base_rev bigint, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  cur record;
  new_rev bigint;
  l record;
begin
  if p_id is null or p_id !~ '^[0-9A-Za-z]{22,64}$' then
    raise exception 'bad id' using errcode = 'PT400';
  end if;
  if p_token is null or p_token !~ '^[0-9A-Za-z_-]{43}$' then
    raise exception 'bad token' using errcode = 'PT400';
  end if;
  if p_doc is null or jsonb_typeof(p_doc) <> 'object' or not (p_doc ? 'iv') or not (p_doc ? 'ct') or jsonb_typeof(p_doc->'ct') <> 'string' then
    raise exception 'bad doc' using errcode = 'PT400';
  end if;
  select * into l from private.limits();
  if octet_length(p_doc::text) > l.max_doc_bytes then
    raise exception 'This list is too large to sync.' using errcode = 'PT413';
  end if;

  select doc, rev, token_hash into cur from public.lists where id = p_id for update;

  if not found then
    if coalesce(p_base_rev, 0) <> 0 then
      return jsonb_build_object('ok', false, 'rev', 0, 'doc', null);
    end if;
    perform private.check_create();
    perform private.maybe_reap();
    insert into public.lists (id, doc, rev, token_hash, last_seen) values (p_id, p_doc, 1, private.token_hash(p_token), now());
    return jsonb_build_object('ok', true, 'rev', 1);
  end if;

  if cur.token_hash is null or cur.token_hash <> private.token_hash(p_token) then
    raise exception 'This link can only view the list.' using errcode = 'PT403';
  end if;
  if cur.rev <> coalesce(p_base_rev, -1) then
    return jsonb_build_object('ok', false, 'rev', cur.rev, 'doc', cur.doc);
  end if;

  new_rev := cur.rev + 1;
  update public.lists set doc = p_doc, rev = new_rev, updated_at = now(), last_seen = now() where id = p_id;
  return jsonb_build_object('ok', true, 'rev', new_rev);
end
$$;

-- Delete (Rotate, and retiring a migrated v2 row). A row with a token needs that token; a legacy
-- plaintext row (token_hash null) may be deleted by id alone, exactly as v2 allowed.
create or replace function public.delete_list_v3(p_id text, p_token text default null)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  cur record;
begin
  if p_id is null or p_id !~ '^[0-9A-Za-z]{22,64}$' then
    raise exception 'bad id' using errcode = 'PT400';
  end if;
  select token_hash into cur from public.lists where id = p_id for update;
  if not found then
    return false;
  end if;
  if cur.token_hash is not null and (p_token is null or cur.token_hash <> private.token_hash(p_token)) then
    raise exception 'This link can only view the list.' using errcode = 'PT403';
  end if;
  delete from public.lists where id = p_id;
  return true;
end
$$;

-- ---------------------------------------------------------------- v2 RPCs, kept until the v3 deploy (003 drops them)
-- Same signatures as schema.sql; the only change is that they refuse to touch rows that carry a token.

create or replace function public.get_list(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  if p_id is null or p_id !~ '^[0-9A-Za-z]{22,64}$' then
    raise exception 'bad id' using errcode = '22023';
  end if;
  select doc, rev into r from public.lists where id = p_id;
  if not found then
    return null;
  end if;
  return jsonb_build_object('doc', r.doc, 'rev', r.rev);
end
$$;

create or replace function public.put_list(p_id text, p_doc jsonb, p_base_rev bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  cur record;
  new_rev bigint;
begin
  if p_id is null or p_id !~ '^[0-9A-Za-z]{22,64}$' then
    raise exception 'bad id' using errcode = '22023';
  end if;
  if p_doc is null or jsonb_typeof(p_doc) <> 'object' then
    raise exception 'bad doc' using errcode = '22023';
  end if;
  if octet_length(p_doc::text) > 262144 then
    raise exception 'doc too large' using errcode = 'PT413';
  end if;
  select doc, rev, token_hash into cur from public.lists where id = p_id for update;
  if not found then
    if coalesce(p_base_rev, 0) <> 0 then
      return jsonb_build_object('ok', false, 'rev', 0, 'doc', null);
    end if;
    perform private.check_create();
    insert into public.lists (id, doc, rev) values (p_id, p_doc, 1);
    return jsonb_build_object('ok', true, 'rev', 1);
  end if;
  if cur.token_hash is not null then
    raise exception 'forbidden' using errcode = 'PT403';
  end if;
  if cur.rev <> coalesce(p_base_rev, -1) then
    return jsonb_build_object('ok', false, 'rev', cur.rev, 'doc', cur.doc);
  end if;
  new_rev := cur.rev + 1;
  update public.lists set doc = p_doc, rev = new_rev, updated_at = now(), last_seen = now() where id = p_id;
  return jsonb_build_object('ok', true, 'rev', new_rev);
end
$$;

create or replace function public.delete_list(p_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  cur record;
begin
  if p_id is null or p_id !~ '^[0-9A-Za-z]{22,64}$' then
    raise exception 'bad id' using errcode = '22023';
  end if;
  select token_hash into cur from public.lists where id = p_id for update;
  if not found then
    return false;
  end if;
  if cur.token_hash is not null then
    raise exception 'forbidden' using errcode = 'PT403';
  end if;
  delete from public.lists where id = p_id;
  return true;
end
$$;

-- ---------------------------------------------------------------- grants

revoke all on function public.get_list_v3(text, bigint) from public;
revoke all on function public.put_list_v3(text, jsonb, bigint, text) from public;
revoke all on function public.delete_list_v3(text, text) from public;
grant execute on function public.get_list_v3(text, bigint) to anon, authenticated;
grant execute on function public.put_list_v3(text, jsonb, bigint, text) to anon, authenticated;
grant execute on function public.delete_list_v3(text, text) to anon, authenticated;

revoke all on function public.get_list(text) from public;
revoke all on function public.put_list(text, jsonb, bigint) from public;
revoke all on function public.delete_list(text) from public;
grant execute on function public.get_list(text) to anon, authenticated;
grant execute on function public.put_list(text, jsonb, bigint) to anon, authenticated;
grant execute on function public.delete_list(text) to anon, authenticated;

-- ---------------------------------------------------------------- daily reap with pg_cron, if the project allows it

do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    begin
      create extension if not exists pg_cron with schema pg_catalog;
    exception when others then
      raise notice 'pg_cron not available (%); the RPCs reap on their own once a day', sqlerrm;
    end;
  end;
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (select 1 from cron.job where jobname = 'todays-five-reap') then
      perform cron.unschedule('todays-five-reap');
    end if;
    perform cron.schedule('todays-five-reap', '17 4 * * *', 'select private.reap()');
    raise notice 'pg_cron: daily reap scheduled (04:17 UTC)';
  end if;
end
$$;

notify pgrst, 'reload schema';

-- Sanity check (should print one row: ok = true, then true):
--   select public.put_list_v3('CheckCheckCheckCheckCheckCheck00', '{"v":3,"alg":"A256GCM","iv":"AAAAAAAAAAAAAAAA","ct":"AA=="}'::jsonb, 0, 'tokentokentokentokentokentokentokentokentok') ->> 'ok' as ok;
--   select public.delete_list_v3('CheckCheckCheckCheckCheckCheck00', 'tokentokentokentokentokentokentokentokentok');
