/* gql-onboarding.js — "Onboarding guide" tab of gql-migration.html.
   A step-by-step wizard that walks one application from its source API to a federated subgraph:
     1 load GQLRegistry.xlsx → 2 pick experience domain + business application (registry entity)
     → 3 pick the source (MonoGraph SDL, BFF REST API, or the service's own REST API)
     → 4 load the spec and choose the operations → 5 review / edit the derived schema, queries, mutations
     → 6 save the subgraph mapping workbook → 7 merge into the GQL Registry and save GQLRegistry.xlsx.
   Loaded after gql-migration.html's inline script and reuses its globals (state, mapping, parseOpenAPI,
   parseSDL, buildSubgraphRows, validateSubgraphRows, renderCurrentSubgraph, proposedRows, …).
   Wizard state lives in mapping.wizard, so it is cached with the rest of the migration. */

const WZ_STEPS = [
  { k: "registry", t: "Load GQL Registry" },
  { k: "app", t: "Domain & application" },
  { k: "source", t: "Migration source" },
  { k: "spec", t: "Load spec & pick operations" },
  { k: "review", t: "Review derived schema" },
  { k: "save", t: "Save subgraph mapping" },
  { k: "merge", t: "Merge into GQL Registry" },
];
const WZ_SOURCES = {
  monograph: { t: "MonoGraph (GraphQL SDL)", icon: "🧱", accept: ".graphqls,.graphql,.gql,.txt",
    d: "Split this application's root fields out of the monolithic graph. The types they reach come along; entities owned by other applications become @key reference stubs.",
    need: "The MonoGraph schema file (schema.graphqls / mono-graph.gql)." },
  bff: { t: "BFF REST API (OpenAPI)", icon: "🔀", accept: ".json,.yaml,.yml,.txt",
    d: "Move the BFF's composite endpoints that belong to this application. Only the endpoints you pick, and the types they use, become GraphQL operations; each is recorded in the BffMappings sheet.",
    need: "The BFF's OpenAPI / Swagger spec (bff-openapi.yaml)." },
  rest: { t: "Subgraph / service REST API (OpenAPI)", icon: "🧩", accept: ".json,.yaml,.yml,.txt",
    d: "The service's own REST API becomes its subgraph: component schemas become types, GET operations become queries and writes become mutations.",
    need: "The service's OpenAPI / Swagger spec (openapi.yaml)." },
};
const WZ_SAMPLE_APPS = ["product", "pnp", "inventory", "search", "cart", "payments", "checkout"];
const WZ_SAMPLES = {
  monograph: ["samples/mono-graph.gql"],
  bff: ["samples/bff-openapi.yaml"],
  rest: WZ_SAMPLE_APPS.map(n => `samples/subgraph/${n}/openapi.yaml`),
};
const WZ_BFF_HEADERS = ["BffRef", "BffName", "Alias", "GqlKind", "GqlOp", "GqlOpId", "EntityID", "Args", "Order", "Notes", "Owner"];
let WZ_PARSED = null;   // transient parse of the loaded spec: { key, ops:[{key,label,kind,args,returns,notes,method,path}] }

/* ------------------------------ state ---------------------------------- */
function wz() {
  const d = { step: 0, domain: "", entityId: "", source: "", specName: "", specText: "", selected: null, kinds: {},
    sgId: "", reviewed: false, savedAt: "", mergedAt: "", regFile: "", newEntity: false };
  const w = mapping.wizard || (mapping.wizard = {});           // fill defaults in place: callers hold on to this object
  for (const k in d) if (!(k in w)) w[k] = d[k];
  return w;
}
const wzEntity = () => (state.entities || []).find(e => String(e.EntityID || "") === wz().entityId) || null;
const wzSg = () => mapping.subgraphs.find(s => s.id === wz().sgId) || null;
const wzAppName = () => { const e = wzEntity(); return e ? String(e.BusinessApplication || e.Name || "subgraph") : "subgraph"; };
function wzDone() {
  const w = wz(), sg = wzSg(), hasSg = !!sg && (sg.ops.length + sg.types.length) > 0;
  return [state.entities.length > 0, !!wzEntity(), !!w.source, hasSg, hasSg && w.reviewed, hasSg && w.reviewed && !!w.savedAt, hasSg && !!w.mergedAt];
}
const wzPct = () => Math.round(100 * wzDone().filter(Boolean).length / WZ_STEPS.length);
function wzCanVisit(i) { const d = wzDone(); for (let j = 0; j < i; j++) if (!d[j]) return false; return true; }
// Clear the steps after `from` (keeps earlier choices) when an upstream choice changes.
function wzResetFrom(from) {
  const w = wz();
  if (from <= 2) { w.specName = ""; w.specText = ""; w.selected = null; w.kinds = {}; WZ_PARSED = null; }
  if (from <= 3) { w.sgId = ""; }
  w.reviewed = false; w.savedAt = ""; w.mergedAt = "";
}
function wzGo(i) { const w = wz(); if (i < 0 || i >= WZ_STEPS.length || !wzCanVisit(i)) return; w.step = i; persist(); wzRender(); const m = document.getElementById("wzMain"); if (m) m.scrollTop = 0; }

/* ------------------------------ render --------------------------------- */
function wzRender() {
  const root = document.getElementById("view-guide"); if (!root) return;
  const w = wz(), done = wzDone(), pct = wzPct();
  if (w.step > 0 && !wzCanVisit(w.step)) w.step = done.indexOf(false) < 0 ? 0 : done.indexOf(false);
  document.getElementById("wzBarFill").style.width = pct + "%";
  onbPct(document.getElementById("wzPct"), pct);   // pops when progress goes up
  const ta = document.getElementById("wzTopApp"), te = wzEntity(); if (ta) ta.textContent = te ? `· ${te.BusinessApplication} (${te.EntityID})` : "· one application at a time";
  document.getElementById("wzSteps").innerHTML = WZ_STEPS.map((s, i) => `<li class="${done[i] ? "done" : ""}${i === w.step ? " cur" : ""}${wzCanVisit(i) ? "" : " locked"}" data-step="${i}" title="${esc(s.t)}">${esc(s.t)}</li>`).join("");
  const e = wzEntity(), sg = wzSg();
  document.getElementById("wzCtx").innerHTML = [
    state.entities.length ? `📘 ${esc(w.regFile || "GQL Registry")} · ${state.entities.length} entities` : "",
    e ? `🏷 ${esc(e.ExperienceDomain || "—")} › <b>${esc(e.BusinessApplication || "")}</b> (${esc(e.EntityID)} ${esc(e.Name || "")})` : "",
    w.source ? `${WZ_SOURCES[w.source].icon} ${esc(WZ_SOURCES[w.source].t)}` : "",
    w.specName ? `📄 ${esc(w.specName)}` : "",
    sg ? `🧬 ${sg.types.length} types · ${sg.ops.filter(o => o.opKind === "query").length} queries · ${sg.ops.filter(o => o.opKind === "mutation").length} mutations` : "",
    w.savedAt ? `💾 saved ${esc(new Date(w.savedAt).toLocaleTimeString())}` : "",
    w.mergedAt ? `✅ merged ${esc(new Date(w.mergedAt).toLocaleTimeString())}` : "",
  ].filter(Boolean).map(x => `<span>${x}</span>`).join("");
  document.getElementById("wzSaveTop").disabled = !sg;
  const body = document.getElementById("wzBody");
  body.innerHTML = [wzStepRegistry, wzStepApp, wzStepSource, wzStepSpec, wzStepReview, wzStepSave, wzStepMerge][w.step]();
  if (w.step === 4) renderCurrentSubgraph();                     // the editable FedGQL rows render into #wzCurSg
  const next = document.getElementById("wzNext"), back = document.getElementById("wzBack");
  back.disabled = w.step === 0;
  next.textContent = w.step === WZ_STEPS.length - 1 ? "Onboard another application" : w.step === 4 ? "Rows reviewed — next →" : "Next →";
  next.disabled = w.step < WZ_STEPS.length - 1 && w.step !== 4 && !done[w.step];
  wzOverview();
  document.getElementById("wzHint").textContent = w.step === 4 ? "" : !done[w.step] ? ["Load a GQL Registry to continue", "Pick an application to continue", "Choose a source to continue", "Generate the subgraph to continue", "", "Save the subgraph mapping to continue", "Merge to finish"][w.step] : "";
}
const wzH = (n, title, desc) => `<h2>Step ${n} of ${WZ_STEPS.length} · ${esc(title)}</h2><p class="desc">${desc}</p>`;

