// tools/fixture.js — the "long-time user" fixture for audits and tests: a device that has used the app for months.
// Writes test/fixtures/longtime.json: the device meta (registry of four lists, hints seen, version seen, a theme of
// its own in the Day slot) and four documents — Work (80 lines in 6 sections, notes, six repeating lines, two Not
// today, 90 days of history, two saved themes that are partners, a template), Home (12 lines), Trip (shared with this
// device, nicknamed), Old (archived). Timestamps are stored relative to `generatedAt`; tools/audit/harness.mjs shifts
// them to the moment the fixture is loaded, so "done today" is today and the history ends yesterday whenever it runs.
// Run: node tools/fixture.js   (deterministic: a seeded generator, so the file only changes when this script does)
import fs from "node:fs";
import * as M from "../model.js";
import * as T from "../theme.js";

let seed = 20260905;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const B62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const id = (n = 10) => { let s = ""; for (let i = 0; i < n; i++) s += B62[Math.floor(rnd() * 62)]; return s; };
const pick = a => a[Math.floor(rnd() * a.length)];
const NOW = Date.UTC(2026, 8, 5, 19, 0, 0); // the moment the fixture was generated; the harness shifts everything from here
const H = 3600 * 1000, D = 24 * H;
const STEP = 1024;

const SECTIONS = ["Calls", "Writing", "Errands", "Money", "House", "Someday"];
const LINES = {
  "": ["Reply to Dana about the closing date", "Book the dentist", "Return the library books", "Find the warranty for the dishwasher", "Cancel the trial before Friday", "Pick a date for the reunion"],
  Calls: ["Call the bank before noon", "Call Mom", "Ring the plumber about the drip", "Call the school office", "Chase the insurance adjuster", "Call Sam back", "Phone the vet for Biscuit's shots", "Call the county about the permit", "Confirm the caterer", "Check in with Luis", "Call the landlord", "Ring the pharmacy", "Ask Priya about the deck"],
  Writing: ["Draft the memo on the lease", "Outline the talk for Thursday", "Edit chapter three", "Write the thank-you notes", "Send the draft to Sam", "Notes from the site visit", "Update the résumé", "Finish the grant paragraph", "Reply to the reviewer", "Write up the interview", "Fix the footnotes", "Blog post: the porch", "Journal"],
  Errands: ["Groceries", "Drop off the dry cleaning", "Post the package to Erin", "Hardware store: hinges", "Refill the prescription", "Pick up the frames", "Get stamps", "Oil change", "Buy a birthday card for Tom", "Return the shoes", "Farmers market", "Batteries for the smoke alarm", "Take the recycling"],
  Money: ["Pay the water bill", "Move money to savings", "File the expense report", "Check the credit card statement", "Renew the car registration", "Set up the 529", "Pay the property tax", "Cancel the unused subscription", "Update the budget sheet", "Call about the refund", "Pay Marta", "Order checks", "Review the retirement mix"],
  House: ["Water the plants", "Fix the gate latch", "Clean the gutters", "Change the furnace filter", "Vacuum upstairs", "Wash the windows", "Sort the garage", "Hang the mirror", "Patch the wall by the stairs", "Replace the porch bulb", "Mow", "Descale the kettle", "Flip the mattress"],
  Someday: ["Learn to make bread", "Plan the Utah trip", "Read the Didion collection", "Try the new Thai place", "Build a workbench", "Go see the meteor shower", "Sort the photos from 2019", "Take a pottery class", "Visit Aunt June", "Kayak the lake", "Repaint the bedroom", "Start a garden journal", "Look into solar"]
};
const NOTES = ["Ask for Maria in accounts", "Before 5, they close early on Fridays", "The blue folder on the desk", "Second try; first one bounced", "Use the code from the email", "Take the receipt", "Their number is on the fridge", "Sam prefers the morning"];

