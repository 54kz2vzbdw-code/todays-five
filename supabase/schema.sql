-- Today's Five v2 — Supabase schema. Paste the whole file into the SQL Editor and run it once.
--
-- Security model: the list id is the secret. The table is never readable through the
-- REST API (row level security on, no policies, no grants). The only way in is the three
-- SECURITY DEFINER functions below, each of which requires the exact id.

create table if not exists public.lists (
  id         text primary key,
  doc        jsonb not null,
  rev        bigint not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.lists enable row level security;
revoke all on table public.lists from public, anon, authenticated;

-- Read one list by id. Returns null when it does not exist.
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

-- Upsert with optimistic concurrency. p_base_rev is the rev the caller last saw
-- (0 for a list that has never been saved). Returns {ok:true, rev} on success or
-- {ok:false, rev, doc} when the caller's base is stale, so it can merge and retry.
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
    raise exception 'doc too large' using errcode = '22023';
  end if;

  select doc, rev into cur from public.lists where id = p_id for update;

  if not found then
    if coalesce(p_base_rev, 0) <> 0 then
      -- caller thinks the list exists but it is gone (rotated or deleted): do not recreate it
      return jsonb_build_object('ok', false, 'rev', 0, 'doc', null);
    end if;
    insert into public.lists (id, doc, rev) values (p_id, p_doc, 1);
    return jsonb_build_object('ok', true, 'rev', 1);
  end if;

  if cur.rev <> coalesce(p_base_rev, -1) then
    return jsonb_build_object('ok', false, 'rev', cur.rev, 'doc', cur.doc);
  end if;

  new_rev := cur.rev + 1;
  update public.lists set doc = p_doc, rev = new_rev, updated_at = now() where id = p_id;
  return jsonb_build_object('ok', true, 'rev', new_rev);
end
$$;

-- Delete a list. Used by "Rotate link" so the old id stops working.
create or replace function public.delete_list(p_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_id is null or p_id !~ '^[0-9A-Za-z]{22,64}$' then
    raise exception 'bad id' using errcode = '22023';
  end if;
  delete from public.lists where id = p_id;
  return found;
end
$$;

-- Only the API roles may call the functions; nobody else. (New Supabase projects no longer expose
-- functions automatically, so these grants are what makes the RPCs reachable at all.)
revoke all on function public.get_list(text) from public;
revoke all on function public.put_list(text, jsonb, bigint) from public;
revoke all on function public.delete_list(text) from public;
grant execute on function public.get_list(text) to anon, authenticated;
grant execute on function public.put_list(text, jsonb, bigint) to anon, authenticated;
grant execute on function public.delete_list(text) to anon, authenticated;

-- Tell the API layer to pick the new functions up right away (otherwise the first call can 404 for a minute).
notify pgrst, 'reload schema';

-- Sanity check you can run afterwards (should return one row with ok = true):
-- select public.put_list('CheckCheckCheckCheck00', '{"v":2}'::jsonb, 0) ->> 'ok' as ok;
-- select public.delete_list('CheckCheckCheckCheck00');
