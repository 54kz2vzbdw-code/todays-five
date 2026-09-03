// Supabase connection. Both values are safe to publish: the key can only call the three RPCs in
// supabase/schema.sql, and every one of them needs the exact, unguessable list id.
//
// url:  the project URL
// key:  the "publishable" key (starts with sb_publishable_). A legacy "anon" key (starts with eyJ) works too.
//
// Leave both empty and the app runs in local-only mode ("Sync off — finish setup").

export default {
  url: "https://xyfjxdbwhysbaltcwvcx.supabase.co",
  key: "sb_publishable_1YSlOSI8FfxJuhbj_2555w_IzXaWa8v"
};
