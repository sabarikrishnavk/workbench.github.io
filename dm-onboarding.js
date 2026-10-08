/* dm-onboarding.js — "Onboarding guide" tab of data-mapping.html (the Data Mapping Registry).
   Onboards ONE business domain → ONE business application at a time into the shared registry:
     1 domain & its business terms → 2 business application → 3 datasets & their types (DB table / collection,
     CSV, JSON, Kafka event, REST, GQL, MDM / PIM / ERP integration objects, UI …) → 4 attributes tagged with
     business terms → 5 integration mapping with applications in any domain (flows + attribute mappings)
     → 6 lineage across applications, business terms, flows and datasets → 7 export the schemas and save the
     work as Excel (.xlsx) and Markdown (.md).
   While the guide is open, the lineage visualizer slides in on the right (a resizable drawer, like
   workbench.html's schema visualizer): it outlines the application being onboarded, follows the step you are
   on, and flashes what an edit just changed. Reuses data-mapping.html's globals (DB, DM, applyField, lineage,
   traceTerm, generate, writeWorkbook, …) and the shared overview helpers in onboarding.js. */

const DG_STEPS = [
  { k: "domain", t: "Domain & business terms" },
  { k: "app", t: "Business application" },
  { k: "datasets", t: "Datasets & types" },
  { k: "attrs", t: "Attributes & terms" },
  { k: "integ", t: "Integration mapping" },
  { k: "lineage", t: "Lineage" },
  { k: "export", t: "Export & save" },
];
const DG_STEP_ICON = ["domain", "app", "table", "key", "swap", "router", "save"];
const DG_LS = "dm-onb-v1", DG_DRAWER = "dm-onb-drawer-v1";
// Dataset types in plain words → the registry's numbered Kind.
const DG_TYPES = [["DB table", "01-DB Table"], ["DB collection", "02-DB Collection"], ["CSV file", "03-CSV Schema"], ["JSON file", "04-JSON Schema"], ["Kafka event", "05-Kafka Event"],
  ["HTTP request (REST / GraphQL)", "06-HTTP Request"], ["HTTP response (REST / GraphQL)", "07-HTTP Response"], ["GQL type", "08-GQL Type"],
  ["MDM entity", "09-MDM Entity"], ["PIM entity", "10-PIM Entity"], ["ERP object", "11-ERP Object"], ["Search index", "12-Search Index"], ["UI component", "13-UI Component"], ["UI form", "14-UI Form"], ["Databricks table", "15-Databricks Table"], ["Other", "16-Other"]];