function wzStepRegistry() {
  const w = wz(), n = state.entities.length;
  let h = wzH(1, "Load the GQL Registry", "Start from the current <span class=\"mono\">GQLRegistry.xlsx</span>: it lists the experience domains and business applications (entities) you can onboard, and it is the workbook the finished subgraph is merged back into. To continue an onboarding you saved earlier, load the registry and then resume from the saved subgraph mapping.");
  h += `<div class="pickers">
    <div class="picker"><b>GQLRegistry.xlsx</b><span class="hint">the target federated registry</span>
      <div class="st ${n ? "loaded" : "missing"}">${n ? `loaded — ${n} entities${w.regFile ? " · " + esc(w.regFile) : ""}` : "not loaded"}</div>
      <button class="primary" data-act="pick-reg">Choose file…</button> <button data-act="sample-reg" title="samples/GQLRegistry-sample.xlsx (needs the page served over http)">Use sample registry</button></div>
    <div class="picker"><b>Resume a saved onboarding</b><span class="hint">a <span class="mono">…-subgraph.xlsx</span> saved in step 6</span>
      <div class="st ${w.sgId ? "loaded" : "missing"}">${w.sgId ? "in progress: " + esc(wzAppName()) : "nothing in progress"}</div>
      <button data-act="pick-resume"${n ? "" : " disabled title=\"Load the registry first\""}>Choose saved mapping…</button></div>
  </div>`;
  if (n) {
    const doms = {};
    for (const e of state.entities) { const d = String(e.ExperienceDomain || "(no domain)"); (doms[d] = doms[d] || []).push(e); }
    const cnt = s => (state.reg[s] || []).length;
    h += `<div class="kv">Registry contents</div><div class="counts"><span class="tag">${n} entities</span><span class="tag">${cnt("Schema")} schema rows</span><span class="tag">${cnt("Queries")} queries</span><span class="tag">${cnt("Mutations")} mutations</span><span class="tag">${cnt("AuthScopes")} auth scopes</span>${(state.regOrder || []).filter(s => !CANON_HEADERS[s]).map(s => `<span class="tag">${esc(s)} ${cnt(s)}</span>`).join("")}</div>
      <div class="table-wrap" style="margin-top:8px"><table><thead><tr><th>Experience domain</th><th>Business applications</th></tr></thead><tbody>${Object.entries(doms).map(([d, es]) => `<tr><td>${esc(d)}</td><td>${es.map(e => `<span class="tag">${esc(e.BusinessApplication || e.Name)} <span class="hint">${esc(e.EntityID)}</span></span>`).join("")}</td></tr>`).join("")}</tbody></table></div>`;
  }
  return h;
}

function wzStepApp() {
  const w = wz(), ents = state.entities;
  const domains = [...new Set(ents.map(e => String(e.ExperienceDomain || "")).filter(Boolean))].sort();
  if (!w.domain || !domains.includes(w.domain)) {           // default: the chosen app's domain, else the busiest domain
    const e = wzEntity(), n = d => ents.filter(x => String(x.ExperienceDomain || "") === d).length;
    w.domain = e ? String(e.ExperienceDomain || "") : ([...domains].sort((a, b) => n(b) - n(a))[0] || "");
  }
  const cnt = (s, id) => (state.reg[s] || []).filter(r => String(r.EntityID || "") === id).length;
  let h = wzH(2, "Choose the domain and application", "Pick the <b>experience domain</b>, then the <b>business application</b> (the registry entity that will own the subgraph). Every generated row gets its <span class=\"mono\">EntityID</span>. If the application is not in the registry yet, add it below: it is created as a Draft entity and merged with the rest in step 7.");
  h += `<div class="kv">Experience domain</div><div class="wz-chips">${domains.map(d => `<span class="wz-chip${d === w.domain ? " sel" : ""}" data-act="dom" data-v="${esc(d)}">${esc(d)}</span>`).join("")}</div>`;
  const apps = ents.filter(e => String(e.ExperienceDomain || "") === w.domain);
  h += `<div class="kv">Business application in ${esc(w.domain || "—")}</div><div class="wz-cards">${apps.map(e => { const id = String(e.EntityID || ""); return `<div class="wz-card${id === w.entityId ? " sel" : ""}" data-act="app" data-v="${esc(id)}"><h4>${esc(e.BusinessApplication || e.Name)} <span class="hint mono">${esc(id)}</span></h4><p>Entity <b>${esc(e.Name || "")}</b>${e.ServiceType ? " · " + esc(e.ServiceType) : ""}</p><p>${esc(e.BusinessCapability || "")}</p><p>${cnt("Schema", id)} types · ${cnt("Queries", id)} queries · ${cnt("Mutations", id)} mutations in the registry · ${esc(e.ApprovalStatus || "Draft")}</p></div>`; }).join("") || `<div class="empty">No applications in this domain yet.</div>`}</div>`;
  h += `<details class="assign"${apps.length ? "" : " open"}><summary><b>＋ Add a new application</b> <span class="hint">(not in the registry yet)</span></summary>
    <div class="selrow" style="margin-top:10px">
      <label>Experience domain<input id="wzNewDom" value="${esc(w.domain)}" list="wzDomList" /></label><datalist id="wzDomList">${domains.map(d => `<option value="${esc(d)}">`).join("")}</datalist>
      <label>Business application (subgraph)<input id="wzNewApp" placeholder="e.g. loyalty" /></label>
      <label>Entity type name<input id="wzNewEnt" placeholder="e.g. LoyaltyAccount" /></label>
      <label>Service type<select id="wzNewType"><option>Domain</option><option>Integration</option><option>Orchestrator</option></select></label>
      <label>Business capability<input id="wzNewCap" placeholder="e.g. Loyalty Management" /></label>
      <button class="primary" data-act="new-app">Add application</button></div></details>`;
  return h;
}

function wzStepSource() {
  const w = wz(), e = wzEntity();
  let h = wzH(3, "Where does the API come from today?", `Choose what <b>${esc(e ? e.BusinessApplication : "this application")}</b> is migrated <i>from</i>. The next step changes to load that kind of spec and derive the subgraph's schema, queries and mutations from it.`);
  h += `<div class="wz-cards">${Object.entries(WZ_SOURCES).map(([k, s]) => `<div class="wz-card${w.source === k ? " sel" : ""}" data-act="src" data-v="${k}"><h4>${s.icon} ${esc(s.t)}</h4><p>${esc(s.d)}</p><p><b>You need:</b> ${esc(s.need)}</p></div>`).join("")}</div>`;
  return h;
}