function doc(W, name, spec) {
  const d = M.emptyDoc(W, name); d.nameAt = NOW - 120 * D; d.updatedAt = NOW - H;
  const secIds = {};
  spec.sections.forEach((s, i) => { const sid = id(); secIds[s] = sid; d.sections[sid] = { id: sid, name: s, order: (i + 1) * STEP, updatedAt: NOW - 100 * D }; });
  let todayN = 0;
  for (const [sec, lines] of Object.entries(spec.lines)) {
    lines.forEach((text, i) => {
      const iid = id(); const onToday = spec.today.includes(text); const done = spec.doneToday.includes(text);
      d.items[iid] = { id: iid, sectionId: sec ? secIds[sec] : "", text, note: spec.notes && spec.notes.includes(text) ? pick(NOTES) : "", done, doneAt: done ? NOW - 2 * H + i * 60000 : 0, today: onToday, order: (i + 1) * STEP, todayOrder: onToday ? (++todayN) * STEP : (i + 1) * STEP, updatedAt: NOW - Math.floor(rnd() * 60) * D - i * 1000 };
    });
  }
  const byText = t => Object.values(d.items).find(i => i.text === t);
  for (const [text, kind, days] of spec.rules || []) { const it = byText(text); const rule = kind === "weekly" ? { kind, days } : kind === "monthly" ? { kind, day: 1 } : { kind }; Object.assign(d, M.setRule(d, it.id, rule, NOW - 30 * D, M.localDate(NOW - 30 * D))); if (it.today) d.rules[it.id] = { ...d.rules[it.id], placed: M.localDate(NOW) }; }
  for (const text of spec.notToday || []) { const it = byText(text); Object.assign(d, M.notToday(d, it.id, M.localDate(NOW), NOW - 3 * H)); }
  if (spec.template) { const sid = secIds[spec.template]; Object.assign(d, M.templateFromSection(d, sid, "Weekend " + spec.template.toLowerCase(), id(), NOW - 20 * D)); }
  if (spec.themes) {
    const a = T.derive({ accent: "#2F7F6F", base: "dark", pair: "manrope", name: "Slate green", pack: "kalimba" });
    const b = T.derive({ accent: "#2F7F6F", base: "light", pair: "manrope", name: "Slate green, day", pack: "kalimba" });
    const ia = id(), ib = id();
    d.themes[ia] = { id: ia, name: a.name, code: T.themeCode(a), partner: ib, updatedAt: NOW - 40 * D };
    d.themes[ib] = { id: ib, name: b.name, code: T.themeCode(b), partner: ia, updatedAt: NOW - 40 * D };
    spec.dayCode = T.themeCode(b); spec.nightCode = T.themeCode(a);
  }
  // history: `days` days back, a few entries each, from lines that read like real days; stored flat, the harness buckets by day
  const hist = [];
  const pool = Object.values(d.items).map(i => ({ id: i.id, text: i.text, section: M.sectionName(d, i.sectionId) }));
  for (let back = 1; back <= (spec.historyDays || 0); back++) { const n = 2 + Math.floor(rnd() * 5); for (let k = 0; k < n; k++) { const p = pick(pool); hist.push({ id: p.id, text: p.text, section: p.section, doneAt: NOW - back * D - Math.floor(rnd() * 12) * H }); } }
  d.historyEntries = hist; // flattened; the harness turns this into doc.history[day] at load
  return { doc: d, spec };
}