const DG_FORMAT = { "DB Table": "SQL", "DB Collection": "BSON", "CSV Schema": "CSV", "JSON Schema": "JSON", "Kafka Event": "Avro", "HTTP Request": "JSON", "HTTP Response": "JSON", "GQL Type": "GraphQL", "Search Index": "JSON", "UI Component": "JSX props", "UI Form": "JSX props", "Databricks Table": "Delta" };
const DG_DOM_COLORS = ["#2563eb", "#0d9488", "#c2410c", "#7048e8", "#db2777", "#059669", "#b45309", "#0891b2", "#9333ea", "#64748b"];
const DG_FMT = { auto: "Auto (by dataset type)", avro: "Avro", json: "JSON Schema", sdl: "GraphQL SDL", ddl: "SQL DDL", ts: "TypeScript", sttm: "Mapping spec (STTM)" };
const DG_EXT = { avro: "avsc", json: "schema.json", sdl: "graphql", ddl: "sql", ts: "ts", sttm: "md" };
const DG_LANG = { avro: "json", json: "json", sdl: "graphql", ddl: "sql", ts: "ts", sttm: "" };
const DG_SCOPES = { all: "Everything", domain: "Domain", app: "Application", term: "Business term", flow: "Integration flow", dataset: "Dataset" };
const DG_LEVELS = { app: "Applications", dataset: "Datasets", attr: "Attributes" };
let DG = null, DG_OV_PREV = {}, DG_CHANGED = new Set();
const DGV = { view: null, lay: null, sig: "", pan: null };
const ea = s => esc(s).replace(/"/g, "&quot;");          // esc() for attribute values

/* ------------------------------ state ---------------------------------- */
function dg() {
  const d = { step: 0, dom: "", app: "", ds: "", flow: "", srcDs: "", tgtDs: "", nf: { dir: "out", dom: "", app: "", pattern: "REST API", mw: "", freq: "" },
    lin: { level: "app", scope: "app", id: "" }, lineageOk: false, savedAt: "", exp: { scope: "app", fmt: "auto", name: "" } };
  if (!DG) { try { DG = JSON.parse(localStorage.getItem(DG_LS)) || {}; } catch (_) { DG = {}; } }
  for (const k in d) if (!(k in DG)) DG[k] = d[k];
  return DG;
}
function dgSave() { try { localStorage.setItem(DG_LS, JSON.stringify(DG)); } catch (_) {} }
const dgNorm = s => S(s).toLowerCase();
const dgDom = () => domById(dg().dom) || null;
const dgApp = () => { const a = appById(dg().app); return a && a.DomainID === dg().dom ? a : null; };
// A term belongs to a domain when its Domain is the domain's name, ID, code or the first word of its name ("Cart" ↔ "Cart & Checkout").
const termsOfDom = d => d ? DB.BusinessTerms.filter(t => [d.Name, d.DomainID, d.Code, S(d.Name).split(/[\s&/,-]+/)[0]].some(x => S(x) && dgNorm(x) === dgNorm(t.Domain))) : [];
const appsOfDom = id => DB.Applications.filter(a => a.DomainID === id);
const dsOfApp = id => DB.Datasets.filter(d => d.AppID === id);
const flowsOfApp = id => DB.Flows.filter(f => f.SourceAppID === id || f.TargetAppID === id);
const domOfApp = id => (appById(id) || {}).DomainID || "";
const domName = id => (domById(id) || {}).Name || id || "no domain";
const isCross = f => domOfApp(f.SourceAppID) !== domOfApp(f.TargetAppID);
const mapsOfFlow = id => DB.Mappings.filter(m => m.FlowID === id);
const dgDomColor = id => DG_DOM_COLORS[Math.max(0, DB.Domains.findIndex(d => d.DomainID === id)) % DG_DOM_COLORS.length];
const dgRow = (sheet, rid) => DB[sheet].find(r => r._id === rid);
function dgNewRow(sheet, preset) { const row = { _id: uid() }; DM[sheet].cols.forEach(c => row[c.key] = ""); if (DM[sheet].id) row[DM[sheet].id] = nextId(sheet); if ("Status" in row) row.Status = "Draft"; return Object.assign(row, preset || {}); }
function dgDone() {
  const d = dgDom(), a = dgApp(), w = dg(), ds = a ? dsOfApp(a.AppID) : [];
  const attrs = ds.length > 0 && ds.every(x => attrsOf(x.DatasetID).length);   // tagging with business terms is optional
  const integ = !!a && flowsOfApp(a.AppID).some(f => f.SourceAppID !== f.TargetAppID);
  return [!!d, !!a, ds.length > 0, attrs, integ, integ && w.lineageOk, !!w.savedAt];
}
const dgPct = () => Math.round(100 * dgDone().filter(Boolean).length / DG_STEPS.length);
function dgCanVisit(i) { const d = dgDone(); for (let j = 0; j < i; j++) if (!d[j]) return false; return true; }
function dgGo(i) { if (i < 0 || i >= DG_STEPS.length || !dgCanVisit(i)) return; dg().step = i; dgSave(); dgRender(); const m = document.getElementById("dgMain"); if (m) m.scrollTop = 0; }
// What an edit touched, so the lineage drawer can flash it.
function dgChanged(sheet, row) {
  const add = x => x && DG_CHANGED.add(x);
  if (sheet === "Applications") add(row.AppID);
  else if (sheet === "Datasets") { add(row.DatasetID); add(row.AppID); }
  else if (sheet === "Attributes") { add(row.DatasetID); add(akey(row.DatasetID, row.Path)); add((dsById(row.DatasetID) || {}).AppID); }
  else if (sheet === "Flows") { add(row.SourceAppID); add(row.TargetAppID); }
  else if (sheet === "Mappings") { add(row.SourceDatasetID); add(row.TargetDatasetID); add(akey(row.TargetDatasetID, row.TargetPath)); }
}

/* ------------------------------ render --------------------------------- */
const dgH = (n, title, desc) => `<h2>Step ${n} of ${DG_STEPS.length} · ${esc(title)}</h2><p class="desc">${desc}</p>`;
// Full render, or soft = everything except the step body (keeps focus while editing a table).
function dgRender(soft) {
  const root = document.getElementById("view-guide"); if (!root || currentView !== "guide") return;
  const w = dg(), done = dgDone(), pct = dgPct();
  if (w.step > 0 && !dgCanVisit(w.step)) w.step = Math.max(0, done.indexOf(false));
  document.getElementById("dgBarFill").style.width = pct + "%";
  onbPct(document.getElementById("dgPct"), pct);
  const d = dgDom(), a = dgApp();
  document.getElementById("dgTopApp").textContent = a ? `· ${a.Name} (${d ? d.Name : ""})` : d ? `· ${d.Name} domain` : "· one application at a time";
  document.getElementById("dgSteps").innerHTML = DG_STEPS.map((s, i) => `<li class="${done[i] ? "done" : ""}${i === w.step ? " cur" : ""}${dgCanVisit(i) ? "" : " locked"}" data-step="${i}" title="${ea(s.t)}">${esc(s.t)}</li>`).join("");
  const ds = a ? dsOfApp(a.AppID) : [], fl = a ? flowsOfApp(a.AppID).filter(f => f.SourceAppID !== f.TargetAppID) : [];
  document.getElementById("dgCtx").innerHTML = [
    `📘 ${DB.Domains.length} domains · ${DB.Applications.length} applications · ${DB.Datasets.length} datasets`,
    d ? `🏷 <b>${esc(d.Name)}</b> · ${termsOfDom(d).length} business terms` : "",
    a ? `🧩 ${esc(a.Name)} · ${esc(KN(a.AppType))}` : "",
    a ? `🗂 ${ds.length} datasets · ${ds.reduce((n, x) => n + attrsOf(x.DatasetID).length, 0)} attributes` : "",
    a ? `🔀 ${fl.length} integrations (${fl.filter(isCross).length} cross-domain)` : "",
    w.savedAt ? `💾 saved ${esc(new Date(w.savedAt).toLocaleTimeString())}` : "",
  ].filter(Boolean).map(x => `<span>${x}</span>`).join("");
  if (!soft) {
    document.getElementById("dgBody").innerHTML = [dgStepDomain, dgStepApp, dgStepDatasets, dgStepAttrs, dgStepInteg, dgStepLineage, dgStepExport][w.step]() + dgDatalists();
    const next = document.getElementById("dgNext");
    document.getElementById("dgBack").disabled = w.step === 0;
    next.textContent = w.step === DG_STEPS.length - 1 ? "Onboard another application" : w.step === 5 && !w.lineageOk ? "Lineage reviewed — next →" : "Next →";
    next.disabled = w.step < DG_STEPS.length - 1 && w.step !== 5 && !done[w.step];
    document.getElementById("dgHint").textContent = done[w.step] || w.step === 5 ? "" : ["Pick a domain to continue", "Pick or add a business application", "Add at least one dataset", "Give every dataset at least one attribute", "Add an integration with another application", "", "Save the work to finish"][w.step];
  }
  dgOverview();
  dgLinRender();
  dgSave();
}
// Soft refresh after an inline edit (body stays, so focus and scroll are kept).
function dgSoft() { dgRender(true); }

/* --------------------------- inline editing ---------------------------- */
// An editable cell bound to one registry row; a change goes through applyField, which keeps IDs and references in step.
function dgCell(sheet, row, key, o) {
  o = o || {};
  const col = DM[sheet].cols.find(c => c.key === key) || { key }, v = row[key] == null ? "" : String(row[key]);
  const at = `data-dg="${sheet}" data-rid="${ea(row._id)}" data-k="${key}"${o.ph ? ` placeholder="${ea(o.ph)}"` : ""}`;
  if (o.opts || (col.opts && !col.soft)) {
    const list = o.opts || col.opts, has = list.some(x => (x.v != null ? x.v : x) === v);
    return `<select ${at}>${(v && !has ? [v] : []).concat(list).map(x => { const val = x.v != null ? x.v : x, lab = x.l != null ? x.l : x; return `<option value="${ea(val)}"${val === v ? " selected" : ""}>${esc(lab)}</option>`; }).join("")}</select>`;
  }
  if (col.fk) return `<select ${at}><option value="">—</option>${fkOptions(col.fk, v)}</select>`;
  if (col.path) { const ds = row[col.path]; return `<select ${at}><option value="">${key === "SourcePath" ? "(constant / generated)" : "—"}</option>${attrsOf(ds).map(a => `<option${a.Path === v ? " selected" : ""}>${esc(a.Path)}</option>`).join("")}${v && !attrAt(ds, v) ? `<option selected>${esc(v)}</option>` : ""}</select>`; }
  if (col.area || o.area) return `<textarea ${at} rows="1">${esc(v)}</textarea>`;
  return `<input ${at} value="${ea(v)}"${col.opts ? ` list="dgdl-${col.key}"` : ""} />`;
}
const dgDatalists = () => `<datalist id="dgdl-DataType">${DTYPES.map(t => `<option value="${ea(t)}">`).join("")}</datalist><datalist id="dgdl-Format">${FORMATS.map(t => `<option value="${ea(t)}">`).join("")}</datalist><datalist id="dgdl-CanonicalType">${DTYPES.map(t => `<option value="${ea(t)}">`).join("")}</datalist>`;
// Business-term picker: this domain's terms first, then the others.
function dgTermSelect(row) {
  const d = dgDom(), mine = termsOfDom(d), rest = DB.BusinessTerms.filter(t => !mine.includes(t)), v = S(row.TermID);
  const opt = t => `<option value="${ea(t.TermID)}"${t.TermID === v ? " selected" : ""}>${esc(t.Name || t.TermID)}</option>`;
  return `<select data-dg="Attributes" data-rid="${ea(row._id)}" data-k="TermID"><option value="">— no term —</option>${v && !termById(v) ? `<option selected>${esc(v)}</option>` : ""}<optgroup label="${ea(d ? d.Name : "This domain")}">${mine.map(opt).join("")}</optgroup>${rest.length ? `<optgroup label="Other domains / shared">${rest.map(opt).join("")}</optgroup>` : ""}</select>`;
}
const dgStatus = r => `<span class="st-chip st-${ea(String(r.Status || "Draft").toLowerCase())}">${esc(r.Status || "Draft")}</span>`;
const dgAppBadge = a => a ? `<span class="dg-pill" style="background:${APP_COLOR[KN(a.AppType)] || "#64748b"}">${esc(KN(a.AppType) || "app")}</span>` : "";
const dgCrossPill = f => f.SourceAppID === f.TargetAppID ? `<span class="dg-pill dg-int">internal</span>` : isCross(f) ? `<span class="dg-pill dg-cross">⇄ cross-domain</span>` : `<span class="dg-pill dg-same">same domain</span>`;
function dgIssues(pred) { ISSUES = null; const li = issues().filter(i => i.at && pred(i.at) && i.sev !== "info"); return li.length ? `<div class="dg-iss" title="${ea(li.map(i => i.msg).join("\n"))}">⚠ ${esc(li[0].msg)}${li.length > 1 ? ` (+${li.length - 1})` : ""}</div>` : ""; }

/* ------------------------------ step 1 --------------------------------- */
function dgStepDomain() {
  const w = dg(), d = dgDom();
  let h = dgH(1, "Pick the business domain and its business terms", "Every application belongs to one <b>business domain</b>. Its <b>business terms</b> (the glossary) are what the attributes of its datasets are tagged with, which makes data traceable from the core systems to the UI. Pick a domain, or add one. Its business terms are optional: add or edit them now, or come back later.");
  h += `<div class="kv">Business domains</div><div class="wz-chips">${DB.Domains.map(x => `<span class="wz-chip${x.DomainID === w.dom ? " sel" : ""}" data-act="dom" data-v="${ea(x.DomainID)}" style="border-left:4px solid ${dgDomColor(x.DomainID)}">${esc(x.Name || x.DomainID)} <small>${appsOfDom(x.DomainID).length} apps · ${termsOfDom(x).length} terms</small></span>`).join("") || '<span class="hint">No domains yet: add the first one below.</span>'}</div>
    <details class="dg-note"${DB.Domains.length ? "" : " open"}><summary><b>＋ Add a domain</b></summary><div class="dg-row"><input id="dgNdName" placeholder="Name, e.g. Pricing" /><input id="dgNdCode" placeholder="5-letter code, e.g. PRICE" maxlength="5" style="width:150px" /><input id="dgNdNo" placeholder="No, e.g. ${pad2(Math.max(0, ...DB.Domains.map(x => parseInt(x.DomainNo, 10) || 0)) + 1)}" style="width:90px" /><input id="dgNdOwner" placeholder="Owner" /><button class="primary" data-act="add-dom">Add domain</button></div></details>`;
  if (!d) return h;
  h += `<div class="kv">Domain <span class="mono">${esc(d.DomainID)}</span> <button class="addrow" data-act="edit" data-sheet="Domains" data-v="${ea(d._id)}">✎ All fields</button></div>
    <div class="dg-scroll"><table class="dg-tbl"><thead><tr><th>No</th><th>Code</th><th>Name</th><th>Owner</th><th>Description</th></tr></thead><tbody><tr>${["DomainNo", "Code", "Name", "Owner", "Description"].map(k => `<td>${dgCell("Domains", d, k)}</td>`).join("")}</tr></tbody></table></div>`;
  const terms = termsOfDom(d), used = id => DB.Attributes.filter(a => a.TermID === id).length;
  const appOpts = [{ v: "", l: "—" }].concat(DB.Applications.map(a => ({ v: a.AppID, l: `${a.Name} · ${domName(a.DomainID)}` })));
  h += `<div class="kv">Business terms of ${esc(d.Name)} (${terms.length}) <button class="addrow" data-act="add-term">＋ Business term</button></div>
    <div class="dg-scroll"><table class="dg-tbl"><thead><tr><th>TermID</th><th>Name</th><th>Definition</th><th>Canonical type</th><th>Source of truth</th><th>Steward</th><th>Classification</th><th>Used by</th><th></th></tr></thead><tbody>${terms.map(t => `<tr>
      <td class="ro">${esc(t.TermID)}</td><td>${dgCell("BusinessTerms", t, "Name")}</td><td>${dgCell("BusinessTerms", t, "Definition")}</td><td>${dgCell("BusinessTerms", t, "CanonicalType")}</td><td>${dgCell("BusinessTerms", t, "SourceOfTruth", { opts: appOpts })}</td><td>${dgCell("BusinessTerms", t, "Steward")}</td><td>${dgCell("BusinessTerms", t, "Classification")}</td><td class="ro">${used(t.TermID)} attrs</td><td class="act"><button class="rm-row" data-act="del-term" data-v="${ea(t._id)}" title="Delete term">✕</button></td></tr>`).join("") || `<tr><td colspan="9" class="empty">No business terms for ${esc(d.Name)} yet: add the domain's key data concepts (e.g. SKU, price, cart id).</td></tr>`}</tbody></table></div>`;
  const shared = DB.BusinessTerms.filter(t => !DB.Domains.some(x => termsOfDom(x).includes(t)));
  if (shared.length) h += `<p class="hint">${shared.length} shared term${shared.length === 1 ? "" : "s"} outside any domain (${esc([...new Set(shared.map(t => t.Domain || "no domain"))].join(", "))}) can also tag this domain's attributes.</p>`;
  return h;
}

/* ------------------------------ step 2 --------------------------------- */
function dgStepApp() {
  const w = dg(), d = dgDom(), a = dgApp(); if (!d) return dgH(2, "Business application", "Pick a domain first.");
  const apps = appsOfDom(d.DomainID);
  let h = dgH(2, `Choose the business application in ${esc(d.Name)}`, "Pick the <b>business application</b> to onboard, or add it. A domain, orchestrator or integration service is one application that owns its REST and GraphQL APIs, its database and the Kafka events it produces. Its <b>type</b> decides which datasets it usually owns and how it integrates.");
  h += `<div class="wz-cards">${apps.map(x => { const f = flowsOfApp(x.AppID).filter(y => y.SourceAppID !== y.TargetAppID);
    return `<div class="wz-card${x.AppID === w.app ? " sel" : ""}" data-act="app" data-v="${ea(x.AppID)}"><h4>${esc(x.Name || x.AppID)} ${dgAppBadge(x)}</h4><p class="mono">${esc(x.AppID)}</p><p>${esc(x.Technology || "")}</p><p>${dsOfApp(x.AppID).length} datasets · ${f.length} integrations (${f.filter(isCross).length} cross-domain)</p></div>`; }).join("") || `<div class="empty">No applications in ${esc(d.Name)} yet.</div>`}</div>
    <details class="dg-note"${apps.length ? "" : " open"}><summary><b>＋ Add a business application</b> to ${esc(d.Name)}</summary><div class="dg-row"><input id="dgNaName" placeholder="Name, e.g. Pricing Service" /><select id="dgNaType">${APP_TYPES.map(t => `<option>${esc(t)}</option>`).join("")}</select><input id="dgNaTech" placeholder="Technology, e.g. Spring Boot + PostgreSQL" style="min-width:240px" /><input id="dgNaOwner" placeholder="Owner" /><button class="primary" data-act="add-app">Add application</button></div><p class="hint">The AppID is built from the domain and type, e.g. APP-${esc(pad2(d.DomainNo))}-${esc(d.Code)}-01.</p></details>`;
  if (!a) return h;
  const kinds = APP_KINDS[KN(a.AppType)] || [];
  h += `<div class="kv">${esc(a.Name)} <span class="mono">${esc(a.AppID)}</span> <button class="addrow" data-act="edit" data-sheet="Applications" data-v="${ea(a._id)}">✎ All fields</button></div>
    <div class="dg-scroll"><table class="dg-tbl"><thead><tr><th>Name</th><th>Application type</th><th>Technology</th><th>Owner</th><th>Description</th></tr></thead><tbody><tr>${["Name", "AppType", "Technology", "Owner", "Description"].map(k => `<td>${dgCell("Applications", a, k)}</td>`).join("")}</tr></tbody></table></div>
    ${dgIssues(at => at.app === a.AppID)}
    <p class="hint">A ${esc(KN(a.AppType))} usually owns: ${kinds.map(k => `<b>${esc(k)}</b>`).join(", ") || "any dataset type"}.</p>`;
  return h;
}

/* ------------------------------ step 3 --------------------------------- */
function dgStepDatasets() {
  const a = dgApp(); if (!a) return dgH(3, "Datasets", "Pick an application first.");
  const allowed = new Set(APP_KINDS[KN(a.AppType)] || DS_KINDS.map(KN)), ds = dsOfApp(a.AppID);
  let h = dgH(3, `Datasets of ${esc(a.Name)} and their types`, "Register every data structure the application owns: database tables and collections, CSV / JSON files, Kafka events, <b>HTTP requests and responses</b> (an API call in REST or GraphQL style: both are mapped the same way), GraphQL types, MDM / PIM / ERP integration objects, Databricks tables and UI components. <b>⇪ Import from API spec</b> builds the HTTP datasets from an OpenAPI spec or a GraphQL schema. Adding a dataset opens its <b>details dialog</b>, shaped by its type: an HTTP request / response as a REST operation (OpenAPI) or a GraphQL operation (query / mutation, parameters, return type), ER columns (PK / FK) for tables and collections, an Avro record (plus the Databricks StructType) for Kafka events, a Delta table for Databricks and columns for CSV / JSON files. Each has a source editor (SDL, OpenAPI YAML, SQL DDL, $jsonSchema, Avro, Databricks SQL, YAML) you can paste into. Use <b>✎ Details</b> to reopen it.");
  h += `<div class="kv">Add a dataset <button class="addrow" data-act="import-spec" title="Build HTTP Request / Response datasets from an OpenAPI spec or a GraphQL schema">⇪ Import from API spec</button></div><div class="dg-kinds">${DG_TYPES.map(([l, k]) => `<span class="dg-kind${allowed.has(KN(k)) ? "" : " off"}" data-act="add-ds" data-v="${ea(k)}" title="${allowed.has(KN(k)) ? "" : `Not usual for a ${ea(KN(a.AppType))}`}"><i style="background:${layerOf(kindLayer(k)).color}"></i>${esc(l)}</span>`).join("")}</div>`;
  const kindOpts = DG_TYPES.map(([l, k]) => ({ v: k, l: `${l} (${k.slice(0, 2)})` }));
  h += `<div class="kv">Datasets (${ds.length})</div><div class="dg-scroll"><table class="dg-tbl"><thead><tr><th>DatasetID</th><th>Name</th><th>Type</th><th>Details</th><th>Format</th><th>Version</th><th>Status</th><th>Attributes</th><th>Kafka registration</th><th></th></tr></thead><tbody>${ds.map(d => {
    const ev = DB.Events.find(e => e.DatasetID === d.DatasetID), kafka = KN(d.Kind) === "Kafka Event";
    return `<tr><td>${dgCell("Datasets", d, "DatasetID")}</td><td>${dgCell("Datasets", d, "Name")}${dgIssues(at => at.ds === d.DatasetID && at.path == null)}</td><td>${dgCell("Datasets", d, "Kind", { opts: kindOpts })}</td><td><span class="mono" style="font-size:11.5px">${esc(typeof dtSummary === "function" ? dtSummary(d) : d.Location)}</span><div><button class="addrow" data-act="dt" data-v="${ea(d.DatasetID)}" title="Edit the ${ea(KN(d.Kind))} details">✎ Details</button></div></td><td>${dgCell("Datasets", d, "Format")}</td><td style="width:60px">${dgCell("Datasets", d, "Version")}</td><td>${dgCell("Datasets", d, "Status")}</td>
      <td><button class="addrow" data-act="pick-ds" data-v="${ea(d.DatasetID)}" title="Edit its attributes">${attrsOf(d.DatasetID).length} attrs →</button></td>
      <td>${kafka ? (ev ? `<span class="hint">${esc(ev.Topic || ev.EventID)}</span> <button class="addrow" data-act="edit" data-sheet="Events" data-v="${ea(ev._id)}">✎</button>` : `<button class="addrow" data-act="reg-ev" data-v="${ea(d.DatasetID)}">Register event</button>`) : '<span class="hint">—</span>'}</td>
      <td class="act"><button class="rm-row" data-act="del-ds" data-v="${ea(d.DatasetID)}" title="Delete dataset">✕</button></td></tr>`; }).join("") || `<tr><td colspan="10" class="empty">No datasets yet: click a type above.</td></tr>`}</tbody></table></div>`;
  return h;
}

/* ------------------------------ step 4 --------------------------------- */
function dgStepAttrs() {
  const w = dg(), a = dgApp(); if (!a) return dgH(4, "Attributes", "Pick an application first.");
  const ds = dsOfApp(a.AppID); if (!ds.some(d => d.DatasetID === w.ds)) w.ds = (ds[0] || {}).DatasetID || "";
  let h = dgH(4, "Attributes and business terms", "Give each dataset its attributes (dotted paths; <span class=\"mono\">[]</span> marks an array, e.g. <span class=\"mono\">images[].url</span>) and, optionally, tag them with a <b>business term</b>: tagged attributes are what the term lineage follows across applications and domains.");
  h += `<div class="wz-chips">${ds.map(d => { const at = attrsOf(d.DatasetID), tg = at.filter(x => S(x.TermID)).length; return `<span class="wz-chip${d.DatasetID === w.ds ? " sel" : ""}" data-act="ds" data-v="${ea(d.DatasetID)}" title="${ea(KN(d.Kind))}"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${layerOf(dsLayer(d)).color}"></span> ${esc(d.Name || d.DatasetID)} <small>${tg}/${at.length} tagged</small></span>`; }).join("")}</div>`;
  const d = dsById(w.ds); if (!d) return h + `<div class="empty">Add a dataset in step 3 first.</div>`;
  const at = attrsOf(d.DatasetID), n = (p, dir) => (dir === "in" ? inbound : outbound)(d.DatasetID, p).length;
  h += `<div class="kv">${esc(d.Name)} <span class="mono">${esc(d.DatasetID)}</span> · ${esc(KN(d.Kind))} · ${at.filter(x => S(x.TermID)).length} of ${at.length} tagged
      <button class="addrow" data-act="suggest-terms" title="Tag untagged attributes: same leaf name as an already tagged attribute, else a term with a similar name">✨ Suggest terms</button></div>
    <div class="dg-scroll"><table class="dg-tbl"><thead><tr><th>Path</th><th>Data type</th><th>Req.</th><th>Classification</th><th>Business term</th><th>Example</th><th>Description</th><th>Mapped</th><th></th></tr></thead><tbody>${at.map(x => `<tr>
      <td>${dgCell("Attributes", x, "Path")}</td><td>${dgCell("Attributes", x, "DataType")}</td><td style="width:62px">${dgCell("Attributes", x, "Required")}</td><td>${dgCell("Attributes", x, "Classification")}</td><td>${dgTermSelect(x)}</td><td>${dgCell("Attributes", x, "Example")}</td><td>${dgCell("Attributes", x, "Description")}</td>
      <td class="ro" title="inbound / outbound mappings">${n(x.Path, "in")} in · ${n(x.Path, "out")} out</td><td class="act"><button class="rm-row" data-act="del-attr" data-v="${ea(x._id)}" title="Delete attribute">✕</button></td></tr>`).join("") || `<tr><td colspan="9" class="empty">No attributes yet.</td></tr>`}</tbody></table></div>
    <div class="dg-row"><input id="dgNaPath" placeholder="path, e.g. price.amount" /><input id="dgNaDtype" placeholder="type" list="dgdl-DataType" style="width:130px" /><button data-act="add-attr">＋ Attribute</button>
      <span class="spacer" style="flex:1"></span><button class="addrow" data-act="add-term">＋ Business term</button></div>
    <details class="dg-note"><summary><b>Paste several attributes</b> <span class="hint">· one per line, <span class="mono">path: type</span></span></summary><textarea id="dgPaste" rows="5" style="width:100%;font-family:ui-monospace,Menlo,monospace" placeholder="sku: string\nprice.amount: decimal\nprice.currency: string"></textarea><div class="dg-row"><button class="primary" data-act="paste-attrs">Add attributes</button></div></details>`;
  return h;
}

/* ------------------------------ step 5 --------------------------------- */
function dgStepInteg() {
  const w = dg(), a = dgApp(); if (!a) return dgH(5, "Integration mapping", "Pick an application first.");
  const flows = flowsOfApp(a.AppID).sort((x, y) => (x.SourceAppID === x.TargetAppID) - (y.SourceAppID === y.TargetAppID));
  let h = dgH(5, `Integration mapping for ${esc(a.Name)}`, "Record how data moves between <b>${esc(a.Name)}</b> and other applications, <b>in its own domain or across domains</b>: each integration flow has a pattern (REST API, GraphQL, Kafka event, File (CSV), CDC) and carries attribute mappings from a source dataset to a target dataset, with a transformation.".replace("${esc(a.Name)}", esc(a.Name)));
  h += `<div class="kv">Integrations (${flows.length})</div><div class="dg-scroll"><table class="dg-tbl"><thead><tr><th>Flow</th><th>Direction</th><th>Other application · domain</th><th>Pattern</th><th>Middleware</th><th>Frequency</th><th>Status</th><th>Mappings</th><th></th></tr></thead><tbody>${flows.map(f => {
    const out = f.SourceAppID === a.AppID, other = appById(out ? f.TargetAppID : f.SourceAppID), self = f.SourceAppID === f.TargetAppID;
    return `<tr class="${f.FlowID === w.flow ? "cur" : ""}"><td>${dgCell("Flows", f, "Name")}<div class="hint mono">${esc(f.FlowID)}</div></td><td>${self ? "internal" : out ? "outbound →" : "← inbound"}</td>
      <td>${self ? '<span class="hint">within the application</span>' : `${esc(other ? other.Name : "?")} ${dgAppBadge(other)}<div class="hint">${esc(domName(other && other.DomainID))}</div>`} ${dgCrossPill(f)}</td>
      <td>${dgCell("Flows", f, "Pattern")}</td><td>${dgCell("Flows", f, "Middleware")}</td><td>${dgCell("Flows", f, "Frequency")}</td><td>${dgCell("Flows", f, "Status")}</td>
      <td><button class="addrow" data-act="pick-flow" data-v="${ea(f.FlowID)}">${mapsOfFlow(f.FlowID).length} mappings →</button></td>
      <td class="act"><button class="icon-btn" data-act="edit" data-sheet="Flows" data-v="${ea(f._id)}" title="All fields">✎</button><button class="rm-row" data-act="del-flow" data-v="${ea(f.FlowID)}" title="Delete flow">✕</button></td></tr>`; }).join("") || `<tr><td colspan="9" class="empty">No integrations yet: add one below.</td></tr>`}</tbody></table></div>`;
  // new integration: any application in any domain
  const nf = w.nf, nfDom = nf.dom || DB.Domains.filter(x => x.DomainID !== a.DomainID).concat(DB.Domains)[0]?.DomainID || "";
  const nfApps = appsOfDom(nfDom), nfApp = nfApps.some(x => x.AppID === nf.app) ? nf.app : (nfApps.find(x => x.AppID !== a.AppID) || nfApps[0] || {}).AppID || "";
  h += `<div class="dg-note"><b>＋ Add an integration</b><div class="dg-row">${esc(a.Name)}
      <select data-act="nf" data-f="dir"><option value="out"${nf.dir === "out" ? " selected" : ""}>sends to →</option><option value="in"${nf.dir === "in" ? " selected" : ""}>← receives from</option></select>
      <select data-act="nf" data-f="dom" title="Domain of the other application">${DB.Domains.map(x => `<option value="${ea(x.DomainID)}"${x.DomainID === nfDom ? " selected" : ""}>${esc(x.Name)}${x.DomainID === a.DomainID ? " (same domain)" : ""}</option>`).join("")}</select>
      <select data-act="nf" data-f="app">${nfApps.map(x => `<option value="${ea(x.AppID)}"${x.AppID === nfApp ? " selected" : ""}>${esc(x.Name)} · ${esc(KN(x.AppType))}</option>`).join("") || "<option value=\"\">(no applications)</option>"}</select>
      via <select data-act="nf" data-f="pattern">${PATTERNS.map(p => `<option${p === nf.pattern ? " selected" : ""}>${esc(p)}</option>`).join("")}</select>
      <input id="dgNfMw" placeholder="middleware, e.g. Kafka Connect" value="${ea(nf.mw)}" /><input id="dgNfFreq" placeholder="frequency, e.g. Real-time" value="${ea(nf.freq)}" style="width:150px" />
      <button class="primary" data-act="add-flow" data-v="${ea(nfApp)}">Add integration</button></div></div>`;
  h += dgDomainMatrix(a.DomainID);
  // attribute mappings of the selected flow
  const f = flowById(w.flow); if (!f || !flowsOfApp(a.AppID).includes(f)) return h + `<p class="hint">Pick an integration's <b>mappings →</b> to map its attributes.</p>`;
  const sD = dsOfApp(f.SourceAppID), tD = dsOfApp(f.TargetAppID);
  if (!sD.some(x => x.DatasetID === w.srcDs)) w.srcDs = (sD.find(x => mapsOfFlow(f.FlowID).some(m => m.SourceDatasetID === x.DatasetID)) || sD[0] || {}).DatasetID || "";
  if (!tD.some(x => x.DatasetID === w.tgtDs)) w.tgtDs = (tD.find(x => mapsOfFlow(f.FlowID).some(m => m.TargetDatasetID === x.DatasetID)) || tD.find(x => x.DatasetID !== w.srcDs) || tD[0] || {}).DatasetID || "";
  const maps = mapsOfFlow(f.FlowID).filter(m => (!w.srcDs || m.SourceDatasetID === w.srcDs || !S(m.SourcePath)) && (!w.tgtDs || m.TargetDatasetID === w.tgtDs));
  const dsOpt = (list, v) => list.map(x => `<option value="${ea(x.DatasetID)}"${x.DatasetID === v ? " selected" : ""}>${esc(x.Name || x.DatasetID)} · ${esc(KN(x.Kind))}</option>`).join("");
  h += `<div class="kv" style="margin-top:14px">Attribute mappings · <span class="mono">${esc(f.FlowID)}</span> ${esc(f.Name || "")} ${dgCrossPill(f)}</div>
    <div class="dg-row">Source <select data-act="map-src">${dsOpt(sD, w.srcDs) || "<option value=''>(the source has no datasets)</option>"}</select> → Target <select data-act="map-tgt">${dsOpt(tD, w.tgtDs) || "<option value=''>(the target has no datasets)</option>"}</select>
      <button data-act="automap"${w.srcDs && w.tgtDs ? "" : " disabled"} title="Suggest Draft mappings by business term and name similarity">✨ Auto-map</button><button data-act="add-map"${w.tgtDs ? "" : " disabled"}>＋ Mapping</button><button data-act="to-canvas"${w.srcDs && w.tgtDs ? "" : " disabled"} title="Open this source → target pair on the mapping canvas">Open in canvas ↗</button></div>
    <div class="dg-scroll"><table class="dg-tbl"><thead><tr><th>MappingID</th><th>Source path</th><th>Target path</th><th>Transformation</th><th>Rule</th><th>Status</th><th></th></tr></thead><tbody>${maps.map(m => `<tr>
      <td class="ro">${esc(m.MappingID)}</td><td>${dgCell("Mappings", m, "SourcePath")}</td><td>${dgCell("Mappings", m, "TargetPath")}</td><td>${dgCell("Mappings", m, "Transformation")}</td><td>${dgCell("Mappings", m, "Rule")}</td><td>${dgCell("Mappings", m, "Status")}</td>
      <td class="act"><button class="rm-row" data-act="del-map" data-v="${ea(m._id)}" title="Delete mapping">✕</button></td></tr>`).join("") || `<tr><td colspan="7" class="empty">No mappings for this pair yet: ✨ Auto-map or add them.</td></tr>`}</tbody></table></div>
    ${dgIssues(at => at.map && maps.some(m => m._id === at.map))}`;
  return h;
}
// Flows between domains: rows = source domain, columns = target domain (cross-domain cells highlighted).
function dgDomainMatrix(cur) {
  const doms = DB.Domains, cnt = (s, t) => DB.Flows.filter(f => f.SourceAppID !== f.TargetAppID && domOfApp(f.SourceAppID) === s && domOfApp(f.TargetAppID) === t).length;
  if (!doms.length) return "";
  return `<details class="dg-note"><summary><b>Integrations across domains</b> <span class="hint">· flows from the row's domain to the column's domain</span></summary><div class="dg-scroll" style="margin-top:6px"><table class="dg-tbl dg-mx"><thead><tr><th>from \\ to</th>${doms.map(t => `<th style="color:${dgDomColor(t.DomainID)}">${esc(t.Name)}</th>`).join("")}</tr></thead><tbody>${doms.map(s => `<tr${s.DomainID === cur ? ' class="cur"' : ""}><th style="color:${dgDomColor(s.DomainID)}">${esc(s.Name)}</th>${doms.map(t => { const n = cnt(s.DomainID, t.DomainID); return `<td class="${s === t ? "self" : n ? "hot" : ""}">${n || ""}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div></details>`;
}

/* ------------------------------ step 6 --------------------------------- */
function dgStepLineage() {
  const w = dg(), L = dgLinCur();
  let h = dgH(6, "Lineage across applications, business terms and domains", "Choose what to trace: everything, a domain, an application, a business term, an integration flow or a dataset, and at which level (applications, datasets or attributes). The lineage visualizer on the right draws it; click a box there to trace from it. The summary below lists what flows in and out.");
  h += `<div class="dg-lin-bar" data-linbar="body">${dgLinBarHTML(L)}</div>`;
  const G = dgLinGraph(L);
  h += `<div class="dg-counts"><span>${G.nodes.length} ${esc(DG_LEVELS[L.level].toLowerCase())}</span><span>${G.edges.length} links</span><span>${G.edges.filter(e => e.cross).length} cross-domain</span>${G.edges.some(e => e.noflow) ? `<span style="color:#b91c1c">${G.edges.filter(e => e.noflow).length} mapped without a flow</span>` : ""}</div>`;
  if (L.scope === "term" && L.id) {
    const tr = traceTerm(L.id);
    h += `<div class="kv">End-to-end traces of ${esc((termById(L.id) || {}).Name || L.id)} (${tr.length})</div><div class="dg-scroll"><table class="dg-tbl"><thead><tr><th>#</th><th>Path through the applications</th></tr></thead><tbody>${tr.map((t, i) => `<tr><td>${i + 1}</td><td>${t.map(st => { const d = dsById(st.ds), ap = appOfDs(d); return `${st.m ? `<span class="hint"> →${st.m.Transformation && st.m.Transformation !== "Direct" ? " " + esc(st.m.Transformation) : ""} </span>` : ""}<span title="${ea((d || {}).Name || st.ds)}"><b>${esc(ap ? ap.Name : "?")}</b>.${esc(st.p)}</span>`; }).join("")}</td></tr>`).join("") || `<tr><td colspan="2" class="empty">No mapping chain carries this term yet.</td></tr>`}</tbody></table></div>`;
  } else {
    const appEdges = dgLinGraph(Object.assign({}, L, { level: "app" })).edges.filter(e => !e.noflow), name = id => (appById(id) || {}).Name || id, seeds = dgLinScopeSeed(L).apps;
    const ins = appEdges.filter(e => seeds.has(e.to) && !seeds.has(e.from)), outs = appEdges.filter(e => seeds.has(e.from) && !seeds.has(e.to));
    const li = (list, side) => list.map(e => `<li><b>${esc(name(e[side]))}</b> <span class="hint">${esc(domName(domOfApp(e[side])))} · ${esc(e.label)}</span>${e.cross ? ' <span class="dg-pill dg-cross">⇄</span>' : ""}</li>`).join("") || '<li class="hint">none</li>';
    h += `<div class="grid2"><div><div class="kv">Upstream (feeds ${esc(DG_SCOPES[L.scope].toLowerCase())})</div><ul>${li(ins, "from")}</ul></div><div><div class="kv">Downstream (fed by it)</div><ul>${li(outs, "to")}</ul></div></div>`;
    const d = dgDom(), terms = termsOfDom(d);
    if (terms.length) h += `<div class="kv">Business terms of ${esc(d.Name)} · applications that carry them</div><div class="dg-scroll"><table class="dg-tbl"><thead><tr><th>Term</th><th>Applications (by layer)</th><th></th></tr></thead><tbody>${terms.map(t => { const apps = [...new Set(DB.Attributes.filter(x => x.TermID === t.TermID).map(x => (dsById(x.DatasetID) || {}).AppID).filter(Boolean))];
      return `<tr><td><b>${esc(t.Name)}</b> <span class="hint mono">${esc(t.TermID)}</span></td><td>${apps.map(id => `<span class="dg-tag" style="border-left:3px solid ${dgDomColor(domOfApp(id))}">${esc(name(id))}</span>`).join(" ") || '<span class="hint">not used yet</span>'}</td><td><button class="addrow" data-act="lin-term" data-v="${ea(t.TermID)}">Trace →</button></td></tr>`; }).join("")}</tbody></table></div>`;
  }
  h += `<div class="dg-row" style="margin-top:12px"><button class="primary" data-act="lin-ok">${w.lineageOk ? "✓ Lineage reviewed" : "Mark lineage reviewed"}</button><span class="hint">${w.lineageOk ? "" : "Review the visualizer, then confirm."}</span></div>`;
  return h;
}

/* ------------------------------ step 7 --------------------------------- */
function dgExpScope() {
  const s = dg().exp.scope, a = dgApp(), d = dgDom();
  if (s === "app" && a) return { s, id: a.AppID, apps: new Set([a.AppID]), label: a.Name };
  if (s === "domain" && d) return { s, id: d.DomainID, apps: new Set(appsOfDom(d.DomainID).map(x => x.AppID)), label: `${d.Name} domain` };
  return { s: "all", id: "", apps: new Set(DB.Applications.map(x => x.AppID)), label: "whole registry" };
}
const dgFmtOf = d => { const f = dg().exp.fmt; return f === "auto" ? defaultFmt(d) : f; };
function dgSchema(d) { try { return generate(d, dgFmtOf(d)); } catch (e) { return "// could not generate: " + e.message; } }
function dgFileBase() { const X = dgExpScope(); return S(dg().exp.name) || ("data-mapping-" + String(X.label).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }
function dgStepExport() {
  const w = dg(), X = dgExpScope(), ds = DB.Datasets.filter(d => X.apps.has(d.AppID));
  let h = dgH(7, "Export the schemas and save the work", "Generate a schema for every dataset (Avro for Kafka events, GraphQL SDL for GQL datasets, SQL DDL for tables, JSON Schema for REST / files, TypeScript for UI, or one format for all), then save: the <b>Excel workbook</b> is the full registry (reload it with <i>Load .xlsx</i>) plus Integrations, Lineage and Schemas sheets; the <b>Markdown</b> file documents the chosen scope for reviews and wikis.");
  h += `<div class="dg-row"><b>Scope</b>${["app", "domain", "all"].map(s => `<label><input type="radio" name="dgExpScope" data-act="exp-scope" value="${s}"${w.exp.scope === s ? " checked" : ""} /> ${s === "app" ? `This application${dgApp() ? " (" + esc(dgApp().Name) + ")" : ""}` : s === "domain" ? `This domain${dgDom() ? " (" + esc(dgDom().Name) + ")" : ""}` : "Whole registry"}</label>`).join("")}</div>
    <div class="dg-row"><b>Schema format</b><select data-act="exp-fmt">${Object.entries(DG_FMT).map(([k, l]) => `<option value="${k}"${w.exp.fmt === k ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>
      <button data-act="dl-schemas-md"${ds.length ? "" : " disabled"}>⤓ All schemas (.md)</button><button data-act="dl-schemas-files"${ds.length ? "" : " disabled"} title="One file per dataset">⤓ All schemas (files)</button></div>
    <div class="dg-scroll"><table class="dg-tbl"><thead><tr><th>Dataset</th><th>Application</th><th>Type</th><th>Attributes</th><th>Schema</th><th></th></tr></thead><tbody>${ds.map(d => `<tr><td><b>${esc(d.Name || d.DatasetID)}</b><div class="hint mono">${esc(d.DatasetID)}</div></td><td>${esc((appOfDs(d) || {}).Name || d.AppID)}</td><td>${esc(KN(d.Kind))}</td><td>${attrsOf(d.DatasetID).length}</td><td>${esc(DG_FMT[dgFmtOf(d)] || dgFmtOf(d))} <span class="hint mono">.${esc(DG_EXT[dgFmtOf(d)] || "txt")}</span></td>
      <td class="act"><button class="addrow" data-act="dl-schema" data-v="${ea(d.DatasetID)}">⤓</button><button class="addrow" data-act="pv-schema" data-v="${ea(d.DatasetID)}">Preview</button></td></tr>`).join("") || `<tr><td colspan="6" class="empty">No datasets in this scope.</td></tr>`}</tbody></table></div>
    <pre class="code" id="dgPreview" hidden style="max-height:32vh"></pre>
    <div class="dg-note"><div class="dg-row"><b>Save</b><label>File name <input id="dgExpName" value="${ea(dgFileBase())}" style="min-width:260px" /></label>
      <button class="primary" data-act="save-xlsx">💾 Save Excel (.xlsx)</button><button class="primary" data-act="save-md">⬇ Save Markdown (.md)</button>
      <span class="hint">${w.savedAt ? "Last saved " + esc(new Date(w.savedAt).toLocaleString()) : "Not saved yet."}</span></div>
      <p class="hint">The Markdown covers the ${esc(X.label)}: domains, business terms, applications, datasets with attributes, integrations (with the cross-domain matrix), attribute mappings, a Mermaid lineage diagram, term traces and the schemas.</p></div>`;
  if (w.savedAt) h += `<div class="dg-note ok">✅ Saved. Click <b>Onboard another application</b> to continue with the next one; the registry is kept.</div>`;
  return h;
}

/* ------------------------------ actions -------------------------------- */
function dgAddDomain() {
  const name = val("dgNdName").trim(); if (!name) return toast("Enter the domain name");
  const row = dgNewRow("Domains", { Name: name, Owner: val("dgNdOwner").trim() });
  row.DomainNo = pad2(val("dgNdNo").trim() || Math.max(0, ...DB.Domains.map(x => parseInt(x.DomainNo, 10) || 0)) + 1);
  row.Code = (val("dgNdCode").trim().toUpperCase() || suggestCode(name, row)).slice(0, 5);
  if (DB.Domains.some(x => x.Code === row.Code)) return toast(`Code ${row.Code} is already used`);
  pushUndo(); row.DomainID = domainIdFor(row); DB.Domains.push(row); save();
  const w = dg(); w.dom = row.DomainID; w.app = ""; toast(`Added ${row.DomainID}`); dgRender();
}
function dgAddTerm() {
  const d = dgDom(); if (!d) return;
  const name = prompt(`New business term in ${d.Name}:`, ""); if (!S(name)) return;
  pushUndo(); const base = "BT-" + String(name).toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);
  const id = DB.BusinessTerms.some(t => t.TermID === base) ? nextId("BusinessTerms") : base;
  DB.BusinessTerms.push(dgNewRow("BusinessTerms", { TermID: id, Name: S(name), Domain: d.Name, Classification: "Internal", CanonicalType: "string" })); save(); dgRender(); toast(`Added ${id}`);
}
function dgAddApp() {
  const d = dgDom(), name = val("dgNaName").trim(); if (!d) return; if (!name) return toast("Enter the application name");
  pushUndo(); const row = dgNewRow("Applications", { Name: name, DomainID: d.DomainID, AppType: val("dgNaType"), Technology: val("dgNaTech").trim(), Owner: val("dgNaOwner").trim() });
  DB.Applications.push(row); row._autoId = true; reIdApp(row); save();
  const w = dg(); w.app = row.AppID; DG_CHANGED.add(row.AppID); toast(`Added ${row.AppID}`); dgRender();
}
function dgAddDataset(kind) {
  const a = dgApp(); if (!a) return;
  pushUndo(); const label = (DG_TYPES.find(t => t[1] === kind) || [KN(kind)])[0], n = dsOfApp(a.AppID).filter(d => d.Kind === kind).length;
  const row = dgNewRow("Datasets", { AppID: a.AppID, Name: `${a.Name} ${label}${n ? " " + (n + 1) : ""}`, Kind: kind, Format: DG_FORMAT[KN(kind)] || "", Version: "1" });
  DB.Datasets.push(row); save(); const w = dg(); w.ds = row.DatasetID; DG_CHANGED.add(row.DatasetID); dgRender();
  if (typeof dtOpen === "function") dtOpen(row.DatasetID, { isNew: true, onDone: () => dgRender() }); else toast(`Added ${row.DatasetID} (${label})`);
}
function dgRegisterEvent(dsId) {
  const d = dsById(dsId); if (!d) return; const a = appOfDs(d), dm = a && domById(a.DomainID);
  const topic = `${String((dm && dm.Code) || "data").toLowerCase()}.${String(d.Name || d.DatasetID).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.v1`;
  pushUndo(); DB.Events.push(dgNewRow("Events", { DatasetID: d.DatasetID, EventName: pascal(d.Name || d.DatasetID), Topic: topic, Subject: topic + "-value", SchemaFormat: "AVRO", Compatibility: "BACKWARD", SchemaVersion: "1" })); save(); dgRender(); toast(`Registered ${topic}`);
}
function dgPasteAttrs() {
  const ds = dg().ds; if (!dsById(ds)) return; let n = 0; pushUndo();
  val("dgPaste").split(/\n+/).map(l => l.trim()).filter(Boolean).forEach(l => { const i = l.indexOf(":"), p = (i < 0 ? l : l.slice(0, i)).trim(), t = i < 0 ? "string" : l.slice(i + 1).trim(); if (p && !attrAt(ds, p)) { DB.Attributes.push({ _id: uid(), DatasetID: ds, Path: p, DataType: t || "string", Required: "N", Classification: "Internal", TermID: "", Example: "", Description: "", Status: "Draft" }); DG_CHANGED.add(akey(ds, p)); n++; } });
  if (!n) { UNDO.pop(); return toast("Nothing new to add"); } DG_CHANGED.add(ds); save(); dgRender(); toast(`Added ${n} attribute(s)`);
}
// Tag untagged attributes: same leaf name as a tagged attribute anywhere, else a business term with a similar name.
function dgSuggestTerms() {
  const ds = dg().ds, todo = attrsOf(ds).filter(a => !S(a.TermID)); let n = 0; pushUndo();
  for (const a of todo) {
    const leaf = leafNorm(a.Path), twin = DB.Attributes.find(x => S(x.TermID) && termById(x.TermID) && leafNorm(x.Path) === leaf);
    let t = twin ? twin.TermID : "";
    if (!t) { let best = 0; for (const tm of DB.BusinessTerms) { const s = Math.max(similarity(leafNorm(tm.Name), leaf), similarity(leafNorm(tm.TermID.replace(/^BT-/, "")), leaf)); if (s > best) { best = s; t = s >= 0.8 ? tm.TermID : t; } } if (best < 0.8) t = ""; }
    if (t) { a.TermID = t; n++; DG_CHANGED.add(akey(ds, a.Path)); }
  }
  if (!n) { UNDO.pop(); return toast("No confident suggestions: pick the terms by hand"); } save(); dgRender(); toast(`Tagged ${n} attribute(s); check them`);
}
function dgAddFlow(otherId) {
  const a = dgApp(), o = appById(otherId), w = dg(); if (!a || !o) return toast("Pick the other application");
  const out = w.nf.dir !== "in", src = out ? a : o, tgt = out ? o : a, mw = val("dgNfMw").trim(), freq = val("dgNfFreq").trim();
  pushUndo(); const row = dgNewRow("Flows", { Name: `${src.Name} → ${tgt.Name} (${w.nf.pattern})`, SourceAppID: src.AppID, TargetAppID: tgt.AppID, Pattern: w.nf.pattern, Middleware: mw, Frequency: freq });
  DB.Flows.push(row); save(); Object.assign(w.nf, { mw: "", freq: "" }); w.flow = row.FlowID; w.srcDs = ""; w.tgtDs = ""; DG_CHANGED.add(src.AppID); DG_CHANGED.add(tgt.AppID);
  toast(`Added ${row.FlowID}${domOfApp(src.AppID) !== domOfApp(tgt.AppID) ? " (cross-domain)" : ""}`); dgRender();
}
function dgDelFlow(id) {
  const f = flowById(id); if (!f) return; const n = mapsOfFlow(id).length;
  if (!confirm(`Delete integration ${id}${n ? ` and its ${n} mapping(s)` : ""}? (Ctrl/⌘+Z undoes)`)) return;
  pushUndo(); DB.Flows = DB.Flows.filter(x => x !== f); DB.Mappings = DB.Mappings.filter(m => m.FlowID !== id); save(); if (dg().flow === id) dg().flow = ""; dgRender();
}
function dgAddMapping() {
  const w = dg(); if (!w.tgtDs) return;
  pushUndo(); DB.Mappings.push(dgNewRow("Mappings", { FlowID: w.flow, SourceDatasetID: w.srcDs, TargetDatasetID: w.tgtDs, Transformation: "Direct" })); save(); DG_CHANGED.add(w.tgtDs); dgRender();
}
function dgAutoMap() {
  const w = dg(), before = new Set(DB.Mappings.map(m => m._id));
  CV.pairA = w.srcDs; CV.pairB = w.tgtDs; autoMap();
  DB.Mappings.filter(m => !before.has(m._id)).forEach(m => { m.FlowID = w.flow; });   // keep the suggestions on the selected integration
  save(); DG_CHANGED.add(w.tgtDs); dgRender();
}

/* ---------------------- lineage (drawer + step 6) ---------------------- */
function dgDrawerState() { try { return Object.assign({ open: true, w: 44, follow: true }, JSON.parse(localStorage.getItem(DG_DRAWER)) || {}); } catch (_) { return { open: true, w: 44, follow: true }; } }
function dgDrawerSave(s) { try { localStorage.setItem(DG_DRAWER, JSON.stringify(s)); } catch (_) {} }
function dgDrawerSync() {
  const s = dgDrawerState(), dr = document.getElementById("dgDrawer"), view = document.getElementById("view-guide"); if (!dr) return;
  dr.classList.toggle("open", s.open); view.style.setProperty("--obw", s.w + "%"); document.getElementById("dgLinFollow").checked = s.follow;
}
// The lineage the drawer shows: with "Follow guide", scoped to what the current step is about.
function dgLinCur() {
  const w = dg(), L = Object.assign({}, w.lin);
  if (!dgDrawerState().follow) return L;
  const a = dgApp();
  if (w.step === 0) { L.scope = "domain"; L.id = w.dom; }
  else if (w.step === 3 && dsById(w.ds)) { L.scope = "dataset"; L.id = w.ds; }
  else if (w.step === 4 && flowById(w.flow)) { L.scope = "flow"; L.id = w.flow; }
  else if (w.step <= 4 || !L.id) { L.scope = a ? "app" : w.dom ? "domain" : "all"; L.id = a ? a.AppID : w.dom; }
  return L;
}
function dgLinSet(patch) { const w = dg(), s = dgDrawerState(); Object.assign(w.lin, dgLinCur(), patch); if (s.follow) { s.follow = false; dgDrawerSave(s); dgDrawerSync(); } dgSave(); }
function dgLinItems(scope) {
  const grp = (list, key, label) => { const by = {}; list.forEach(x => (by[key(x)] = by[key(x)] || []).push(x)); return Object.entries(by).map(([k, xs]) => [label(k), xs]); };
  if (scope === "domain") return [["", DB.Domains.map(d => ({ v: d.DomainID, l: d.Name || d.DomainID }))]];
  if (scope === "app") return grp(DB.Applications, a => a.DomainID, domName).map(([g, xs]) => [g, xs.map(a => ({ v: a.AppID, l: a.Name || a.AppID }))]);
  if (scope === "term") return grp(DB.BusinessTerms, t => t.Domain || "Shared", x => x).map(([g, xs]) => [g, xs.map(t => ({ v: t.TermID, l: t.Name || t.TermID }))]);
  if (scope === "flow") return [["Cross-domain", DB.Flows.filter(f => f.SourceAppID !== f.TargetAppID && isCross(f))], ["Same domain", DB.Flows.filter(f => f.SourceAppID !== f.TargetAppID && !isCross(f))], ["Internal", DB.Flows.filter(f => f.SourceAppID === f.TargetAppID)]].map(([g, xs]) => [g, xs.map(f => ({ v: f.FlowID, l: f.Name || f.FlowID }))]).filter(x => x[1].length);
  if (scope === "dataset") return grp(DB.Datasets, d => d.AppID, appName).map(([g, xs]) => [g, xs.map(d => ({ v: d.DatasetID, l: `${d.Name || d.DatasetID} · ${KN(d.Kind)}` }))]);
  return [];
}
function dgLinBarHTML(L) {
  const items = dgLinItems(L.scope);
  return `<span class="seg">${Object.entries(DG_LEVELS).map(([k, l]) => `<button data-lin-level="${k}" class="${L.level === k ? "active" : ""}">${l}</button>`).join("")}</span>
    <select data-lin="scope" title="What to trace">${Object.entries(DG_SCOPES).map(([k, l]) => `<option value="${k}"${L.scope === k ? " selected" : ""}>${l}</option>`).join("")}</select>
    ${L.scope === "all" ? "" : `<select data-lin="id">${items.map(([g, xs]) => (g ? `<optgroup label="${ea(g)}">` : "") + xs.map(x => `<option value="${ea(x.v)}"${x.v === L.id ? " selected" : ""}>${esc(x.l)}</option>`).join("") + (g ? "</optgroup>" : "")).join("")}</select>`}`;
}
// Transitive up- and downstream integrations of one application.
function dgFlowClosure(app) {
  const out = new Set();
  const walk = (id, down, seen) => { for (const f of DB.Flows) { if (f.SourceAppID === f.TargetAppID) continue; const from = down ? f.SourceAppID : f.TargetAppID, to = down ? f.TargetAppID : f.SourceAppID; if (from !== id) continue; out.add(f); if (!seen.has(to)) { seen.add(to); walk(to, down, seen); } } };
  walk(app, true, new Set([app])); walk(app, false, new Set([app]));
  DB.Flows.filter(f => f.SourceAppID === app && f.TargetAppID === app).forEach(f => out.add(f));
  return [...out];
}
// What a scope covers: its mappings (attribute lineage), its applications and its integration flows.
function dgLinScopeSeed(L) {
  const linMaps = attrs => { const s = new Set(); attrs.forEach(a => lineage(a.DatasetID, a.Path).maps.forEach(x => s.add(x))); return DB.Mappings.filter(m => s.has(m._id)); };
  let maps = [], apps = new Set(), flows = [];
  if (L.scope === "all" || !L.id) { maps = DB.Mappings; flows = DB.Flows; apps = new Set(DB.Applications.map(a => a.AppID)); }
  else if (L.scope === "domain") { apps = new Set(appsOfDom(L.id).map(a => a.AppID)); const ds = new Set(DB.Datasets.filter(d => apps.has(d.AppID)).map(d => d.DatasetID)); maps = DB.Mappings.filter(m => ds.has(m.SourceDatasetID) || ds.has(m.TargetDatasetID)); flows = DB.Flows.filter(f => apps.has(f.SourceAppID) || apps.has(f.TargetAppID)); }
  else if (L.scope === "app") { apps = new Set([L.id]); maps = linMaps(DB.Attributes.filter(a => (dsById(a.DatasetID) || {}).AppID === L.id)); flows = dgFlowClosure(L.id); }
  else if (L.scope === "term") { const at = DB.Attributes.filter(a => a.TermID === L.id); apps = new Set(at.map(a => (dsById(a.DatasetID) || {}).AppID).filter(Boolean)); maps = linMaps(at); }
  else if (L.scope === "flow") { const f = flowById(L.id); apps = new Set(f ? [f.SourceAppID, f.TargetAppID] : []); maps = mapsOfFlow(L.id); flows = f ? [f] : []; }
  else if (L.scope === "dataset") { const d = dsById(L.id); apps = new Set(d ? [d.AppID] : []); maps = linMaps(attrsOf(L.id)); }
  const fids = new Set(maps.map(m => m.FlowID).filter(Boolean));
  flows = [...new Map(flows.concat(DB.Flows.filter(f => fids.has(f.FlowID))).map(f => [f.FlowID, f])).values()];
  return { maps, apps, flows };
}
// Nodes + edges at the chosen level (applications / datasets / attributes).
function dgLinGraph(L) {
  const { maps, apps, flows } = dgLinScopeSeed(L), nodes = new Map(), edges = [], mine = dg().app, dsApp = id => (dsById(id) || {}).AppID;
  if (L.level === "app") {
    const add = id => { if (!id || nodes.has(id)) return; const a = appById(id); if (!a) return; nodes.set(id, { id, kind: "app", label: a.Name || id, sub: `${KN(a.AppType)} · ${domName(a.DomainID)}`, color: dgDomColor(a.DomainID), group: a.DomainID, mine: id === mine, internal: 0 }); };
    apps.forEach(add);
    const covered = new Set();
    flows.forEach(f => { add(f.SourceAppID); add(f.TargetAppID);
      if (f.SourceAppID === f.TargetAppID) { const n = nodes.get(f.SourceAppID); if (n) n.internal++; return; }
      const n = mapsOfFlow(f.FlowID).length; covered.add(f.SourceAppID + ">" + f.TargetAppID);
      edges.push({ from: f.SourceAppID, to: f.TargetAppID, label: `${f.Pattern || "flow"}${n ? " · " + n : ""}`, color: PATTERN_COLOR[f.Pattern] || "#64748b", cross: isCross(f), title: `${f.FlowID} · ${f.Name || ""}\n${f.Pattern || ""}${f.Middleware ? " via " + f.Middleware : ""}${f.Frequency ? " · " + f.Frequency : ""}\n${n} attribute mapping(s)${isCross(f) ? "\ncross-domain" : ""}` }); });
    const extra = {}; maps.forEach(m => { const s = dsApp(m.SourceDatasetID), t = dsApp(m.TargetDatasetID); if (!S(m.SourcePath) || !s || !t || s === t || covered.has(s + ">" + t)) return; (extra[s + ">" + t] = extra[s + ">" + t] || []).push(m); });
    Object.entries(extra).forEach(([k, ms]) => { const [s, t] = k.split(">"); add(s); add(t); edges.push({ from: s, to: t, label: `no flow · ${ms.length}`, color: "#b91c1c", noflow: true, cross: domOfApp(s) !== domOfApp(t), title: `${ms.length} mapping(s) between these applications have no integration flow` }); });
    nodes.forEach(n => { if (n.internal) n.sub += ` · ${n.internal} internal`; });
  } else if (L.level === "dataset") {
    const add = id => { if (!id || nodes.has(id)) return; const d = dsById(id); if (!d) return; const a = appOfDs(d); nodes.set(id, { id, kind: "ds", label: d.Name || id, sub: `${KN(d.Kind)} · ${a ? a.Name : d.AppID}`, color: layerOf(dsLayer(d)).color, group: d.AppID, mine: d.AppID === mine, layer: dsLayer(d) }); };
    if (L.scope === "app" || L.scope === "domain") DB.Datasets.filter(d => apps.has(d.AppID)).forEach(d => add(d.DatasetID));
    if (L.scope === "dataset") add(L.id);
    const agg = {}; maps.forEach(m => { add(m.TargetDatasetID); if (!S(m.SourcePath) || m.SourceDatasetID === m.TargetDatasetID) return; add(m.SourceDatasetID); const k = m.SourceDatasetID + ">" + m.TargetDatasetID; (agg[k] = agg[k] || []).push(m); });
    Object.entries(agg).forEach(([k, ms]) => { const [s, t] = k.split(">"), f = flowById(ms[0].FlowID); edges.push({ from: s, to: t, label: `${ms.length} attr${ms.length === 1 ? "" : "s"}`, color: PATTERN_COLOR[f && f.Pattern] || "#64748b", cross: domOfApp(dsApp(s)) !== domOfApp(dsApp(t)), title: `${ms.length} mapping(s)${f ? `\n${f.FlowID} · ${f.Pattern || ""}` : ""}` }); });
  } else {
    const add = (ds, p) => { const k = akey(ds, p); if (nodes.has(k)) return; const d = dsById(ds), at = attrAt(ds, p) || {}, t = termById(at.TermID); nodes.set(k, { id: k, kind: "attr", label: p, sub: `${d ? d.Name : ds}${t ? " · " + t.Name : ""}`, color: layerOf(dsLayer(d)).color, group: ds, mine: (d || {}).AppID === mine, layer: dsLayer(d), ds, term: at.TermID }); };
    if (L.scope === "term") DB.Attributes.filter(a => a.TermID === L.id).forEach(a => add(a.DatasetID, a.Path));
    if (L.scope === "dataset") attrsOf(L.id).forEach(a => add(a.DatasetID, a.Path));
    maps.forEach(m => { add(m.TargetDatasetID, m.TargetPath); if (!S(m.SourcePath)) return; add(m.SourceDatasetID, m.SourcePath); const f = flowById(m.FlowID);
      edges.push({ from: akey(m.SourceDatasetID, m.SourcePath), to: akey(m.TargetDatasetID, m.TargetPath), label: txAbbr(m.Transformation), color: PATTERN_COLOR[f && f.Pattern] || "#64748b", cross: domOfApp(dsApp(m.SourceDatasetID)) !== domOfApp(dsApp(m.TargetDatasetID)), title: `${m.MappingID} · ${m.Transformation || ""}${m.Rule ? ": " + m.Rule : ""}${f ? `\n${f.FlowID} · ${f.Pattern || ""}` : ""}` }); });
  }
  return { nodes: [...nodes.values()], edges };
}
// Longest-path columns (left = upstream); inside a column, grouped by domain / application.
function dgLinLayout(G, vert) {
  const by = Object.fromEntries(G.nodes.map(n => [n.id, n])), ids = G.nodes.map(n => n.id), rank = Object.fromEntries(ids.map(i => [i, 0]));
  const es = G.edges.filter(e => by[e.from] && by[e.to] && e.from !== e.to);
  for (let i = 0; i < ids.length; i++) { let ch = false; for (const e of es) if (rank[e.to] < rank[e.from] + 1 && rank[e.from] + 1 < ids.length) { rank[e.to] = rank[e.from] + 1; ch = true; } if (!ch) break; }
  const linked = new Set(es.flatMap(e => [e.from, e.to])), LO = Object.fromEntries(LAYERS.map((l, i) => [l.k, i])), maxR = Math.max(0, ...Object.values(rank));
  G.nodes.forEach(n => { if (!linked.has(n.id) && n.layer) rank[n.id] = Math.min(LO[n.layer] || 0, maxR || LO[n.layer] || 0); });
  G.nodes.forEach(n => { n.h = n.kind === "attr" ? 34 : 44; n.w = Math.min(300, Math.max(130, Math.ceil(Math.max(tw(n.label, 12, true), tw(n.sub, 10.5)) + 30))); });
  const cols = []; ids.forEach(id => (cols[rank[id]] = cols[rank[id]] || []).push(by[id]));
  const order = col => col.sort((a, b) => String(a.group).localeCompare(String(b.group)) || a.label.localeCompare(b.label));
  if (vert) {   // ranks top → bottom, the nodes of a rank side by side
    let y = 20, W = 0; const rowW = [];
    cols.forEach((col, ri) => { if (!col) return; order(col); let x = 0, g = null; col.forEach(n => { if (g != null && n.group !== g) x += 14; g = n.group; n.x = x; x += n.w + 16; }); rowW[ri] = x - 16; W = Math.max(W, x - 16); });
    cols.forEach((col, ri) => { if (!col) return; const off = 20 + (W - rowW[ri]) / 2; col.forEach(n => { n.x += off; n.y = y; }); y += Math.max(...col.map(n => n.h)) + 74; });
    return { by, es, W: W + 40, H: y - 54, vert: true };
  }
  let x = 20, H = 0; const colH = [];
  cols.forEach((col, ci) => { if (!col) return; order(col); let y = 0, g = null; col.forEach(n => { if (g != null && n.group !== g) y += 12; g = n.group; n.y = y; y += n.h + 12; }); colH[ci] = y; H = Math.max(H, y); });
  cols.forEach((col, ci) => { if (!col) return; const w = Math.max(...col.map(n => n.w)), off = 20 + (H - colH[ci]) / 2; col.forEach(n => { n.x = x + (w - n.w) / 2; n.y += off; }); x += w + 110; });
  return { by, es, W: Math.max(x - 90, 200), H: H + 40 };
}
function dgLinSvg(G, lay, L) {
  const colors = [...new Set(lay.es.map(e => e.color))], mk = c => "dga" + c.replace(/[^a-z0-9]/gi, "");
  const defs = colors.map(c => `<marker id="${mk(c)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join("");
  const edges = lay.es.map(e => { const s = lay.by[e.from], t = lay.by[e.to]; let d, mx, my;
    if (lay.vert) { const x1 = s.x + s.w / 2, y1 = s.y + s.h, x2 = t.x + t.w / 2, y2 = t.y, fwd = y2 > y1 + 10, c = fwd ? Math.max(30, (y2 - y1) / 2) : 80;
      d = fwd ? `M${x1} ${y1}C${x1} ${y1 + c} ${x2} ${y2 - c} ${x2} ${y2}` : `M${x1} ${y1}C${x1 + 90} ${y1 + c} ${x2 + 90} ${y2 - c} ${x2} ${y2}`; mx = fwd ? (x1 + x2) / 2 : Math.max(x1, x2) + 70; my = (y1 + y2) / 2; }
    else { const x1 = s.x + s.w, y1 = s.y + s.h / 2, x2 = t.x, y2 = t.y + t.h / 2, fwd = x2 > x1 + 10, c = fwd ? Math.max(40, (x2 - x1) / 2) : 90;
      d = fwd ? `M${x1} ${y1}C${x1 + c} ${y1} ${x2 - c} ${y2} ${x2} ${y2}` : `M${x1} ${y1}C${x1 + c} ${y1 + 70} ${x2 - c} ${y2 + 70} ${x2} ${y2}`; mx = (x1 + x2) / 2; my = fwd ? (y1 + y2) / 2 : Math.max(y1, y2) + 52; }
    const lw = e.label ? tw(e.label, 10, true) + 10 : 0;
    return `<g><title>${esc(e.title || "")}</title><path class="edge${e.cross ? " cross" : ""}${e.noflow ? " noflow" : ""}" d="${d}" stroke="${e.color}" marker-end="url(#${mk(e.color)})"/>${e.label ? `<g class="elbl"><rect x="${mx - lw / 2}" y="${my - 8}" width="${lw}" height="16" rx="8" stroke="${e.color}"/><text x="${mx}" y="${my + 3.5}" text-anchor="middle" fill="${e.color}">${esc(e.label)}${e.cross ? " ⇄" : ""}</text></g>` : ""}</g>`; }).join("");
  const nodes = G.nodes.map(n => `<g class="node${n.mine ? " mine" : ""}${DG_CHANGED.has(n.id) ? " changed" : ""}" data-id="${ea(n.id)}" data-kind="${n.kind}" transform="translate(${n.x},${n.y})"><title>${esc(n.label)}\n${esc(n.sub)}\nclick to trace from here</title>
      <rect class="box" width="${n.w}" height="${n.h}" rx="8"/><rect class="bar" width="5" height="${n.h}" rx="2" fill="${n.color}"/>
      <text class="t" x="13" y="${n.kind === "attr" ? 15 : 18}">${esc(n.label.length > 40 ? n.label.slice(0, 39) + "…" : n.label)}</text><text class="s" x="13" y="${n.kind === "attr" ? 28 : 34}">${esc(n.sub.length > 48 ? n.sub.slice(0, 47) + "…" : n.sub)}</text></g>`).join("");
  return `<svg class="dgl" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs><g id="dgLinView">${edges}${nodes}</g></svg>`;
}
function dgLinRender() {
  const host = document.getElementById("dgLinCanvas"), s = dgDrawerState(); if (!host || !s.open) return;
  const L = dgLinCur(), a = dgApp();
  document.getElementById("dgLinMine").textContent = a ? a.Name : "the application being onboarded";
  const bar = document.getElementById("dgLinBar"); if (bar) bar.innerHTML = dgLinBarHTML(L);
  const G = dgLinGraph(L), foot = document.getElementById("dgLinFoot");
  if (G.nodes.length > 260) { host.innerHTML = `<div class="empty" style="padding:20px">${G.nodes.length} ${esc(DG_LEVELS[L.level].toLowerCase())}: too many to draw. Narrow the scope or pick a higher level.</div>`; foot.textContent = ""; return; }
  if (!G.nodes.length) { host.innerHTML = `<div class="empty" style="padding:20px">Nothing to trace yet for this selection. Add datasets, attributes and integrations, or pick another scope.</div>`; foot.textContent = ""; return; }
  const r = host.getBoundingClientRect(), vert = r.height > r.width * 1.15, lay = dgLinLayout(G, vert); DGV.lay = lay;
  host.innerHTML = dgLinSvg(G, lay, L);
  const sig = [L.level, L.scope, L.id, G.nodes.length, vert].join("|");
  if (sig !== DGV.sig || !DGV.view) { DGV.sig = sig; dgLinFit(); } else dgLinApply();
  const cross = G.edges.filter(e => e.cross).length;
  foot.textContent = `${DG_SCOPES[L.scope]}${L.id ? ": " + (L.scope === "app" ? appName(L.id) : L.scope === "domain" ? domName(L.id) : L.scope === "term" ? ((termById(L.id) || {}).Name || L.id) : L.scope === "flow" ? ((flowById(L.id) || {}).Name || L.id) : L.scope === "dataset" ? dsLabel(dsById(L.id)) : L.id) : ""} · ${G.nodes.length} ${DG_LEVELS[L.level].toLowerCase()} · ${G.edges.length} links${cross ? ` · ${cross} cross-domain (thick)` : ""} · scroll to zoom, drag to pan, click a box to trace from it`;
  document.getElementById("dgLinLegend").innerHTML = L.level === "app"
    ? [...new Set(G.nodes.map(n => n.group))].map(g => `<span><i style="background:${dgDomColor(g)}"></i>${esc(domName(g))}</span>`).join("")
    : [...new Set(G.nodes.map(n => n.layer))].map(k => `<span><i style="background:${layerOf(k).color}"></i>${esc(layerOf(k).label)}</span>`).join("");
  if (DG_CHANGED.size) { const first = G.nodes.find(n => DG_CHANGED.has(n.id)); if (first && s.follow) dgLinCenter(first); setTimeout(() => DG_CHANGED.clear(), 50); }
}
function dgLinApply() { const g = document.getElementById("dgLinView"), v = DGV.view; if (g && v) g.setAttribute("transform", `translate(${v.x},${v.y}) scale(${v.k})`); }
function dgLinFit() {
  const host = document.getElementById("dgLinCanvas"), lay = DGV.lay; if (!host || !lay) return;
  const r = host.getBoundingClientRect(), W = r.width || 400, H = r.height || 300, fit = Math.min(1.3, Math.min((W - 30) / lay.W, (H - 40) / lay.H)), k = Math.max(0.55, fit);
  // too big to fit readably: keep 55% and start at the upstream end (drag / scroll for the rest)
  DGV.view = { k, x: k > fit && !lay.vert ? 10 : (W - lay.W * k) / 2, y: k > fit && lay.vert ? 10 : Math.max(10, (H - lay.H * k) / 2) }; dgLinApply();
}
function dgLinCenter(n) { const host = document.getElementById("dgLinCanvas"); if (!host || !DGV.view) return; const r = host.getBoundingClientRect(), k = DGV.view.k; DGV.view.x = r.width / 2 - (n.x + n.w / 2) * k; DGV.view.y = r.height / 2 - (n.y + n.h / 2) * k; dgLinApply(); }
function dgLinWire() {
  const host = document.getElementById("dgLinCanvas");
  host.addEventListener("wheel", e => { if (!DGV.view) return; e.preventDefault(); const r = host.getBoundingClientRect(), cx = e.clientX - r.left, cy = e.clientY - r.top, v = DGV.view, f = e.deltaY < 0 ? 1.12 : 1 / 1.12, k = Math.max(0.15, Math.min(3, v.k * f)); v.x = cx - (cx - v.x) * k / v.k; v.y = cy - (cy - v.y) * k / v.k; v.k = k; dgLinApply(); }, { passive: false });
  host.addEventListener("pointerdown", e => { if (!DGV.view || e.target.closest(".node")) return; DGV.pan = { x: e.clientX, y: e.clientY, vx: DGV.view.x, vy: DGV.view.y }; host.classList.add("panning"); host.setPointerCapture(e.pointerId); });
  host.addEventListener("pointermove", e => { const p = DGV.pan; if (!p) return; DGV.view.x = p.vx + e.clientX - p.x; DGV.view.y = p.vy + e.clientY - p.y; dgLinApply(); });
  host.addEventListener("pointerup", () => { DGV.pan = null; host.classList.remove("panning"); });
  host.addEventListener("click", e => { const n = e.target.closest(".node"); if (!n) return; const id = n.dataset.id, kind = n.dataset.kind;
    if (kind === "app") dgLinSet({ scope: "app", id }); else if (kind === "ds") dgLinSet({ scope: "dataset", id });
    else { const [ds, p] = id.split("|"), at = attrAt(ds, p); dgLinSet(at && S(at.TermID) ? { scope: "term", id: at.TermID } : { scope: "dataset", id: ds }); }
    DGV.sig = ""; dgLinRefresh(); });
  const onBar = e => { const lv = e.target.closest("[data-lin-level]"); if (lv && e.type === "click") { dgLinSet({ level: lv.dataset.linLevel }); DGV.sig = ""; return dgLinRefresh(); }
    const el = e.target.closest("[data-lin]"); if (!el || e.type !== "change") return;
    if (el.dataset.lin === "scope") { const sc = el.value, first = (dgLinItems(sc)[0] || [, []])[1][0]; const pre = sc === "app" ? dg().app : sc === "domain" ? dg().dom : sc === "flow" ? dg().flow : sc === "dataset" ? dg().ds : ""; dgLinSet({ scope: sc, id: sc === "all" ? "" : (pre && dgLinItems(sc).some(([, xs]) => xs.some(x => x.v === pre)) ? pre : first ? first.v : "") }); }
    else dgLinSet({ id: el.value });
    DGV.sig = ""; dgLinRefresh(); };
  ["click", "change"].forEach(t => { document.getElementById("dgLinBar").addEventListener(t, onBar); document.getElementById("dgBody").addEventListener(t, e => { if (e.target.closest("[data-linbar]")) onBar(e); }); });
}
// Lineage changed from the drawer: re-render it, and the step body too when it is the lineage step.
function dgLinRefresh() { if (dg().step === 5) dgRender(); else { dgSave(); dgLinRender(); } }

/* ------------------------------ exports -------------------------------- */
const mdCell = v => String(v == null ? "" : v).replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
const mdTable = (head, rows) => rows.length ? [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map(r => `| ${r.map(mdCell).join(" | ")} |`)].join("\n") : "_none_";
function dgMermaid(L) {
  const G = dgLinGraph(L), id = {}; G.nodes.forEach((n, i) => id[n.id] = "n" + i);
  const q = s => '"' + String(s).replace(/"/g, "'") + '"', out = ["flowchart LR"], groups = {};
  G.nodes.forEach(n => (groups[n.group] = groups[n.group] || []).push(n));
  Object.entries(groups).forEach(([g, ns]) => { out.push(`  subgraph g${Object.keys(groups).indexOf(g)}[${q(L.level === "app" ? domName(g) : L.level === "dataset" ? appName(g) : dsLabel(dsById(g)) || g)}]`); ns.forEach(n => out.push(`    ${id[n.id]}[${q(n.label + (L.level === "app" ? " · " + n.sub.split(" · ")[0] : ""))}]`)); out.push("  end"); });
  G.edges.forEach(e => { if (id[e.from] && id[e.to]) out.push(`  ${id[e.from]} ${e.noflow ? "-.->" : e.cross ? "==>" : "-->"}${e.label ? `|${q(e.label + (e.cross ? " ⇄" : ""))}|` : ""} ${id[e.to]}`); });
  return out.join("\n");
}
function dgMarkdown() {
  const X = dgExpScope(), apps = DB.Applications.filter(a => X.apps.has(a.AppID)), doms = DB.Domains.filter(d => apps.some(a => a.DomainID === d.DomainID));
  const ds = DB.Datasets.filter(d => X.apps.has(d.AppID)), dsIds = new Set(ds.map(d => d.DatasetID));
  const flows = DB.Flows.filter(f => X.apps.has(f.SourceAppID) || X.apps.has(f.TargetAppID));
  const maps = DB.Mappings.filter(m => dsIds.has(m.SourceDatasetID) || dsIds.has(m.TargetDatasetID));
  const tids = new Set(DB.Attributes.filter(a => dsIds.has(a.DatasetID)).map(a => a.TermID).filter(Boolean));
  const terms = DB.BusinessTerms.filter(t => tids.has(t.TermID) || doms.some(d => termsOfDom(d).includes(t)));
  const L = { level: "app", scope: X.s, id: X.id }, out = [];
  out.push(`# Data mapping — ${X.label}`, "", `_Generated ${new Date().toLocaleString()} from data-mapping.html (Data Mapping Registry)._`, "",
    `**${doms.length}** domains · **${terms.length}** business terms · **${apps.length}** applications · **${ds.length}** datasets · **${DB.Attributes.filter(a => dsIds.has(a.DatasetID)).length}** attributes · **${flows.length}** integrations (${flows.filter(f => f.SourceAppID !== f.TargetAppID && isCross(f)).length} cross-domain) · **${maps.length}** attribute mappings`, "");
  out.push("## Domains", "", mdTable(["DomainID", "Name", "Code", "Owner", "Description"], doms.map(d => [d.DomainID, d.Name, d.Code, d.Owner, d.Description])), "");
  out.push("## Business terms", "", mdTable(["TermID", "Name", "Domain", "Definition", "Canonical type", "Source of truth", "Steward", "Classification"], terms.map(t => [t.TermID, t.Name, t.Domain, t.Definition, t.CanonicalType, appName(t.SourceOfTruth), t.Steward, t.Classification])), "");
  out.push("## Business applications", "", mdTable(["AppID", "Name", "Domain", "Type", "Technology", "Owner"], apps.map(a => [a.AppID, a.Name, domName(a.DomainID), KN(a.AppType), a.Technology, a.Owner])), "");
  out.push("## Datasets", "");
  apps.forEach(a => { const list = dsOfApp(a.AppID); if (!list.length) return; out.push(`### ${a.Name} (${a.AppID})`, "", mdTable(["DatasetID", "Name", "Type", "Location", "Format", "Version", "Status"], list.map(d => [d.DatasetID, d.Name, KN(d.Kind), d.Location, d.Format, d.Version, d.Status])), "");
    list.forEach(d => { const at = attrsOf(d.DatasetID); if (!at.length) return; out.push(`#### ${d.Name} · attributes`, "", mdTable(["Path", "Type", "Required", "Classification", "Business term", "Description"], at.map(x => [x.Path, x.DataType, x.Required, x.Classification, (termById(x.TermID) || {}).Name || x.TermID, x.Description])), ""); }); });
  out.push("## Integration mapping", "", mdTable(["FlowID", "Name", "Source application (domain)", "Target application (domain)", "Pattern", "Middleware", "Frequency", "Cross-domain", "Mappings", "Status"],
    flows.map(f => [f.FlowID, f.Name, `${appName(f.SourceAppID)} (${domName(domOfApp(f.SourceAppID))})`, `${appName(f.TargetAppID)} (${domName(domOfApp(f.TargetAppID))})`, f.Pattern, f.Middleware, f.Frequency, f.SourceAppID === f.TargetAppID ? "internal" : isCross(f) ? "yes" : "no", mapsOfFlow(f.FlowID).length, f.Status])), "");
  const D = DB.Domains, cnt = (s, t) => DB.Flows.filter(f => f.SourceAppID !== f.TargetAppID && domOfApp(f.SourceAppID) === s && domOfApp(f.TargetAppID) === t).length;
  out.push("### Integrations across domains", "", "Rows send to columns (number of integration flows).", "", mdTable(["from \\ to", ...D.map(d => d.Name)], D.map(s => [s.Name, ...D.map(t => cnt(s.DomainID, t.DomainID) || "")])), "");
  out.push("## Attribute mappings (source → target)", "", mdTable(["MappingID", "Flow", "Source dataset", "Source path", "Target dataset", "Target path", "Transformation", "Rule", "Status"],
    maps.map(m => [m.MappingID, m.FlowID, dsLabel(dsById(m.SourceDatasetID)) || m.SourceDatasetID, m.SourcePath, dsLabel(dsById(m.TargetDatasetID)) || m.TargetDatasetID, m.TargetPath, m.Transformation, m.Rule, m.Status])), "");
  out.push("## Lineage", "", `Applications and the integrations between them (${X.label}). Thick arrows cross domains; dotted ones are mappings without an integration flow.`, "", "```mermaid", dgMermaid(L), "```", "");
  const traced = terms.filter(t => traceTerm(t.TermID).length);
  if (traced.length) { out.push("### Business term traces", ""); traced.forEach(t => { out.push(`**${t.Name}** (${t.TermID})`, ""); traceTerm(t.TermID).slice(0, 25).forEach(tr => out.push("- " + tr.map(st => `${appName((dsById(st.ds) || {}).AppID)}.\`${st.p}\`${st.m && st.m.Transformation && st.m.Transformation !== "Direct" ? ` _(${st.m.Transformation})_` : ""}`).join(" → "))); out.push(""); }); }
  out.push("## Schemas", "");
  ds.forEach(d => { const f = dgFmtOf(d), body = dgSchema(d); out.push(`### ${d.Name} · ${DG_FMT[f] || f}`, ""); out.push(f === "sttm" ? body : "```" + (DG_LANG[f] || "") + "\n" + body + "\n```", ""); });
  return out.join("\n");
}
function dgExtraSheets(wb) {
  const flowRows = DB.Flows.map(f => ({ FlowID: f.FlowID, Name: f.Name, SourceApp: appName(f.SourceAppID), SourceDomain: domName(domOfApp(f.SourceAppID)), TargetApp: appName(f.TargetAppID), TargetDomain: domName(domOfApp(f.TargetAppID)), Pattern: f.Pattern, Middleware: f.Middleware, Frequency: f.Frequency, CrossDomain: f.SourceAppID === f.TargetAppID ? "internal" : isCross(f) ? "Y" : "N", Mappings: mapsOfFlow(f.FlowID).length, Status: f.Status }));
  const lin = []; DB.BusinessTerms.forEach(t => traceTerm(t.TermID).forEach((tr, i) => tr.forEach((st, j) => { const d = dsById(st.ds), a = appOfDs(d); lin.push({ TermID: t.TermID, Term: t.Name, Trace: i + 1, Hop: j, Application: a ? a.Name : "", Domain: a ? domName(a.DomainID) : "", Dataset: d ? d.Name : st.ds, Layer: layerOf(dsLayer(d)).label, Path: st.p, Transformation: st.m ? st.m.Transformation : "", Rule: st.m ? st.m.Rule : "", FlowID: st.m ? st.m.FlowID : "" }); })));
  const sch = DB.Datasets.map(d => ({ DatasetID: d.DatasetID, Application: (appOfDs(d) || {}).Name || d.AppID, Kind: KN(d.Kind), Format: DG_FMT[dgFmtOf(d)] || dgFmtOf(d), Schema: dgSchema(d).slice(0, 32000) }));
  [["Integrations", flowRows, [12, 34, 26, 18, 26, 18, 12, 24, 14, 11, 9, 10]], ["Lineage", lin, [14, 22, 7, 5, 26, 18, 30, 20, 26, 14, 30, 14]], ["Schemas", sch, [18, 26, 16, 18, 100]]].forEach(([n, rows, w]) => {
    if (!rows.length) return; const ws = XLSX.utils.json_to_sheet(rows); ws["!cols"] = w.map(wch => ({ wch })); XLSX.utils.book_append_sheet(wb, ws, n); });
}
function dgSaved(how) { const w = dg(); w.savedAt = new Date().toISOString(); w.savedHow = how; dgRender(); }
function dgDownloadSchemas(files) {
  const X = dgExpScope(), ds = DB.Datasets.filter(d => X.apps.has(d.AppID));
  if (!files) { download(`# Schemas — ${X.label}\n\n` + ds.map(d => { const f = dgFmtOf(d), b = dgSchema(d); return `## ${d.Name} (${d.DatasetID}) · ${DG_FMT[f] || f}\n\n` + (f === "sttm" ? b : "```" + (DG_LANG[f] || "") + "\n" + b + "\n```"); }).join("\n\n") + "\n", dgFileBase() + "-schemas.md", "text/markdown"); return; }
  ds.forEach((d, i) => setTimeout(() => download(dgSchema(d), `${d.DatasetID}.${DG_EXT[dgFmtOf(d)] || "txt"}`), i * 250));
  toast(`Downloading ${ds.length} schema file(s)`);
}

/* ------------------------------ overview ------------------------------- */
function dgOvBuild(host) {
  host.innerHTML = `<div class="ov">
    <div class="ov-node ov-src" data-node="src" data-go="0" title="Step 1: domain and business terms"><h3>Business domains</h3><div class="ov-sub">domains · glossary</div>
      ${onbItem("domain", "Domain", "dom")}${onbItem("key", "Business terms", "terms")}<div class="ov-div">all domains</div>${onbItem("layers", "Registry", "reg")}</div>
    ${onbConn([["e1", "M0 50H40", 50]])}
    <div class="ov-node ov-hub" data-node="hub" data-go="2" title="Steps 2–4: application, datasets, attributes"><h3>${ONB_ICON.swap} Data mapping guide</h3><div class="ov-sub">register · tag · map · trace</div>
      <div class="ov-core">${ONB_ICON.graph}<b data-slot="core">Domain → Application → Data</b></div>
      ${onbStepsHTML(DG_STEPS, DG_STEP_ICON)}
      <div class="ov-blue">Onboarding<span class="mono" data-slot="blue"></span></div></div>
    ${onbConn([["e2a", "M0 50H20V25H40", 25], ["e2b", "M0 50H20V75H40", 75]])}
    <div class="ov-col">
      <div class="ov-node ov-map" data-node="data" data-go="2" title="Steps 3–4: datasets and attributes"><h3>Application data</h3><div class="ov-sub" data-slot="appname">business application</div>
        ${onbItem("db", "Datasets by type", "ds")}${onbItem("key", "Attributes tagged", "attrs")}</div>
      <div class="ov-node ov-reg" data-node="int" data-go="4" title="Steps 5–6: integration and lineage"><h3>Integration &amp; lineage</h3><div class="ov-sub">across applications and domains</div>
        ${onbItem("swap", "Integrations", "flows")}${onbItem("router", "Lineage", "lin")}</div>
    </div>
    ${onbConn([["e3", "M0 25H20V50H40", 50], ["e3", "M0 75H20V50H40"]])}
    <div class="ov-node ov-tgt" data-node="tgt" data-go="6" title="Step 7: export and save"><h3>Exports</h3><div class="ov-sub">share the work</div>
      ${onbItem("table", "Excel workbook", "xlsx")}${onbItem("spec", "Markdown", "md")}${onbItem("code", "Schemas", "sch")}</div>
  </div>`;
  onbWire(host, dgGo);
}
function dgOverview() {
  const host = document.getElementById("dgOverview"); if (!host) return;
  if (!host.firstElementChild) dgOvBuild(host);
  const w = dg(), d = dgDone(), step = w.step, dm = dgDom(), a = dgApp(), ds = a ? dsOfApp(a.AppID) : [], at = ds.flatMap(x => attrsOf(x.DatasetID)), fl = a ? flowsOfApp(a.AppID).filter(f => f.SourceAppID !== f.TargetAppID) : [];
  const S2 = { src: [d[0], step === 0], hub: [d[3], step >= 1 && step <= 3], data: [d[3], step === 2 || step === 3], int: [d[5], step === 4 || step === 5], tgt: [d[6], step === 6] };
  onbStages(host, S2, DG_OV_PREV);
  onbEdge(host, "e1", onbFlow(S2, "src", "hub")); onbEdge(host, "e2a", onbFlow(S2, "hub", "data")); onbEdge(host, "e2b", onbFlow(S2, "hub", "int", d[3])); onbEdge(host, "e3", onbFlow(S2, "int", "tgt", step === 6));
  onbSteps(host, d, step);
  const it = (slot, txt, ok, pick) => onbItemSet(host, slot, txt, ok, pick);
  it("dom", dm ? dm.Name : "pick in step 1", !!dm); it("terms", dm ? `${termsOfDom(dm).length} terms (optional)` : "", !!dm && termsOfDom(dm).length > 0); it("reg", `${DB.Domains.length} domains · ${DB.Applications.length} apps`, DB.Domains.length > 0);
  onbSlot(host, "core", a ? `${dm ? dm.Name : ""} → ${a.Name}` : dm ? `${dm.Name} → pick an application` : "Domain → Application → Data");
  onbSlot(host, "blue", a ? `${ds.length} datasets · ${at.length} attrs · ${fl.length} integrations` : "pick a domain and application");
  onbSlot(host, "appname", a ? `${a.Name} · ${KN(a.AppType)}` : "business application");
  it("ds", ds.length ? [...new Set(ds.map(x => KN(x.Kind)))].slice(0, 4).join(", ") : "", d[2]);
  it("attrs", at.length ? `${at.filter(x => S(x.TermID)).length} of ${at.length} tagged` : "", d[3]);
  it("flows", a ? `${fl.length} · ${fl.filter(isCross).length} cross-domain` : "", d[4]);
  it("lin", w.lineageOk ? "reviewed" : d[4] ? "review in step 6" : "", d[5]);
  it("xlsx", w.savedAt && w.savedHow === "xlsx" ? "saved " + new Date(w.savedAt).toLocaleTimeString() : "", w.savedHow === "xlsx");
  it("md", w.savedAt && w.savedHow === "md" ? "saved " + new Date(w.savedAt).toLocaleTimeString() : "", w.savedHow === "md");
  it("sch", "Avro · JSON · SDL · DDL · TS", d[6]);
}

/* ------------------------------ wiring --------------------------------- */
function dgInit() {
  const root = document.getElementById("view-guide"); if (!root) return;
  const w = dg();
  if (!domById(w.dom)) { w.dom = (DB.Domains[0] || {}).DomainID || ""; w.app = ""; }
  document.getElementById("dgSteps").addEventListener("click", e => { const li = e.target.closest("li[data-step]"); if (li) dgGo(+li.dataset.step); });
  document.getElementById("dgBack").onclick = () => dgGo(dg().step - 1);
  document.getElementById("dgNext").onclick = () => {
    const w = dg();
    if (w.step === 5 && !w.lineageOk) { w.lineageOk = true; }
    if (w.step === DG_STEPS.length - 1) { if (!confirm("Onboard another application? The registry and the domain are kept.")) return; Object.assign(w, { step: 1, app: "", ds: "", flow: "", srcDs: "", tgtDs: "", lineageOk: false, savedAt: "" }); dgSave(); return dgRender(); }
    dgGo(w.step + 1);
  };
  document.getElementById("dgRestart").onclick = () => { if (!confirm("Restart the guide? The registry is kept.")) return; DG = null; try { localStorage.removeItem(DG_LS); } catch (_) {} dg(); dgRender(); };
  onbLayout({ root, top: document.getElementById("dgTop"), split: document.getElementById("dgHSplit"), ovBtn: document.getElementById("dgOvToggle"), chromeBtn: document.getElementById("chromeToggle"), key: "dm-onb", onChange: () => { DGV.sig = ""; dgLinRender(); } });
  document.body.classList.toggle("guide-on", currentView === "guide");
  // lineage drawer: open / close, resize, follow, fit, SVG
  const dr = document.getElementById("dgDrawer");
  document.getElementById("dgDrawerToggle").onclick = () => { const s = dgDrawerState(); s.open = !s.open; dgDrawerSave(s); dgDrawerSync(); if (s.open) setTimeout(() => { DGV.sig = ""; dgLinRender(); }, 340); };
  document.getElementById("dgLinFollow").onchange = e => { const s = dgDrawerState(); s.follow = e.target.checked; dgDrawerSave(s); DGV.sig = ""; dgLinRefresh(); };
  document.getElementById("dgLinFitBtn").onclick = dgLinFit;
  document.getElementById("dgLinSvgBtn").onclick = () => { const svg = document.querySelector("#dgLinCanvas svg"); if (!svg) return; const c = svg.cloneNode(true), lay = DGV.lay; c.querySelector("#dgLinView").removeAttribute("transform"); c.setAttribute("viewBox", `0 0 ${lay.W} ${lay.H}`); c.setAttribute("width", lay.W); c.setAttribute("height", lay.H);
    const st = document.createElementNS("http://www.w3.org/2000/svg", "style"); st.textContent = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch (_) { return []; } }).map(r => r.cssText).filter(t => t.startsWith(".dgl")).join("\n").replace(/var\(--accent\)/g, "#7048e8"); c.prepend(st);
    download(new XMLSerializer().serializeToString(c), "lineage.svg", "image/svg+xml"); };
  const grip = document.getElementById("dgGrip");
  grip.addEventListener("pointerdown", e => { e.preventDefault(); grip.setPointerCapture(e.pointerId); dr.classList.add("resizing");
    const W = root.getBoundingClientRect(), move = e2 => { const pct = Math.min(75, Math.max(26, 100 * (W.right - e2.clientX) / W.width)); root.style.setProperty("--obw", pct.toFixed(1) + "%"); };
    const up = () => { grip.removeEventListener("pointermove", move); grip.removeEventListener("pointerup", up); dr.classList.remove("resizing"); const s = dgDrawerState(); s.w = parseFloat(root.style.getPropertyValue("--obw")) || s.w; dgDrawerSave(s); dgLinFit(); };
    grip.addEventListener("pointermove", move); grip.addEventListener("pointerup", up); });
  dgLinWire(); dgDrawerSync();
  window.addEventListener("resize", () => { if (currentView === "guide") { dgDrawerSync(); dgLinFit(); } });
  const body = document.getElementById("dgBody");
  body.addEventListener("click", e => {
    const el = e.target.closest("[data-act]"); if (!el || el.disabled || el.tagName === "SELECT" || el.tagName === "INPUT") return;
    const w = dg(), a = el.dataset.act, v = el.dataset.v;
    if (a === "dom") { if (w.dom !== v) { w.dom = v; w.app = ""; w.ds = ""; w.flow = ""; w.lineageOk = false; w.savedAt = ""; } dgRender(); }
    else if (a === "add-dom") dgAddDomain();
    else if (a === "edit") { const row = dgRow(el.dataset.sheet, v); if (row) editRowModal(el.dataset.sheet, row); }
    else if (a === "add-term") dgAddTerm();
    else if (a === "del-term") { const t = dgRow("BusinessTerms", v); if (!t) return; const n = DB.Attributes.filter(x => x.TermID === t.TermID).length; if (!confirm(`Delete term ${t.Name}?${n ? ` ${n} attribute(s) keep a dangling TermID.` : ""}`)) return; pushUndo(); DB.BusinessTerms = DB.BusinessTerms.filter(x => x !== t); save(); dgRender(); }
    else if (a === "app") { if (w.app !== v) { w.app = v; w.ds = ""; w.flow = ""; w.lineageOk = false; w.savedAt = ""; } dgRender(); }
    else if (a === "add-app") dgAddApp();
    else if (a === "add-ds") dgAddDataset(v);
    else if (a === "del-ds") { const app = (dsById(v) || {}).AppID; deleteDataset(v); DG_CHANGED.add(app); dgRender(); }
    else if (a === "reg-ev") dgRegisterEvent(v);
    else if (a === "import-spec") dtImportOpen(dgApp() ? dgApp().AppID : "", made => { (made || []).forEach(id => DG_CHANGED.add(id)); if (made && made[0]) dg().ds = made[0]; dgRender(); });
    else if (a === "dt") dtOpen(v, { onDone: () => { DG_CHANGED.add(v); dgRender(); } });
    else if (a === "pick-ds") { w.ds = v; dgGo(3); }
    else if (a === "ds") { w.ds = v; dgRender(); }
    else if (a === "add-attr") { const ds = w.ds, p = val("dgNaPath").trim(); if (!p) return toast("Enter the attribute path"); const n = DB.Attributes.length; addAttribute(ds, p, val("dgNaDtype").trim()); if (DB.Attributes.length > n) { DG_CHANGED.add(ds); DG_CHANGED.add(akey(ds, p)); } dgRender(); const i = document.getElementById("dgNaPath"); if (i) i.focus(); }
    else if (a === "paste-attrs") dgPasteAttrs();
    else if (a === "del-attr") { const x = dgRow("Attributes", v); if (x) { deleteAttribute(x.DatasetID, x.Path); DG_CHANGED.add(x.DatasetID); dgRender(); } }
    else if (a === "suggest-terms") dgSuggestTerms();
    else if (a === "pick-flow") { w.flow = v; w.srcDs = ""; w.tgtDs = ""; dgRender(); }
    else if (a === "add-flow") { w.nf.mw = val("dgNfMw"); w.nf.freq = val("dgNfFreq"); dgAddFlow(v); }
    else if (a === "del-flow") dgDelFlow(v);
    else if (a === "add-map") dgAddMapping();
    else if (a === "del-map") { pushUndo(); DB.Mappings = DB.Mappings.filter(m => m._id !== v); save(); dgRender(); }
    else if (a === "automap") dgAutoMap();
    else if (a === "to-canvas") { CV.focus = "pair"; CV.pairA = w.srcDs; CV.pairB = w.tgtDs; CV.sel = null; CV.fitPending = true; showView("canvas"); }
    else if (a === "lin-ok") { w.lineageOk = !w.lineageOk; dgRender(); }
    else if (a === "lin-term") { dgLinSet({ scope: "term", id: v, level: "attr" }); DGV.sig = ""; const s = dgDrawerState(); if (!s.open) { s.open = true; dgDrawerSave(s); dgDrawerSync(); } dgRender(); }
    else if (a === "dl-schema") { const d = dsById(v); if (d) download(dgSchema(d), `${d.DatasetID}.${DG_EXT[dgFmtOf(d)] || "txt"}`); }
    else if (a === "pv-schema") { const d = dsById(v), pre = document.getElementById("dgPreview"); if (d && pre) { pre.hidden = false; pre.textContent = dgSchema(d); pre.scrollIntoView({ block: "nearest" }); } }
    else if (a === "dl-schemas-md") dgDownloadSchemas(false);
    else if (a === "dl-schemas-files") dgDownloadSchemas(true);
    else if (a === "save-xlsx") { w.exp.name = val("dgExpName").trim(); const n = (dgFileBase() || "DataMappingRegistry").replace(/\.xlsx$/i, "") + ".xlsx"; writeWorkbook(DB, n, dgExtraSheets); try { localStorage.setItem(LS_FILE, n); } catch (_) {} dgSaved("xlsx"); toast("Saved " + n); }
    else if (a === "save-md") { w.exp.name = val("dgExpName").trim(); const n = dgFileBase().replace(/\.md$/i, "") + ".md"; download(dgMarkdown(), n, "text/markdown"); dgSaved("md"); toast("Saved " + n); }
  });
  body.addEventListener("change", e => {
    const el = e.target, w = dg();
    if (el.matches("[data-dg]")) {
      const sh = el.dataset.dg, row = dgRow(sh, el.dataset.rid), k = el.dataset.k; if (!row) return;
      const before = sh === "Attributes" ? akey(row.DatasetID, row.Path) : "";
      if (!applyField(sh, row, k, el.value.trim())) { el.value = row[k] == null ? "" : row[k]; return; }
      if (sh === "Domains" && k !== "Name" && k !== "Owner" && k !== "Description") w.dom = row.DomainID;   // DomainID follows No / Code
      if (sh === "Applications") w.app = row.AppID;
      if (sh === "Datasets" && k === "DatasetID") w.ds = row.DatasetID;
      if (before) DG_CHANGED.add(before);
      dgChanged(sh, row);
      const structural = DM[sh].id === k || ["DomainNo", "Code", "Name", "AppType", "Kind", "TermID", "Path", "Pattern"].includes(k);
      return structural ? dgRender() : dgSoft();
    }
    if (el.dataset.act === "nf") { w.nf[el.dataset.f] = el.value; if (el.dataset.f === "dom") w.nf.app = ""; w.nf.mw = val("dgNfMw"); w.nf.freq = val("dgNfFreq"); return dgRender(); }
    if (el.dataset.act === "map-src") { w.srcDs = el.value; return dgRender(); }
    if (el.dataset.act === "map-tgt") { w.tgtDs = el.value; return dgRender(); }
    if (el.dataset.act === "exp-scope") { w.exp.scope = el.value; w.exp.name = ""; return dgRender(); }
    if (el.dataset.act === "exp-fmt") { w.exp.fmt = el.value; return dgRender(); }
  });
  // edit dialogs, Ctrl/⌘+Z and Load .xlsx re-render the guide through data-mapping.html's renderView
  dgRender();
}

dgInit();   // last: the constants above must be initialised first