// Parse the loaded spec into a selectable operation list (cached until the spec changes).
function wzParse() {
  const w = wz(); if (!w.specText) return null;
  if (WZ_PARSED && WZ_PARSED.key === w.source + "|" + w.specName + "|" + w.specText.length) return WZ_PARSED;
  let ops = [];
  if (w.source === "monograph") {
    loadmonographText(w.specText);                              // also feeds the MonoGraph schema tab
    for (const root of ["Query", "Mutation"]) for (const f of state.monograph.roots[root]) ops.push({ key: root + "." + f.name, label: f.name, root, kind: root === "Mutation" ? "mutation" : "query", args: f.args || "", returns: f.type, notes: f.desc || "" });
  } else {
    const sg = parseOpenAPI(w.specText, wzAppName());
    ops = sg.ops.map(o => ({ key: o.method + " " + o.path, label: o.name, method: o.method, path: o.path, kind: o.opKind, args: o.args.map(a => `${a.name}: ${a.type}`).join(", "), returns: o.returns, notes: o.notes }));
  }
  WZ_PARSED = { key: w.source + "|" + w.specName + "|" + w.specText.length, ops };
  if (!Array.isArray(w.selected)) w.selected = wzDefaultSelection(ops);
  return WZ_PARSED;
}
// Sensible preselection: everything for the service's own API; for MonoGraph / BFF the operations
// that mention the application or return its entity.
function wzDefaultSelection(ops) {
  const w = wz(), e = wzEntity() || {};
  if (w.source === "rest") return ops.map(o => o.key);
  const toks = [String(e.BusinessApplication || ""), String(e.Name || "")].map(s => s.toLowerCase()).filter(s => s.length > 2);
  const others = new Set(state.entities.filter(x => x !== e).map(x => String(x.Name || "")));
  return ops.filter(o => {
    const rt = baseType(o.returns);
    if (rt === e.Name) return true;                            // returns this application's entity
    if (others.has(rt)) return false;                          // returns another application's entity
    const words = w.source === "bff" ? String(o.path || "").toLowerCase().split("/") : [String(o.label).toLowerCase()];
    return toks.some(t => words.some(x => x.startsWith(t)));
  }).map(o => o.key);
}
function wzStepSpec() {
  const w = wz(), src = WZ_SOURCES[w.source] || WZ_SOURCES.rest, P = wzParse(), sg = wzSg();
  const samples = WZ_SAMPLES[w.source] || [];
  const defSample = samples.find(s => s.includes("/" + wzAppName() + "/")) || samples[0] || "";
  let h = wzH(4, `Load the ${src.t} and pick the operations`, w.source === "monograph"
    ? "Load the MonoGraph SDL, then tick the <b>Query / Mutation root fields</b> that move to this subgraph. Referenced types, inputs and enums are derived automatically; types that are other registry entities become <span class=\"mono\">@key</span> reference stubs."
    : w.source === "bff"
      ? "Load the BFF's OpenAPI spec, then tick the <b>composite endpoints</b> this application takes over. Each becomes a query (GET) or mutation (write); flip the kind if needed. Only the types those endpoints use are kept."
      : "Load the service's OpenAPI spec. Every operation is ticked by default: GET → query, writes → mutation (flip the kind if needed). Its component schemas become the subgraph's types.");
  h += `<div class="selrow"><button class="primary" data-act="pick-spec">Choose ${w.source === "monograph" ? "SDL" : "OpenAPI"} file…</button>
    <span class="hint">or a sample</span><select id="wzSample">${samples.map(s => `<option${s === defSample ? " selected" : ""}>${esc(s)}</option>`).join("")}</select><button data-act="sample-spec">Load sample</button>
    <span class="hint">${w.specName ? "Loaded: <b>" + esc(w.specName) + "</b>" : "No spec loaded yet."}</span></div>`;
  if (!P) return h;
  const sel = new Set(w.selected || []);
  h += `<div class="kv">${P.ops.length} operations in the spec · <b>${sel.size}</b> selected <button class="addrow" data-act="sel-all">Select all</button><button class="addrow" data-act="sel-none">Select none</button><button class="addrow" data-act="sel-suggest">Suggested</button></div>
    <div class="table-wrap wz-ops" style="max-height:46vh"><table><thead><tr><th></th><th>${w.source === "monograph" ? "Root field" : "Endpoint"}</th><th>GraphQL operation</th><th>Kind</th><th>Arguments</th><th>Returns</th><th>Notes</th></tr></thead><tbody>${P.ops.map(o => {
      const kind = w.kinds[o.key] || o.kind, on = sel.has(o.key);
      return `<tr class="${on ? "" : "off"}"><td><input type="checkbox" data-act="op" data-v="${esc(o.key)}"${on ? " checked" : ""} /></td><td class="mono">${esc(o.key)}</td><td class="mono">${esc(o.label)}</td><td>${w.source === "monograph" ? esc(kind) : `<select data-act="kind" data-v="${esc(o.key)}"><option${kind === "query" ? " selected" : ""}>query</option><option${kind === "mutation" ? " selected" : ""}>mutation</option></select>`}</td><td class="mono">${esc(o.args)}</td><td class="mono">${esc(o.returns)}</td><td class="hint">${esc(String(o.notes || "").slice(0, 90))}</td></tr>`;
    }).join("")}</tbody></table></div>`;
  h += `<div class="selrow" style="margin-top:12px"><button class="primary" data-act="generate"${sel.size ? "" : " disabled"}>Generate subgraph from ${sel.size} operation${sel.size === 1 ? "" : "s"} →</button>
    ${sg ? `<span class="hint">Generated <b>${esc(sg.name)}</b>: ${sg.types.length} types, ${sg.ops.length} operations. Regenerating replaces edits made in step 5.</span>` : ""}</div>`;
  return h;
}

function wzStepReview() {
  const sg = wzSg(); if (!sg) return wzH(5, "Review", "Generate the subgraph in step 4 first.");
  const rows = buildSubgraphRows(sg), v = validateSubgraphRows(rows), prop = proposedRows(rows);
  const nProp = prop.Schema.length + prop.Queries.length + prop.Mutations.length, nAll = rows.Schema.length + rows.Queries.length + rows.Mutations.length;
  let h = wzH(5, "Review the derived schema, queries and mutations", "These are the exact rows that go into the registry. Edit any cell (types, definitions, parameters, return types, links). Fix any <b>errors</b> flagged by the FedGQL schema standards, then set the rows to <span class=\"mono\">Proposed</span>: only Proposed rows are merged in step 7.");
  h += `<div class="selrow"><span class="counts"><span class="tag ${v.errors.length ? "off" : "on"}">${v.errors.length} errors</span><span class="tag ${v.warnings.length ? "bff" : "on"}">${v.warnings.length} warnings</span><span class="tag ${nProp === nAll ? "on" : "tbc"}">${nProp} of ${nAll} rows Proposed</span></span>
    ${v.errors.some(x => x.ruleId === "NULL-ARRAY-NONNULL") ? `<button data-act="fix-arrays" title="Rewrite list fields in the type definitions as [Type!]! (house standard NULL-ARRAY-NONNULL)">Fix list nullability → [T!]!</button>` : ""}
    <button class="primary" data-act="propose-all">Mark all rows Proposed</button><button data-act="draft-all">Set all back to Draft</button>
</div>`;
  h += `<details style="margin-bottom:10px"><summary><b>Generated federated SDL</b></summary><pre class="code" style="max-height:40vh">${highlightSDL(subgraphSDL(sg))}</pre></details>`;
  h += `<div id="wzCurSg"></div>`;
  return h;
}

function wzStepSave() {
  const w = wz(), sg = wzSg(); if (!sg) return wzH(6, "Save", "Generate the subgraph first.");
  const rows = buildSubgraphRows(sg);
  let h = wzH(6, "Save the subgraph mapping workbook", "Saves this onboarding as <span class=\"mono\">&lt;application&gt;-subgraph.xlsx</span>: an <b>Onboarding</b> sheet (domain, application, source, selected operations, progress), an <b>Operations</b> sheet mapping each source endpoint / root field to its GraphQL operation, the <b>Entities / Schema / Queries / Mutations</b> rows in registry format, and the <b>SourceSpec</b>. Share it for review, or load it in step 1 to resume. You can also save at any time with the 💾 button at the top.");
  h += `<div class="counts"><span class="tag">${rows.Entities.length} entities</span><span class="tag">${rows.Schema.length} schema rows</span><span class="tag">${rows.Queries.length} queries</span><span class="tag">${rows.Mutations.length} mutations</span><span class="tag">${sg.ops.length} operation mappings</span></div>
    <div class="selrow" style="margin-top:12px"><label>File name<input id="wzFile" value="${esc(String(wzAppName()).replace(/[^a-zA-Z0-9_-]+/g, "-"))}-subgraph.xlsx" /></label><button class="primary" data-act="save-map">💾 Save subgraph mapping (.xlsx)</button>
    <span class="hint">${w.savedAt ? "Last saved " + esc(new Date(w.savedAt).toLocaleString()) : "Not saved yet."}</span></div>`;
  return h;
}

function wzStepMerge() {
  const w = wz(), sg = wzSg(); if (!sg) return wzH(7, "Merge", "Generate the subgraph first.");
  const plan = wzMergePlan(), v = plan.validation;
  let h = wzH(7, "Merge into the GQL Registry and save it", "Merges the <b>Proposed</b> rows into the loaded registry. Rows are matched on their natural key (entity by EntityID, type by entity + type name, query / mutation by name), so existing registry rows are updated in place and keep their IDs; new rows are appended. An operation name already owned by another entity is skipped. Then save the full <span class=\"mono\">GQLRegistry.xlsx</span>; every other sheet is kept as loaded.");
  if (v.errors.length) h += `<div class="stdpanel err"><b>${v.errors.length} schema-standards error(s)</b> must be fixed in step 5 before merging:<ul>${v.errors.slice(0, 8).map(x => `<li>${esc(x.subject || "")} ${esc(x.message)}</li>`).join("")}</ul></div>`;
  const by = a => plan.items.filter(i => i.action === a).length;
  h += `<div class="counts"><span class="tag on">${by("add")} to add</span><span class="tag plat">${by("update")} to update</span><span class="tag off">${by("skip")} skipped</span>${plan.bff.length ? `<span class="tag">${plan.bff.length} BffMappings rows</span>` : ""}</div>`;
  h += plan.items.length ? `<div class="table-wrap" style="margin-top:8px;max-height:40vh"><table><thead><tr><th>Action</th><th>Sheet</th><th>ID</th><th>Name</th><th>Note</th></tr></thead><tbody>${plan.items.map(i => `<tr><td class="wz-act-${i.action === "add" ? "add" : i.action === "update" ? "upd" : "skip"}">${i.action}</td><td>${i.sheet}</td><td class="mono">${esc(i.id)}</td><td class="mono">${esc(i.name)}</td><td class="hint">${esc(i.note || "")}</td></tr>`).join("")}${plan.bff.map(b => `<tr><td class="wz-act-${b.action === "add" ? "add" : "upd"}">${b.action}</td><td>BffMappings</td><td class="mono">${esc(b.row.GqlOpId)}</td><td class="mono">${esc(b.row.BffRef)} → ${esc(b.row.GqlOp)}</td><td class="hint">BFF endpoint → FedGQL operation</td></tr>`).join("")}</tbody></table></div>`
    : `<div class="empty">Nothing is marked Proposed. Go back to step 5 and click <b>Mark all rows Proposed</b>.</div>`;
  h += `<div class="selrow" style="margin-top:12px"><button class="primary" data-act="merge"${v.errors.length || !plan.items.some(i => i.action !== "skip") ? " disabled" : ""}>Merge ${plan.items.filter(i => i.action !== "skip").length} rows into the GQL Registry</button>
    <button data-act="save-reg"${w.mergedAt ? "" : " disabled"}>💾 Save GQLRegistry.xlsx</button>
    <button data-act="to-workbench"${w.mergedAt ? "" : " disabled"} title="Open the registry workbench in a new tab with the merged rows, for validation and approval">Open in Registry workbench</button>
    <button data-act="save-map">Save subgraph mapping again</button></div>`;
  if (w.mergedAt) h += `<div class="stdpanel ok">✅ Merged into the loaded registry at ${esc(new Date(w.mergedAt).toLocaleString())}. Save <span class="mono">GQLRegistry.xlsx</span> to keep it, then approve the Proposed rows in the registry workbench. Click <b>Onboard another application</b> to start again with the same registry.</div>`;
  return h;
}

