/* wb-onboarding.js — "Onboarding guide" tab of workbench.html (the GQL Registry).
   Onboards ONE business application (subgraph = Entities.BusinessApplication) at a time into the shared
   registry: 1 registry overview → 2 application & entities → 3 types (@key entities, types, inputs, enums,
   borrowed entities) → 4 queries → 5 mutations → 6 auth scopes → 7 review & propose → 8 save & publish.
   The registry and the schema visualizer stay registry-wide: while the guide is open the visualizer slides
   in on the right (resizable drawer), outlines the application being onboarded and flashes / re-centres on
   the types an edit just changed. Reuses workbench.html's globals (DB, SCHEMA, openRowEditor, validateRow,
   renderViz, VIZ, …) and the shared overview helpers in onboarding.js. */

const OB_STEPS = [
  { k: "registry", t: "Registry overview" },
  { k: "app", t: "Business application" },
  { k: "types", t: "Types & entities" },
  { k: "queries", t: "Queries" },
  { k: "mutations", t: "Mutations" },
  { k: "scopes", t: "Auth scopes" },
  { k: "review", t: "Review & propose" },
  { k: "save", t: "Save & publish" },
];
const OB_STEP_ICON = ["table", "app", "key", "query", "write", "check", "diff", "save"];
const OB_LS = "wb-onb-v1", OB_DRAWER = "wb-onb-drawer-v1";
const OB_KIND_ORDER = ["Key", "Type", "Interface", "Input", "Enum", "Reference", "Extend", "Scalar"];
const OB_KIND_HINT = { Key: "@key entity owned by this subgraph", Type: "value type", Interface: "interface", Input: "mutation / query input", Enum: "enumeration", Reference: "another subgraph's entity, referenced by @key", Extend: "another subgraph's entity this subgraph adds fields to", Scalar: "custom scalar" };
const OB_DEF = { Key: '@key(fields: "id") {\n  id: ID!\n}', Type: "{\n  id: ID!\n}", Interface: "{\n  id: ID!\n}", Input: "{\n  id: ID!\n}", Enum: "{\n  UNKNOWN\n}", Scalar: "" };
let OB = null, OB_OV_PREV = {}, OB_VIZ_SIGS = null, OB_DATA_CHANGED = false;
function toast(msg) {   // workbench.html has no toast of its own
  let t = document.getElementById("toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 1600);
}

/* ------------------------------ state ---------------------------------- */
function ob() {
  const d = { step: 0, app: "", typesOk: false, queriesOk: false, mutationsOk: false, scopesOk: false, savedSig: "", savedAt: "", savedHow: "" };
  if (!OB) { try { OB = JSON.parse(localStorage.getItem(OB_LS)) || {}; } catch (_) { OB = {}; } }
  for (const k in d) if (!(k in OB)) OB[k] = d[k];
  return OB;
}
function obSave() { try { localStorage.setItem(OB_LS, JSON.stringify(OB)); } catch (_) {} }
const obSg = e => String((e && e.BusinessApplication) || "").trim();
const obApps = () => [...new Set(DB.Entities.map(obSg).filter(Boolean))].sort((a, b) => a.localeCompare(b));
const obEnts = () => DB.Entities.filter(e => obSg(e) === ob().app);
const obIds = () => new Set(obEnts().map(e => e.EntityID));
const obRows = sheet => { const ids = obIds(); return DB[sheet].filter(r => ids.has(r.EntityID)); };
const obIss = (sheet, r) => VALIDATED_SHEETS.has(sheet) ? validateRow(sheet, r) : [];
// Signature of the application's rows: a save / push is current only while it matches.
const obSig = () => ["Entities", "Schema", "Queries", "Mutations", "AuthScopes"].map(s => (s === "Entities" ? obEnts() : obRows(s)).map(r => rowSig(s, r)).join("\u0001")).join("\u0002");
function obCounts() {
  const rows = ["Schema", "Queries", "Mutations"].flatMap(s => obRows(s).map(r => [s, r]));
  let err = 0, warn = 0; for (const [s, r] of rows) for (const v of obIss(s, r)) { if (v.severity === "error") err++; else if (v.severity === "warning") warn++; }
  const st = {}; for (const [, r] of rows) { const k = r.ApprovalStatus || "Draft"; st[k] = (st[k] || 0) + 1; }
  return { rows: rows.length, err, warn, st, drafts: st.Draft || 0 };
}
function obDone() {
  const w = ob(), app = !!w.app && obEnts().length > 0, c = app ? obCounts() : { rows: 0, err: 1, drafts: 1 };
  const types = app && obRows("Schema").length > 0;
  const d2 = types && w.typesOk, d3 = d2 && w.queriesOk, d4 = d3 && w.mutationsOk, d5 = d4 && w.scopesOk;
  const d6 = d5 && c.rows > 0 && c.err === 0 && c.drafts === 0;
  return [DB.Entities.length > 0, app, d2, d3, d4, d5, d6, d6 && w.savedSig === obSig()];
}
const obPct = () => Math.round(100 * obDone().filter(Boolean).length / OB_STEPS.length);
function obCanVisit(i) { const d = obDone(); for (let j = 0; j < i; j++) if (!d[j]) return false; return true; }
function obGo(i) { if (i < 0 || i >= OB_STEPS.length || !obCanVisit(i)) return; ob().step = i; obSave(); obRender(); const m = document.getElementById("obMain"); if (m) m.scrollTop = 0; }
function obSetApp(app) {
  const w = ob(); if (w.app === app) return;
  Object.assign(w, { app, typesOk: false, queriesOk: false, mutationsOk: false, scopesOk: false, savedSig: "", savedAt: "" });
  VIZ.hiSg = app; obSave();
}

/* ------------------------------ render --------------------------------- */
const obH = (n, title, desc) => `<h2>Step ${n} of ${OB_STEPS.length} · ${esc(title)}</h2><p class="desc">${desc}</p>`;
const obChip = s => `<span class="st-chip st-${String(s || "Draft").toLowerCase()}">${esc(s || "Draft")}</span>`;
function obIssBadge(list) {
  if (!list.length) return `<span class="ob-ok" title="No standards issues">✓</span>`;
  const e = list.filter(v => v.severity === "error").length, w = list.filter(v => v.severity === "warning").length, i = list.length - e - w;
  const sev = e ? "error" : w ? "warning" : "info";
  return `<span class="val-badge sev-${sev}" title="${esc(list.map(v => `[${v.severity}] [${v.ruleId}] ${v.subject}${v.message}`).join("\n"))}">${e ? e + " err" : w ? w + " warn" : i + " info"}</span>`;
}
function obAppStats(app) {
  const ids = new Set(DB.Entities.filter(e => obSg(e) === app).map(e => e.EntityID)), by = s => DB[s].filter(r => ids.has(r.EntityID));
  const rows = ["Schema", "Queries", "Mutations"].flatMap(s => by(s).map(r => [s, r]));
  let err = 0; const st = {}; for (const [s, r] of rows) { err += obIss(s, r).filter(v => v.severity === "error").length; const k = r.ApprovalStatus || "Draft"; st[k] = (st[k] || 0) + 1; }
  const ents = DB.Entities.filter(e => obSg(e) === app);
  return { ents, types: by("Schema").length, q: by("Queries").length, m: by("Mutations").length, scopes: by("AuthScopes").length, err, st, dom: [...new Set(ents.map(e => e.ExperienceDomain).filter(Boolean))].join(", "), svc: [...new Set(ents.map(e => e.ServiceType).filter(Boolean))].join(", ") };
}
function obRender() {
  const root = document.getElementById("view-guide"); if (!root) return;
  const w = ob(), done = obDone();
  if (w.step > 0 && !obCanVisit(w.step)) w.step = Math.max(0, done.indexOf(false));
  const pctEl = document.getElementById("obPct"), pct = obPct();
  document.getElementById("obBarFill").style.width = pct + "%";
  onbPct(pctEl, pct);   // pops when progress goes up
  document.getElementById("obTopApp").textContent = w.app ? "· " + w.app : "· one business application at a time";
  document.getElementById("obSteps").innerHTML = OB_STEPS.map((s, i) => `<li class="${done[i] ? "done" : ""}${i === w.step ? " cur" : ""}${obCanVisit(i) ? "" : " locked"}" data-step="${i}">${esc(s.t)}</li>`).join("");
  const ents = obEnts(), c = w.app && ents.length ? obCounts() : null;
  document.getElementById("obCtx").innerHTML = [
    `📘 Registry: ${obApps().length} applications · ${DB.Entities.length} entities`,
    w.app ? `🏷 <b>${esc(w.app)}</b> · ${ents.map(e => esc(e.EntityID)).join(", ")}${ents[0] && ents[0].ServiceType ? " · " + esc(ents[0].ServiceType) : ""}` : "",
    c ? `🧬 ${obRows("Schema").length} types · ${obRows("Queries").length} Q · ${obRows("Mutations").length} M · ${obRows("AuthScopes").length} scopes` : "",
    c ? `${c.err ? "⛔ " + c.err + " errors" : "✅ no errors"}${c.warn ? " · " + c.warn + " warnings" : ""} · ${Object.entries(c.st).map(([k, v]) => v + " " + k).join(" · ")}` : "",
    w.savedAt && w.savedSig === obSig() ? `💾 ${esc(w.savedHow)} ${esc(new Date(w.savedAt).toLocaleTimeString())}` : "",
  ].filter(Boolean).map(x => `<span>${x}</span>`).join("");
  document.getElementById("obBody").innerHTML = [obStepRegistry, obStepApp, obStepTypes, () => obStepOps("Queries"), () => obStepOps("Mutations"), obStepScopes, obStepReview, obStepSave][w.step]();
  const next = document.getElementById("obNext"), confirm = { 2: "Types done — next →", 3: "Queries done — next →", 4: "Mutations done — next →", 5: "Auth scopes done — next →" };
  document.getElementById("obBack").disabled = w.step === 0;
  next.textContent = w.step === OB_STEPS.length - 1 ? "Onboard another application" : confirm[w.step] || "Next →";
  next.disabled = w.step === 2 ? !obRows("Schema").length : w.step >= 3 && w.step <= 5 ? false : w.step === 7 ? false : !done[w.step];
  document.getElementById("obHint").textContent = w.step === 1 && !done[1] ? "Pick or add an application" : w.step === 2 && !obRows("Schema").length ? "Add at least one type" : w.step === 6 && !done[6] ? (c && c.err ? "Fix the errors, then propose" : "Propose the Draft rows to continue") : w.step === 7 && !done[7] ? "Export or push to finish" : "";
  obOverview();
  obDrawerSync();
}

function obStepRegistry() {
  let h = obH(1, "The GQL Registry — all business applications", "The registry and the visualizer (right) cover <b>every</b> business application. Onboarding happens <b>one application at a time</b>: pick one below (or in the next step) to add its types, queries, mutations and auth scopes, then propose them for approval. Load your <span class=\"mono\">GQLRegistry.xlsx</span> or the example first if the registry is empty.");
  h += `<div class="selrow"><button class="primary" data-act="load">Load .xlsx…</button><button data-act="example">Load example</button><button data-act="template">Download template</button></div>`;
  const apps = obApps();
  h += apps.length ? `<div class="table-wrap" style="max-height:46vh"><table><thead><tr><th>Business application</th><th>Domain</th><th>Service type</th><th>Entities</th><th>Types</th><th>Queries</th><th>Mutations</th><th>Scopes</th><th>Approval</th><th>Errors</th><th></th></tr></thead><tbody>${apps.map(a => { const s = obAppStats(a);
      return `<tr${a === ob().app ? ' class="ob-cur-row"' : ""}><td><span class="sg-dot" style="background:${vizSgColor(a)}"></span><b>${esc(a)}</b></td><td>${esc(s.dom)}</td><td>${esc(s.svc)}</td><td>${s.ents.length}</td><td>${s.types}</td><td>${s.q}</td><td>${s.m}</td><td>${s.scopes}</td><td>${Object.entries(s.st).map(([k, v]) => `${obChip(k)} ${v}`).join(" ")}</td><td>${s.err ? `<span class="val-badge sev-error">${s.err}</span>` : '<span class="ob-ok">✓</span>'}</td><td><button class="copy-btn" data-act="pick-app" data-v="${esc(a)}">Onboard →</button></td></tr>`; }).join("")}</tbody></table></div>`
    : `<div class="empty">The registry is empty. Load a workbook, the example, or add your first application in the next step.</div>`;
  return h;
}

function obStepApp() {
  const w = ob(), apps = obApps(), doms = [...new Set(DB.Entities.map(e => e.ExperienceDomain).filter(Boolean))];
  let h = obH(2, "Choose the business application to onboard", "A business application is one subgraph. It owns one or more entities (Entities rows with the same Business Application); everything you add in the next steps hangs off those entities. Its <b>Service Type</b> decides how it implements its logic: Domain (owns its data), Integration (adapts an external system) or Orchestrator (coordinates other subgraph services).");
  h += `<div class="wz-cards">${apps.map(a => { const s = obAppStats(a); return `<div class="wz-card${a === w.app ? " sel" : ""}" data-act="pick-app" data-v="${esc(a)}"><h4><span class="sg-dot" style="background:${vizSgColor(a)}"></span>${esc(a)}</h4><p>${esc(s.dom || "—")} · ${esc(s.svc || "no service type")}</p><p>${s.ents.map(e => esc(e.EntityID + " " + (e.Name || ""))).join(", ")}</p><p>${s.types} types · ${s.q} Q · ${s.m} M${s.err ? ` · <b style="color:var(--bad)">${s.err} errors</b>` : ""}</p></div>`; }).join("")}</div>`;
  h += `<details class="ob-new"${apps.length ? "" : " open"}><summary><b>＋ New business application</b> <span class="hint">creates its first entity (Draft)</span></summary>
    <div class="ob-form"><label>Business application (subgraph)<input id="obNewApp" placeholder="loyalty" /></label><label>Entity name (@key type)<input id="obNewEnt" placeholder="LoyaltyAccount" /></label>
    <label>Experience domain<input id="obNewDom" list="obDomList" placeholder="Retail Web" /></label><datalist id="obDomList">${doms.map(d => `<option value="${esc(d)}">`).join("")}</datalist>
    <label>Service type<select id="obNewSvc">${SERVICE_TYPES.map(t => `<option>${t}</option>`).join("")}</select></label><label>Business capability<input id="obNewCap" placeholder="Loyalty Management" /></label>
    <label class="wide">Description<input id="obNewDesc" placeholder="What this application owns" /></label><button class="primary" data-act="new-app">Add application</button></div></details>`;
  if (w.app && obEnts().length) {
    h += `<div class="kv">Entities of <b>${esc(w.app)}</b></div><div class="table-wrap"><table><thead><tr><th>EntityID</th><th>Entity</th><th>Experience domain</th><th>Service type</th><th>Business capability</th><th>Approval</th></tr></thead><tbody>${obEnts().map(e => `<tr data-ent="${esc(e.EntityID)}"><td class="mono">${esc(e.EntityID)}</td><td><input data-f="Name" value="${esc(e.Name || "")}" /></td><td><input data-f="ExperienceDomain" value="${esc(e.ExperienceDomain || "")}" list="obDomList" /></td><td><select data-f="ServiceType"><option value=""></option>${SERVICE_TYPES.map(t => `<option${t === e.ServiceType ? " selected" : ""}>${t}</option>`).join("")}</select></td><td><input data-f="BusinessCapability" value="${esc(e.BusinessCapability || "")}" /></td><td>${obChip(e.ApprovalStatus)}</td></tr>`).join("")}</tbody></table></div>
      <div class="ob-form" style="margin-top:8px"><label>Another entity in ${esc(w.app)}<input id="obAddEnt" placeholder="EntityName" /></label><button data-act="add-ent">＋ Add entity</button></div>`;
  }
  return h;
}

function obRowTable(sheet, rows, cols) {
  if (!rows.length) return `<div class="empty">None yet.</div>`;
  const idK = SCHEMA[sheet].id;
  return `<div class="table-wrap"><table><thead><tr>${cols.map(c => `<th>${c[0]}</th>`).join("")}<th>Approval</th><th>Standards</th><th></th></tr></thead><tbody>${rows.map(r => `<tr><td class="mono">${esc(r[idK])}</td>${cols.slice(1).map(c => `<td${c[2] ? ' class="mono"' : ""}>${c[1](r)}</td>`).join("")}<td>${obChip(r.ApprovalStatus)}</td><td>${obIssBadge(obIss(sheet, r))}</td><td style="white-space:nowrap"><button class="icon-btn ob-edit" data-act="edit" data-sheet="${sheet}" data-v="${esc(r[idK])}" title="Edit">✎</button><button class="icon-btn" data-act="viz" data-v="${esc(r.TypeName || baseTypeName(r.ReturnType) || "")}" title="Show in the visualizer">◎</button><button class="icon-btn" data-act="del" data-sheet="${sheet}" data-v="${esc(r[idK])}" title="Delete">✕</button></td></tr>`).join("")}</tbody></table></div>`;
}
const obEntSelect = id => `<select id="${id}">${obEnts().map(e => `<option value="${esc(e.EntityID)}">${esc(e.EntityID)} · ${esc(e.Name || "")}</option>`).join("")}</select>`;
function obStepTypes() {
  const w = ob(), rows = obRows("Schema").slice().sort((a, b) => OB_KIND_ORDER.indexOf(a.Kind) - OB_KIND_ORDER.indexOf(b.Kind));
  let h = obH(3, `Types & entities of ${w.app}`, "Define the subgraph's schema: its <b>@key entities</b> (Key), value types, inputs and enums. If it references or extends an entity owned by another application, add a <b>Reference</b> or <b>Extend</b> row so the router can join them by <span class=\"mono\">@key</span>. ✎ opens the field editor with a live SDL preview and standards check; the visualizer on the right redraws as you save.");
  const groups = OB_KIND_ORDER.map(k => [k, rows.filter(r => r.Kind === k)]).filter(([, l]) => l.length);
  h += groups.map(([k, l]) => `<div class="kv">${esc(k)} <span class="hint">· ${esc(OB_KIND_HINT[k] || "")}</span></div>${obRowTable("Schema", l, [["SchemaID"], ["Type", r => `<b>${esc(r.TypeName)}</b>`, 1], ["Entity", r => esc(r.EntityID)], ["Fields", r => String((defFields(r.Definition, r.Kind) || []).length || enumValues(r.Definition).length || "")]])}`).join("") || `<div class="empty">No types yet. Start with the @key entity.</div>`;
  h += `<div class="ob-form" style="margin-top:12px"><label>Entity${obEntSelect("obTEnt")}</label><label>Kind<select id="obTKind">${["Key", "Type", "Input", "Enum", "Interface", "Scalar"].map(k => `<option>${k}</option>`).join("")}</select></label><label>Type name<input id="obTName" placeholder="PascalCase" /></label><button class="primary" data-act="add-type">＋ Add type</button></div>`;
  const sugg = obEnts().flatMap(e => borrowSuggestions(e.EntityID).map(s => ({ ...s, ent: e.EntityID })));
  const others = [...new Set(DB.Schema.filter(r => isKeyRow(r) && !isBorrowRow(r) && !obIds().has(r.EntityID)).map(r => r.TypeName))].sort();
  h += `<div class="kv">Borrow an entity from another application</div>${sugg.length ? `<div class="wz-chips">${sugg.map(s => `<span class="wz-chip" data-act="borrow" data-v="${esc(s.name)}" data-ent="${esc(s.ent)}" title="Referenced but owned by ${esc(s.ownerSg)}">＋ ${esc(s.name)} <span class="hint">from ${esc(s.ownerSg)}</span></span>`).join("")}</div>` : ""}
    <div class="ob-form"><label>Entity${obEntSelect("obBEnt")}</label><label>Other application's entity<select id="obBName">${others.map(n => `<option>${esc(n)}</option>`).join("")}</select></label><label>Mode<select id="obBMode"><option value="reference">Reference (key stub)</option><option value="extend">Extend (add fields)</option></select></label><button data-act="borrow-form">＋ Add</button></div>`;
  return h;
}
function obStepOps(sheet) {
  const w = ob(), q = sheet === "Queries", rows = obRows(sheet);
  let h = obH(q ? 4 : 5, `${q ? "Queries" : "Mutations"} of ${w.app}`, q ? "Root <b>Query</b> fields this subgraph serves: usually a lookup of its @key entity and list / search queries. Each returns one of its types; arguments are one <span class=\"mono\">name: Type</span> per line. Add the auth scope that guards it." : "Root <b>Mutation</b> fields: writes take a single <span class=\"mono\">…Input</span> argument and return the changed entity. Skip this step if the application is read-only.");
  h += obRowTable(sheet, rows, [[SCHEMA[sheet].id], [q ? "Query" : "Mutation", r => `<b>${esc(r.Name)}</b>`, 1], ["Parameters", r => esc(String(r.Parameters || "").replace(/\n/g, ", ")), 1], ["Returns", r => esc(r.ReturnType), 1], ["Auth scopes", r => esc(r.AuthScopes), 1]]);
  h += `<div class="ob-form" style="margin-top:12px"><label>Entity${obEntSelect("obOEnt")}</label><label>${q ? "Query" : "Mutation"} name<input id="obOName" placeholder="${q ? "loyaltyAccount" : "createLoyaltyAccount"}" /></label><button class="primary" data-act="add-op" data-sheet="${sheet}">＋ Add ${q ? "query" : "mutation"}</button></div>`;
  return h;
}
function obStepScopes() {
  const w = ob(), rows = obRows("AuthScopes"), used = {};
  for (const s of ["Queries", "Mutations"]) for (const r of obRows(s)) String(r.AuthScopes || "").split(/[\s,]+/).filter(Boolean).forEach(sc => (used[sc] = used[sc] || []).push(r.Name));
  const scopes = [...new Set([...Object.keys(used), ...rows.map(r => r.Scope)])].filter(Boolean).sort();
  let h = obH(6, `Auth scopes of ${w.app}`, "Which personas may call the operations. One row per <b>scope × persona</b> with the permission it grants; a scope with no rows grants no access. Scopes used by this application's operations but not defined yet are flagged.");
  h += scopes.length ? `<div class="table-wrap"><table><thead><tr><th>Scope</th><th>Used by</th>${PERSONAS.map(p => `<th>${esc(p)}</th>`).join("")}</tr></thead><tbody>${scopes.map(sc => `<tr><td class="mono"><b>${esc(sc)}</b>${used[sc] && !rows.some(r => r.Scope === sc) ? ' <span class="val-badge sev-warning" title="Used by an operation but not defined">undefined</span>' : ""}</td><td class="mono">${esc((used[sc] || []).join(", "))}</td>${PERSONAS.map(p => { const r = rows.find(x => x.Scope === sc && x.Persona === p); return `<td>${r ? `<span class="ob-grant" title="${esc(r.Permission || "")}">✓ ${esc(String(r.Permission || "").slice(0, 24))}</span> <button class="icon-btn" data-act="del" data-sheet="AuthScopes" data-v="${esc(r.ScopeID)}" title="Remove">✕</button>` : `<button class="icon-btn ob-add" data-act="grant" data-v="${esc(sc)}" data-p="${esc(p)}" title="Grant ${esc(sc)} to ${esc(p)}">＋</button>`}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div>` : `<div class="empty">No scopes yet. Add them to the operations (✎) or below.</div>`;
  h += `<div class="ob-form" style="margin-top:12px"><label>Entity${obEntSelect("obSEnt")}</label><label>Scope<input id="obSScope" placeholder="loyalty:read" list="obScopeList" /></label><datalist id="obScopeList">${scopes.map(s => `<option value="${esc(s)}">`).join("")}</datalist><label>Persona<select id="obSPersona">${PERSONAS.map(p => `<option>${p}</option>`).join("")}</select></label><label>Permission<input id="obSPerm" placeholder="Read own account" /></label><button class="primary" data-act="add-scope">＋ Grant</button></div>`;
  return h;
}
function obStepReview() {
  const w = ob(), c = obCounts(), list = [];
  for (const s of ["Schema", "Queries", "Mutations"]) for (const r of obRows(s)) for (const v of obIss(s, r)) list.push({ s, r, v });
  list.sort((a, b) => (SEVERITY_RANK[b.v.severity] || 0) - (SEVERITY_RANK[a.v.severity] || 0));
  let h = obH(7, `Review & propose ${w.app}`, "Every row of this application is checked against the FedGQL schema standards (and against the rest of the registry for federation rules). Fix the errors (✎), then move its Draft rows to <b>Proposed</b> for the approval flow. The subgraph SDL below is what the router will compose.");
  h += `<div class="selrow"><span>${c.err ? `<span class="val-badge sev-error">${c.err} errors</span>` : '<span class="ob-ok">✓ no errors</span>'} ${c.warn ? `<span class="val-badge sev-warning">${c.warn} warnings</span>` : ""} ${Object.entries(c.st).map(([k, v]) => `${obChip(k)} ${v}`).join(" ")}</span>
    <button class="primary" data-act="propose"${c.err || !c.drafts ? " disabled" : ""}>Propose ${c.drafts} Draft row${c.drafts === 1 ? "" : "s"}</button><button data-act="unpropose"${c.st.Proposed ? "" : " disabled"}>Back to Draft</button></div>`;
  h += list.length ? `<div class="ob-issues">${list.slice(0, 60).map(({ s, r, v }) => `<div class="val-item sev-${v.severity}"><span class="sev-dot"></span><code>${esc(v.ruleId)}</code> <b class="mono">${esc(r.TypeName || r.Name)}</b> ${esc(v.subject)}${esc(v.message)} <button class="icon-btn ob-edit" data-act="edit" data-sheet="${s}" data-v="${esc(r[SCHEMA[s].id])}" title="Edit">✎</button></div>`).join("")}</div>` : "";
  h += obEnts().map(e => `<div class="code-head"><h3>Subgraph SDL — ${esc(e.EntityID)} ${esc(e.Name || "")}</h3><button class="copy-btn" data-act="copy-sdl" data-v="${esc(e.EntityID)}">Copy</button></div><pre class="code" style="max-height:34vh">${highlightSDL(buildSubgraphSDL(e) || "# no rows yet")}</pre>`).join("");
  return h;
}
function obStepSave() {
  const w = ob(), cur = w.savedSig === obSig();
  let h = obH(8, `Save & publish ${w.app}`, "The proposal lives in this browser until you save it. Export the whole registry (every application, with dropdowns) or push it to the shared SharePoint / Google Drive workbook; reviewers then approve the Proposed rows. Editing the application again makes this step pending until you save once more.");
  h += `<div class="selrow"><button class="primary" data-act="export">💾 Export registry (.xlsx)</button><button data-act="push">Save &amp; push to ${esc(SYNC_TARGETS[syncTarget] ? SYNC_TARGETS[syncTarget].label || syncTarget : "SharePoint")}</button>
    <span class="hint">${cur && w.savedAt ? `${esc(w.savedHow)} ${esc(new Date(w.savedAt).toLocaleString())}` : w.savedAt ? "Changed since the last save." : "Not saved yet."}</span></div>`;
  if (cur && w.savedAt) h += `<div class="pattern-ok">✅ <b>${esc(w.app)}</b> is proposed and saved. Approve its rows in the Registry tab (Approval Status → Approved). Click <b>Onboard another application</b> to continue.</div>`;
  return h;
}

/* ------------------------------ actions -------------------------------- */
function obNewRow(sheet, vals) { const r = {}; SCHEMA[sheet].cols.forEach(c => r[c.key] = ""); Object.assign(r, { ApprovalStatus: "Draft" }, vals); return r; }
function obFind(sheet, id) { const k = SCHEMA[sheet].id; return DB[sheet].find(r => r[k] === id); }
function obAddApp() {
  const app = val("obNewApp").trim(), name = val("obNewEnt").trim().replace(/[^A-Za-z0-9_]/g, "");
  if (!app || !name) { alert("Enter the business application and its entity name."); return; }
  if (obApps().some(a => a.toLowerCase() === app.toLowerCase())) { alert(`"${app}" already exists — pick it from the list.`); return; }
  DB.Entities.push(obNewRow("Entities", { EntityID: nextId("Entities"), Name: cap(name), ExperienceDomain: val("obNewDom").trim(), BusinessApplication: app, ServiceType: val("obNewSvc"), BusinessCapability: val("obNewCap").trim(), Description: val("obNewDesc").trim() }));
  obSetApp(app); save(); renderAll(); toast(`Added ${app}`);
}
function obAddType() {
  const ent = val("obTEnt"), kind = val("obTKind"), name = val("obTName").trim().replace(/[^A-Za-z0-9_]/g, "");
  if (!ent || !name) { alert("Enter the type name."); return; }
  if (DB.Schema.some(r => r.EntityID === ent && String(r.TypeName).trim() === name)) { alert(`${name} already exists in ${ent}.`); return; }
  const row = obNewRow("Schema", { SchemaID: nextId("Schema", ent), EntityID: ent, Kind: kind, TypeName: cap(name), Definition: OB_DEF[kind] || "" });
  DB.Schema.push(row); save(); renderAll(); openRowEditor("Schema", row);
}
function obAddOp(sheet) {
  const ent = val("obOEnt"), name = val("obOName").trim().replace(/[^A-Za-z0-9_]/g, "");
  if (!ent || !name) { alert("Enter the operation name."); return; }
  if (DB[sheet].some(r => r.Name === name)) { alert(`${name} already exists in the registry.`); return; }
  const n = name.charAt(0).toLowerCase() + name.slice(1);
  const row = obNewRow(sheet, { [SCHEMA[sheet].id]: nextId(sheet, ent), EntityID: ent, Name: n, ReturnType: primaryTypeOf(ent), Parameters: sheet === "Mutations" ? `input: ${cap(n)}Input!` : "id: ID!" });
  DB[sheet].push(row); save(); renderAll(); openRowEditor(sheet, row);
}
function obGrant(scope, persona, ent, perm) {
  if (!scope) { alert("Enter the scope."); return; }
  if (DB.AuthScopes.some(r => r.Scope === scope && r.Persona === persona && obIds().has(r.EntityID))) return;
  DB.AuthScopes.push(obNewRow("AuthScopes", { ScopeID: nextId("AuthScopes", ent), EntityID: ent || [...obIds()][0], Scope: scope, Persona: persona, Permission: perm || "" }));
  save(); renderAll();
}
function obSetStatus(from, to) {
  let n = 0; for (const s of ["Entities", "Schema", "Queries", "Mutations", "AuthScopes"]) for (const r of (s === "Entities" ? obEnts() : obRows(s))) if ((r.ApprovalStatus || "Draft") === from) { r.ApprovalStatus = to; n++; }
  save(); renderAll(); toast(`${n} row(s) → ${to}`);
}
function obMarkSaved(how) { const w = ob(); w.savedSig = obSig(); w.savedAt = new Date().toISOString(); w.savedHow = how; obSave(); obRender(); }

/* ------------------------- Migration overview --------------------------- */
function obOvBuild(host) {
  host.innerHTML = `<div class="ov">
    <div class="ov-node ov-src" data-node="src" data-go="0" title="Step 1: the registry (all applications)"><h3>GQL Registry</h3><div class="ov-sub">all business applications</div>
      ${onbItem("table", "Applications", "apps")}${onbItem("key", "Entities", "ents")}${onbItem("graph", "Types · operations", "all")}</div>
    ${onbConn([["e1", "M0 50H40", 50]])}
    <div class="ov-node ov-hub" data-node="hub" data-go="1" title="Step 2: the application being onboarded"><h3>${ONB_ICON.app} Onboarding guide</h3><div class="ov-sub">one business application at a time</div>
      <div class="ov-core">${ONB_ICON.graph}<b data-slot="core">pick an app</b></div>
      ${onbStepsHTML(OB_STEPS, OB_STEP_ICON)}
      <div class="ov-blue">Subgraph proposal<span class="mono" data-slot="blue"></span></div></div>
    ${onbConn([["e2a", "M0 50H20V25H40", 25], ["e2b", "M0 50H20V75H40", 75]])}
    <div class="ov-col">
      <div class="ov-node" data-node="schema" data-go="2" title="Step 3: types & entities"><h3>Schema</h3><div class="ov-sub">types of the subgraph</div>
        ${onbItem("key", "@key entities", "keys")}${onbItem("layers", "Types · inputs · enums", "types")}${onbItem("swap", "References · extends", "borrow")}</div>
      <div class="ov-node" data-node="ops" data-go="3" title="Steps 4–6: queries, mutations, auth scopes"><h3>Operations</h3><div class="ov-sub">what clients can call</div>
        ${onbItem("query", "Queries", "q")}${onbItem("write", "Mutations", "m")}${onbItem("check", "Auth scopes", "scopes")}</div>
    </div>
    ${onbConn([["e3", "M0 25H20V50H40", 50], ["e3", "M0 75H20V50H40"]])}
    <div class="ov-node ov-tgt" data-node="tgt" data-go="6" title="Steps 7–8: review, propose, save"><h3>Supergraph proposal</h3><div class="ov-sub">reviewed · proposed · published</div>
      ${onbItem("diff", "Standards check", "std")}${onbItem("pick", "Proposed for approval", "prop")}${onbItem("save", "Saved / pushed", "saved")}${onbItem("router", "Composes into the supergraph", "router")}</div>
  </div>`;
  onbWire(host, obGo);
}
function obOverview() {
  const host = document.getElementById("obOverview"); if (!host) return;
  if (!host.firstElementChild) obOvBuild(host);
  const w = ob(), d = obDone(), step = w.step, has = !!w.app && obEnts().length > 0, c = has ? obCounts() : null;
  const S = { src: [d[0], step === 0], hub: [d[1], step === 1], schema: [d[2], step === 2], ops: [d[5], step >= 3 && step <= 5], tgt: [d[7], step >= 6] };
  onbStages(host, S, OB_OV_PREV);
  onbEdge(host, "e1", onbFlow(S, "src", "hub")); onbEdge(host, "e2a", onbFlow(S, "hub", "schema")); onbEdge(host, "e2b", onbFlow(S, "hub", "ops", d[2])); onbEdge(host, "e3", onbFlow(S, "ops", "tgt", step >= 6));
  onbSteps(host, d, step);
  const it = (slot, txt, ok, pick) => onbItemSet(host, slot, txt, ok, pick);
  it("apps", `${obApps().length} applications`, d[0]); it("ents", `${DB.Entities.length} entities`, d[0]); it("all", `${DB.Schema.length} types · ${DB.Queries.length + DB.Mutations.length} operations`, d[0]);
  onbSlot(host, "core", w.app || "pick an app");
  const sch = has ? obRows("Schema") : [], kinds = k => sch.filter(r => k.includes(r.Kind)).length;
  onbSlot(host, "blue", has ? `${w.app} (${obEnts().map(e => e.EntityID).join(", ")}) → ${sch.length} types · ${obRows("Queries").length} Q · ${obRows("Mutations").length} M` : "pick a business application");
  it("keys", has ? String(kinds(["Key"])) : "", has && kinds(["Key"]) > 0); it("types", has ? String(kinds(["Type", "Input", "Enum", "Interface", "Scalar"])) : "", d[2]); it("borrow", has ? String(kinds(["Reference", "Extend"])) : "", d[2] && kinds(["Reference", "Extend"]) > 0);
  it("q", has ? String(obRows("Queries").length) : "", d[3]); it("m", has ? String(obRows("Mutations").length) : "", d[4]); it("scopes", has ? String(obRows("AuthScopes").length) : "", d[5]);
  it("std", c ? (c.err ? `${c.err} errors · ${c.warn} warnings` : `no errors · ${c.warn} warnings`) : "", c && c.err === 0 && c.rows > 0);
  it("prop", c ? `${c.st.Proposed || 0} proposed · ${c.drafts} draft` : "", d[6]);
  it("saved", w.savedAt && w.savedSig === obSig() ? `${w.savedHow} ${new Date(w.savedAt).toLocaleTimeString()}` : "", d[7]);
  it("router", d[7] ? "after approval" : "", false);
}

/* ------------------------- Visualizer drawer ---------------------------- */
// The registry's one schema visualizer (Federated Graph → Visualization) is moved into the drawer while
// the guide is open, and back when Federated Graph is opened, so every control and the click-to-edit
// side panel keep working.
const obVizParts = () => [document.querySelector(".viz-bar"), document.getElementById("vizWrap")];
function obMountViz() { const body = document.getElementById("obVizBody"); if (!body) return; const [bar, wrap] = obVizParts(); if (wrap && wrap.parentElement !== body) { body.append(bar, wrap); VIZ.fitPending = true; } }
function obUnmountViz() { const pane = document.getElementById("vizPane"), [bar, wrap] = obVizParts(); if (pane && wrap && wrap.parentElement !== pane) { pane.append(bar, wrap); VIZ.fitPending = true; } }
function obDrawerState() { try { return Object.assign({ open: true, w: 46, only: false, follow: true }, JSON.parse(localStorage.getItem(OB_DRAWER)) || {}); } catch (_) { return { open: true, w: 46, only: false, follow: true }; } }
function obDrawerSave(s) { try { localStorage.setItem(OB_DRAWER, JSON.stringify(s)); } catch (_) {} }
function obDrawerSync() {
  const s = obDrawerState(), dr = document.getElementById("obDrawer"), view = document.getElementById("view-guide"); if (!dr) return;
  const active = view.classList.contains("active");
  dr.classList.toggle("open", s.open); view.style.setProperty("--obw", s.w + "%");
  document.getElementById("obVizOnly").checked = s.only; document.getElementById("obVizFollow").checked = s.follow;
  document.getElementById("obVizApp").textContent = ob().app || "the application";
  if (!active) return;
  obMountViz();
  VIZ.hiSg = ob().app; VIZ.sg = s.only && ob().app ? ob().app : (VIZ.sg === ob().app && !s.only ? "" : VIZ.sg);
  if (s.open) obRenderViz();
}
// Redraw the visualizer; outline the onboarding application's types and flash the ones an edit changed.
function obRenderViz() {
  if (!document.getElementById("vizCanvas")) return;
  if (VIZ.root === "Query" && !VIZ.obRootSet) { VIZ.root = "All"; VIZ.obRootSet = true; }   // new types show before any query uses them
  renderViz();
  const L = VIZ.layout; if (!L) return;
  const sigs = {}; for (const [n, c] of Object.entries(L.cards)) sigs[n] = c.T.kind + "|" + c.T.items.map(it => `${it.name}:${it.type}${it.args ? JSON.stringify(it.args.map(a => a.type)) : ""}`).join(",");
  const changed = OB_VIZ_SIGS && OB_DATA_CHANGED ? Object.keys(sigs).filter(n => OB_VIZ_SIGS[n] !== sigs[n]) : [];
  OB_VIZ_SIGS = sigs; OB_DATA_CHANGED = false;
  const app = ob().app, svg = document.querySelector("#vizCanvas svg"); if (!svg) return;
  svg.querySelectorAll("g.node").forEach(g => {
    const c = L.cards[g.dataset.t]; if (!c) return;
    g.classList.toggle("ob-mine", !!app && c.T.sgs.has(app));
    g.querySelectorAll("rect.row").forEach(r => { const it = c.rows[+r.dataset.i]; r.classList.toggle("ob-mine-row", !!app && !!it && it.sgs && it.sgs.has(app)); });
    if (changed.includes(g.dataset.t)) g.classList.add("ob-changed");
  });
  if (changed.length && obDrawerState().follow) vizCenterOn(changed[0]);
}

/* ------------------------------ wiring --------------------------------- */
function obInit() {
  const root = document.getElementById("view-guide"); if (!root) return;
  VIZ.hiSg = ob().app;
  // Re-render the guide (and the drawer's visualizer) after every registry change.
  const baseRenderAll = renderAll;
  window.renderAll = function () { baseRenderAll.apply(this, arguments); OB_DATA_CHANGED = true; if (root.classList.contains("active")) obRender(); };
  document.getElementById("nav").addEventListener("click", e => {
    const b = e.target.closest("button[data-view]"); if (!b) return;
    document.body.classList.toggle("guide-on", b.dataset.view === "guide");
    if (b.dataset.view === "guide") { obRender(); }
    else { obUnmountViz(); if (b.dataset.view === "graph" && graphView === "viz") renderViz(); }
  });
  document.getElementById("obSteps").addEventListener("click", e => { const li = e.target.closest("li[data-step]"); if (li) obGo(+li.dataset.step); });
  document.getElementById("obBack").onclick = () => obGo(ob().step - 1);
  document.getElementById("obNext").onclick = () => {
    const w = ob(), flag = { 2: "typesOk", 3: "queriesOk", 4: "mutationsOk", 5: "scopesOk" }[w.step];
    if (flag) { w[flag] = true; obSave(); return obGo(w.step + 1); }
    if (w.step === OB_STEPS.length - 1) { w.step = 1; obSave(); return obRender(); }
    obGo(w.step + 1);
  };
  // top band / work area layout, toolbar collapse, overview toggle, drag bar (shared: onboarding.js)
  onbLayout({ root, top: document.getElementById("obTop"), split: document.getElementById("obHSplit"), ovBtn: document.getElementById("obOvToggle"), chromeBtn: document.getElementById("chromeToggle"), key: "wb-onb", onChange: () => { if (VIZ.layout) vizFit(); } });
  const body = document.getElementById("obBody");
  body.addEventListener("click", e => {
    const el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
    const a = el.dataset.act, v = el.dataset.v, sheet = el.dataset.sheet;
    if (a === "load") document.getElementById("fileInput").click();
    else if (a === "example") document.getElementById("seedBtn").click();
    else if (a === "template") document.getElementById("templateBtn").click();
    else if (a === "pick-app") { obSetApp(v); OB.step = 1; obSave(); obRender(); }
    else if (a === "new-app") obAddApp();
    else if (a === "add-ent") { const n = val("obAddEnt").trim().replace(/[^A-Za-z0-9_]/g, ""); if (!n) return; const e0 = obEnts()[0] || {}; DB.Entities.push(obNewRow("Entities", { EntityID: nextId("Entities"), Name: cap(n), ExperienceDomain: e0.ExperienceDomain || "", BusinessApplication: ob().app, ServiceType: e0.ServiceType || "", BusinessCapability: e0.BusinessCapability || "" })); save(); renderAll(); }
    else if (a === "add-type") obAddType();
    else if (a === "add-op") obAddOp(sheet);
    else if (a === "edit") { const r = obFind(sheet, v); if (r) openRowEditor(sheet, r); }
    else if (a === "del") { const r = obFind(sheet, v); if (r && confirm(`Delete ${v}?`)) { DB[sheet].splice(DB[sheet].indexOf(r), 1); save(); renderAll(); } }
    else if (a === "viz") { const s = obDrawerState(); if (!s.open) { s.open = true; obDrawerSave(s); obDrawerSync(); } if (VIZ.layout && VIZ.layout.cards[v]) vizGo(v); else toast(`${v} isn't on the canvas: set Viewing to All types`); }
    else if (a === "borrow") { addBorrowRow(el.dataset.ent, { name: v, mode: "reference" }); renderAll(); }
    else if (a === "borrow-form") { addBorrowRow(val("obBEnt"), { name: val("obBName"), mode: val("obBMode") }); renderAll(); }
    else if (a === "grant") obGrant(v, el.dataset.p, [...obIds()][0], "");
    else if (a === "add-scope") obGrant(val("obSScope").trim(), val("obSPersona"), val("obSEnt"), val("obSPerm").trim());
    else if (a === "propose") { const c = obCounts(); if (c.warn && !confirm(`${c.warn} standards warning(s) remain. Propose anyway?`)) return; obSetStatus("Draft", "Proposed"); }
    else if (a === "unpropose") obSetStatus("Proposed", "Draft");
    else if (a === "copy-sdl") { const e2 = index("Entities")[v]; if (e2) copyText(buildSubgraphSDL(e2)); }
    else if (a === "export") { const name = exportWorkbook(); obMarkSaved("exported " + name); }
    else if (a === "push") { openPush(); obMarkSaved("pushed"); }
  });
  body.addEventListener("change", e => {
    const tr = e.target.closest("tr[data-ent]"), f = e.target.dataset.f; if (!tr || !f) return;
    const ent = index("Entities")[tr.dataset.ent]; if (ent) { ent[f] = e.target.value.trim(); save(); renderAll(); }
  });
  // drawer: open / close, resize, scope + follow toggles
  const dr = document.getElementById("obDrawer"), view = root;
  document.getElementById("obDrawerToggle").onclick = () => { const s = obDrawerState(); s.open = !s.open; obDrawerSave(s); obDrawerSync(); if (s.open) { VIZ.fitPending = true; setTimeout(() => { obRenderViz(); }, 320); } };
  document.getElementById("obVizOnly").onchange = e => { const s = obDrawerState(); s.only = e.target.checked; obDrawerSave(s); VIZ.sg = s.only ? ob().app : ""; VIZ.fitPending = true; obRenderViz(); };
  document.getElementById("obVizFollow").onchange = e => { const s = obDrawerState(); s.follow = e.target.checked; obDrawerSave(s); };
  document.getElementById("obVizFitBtn").onclick = () => vizFit();
  const grip = document.getElementById("obGrip");
  grip.addEventListener("pointerdown", ev => {
    ev.preventDefault(); grip.setPointerCapture(ev.pointerId); dr.classList.add("resizing");
    const W = view.getBoundingClientRect(), move = e2 => { const pct = Math.min(75, Math.max(28, 100 * (W.right - e2.clientX) / W.width)); view.style.setProperty("--obw", pct.toFixed(1) + "%"); };
    const up = e2 => { grip.removeEventListener("pointermove", move); grip.removeEventListener("pointerup", up); dr.classList.remove("resizing"); const s = obDrawerState(); s.w = parseFloat(view.style.getPropertyValue("--obw")) || s.w; obDrawerSave(s); vizFit(); };
    grip.addEventListener("pointermove", move); grip.addEventListener("pointerup", up);
  });
  window.addEventListener("resize", () => { if (view.classList.contains("active")) obDrawerSync(); });
  document.body.classList.toggle("guide-on", root.classList.contains("active"));
  obRender();
}

obInit();   // last: the constants above must be initialised first
