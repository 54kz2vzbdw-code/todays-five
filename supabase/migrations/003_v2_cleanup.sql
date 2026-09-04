-- Today's Five v3 — 003: retire v2. Paste once, AFTER v3 is live and every list of yours has been opened once in the new app (Checkpoint 2).
--
-- What it does: drops the three v2 RPCs, deletes any plaintext (v2) rows still on the server, and makes
-- the token mandatory so a plaintext row can never be created again. Idempotent. The app kept a local
-- copy of every list it migrated, and migrated lists already live in new encrypted rows, so the deleted
-- rows are leftovers only (for example a link that was never opened again).

drop function if exists public.get_list(text);
drop function if exists public.put_list(text, jsonb, bigint);
drop function if exists public.delete_list(text);

do $$
declare
  n int;
begin
  delete from public.lists where token_hash is null;
  get diagnostics n = row_count;
  raise notice 'plaintext v2 rows deleted: %', n;
end
$$;

alter table public.lists alter column token_hash set not null;

alter table public.lists drop constraint if exists lists_doc_is_envelope;
alter table public.lists add constraint lists_doc_is_envelope check (jsonb_typeof(doc) = 'object' and doc ? 'iv' and doc ? 'ct');

notify pgrst, 'reload schema';

-- What remains (all encrypted). envelopes = the lists themselves; table_on_disk = heap page + two indexes + TOAST +
-- free-space/visibility maps, which is 48–90 KB even for a single small row.
select count(*) as encrypted_lists,
       pg_size_pretty(coalesce(sum(octet_length(doc::text)), 0)) as envelopes,
       pg_size_pretty(pg_total_relation_size('public.lists')) as table_on_disk
  from public.lists;