/* ------------------------------ actions -------------------------------- */
function wzPickFile(accept, cb, binary) {
  const inp = document.getElementById("wzFileInput");
  inp.accept = accept; inp.onchange = () => { const f = inp.files[0]; inp.value = ""; if (!f) return; const r = new FileReader(); r.onload = e => cb(e.target.result, f.name); binary ? r.readAsArrayBuffer(f) : r.readAsText(f); };
  inp.click();
}
async function wzFetch(path, binary) {
  try { const res = await fetch(path); if (!res.ok) throw new Error("HTTP " + res.status); return binary ? await res.arrayBuffer() : await res.text(); }
  catch (e) { alert(`Couldn't load ${path} (${e.message || e}).\n\nSamples need the page served over http(s), e.g. GitHub Pages or  python3 -m http.server  in this folder. From disk (file://), use Choose file… and pick it from samples/.`); return null; }
}
function wzLoadRegistry(buf, name) {
  loadRegWB(XLSX.read(buf, { type: "array" }));
  const w = wz(); w.regFile = name; if (w.entityId && !wzEntity()) { w.entityId = ""; wzResetFrom(1); }
  persist(); afterLoad(); toast(`Loaded ${name}: ${state.entities.length} entities`);
}
function wzSetSpec(text, name) {
  const w = wz(); w.specText = text; w.specName = name; w.selected = null; w.kinds = {}; WZ_PARSED = null;
  try { const P = wzParse(); if (!P || !P.ops.length) { alert("No operations found in that file. Is it the right kind of spec?"); w.specText = ""; w.specName = ""; WZ_PARSED = null; } }
  catch (err) { alert("Could not parse the spec: " + (err.message || err)); w.specText = ""; w.specName = ""; WZ_PARSED = null; }
  persist(); wzRender();
}
function wzAddEntity() {
  const app = val("wzNewApp").trim(), ent = val("wzNewEnt").trim().replace(/[^A-Za-z0-9_]/g, ""), dom = val("wzNewDom").trim();
  if (!app || !ent || !dom) { alert("Enter the experience domain, business application and entity type name."); return; }
  if (state.entities.some(e => String(e.BusinessApplication || "").toLowerCase() === app.toLowerCase() && String(e.ExperienceDomain || "") === dom)) { alert(`"${app}" already exists in ${dom}. Pick it from the list.`); return; }
  const id = "ENT-" + pad3(maxNum(state.entities, "EntityID", "ENT") + 1);
  const row = { EntityID: id, Name: cap(ent), ExperienceDomain: dom, BusinessApplication: app, ServiceType: val("wzNewType"), BusinessCapability: val("wzNewCap").trim(), Description: "", Contacts: "", ApprovalStatus: "Draft", Comments: "Added by the onboarding guide", Links: "" };
  state.reg.Entities = state.reg.Entities || state.entities; state.reg.Entities.push(row); state.entities = state.reg.Entities;
  if (!state.regHeaders.Entities || !state.regHeaders.Entities.length) state.regHeaders.Entities = CANON_HEADERS.Entities;
  if (!(state.regOrder || []).includes("Entities")) state.regOrder = ["Entities", ...(state.regOrder || [])];
  const w = wz(); w.domain = dom; w.entityId = id; w.newEntity = true; mapping.migrationEntityId = id; wzResetFrom(2);
  persist(); afterLoad(); toast(`Added ${id} ${row.Name} (${app}) as a Draft entity`);
}
// Collect every type reachable from the selected operations (plus the focus entity) and drop the rest.
function wzPrune(sg, keep) {
  const by = Object.fromEntries(sg.types.map(t => [t.name, t])), seen = new Set(), q = [...keep];
  sg.ops.forEach(o => { q.push(baseType(o.returns)); (o.args || []).forEach(a => q.push(baseType(a.type))); });
  while (q.length) { const n = q.pop(); if (!n || seen.has(n) || !by[n]) continue; seen.add(n); (by[n].fields || []).forEach(f => q.push(baseType(f.type))); }
  sg.types = sg.types.filter(t => seen.has(t.name));
}
// MonoGraph root fields → a subgraph: reachable types are copied; other registry entities become reference stubs.
function wzMonographSubgraph(keys, sgName, entityName) {
  const BUILTIN = new Set(["ID", "String", "Int", "Float", "Boolean"]), regNames = new Set(state.entities.map(e => String(e.Name || "")));
  const types = [], seen = new Set(), ops = [];
  const enumVals = t => { const m = String(t.raw || "").match(/\{([\s\S]*)\}/); return m ? stripDescriptions(m[1]).split(/\r?\n/).map(s => s.replace(/#.*$/, "").trim()).filter(s => /^[A-Za-z_]/.test(s)).map(s => s.split(/[\s,@]/)[0]) : []; };
  const visit = n => {
    n = baseType(String(n || "").split("=")[0]); if (!n || BUILTIN.has(n) || seen.has(n)) return;
    const t = monographTypeByName(n); if (!t) return; seen.add(n);
    if (t.kind === "scalar" || t.kind === "union") return;      // custom scalars live on the FedGQL foundation entity; unions need manual modelling
    if (t.kind === "enum") { types.push({ name: n, kind: "enum", isEntity: false, key: "", fields: [], values: enumVals(t) }); return; }
    if (t.kind === "type" && n !== entityName && regNames.has(n)) {   // owned by another application → @key reference stub
      const key = keyOf(t.fields, t.keyFields), keys = key.split(/\s+/);
      types.push({ name: n, kind: "type", isEntity: true, key, fields: t.fields.filter(f => keys.includes(f.name)).map(f => ({ name: f.name, type: f.type })), values: [], ext: { mode: "reference" } });
      return;
    }
    const kind = t.kind === "input" ? "input" : t.kind === "interface" ? "interface" : "type", isEntity = kind === "type" && n === entityName;
    types.push({ name: n, kind, isEntity, key: isEntity ? keyOf(t.fields, t.keyFields) : "", fields: t.fields.map(f => ({ name: f.name, type: f.type })), values: [] });
    t.fields.forEach(f => { visit(f.type); parseArgs(f.args || "").forEach(a => visit(a.type)); });
  };
  for (const k of keys) {
    const [root, name] = k.split("."), f = monographRootByName(root, name); if (!f) continue;
    const args = parseArgs(f.args || "");
    ops.push({ id: uid(), name, method: "GQL", path: k, opKind: root === "Mutation" ? "mutation" : "query", args, returns: f.type, entity: baseType(f.type), notes: f.desc || "" });
    visit(f.type); args.forEach(a => visit(a.type));
  }
  return { id: uid(), name: sgName, spec: wz().specName, ops, types };
}
function wzGenerate() {
  const w = wz(), e = wzEntity(); if (!e || !w.specText) return;
  const sel = new Set(w.selected || []), sgName = wzAppName();
  if (wzSg() && Object.keys(mapping.overrides || {}).some(s => Object.keys(mapping.overrides[s] || {}).some(id => id.includes("-" + e.EntityID + "-"))) && !confirm("Regenerating replaces the edits you made in step 5 for this application. Continue?")) return;
  let sg;
  if (w.source === "monograph") { wzParse(); sg = wzMonographSubgraph([...sel], sgName, String(e.Name || "")); }
  else {
    sg = parseOpenAPI(w.specText, sgName); sg.spec = w.specName;
    sg.ops = sg.ops.filter(o => sel.has(o.method + " " + o.path)).map(o => Object.assign(o, { opKind: w.kinds[o.method + " " + o.path] || o.opKind }));
    wzPrune(sg, [String(e.Name || "")]);
  }
  if (!sg.ops.length) { alert("Select at least one operation."); return; }
  // reuse the wizard's previous subgraph (or one with the same name) so the Subgraphs tab stays tidy
  const prev = mapping.subgraphs.find(s => s.id === w.sgId) || mapping.subgraphs.find(s => s.name === sgName);
  if (prev) { prev.types = sg.types; prev.ops = sg.ops; prev.spec = sg.spec; sg = prev; } else mapping.subgraphs.push(sg);
  // drop stale edits for this entity's rows
  for (const s of Object.keys(mapping.overrides || {})) for (const id of Object.keys(mapping.overrides[s])) if (id.includes("-" + e.EntityID + "-")) delete mapping.overrides[s][id];
  if (mapping.additions) delete mapping.additions[sg.id];
  // Focus on the registry entity's own type (promoted to @key). If the spec doesn't define it (typical for a
  // BFF), the rows are still owned by its EntityID and the registry keeps its existing definition.
  const tn = String(e.Name || ""), ft = sg.types.find(t => t.name === tn && !t.ext);
  if (ft) { ft.kind = "type"; ft.isEntity = true; if (!ft.key) ft.key = keyOf(ft.fields); }
  // Other id-keyed object types: another application's registry entity → @key reference stub;
  // anything else is a value type of this subgraph (kept, not split out as a separate entity).
  const others = new Set(state.entities.filter(x => x !== e).map(x => String(x.Name || "")));
  for (const t of sg.types) {
    if (t === ft || t.ext || !t.isEntity) continue;
    if (others.has(t.name)) { const keys = String(t.key || keyOf(t.fields)).split(/\s+/); t.ext = { mode: "reference" }; t.key = keys.join(" "); t.fields = t.fields.filter(f => keys.includes(f.name)); }
    else { t.isEntity = false; t.key = ""; }
  }
  mapping.focusEntity = sg.id + "::" + tn; mapping.migrationEntityId = e.EntityID; selRest = sg.id; applyRegistryToFocus();
  w.sgId = sg.id; wzResetFrom(4); w.sgId = sg.id;
  persist(); afterLoad();
  toast(`Generated ${sg.name}: ${sg.types.length} types, ${sg.ops.length} operations`);
  wzGo(4);
}
function wzSetAllStatus(status) {
  const sg = wzSg(); if (!sg) return;
  const rows = buildSubgraphRows(sg), o = (mapping.overrides = mapping.overrides || {});
  for (const s of ["Entities", "Schema", "Queries", "Mutations"]) for (const r of rows[s]) { const id = r[OV_ID[s]]; if (!id) continue; (o[s] = o[s] || {}); (o[s][id] = o[s][id] || {}).ApprovalStatus = status; }
  const w = wz(); w.savedAt = ""; w.mergedAt = ""; persist(); wzRender(); toast(`All rows set to ${status}`);
}
// One-click fix for the most common import error: list fields must be [Type!]! (NULL-ARRAY-NONNULL).
function wzFixArrays() {
  const sg = wzSg(); if (!sg) return;
  const o = (mapping.overrides = mapping.overrides || {}); let n = 0;
  for (const r of buildSubgraphRows(sg).Schema) {
    if (/^Enum$/i.test(r.Kind)) continue;
    const def = String(r.Definition || ""), fixed = def.split(/\n/).map(l => l.replace(/^(\s*[A-Za-z_]\w*\s*(?:\([^)]*\))?\s*:\s*)\[\s*([A-Za-z_]\w*)\s*!?\s*\]\s*!?/, "$1[$2!]!")).join("\n");
    if (fixed !== def) { (o.Schema = o.Schema || {}); (o.Schema[r.SchemaID] = o.Schema[r.SchemaID] || {}).Definition = fixed; n++; }
  }
  const w = wz(); w.savedAt = ""; w.mergedAt = ""; persist(); wzRender(); toast(n ? `Fixed list fields in ${n} type definition(s)` : "No list fields to fix");
}
function wzReviewed() {
  const sg = wzSg(); if (!sg) return;
  const rows = buildSubgraphRows(sg), v = validateSubgraphRows(rows), p = proposedRows(rows);
  if (v.errors.length) { alert(`${v.errors.length} schema-standards error(s) still need fixing:\n\n` + summarizeViolations(v.errors)); return; }
  if (!(p.Schema.length + p.Queries.length + p.Mutations.length)) { if (!confirm("No rows are Proposed yet, and only Proposed rows are merged.\n\nMark all rows Proposed now?")) return; wzSetAllStatus("Proposed"); }
  const w = wz(); w.reviewed = true; persist(); wzGo(5);
}

/* ------------------------- save / resume mapping ------------------------ */
// The registry row generated for a source operation: matched on its source reference in Links
// ("GET /bff/cart/{cartId}" / "Query.product"), so renaming the operation in step 5 keeps the link.
function wzOpRow(rows, o) {
  const list = o.opKind === "query" ? rows.Queries : rows.Mutations, ref = o.method === "GQL" ? o.path : `${o.method} ${o.path}`.trim();
  return list.find(r => ref && String(r.Links || "").split(/\n/).some(l => l.trim().endsWith(ref))) || list.find(r => r.Name === o.name) || null;
}
function wzSaveMapping() {
  const w = wz(), sg = wzSg(), e = wzEntity(); if (!sg) return;
  const rows = buildSubgraphRows(sg), wb = XLSX.utils.book_new(), now = new Date().toISOString();
  w.savedAt = now;
  const kv = [["Field", "Value"], ["Registry file", w.regFile], ["Experience domain", e ? e.ExperienceDomain : ""], ["Business application", e ? e.BusinessApplication : ""], ["EntityID", w.entityId], ["Entity", e ? e.Name : ""], ["Service type", e ? e.ServiceType : ""], ["New entity", w.newEntity ? "yes" : "no"],
    ["Source", w.source], ["Source description", (WZ_SOURCES[w.source] || {}).t || ""], ["Spec file", w.specName], ["Selected operations", (w.selected || []).join("\n")], ["Kind overrides", Object.entries(w.kinds || {}).map(([k, v]) => k + " = " + v).join("\n")],
    ["Step reached", `${w.step + 1} · ${WZ_STEPS[w.step].t}`], ["Progress", wzPct() + "%"], ["Saved at", now], ["Merged into registry", w.mergedAt || "no"]];
  const ws = XLSX.utils.aoa_to_sheet(kv); ws["!cols"] = [{ wch: 22 }, { wch: 90 }]; XLSX.utils.book_append_sheet(wb, ws, "Onboarding");
  // RegistryID = the id the row has (or will get) in the registry after the merge; GqlOpId is the provisional generated id
  let plan = null; try { plan = state.entities.length ? wzMergePlan() : null; } catch (_) {}
  const regId = (sheet, id) => { const it = plan && plan.items.find(i => i.sheet === sheet && i.srcId === id); return it ? (it.action === "skip" ? "skipped: " + it.note : it.id) : ""; };
  const opRows = [["Source", "SourceRef", "GqlKind", "GqlOp", "GqlOpId", "RegistryID", "EntityID", "Args", "Returns", "Notes"]];
  for (const o of sg.ops) { const r = wzOpRow(rows, o) || {}, sheet = o.opKind === "query" ? "Queries" : "Mutations", gid = r.QueryID || r.MutationID || ""; opRows.push([w.source || (o.method === "GQL" ? "monograph" : "rest"), o.method === "GQL" ? o.path : `${o.method} ${o.path}`.trim(), o.opKind, r.Name || o.name, gid, regId(sheet, gid) || (w.mergedAt ? "" : "(not Proposed)"), r.EntityID || "", (o.args || []).map(a => `${a.name}: ${a.type}`).join(", "), o.returns || "", o.notes || ""]); }
  const os = XLSX.utils.aoa_to_sheet(opRows); os["!cols"] = opRows[0].map((h, i) => ({ wch: [10, 34, 9, 24, 18, 18, 10, 40, 24, 50][i] })); XLSX.utils.book_append_sheet(wb, os, "Operations");
  for (const s of ["Entities", "Schema", "Queries", "Mutations"]) {
    const headers = (state.regHeaders[s] && state.regHeaders[s].length) ? state.regHeaders[s] : CANON_HEADERS[s];
    const sh = XLSX.utils.aoa_to_sheet([headers, ...rows[s].map(r => headers.map(h => r[h] != null ? r[h] : ""))]); sh["!cols"] = headers.map(h => ({ wch: Math.max(12, String(h).length + 2) }));
    XLSX.utils.book_append_sheet(wb, sh, s);
  }
  if (w.specText) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["SourceSpec"], ...w.specText.split(/\r?\n/).map(l => [l.slice(0, 32000)])]), "SourceSpec");
  const fname = (document.getElementById("wzFile") && val("wzFile").trim()) || String(wzAppName()).replace(/[^a-zA-Z0-9_-]+/g, "-") + "-subgraph.xlsx";
  XLSX.writeFile(wb, /\.xlsx$/i.test(fname) ? fname : fname + ".xlsx");
  persist(); wzRender(); toast("Saved " + fname);
}
function wzResume(buf, name) {
  const wb = XLSX.read(buf, { type: "array" });
  const kv = {}; if (wb.Sheets.Onboarding) for (const r of XLSX.utils.sheet_to_json(wb.Sheets.Onboarding, { header: 1 }).slice(1)) if (r[0]) kv[r[0]] = r[1] == null ? "" : String(r[1]);
  const w = wz(), entId = kv.EntityID || (sheetRows(wb, "Entities")[0] || {}).EntityID || "";
  // the application may be new (not in the registry yet): re-add it from the saved Entities row
  if (entId && !state.entities.some(e => String(e.EntityID) === entId)) {
    const er = sheetRows(wb, "Entities").find(r => String(r.EntityID) === entId);
    if (er) { state.reg.Entities = state.reg.Entities || state.entities; state.reg.Entities.push(Object.assign({ ApprovalStatus: "Draft" }, er)); state.entities = state.reg.Entities; w.newEntity = true; }
  }
  let res; try { res = loadSubgraphMigrationWB(wb, name); } catch (err) { alert(err.message || "Not a subgraph mapping workbook."); return; }
  if (kv["Business application"]) res.sg.name = kv["Business application"];
  // MonoGraph / REST source refs back onto the ops (Links only carry REST lines)
  const opSheet = sheetRows(wb, "Operations");
  for (const o of res.sg.ops) { const r = opSheet.find(x => x.GqlOp === o.name); if (!r) continue; const ref = String(r.SourceRef || ""); if (/^(Query|Mutation)\./.test(ref)) { o.method = "GQL"; o.path = ref; } else { const m = ref.match(/^(\S+)\s+(.*)$/); if (m) { o.method = m[1]; o.path = m[2]; } } }
  Object.assign(w, { entityId: entId, domain: kv["Experience domain"] || w.domain, source: kv.Source || w.source || "rest", specName: kv["Spec file"] || "", selected: kv["Selected operations"] ? kv["Selected operations"].split(/\n/).filter(Boolean) : null,
    kinds: Object.fromEntries(String(kv["Kind overrides"] || "").split(/\n/).filter(Boolean).map(l => l.split(" = "))), sgId: res.sg.id, reviewed: false, savedAt: "", mergedAt: "" });
  w.specText = wb.Sheets.SourceSpec ? XLSX.utils.sheet_to_json(wb.Sheets.SourceSpec, { header: 1 }).slice(1).map(r => r[0] == null ? "" : String(r[0])).join("\n") : "";
  WZ_PARSED = null;
  const ent = wzEntity();
  if (ent) { const ft = res.sg.types.find(t => t.name === ent.Name); mapping.focusEntity = res.sg.id + "::" + (ft ? ft.name : ensureEntity(res.sg)); mapping.migrationEntityId = ent.EntityID; applyRegistryToFocus(); }
  // carry the saved approval status / text edits over by row id
  const built = buildSubgraphRows(res.sg), o = (mapping.overrides = mapping.overrides || {});
  for (const s of ["Schema", "Queries", "Mutations"]) for (const r of sheetRows(wb, s)) { const id = r[OV_ID[s]]; if (!id || !built[s].some(b => b[OV_ID[s]] === id)) continue; (o[s] = o[s] || {}); o[s][id] = Object.assign(o[s][id] || {}, { ApprovalStatus: r.ApprovalStatus || "Draft", Description: r.Description || "", Links: r.Links || "", Comments: r.Comments || "" }); }
  w.step = 4; persist(); afterLoad(); wzGo(4);
  toast(`Resumed ${res.sg.name}: ${res.types} types, ${res.ops} operations`);
}

