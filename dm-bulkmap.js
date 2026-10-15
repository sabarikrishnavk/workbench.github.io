/* dm-bulkmap.js — bulk field mapping between two systems, for data-mapping.html.
   One dialog maps every field of a target dataset from a source dataset in one go: pick the source and target
   system (application) and dataset, the integration flow that carries the mappings (or a new one), then choose a
   source field, transformation and rule per target field. ✨ Suggest fills the empty rows by business term and
   name similarity; Save creates, updates or removes the mappings in one undoable step.
   Opened from the guide's integration step (an integration's "mappings →" and the API / sync path hops) and
   from the mapping canvas (⇄ Bulk map). Reuses data-mapping.html's globals (DB, dsById, attrsOf, nextId, …). */
let BM = null;
const BM_NOSRC = ["Constant", "Generate", "Default", "Derive"];   // transformations that need no source field
const bmEa = s => esc(s).replace(/"/g, "&quot;");

// Open for an integration flow: its source and target systems, on the dataset pair it maps most (or the given one).
function bmOpenFlow(flowId, opts) {
  const f = flowById(flowId); if (!f) return;
  opts = opts || {};
  const pairs = {}; DB.Mappings.filter(m => m.FlowID === f.FlowID && S(m.SourcePath)).forEach(m => { const k = m.SourceDatasetID + "|" + m.TargetDatasetID; pairs[k] = (pairs[k] || 0) + 1; });
  const top = Object.entries(pairs).sort((a, b) => b[1] - a[1])[0], [ps, pt] = top ? top[0].split("|") : [];
  bmOpen({ flow: f.FlowID, srcApp: f.SourceAppID, tgtApp: f.TargetAppID, srcDs: opts.srcDs || ps, tgtDs: opts.tgtDs || pt, onDone: opts.onDone });
}
// Open for two systems (applications), optionally on a dataset pair.
function bmOpenApps(srcApp, tgtApp, opts) { opts = opts || {}; bmOpen({ srcApp, tgtApp, srcDs: opts.srcDs, tgtDs: opts.tgtDs, flow: opts.flow, onDone: opts.onDone }); }
function bmOpen(o) {
  BM = { flow: o.flow || "", srcApp: o.srcApp || "", tgtApp: o.tgtApp || "", srcDs: o.srcDs || "", tgtDs: o.tgtDs || "", onDone: o.onDone, filter: "all", find: "", dirty: false, pattern: "", rows: [] };
  bmFix(); bmLoad(); bmRender();
}
const bmDsOf = app => DB.Datasets.filter(d => d.AppID === app).sort((a, b) => String(a.Name).localeCompare(b.Name));
const bmFlows = () => DB.Flows.filter(f => f.SourceAppID === BM.srcApp && f.TargetAppID === BM.tgtApp);
// Keeps the selections consistent: datasets belong to their systems, the flow joins the two systems.
function bmFix() {
  const sD = bmDsOf(BM.srcApp), tD = bmDsOf(BM.tgtApp);
  if (!sD.some(d => d.DatasetID === BM.srcDs)) BM.srcDs = (sD[0] || {}).DatasetID || "";
  if (!tD.some(d => d.DatasetID === BM.tgtDs)) BM.tgtDs = (tD.find(d => d.DatasetID !== BM.srcDs) || tD[0] || {}).DatasetID || "";
  const fl = bmFlows();
  if (BM.flow !== "+" && !fl.some(f => f.FlowID === BM.flow)) BM.flow = (fl.find(f => DB.Mappings.some(m => m.FlowID === f.FlowID && m.TargetDatasetID === BM.tgtDs)) || fl[0] || {}).FlowID || (BM.srcApp && BM.tgtApp ? "+" : "");
  if (!BM.pattern) BM.pattern = BM.srcApp === BM.tgtApp ? "Internal" : "REST API";
}
// Rows: the pair's existing mappings (several per target field for multi-source mappings) + one empty row per unmapped target field.
function bmLoad() {
  BM.rows = []; BM.dirty = false; if (!BM.tgtDs) return;
  const ms = DB.Mappings.filter(m => m.TargetDatasetID === BM.tgtDs && (S(m.SourcePath) ? m.SourceDatasetID === BM.srcDs : true) && (BM.flow === "+" || !BM.flow || m.FlowID === BM.flow));
  attrsOf(BM.tgtDs).forEach(t => {
    const mine = ms.filter(m => m.TargetPath === t.Path);
    mine.forEach(m => BM.rows.push({ id: m._id, tgt: t.Path, src: S(m.SourcePath) ? m.SourcePath : "~", tx: m.Transformation || "Direct", rule: m.Rule || "", status: m.Status || "Draft", sug: "" }));
    if (!mine.length) BM.rows.push({ id: null, tgt: t.Path, src: "", tx: "Direct", rule: "", status: "Draft", sug: "" });
  });
  // the same source → target field pair mapped under another flow: shown on the row so it isn't mapped twice
  BM.elsewhere = {}; DB.Mappings.filter(m => m.TargetDatasetID === BM.tgtDs && m.SourceDatasetID === BM.srcDs && S(m.SourcePath) && BM.flow && BM.flow !== "+" && m.FlowID !== BM.flow).forEach(m => (BM.elsewhere[m.TargetPath] = BM.elsewhere[m.TargetPath] || []).push(`${m.SourcePath} in ${m.FlowID}`));
  BM.other = DB.Mappings.filter(m => m.TargetDatasetID === BM.tgtDs && S(m.SourcePath) && m.SourceDatasetID !== BM.srcDs && (!BM.flow || BM.flow === "+" || m.FlowID === BM.flow)).length;
}
// ✨ Suggest: fill empty rows from the source dataset by business term, then by name similarity.
function bmSuggest() {
  const src = attrsOf(BM.srcDs); let n = 0;
  BM.rows.forEach(r => {
    if (r.id || r.src) return;
    const t = attrAt(BM.tgtDs, r.tgt); if (!t) return;
    let best = null, why = "";
    if (S(t.TermID)) { best = src.find(s => s.TermID === t.TermID); why = "same business term"; }
    if (!best) { let sc = 0; for (const s of src) { const v = similarity(leafNorm(s.Path), leafNorm(t.Path)); if (v > sc) { sc = v; best = s; } } if (sc < 0.75) best = null; else why = `name ${Math.round(sc * 100)}% alike`; }
    if (!best) return;
    r.src = best.Path; r.tx = compatible(best.DataType, t.DataType) ? (leafNorm(best.Path) === leafNorm(t.Path) ? "Direct" : "Rename") : "Type cast"; r.sug = why; n++;
  });
  BM.dirty = BM.dirty || n > 0; bmRender(); toast(n ? `Suggested ${n} field mapping(s): check them, then Save` : "No more suggestions: the remaining fields have no match by term or name");
}
function bmClearSuggestions() { BM.rows.forEach(r => { if (r.sug && !r.id) { r.src = ""; r.tx = "Direct"; r.sug = ""; } }); bmRender(); }
const bmMapped = r => r.src && (r.src !== "~" || BM_NOSRC.includes(r.tx));

function bmRender() {
  const B = BM, sa = appById(B.srcApp), ta = appById(B.tgtApp), sd = dsById(B.srcDs), td = dsById(B.tgtDs);
  const appOpts = v => `<option value="">— choose a system —</option>` + DB.Applications.slice().sort((a, b) => String(a.Name).localeCompare(b.Name)).map(a => `<option value="${bmEa(a.AppID)}"${a.AppID === v ? " selected" : ""}>${esc(a.Name)} · ${esc(KN(a.AppType))}</option>`).join("");
  const dsOpts = (app, v) => bmDsOf(app).map(d => `<option value="${bmEa(d.DatasetID)}"${d.DatasetID === v ? " selected" : ""}>${esc(d.Name || d.DatasetID)} · ${esc(KN(d.Kind))} (${attrsOf(d.DatasetID).length})</option>`).join("") || `<option value="">(no datasets)</option>`;
  const fl = bmFlows(), src = sd ? attrsOf(sd.DatasetID) : [];
  const flowSel = `<select data-bm="flow">${fl.map(f => `<option value="${bmEa(f.FlowID)}"${f.FlowID === B.flow ? " selected" : ""}>${esc(f.FlowID)} · ${esc(f.Pattern || "")} · ${esc(mapTypeOf(f))}</option>`).join("")}<option value="+"${B.flow === "+" ? " selected" : ""}>＋ New integration flow…</option></select>`
    + (B.flow === "+" ? ` via <select data-bm="pattern">${PATTERNS.map(p => `<option${p === B.pattern ? " selected" : ""}>${esc(p)}</option>`).join("")}</select> <span class="hint">created on Save as ${sa && ta ? "an " + esc(deriveMapType({ SourceAppID: B.srcApp, TargetAppID: B.tgtApp, Pattern: B.pattern, FlowID: "" })).replace(/^an Domain/, "a Domain") : "a flow"}</span>` : "");
  const used = new Set(B.rows.filter(r => r.src && r.src !== "~").map(r => r.src)), mappedT = new Set(B.rows.filter(bmMapped).map(r => r.tgt));
  const nT = td ? attrsOf(td.DatasetID).length : 0, nSug = B.rows.filter(r => r.sug && r.src).length, f = B.find.toLowerCase();
  const show = r => (B.filter === "all" || (B.filter === "unmapped" && !bmMapped(r)) || (B.filter === "sug" && r.sug)) && (!f || (r.tgt + " " + r.src).toLowerCase().includes(f));
  const txOpts = v => TRANSFORMS.map(t => `<option${t === v ? " selected" : ""}>${esc(t)}</option>`).join("");
  const stOpts = v => STATUS.map(t => `<option${t === v ? " selected" : ""}>${esc(t)}</option>`).join("");
  const rows = B.rows.map((r, i) => {
    if (!show(r)) return "";
    const t = attrAt(B.tgtDs, r.tgt) || {}, s = r.src && r.src !== "~" ? attrAt(B.srcDs, r.src) : null, first = i === 0 || B.rows[i - 1].tgt !== r.tgt;
    const warn = s && ["Direct", "Rename"].includes(r.tx) && !compatible(s.DataType, t.DataType) ? `<span class="bm-warn" title="${bmEa(`${s.DataType} → ${t.DataType}: use Type cast or Format`)}">⚠</span>` : r.src === "~" && !BM_NOSRC.includes(r.tx) ? `<span class="bm-warn" title="No source field: use Constant, Generate, Default or Derive">⚠</span>` : "";
    const term = t.TermID ? `<span class="bm-term" title="${bmEa((termById(t.TermID) || {}).Name || t.TermID)}">${esc(t.TermID)}</span>` : "";
    return `<tr class="${bmMapped(r) ? "on" : ""}${r.sug ? " sug" : ""}${first ? "" : " more"}">
      <td>${first ? `<b class="mono">${esc(r.tgt)}</b>${t.Required === "Y" ? '<span class="bm-req" title="required">*</span>' : ""} <span class="hint">${esc(t.DataType || "")}</span> ${term}` : '<span class="hint">↳ another source</span>'}</td>
      <td class="bm-arrow">←</td>
      <td><select data-bm="src" data-i="${i}"><option value="">— not mapped —</option><option value="~"${r.src === "~" ? " selected" : ""}>(no source: constant / generated)</option>${src.map(a => `<option value="${bmEa(a.Path)}"${a.Path === r.src ? " selected" : ""}>${esc(a.Path)} · ${esc(a.DataType || "")}${used.has(a.Path) && a.Path !== r.src ? " ✓" : ""}</option>`).join("")}</select>${r.sug ? `<div class="hint bm-sug">✨ ${esc(r.sug)}</div>` : ""}${!r.src && first && B.elsewhere[r.tgt] ? `<div class="hint">already mapped from ${esc(B.elsewhere[r.tgt].join(", "))}</div>` : ""}</td>
      <td><select data-bm="tx" data-i="${i}">${txOpts(r.tx)}</select> ${warn}</td>
      <td><input data-bm="rule" data-i="${i}" value="${bmEa(r.rule)}" placeholder="rule / expression" /></td>
      <td><select data-bm="status" data-i="${i}">${stOpts(r.status)}</select></td>
      <td class="act"><button class="icon-btn" data-bm="more" data-i="${i}" title="Map this field from another source field too (Concat / Derive)">＋</button>${bmMapped(r) || r.src ? `<button class="rm-row" data-bm="clear" data-i="${i}" title="${r.id ? "Remove this mapping on Save" : "Clear"}">✕</button>` : ""}</td></tr>`;
  }).join("");
  openModal(`<h2>⇄ Map fields between systems</h2>
    <p class="hint">Every field of the target dataset is a row: pick the source field it comes from, the transformation and a rule. ✨ Suggest fills empty rows by business term and name similarity. Nothing changes until you click <b>Save mappings</b> (Ctrl/⌘+Z undoes the save).</p>
    <div class="bm-sys">
      <div class="bm-side"><div class="kv">Source system</div><select data-bm="srcApp">${appOpts(B.srcApp)}</select><select data-bm="srcDs">${dsOpts(B.srcApp, B.srcDs)}</select>${sd ? `<div class="hint">${esc(KN(sd.Kind))} · ${src.length} fields · ${used.size} used</div>` : ""}</div>
      <button class="bm-swap" data-bm="swap" title="Swap source and target">⇄</button>
      <div class="bm-side"><div class="kv">Target system</div><select data-bm="tgtApp">${appOpts(B.tgtApp)}</select><select data-bm="tgtDs">${dsOpts(B.tgtApp, B.tgtDs)}</select>${td ? `<div class="hint">${esc(KN(td.Kind))} · ${nT} fields</div>` : ""}</div>
    </div>
    ${B.srcApp && B.tgtApp ? `<div class="dg-row"><b>Integration flow</b> ${flowSel}</div>` : ""}
    ${td ? `<div class="dg-row"><span class="seg" style="display:inline-flex">${[["all", "All fields"], ["unmapped", "Unmapped"], ["sug", "Suggested"]].map(([k, l]) => `<button data-bm="filter" data-v="${k}" class="${B.filter === k ? "active" : ""}">${l}</button>`).join("")}</span>
      <input type="search" data-bm="find" placeholder="Find a field…" value="${bmEa(B.find)}" style="width:180px" />
      <button data-bm="suggest"${sd ? "" : " disabled"}>✨ Suggest</button>${nSug ? `<button data-bm="unsuggest">Clear suggestions</button>` : ""}
      <span class="hint" style="margin-left:auto"><b>${mappedT.size}</b> of ${nT} target fields mapped${nSug ? ` · ${nSug} suggested` : ""}${B.other ? ` · ${B.other} mapped from other source datasets (not shown)` : ""}</span></div>
      <div class="bm-scroll"><table class="dg-tbl bm-tbl"><thead><tr><th>Target field · ${esc(td.Name || td.DatasetID)}</th><th></th><th>Source field · ${esc(sd ? sd.Name || sd.DatasetID : "—")}</th><th>Transformation</th><th>Rule</th><th>Status</th><th></th></tr></thead><tbody>${rows || `<tr><td colspan="7" class="empty">${nT ? "No fields match the filter." : "The target dataset has no fields yet."}</td></tr>`}</tbody></table></div>`
      : `<div class="empty" style="padding:24px">Choose the source and target systems and their datasets.</div>`}
    <div class="dt-err">${esc(B.err || "")}</div>
    <div class="modal-actions"><span class="hint">${B.dirty ? "Unsaved changes" : ""}</span><span style="flex:1"></span><button data-bm="cancel">Cancel</button><button class="primary" data-bm="save"${td && sd ? "" : " disabled"}>Save mappings</button></div>`);
  document.getElementById("modalCard").classList.add("bm-wide");
}
function bmClose(saved) { const done = BM && BM.onDone; BM = null; closeModal(); if (done) done(saved); else renderAll(); }
function bmSave() {
  const B = BM, sa = appById(B.srcApp), ta = appById(B.tgtApp); if (!sa || !ta || !B.tgtDs) return;
  const bad = B.rows.find(r => r.src === "~" && !BM_NOSRC.includes(r.tx)); if (bad) { B.err = `${bad.tgt}: a mapping without a source field needs Constant, Generate, Default or Derive`; return bmRender(); }
  pushUndo();
  let flow = B.flow;
  if (flow === "+" || !flowById(flow)) {
    const row = { _id: uid() }; DM.Flows.cols.forEach(c => row[c.key] = "");
    Object.assign(row, { FlowID: nextId("Flows"), Name: `${sa.Name} → ${ta.Name} (${B.pattern})`, SourceAppID: sa.AppID, TargetAppID: ta.AppID, Pattern: B.pattern, Status: "Draft" });
    row.MappingType = deriveMapType(row); DB.Flows.push(row); flow = row.FlowID;
  }
  let add = 0, upd = 0, del = 0;
  B.rows.forEach(r => {
    const m = r.id && DB.Mappings.find(x => x._id === r.id), on = bmMapped(r);
    const vals = { SourceDatasetID: r.src && r.src !== "~" ? B.srcDs : "", SourcePath: r.src && r.src !== "~" ? r.src : "", TargetDatasetID: B.tgtDs, TargetPath: r.tgt, Transformation: r.tx, Rule: r.rule, Status: r.status };
    if (m && !on) { DB.Mappings = DB.Mappings.filter(x => x !== m); del++; }
    else if (m) { if (Object.keys(vals).some(k => S(m[k]) !== S(vals[k]))) { Object.assign(m, vals); upd++; } }
    else if (on) { DB.Mappings.push(Object.assign({ _id: uid(), MappingID: nextId("Mappings"), FlowID: flow, Notes: r.sug ? "suggested: " + r.sug : "" }, vals)); add++; }   // existing mappings keep their flow
    const t = attrAt(B.tgtDs, r.tgt), s = r.src && r.src !== "~" ? attrAt(B.srcDs, r.src) : null;   // carry the business term over, as auto-map does
    if (on && t && s && !S(t.TermID) && S(s.TermID)) t.TermID = s.TermID;
  });
  if (!add && !upd && !del && flow === B.flow) { UNDO.pop(); toast("No changes to save"); return bmClose(false); }
  save(); toast(`Saved: ${add} added · ${upd} updated · ${del} removed${flow !== B.flow ? ` · flow ${flow} created` : ""}`); bmClose(true);
}
function bmWire() {
  const card = document.getElementById("modalCard"), live = () => BM && card.classList.contains("bm-wide");
  const ask = () => !BM.dirty || confirm("Discard the unsaved field mappings?");
  card.addEventListener("change", e => { if (!live()) return; const el = e.target, k = el.dataset.bm, i = +el.dataset.i; if (!k) return;
    if (["srcApp", "tgtApp", "srcDs", "tgtDs", "flow"].includes(k)) { if (!ask()) return bmRender(); BM[k] = el.value; if (k.endsWith("App")) BM.pattern = ""; bmFix(); bmLoad(); return bmRender(); }
    if (k === "pattern") { BM.pattern = el.value; return bmRender(); }
    const r = BM.rows[i]; if (!r) return; BM.dirty = true;
    if (k === "src") { r.src = el.value; r.sug = ""; const s = attrAt(BM.srcDs, r.src), t = attrAt(BM.tgtDs, r.tgt); if (r.src === "~") r.tx = BM_NOSRC.includes(r.tx) ? r.tx : "Constant"; else if (s && t && !r.id) r.tx = compatible(s.DataType, t.DataType) ? (leafNorm(s.Path) === leafNorm(t.Path) ? "Direct" : "Rename") : "Type cast"; }
    else if (k === "tx") r.tx = el.value; else if (k === "status") r.status = el.value;
    bmRender(); });
  card.addEventListener("input", e => { if (!live()) return; const el = e.target, k = el.dataset.bm;
    if (k === "rule") { const r = BM.rows[+el.dataset.i]; if (r) { r.rule = el.value; BM.dirty = true; } }
    else if (k === "find") { BM.find = el.value; const pos = el.selectionStart; bmRender(); const ni = card.querySelector('[data-bm="find"]'); if (ni) { ni.focus(); ni.setSelectionRange(pos, pos); } } });
  card.addEventListener("click", e => { if (!live()) return; const b = e.target.closest("button[data-bm]"); if (!b || b.disabled) return; const k = b.dataset.bm, i = +b.dataset.i;
    if (k === "save") bmSave();
    else if (k === "cancel") { if (ask()) bmClose(false); }
    else if (k === "suggest") bmSuggest();
    else if (k === "unsuggest") bmClearSuggestions();
    else if (k === "filter") { BM.filter = b.dataset.v; bmRender(); }
    else if (k === "swap") { if (!ask()) return; [BM.srcApp, BM.tgtApp, BM.srcDs, BM.tgtDs] = [BM.tgtApp, BM.srcApp, BM.tgtDs, BM.srcDs]; BM.flow = ""; BM.pattern = ""; bmFix(); bmLoad(); bmRender(); }
    else if (k === "more") { const r = BM.rows[i]; BM.rows.splice(i + 1, 0, { id: null, tgt: r.tgt, src: "", tx: "Concat", rule: "", status: "Draft", sug: "" }); BM.dirty = true; bmRender(); }
    else if (k === "clear") { const r = BM.rows[i]; if (!r.id && BM.rows.filter(x => x.tgt === r.tgt).length > 1) BM.rows.splice(i, 1); else Object.assign(r, { src: "", sug: "", tx: "Direct" }); BM.dirty = true; bmRender(); } });
  // clicking the backdrop with unsaved mappings asks first (runs before the page's own close handler)
  document.getElementById("modal").addEventListener("click", e => { if (e.target.id !== "modal" || !live()) return; if (!ask()) { e.stopImmediatePropagation(); return; } BM = null; }, true);
}
bmWire();
