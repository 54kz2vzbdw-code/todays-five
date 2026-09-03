# Setup — the manual steps

The Supabase project is created, the schema is in, and `config.js` carries the project URL and publishable key. Real sync was tested against it (two devices, offline edits on both, reconnect, rotate). What is left is on the phone.

1. On the Mac, open https://54kz2vzbdw-code.github.io/todays-five/. If this browser had the old Today's Five, your list is migrated automatically; otherwise click **Start a new list**. Within a few seconds the small dot in the rail turns solid (hover it: "Synced").
2. Click **⋯ → Open on phone**. Point the iPhone camera at the QR code and tap the banner; Safari opens the list.
3. In Safari tap **Share → Add to Home Screen → Add**. Open it from the Home Screen from now on: the icon carries the secret link, and the installed app has its own storage.
4. Optional, on the Mac: in Chrome click the install icon at the right end of the address bar (or **⋮ → Cast, save, and share → Install page as app**) to get a chromeless window.
5. Keep in mind: a free Supabase project **pauses after 7 days without database activity**. Opening the app on either device counts, so normal use keeps it alive; a two-week holiday will pause it. If the rail dot turns red ("Sync trouble"), go to https://supabase.com/dashboard, open the organization, click the paused `todays-five` card, click **Resume project**, confirm, and wait a couple of minutes. Nothing is lost.
6. Leave **Project Settings → Realtime → Allow public access to channels** at its default (Enabled). Turning it off silently stops the live updates between devices; the 60-second safety-net poll still works.
7. If a link ever leaks: **⋯ → Open on phone → Rotate link** on the Mac, then re-add the new link to the phone's Home Screen (the old icon keeps pointing at the dead link until you paste the new one).