/* ------------------------------ merge ---------------------------------- */
const WZ_PREFIX = { Schema: "SCH", Queries: "QRY", Mutations: "MUT" };
function wzNextChildId(sheet, entId, taken) {
  const pre = WZ_PREFIX[sheet] + "-" + entId + "-"; let n = 0;
  for (const id of taken) if (id.startsWith(pre)) n = Math.max(n, parseInt(id.slice(pre.length), 10) || 0);
  return pre + pad3(n + 1);
}
// What a merge would do: per Proposed row, add / update (natural-key match, keeps the registry id) / skip.
function wzMergePlan() {
  const sg = wzSg(), reg = state.reg, w = wz();
  const built = buildSubgraphRows(sg), rows = proposedRows(built), validation = validateSubgraphRows(rows), items = [];
  const taken = {}; for (const s of ["Schema", "Queries", "Mutations"]) taken[s] = new Set((reg[s] || []).map(r => String(r[OV_ID[s]] || "")));
  for (const r of rows.Entities) { const ex = (reg.Entities || []).find(x => String(x.EntityID) === String(r.EntityID)); items.push({ sheet: "Entities", action: ex ? "update" : "add", id: r.EntityID, name: r.Name, row: r, target: ex, note: ex ? "domain fields refreshed; blanks keep the registry value" : "new entity" }); }
  for (const r of rows.Schema) {
    const ex = (reg.Schema || []).find(x => String(x.EntityID) === String(r.EntityID) && String(x.TypeName) === String(r.TypeName));
    const owner = !ex && !/^(Reference|Extend)$/i.test(r.Kind) && (reg.Schema || []).find(x => String(x.TypeName) === String(r.TypeName) && String(x.EntityID) !== String(r.EntityID) && !/^(Reference|Extend)$/i.test(x.Kind));
    if (owner) { items.push({ sheet: "Schema", action: "skip", id: owner.SchemaID, name: `${r.Kind} ${r.TypeName}`, note: `already defined by ${owner.EntityID} (${owner.Kind}); the shared definition is used, so rename the type in step 5 if it differs` }); continue; }
    let id = ex ? ex.SchemaID : r.SchemaID; if (!ex && taken.Schema.has(String(id))) id = wzNextChildId("Schema", r.EntityID, taken.Schema); if (!ex) taken.Schema.add(String(id));
    items.push({ sheet: "Schema", action: ex ? "update" : "add", id, name: `${r.Kind} ${r.TypeName}`, row: Object.assign({}, r, { SchemaID: id }), target: ex });
  }
  for (const s of ["Queries", "Mutations"]) for (const r of rows[s]) {
    const ex = (reg[s] || []).find(x => String(x.Name) === String(r.Name)), idK = OV_ID[s];
    if (ex && String(ex.EntityID) !== String(r.EntityID)) { items.push({ sheet: s, action: "skip", id: ex[idK], name: r.Name, note: `already owned by ${ex.EntityID}; rename it in step 5 to merge` }); continue; }
    let id = ex ? ex[idK] : r[idK]; if (!ex && taken[s].has(String(id))) id = wzNextChildId(s, r.EntityID, taken[s]); if (!ex) taken[s].add(String(id));
    items.push({ sheet: s, action: ex ? "update" : "add", id, name: r.Name, row: Object.assign({}, r, { [idK]: id }), target: ex, srcId: r[idK] });
  }
  // BFF source: record each BFF endpoint → FedGQL operation (feeds Code migration's BFF composite mode)
  const bff = [];
  if (w.source === "bff") {
    sg.ops.forEach(o => {
      const br = wzOpRow(built, o), sheet = o.opKind === "query" ? "Queries" : "Mutations";
      const it = br && items.find(i => i.sheet === sheet && i.srcId === br[OV_ID[sheet]] && i.action !== "skip"); if (!it) return;
      const row = { BffRef: `${o.method} ${o.path}`, BffName: o.name, Alias: it.row.Name, GqlKind: o.opKind, GqlOp: it.row.Name, GqlOpId: it.id, EntityID: it.row.EntityID, Args: (o.args || []).map(a => `${a.name}: $${a.name}`).join(", "), Order: 1, Notes: "added by the onboarding guide", Owner: wzAppName() };
      const ex = (reg.BffMappings || []).find(x => x.BffRef === row.BffRef && x.GqlOp === row.GqlOp);
      bff.push({ action: ex ? "update" : "add", row, target: ex });
    });
  }
  return { items, bff, validation, rows };
}
function wzMerge() {
  const plan = wzMergePlan(), reg = state.reg, w = wz();
  if (plan.validation.errors.length) return;
  const ensure = (s, hdr) => { reg[s] = reg[s] || []; if (!state.regHeaders[s] || !state.regHeaders[s].length) state.regHeaders[s] = hdr; state.regOrder = state.regOrder || []; if (!state.regOrder.includes(s)) state.regOrder.push(s); };
  const fold = (target, row) => { for (const [k, v] of Object.entries(row)) if (v != null && String(v) !== "") target[k] = v; };
  let n = 0;
  for (const i of plan.items) {
    if (i.action === "skip") continue;
    ensure(i.sheet, CANON_HEADERS[i.sheet]);
    if (i.target && i.sheet === "Entities") { const keep = { Name: i.target.Name, ApprovalStatus: i.target.ApprovalStatus }; fold(i.target, i.row); for (const [k, v] of Object.entries(keep)) if (v) i.target[k] = v; }   // never rename / re-status an existing entity
    else if (i.target) fold(i.target, i.row);
    else reg[i.sheet].push(Object.assign({}, i.row));
    n++;
  }
  for (const b of plan.bff) { ensure("BffMappings", WZ_BFF_HEADERS); if (b.target) fold(b.target, b.row); else reg.BffMappings.push(b.row); n++; }
  state.entities = reg.Entities || state.entities; state.schema = reg.Schema || [];
  w.mergedAt = new Date().toISOString(); w.lastMerged = { Entities: plan.items.filter(i => i.sheet === "Entities" && i.action !== "skip").map(i => i.row), Schema: plan.items.filter(i => i.sheet === "Schema").map(i => i.row), Queries: plan.items.filter(i => i.sheet === "Queries" && i.action !== "skip").map(i => i.row), Mutations: plan.items.filter(i => i.sheet === "Mutations" && i.action !== "skip").map(i => i.row) };
  persist(); afterLoad(); toast(`Merged ${n} rows into the GQL Registry; save GQLRegistry.xlsx to keep them`);
}
function wzSaveRegistry() {
  const wb = XLSX.utils.book_new(), reg = state.reg;
  const order = (state.regOrder && state.regOrder.length ? state.regOrder : Object.keys(reg)).filter(s => reg[s]);
  for (const s of order) {
    const rows = reg[s] || [], hdr = [...((state.regHeaders[s] && state.regHeaders[s].length) ? state.regHeaders[s] : (CANON_HEADERS[s] || []))];
    for (const r of rows) for (const k of Object.keys(r)) if (!hdr.includes(k) && !k.startsWith("__")) hdr.push(k);
    const ws = XLSX.utils.aoa_to_sheet([hdr, ...rows.map(r => hdr.map(h => r[h] != null ? r[h] : ""))]); ws["!cols"] = hdr.map(h => ({ wch: Math.max(12, String(h).length + 2) }));
    XLSX.utils.book_append_sheet(wb, ws, s);
  }
  const name = wz().regFile || "GQLRegistry.xlsx";
  XLSX.writeFile(wb, name); toast("Saved " + name);
}
// Open the registry workbench in a new tab and hand it the merged rows (it upserts them and acks).
function wzToWorkbench() {
  const m = wz().lastMerged; if (!m) return;
  const win = window.open("workbench.html", "_blank");
  if (!win) { toast("Allow pop-ups to open the registry workbench"); return; }
  let tries = 0; const iv = setInterval(() => { try { win.postMessage({ type: "fedgql-merge", rows: m }, "*"); } catch (_) {} if (++tries > 30) clearInterval(iv); }, 400);
  const ack = e => { if (e.data && e.data.type === "fedgql-merged") { clearInterval(iv); window.removeEventListener("message", ack); } };
  window.addEventListener("message", ack);
}
// Header "Load example": sample registry + the chosen application + its OpenAPI spec, then pick operations.
async function wzLoadExample(sgName) {
  const b = await wzFetch("samples/GQLRegistry-sample.xlsx", true); if (!b) return;
  wzLoadRegistry(b, "GQLRegistry-sample.xlsx");
  const w = wz(), e = state.entities.find(x => String(x.BusinessApplication || "").trim() === sgName); if (!e) return;
  Object.assign(w, { entityId: String(e.EntityID), domain: String(e.ExperienceDomain || ""), newEntity: false, source: "rest" }); mapping.migrationEntityId = w.entityId; wzResetFrom(2);
  const p = `samples/subgraph/${sgName}/openapi.yaml`, t = await wzFetch(p); if (!t) return;
  wzSetSpec(t, p); persist(); wzGo(3); toast(`Example: ${sgName} (${e.EntityID}) from its REST API — pick the operations`);
}

