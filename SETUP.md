# Setup — the manual steps

Until these are done the app runs in local-only mode and the rail shows "Sync off — finish setup".

1. Go to https://supabase.com/dashboard and sign in (GitHub sign-in is fine). Click **New project**.
2. Fill the form: **Organization** = your personal org · **Project name** = `todays-five` · **Database password** = click *Generate a password* and keep it somewhere (the app never needs it) · **Region** = the one nearest you · **Plan** = Free. Leave **Automatically expose new tables and functions** unchecked. Click **Create new project** and wait until the dashboard says the project is ready (about two minutes).
3. In the left sidebar open **SQL Editor**, click **New query**, paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run** (or press ⌘⏎). The result panel should say `Success. No rows returned`.
4. Get the two values the app needs. Click **Connect** in the top bar of the project dashboard; it shows the **Project URL** (`https://xxxxxxxxxxxx.supabase.co`) and the **publishable key** (a short string starting with `sb_publishable_`). They are also under **Project Settings → API Keys → Publishable and secret API keys** (key) and **Project Settings → Data API** (URL). Never copy a key that starts with `sb_secret_`.
5. Open [`config.js`](config.js) in the repo and put the two values in:
   ```js
   export default {
     url: "https://xxxxxxxxxxxx.supabase.co",
     key: "sb_publishable_…"
   };
   ```
6. Commit and push to `main`:
   ```bash
   git add config.js && git commit -m "Connect Supabase" && git push
   ```
   GitHub Pages redeploys in about a minute.
7. Open https://54kz2vzbdw-code.github.io/todays-five/ on the Mac. Within a few seconds the small dot in the rail turns solid (hover it: "Synced") and your list is uploaded under its secret link.
8. On the iPhone: on the Mac click **⋯ → Open on phone**, point the iPhone camera at the QR code and tap the banner. Safari opens the list. Tap **Share → Add to Home Screen → Add**. Open it from the Home Screen from now on; the icon carries the secret link, and the installed app has its own storage.
9. Keep in mind: a free Supabase project **pauses after 7 days without database activity**. Opening the app on either device counts as activity, so normal use keeps it alive; a two-week holiday will pause it. If the rail dot turns red ("Sync trouble") or the list stops syncing, go to https://supabase.com/dashboard, open the organization, click the paused `todays-five` card, click **Resume project**, confirm, and wait a couple of minutes. Nothing is lost; the data and settings come back as they were (a paused project can be restored for up to a year).
10. Leave **Project Settings → Realtime → Allow public access to channels** at its default (Enabled). Turning it off silently stops the live updates between devices; the 60-second safety-net poll still works.
