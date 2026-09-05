// panels.js — everything that lives behind a panel: the theme picker (one slot at a time since 1.2), share and save
// sheets, Lists, History, Settings (Appearance: Day theme · Night theme · Switch), the section and line menus, the
// repeat picker, templates, move-to-list, delete everywhere with its undo, export/import, the ? reference, and How it
// works. Loaded by app.js on first use; `A` is its api.
let A = null, $ = null, $$ = null, M = null, T = null, C = null;

export function init(api) {
  if (A) return;
  A = api; $ = api.$; $$ = api.$$; M = api.M; T = api.T; C = api.C;
  wireTheme(); wireShare(); wireSave(); wireLists(); wireSettings(); wireSection(); wireLine(); wireRepeat(); wireKeys(); wireMisc();
}
const dev = () => A.dev, meta = () => A.meta;

/* ---------------- the theme picker: one slot at a time (1.2) ----------------
   Opened from Settings → Appearance's Day theme or Night theme row (or ⋯ → Theme → Appearance). Every theme is on
   offer for either slot: the curated kits grouped by their lean, then the list's saved ones; picking one names its
   partner for the other slot as a one-tap chip. The builder below fills the same slot, and can make a partner. */
let custom = { accent: "#D26128", base: "dark", pair: "", name: "", pack: "" };
let keepPreview = false;
let pickSlot = "day"; // the slot the picker fills
let offer = null;     // { code, name, slot }: the partner on offer for the other slot after a choice, if any
const cap = s => (s === "day" ? "Day" : "Night");
const otherSlot = s => (s === "day" ? "night" : "day");
export function openTheme(slot) {
  pickSlot = slot === "night" ? "night" : slot === "day" ? "day" : A.activeSlot();
  offer = null;
  const t = T.parseCode(A.slotCode(pickSlot));
  if (t && t.kind === "custom") custom = { accent: t.accent, base: t.base, pair: t.pair, name: t.name, pack: t.pack || "" };
  $("#p-theme-h").textContent = cap(pickSlot) + " theme";
  $("#c-use").textContent = "Use for " + cap(pickSlot);
  renderSwatches();
  paintCustom();
  A.showPanel("p-theme");
}
function savedThemes() { return Object.values(A.doc ? A.doc.themes : {}).filter(t => !t.deleted).map(t => ({ ...t, theme: T.parseCode(t.code) })).filter(t => t.theme); }
/** A saved theme's partner: the live saved record its `partner` field names (or the one naming it back). */
function savedPartner(saved, rec) {
  return saved.find(s => s.id !== rec.id && ((rec.partner && s.id === rec.partner) || (s.partner && s.partner === rec.id))) || null;
}
function renderSwatches() {
  const cur = A.slotCode(pickSlot);
  const saved = savedThemes();
  const mk = (t, rec) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "swatch";
    b.style.background = t.colors.ink; b.style.color = t.colors.text; b.style.borderColor = t.colors.hairSolid;
    const code = rec ? rec.code : T.themeCode(t), name = rec ? rec.name : t.name;
    b.setAttribute("aria-pressed", code === cur ? "true" : "false");
    const bar = document.createElement("span"); bar.className = "bar"; bar.style.background = t.colors.accent;
    const nm = document.createElement("span"); nm.className = "nm"; nm.textContent = name; nm.style.fontFamily = (T.pairOf(t.pair) || T.PAIRS.lato).task[2];
    const partner = rec ? savedPartner(saved, rec) : T.partnerOf(t);
    const pName = partner ? partner.name : "";
    const sm = document.createElement("span"); sm.className = "sm"; sm.style.color = t.colors.dim;
    sm.textContent = (rec ? "Yours" : cap(t.lean === "day" ? "day" : "night")) + (pName ? " · pairs with " + pName : "");
    b.append(bar, nm, sm);
    b.dataset.code = code;
    b.addEventListener("click", () => choose(code, name, partner ? { code: rec ? partner.code : T.themeCode(partner), name: pName } : null, b));
    if (rec && A.canEdit()) {
      const del = document.createElement("button"); del.type = "button"; del.className = "del"; del.textContent = "×"; del.setAttribute("aria-label", "Delete " + rec.name);
      del.addEventListener("click", e => { e.stopPropagation(); A.doc.themes[rec.id] = { id: rec.id, deleted: true, updatedAt: M.now() }; A.afterChange({ animate: false }); if (offer && offer.code === rec.code) offer = null; renderSwatches(); });
      b.appendChild(del);
    }
    return b;
  };
  const fill = (id, list) => { const root = $(id); root.innerHTML = ""; list.forEach(x => root.appendChild(x)); };
  fill("#sw-day", T.CURATED_DAY.map(t => mk(t)));
  fill("#sw-night", T.CURATED_NIGHT.map(t => mk(t)));
  fill("#sw-yours", saved.map(s => mk(s.theme, s)));
  $("#sw-yours-h").hidden = !saved.length; $("#sw-yours").hidden = !saved.length;
  paintOffer();
}
/** A swatch was chosen for the slot; the partner (if the other slot does not hold it already) goes on offer beside it. */
function choose(code, name, partner, swatch) {
  const group = swatch && swatch.parentNode; // read before the re-render detaches the swatch
  A.setSlotTheme(pickSlot, code);
  const other = otherSlot(pickSlot);
  offer = partner && A.slotCode(other) !== partner.code ? { ...partner, slot: other } : null;
  renderSwatches();
  if (group) group.after($("#partner-offer")); // the chip sits under the group the choice came from
  if (offer) { try { $("#partner-offer").scrollIntoView({ block: "nearest" }); } catch (e) { /* ignore */ } } // and on screen, on a phone too
  A.toast(`${name} for ${cap(pickSlot)}`);
}
function paintOffer() {
  const box = $("#partner-offer");
  if (!offer) { box.hidden = true; return; }
  $("#partner-use").textContent = `Use ${offer.name} for ${cap(offer.slot)}`;
  box.hidden = false;
}
function customTheme() { return T.derive({ accent: custom.accent, base: custom.base, pair: custom.pair || undefined, name: custom.name || "Custom", pack: custom.pack || undefined }); }
function paintCustom() {
  $("#c-color").value = custom.accent;
  if (document.activeElement !== $("#c-hex")) $("#c-hex").value = custom.accent;
  $("#c-dark").setAttribute("aria-pressed", custom.base === "dark" ? "true" : "false");
  $("#c-light").setAttribute("aria-pressed", custom.base === "light" ? "true" : "false");
  $("#c-pair").value = custom.pair || "";
  $("#c-pack").options[0].textContent = "Auto · " + T.PACK_NAMES[T.hueSound(custom.accent, custom.base)]; // what the hue rule picks today
  $("#c-pack").value = custom.pack || "";
  $("#c-name").value = custom.name;
  const t = customTheme(), c = t.colors, p = T.pairOf(t.pair) || T.PAIRS.lato;
  const pv = $("#c-preview");
  pv.style.background = c.ink; pv.style.color = c.text; pv.style.borderColor = c.hairSolid; pv.style.setProperty("--pv-accent", c.accent);
  pv.querySelectorAll(".pt").forEach(x => { x.style.fontFamily = p.task[2]; x.style.fontWeight = p.w; x.style.letterSpacing = p.ls; });
  pv.querySelector(".pt.done").style.color = c.done;
  const pm = pv.querySelector(".pm"); pm.style.fontFamily = p.ui[2]; pm.style.color = c.dim; pm.querySelector("b").style.color = c.accentText;
  const r = T.report(t);
  $("#c-contrast").textContent = `Contrast — text ${r.text.toFixed(1)}:1 · muted ${r.muted.toFixed(1)}:1 · accent ${r.accentText.toFixed(1)}:1 · fonts ${p.name}`;
}
function previewCustom() { T.applyTheme(customTheme(), document, { persist: false }); }
function setCustom(patch) { Object.assign(custom, patch); paintCustom(); previewCustom(); }
/** The builder's theme needs a name before it can be saved; ask for one unless it has it. */
async function ensureName() {
  if (custom.name.trim()) return true;
  keepPreview = true;
  const n = await A.ask({ title: "Name this theme", label: "Name", value: "" });
  keepPreview = false;
  if (!n || !n.trim()) { openTheme(pickSlot); previewCustom(); return false; }
  custom.name = n.trim().slice(0, 40);
  return true;
}
/** Save the builder's theme to the list (or find the record that already carries this exact code) and return the record. */
function saveCustom() {
  const t = customTheme(), code = T.themeCode(t);
  let rec = Object.values(A.doc.themes).find(r => !r.deleted && r.code === code);
  if (!rec) { const id = M.shortId(); rec = { id, name: custom.name.trim().slice(0, 40), code, updatedAt: M.now() }; A.doc.themes[id] = rec; }
  return rec;
}
function wireTheme() {
  const pairSel = $("#c-pair");
  T.CUSTOM_PAIRS.forEach(id => { const o = document.createElement("option"); o.value = id; o.textContent = T.PAIRS[id].name; pairSel.appendChild(o); });
  $("#partner-use").addEventListener("click", () => { if (!offer) return; const o = offer; offer = null; A.setSlotTheme(o.slot, o.code); renderSwatches(); A.toast(`${o.name} for ${cap(o.slot)}`); });
  $("#c-color").addEventListener("input", e => setCustom({ accent: T.normalizeHex(e.target.value) || custom.accent }));
  $("#c-hex").addEventListener("input", e => { const v = e.target.value.trim(); if (/^#?[0-9a-f]{6}$/i.test(v)) setCustom({ accent: T.normalizeHex(v) }); });
  $("#c-hex").addEventListener("change", e => { const h = T.normalizeHex(e.target.value); if (h) setCustom({ accent: h }); else e.target.value = custom.accent; });
  $("#c-dark").addEventListener("click", () => setCustom({ base: "dark" }));
  $("#c-light").addEventListener("click", () => setCustom({ base: "light" }));
  pairSel.addEventListener("change", e => setCustom({ pair: e.target.value }));
  const packSel = $("#c-pack");
  T.PACK_IDS.forEach(id => { const o = document.createElement("option"); o.value = id; o.textContent = T.PACK_NAMES[id]; packSel.appendChild(o); });
  packSel.addEventListener("change", e => { setCustom({ pack: e.target.value }); if (!dev().muted) A.sound.preview(customTheme().sound.engine); }); // preview on select
  $("#c-name").addEventListener("input", e => { custom.name = e.target.value; });
  $("#c-use").addEventListener("click", () => { offer = null; A.setSlotTheme(pickSlot, T.themeCode(customTheme())); renderSwatches(); A.toast(`${custom.name.trim() || "Custom"} for ${cap(pickSlot)}`); });
  $("#c-save").addEventListener("click", async () => {
    if (!A.doc) { A.toast("Open a list first to save a theme"); return; }
    if (!A.canEdit()) { A.toast("A view link can't save themes to the list"); return; }
    if (!(await ensureName())) return;
    const rec = saveCustom();
    A.afterChange({ animate: false });
    offer = null;
    A.setSlotTheme(pickSlot, rec.code); renderSwatches();
    A.toast(`Saved “${rec.name}”`);
  });
  // Make its partner: the same accent and sound pack on the flipped base, saved as a second theme linked to the first
  // (a `partner` field on both records), and offered for the other slot the way a curated partner is
  $("#c-partner").addEventListener("click", async () => {
    if (!A.doc) { A.toast("Open a list first to save a theme"); return; }
    if (!A.canEdit()) { A.toast("A view link can't save themes to the list"); return; }
    if (!(await ensureName())) return;
    const rec = saveCustom();
    const saved = savedThemes();
    let prec = savedPartner(saved, rec);
    if (!prec) {
      const p = T.makePartner({ accent: custom.accent, base: custom.base, pair: custom.pair, pack: custom.pack, name: custom.name.trim(), pairChosen: !!custom.pair });
      const pid = M.shortId();
      prec = { id: pid, name: p.name, code: T.themeCode(p), partner: rec.id, updatedAt: M.now() };
      A.doc.themes[pid] = prec;
      A.doc.themes[rec.id] = { ...rec, partner: pid, updatedAt: M.now() };
    }
    A.afterChange({ animate: false });
    A.setSlotTheme(pickSlot, rec.code);
    const other = otherSlot(pickSlot);
    offer = A.slotCode(other) !== prec.code ? { code: prec.code, name: prec.name, slot: other } : null;
    renderSwatches();
    $("#sw-yours").after($("#partner-offer"));
    A.toast(`Saved “${prec.name}”, its partner`);
  });
  $("#c-surprise").addEventListener("click", () => { const t = T.surprise(); custom = { accent: t.accent, base: t.base, pair: t.pair, name: "", pack: "" }; paintCustom(); previewCustom(); });
  $("#c-export").addEventListener("click", async () => { try { await navigator.clipboard.writeText(T.themeCode(customTheme())); A.toast("Theme code copied"); } catch (e) { A.toast(T.themeCode(customTheme())); } });
  $("#c-import-go").addEventListener("click", () => {
    const t = T.parseCode($("#c-import").value);
    if (!t) { A.toast("That code doesn't parse"); return; }
    if (t.kind === "custom") { custom = { accent: t.accent, base: t.base, pair: t.pair, name: t.name, pack: t.pack || "" }; paintCustom(); previewCustom(); }
    else choose(T.themeCode(t), t.name, T.partnerOf(t) ? { code: T.themeCode(T.partnerOf(t)), name: T.partnerOf(t).name } : null, null);
  });
  $("#p-theme").addEventListener("close", () => { if (!keepPreview) A.applyThemeCode(A.currentThemeCode()); });
  addEventListener("tf:theme", () => { if ($("#p-theme").open) renderSwatches(); if ($("#p-settings").open) paintSettings(); });
}

/* ---------------- share sheet ---------------- */
let shareKind = "edit";
export async function openShare() {
  if (!A.doc || !A.ref) return;
  if (!A.transport) { A.toast("Sync isn't set up, so a link would open an empty list somewhere else"); return; }
  shareKind = A.listMode === "view" ? "view" : "edit";
  $("#share-tab-edit").hidden = A.listMode === "view";
  $("#share-rotate").hidden = A.listMode === "view";
  $("#share-native").hidden = !navigator.share;
  await paintShare();
  A.showPanel("p-share");
}
async function paintShare() {
  const link = shareKind === "edit" ? A.editLink() : A.viewLink();
  $("#share-tab-edit").setAttribute("aria-selected", shareKind === "edit" ? "true" : "false");
  $("#share-tab-view").setAttribute("aria-selected", shareKind === "view" ? "true" : "false");
  const phone = A.sheetUi();
  $("#share-msg").textContent = shareKind === "edit"
    ? (phone ? "For your other devices, and for anyone who should be able to edit. Let them point a camera at the code, or send the link." : "For your other devices, and for anyone who should be able to edit. Point the phone's camera at it, or send yourself the link.")
    : "For anyone who should see the list but not touch it. They get live updates too.";
  $("#share-link").value = link;
  $("#share-rotate").textContent = "Rotate links";
  await A.drawQr($("#qr-c"), link);
}
function wireShare() {
  $("#share-tabs").addEventListener("click", e => { const b = e.target.closest("[data-kind]"); if (!b) return; shareKind = b.dataset.kind; paintShare(); });
  $("#share-copy").addEventListener("click", () => A.copyText($("#share-link").value, "Link copied"));
  $("#share-native").addEventListener("click", () => A.nativeShare($("#share-link").value));
  $("#share-rotate").addEventListener("click", async () => {
    A.closePanel();
    if (!A.canEdit()) return;
    if (A.syncStatus !== "synced") { A.toast("Rotate needs a live connection—try again once synced"); return; }
    const ok = await A.ask({ title: "Rotate links?", msg: "A new edit link and a new view link replace the current ones. Every old link dies everywhere at once—your other devices and anyone you gave a view link included. Open the new link there.", confirm: "Rotate", danger: true });
    if (!ok) return;
    await rotateLink();
  });
}
async function rotateLink() {
  const oldId = A.listId, oldRef = A.ref;
  const newId = M.newId();
  if (A.sync) await A.sync.flush();
  const copy = M.normalize(JSON.parse(JSON.stringify(A.doc)), newId);
  copy.updatedAt = M.now();
  A.saveLocal(newId, { doc: copy, rev: 0, dirty: true, created: true, mode: "edit" });
  const old = meta().lists.find(l => l.id === oldId);
  const e = A.registerList(newId, old ? old.name : "", "edit"); e.created = true; e.linkSaved = true; // the share sheet that follows shows the link
  meta().lists = meta().lists.filter(l => l.id !== oldId);
  meta().dead = Array.from(new Set([...(meta().dead || []), oldId]));
  meta().redirect = { ...(meta().redirect || {}), [oldId]: newId };
  await A.openList({ id: newId, mode: "edit" });
  // let the new list land, then kill the old one; if that fails, remember to retry
  if (A.sync) await A.sync.flush();
  A.removeLocal(oldId);
  const dead = await A.killRemote({ lookupId: oldRef.lookupId, token: oldRef.token });
  if (A.IOS && !A.STANDALONE) {
    // Safari memoised the manifest at load; reload so an Add to Home Screen now carries the new link
    sessionStorage.setItem("tf/reopenShare", "1");
    location.replace(A.BASE + A.SEARCH + "#/l/" + newId); location.reload();
    return;
  }
  A.toast(dead ? "New links ready—the old ones are dead" : "New links ready—old ones not revoked yet, will retry");
  openShare();
}

/* ---------------- save-your-link sheet ---------------- */
export function showSaveLink({ migrated = false } = {}) {
  const link = A.editLink(); if (!link) return;
  $("#save-title").textContent = migrated ? "Your link changed" : "Save your link";
  $("#save-msg").textContent = migrated
    ? "Your list is now encrypted on your device and lives behind this new link. The old link is dead. Save this one—it's the only way back, and the only key that can read the list."
    : "This link is the only way back to your list—and the only key that can read it. Nobody can send it to you again, not even the person running this site.";
  $("#save-hint-phone").hidden = !migrated;
  $("#save-hint-home").hidden = migrated;
  $("#save-native").hidden = !navigator.share;
  $("#save-link").value = link;
  A.drawQr($("#save-qr-c"), link).catch(() => {});
  A.showPanel("p-save");
  $("#save-body").focus({ preventScroll: true }); // reading starts at the title and the message, not at the link field
}
function wireSave() {
  $("#save-copy").addEventListener("click", () => A.copyText($("#save-link").value, "Link copied"));
  $("#save-native").addEventListener("click", () => A.nativeShare($("#save-link").value));
  $("#save-done").addEventListener("click", () => A.closePanel());
  $("#p-save").addEventListener("close", () => {
    const e = meta().lists.find(l => l.id === A.listId);
    if (e) { e.linkSaved = true; e.migrated = false; A.saveDevice(); }
  });
}

/* ---------------- lists ---------------- */
export function openLists({ removed = false } = {}) {
  const menu = $("#lists-menu"), rm = $("#lists-removed"); menu.innerHTML = ""; rm.innerHTML = "";
  const active = meta().lists.filter(l => !l.archived), archived = meta().lists.filter(l => l.archived);
  const mk = (l, arch) => {
    const b = document.createElement("button"); b.type = "button";
    const loc = A.loadLocal(l.id);
    const name = (loc && loc.doc.name) || l.name || "Untitled list";
    const tags = [l.mode === "view" ? "view-only" : ""].filter(Boolean).map(t => `<span class="sub">${t}</span>`).join(" ");
    b.innerHTML = `<span class="lb ${l.id === A.listId ? "cur" : ""}">${A.escapeHtml(name)} ${tags}</span><span class="id">${arch ? "Restore" : l.id.slice(0, 6) + "…"}</span>`;
    b.addEventListener("click", () => { A.closePanel(); if (arch) { l.archived = false; A.saveDevice(); A.toast("Back on this device"); } A.switchTo({ id: l.id, mode: l.mode === "view" ? "view" : "edit" }); });
    return b;
  };
  active.forEach(l => menu.appendChild(mk(l, false)));
  archived.forEach(l => rm.appendChild(mk(l, true)));
  $("#lists-removed-h").hidden = !archived.length; rm.hidden = !archived.length;
  $("#l-archive").hidden = !A.listId;
  $("#l-rename").hidden = !A.listId || A.listMode !== "edit";
  A.showPanel("p-lists");
  if (removed && archived.length) $("#lists-removed-h").scrollIntoView({ block: "start" });
}
function wireLists() {
  $("#l-new").addEventListener("click", async () => {
    A.closePanel();
    const name = await A.ask({ title: "New list", label: "Name", value: "" });
    if (name === null) return;
    const id = M.newId();
    A.createList(M.emptyDoc(id, (name || "").trim().slice(0, 60)), id);
  });
  $("#l-rename").addEventListener("click", async () => {
    A.closePanel();
    if (!A.canEdit()) return;
    const name = await A.ask({ title: "Rename list", label: "Name", value: A.doc.name || "" });
    if (name === null) return;
    A.doc.name = name.trim().slice(0, 60); A.doc.nameAt = M.now();
    const e = meta().lists.find(l => l.id === A.listId); if (e) e.name = A.doc.name;
    A.saveDevice();
    A.afterChange({ animate: false });
  });
  $("#l-archive").addEventListener("click", async () => {
    A.closePanel();
    const e = meta().lists.find(l => l.id === A.listId); if (!e) return;
    await A.flushQuick();
    e.archived = true; A.saveDevice();
    A.toast("Removed from this device. The server and your other devices still have it—Lists → Removed brings it back.");
    const next = meta().lists.find(l => !l.archived);
    if (next) A.switchTo({ id: next.id, mode: next.mode === "view" ? "view" : "edit" }); else A.showWelcome();
  });
  $("#l-paste-go").addEventListener("click", () => { const r = A.parseLink($("#l-paste").value); if (!r) { A.toast("That doesn't look like a list link"); return; } A.closePanel(); A.switchTo(r, { paste: true }); });
}

/* ---------------- history ---------------- */
export function openHistory() {
  const s = M.streak(A.doc);
  $("#history-streak").textContent = s ? `${s}-day streak` : "No streak yet";
  const root = $("#history-days"); root.innerHTML = "";
  const days = M.historyDays(A.doc).slice(0, 60);
  if (!days.length) { root.innerHTML = '<p>Nothing finished on a previous day yet. Finished lines move here at the start of the next day.</p>'; }
  for (const day of days) {
    const d = document.createElement("div"); d.className = "day";
    const h = document.createElement("h4"); h.textContent = new Date(day + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const ul = document.createElement("ul");
    for (const e of A.doc.history[day]) {
      const li = document.createElement("li");
      const t = document.createElement("span"); t.className = "t"; t.textContent = new Date(e.doneAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
      const x = document.createElement("span"); x.textContent = e.text + (e.section ? " · " + e.section : "");
      li.appendChild(t); li.appendChild(x); ul.appendChild(li);
    }
    d.appendChild(h); d.appendChild(ul); root.appendChild(d);
  }
  A.showPanel("p-history");
}

/* ---------------- settings ---------------- */
const PACKS = [["", "Theme's pick"], ["knock", "Knock"], ["bell", "Bell"], ["blip", "Blip"], ["typewriter", "Typewriter"], ["marble", "Marble"], ["pop", "Pop"]];
let importedDoc = null;
export function openSettings() { paintSettings(); A.showPanel("p-settings"); }
/** Appearance (1.2): Day theme · Night theme · Switch. The rows name what fills each slot and which one is on; the
    Switch row says how the flip happens and whether a tap on the sun or moon is holding an automation off. */
function paintAppearance(d) {
  const active = A.activeSlot(), auto = A.autoSlot(), sw = d.switch || {}, mode = sw.mode || "hand";
  const nameOf = slot => { const t = T.parseCode(A.slotCode(slot)); return t ? t.name : "Custom"; };
  $("#set-day-k").textContent = nameOf("day") + (active === "day" ? " · on" : "");
  $("#set-night-k").textContent = nameOf("night") + (active === "night" ? " · on" : "");
  $("#set-switch").value = mode;
  const hold = !!(d.holdAuto && auto && d.holdAuto === auto);
  const tap = A.touchUi() ? "A tap on the sun or moon" : "A tap on the sun or moon (or T)";
  $("#set-switch-sub").textContent = mode === "system"
    ? (hold ? `${cap(active)} by hand for now. The device's light or dark setting takes over when it next changes.` : `Follows the device's light or dark setting. ${tap} holds until it next changes.`)
    : mode === "schedule"
      ? (hold ? `${cap(active)} by hand for now. The schedule takes over at its next switch.` : `Day from ${sw.dayAt || "07:00"}, night from ${sw.nightAt || "19:00"}. ${tap} holds until the next switch.`)
      : (A.touchUi() ? "The sun and moon in the top bar flip it." : "The sun and moon in the top bar flip it, and so does T.");
  $("#schedule-block").hidden = mode !== "schedule";
  $("#sch-day-at").value = sw.dayAt || "07:00"; $("#sch-night-at").value = sw.nightAt || "19:00";
}
function paintSettings() {
  const d = dev(), set = (name, on) => { const b = $(`#p-settings [data-set="${name}"]`); if (b) b.setAttribute("aria-pressed", on ? "true" : "false"); };
  paintAppearance(d);
  set("sound", !d.muted);
  const pk = $("#set-pack"); if (!pk.options.length || pk.options.length !== PACKS.length) { pk.innerHTML = ""; PACKS.forEach(([v, n]) => { const o = document.createElement("option"); o.value = v; o.textContent = n; pk.appendChild(o); }); }
  // "Theme's pick" names the theme's pack, and the sub-line says which one wins on this device
  const themePack = A.theme ? (PACKS.find(p => p[0] === (A.theme.sound && A.theme.sound.engine))?.[1] || "Knock") : "";
  pk.options[0].textContent = themePack ? `Theme's pick (${themePack})` : "Theme's pick";
  pk.value = d.soundPack || "";
  const override = PACKS.find(p => p[0] === d.soundPack)?.[1];
  $("#set-pack-sub").textContent = !A.theme ? "Each theme picks its own" : override ? `${A.theme.name} picks ${themePack}; this device plays ${override}` : `${A.theme.name} picks ${themePack}, and that's what plays`;
  $("#volume").value = Math.round(d.volume * 100);
  set("celebrate", !!d.celebrateRemote);
  set("review", !!d.review);
  set("wake", !!d.wake); $('#p-settings [data-set="wake"]').hidden = !("wakeLock" in navigator);
  set("swipe", !d.swipeOff); $("#set-swipe").hidden = !A.touchUi();
  set("keys", !d.keysOff); $("#set-keys").hidden = A.touchUi();
  set("fade", !d.idleFadeOff); $("#set-fade").hidden = A.touchUi();
  const tpls = A.doc ? M.liveTemplates(A.doc).length : 0;
  $("#set-tpl-k").textContent = tpls ? String(tpls) : "";
  const removed = meta().lists.filter(l => l.archived).length;
  $("#set-removed-k").textContent = removed ? String(removed) : "";
  $("#streak-k").textContent = A.doc ? (s => s ? s + " day" + (s > 1 ? "s" : "") : "")(M.streak(A.doc)) : "";
  const W = A.ref && A.ref.mode === "edit" ? A.ref.W : null;
  $("#set-addurl").value = W ? M.addUrl(A.BASE, W) : "Open an edit link to get its URL";
  $("#set-addurl-copy").disabled = !W;
  set("who", !d.whoOff);
  $("#set-version").textContent = `Today's Five ${A.VERSION_LABEL}. What's new is on the About page.`;
}
function wireSettings() {
  const d = dev();
  $("#p-settings").addEventListener("click", async e => {
    const b = e.target.closest("[data-set]"); if (!b) return;
    const k = b.dataset.set;
    if (k === "day" || k === "night") { A.closePanel(); openTheme(k); }
    else if (k === "sound") { A.toggleMute(); paintSettings(); }
    else if (k === "celebrate") { d.celebrateRemote = !d.celebrateRemote; A.saveDevice(); paintSettings(); }
    else if (k === "review") { d.review = !d.review; A.saveDevice(); paintSettings(); A.paint(); }
    else if (k === "wake") { await A.setWake(!d.wake); paintSettings(); }
    else if (k === "swipe") { d.swipeOff = !d.swipeOff; A.saveDevice(); paintSettings(); }
    else if (k === "keys") { d.keysOff = !d.keysOff; A.saveDevice(); paintSettings(); A.toast(d.keysOff ? "Single-key shortcuts off (Cmd/Ctrl+Z, Esc and ⌥↑↓ still work)" : "Single-key shortcuts on"); }
    else if (k === "fade") { d.idleFadeOff = !d.idleFadeOff; A.saveDevice(); paintSettings(); A.idleReset(); }
    else if (k === "templates") { A.closePanel(); openTemplates(); }
    else if (k === "removed") { A.closePanel(); openLists({ removed: true }); }
    else if (k === "history") { A.closePanel(); openHistory(); }
    else if (k === "who") { d.whoOff = !d.whoOff; A.saveDevice(); A.resubscribePresence(); paintSettings(); }
    else if (k === "export") { A.closePanel(); openExport(); }
  });
  $("#set-switch").addEventListener("change", e => { A.setSwitchMode(e.target.value); paintSettings(); });
  const sch = () => { A.setSwitchTimes($("#sch-day-at").value, $("#sch-night-at").value); paintSettings(); };
  ["#sch-day-at", "#sch-night-at"].forEach(s => $(s).addEventListener("change", sch));
  $("#set-pack").addEventListener("change", e => { d.soundPack = e.target.value; A.saveDevice(); paintSettings(); const eng = e.target.value || (A.theme && A.theme.sound && A.theme.sound.engine) || "knock"; if (!d.muted) A.sound.preview(eng); });
  $("#set-addurl-copy").addEventListener("click", () => A.copyText($("#set-addurl").value, "URL copied. Put text after text= and open it."));
  $("#set-export-json").addEventListener("click", () => exportList("json"));
  $("#set-export-md").addEventListener("click", () => exportList("md"));
  $("#set-import-file").addEventListener("change", async e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    try {
      const { readFile } = await import("./exporter.js");
      importedDoc = M.importJSON(await readFile(f));
      $("#set-import-name").textContent = `${f.name}: ${Object.values(importedDoc.items).filter(i => !i.deleted).length} lines, ${M.liveSections(importedDoc).length} sections, ${M.historyDays(importedDoc).length} days of history${importedDoc.name ? ", named “" + importedDoc.name + "”" : ""}`;
    } catch (err) { importedDoc = null; $("#set-import-name").textContent = err.message || "That file couldn't be read."; }
    paintExport();
  });
  $("#set-import-new").addEventListener("click", () => {
    if (!importedDoc) return;
    const id = M.newId();
    const doc = M.normalize(importedDoc, id); doc.updatedAt = M.now();
    importedDoc = null; A.closePanel();
    A.createList(doc, id);
  });
  $("#set-import-merge").addEventListener("click", () => {
    if (!importedDoc || !A.canEdit()) return;
    const merged = M.normalize(M.merge(A.doc, importedDoc), A.listId);
    const before = Object.values(A.doc.items).filter(i => !i.deleted).length;
    A.doc = merged; A.afterChange({ animate: true });
    const after = Object.values(merged.items).filter(i => !i.deleted).length;
    importedDoc = null; A.closePanel();
    A.toast(`Merged: ${after - before} new line${after - before === 1 ? "" : "s"}`);
  });
  addEventListener("tf:settings", () => { if ($("#p-settings").open) paintSettings(); });
}
/* ---------------- export & import: Settings → Advanced → Export & import › ---------------- */
function paintExport() {
  $("#set-export-json").disabled = !A.doc; $("#set-export-md").disabled = !A.doc;
  $("#set-import-merge").disabled = !importedDoc || !A.canEdit(); $("#set-import-new").disabled = !importedDoc;
}
export function openExport() { paintExport(); A.showPanel("p-export"); }
async function exportList(kind) {
  if (!A.doc) return;
  const { handOff, filenameFor } = await import("./exporter.js");
  const json = kind === "json";
  const text = json ? M.exportJSON(A.doc) : M.exportMarkdown(A.doc);
  const res = await handOff({ text, filename: filenameFor(A.doc.name, json ? "json" : "md"), mime: json ? "application/json" : "text/markdown", ios: A.IOS });
  A.toast(res === "shared" ? "Handed to the share sheet" : res === "downloaded" ? "Downloaded" : res === "copied" ? "Copied to the clipboard" : res === "cancelled" ? "Export cancelled" : "Couldn't export—try copying instead");
}

/* ---------------- section menu ---------------- */
let secMenuId = null;
export function openSectionMenu(id) {
  secMenuId = id;
  const unsorted = id === "";
  for (const act of ["rename", "up", "down", "delete"]) $(`#p-sec [data-sact="${act}"]`).hidden = unsorted;
  const items = M.itemsInSection(A.doc, id).filter(i => !i.done);
  $('#p-sec [data-sact="today-on"]').hidden = !items.some(i => !i.today);
  $('#p-sec [data-sact="today-off"]').hidden = !items.some(i => i.today);
  $('#p-sec [data-sact="template"]').hidden = !items.length && !M.itemsInSection(A.doc, id).length;
  $('#p-sec [data-sact="insert"]').hidden = !M.liveTemplates(A.doc).length;
  $("#p-sec-h").textContent = unsorted ? "Unsorted" : M.sectionName(A.doc, id) || "Section";
  A.showPanel("p-sec", { anchor: $(`#all .sec[data-id="${CSS.escape(id)}"] .sec-more`) });
}
function wireSection() { $("#p-sec").addEventListener("click", e => { const b = e.target.closest("[data-sact]"); if (b) sectionAction(b.dataset.sact); }); }
async function sectionAction(act) {
  if (!A.canEdit()) return;
  const id = secMenuId, s = A.doc.sections[id];
  if (id !== "" && (!s || s.deleted)) return;
  A.closePanel();
  if (act === "rename") {
    const name = await A.ask({ title: "Rename section", label: "Name", value: s.name });
    const live = A.doc && A.doc.sections[s.id]; if (!live || live.deleted) return; // a remote change may have replaced the doc meanwhile
    if (name && name.trim() && name.trim() !== live.name) { live.name = name.trim().slice(0, 60); live.updatedAt = M.now(); A.afterChange({ animate: false }); }
  } else if (act === "up" || act === "down") {
    const secs = M.sectionsOrdered(A.doc);
    const i = secs.findIndex(x => x.id === s.id);
    const j = act === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= secs.length) return;
    const other = secs[j];
    const tmp = s.order; s.order = other.order; other.order = tmp;
    if (s.order === other.order) { secs.forEach((x, k) => { x.order = (k + 1) * 1000; }); const o = s.order; s.order = other.order; other.order = o; }
    s.updatedAt = M.now(); other.updatedAt = M.now();
    A.afterChange();
  } else if (act === "delete") {
    const ok = await A.ask({ title: "Delete section?", msg: `“${s.name}” goes away. Its lines move to Unsorted.`, confirm: "Delete", danger: true });
    if (!ok) return;
    A.pushUndo("Deleted section", [], [s.id]);
    A.doc.sections[s.id] = { id: s.id, deleted: true, updatedAt: M.now() };
    A.afterChange();
    A.toast(`Deleted “${s.name}”`, { undo: true });
  } else if (act === "today-on" || act === "today-off") {
    const ids = M.itemsInSection(A.doc, id).filter(i => !i.done).map(i => i.id);
    A.pushUndo(act === "today-on" ? "Put all on Today" : "Took all off Today", ids);
    A.doc = M.setSectionToday(A.doc, id, act === "today-on");
    A.sound.tick(); A.afterChange();
    A.toast(act === "today-on" ? "All on Today" : "All off Today", { undo: true });
  } else if (act === "template") {
    const name = await A.ask({ title: "Save as template", label: "Name", value: id === "" ? "" : s.name });
    if (!name || !name.trim()) return;
    A.doc = M.templateFromSection(A.doc, id, name.trim());
    A.afterChange({ animate: false });
    A.toast(`Saved template “${name.trim()}”. Insert it from any section's menu.`);
  } else if (act === "insert") {
    pickTemplate(id);
  }
}

/* ---------------- templates ---------------- */
function pickTemplate(sectionId) {
  const tpls = M.liveTemplates(A.doc);
  if (!tpls.length) { A.toast("No templates yet. Save one from a section's menu."); return; }
  openPick({
    title: "Insert template", msg: sectionId === "" ? "Into Unsorted" : "Into " + M.sectionName(A.doc, sectionId),
    rows: tpls.map(t => ({ label: t.name, sub: t.lines.length + " line" + (t.lines.length === 1 ? "" : "s"), run: () => {
      const r = M.insertTemplate(A.doc, t, sectionId, { today: false });
      A.pushUndo("Inserted template", r.ids);
      A.doc = r.doc; A.afterChange();
      // fresh lines are tombstones-to-be in the undo snapshot (null), so Undo removes them
      A.toast(`Inserted “${t.name}”`, { undo: true });
    } }))
  });
}
export function openTemplates() {
  const tpls = A.doc ? M.liveTemplates(A.doc) : [];
  openPick({
    title: "Templates",
    msg: tpls.length ? "Saved in this list, synced with it. Insert one from any section's menu." : "Nothing saved yet. A section's menu has “Save as template”: its lines, without their done state.",
    rows: tpls.map(t => ({ label: t.name, sub: t.lines.map(l => l.text).join(" · ").slice(0, 120), danger: "Delete", run: () => { showLines(t); }, del: async () => {
      const ok = await A.ask({ title: "Delete template?", msg: `“${t.name}” goes away. Lines already inserted stay where they are.`, confirm: "Delete", danger: true });
      if (!ok) return;
      A.doc = M.deleteTemplate(A.doc, t.id); A.afterChange({ animate: false }); openTemplates();
    } })),
    actions: A.canEdit() && A.doc && M.liveSections(A.doc).length + 1 ? [{ label: "Insert into Unsorted", run: () => pickTemplate("") }] : []
  });
}
function showLines(t) {
  openPick({ title: t.name, msg: t.lines.length + " line" + (t.lines.length === 1 ? "" : "s"), rows: t.lines.map(l => ({ label: l.text, sub: l.note })), actions: [{ label: "Back", run: openTemplates }, { label: "Insert into Unsorted", run: () => pickTemplate("") }] });
}
/** One picker sheet for lists, templates and sections: rows with a label, a sub-line, an optional delete. */
function openPick({ title, msg = "", rows = [], actions = [] }) {
  $("#p-pick-h").textContent = title;
  $("#pick-msg").textContent = msg; $("#pick-msg").hidden = !msg;
  const menu = $("#pick-menu"); menu.innerHTML = "";
  for (const r of rows) {
    const b = document.createElement("button"); b.type = "button";
    b.innerHTML = `<span class="lb">${A.escapeHtml(r.label)}${r.sub ? `<span class="sub">${A.escapeHtml(r.sub)}</span>` : ""}</span>`;
    if (r.run) b.addEventListener("click", () => { A.closePanel(); r.run(); }); else b.disabled = true;
    menu.appendChild(b);
    if (r.del) { const d = document.createElement("button"); d.type = "button"; d.className = "chip"; d.textContent = r.danger || "Delete"; d.setAttribute("aria-label", (r.danger || "Delete") + " " + r.label); d.addEventListener("click", e => { e.stopPropagation(); A.closePanel(); r.del(); }); b.appendChild(d); }
  }
  const act = $("#pick-actions"); act.innerHTML = ""; act.hidden = !actions.length;
  for (const a of actions) { const c = document.createElement("button"); c.type = "button"; c.className = "chip"; c.textContent = a.label; c.addEventListener("click", () => { A.closePanel(); a.run(); }); act.appendChild(c); }
  A.showPanel("p-pick");
}

/* ---------------- line menu ---------------- */
let lineId = null;
export function openLineMenu(id) {
  const it = A.doc.items[id]; if (!it || it.deleted) return;
  lineId = id;
  $("#p-line-h").textContent = it.text.length > 48 ? it.text.slice(0, 48) + "…" : it.text || "Line";
  $("#line-today-lb").textContent = it.today ? "Take off Today" : "Put on Today";
  $("#line-repeat-sub").textContent = A.ruleLabel(M.ruleOf(A.doc, id));
  $('#p-line [data-lact="nottoday"]').hidden = !it.today || it.done;
  $('#p-line [data-lact="move"]').hidden = !meta().lists.some(l => l.id !== A.listId && l.mode !== "view" && !l.archived);
  const li = A.rows.get(id);
  A.showPanel("p-line", { anchor: li ? li.querySelector(".tool.lmenu") : null });
}
function wireLine() {
  $("#p-line").addEventListener("click", e => {
    const b = e.target.closest("[data-lact]"); if (!b) return;
    const id = lineId; A.closePanel();
    if (!A.canEdit() || !A.doc.items[id] || A.doc.items[id].deleted) return;
    const act = b.dataset.lact;
    if (act === "edit") A.startEdit(id);
    else if (act === "today") A.toggleToday(id);
    else if (act === "repeat") openRepeat(id);
    else if (act === "nottoday") A.notToday(id);
    else if (act === "move") openMove(id);
    else if (act === "delete") A.deleteItem(id);
  });
}

/* ---------------- repeat picker ---------------- */
let rep = { id: null, kind: "", days: [], day: 1 };
export function openRepeat(id) {
  const it = A.doc.items[id]; if (!it || it.deleted) return;
  const r = M.ruleOf(A.doc, id);
  rep = { id, kind: r ? r.kind : "", days: r && r.days ? [...r.days] : [], day: r && r.day ? r.day : Math.min(28, new Date().getDate()) };
  $("#p-repeat-h").textContent = "Repeat · " + (it.text.length > 32 ? it.text.slice(0, 32) + "…" : it.text);
  paintRepeat();
  A.showPanel("p-repeat");
}
function paintRepeat() {
  $$("#repeat-kinds [data-kind]").forEach(b => b.setAttribute("aria-checked", b.dataset.kind === rep.kind ? "true" : "false"));
  $("#repeat-days").hidden = rep.kind !== "weekly";
  $$("#repeat-days [data-day]").forEach(b => b.setAttribute("aria-pressed", rep.days.includes(+b.dataset.day) ? "true" : "false"));
  $("#repeat-monthly").hidden = rep.kind !== "monthly";
  $("#repeat-day").value = rep.day;
}
function wireRepeat() {
  $("#repeat-kinds").addEventListener("click", e => { const b = e.target.closest("[data-kind]"); if (!b) return; rep.kind = b.dataset.kind; if (rep.kind === "weekly" && !rep.days.length) rep.days = [new Date().getDay()]; paintRepeat(); });
  $("#repeat-days").addEventListener("click", e => { const b = e.target.closest("[data-day]"); if (!b) return; const d = +b.dataset.day; rep.days = rep.days.includes(d) ? rep.days.filter(x => x !== d) : [...rep.days, d].sort(); paintRepeat(); });
  $("#repeat-day").addEventListener("change", e => { rep.day = Math.min(31, Math.max(1, (+e.target.value) | 0 || 1)); paintRepeat(); });
  $("#repeat-done").addEventListener("click", () => {
    const id = rep.id; A.closePanel();
    if (!A.canEdit() || !A.doc.items[id] || A.doc.items[id].deleted) return;
    const before = M.ruleOf(A.doc, id);
    let rule = null;
    if (rep.kind === "weekly") { if (!rep.days.length) { A.toast("Pick at least one day, or choose Never"); return; } rule = { kind: "weekly", days: rep.days }; }
    else if (rep.kind === "monthly") rule = { kind: "monthly", day: rep.day };
    else if (rep.kind) rule = { kind: rep.kind };
    const same = (!before && !rule) || (before && rule && before.kind === rule.kind && JSON.stringify(before.days || []) === JSON.stringify(rule.days || []) && (before.day || 0) === (rule.day || 0));
    if (same) return;
    A.pushUndo("Repeat", [id]);
    A.doc = M.setRule(A.doc, id, rule);
    A.afterChange({ animate: false });
    A.toast(rule ? "Repeats: " + A.ruleLabel(M.ruleOf(A.doc, id)) : "Doesn't repeat any more", { undo: true });
  });
}

/* ---------------- move to another list ---------------- */
function openMove(id) {
  const it = A.doc.items[id]; if (!it || it.deleted) return;
  const targets = meta().lists.filter(l => l.id !== A.listId && l.mode !== "view" && !l.archived);
  openPick({
    title: "Move to…", msg: `“${it.text.length > 40 ? it.text.slice(0, 40) + "…" : it.text}” leaves this list and lands in the other one's Unsorted.`,
    rows: targets.map(l => { const loc = A.loadLocal(l.id); return { label: (loc && loc.doc.name) || l.name || "Untitled list", sub: loc ? "" : "Not on this device yet—open it once first", run: loc ? () => moveTo(id, l.id) : null }; })
  });
}
function moveTo(id, target) {
  const it = A.doc.items[id]; if (!it || it.deleted || !A.canEdit()) return;
  const loc = A.loadLocal(target); if (!loc || loc.mode === "view") { A.toast("That list isn't on this device"); return; }
  const r = M.moveItem(A.doc, loc.doc, id);
  if (!r) return;
  A.saveLocal(target, { doc: r.dst, rev: loc.rev, dirty: true, created: loc.created, mode: "edit" }); // the target first: the line exists somewhere before it leaves here
  A.doc = r.src; A.afterChange({ animate: true });
  A.flushOthers();
  const name = (loc.doc.name) || (meta().lists.find(l => l.id === target) || {}).name || "the other list";
  A.toast(`Moved to ${name}`, { action: () => {
    const back = A.loadLocal(target); if (!back) return;
    const rr = M.moveItem(back.doc, A.doc, r.newId);
    if (!rr) return;
    A.saveLocal(target, { ...back, doc: rr.src, dirty: true });
    A.doc = rr.dst; A.afterChange({ animate: true }); A.flushOthers();
    A.toast("Moved back");
  } });
}

/* ---------------- delete this list everywhere ---------------- */
export async function deleteEverywhere() {
  if (!A.canEdit() || !A.ref) return;
  const name = A.doc.name || (meta().lists.find(l => l.id === A.listId) || {}).name || "this list";
  const n = Object.values(A.doc.items).filter(i => !i.deleted).length;
  const ok = await A.ask({ title: "Delete this list everywhere?", msg: `“${name}” (${n} line${n === 1 ? "" : "s"}) is removed from the server and from this device. Every other device with the link loses it too. You get ten seconds to change your mind, and no way back after that.`, confirm: "Delete everywhere", danger: true });
  if (!ok) return;
  await A.flushQuick();
  const id = A.listId, ref = A.ref, docCopy = M.normalize(JSON.parse(JSON.stringify(A.doc)), id);
  const entry = { ...(meta().lists.find(l => l.id === id) || { id, mode: "edit", name }) };
  const kill = { lookupId: ref.lookupId, token: ref.token };
  if (A.sync) { A.sync.close(); }
  const dead = await A.killRemote(kill); // offline: queued in pendingKill like Rotate
  A.removeLocal(id);
  meta().lists = meta().lists.filter(l => l.id !== id);
  meta().dead = Array.from(new Set([...(meta().dead || []), id]));
  A.saveDevice();
  const next = meta().lists.find(l => !l.archived);
  if (next) A.switchTo({ id: next.id, mode: next.mode === "view" ? "view" : "edit" }); else A.showWelcome();
  A.toast(dead ? `Deleted “${name}” everywhere` : `Deleted “${name}” here; the server copy goes when you're back online`, { action: async () => {
    // the client still holds W and the document: re-create the row under the same link
    meta().dead = (meta().dead || []).filter(x => x !== id);
    meta().pendingKill = (meta().pendingKill || []).filter(k => k.lookupId !== kill.lookupId);
    A.saveLocal(id, { doc: docCopy, rev: 0, dirty: true, created: true, mode: "edit" });
    const e = A.registerList(id, entry.name || docCopy.name || "", "edit"); e.created = true; e.linkSaved = true; e.archived = false;
    A.saveDevice();
    A.switchTo({ id, mode: "edit" });
    A.toast("Back, under the same link");
  } });
}

/* ---------------- how it works: the long-form page (⋯ → How it works) ---------------- */
export function openHelp(section) {
  const touch = A.touchUi();
  const W = A.ref && A.ref.mode === "edit" ? A.ref.W : null;
  const add = W ? M.addUrl(A.BASE, W) : A.BASE + "#/l/<your list>/add?text=";
  const esc = A.escapeHtml;
  const bm = `javascript:(function(){var t=prompt("Line for Today's Five");if(t)open(${JSON.stringify(add)}+encodeURIComponent(t))})()`;
  $("#help-body").innerHTML = `
    <h3 id="h-basics">The basics</h3>
    <p>Today is the short list you keep on screen. Everything is the backlog, in sections, with a star on every line that puts it on Today or takes it off. Cross a line off and it sinks; finish them all and the finale plays. Finished lines move to History at the start of the next day; unfinished ones carry over.</p>
    <p>A line is the checkbox and the words, nothing else. ${touch
      ? "Hold a line and it lifts: drag to move it, or let go for its menu—edit, repeat, not today, move to another list, delete. Swipe right opens the same menu; swipe left is Not today."
      : "Hover a line and ⋯ appears at its end: click it for the menu—edit, repeat, not today, move to another list, delete—or drag it to move the line. E edits the focused line."}</p>
    <p>There's no tour. The first list you make is the tutorial, and a one-line hint turns up the first time you open Everything, ${touch ? "hold a line" : "hover a line's ⋯"}, or edit one—once each, then never again. Everything else is on the reference sheet:</p>
    <div class="row-actions"><button class="chip accent" id="help-keys" type="button">${touch ? "Gestures" : "Keys and gestures"}</button></div>
    <h3 id="h-repeat">Repeat, and not today</h3>
    <p>A line can repeat every day, on weekdays, on days you pick, or monthly on a date: set it from the line's menu or the Repeat chip in the editor. A finished repeating line goes to History at the next rollover and comes back undone on its next day. It never gets deleted by finishing it. A ↻ on the line marks it.</p>
    <p><b>Not today</b> (${touch ? "swipe left, or the line's menu" : "press - with a line focused, or the line's menu"}) takes a line off Today until tomorrow's rollover puts it back. Everything shows a small “tomorrow” tag on it meanwhile.</p>
    <h3 id="h-one">One thing at a time</h3>
    <p>${touch ? "Tap the count in the top bar" : "Press O, or click the count in the top bar"}: only the top undone line, as big as the screen allows. Cross it off and the next one slides in. The finale ends it; ${touch ? "the count" : "O"} brings the whole list back. It's remembered on this device.</p>
    <h3 id="h-lists">Lists, sections, templates</h3>
    <p>Sections live in Everything; the ⋯ in a section's header can rename it, put every line on Today or take them off, save the section as a <b>template</b> (its lines, no done state), or insert a template. Templates are kept in the list itself, so they sync, and Settings → Lists manages them. A line's menu can <b>move it to another list</b> on this device. Past eight lines, Search shows up at the top of Everything${touch ? "" : "; / opens it any time"}.</p>
    <p><b>Remove from this device</b> (Lists) only hides a list here; the server and your other devices keep it, and Lists → Removed brings it back. <b>Delete this list everywhere</b> (bottom of ⋯) removes it from the server and from here, with ten seconds to undo. Deleted lines sit in <b>Recently deleted</b> at the bottom of Everything for 30 days, with Restore.</p>
    <h3 id="h-links">Links</h3>
    <p>Your link is the key. The edit link lets anyone change the list and make new links; the view link lets someone watch, with live updates, sound and confetti when you cross a line off. Rotate (in Share) replaces both. Lose the link, lose the list: nobody can recover it, and Settings → Advanced → Export &amp; import is the only backup there is.</p>
    <h3 id="h-add">Add from anywhere</h3>
    <p>Open this URL with text on the end and the line lands on Today${W ? "" : " (open an edit link to see yours)"}. Several lines: put a newline between them. Optional <code>&amp;section=Name</code> files it under a section.</p>
    <input class="link" type="text" readonly value="${esc(add)}" aria-label="Add-from-anywhere URL" spellcheck="false">
    <p><b>An iOS Shortcut:</b> Shortcuts → + → add <i>Ask for Input</i> (Text) → <i>URL Encode</i> the input → <i>Open URLs</i> with the address above followed by the encoded text. Name it, add it to the Home Screen or Siri, and every run adds a line.</p>
    <p><b>A Mac bookmarklet:</b> drag this to the bookmarks bar, or make a bookmark whose address is the code below. Click it, type the line, done.</p>
    <p><a class="chip" href="${esc(bm)}" onclick="return false" draggable="true" title="Drag me to the bookmarks bar">+ Today's Five</a></p>
    <input class="link" type="text" readonly value="${esc(bm)}" aria-label="Bookmarklet code" spellcheck="false">
    <h3 id="h-who">Day and night, sound, who's here</h3>
    <p>Every device has a <b>Day theme</b> and a <b>Night theme</b>. The sun or moon in the top bar flips between them${touch ? "" : " (T does too; Shift+T opens Appearance)"}. Settings → Appearance holds both slots and the switch: by hand, with the device's light or dark setting, or on a schedule with a day time and a night time. Under either automation a tap on the sun or moon holds until the next automatic switch, then the automation takes over again.</p>
    <p>Any theme can go in either slot—light, dark, or one of yours; the slot is about when, not what. Every theme names a partner for the other side, one tap away when you pick it, and the builder can make a partner for a theme of your own: same accent, same sound, flipped base. Every theme picks a sound pack, a theme you make can carry its own, and Settings → Sound overrides it on this device. On an iPhone, the ring/silent switch mutes the app's sounds too.</p>
    <p>A small dot beside the sync dot marks each other device that has the list open right now—a random session id, nothing else, and Settings → Advanced turns it off.${touch ? "" : " Leave the mouse alone for a few seconds and the top bar and the footer fade to the date and the count; move it and they're back (Settings → Behavior turns that off)."}</p>`;
  $("#help-keys").addEventListener("click", () => { A.closePanel(); openKeys(); });
  $$("#help-body .link").forEach(el => el.addEventListener("focus", () => { try { el.select(); } catch (e) { /* ignore */ } }));
  A.showPanel("p-help");
  if (section) { const h = document.getElementById("h-" + section); if (h) h.scrollIntoView({ block: "start" }); }
}

/* ---------------- the reference (?): every key on the desktop, every gesture on touch ---------------- */
export function openKeys() {
  const touch = A.touchUi(), esc = A.escapeHtml;
  const keys = [["1 – 9", "Cross off a line by position"], ["N", "New line"], ["E", "Edit the focused line"], ["O", "One thing at a time"], ["-", "Not today (the focused line)"], ["/", "Search Everything"], ["A", "Today ↔ Everything"], ["⌥ ↑ / ↓", "Move the focused line"], ["⌘ Z", "Undo"], ["T", "Day ↔ Night"], ["⇧ T", "Appearance: the Day and Night themes, and the switch"], ["M", "Mute"], ["F", "Full screen"], ["Enter", "While editing: save, and start a new line below"], ["Tab", "While editing: over to the note"], ["Esc", "While editing: cancel · close a panel · clear the search"], ["⌫", "On an empty line: remove it"], ["?", "This sheet"]];
  const mouse = [["Click a line", "Cross it off, or bring it back"], ["Hover a line, then ⋯", "Click for the menu: edit (the Repeat chip is in the editor), repeat, not today, move, delete. Drag it to move the line"], ["Star, in Everything", "Put the line on Today, or take it off"], ["The count", "One thing at a time"], ["The sun or moon", "Day ↔ Night"]];
  const gestures = [["Tap a line", "Cross it off, or bring it back"], ["Hold a line", "It lifts: drag to move it, or let go for its menu—edit, repeat, not today, move, delete"], ["Swipe right", "The line's menu"], ["Swipe left", "Not today: the line leaves Today until tomorrow's rollover (Settings → Behavior turns it off)"], ["Star, in Everything", "Put the line on Today, or take it off"], ["Tap the count", "One thing at a time"], ["Tap the sun or moon", "Day ↔ Night"], ["Swipe down, or tap outside", "Close a sheet like this one"]];
  const g = list => `<div class="gestures">${list.map(x => `<div class="g"><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div>`).join("")}</div>`;
  $("#p-keys-h").textContent = touch ? "Gestures" : "Keys";
  $("#keys-body").innerHTML = touch ? g(gestures) : `<div class="keys">${keys.map(k => `<kbd>${esc(k[0])}</kbd><span>${esc(k[1])}</span>`).join("")}</div><h3>Mouse</h3>${g(mouse)}`;
  A.showPanel("p-keys");
}
function wireKeys() { $("#keys-help").addEventListener("click", () => { A.closePanel(); openHelp(); }); }
/* the hover tooltips hide on Escape and come back on the next mouse move */
function wireMisc() {
  document.addEventListener("keydown", e => { if (e.key === "Escape") document.body.classList.add("no-tip"); }, true);
  document.addEventListener("pointermove", () => document.body.classList.remove("no-tip"), { passive: true });
}