/* ------------------------------ wiring --------------------------------- */
function wzInit() {
  if (state.reg && state.reg.Entities) state.entities = state.reg.Entities;   // one array after a reload
  const root = document.getElementById("view-guide"); if (!root) return;
  document.getElementById("wzSteps").addEventListener("click", e => { const li = e.target.closest("li[data-step]"); if (li) wzGo(+li.dataset.step); });
  document.getElementById("wzBack").onclick = () => wzGo(wz().step - 1);
  document.getElementById("wzNext").onclick = () => {
    const w = wz();
    if (w.step === 4) return wzReviewed();
    if (w.step === WZ_STEPS.length - 1) { if (!confirm("Start onboarding another application? The loaded registry (with your merge) is kept.")) return; Object.assign(w, { step: 1, entityId: "", source: "", newEntity: false }); wzResetFrom(0); persist(); return wzRender(); }
    wzGo(w.step + 1);
  };
  document.getElementById("wzSaveTop").onclick = wzSaveMapping;
  // top band / work area layout, toolbar collapse, overview toggle, drag bar (shared: onboarding.js)
  onbLayout({ root, top: document.getElementById("wzTop"), split: document.getElementById("wzHSplit"), ovBtn: document.getElementById("wzOvToggle"), chromeBtn: document.getElementById("chromeToggle"), key: "gql-onb" });
  document.getElementById("wzRestart").onclick = () => { if (!confirm("Restart the onboarding guide? Generated subgraphs stay on the Subgraphs tab.")) return; mapping.wizard = null; wzResetFrom(0); WZ_PARSED = null; persist(); wzRender(); };
  const body = document.getElementById("wzBody");
  body.addEventListener("click", async e => {
    const el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
    const w = wz(), a = el.dataset.act, v = el.dataset.v;
    if (a === "pick-reg") wzPickFile(".xlsx", wzLoadRegistry, true);
    else if (a === "sample-reg") { const b = await wzFetch("samples/GQLRegistry-sample.xlsx", true); if (b) wzLoadRegistry(b, "GQLRegistry-sample.xlsx"); }
    else if (a === "pick-resume") wzPickFile(".xlsx", wzResume, true);
    else if (a === "dom") { w.domain = v; persist(); wzRender(); }
    else if (a === "app") { if (w.entityId !== v) { w.entityId = v; w.newEntity = false; mapping.migrationEntityId = v; wzResetFrom(2); w.source = ""; } persist(); wzRender(); }
    else if (a === "new-app") wzAddEntity();
    else if (a === "src") { if (w.source !== v) { w.source = v; wzResetFrom(2); } persist(); wzRender(); }
    else if (a === "pick-spec") wzPickFile((WZ_SOURCES[w.source] || WZ_SOURCES.rest).accept, wzSetSpec);
    else if (a === "sample-spec") { const p = val("wzSample"); const t = await wzFetch(p); if (t) wzSetSpec(t, p); }
    else if (a === "sel-all" || a === "sel-none" || a === "sel-suggest") { const P = wzParse(); w.selected = a === "sel-all" ? P.ops.map(o => o.key) : a === "sel-none" ? [] : wzDefaultSelection(P.ops); persist(); wzRender(); }
    else if (a === "generate") wzGenerate();
    else if (a === "propose-all") wzSetAllStatus("Proposed");
    else if (a === "fix-arrays") wzFixArrays();
    else if (a === "draft-all") wzSetAllStatus("Draft");
    else if (a === "save-map") wzSaveMapping();
    else if (a === "merge") wzMerge();
    else if (a === "save-reg") wzSaveRegistry();
    else if (a === "to-workbench") wzToWorkbench();
  });
  body.addEventListener("change", e => {
    const el = e.target.closest("[data-act]"); if (!el) return;
    const w = wz();
    if (el.dataset.act === "op") { const s = new Set(w.selected || []); el.checked ? s.add(el.dataset.v) : s.delete(el.dataset.v); w.selected = [...s]; persist(); wzRender(); }
    else if (el.dataset.act === "kind") { w.kinds[el.dataset.v] = el.value; persist(); }
  });
  // edits in the review grid make the last save / merge stale
  body.addEventListener("change", e => { if (wz().step === 4 && e.target.closest("#wzCurSg")) { const w = wz(); w.savedAt = ""; w.mergedAt = ""; } }, true);
  // re-render whichever view is opened, so the shared subgraph editor lands in the visible host
  wzRender();
}

