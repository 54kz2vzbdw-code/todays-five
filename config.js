// Supabase connection. Fill both values in after following SETUP.md, then commit and push.
// Both are safe to publish: the key can only call the three RPCs in supabase/schema.sql,
// and every one of them needs the exact, unguessable list id.
//
// url:  your project URL, e.g. "https://abcdefghijklmnop.supabase.co"
// key:  the "publishable" key (starts with sb_publishable_). A legacy "anon" key (starts with eyJ) works too.
//
// Leave both empty and the app runs in local-only mode ("Sync off — finish setup").

export default {
  url: "",
  key: ""
};
