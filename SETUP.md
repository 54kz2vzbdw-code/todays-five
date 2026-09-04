# Setup — the manual steps

The Supabase project exists, `config.js` carries its URL and publishable key, and v3 needs two pastes into the SQL Editor (Dashboard → SQL Editor → New query → paste → Run). Both files are idempotent: running one twice changes nothing.

## 1. Before deploying v3: `supabase/migrations/002_v3.sql` (done)

Adds the encrypted-list columns, the three v3 RPCs, the rate-limit schema and the reaper, and leaves the v2 RPCs in place so the live v2 app keeps working until v3 is deployed. Expected notices: "already exists, skipping" on a re-run, and either "pg_cron: daily reap scheduled" or "pg_cron not available" (both fine: the RPCs also reap on their own once a day).

## 2. Open your lists once in the new app

On the Mac, open https://54kz2vzbdw-code.github.io/todays-five/. Your v2 list is migrated automatically the first time it is opened: the app makes a new encrypted list under a new link, pushes it, retires the old plaintext row, and shows "Your link changed". Save the new link (copy, QR, or Share…).

Then re-add the phone:

1. Delete the old Today's Five icon from the iPhone Home Screen (it points at the dead link; opening it shows "This link no longer works").
2. On the Mac, ⋯ → Share & open on phone, and point the iPhone camera at the QR code. Safari opens the list.
3. In Safari tap Share → Add to Home Screen → Add.

A list that exists only on the phone (the stray one) migrates the same way the first time the Home Screen icon is opened; save its new link from the sheet, or open it from the Lists panel later. If the phone was offline at the time, the list is kept locally and pushed on the next open.

## 3. After the deploy and the migrations: `supabase/migrations/003_v2_cleanup.sql` (Checkpoint 2)

Drops the v2 RPCs, deletes any plaintext row still on the server, and makes the token mandatory. Run it once every list you care about has been opened in the new app (each migration shows the sheet). It prints the count of encrypted lists that remain.

## Things to know

- **Pause/resume.** A free Supabase project pauses after 7 days without database activity. Opening the app on any device counts, so normal use keeps it alive; a two-week holiday will pause it. If the rail dot turns red with "Sync trouble", go to https://supabase.com/dashboard, open the paused `todays-five` project, click **Resume project**, and wait a couple of minutes. Nothing is lost: every device keeps its own copy and pushes when the project is back.
- **Realtime.** Leave Project Settings → Realtime → "Allow public access to channels" at its default (Enabled). Turned off, the live updates stop silently; the safety-net poll (every 60 s when realtime is down) still syncs. The same happens if the free tier's 200 concurrent connections are all in use: the dot says "live updates paused" and the poll carries on.
- **If a link leaks.** ⋯ → Share → Rotate links. Both the edit link and the view link are replaced; every old link dies at once, including on your other devices, which then need the new link pasted (Lists → Paste a link) or re-added to the Home Screen.
- **If the project ever moves.** `config.js` holds the URL and key, and the Content-Security-Policy in `index.html` names the project host exactly; change both.
- **Rebuilding the vendored realtime client** or **re-downloading the fonts**: see `vendor/LICENSES.md` and `fonts/README.md`.