/* ------------------------- Migration overview --------------------------
   Moved here from the Code migration page and driven by the guide: source estate → onboarding guide
   → subgraph mapping workbook + GQL Registry → federated supergraph. The stage boxes and connectors are
   built once and only their classes change, so colour changes animate: grey (to do) → purple, pulsing
   (current step) → green (done); the connector into the next stage animates while data is "in flight". */
const WZ_ICON = ONB_ICON;                                        // shared icons (onboarding.js)
const WZ_STEP_ICON = ["upload", "domain", "source", "pick", "diff", "save", "merge"];
let WZ_OV_PREV = {};
const wzOvItem = onbItem;
function wzOvBuild(host) {
  host.innerHTML = `<div class="ov">
    <div class="ov-node ov-src" data-node="src" data-go="2" title="Steps 1–4: registry, application, source and spec"><h3>Source estate</h3><div class="ov-sub">what exists today</div>
      ${wzOvItem("upload", "GQLRegistry.xlsx", "reg")}${wzOvItem("app", "Application", "app")}
      <div class="ov-div">migrate from</div>
      ${wzOvItem("graph", "MonoGraph SDL", "src-monograph")}${wzOvItem("layers", "BFF REST API", "src-bff")}${wzOvItem("spec", "Service REST API", "src-rest")}</div>
    <div class="ov-conn"><svg viewBox="0 0 40 100" preserveAspectRatio="none"><path data-edge="e1" d="M0 50H40"/></svg><span class="ov-tip" data-edge="e1" style="top:50%"></span></div>
    <div class="ov-node ov-hub" data-node="hub" data-go="4" title="Step 5: review the derived schema"><h3>${WZ_ICON.swap} Onboarding guide</h3><div class="ov-sub">derive · review · validate against the FedGQL standards</div>
      <div class="ov-core">${WZ_ICON.graph}<b data-slot="core">Source → FedGQL</b></div>
      ${onbStepsHTML(WZ_STEPS, WZ_STEP_ICON)}
      <div class="ov-blue">Migration blueprint<span class="mono" data-slot="blue"></span></div></div>
    <div class="ov-conn"><svg viewBox="0 0 40 100" preserveAspectRatio="none"><path data-edge="e2a" d="M0 50H20V25H40"/><path data-edge="e2b" d="M0 50H20V75H40"/></svg><span class="ov-tip" data-edge="e2a" style="top:25%"></span><span class="ov-tip" data-edge="e2b" style="top:75%"></span></div>
    <div class="ov-col">
      <div class="ov-node ov-map" data-node="map" data-go="5" title="Step 6: save the subgraph mapping workbook"><h3>Subgraph mapping</h3><div class="ov-sub mono" data-slot="mapfile">&lt;app&gt;-subgraph.xlsx</div>
        ${wzOvItem("table", "Onboarding · Operations", "map-ops")}${wzOvItem("spec", "Schema · Queries · Mutations", "map-rows")}</div>
      <div class="ov-node ov-reg" data-node="reg" data-go="6" title="Step 7: merge into the GQL Registry"><h3>GQL Registry</h3><div class="ov-sub mono" data-slot="regfile">GQLRegistry.xlsx</div>
        ${wzOvItem("merge", "Proposed rows merged", "reg-rows")}${wzOvItem("layers", "BffMappings", "reg-bff")}</div>
    </div>
    <div class="ov-conn"><svg viewBox="0 0 40 100" preserveAspectRatio="none"><path data-edge="e3" d="M0 25H20V50H40"/><path data-edge="e3" d="M0 75H20V50H40"/></svg><span class="ov-tip" data-edge="e3" style="top:50%"></span></div>
    <div class="ov-node ov-tgt" data-node="tgt" data-go="6" title="The finished federated subgraph"><h3>Federated supergraph</h3><div class="ov-sub">one graph behind the FedGQL router</div>
      ${wzOvItem("router", "FedGQL router", "tgt-router")}${wzOvItem("graph", "Subgraph", "tgt-sg")}${wzOvItem("key", "@key entity", "tgt-ent")}${wzOvItem("query", "Queries", "tgt-q")}${wzOvItem("write", "Mutations", "tgt-m")}${wzOvItem("check", "Approve in registry", "tgt-ok")}</div>
  </div>`;
  onbWire(host, wzGo);
}
function wzOverview() {
  const host = document.getElementById("wzOverview"); if (!host) return;
  if (!host.firstElementChild) wzOvBuild(host);
  const w = wz(), d = wzDone(), e = wzEntity(), sg = wzSg(), step = w.step;
  const nq = sg ? sg.ops.filter(o => o.opKind === "query").length : 0, nm = sg ? sg.ops.length - nq : 0;
  // stage state: done / current (both can hold when the user steps back)
  const S = { src: [d[3], step <= 3], hub: [d[4], step === 4], map: [d[5], step === 5], reg: [d[6], step === 6], tgt: [d[6], false] };
  onbStages(host, S, WZ_OV_PREV);
  // connectors: green once the stage they feed is done, animated while that stage is current / next
  onbEdge(host, "e1", onbFlow(S, "src", "hub")); onbEdge(host, "e2a", onbFlow(S, "hub", "map")); onbEdge(host, "e2b", onbFlow(S, "hub", "reg", step === 6)); onbEdge(host, "e3", onbFlow(S, "reg", "tgt", step === 6));
  onbSteps(host, d, step);
  // item states + live counts
  const item = (slot, txt, ok, pick) => onbItemSet(host, slot, txt, ok, pick);
  item("reg", state.entities.length ? `${state.entities.length} entities` : "load in step 1", d[0]);
  item("app", e ? `${e.BusinessApplication} · ${e.EntityID}` : "pick in step 2", d[1]);
  for (const k of Object.keys(WZ_SOURCES)) item("src-" + k, w.source === k ? (w.specName ? w.specName.split("/").pop() : "selected · load the spec") : "", w.source === k && d[3], w.source ? w.source === k : undefined);
  const set = (slot, txt) => onbSlot(host, slot, txt);
  set("core", w.source ? `${{ monograph: "MonoGraph", bff: "BFF REST", rest: "REST" }[w.source]} → FedGQL` : "Source → FedGQL");
  set("blue", e && sg ? `${e.BusinessApplication} (${e.EntityID}) → ${sg.types.length} types · ${nq} Q · ${nm} M` : e ? `${e.BusinessApplication} (${e.EntityID}) → pick a source and operations` : "pick a domain and application");
  let rows = null, plan = null;
  if (sg) { try { rows = buildSubgraphRows(sg); if (state.entities.length && d[4]) plan = wzMergePlan(); } catch (_) {} }
  set("mapfile", `${String(wzAppName()).replace(/[^a-zA-Z0-9_-]+/g, "-")}-subgraph.xlsx`);
  item("map-ops", sg ? `${sg.ops.length} operations mapped${w.savedAt ? " · saved " + new Date(w.savedAt).toLocaleTimeString() : ""}` : "", d[5]);
  item("map-rows", rows ? `${rows.Schema.length} types · ${rows.Queries.length} Q · ${rows.Mutations.length} M` : "", d[5]);
  set("regfile", w.regFile || "GQLRegistry.xlsx");
  const pc = a => plan ? plan.items.filter(i => i.action === a).length : 0;
  item("reg-rows", w.mergedAt ? `merged ${new Date(w.mergedAt).toLocaleTimeString()}` : plan ? `${pc("add")} add · ${pc("update")} update · ${pc("skip")} skip` : "", d[6]);
  item("reg-bff", w.source === "bff" ? (plan ? `${plan.bff.length} endpoint mappings` : "BFF endpoints → operations") : "only for a BFF source", d[6] && w.source === "bff", w.source ? w.source === "bff" : undefined);
  item("tgt-router", d[6] ? "composes the new subgraph" : "", d[6]);
  item("tgt-sg", e ? String(e.BusinessApplication) : "", d[6]);
  item("tgt-ent", e ? String(e.Name) : "", d[6]);
  item("tgt-q", sg ? String(nq) : "", d[6]); item("tgt-m", sg ? String(nm) : "", d[6]);
  item("tgt-ok", d[6] ? "Proposed → Approved" : "", false);
}

wzInit();   // last: everything above (incl. the overview constants) must be initialised first
