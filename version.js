// version.js — VERSION is the marketing version (1.0.x a fix, 1.x a design or feature round, 2.0 a redesign; what
// shipped as 4.0.0 is 1.0), BUILD the commit count on main at build time. Bump VERSION with sw.js and whatsnew.json,
// BUILD with whatsnew.json; test/features.test.js checks they agree. The what's-new toast keys on VERSION changing.
export const VERSION = "1.1";
export const BUILD = 44;
export const VERSION_LABEL = VERSION + " (build " + BUILD + ")";
