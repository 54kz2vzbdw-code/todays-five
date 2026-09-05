// version.js — the app version, Apple-style: a marketing version and a build number.
//   VERSION  semver for people: 1.0.x is a fix, 1.x a design or feature round, 2.0 a redesign. What shipped as 4.0.0
//            is 1.0; everything before it was pre-release (0.1, 0.2, 0.3). The what's-new toast fires when this string
//            changes, never on its order, so the renumbering fired it exactly once.
//   BUILD    the commit count on main at build time (`git rev-list --count main` after the merge; merge fast-forward
//            so the number written in the last commit is the count).
// Bump VERSION here, in sw.js (the cache name) and in whatsnew.json together, and BUILD here and in whatsnew.json;
// test/features.test.js checks the four agree.
export const VERSION = "1.1";
export const BUILD = 44;
export const VERSION_LABEL = VERSION + " (build " + BUILD + ")";