const W = { work: id(22), home: id(22), trip: id(22), old: id(22) };
const work = doc(W.work, "Work", {
  sections: SECTIONS, lines: LINES,
  today: ["Call the bank before noon", "Send the draft to Sam", "Groceries", "Pay the water bill", "Water the plants", "Journal", "Reply to Dana about the closing date"],
  doneToday: ["Call the bank before noon", "Water the plants"],
  notes: ["Call the bank before noon", "Draft the memo on the lease", "Send the draft to Sam", "Post the package to Erin", "Refill the prescription", "File the expense report", "Renew the car registration", "Fix the gate latch", "Clean the gutters", "Plan the Utah trip", "Reply to Dana about the closing date", "Confirm the caterer", "Hang the mirror", "Pay Marta", "Kayak the lake"],
  rules: [["Journal", "daily"], ["Water the plants", "daily"], ["Groceries", "weekly", [6]], ["Check in with Luis", "weekdays"], ["Vacuum upstairs", "weekly", [1, 4]], ["Pay the water bill", "monthly"]],
  notToday: ["Book the dentist", "Fix the gate latch"],
  template: "Errands", themes: true, historyDays: 90
});
const home = doc(W.home, "Home", { sections: ["Kitchen", "Garden"], lines: { "": ["Order the filter", "Call the electrician"], Kitchen: ["Sharpen the knives", "Clean the oven", "Restock the pantry", "Fix the drawer", "Buy a new kettle"], Garden: ["Plant the bulbs", "Fix the hose", "Weed the beds", "Trim the hedge", "Order mulch"] }, today: ["Order the filter", "Plant the bulbs", "Clean the oven"], doneToday: [], historyDays: 12 });
const trip = doc(W.trip, "Trip", { sections: [], lines: { "": ["Book the cabin", "Rent the car", "Pack the cooler", "Print the tickets", "Text the neighbours the dates", "Charge the camera"] }, today: ["Book the cabin", "Rent the car", "Pack the cooler"], doneToday: ["Book the cabin"], historyDays: 3 });
const old = doc(W.old, "Old", { sections: [], lines: { "": ["Move the boxes", "Return the keys", "Forward the mail", "Close the account", "Say goodbye to the neighbours"] }, today: [], doneToday: [], historyDays: 0 });

const meta = {
  device: { id: id(12), seenVersion: "1.5", tourDone: true, hints: { today: true, drag: true, menu: true }, volume: 0.8, day: work.spec.dayCode, night: work.spec.nightCode, installHint: true, silentHint: true },
  lists: [
    { id: W.work, mode: "edit", name: "Work", addedAt: NOW - 120 * D, fresh: false, origin: "mine", created: true, linkSaved: true },
    { id: W.home, mode: "edit", name: "Home", addedAt: NOW - 90 * D, fresh: false, origin: "mine", created: true, linkSaved: true },
    { id: W.trip, mode: "edit", name: "Trip", addedAt: NOW - 10 * D, fresh: false, origin: "shared", nickname: "Sam's trip", created: true, linkSaved: true },
    { id: W.old, mode: "edit", name: "Old", addedAt: NOW - 200 * D, fresh: false, origin: "mine", created: true, linkSaved: true, archived: true }
  ],
  current: W.work, currentMode: "edit", migrations: [], pendingKill: [], dead: []
};
const out = { generatedAt: NOW, note: "See tools/fixture.js. Times are relative to generatedAt; tools/audit/harness.mjs shifts them to load time and buckets historyEntries into history by local day.", meta, lists: {} };
for (const l of [work, home, trip, old]) out.lists[l.doc.id] = { doc: l.doc, rev: 0, dirty: true, created: true, mode: "edit", savedAt: NOW - H };
// sanity: every document normalizes to itself apart from the flattened history
for (const l of [work, home, trip, old]) { const { historyEntries, ...plain } = l.doc; const n = M.normalize(plain, l.doc.id); if (Object.keys(n.items).length !== Object.keys(plain.items).length) throw new Error("normalize dropped items of " + l.doc.name); }
fs.writeFileSync(new URL("../test/fixtures/longtime.json", import.meta.url), JSON.stringify(out));
const counts = [work, home, trip, old].map(l => `${l.doc.name}: ${Object.keys(l.doc.items).length} lines, ${Object.keys(l.doc.sections).length} sections, ${Object.keys(l.doc.rules).length} rules, ${Object.keys(l.doc.returns).length} returns, ${l.doc.historyEntries.length} history entries, ${Object.keys(l.doc.themes).length} themes, ${Object.keys(l.doc.templates).length} templates`);
console.log("test/fixtures/longtime.json written:\n  " + counts.join("\n  "));
