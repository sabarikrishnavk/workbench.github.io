/* code-onboarding.js — "Onboarding guide" tab of subgraph-codemigration.html.
   Walks one endpoint of a monolithic BFF, a legacy service / orchestrator REST API or a MonoGraph root
   field (its resolver) onto its target
   Domain / Orchestrator / Integration subgraph, with the client and the server code as separate steps:
     1 load GQLRegistry.xlsx → 2 pick the monolith (BFF or legacy REST) and load its spec → 3 pick the
     endpoint and its FedGQL operations → 4 target service type, pattern (orchestration / stitching) and
     REST / gRPC calls → 5 review the mapping → 6 client code → 7 server code → 8 save & export.
   Loaded after the page's inline script; reuses its globals (M, mode, bffRef, selEntity, buildOpCtx,
   CODE_LANGS, SERVER_PAIRS, SUBGRAPH_SERVERS, LEGACY_BFF, BFF_CLIENT_LANGS, bffComposeDoc, …) and the
   shared overview helpers in onboarding.js. State is kept in localStorage (cm-onb-*). */

const CW_STEPS = [
  { k: "registry", t: "Load GQL Registry" },
  { k: "source", t: "Monolith & spec" },
  { k: "endpoint", t: "Endpoint & operations" },
  { k: "target", t: "Target service & pattern" },
  { k: "review", t: "Review mapping" },
  { k: "client", t: "Client code" },
  { k: "server", t: "Server code" },
  { k: "save", t: "Save & export" },
];
const CW_STEP_ICON = ["upload", "layers", "pick", "target", "diff", "devices", "server", "save"];
const CW_SOURCES = {
  bff: { t: "Monolithic BFF (composite endpoints)", icon: "🔀", need: "The BFF's OpenAPI spec (bff-openapi.yaml).",
    d: "Each BFF endpoint fans out to several services. It becomes either an orchestrating mutation on an Orchestrator subgraph (the BFF logic moves there and calls the other services over REST / gRPC), or one federated query that the router stitches by @key." },
  rest: { t: "Legacy service / orchestrator REST API", icon: "🧩", need: "The service's OpenAPI spec (openapi.yaml).",
    d: "Each REST endpoint moves one-for-one onto its target Domain, Orchestrator or Integration subgraph. That one service keeps the REST API and adds the GraphQL API on a shared service layer." },
  monograph: { t: "MonoGraph (monolithic GraphQL server)", icon: "🧱", need: "The MonoGraph schema (schema.graphqls / mono-graph.gql).",
    d: "Each root field's resolver moves out of the monolith into the subgraph that owns it, as defined by its service type: a Domain service resolves it from its own data, an Orchestrator calls other services over REST / gRPC, and an Integration service wraps the external API. Clients switch from the MonoGraph URL to the router." },
};
const CW_SAMPLES = { monograph: ["samples/mono-graph.gql"], bff: ["samples/bff-openapi.yaml"], rest: ["product", "pnp", "inventory", "search", "cart", "payments", "checkout"].map(n => `samples/subgraph/${n}/openapi.yaml`) };
const CW_SVC = {
  Domain: { icon: "db", d: "Owns its data. The endpoint's business logic stays in this service, which serves REST and GraphQL over its own database and calls no other subgraph." },
  Orchestrator: { icon: "saga", d: "Coordinates other services. It runs the former BFF / orchestrator logic and calls the other subgraph services over REST or gRPC, never through the router, with compensation for failed writes." },
  Integration: { icon: "plug", d: "Adapts an external or legacy system. Its resolvers call that system's REST API and map the payload to the FedGQL types; it calls no other subgraph." },
};
const CW_LS = "cm-onb-v1", CW_REG = "cm-onb-reg", CW_SPEC = "cm-onb-spec", CW_OV = "cm-onb-ov";
let CW = null, CW_OV_PREV = {}, CW_MONO = { ops: [], types: [] };

/* ------------------------- MonoGraph SDL (root fields + types) ---------- */
function cwParseMono(text) {
  const ops = [], types = [], src = String(text || "");
  for (const m of src.matchAll(/(?:"""([\s\S]*?)"""\s*)?\btype\s+(\w+)[^{]*\{([\s\S]*?)\n\}/g)) {
    const [raw, , name, body] = m, fields = [];
    let desc = "", buf = "", depth = 0;
    for (const line of body.split(/\n/)) {
      const t = line.trim(); if (!t || t.startsWith("#")) continue;
      if (!buf && /^"""/.test(t)) { desc = t.replace(/"""/g, "").trim(); continue; }
      buf += (buf ? " " : "") + t; depth += (t.match(/\(/g) || []).length - (t.match(/\)/g) || []).length;
      if (depth > 0) continue;
      const f = buf.match(/^(\w+)\s*(?:\(([\s\S]*)\))?\s*:\s*([^@#]+)/); buf = "";
      if (f) fields.push({ name: f[1], args: (f[2] || "").trim(), type: f[3].trim(), desc }); desc = "";
    }
    if (name === "Query" || name === "Mutation") fields.forEach(f => ops.push({ key: name + "." + f.name, root: name, name: f.name, args: f.args, argList: parseGqlParams(f.args), type: f.type, desc: f.desc }));
    else types.push({ name, kind: "type", fields: fields.map(f => ({ name: f.name, type: f.type })), raw: raw.replace(/^"""[\s\S]*?"""\s*/, "") });
  }
  return { ops, types };
}
const cwMonoField = () => CW_MONO.ops.find(o => o.key === cw().monoRef) || null;
const cwMonoMatch = f => f ? (M.gqlOps.find(g => linkValues(g.Links, "monograph").some(v => v.trim() === f.key)) || M.gqlOps.find(g => g.Name === f.name && g.kind === (f.root === "Mutation" ? "mutation" : "query"))) : null;

/* ------------------------------ state ---------------------------------- */
function cw() {
  const d = { step: 0, source: "", specName: "", bffRef: "", restRef: "", monoRef: "", gqlId: "", targetOk: false, reviewed: false,
    clientLang: CLIENT_LANG_NAMES[0], serverLang: SERVER_LANG_NAMES[0], stitchSg: "", clientDone: false, serverDone: false, savedAt: "", regName: "" };
  if (!CW) { try { CW = JSON.parse(localStorage.getItem(CW_LS)) || {}; } catch (_) { CW = {}; } }
  for (const k in d) if (!(k in CW)) CW[k] = d[k];
  return CW;
}
function cwSave() { try { localStorage.setItem(CW_LS, JSON.stringify(CW)); } catch (_) {} }
// The source operation: a REST endpoint, or a MonoGraph root field shaped like one (method "", path "Query.x").
const cwRestOp = () => {
  const w = cw();
  if (w.source === "monograph") { const f = cwMonoField(); return f ? { id: "mono:" + f.key, name: f.name, method: "", path: f.key, args: f.argList, returns: f.type, mono: f } : null; }
  const ref = w.source === "bff" ? w.bffRef : w.restRef; return M.restOps.find(o => restRefOf(o) === ref) || null;
};
const cwSrcCount = () => cw().source === "monograph" ? CW_MONO.ops.length : M.restOps.length;
const cwGql = () => M.gqlOps.find(g => String(g.id) === String(cw().gqlId)) || null;
const cwBff = () => { const w = cw(); return w.source === "bff" && w.bffRef ? (M.bff[w.bffRef] || null) : null; };
const cwSgReg = () => ({ name: M.sgName || "registry", types: M.regTypes });
function cwDone() {
  const w = cw(), b = cwBff();
  const mapped = w.source === "bff" ? !!(b && b.ops.length) : !!(cwRestOp() && cwGql());
  const src = !!w.source && cwSrcCount() > 0;
  return [M.regTypes.length > 0, src, src && mapped, mapped && w.targetOk, mapped && w.targetOk && w.reviewed,
    mapped && w.reviewed && w.clientDone, mapped && w.reviewed && w.serverDone, mapped && !!w.savedAt];
}
const cwPct = () => Math.round(100 * cwDone().filter(Boolean).length / CW_STEPS.length);
function cwCanVisit(i) { const d = cwDone(); for (let j = 0; j < i; j++) if (!d[j]) return false; return true; }
// Upstream change → later confirmations are stale.
function cwResetFrom(from) { const w = cw(); if (from <= 1) { w.bffRef = ""; w.restRef = ""; w.monoRef = ""; w.gqlId = ""; } if (from <= 2) w.targetOk = false; w.reviewed = false; w.clientDone = false; w.serverDone = false; w.savedAt = ""; }
function cwGo(i) { if (i < 0 || i >= CW_STEPS.length || !cwCanVisit(i)) return; cw().step = i; cwSync(); cwSave(); cwRender(); const m = document.getElementById("cwMain"); if (m) m.scrollTop = 0; }
// Mirror the guide's choices onto the workbench globals, so the Workbench tab shows the same mapping.
function cwSync() {
  const w = cw();
  if (w.source === "bff") { mode = "bff"; if (w.bffRef) bffRef = w.bffRef; }
  else if (w.source) { mode = "single"; const g = cwGql(), r = cwRestOp(); if (g) { selGql = g.id; selEntity = String(g.EntityID || ""); } if (r && !r.mono) selRest = r.id; }
}

/* ------------------------------ render --------------------------------- */
const cwH = (n, title, desc) => `<h2>Step ${n} of ${CW_STEPS.length} · ${esc(title)}</h2><p class="desc">${desc}</p>`;
const cwCode = (title, code, hint, hl) => `<div><div class="code-head"><h3>${title}${hint ? ` <span class="hint">${hint}</span>` : ""}</h3><button class="copy-btn" onclick='copyText(${attrJson(code)})'>Copy</button></div><pre class="code">${hl ? hl(code) : esc(code)}</pre></div>`;
const cwChips = (list, cur, act) => `<div class="wz-chips">${list.map(n => `<span class="wz-chip${n === cur ? " sel" : ""}" data-act="${act}" data-v="${esc(n)}">${esc(n)}</span>`).join("")}</div>`;
const cwSvcOf = eid => svcTypeOfEntity(eid);
function cwRender() {
  const root = document.getElementById("cmGuide"); if (!root) return;
  const w = cw(), done = cwDone();
  if (w.step > 0 && !cwCanVisit(w.step)) w.step = Math.max(0, done.indexOf(false));
  document.getElementById("cwBarFill").style.width = cwPct() + "%";
  onbPct(document.getElementById("cwPct"), cwPct());   // pops when progress goes up
  const ta = document.getElementById("cwTopApp"), tr = cwRestOp(); if (ta) ta.textContent = tr ? "· " + restRefOf(tr) : "· one endpoint at a time";
  document.getElementById("cwSteps").innerHTML = CW_STEPS.map((s, i) => `<li class="${done[i] ? "done" : ""}${i === w.step ? " cur" : ""}${cwCanVisit(i) ? "" : " locked"}" data-step="${i}">${esc(s.t)}</li>`).join("");
  const r = cwRestOp(), g = cwGql(), b = cwBff();
  document.getElementById("cwCtx").innerHTML = [
    M.regTypes.length ? `📘 ${esc(M.sgName || "registry")} · ${M.gqlOps.length} ops` : "",
    w.source ? `${CW_SOURCES[w.source].icon} ${esc(CW_SOURCES[w.source].t)}` : "",
    w.specName ? `📄 ${esc(w.specName)} · ${cwSrcCount()} ${w.source === "monograph" ? "root fields" : "endpoints"}` : "",
    r ? `🔗 <span class="mono">${esc(restRefOf(r))}</span>` : "",
    w.source === "bff" && b ? `🧬 ${b.ops.length} FedGQL ops · ${b.orchestrator ? "orchestration" : "query stitching"}` : g ? `🧬 ${esc(g.kind)} ${esc(g.Name)} · ${esc(subgraphOf(g.EntityID))} (${esc(cwSvcOf(g.EntityID).type)})` : "",
    w.clientDone ? `💻 client · ${esc(w.clientLang)}` : "", w.serverDone ? `🖥 server · ${esc(w.serverLang)}` : "",
    w.savedAt ? `💾 saved ${esc(new Date(w.savedAt).toLocaleTimeString())}` : "",
  ].filter(Boolean).map(x => `<span>${x}</span>`).join("");
  const body = document.getElementById("cwBody");
  body.innerHTML = [cwStepRegistry, cwStepSource, cwStepEndpoint, cwStepTarget, cwStepReview, cwStepClient, cwStepServer, cwStepSave][w.step]();
  cwAfterRender();
  const next = document.getElementById("cwNext");
  document.getElementById("cwBack").disabled = w.step === 0;
  const confirmSteps = { 3: "Target confirmed — next →", 4: "Mapping reviewed — next →", 5: "Client code ready — next →", 6: "Server code ready — next →" };
  next.textContent = w.step === CW_STEPS.length - 1 ? "Migrate another endpoint" : confirmSteps[w.step] || "Next →";
  next.disabled = w.step < 3 ? !done[w.step] : w.step === 7 ? false : !done[2];
  document.getElementById("cwHint").textContent = !done[w.step] && w.step < 3 ? ["Load a GQL Registry to continue", "Choose the monolith and load its spec", "Pick the endpoint and its FedGQL operations"][w.step] : w.step === 7 && !w.savedAt ? "Export to finish" : "";
  cwOverview();
}
// Mermaid / deferred bits that need the step's DOM.
function cwAfterRender() {
  const w = cw();
  if (w.step === 4) { const src = cwSeqSource(); if (src) renderBffGraph(src, "cwSeq"); }
}

function cwStepRegistry() {
  const n = M.regTypes.length;
  let h = cwH(1, "Load the GQL Registry", "The target model: <span class=\"mono\">GQLRegistry.xlsx</span> holds the FedGQL types and operations, each subgraph's <b>Service Type</b> (Domain / Orchestrator / Integration) on its Entities row, and the <b>BffMappings</b> sheet that records how BFF endpoints map onto FedGQL operations. Onboard the subgraphs first with the GQL migration guide; this guide then migrates the code that calls them.");
  h += `<div class="pickers"><div class="picker"><b>GQLRegistry.xlsx</b><span class="hint">FedGQL schema + BffMappings</span>
    <div class="st ${n ? "loaded" : "missing"}">${n ? `loaded — ${esc(M.sgName || "registry")} · ${n} types · ${M.gqlOps.length} ops` : "not loaded"}</div>
    <button class="primary" data-act="pick-reg">Choose file…</button> <button data-act="sample-reg" title="samples/GQLRegistry-sample.xlsx (needs the page served over http)">Use sample registry</button></div></div>`;
  if (n) {
    const sgs = [...new Set((M.entities || []).map(e => String(e.BusinessApplication || "").trim()).filter(Boolean))];
    const by = {}; sgs.forEach(s => { const t = serviceTypeOf(s).type; (by[t] = by[t] || []).push(s); });
    h += `<div class="kv">Subgraphs by service type</div><div class="wz-cards">${Object.keys(CW_SVC).map(t => `<div class="wz-card"><h4>${ONB_ICON[CW_SVC[t].icon]} ${t} <span class="hint">${(by[t] || []).length}</span></h4><p>${(by[t] || []).map(s => `<span class="onb-chip">${esc(s)}</span>`).join(" ") || "—"}</p></div>`).join("")}</div>
      <p class="hint">${Object.keys(M.bff || {}).length} BFF endpoint mapping(s) in the registry's BffMappings sheet.</p>`;
  }
  return h;
}

function cwStepSource() {
  const w = cw();
  let h = cwH(2, "Which monolith are you migrating?", "Choose the system the callers use today, then load its spec. The steps that follow adapt to it: BFF endpoints compose several FedGQL operations; a legacy service's endpoints and a MonoGraph's root fields move one-for-one to the subgraph that owns them.");
  h += `<div class="wz-cards">${Object.entries(CW_SOURCES).map(([k, s]) => `<div class="wz-card${w.source === k ? " sel" : ""}" data-act="src" data-v="${k}"><h4>${s.icon} ${esc(s.t)}</h4><p>${esc(s.d)}</p><p><b>You need:</b> ${esc(s.need)}</p></div>`).join("")}</div>`;
  if (w.source) {
    const samples = CW_SAMPLES[w.source];
    h += `<div class="selrow"><button class="primary" data-act="pick-spec">Choose ${w.source === "monograph" ? "SDL" : "OpenAPI"} file…</button><span class="hint">or a sample</span>
      <select id="cwSample">${samples.map(s => `<option${s === w.specName ? " selected" : ""}>${esc(s)}</option>`).join("")}</select><button data-act="sample-spec">Load sample</button>
      <span class="hint">${cwSrcCount() && w.specName ? `Loaded <b>${esc(w.specName)}</b>: ${cwSrcCount()} ${w.source === "monograph" ? "root fields" : "endpoints"}` : "No spec loaded yet."}</span></div>`;
  }
  return h;
}

function cwStepEndpoint() {
  const w = cw();
  if (w.source === "monograph") {
    const cur = cwMonoField(), g = cwGql();
    let h = cwH(3, "Pick the MonoGraph root field and its FedGQL operation", "Tick the root field whose resolver you're moving. The FedGQL operation linked to it (a <span class=\"mono\">monograph:</span> line in Links &amp; References, written by the GQL migration guide), or with the same name, is picked automatically.");
    h += `<div class="table-wrap wz-ops" style="max-height:38vh"><table><thead><tr><th></th><th>Root field</th><th>Arguments</th><th>Returns</th><th>FedGQL operation</th></tr></thead><tbody>${CW_MONO.ops.map(f => { const on = cur && cur.key === f.key, mt = cwMonoMatch(f);
      return `<tr class="${on ? "" : "off"}"><td><input type="radio" name="cwEp" data-act="ep" data-v="${esc(f.key)}"${on ? " checked" : ""} /></td><td class="mono">${esc(f.key)}</td><td class="mono">${esc(f.args)}</td><td class="mono">${esc(f.type)}</td><td>${mt ? `<span class="onb-chip ok">${esc(mt.Name)} · ${esc(subgraphOf(mt.EntityID))}</span>` : '<span class="hint">not in the registry yet</span>'}</td></tr>`; }).join("")}</tbody></table></div>`;
    if (cur) h += `<div class="selrow" style="margin-top:10px"><label>FedGQL operation for <span class="mono">${esc(cur.key)}</span><select id="cwGqlSel">${M.gqlOps.map(o => `<option value="${esc(o.id)}"${g && g.id === o.id ? " selected" : ""}>${cwMonoMatch(cur) === o ? "★ " : ""}${esc(o.kind)} ${esc(o.Name)} · ${esc(subgraphOf(o.EntityID))}</option>`).join("")}</select></label><span class="hint">${g && cwMonoMatch(cur) === g ? "★ matched" : g ? "manual mapping" : ""}</span></div>`;
    return h;
  }
  const isBff = w.source === "bff";
  let h = cwH(3, isBff ? "Pick the BFF endpoint and the FedGQL operations it becomes" : "Pick the endpoint and its FedGQL operation",
    isBff ? "Tick the BFF endpoint to migrate. Its existing BffMappings (if any) load with it; add or remove the FedGQL queries and mutations, from any subgraph, that replace its fan-out."
      : "Tick the REST endpoint. The FedGQL operation whose <span class=\"mono\">REST:</span> link points at it is picked automatically; you can choose another one.");
  const mappedOf = o => isBff ? ((M.bff[restRefOf(o)] || {}).ops || []).length : M.gqlOps.filter(g => refMatches(g, o)).length;
  const cur = cwRestOp();
  h += `<div class="table-wrap wz-ops" style="max-height:34vh"><table><thead><tr><th></th><th>Endpoint</th><th>Operation</th><th>Returns</th><th>${isBff ? "Mapped FedGQL ops" : "Matching FedGQL op"}</th></tr></thead><tbody>${M.restOps.map(o => {
    const ref = restRefOf(o), on = cur && restRefOf(cur) === ref, n = mappedOf(o);
    const status = isBff ? (n ? `<span class="onb-chip ok">${n} in BffMappings</span>` : `<span class="hint">not mapped yet</span>`) : (n ? `<span class="onb-chip ok">${esc(M.gqlOps.filter(g => refMatches(g, o)).map(g => g.Name).join(", "))}</span>` : `<span class="hint">no REST: link</span>`);
    return `<tr class="${on ? "" : "off"}"><td><input type="radio" name="cwEp" data-act="ep" data-v="${esc(ref)}"${on ? " checked" : ""} /></td><td class="mono">${esc(ref)}</td><td class="mono">${esc(o.name)}</td><td class="mono">${esc(o.returns || "")}</td><td>${status}</td></tr>`;
  }).join("")}</tbody></table></div>`;
  if (!cur) return h;
  if (isBff) {
    const m = curBff();
    const rows = m.ops.map((o, i) => `<tr><td><span class="badge ${o.kind}">${esc(o.kind)}</span></td><td class="mono">${esc(o.name)}</td><td>${esc(subgraphOf(o.entityId))} ${svcTypeBadge(cwSvcOf(o.entityId))}</td><td class="mono">${esc((M.gqlOps.find(g => String(g.id) === String(o.opId)) || {}).ReturnType || "")}</td><td><button class="rm-row" data-act="rm-op" data-v="${i}" title="Remove">✕</button></td></tr>`).join("");
    const byEnt = {}; for (const o of M.gqlOps) (byEnt[o.EntityID] = byEnt[o.EntityID] || []).push(o);
    const opts = Object.entries(byEnt).map(([eid, list]) => `<optgroup label="${esc(subgraphOf(eid))} · ${esc(eid)}">${list.map(o => `<option value="${esc(o.id)}">${esc(o.kind)} ${esc(o.Name)} : ${esc(o.ReturnType || "")}</option>`).join("")}</optgroup>`).join("");
    h += `<div class="kv">FedGQL operations for <span class="mono">${esc(restRefOf(cur))}</span></div>
      <div class="selrow"><label>Composite operation name<input id="cwBffName" value="${esc(m.name || "")}" style="min-width:220px;padding:6px 8px;border:1px solid var(--line);border-radius:6px" /></label></div>
      <div class="table-wrap"><table><thead><tr><th>Kind</th><th>FedGQL op</th><th>Subgraph · service type</th><th>Returns</th><th></th></tr></thead><tbody>${rows || `<tr><td colspan="5" class="empty">No operations yet: add the ones that replace this endpoint's fan-out.</td></tr>`}</tbody></table></div>
      <div class="selrow" style="margin-top:8px"><select id="cwAddOp">${opts}</select><button data-act="add-op">＋ Add operation</button></div>`;
  } else {
    const g = cwGql(), opts = M.gqlOps.map(o => `<option value="${esc(o.id)}"${g && g.id === o.id ? " selected" : ""}>${refMatches(o, cur) ? "★ " : ""}${esc(o.kind)} ${esc(o.Name)} · ${esc(subgraphOf(o.EntityID))}</option>`).join("");
    h += `<div class="selrow" style="margin-top:10px"><label>FedGQL operation for <span class="mono">${esc(restRefOf(cur))}</span><select id="cwGqlSel">${opts}</select></label>
      <span class="hint">${g ? (refMatches(g, cur) ? "★ matched by its REST: link" : "manual mapping: this operation's REST: link points elsewhere") : ""}</span></div>`;
  }
  return h;
}

function cwStepTarget() {
  const w = cw();
  let h = cwH(4, "Target service and migration pattern", "Where does the endpoint's logic live after the migration? The target subgraph's <b>Service Type</b> (from the registry's Entities sheet) decides what its generated service may do. Subgraphs call each other over <b>REST or gRPC only</b>, never through the router.");
  const card = (t, sel, sub) => `<div class="wz-card${sel ? " sel" : ""}"><h4>${ONB_ICON[CW_SVC[t].icon]} ${t} service</h4><p>${esc(CW_SVC[t].d)}</p>${sub ? `<p>${sub}</p>` : ""}</div>`;
  if (w.source !== "bff") {
    const g = cwGql(); if (!g) return h;
    const sg = subgraphOf(g.EntityID), st = cwSvcOf(g.EntityID);
    h += `<div class="wz-cards">${Object.keys(CW_SVC).map(t => card(t, st.type === t, st.type === t ? `<b>Target: ${esc(sg)}</b> ${st.src === "inferred" ? "(inferred: set ServiceType on the registry's Entities row)" : "(from the registry)"}` : "")).join("")}</div>`;
    const o = subgraphModel(g.EntityID).ops.find(x => x.id === g.id), orch = o && orchestrationOf(o.id);
    const mono = w.source === "monograph", what = { Domain: "resolves it from its own database", Orchestrator: "runs the workflow and calls the other services over REST / gRPC", Integration: "calls the external system's API and maps the payload" }[st.type] || "";
    h += `<div class="pattern ${st.type === "Orchestrator" ? "orch" : "stitch"}"><b>Pattern: ${st.type === "Orchestrator" && orch ? "orchestration" : "one-for-one"}</b>: <span class="mono">${esc(restRefOf(cwRestOp()))}</span> → <span class="mono">${esc(g.kind)} ${esc(g.Name)}</span> on the <b>${esc(sg)}</b> ${esc(st.type)} service, which ${mono ? `takes the resolver out of the MonoGraph and ${what}, exposes it on its own GraphQL API (and a REST route), and joins the supergraph by <span class="mono">@key</span>` : "keeps the REST route and adds the GraphQL resolver over one shared service method"}.${orch ? ` It orchestrates ${orch.steps.length} downstream call(s) recorded in BffMappings (${esc(orch.ref)}).` : ""}</div>`;
    return h;
  }
  const m = curBff(); if (!m) return h;
  const muts = m.ops.filter(o => o.kind === "mutation"), orchRow = bffOrchestratorOp(m);
  h += `<div class="wz-cards">
    <div class="wz-card${orchRow ? " sel" : ""}${muts.length ? "" : " off"}" data-act="pat" data-v="orch"><h4>${ONB_ICON.saga} Orchestrator subgraph</h4><p>The BFF logic moves into the subgraph of one <b>orchestrating mutation</b>. Its service calls the other operations' services over REST / gRPC, and the front end sends that one mutation.</p>${muts.length ? "" : "<p><b>Needs a mutation</b> in the operation set.</p>"}</div>
    <div class="wz-card${orchRow ? "" : " sel"}" data-act="pat" data-v="stitch"><h4>${ONB_ICON.router} Query stitching</h4><p>No server-side composition. The front end sends one federated query and the router joins the subgraphs by <span class="mono">@key</span>. Each subgraph stays a Domain / Integration service.</p></div></div>`;
  if (orchRow) {
    const st = cwSvcOf(orchRow.entityId), plan = orchestrationOf(orchRow.opId, bffRef);
    h += `<div class="selrow"><label>Orchestrating mutation<select id="cwOrch">${muts.map(o => `<option value="${esc(o.opId)}"${String(o.opId) === String(orchRow.opId) ? " selected" : ""}>${esc(o.name)} · ${esc(subgraphOf(o.entityId))} (${esc(cwSvcOf(o.entityId).type)})</option>`).join("")}</select></label>
      <span class="spacer"></span><button data-act="via-all" data-v="rest">All via REST</button><button data-act="via-all" data-v="grpc">All via gRPC</button></div>`;
    if (st.type !== "Orchestrator") h += `<div class="pattern warn"><b>⚠ ${esc(subgraphOf(orchRow.entityId))} is a ${esc(st.type)} service</b>: ${esc(SERVICE_RULES[st.type])}. Set its ServiceType to <b>Orchestrator</b> in the registry, or pick a mutation that belongs to an Orchestrator subgraph.</div>`;
    h += `<div class="kv">Downstream calls from <b>${esc(subgraphOf(orchRow.entityId))}</b></div><div class="table-wrap"><table><thead><tr><th>#</th><th>FedGQL op</th><th>Service · type</th><th>Call via</th></tr></thead><tbody>${(plan ? plan.steps : []).map(stp => {
      const i = m.ops.indexOf(stp.op), rb = restBindingOf(stp.op);
      const via = stp.via === "local" ? `<span class="via local">in-process</span>` : `<select data-act="via" data-v="${i}"><option value="rest"${stp.via === "rest" ? " selected" : ""}${rb ? "" : " disabled"}>REST · ${esc(rb ? rb.method + " " + rb.path : "no REST link")}</option><option value="grpc"${stp.via === "grpc" ? " selected" : ""}>gRPC · ${esc(stp.Sg)}Service/${esc(Pascal(stp.model.name))}</option></select>`;
      return `<tr><td>${stp.n}</td><td class="mono">${esc(stp.model.name)}${stp.write ? ' <span class="hint">write</span>' : ""}</td><td>${esc(stp.sg)} ${svcTypeBadge(cwSvcOf(stp.op.entityId))}</td><td>${via}</td></tr>`;
    }).join("") || `<tr><td colspan="4" class="empty">Add the operations the orchestrator calls in step 3.</td></tr>`}</tbody></table></div>`;
  } else {
    const q = m.ops.filter(o => o.kind === "query"), own = bffOwnerOp(m);
    if (q.length) h += `<div class="selrow"><label>Owning query (resolves the base @key entity)<select id="cwOwner">${q.map(o => `<option value="${esc(o.opId)}"${own && String(own.opId) === String(o.opId) ? " selected" : ""}>${esc(o.alias || o.name)} · ${esc(subgraphOf(o.entityId))}</option>`).join("")}</select></label></div>`;
    h += `<div class="kv">Subgraphs the router stitches</div><div class="wz-chips">${[...new Set(m.ops.map(o => o.entityId))].map(e => `<span class="onb-chip">${esc(subgraphOf(e))} · ${esc(cwSvcOf(e).type)}</span>`).join("")}</div>`;
  }
  return h;
}

// The Mermaid source for the review step's sequence trace.
function cwSeqSource() {
  const w = cw();
  if (w.source === "bff") { const m = cwBff(); if (!m || !m.ops.length) return ""; const flow = bffMutationFlow(m, cwSgReg()); if (flow && flow.orchestrated) return flow.mermaid; const fed = bffFederation(m, cwSgReg()); return bffMermaid(m, cwSgReg(), fed) || (flow ? flow.mermaid : ""); }
  const g = cwGql(), r = cwRestOp(); if (!g || !r) return "";
  return opSequenceMermaid(g, buildOpCtx(g, r, cwSgReg()), cwSgReg());
}
function cwStepReview() {
  const w = cw(), sgReg = cwSgReg();
  let h = cwH(5, "Review the mapping", "What changes for the callers: names and types that differ between the current REST payload and the FedGQL operation are highlighted. The sequence trace shows how the router (and, for orchestration, the orchestrator service) resolves the request.");
  if (w.source !== "bff") {
    const g = cwGql(), r = cwRestOp(); if (!g || !r) return h;
    const cx = buildOpCtx(g, r, sgReg), p = cx.p;
    h += `<div class="kv">Mapping — <span class="mono">${esc(cx.restReqLine)}</span> → <span class="mono">${esc(cx.gqlOp.opKind)} ${esc(cx.gqlOp.name)}</span> ${cx.mapNote}</div><div class="kv">Changes</div>${cx.changesHtml}
      <div class="table-wrap"><table><thead><tr><th>REST field : type</th><th>FedGQL field : type</th><th>Change</th></tr></thead><tbody>${cx.fieldRowsHtml}</tbody></table></div>
      <div class="grid2" style="margin-top:10px">${r.mono ? cwCode("MonoGraph — current", `# ${r.mono.key}\n${r.mono.root} {\n  ${r.mono.name}${r.mono.args ? "(" + r.mono.args + ")" : ""}: ${r.mono.type}\n}\n\n${(CW_MONO.types.find(t => t.name === baseType(r.mono.type)) || {}).raw || ""}`, "", highlightSDL) : cwCode("REST — current", `# ${cx.restReqLine}\n${cx.gqlOp.opKind === "mutation" ? JSON.stringify(p.restBody, null, 2) + "\n# response\n" : ""}${JSON.stringify(p.restResponse, null, 2)}`)}${cwCode("FedGQL — target", p.gqlDoc, "", s => markDiffs(highlightSDL(s), cx.diffTokens))}</div>`;
  } else {
    const m = cwBff(); if (!m) return h;
    let comp = bffComposeDoc(m, sgReg); comp.__vars = bffVarsSample(comp, sgReg);
    const flow = bffMutationFlow(m, sgReg), orch = flow && flow.orchestrated;
    h += orch ? `<div class="pattern orch"><b>Orchestration</b>: the front end sends <span class="mono">${esc(flow.om.name)}</span> and the <b>${esc(subgraphOf(flow.orch.entityId))}</b> service runs ${flow.plan.steps.length} downstream call(s).</div>`
      : `<div class="pattern stitch"><b>Query stitching</b>: one federated query; the router joins the subgraphs by <span class="mono">@key</span>.</div>`;
    const docs = orch ? [["mutation " + cap(flow.om.alias), flow.doc]] : [comp.query && ["query " + (m.name || "Bff"), comp.query.doc], comp.mutation && ["mutation " + (m.name || "Bff"), comp.mutation.doc]].filter(Boolean);
    h += `<div class="grid2">${docs.map(([t, d]) => cwCode(esc(t), d, "", highlightSDL)).join("")}</div>`;
    const changed = m.ops.map(o => { const reg = M.gqlOps.find(x => String(x.id) === String(o.opId)); if (!reg) return null; const rs = M.restOps.find(x => refMatches(reg, x)) || cwRestOp(); const cx = buildOpCtx(reg, rs, sgReg); return `<tr><td><span class="badge ${o.kind}">${esc(o.kind)}</span> <span class="mono">${esc(o.name)}</span></td><td class="mono">${esc(cx.restReqLine)}</td><td>${cx.changes.length ? cx.changes.map(c => `${esc(c.label)}: <span class="mono">${esc(c.from)} → ${esc(c.to)}</span>`).join("<br>") : '<span class="hint">no changes</span>'}</td></tr>`; }).filter(Boolean).join("");
    h += `<div class="kv">Per-operation changes</div><div class="table-wrap"><table><thead><tr><th>FedGQL op</th><th>Legacy REST</th><th>Name / type changes</th></tr></thead><tbody>${changed}</tbody></table></div>`;
  }
  h += `<div class="code-head" style="margin-top:12px"><h3>Sequence trace</h3></div><div id="cwSeq" style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:10px;overflow:auto"></div>`;
  return h;
}

// The current client call of a BFF endpoint (before the migration), per client language.
function cwLegacyClient(lang, op) {
  const name = camel(cap(slug(op.name || "callBff").replace(/ /g, ""))), args = op.args || [], body = args.find(a => a.name === "input");
  const pathJs = (op.path || "").replace(/\{(\w+)\}/g, (m, k) => "${" + k + "}");
  if (lang === "Java") return `// Current — the app calls the BFF endpoint (${op.method} ${op.path})\nHttpRequest req = HttpRequest.newBuilder()\n    .uri(URI.create(BFF_URL + "${op.path}"))\n    .header("Content-Type", "application/json")\n    .method("${op.method}", ${body ? "BodyPublishers.ofString(mapper.writeValueAsString(input))" : "BodyPublishers.noBody()"})\n    .build();\nHttpResponse<String> res = client.send(req, BodyHandlers.ofString());\nMap<String, Object> page = mapper.readValue(res.body(), Map.class);`;
  if (lang === "Android (Kotlin)") return `// Current — Retrofit interface for the BFF endpoint\ninterface BffApi {\n  @${cap(String(op.method).toLowerCase())}("${String(op.path).replace(/^\//, "")}")\n  suspend fun ${name}(${[...args.filter(a => a.name !== "input").map(a => `@Path("${a.name}") ${a.name}: String`), ...(body ? ["@Body input: Map<String, Any>"] : [])].join(", ")}): Map<String, Any>\n}\nval page = bffApi.${name}(${args.map(a => a.name).join(", ")})`;
  if (lang === "iOS (Swift)") return `// Current — URLSession call to the BFF endpoint\nvar request = URLRequest(url: URL(string: "\\(bffURL)${String(op.path).replace(/\{(\w+)\}/g, "\\($1)")}")!)\nrequest.httpMethod = "${op.method}"\nrequest.setValue("application/json", forHTTPHeaderField: "Content-Type")${body ? "\nrequest.httpBody = try JSONEncoder().encode(input)" : ""}\nlet (data, _) = try await URLSession.shared.data(for: request)\nlet page = try JSONSerialization.jsonObject(with: data)`;
  return `// Current — the web app calls the BFF endpoint (${op.method} ${op.path})\nconst res = await fetch(\`\${BFF_URL}${pathJs}\`, {\n  method: "${op.method}",\n  headers: { "Content-Type": "application/json" }${body ? ",\n  body: JSON.stringify(input)" : ""}\n});\nconst page = await res.json();   // one screen-shaped payload assembled by the BFF`;
}
// Current + target client code for the guide's endpoint.
function cwClientCode(lang) {
  const w = cw(), sgReg = cwSgReg();
  if (w.source !== "bff") {
    const g = cwGql(), r = cwRestOp(); if (!g || !r) return null;
    const gen = CODE_LANGS[lang] || CODE_LANGS.JavaScript, cx = buildOpCtx(g, r, sgReg), ctx = { entity: cx.retEnt.name, varName: cx.varName }, c = gen(cx.gqlOp, cx.p, ctx);
    if (r.mono) {   // today the client sends (almost) the same operation to the MonoGraph endpoint
      const mo = Object.assign({}, cx.gqlOp, { name: r.mono.name, args: r.mono.argList, returns: r.mono.type });
      const cur = gen(mo, opPayloads(mo, sgReg, cx.retEnt), ctx).gql.replace(/Target — FedGQL[^\n]*/, "Current — MonoGraph").replace(/GRAPHQL_GATEWAY_URL|GRAPHQL_URL|graphqlUrl|gatewayUrl/g, "MONOGRAPH_URL");
      return { cur, tgt: c.gql, diff: cx.diffTokens, note: `<span class="mono">${esc(r.mono.key)}</span> on the MonoGraph → <span class="mono">${esc(g.kind)} ${esc(g.Name)}</span> on the router (served by ${esc(subgraphOf(g.EntityID))})` };
    }
    return { cur: c.rest, tgt: c.gql, diff: cx.diffTokens, note: `${esc(restRefOf(r))} → <span class="mono">${esc(g.kind)} ${esc(g.Name)}</span> on the router` };
  }
  const m = cwBff(), op = cwRestOp(); if (!m || !op) return null;
  let comp = bffComposeDoc(m, sgReg); comp.__vars = bffVarsSample(comp, sgReg);
  const flow = bffMutationFlow(m, sgReg);
  if (flow && flow.orchestrated) comp = { query: null, mutation: { doc: flow.doc, vars: flow.om.varDefs, ops: [flow.om] }, models: comp.models, __vars: flow.vars };
  const t = (BFF_CLIENT_LANGS[lang] || BFF_CLIENT_LANGS.JavaScript)(m, comp, op);
  return { cur: cwLegacyClient(lang, op), tgt: t.code, note: flow && flow.orchestrated ? `one mutation to the router replaces <span class="mono">${esc(restRefOf(op))}</span>` : `one federated query to the router replaces <span class="mono">${esc(restRefOf(op))}</span>` };
}
function cwStepClient() {
  const w = cw(), c = cwClientCode(w.clientLang);
  let h = cwH(6, "Client code — web & mobile callers", "How each front end changes: today it calls the monolith (its REST endpoint or the MonoGraph); after the migration it sends one GraphQL operation to the FedGQL router. Pick the client platform.");
  h += cwChips(CLIENT_LANG_NAMES, w.clientLang, "clang");
  if (!c) return h;
  h += `<p class="hint">${c.note}</p><div class="grid2">${cwCode(w.source === "monograph" ? "Current — MonoGraph client" : "Current — REST client", c.cur, "(before)")}${cwCode("Target — FedGQL client", c.tgt, "(after · changed names highlighted)", c.diff ? s => markDiffs(esc(s), c.diff) : null)}</div>
    <div class="selrow" style="margin-top:8px"><button data-act="dl-client">⬇ Download ${esc(w.clientLang)} client code</button></div>`;
  return h;
}

// Server code for the target service(s): { blocks:[{title, code, hint}], files:[{title, code, sdl}], svc, sg }.
function cwServerCode(lang) {
  const w = cw(), P = SERVER_PAIRS[lang] || SERVER_PAIRS["Node.js (Apollo Server)"], gen = SUBGRAPH_SERVERS[lang] || SUBGRAPH_SERVERS["Node.js (Apollo Server)"];
  if (w.source !== "bff") {
    const g = cwGql(); if (!g) return null;
    const sgm = subgraphModel(g.EntityID), o = sgm.ops.find(x => x.id === g.id); if (!o) return null;
    const r = cwRestOp();
    return { sg: sgm.sgName, svc: sgm.svcType, cur: r && r.mono ? cwMonoResolver(lang, r.mono, sgm) : "", pairs: opPairHtml(sgm, o, g, P), files: gen(sgm, g), blocks: [] };
  }
  const m = cwBff(), op = cwRestOp(); if (!m || !op) return null;
  const orchRow = bffOrchestratorOp(m);
  if (orchRow) {
    const os = orchSubgraph(orchRow), plan = orchestrationOf(orchRow.opId, bffRef); if (!os) return null;
    const cur = (LEGACY_BFF[lang] || LEGACY_BFF["Node.js (Apollo Server)"])({ name: m.name || "Bff", route: `${op.method} ${op.path}`, rest: op, steps: plan ? plan.steps : [] });
    return { sg: os.sgm.sgName, svc: os.sgm.svcType, cur, tgt: P.svc(os.sgm, os.op), blocks: [{ title: "REST API", hint: `· ${os.sgm.sgName} keeps a REST route`, code: P.rest(os.sgm, os.op) }, { title: "GraphQL API", hint: "· the mutation the front end calls", code: P.gql(os.sgm, os.op, os.op) }], files: gen(os.sgm, os.op) };
  }
  const ents = [...new Set(m.ops.map(o => String(o.entityId)))];
  const pick = ents.find(e => subgraphOf(e) === w.stitchSg) || ents[0]; if (!pick) return null;
  const sgm = subgraphModel(pick), sel = sgm.ops.find(o => m.ops.some(x => String(x.opId) === String(o.id))) || sgm.ops[0];
  return { sg: sgm.sgName, svc: sgm.svcType, stitch: ents.map(e => subgraphOf(e)), blocks: [], files: sel ? gen(sgm, sel) : [] };
}
function cwStepServer() {
  const w = cw(), s = cwServerCode(w.serverLang);
  let h = cwH(7, "Server code — the target subgraph service", `What the service team builds, as the target's service type defines it. ${w.source === "monograph" ? "The MonoGraph resolver (top) moves into the target subgraph's service (below)." : w.source === "bff" ? "The BFF handler is replaced by the target subgraph's service." : "The legacy REST controller is kept and the GraphQL resolver is added beside it."} The subgraph service serves both a REST API and a GraphQL API over a shared service method, and calls other subgraphs over REST / gRPC only. Pick the server stack.`);
  h += cwChips(SERVER_LANG_NAMES, w.serverLang, "slang");
  if (!s) return h;
  h += `<p style="margin:4px 0 10px">Target: <b>${esc(s.sg)}</b> ${svcTypeBadge({ type: s.svc, src: "registry" })}</p>`;
  if (s.cur && s.tgt) h += `<div class="grid2">${cwCode("Current — monolith handler", s.cur, "(logic in the BFF)")}${cwCode(`Target — ${esc(s.sg)} service`, s.tgt, "(logic in the orchestrator subgraph)")}</div>`;
  else if (s.cur) h += cwCode("Current — MonoGraph resolver", s.cur, "(one server resolves every domain; this is what moves)");
  if (s.pairs) h += `<div class="kv">REST API ↔ GraphQL API over the shared service</div>${s.pairs}`;
  if (s.blocks.length) h += `<div class="grid2" style="margin-top:10px">${s.blocks.map(b => cwCode(esc(b.title), b.code, esc(b.hint))).join("")}</div>`;
  if (s.stitch) h += `<div class="pattern stitch"><b>Query stitching needs no BFF or orchestrator code.</b> The front end's federated query is served by ${s.stitch.map(x => `<b>${esc(x)}</b>`).join(", ")}; each keeps its own REST + GraphQL service. Pick one to see its files.</div>${cwChips(s.stitch, s.sg, "stitch-sg")}`;
  h += `<details style="margin-top:10px"${s.cur || s.pairs ? "" : " open"}><summary><b>Generated ${esc(s.sg)} subgraph files</b> <span class="hint">· ${s.files.length} file(s)</span></summary>${s.files.map(f => cwCode(`<span class="mono" style="font-size:12.5px">${esc(f.title)}</span>`, f.code, "", f.sdl ? highlightSDL : null)).join("")}</details>
    <div class="selrow" style="margin-top:8px"><button data-act="dl-server">⬇ Download ${esc(w.serverLang)} server code</button></div>`;
  return h;
}

// The MonoGraph resolver being moved, per server stack; what it does today follows the target's service type.
function cwMonoResolver(lang, f, sgm) {
  const an = f.argList.map(a => a.name), ret = baseType(f.type) || "Result", T = f.root, svc = sgm.svcType, Sg = sgm.Sg;
  const how = { Domain: `reads ${ret} straight from the shared monolith database`, Orchestrator: `runs the whole ${f.name} workflow in-process, calling the other domains' code directly in one transaction`, Integration: `calls the external ${sgm.sgName} system's API from inside the monolith` }[svc] || "resolves it in-process";
  if (lang === "Java (Spring for GraphQL)") {
    const call = svc === "Domain" ? `${camel(ret)}Repository.find(${an.join(", ")})` : svc === "Integration" ? `${camel(Sg)}ApiClient.${f.name}(${an.join(", ")})` : `${camel(Sg)}Workflow.${f.name}(${an.join(", ")})`;
    return `// Current — MonoGraph (one Spring for GraphQL app for every domain)\n// ${T}.${f.name} ${how}\n@Controller\npublic class MonoGraphController {\n  @${T === "Mutation" ? "MutationMapping" : "QueryMapping"}\n  public ${jRet(f.type)} ${f.name}(${f.argList.map(a => `@Argument ${jType(a.type)} ${a.name}`).join(", ")}) {\n    return ${call};\n  }\n}`;
  }
  if (lang === ".NET (Hot Chocolate)") {
    const call = svc === "Domain" ? `db.${cap(ret)}s.Find(${an.join(", ")})` : svc === "Integration" ? `${camel(Sg)}Api.${cap(f.name)}Async(${an.join(", ")})` : `${camel(Sg)}Workflow.${cap(f.name)}Async(${an.join(", ")})`;
    return `// Current — MonoGraph (one Hot Chocolate server for every domain)\n// ${T}.${f.name} ${how}\npublic class ${T}\n{\n    public async Task<${csT(f.type)}> ${cap(f.name)}(${f.argList.map(a => `${csT(a.type, true)} ${a.name}`).join(", ")}${an.length ? ", " : ""}[Service] MonoGraphDbContext db, [Service] I${Sg}Workflow ${camel(Sg)}Workflow, [Service] I${Sg}Api ${camel(Sg)}Api)\n        => await ${call};\n}`;
  }
  const body = svc === "Domain" ? `return db.${camel(ret)}.findOne({ ${an.join(", ")} });` : svc === "Integration" ? `const res = await fetch(\`\${process.env.${envName(sgm.sgName)}_API_URL}/${f.name}\`);\n      return mapTo${ret}(await res.json());` : `// the whole workflow runs here, inside the monolith\n      return workflows.${camel(Sg)}.${f.name}({ ${an.join(", ")} });`;
  return `// Current — MonoGraph resolver (one Apollo Server for every domain)\n// ${T}.${f.name} ${how}\nconst resolvers = {\n  ${T}: {\n    ${f.name}: async (_parent, { ${an.join(", ")} }, { db, workflows }) => {\n      ${body}\n    },\n  },\n};`;
}

function cwStepSave() {
  const w = cw(), r = cwRestOp();
  let h = cwH(8, "Save & export", "Keep the mapping with the registry and hand the code to the teams:<ul><li><b>Registry + BffMappings + CodeMigration</b> (.xlsx): the loaded registry with the BFF endpoint → FedGQL operation rows (incl. orchestrator role and REST / gRPC per call), plus a CodeMigration sheet that logs this endpoint, its target service and the chosen client / server stacks.</li><li><b>Code pack</b> (.md): the mapping summary and the current → target client and server code for the teams.</li></ul>");
  h += `<div class="selrow"><button class="primary" data-act="export">💾 Export registry + mappings (.xlsx)</button><button data-act="dl-pack">⬇ Download code pack (.md)</button>
    <span class="hint">${w.savedAt ? "Exported " + esc(new Date(w.savedAt).toLocaleString()) : "Not exported yet."}</span></div>`;
  if (w.savedAt) h += `<div class="pattern orch">✅ <span class="mono">${esc(r ? restRefOf(r) : "")}</span> is migrated. Retire the monolith route once every client uses the FedGQL operation. Click <b>Migrate another endpoint</b> to continue with the same registry and spec.</div>`;
  return h;
}

/* ------------------------------ actions -------------------------------- */
function cwPickFile(accept, cb, binary) {
  const inp = document.getElementById("cwFileInput");
  inp.accept = accept; inp.onchange = () => { const f = inp.files[0]; inp.value = ""; if (!f) return; const rd = new FileReader(); rd.onload = e => cb(e.target.result, f.name); binary ? rd.readAsArrayBuffer(f) : rd.readAsText(f); };
  inp.click();
}
async function cwFetch(path, binary) {
  try { const res = await fetch(path); if (!res.ok) throw new Error("HTTP " + res.status); return binary ? await res.arrayBuffer() : await res.text(); }
  catch (e) { alert(`Couldn't load ${path} (${e.message || e}).\n\nSamples need the page served over http(s), e.g. GitHub Pages or  python3 -m http.server  in this folder. From disk (file://), use Choose file… and pick it from samples/.`); return null; }
}
function cwLoadRegistry(buf, name) {
  M.bff = {}; loadRegWB(XLSX.read(buf, { type: "array" })); M.sgName = name.replace(/\.xlsx$/i, "");
  const w = cw(); w.regName = M.sgName; cwResetFrom(1);
  try { let bin = ""; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); localStorage.setItem(CW_REG, btoa(bin)); } catch (_) {}
  cwSave(); renderStatus(); render(); cwRender(); toast(`Loaded ${name}: ${M.gqlOps.length} FedGQL ops`);
}
function cwApplySpec(text, name) {
  if (cw().source === "monograph") { CW_MONO = cwParseMono(text); if (!CW_MONO.ops.length) throw new Error("no Query / Mutation root fields found"); M.restOps = []; M.restTypes = CW_MONO.types; }
  else { const sg = parseOpenAPI(text, name); M.restOps = sg.ops; M.restTypes = sg.types; }
  M.restName = name.split("/").slice(-2).join("/");
}
function cwLoadSpec(text, name) {
  try { cwApplySpec(text, name); }
  catch (e) { alert("Could not parse the spec: " + (e.message || e)); return; }
  const w = cw(); w.specName = name; cwResetFrom(1);
  try { localStorage.setItem(CW_SPEC, text); } catch (_) {}
  cwSync(); cwSave(); renderStatus(); render(); cwRender(); toast(`Loaded ${cwSrcCount()} ${cw().source === "monograph" ? "root fields" : "endpoints"} from ${name.split("/").pop()}`);
}
function cwPickEndpoint(ref) {
  const w = cw();
  if (w.source === "bff") { if (w.bffRef === ref) return; w.bffRef = ref; bffRef = ref; curBff(); saveBff(); }
  else if (w.source === "monograph") { if (w.monoRef === ref) return; w.monoRef = ref; const g = cwMonoMatch(cwMonoField()); w.gqlId = g ? g.id : (M.gqlOps[0] || {}).id || ""; }
  else { if (w.restRef === ref) return; w.restRef = ref; const r = cwRestOp(); const g = M.gqlOps.find(x => refMatches(x, r)); w.gqlId = g ? g.id : (M.gqlOps[0] || {}).id || ""; }
  cwResetFrom(2); cwSync(); cwSave(); cwRender();
}
const cwStale = () => { const w = cw(); w.reviewed = false; w.clientDone = false; w.serverDone = false; w.savedAt = ""; };
function cwDownload(text, name) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
const cwExt = lang => ({ JavaScript: "js", Java: "java", "Android (Kotlin)": "kt", "iOS (Swift)": "swift", "Java (Spring for GraphQL)": "java", ".NET (Hot Chocolate)": "cs", "Node.js (Apollo Server)": "js" }[lang] || "txt");
const cwSlug = () => { const r = cwRestOp(); return r ? ((r.method ? r.method + "-" : "") + r.path).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() : "endpoint"; };
function cwClientText(lang) { const c = cwClientCode(lang); return c ? `// ===== Current — REST client =====\n${c.cur}\n\n// ===== Target — FedGQL client =====\n${c.tgt}\n` : ""; }
function cwServerText(lang) {
  const s = cwServerCode(lang); if (!s) return "";
  const parts = []; if (s.cur) parts.push(`// ===== Current — monolith ${s.tgt ? "handler" : "resolver"} =====\n${s.cur}`); if (s.tgt) parts.push(`// ===== Target — ${s.sg} service =====\n${s.tgt}`);
  if (s.pairs) { const d = document.createElement("div"); d.innerHTML = s.pairs; d.querySelectorAll("pre.code").forEach((pre, i) => parts.push(`// ===== ${["REST API", "GraphQL API", "Shared service"][i] || "Code"} =====\n${pre.textContent}`)); }
  s.blocks.forEach(b => parts.push(`// ===== ${b.title} =====\n${b.code}`));
  s.files.forEach(f => parts.push(`// ===== ${f.title} =====\n${f.code}`));
  return parts.join("\n\n") + "\n";
}
function cwSummaryRow() {
  const w = cw(), r = cwRestOp(), g = cwGql(), m = cwBff(), orch = m && bffOrchestratorOp(m);
  const ops = w.source === "bff" ? (m ? m.ops.map(o => `${o.kind} ${o.name}`).join(", ") : "") : g ? `${g.kind} ${g.Name}` : "";
  const tgtEnt = w.source === "bff" ? (orch ? orch.entityId : (bffOwnerOp(m) || (m && m.ops[0]) || {}).entityId) : g && g.EntityID;
  const plan = orch && orchestrationOf(orch.opId, w.bffRef), steps = plan ? plan.steps : [];
  return { Endpoint: r ? restRefOf(r) : "", Source: { bff: "BFF", rest: "Legacy REST", monograph: "MonoGraph" }[w.source] || "", Spec: w.specName, FedGqlOps: ops,
    Pattern: w.source === "bff" ? (orch ? "Orchestration" : "Query stitching") : "One-for-one", TargetSubgraph: tgtEnt ? subgraphOf(tgtEnt) : "", ServiceType: tgtEnt ? cwSvcOf(tgtEnt).type : "",
    Calls: steps.map(s => `${s.model.name} via ${s.via}`).join("; "), ClientLang: w.clientLang, ServerLang: w.serverLang, Status: "Migrated (code generated)", Updated: new Date().toISOString() };
}
function cwExport() {
  if (!M.wb) { toast("Load the registry first"); return; }
  const wb = M.wb, row = cwSummaryRow();
  wb.Sheets.BffMappings = XLSX.utils.aoa_to_sheet(bffRowsAoA()); if (!wb.SheetNames.includes("BffMappings")) wb.SheetNames.push("BffMappings");
  const prev = wb.Sheets.CodeMigration ? XLSX.utils.sheet_to_json(wb.Sheets.CodeMigration, { defval: "" }) : [];
  const rows = prev.filter(x => x.Endpoint !== row.Endpoint || x.Spec !== row.Spec).concat([row]);
  wb.Sheets.CodeMigration = XLSX.utils.json_to_sheet(rows, { header: Object.keys(row) }); if (!wb.SheetNames.includes("CodeMigration")) wb.SheetNames.push("CodeMigration");
  const fname = String(M.sgName || "GQLRegistry").replace(/[^a-zA-Z0-9_-]+/g, "-") + ".xlsx";
  XLSX.writeFile(wb, fname);
  cw().savedAt = new Date().toISOString(); cwSave(); cwRender(); toast(`Exported ${fname} (BffMappings + CodeMigration)`);
}
function cwPack() {
  const w = cw(), row = cwSummaryRow();
  const md = [`# Code migration — ${row.Endpoint}`, "", "| Field | Value |", "|---|---|", ...Object.entries(row).map(([k, v]) => `| ${k} | ${String(v).replace(/\|/g, "\\|")} |`), "",
    `## Client code (${w.clientLang})`, "", "```" + cwExt(w.clientLang), cwClientText(w.clientLang).trim(), "```", "",
    `## Server code (${w.serverLang})`, "", "```" + cwExt(w.serverLang), cwServerText(w.serverLang).trim(), "```", ""].join("\n");
  cwDownload(md, `code-migration-${cwSlug()}.md`);
}

/* ------------------------- Migration overview --------------------------- */
function cwOvBuild(host) {
  host.innerHTML = `<div class="ov">
    <div class="ov-node ov-src" data-node="src" data-go="1" title="Steps 1–2: registry and the monolith's spec"><h3>Monolithic estate</h3><div class="ov-sub">what the callers use today</div>
      ${onbItem("upload", "GQLRegistry.xlsx", "reg")}
      <div class="ov-div">migrate from</div>
      ${onbItem("layers", "Monolithic BFF", "src-bff")}${onbItem("spec", "Legacy service / orchestrator REST", "src-rest")}${onbItem("graph", "MonoGraph resolvers", "src-monograph")}
      <div class="ov-div">called by</div>
      ${onbItem("devices", "Web &amp; mobile clients", "clients")}</div>
    ${onbConn([["e1", "M0 50H40", 50]])}
    <div class="ov-node ov-hub" data-node="hub" data-go="4" title="Steps 3–5: endpoint, target and review"><h3>${ONB_ICON.swap} Code migration guide</h3><div class="ov-sub">map · choose the target service · review</div>
      <div class="ov-core">${ONB_ICON.graph}<b data-slot="core">REST → FedGQL</b></div>
      ${onbStepsHTML(CW_STEPS, CW_STEP_ICON)}
      <div class="ov-blue">Migration blueprint<span class="mono" data-slot="blue"></span></div></div>
    ${onbConn([["e2a", "M0 50H20V25H40", 25], ["e2b", "M0 50H20V75H40", 75]])}
    <div class="ov-col">
      <div class="ov-node ov-cli" data-node="cli" data-go="5" title="Step 6: client code"><h3>Client code</h3><div class="ov-sub" data-slot="cli-sub">one round-trip to the router</div>
        ${onbItem("code", "JavaScript · Java", "cli-web")}${onbItem("devices", "Android · iOS", "cli-mobile")}</div>
      <div class="ov-node ov-svr" data-node="svr" data-go="6" title="Step 7: server code"><h3>Server code</h3><div class="ov-sub" data-slot="svr-sub">target subgraph service</div>
        ${onbItem("db", "Domain service", "svc-Domain")}${onbItem("saga", "Orchestrator service", "svc-Orchestrator")}${onbItem("plug", "Integration service", "svc-Integration")}</div>
    </div>
    ${onbConn([["e3", "M0 25H20V50H40", 50], ["e3", "M0 75H20V50H40"]])}
    <div class="ov-node ov-tgt" data-node="tgt" data-go="7" title="Step 8: save & export"><h3>Federated supergraph</h3><div class="ov-sub">front ends → FedGQL router → subgraphs</div>
      ${onbItem("router", "FedGQL router", "tgt-router")}${onbItem("graph", "Subgraphs", "tgt-sg")}${onbItem("swap", "REST / gRPC between services", "tgt-calls")}${onbItem("table", "BffMappings · CodeMigration", "tgt-saved")}${onbItem("check", "Monolith route retired", "tgt-ok")}</div>
  </div>`;
  onbWire(host, cwGo);
}
function cwOverview() {
  const host = document.getElementById("cwOverview"); if (!host) return;
  if (!host.firstElementChild) cwOvBuild(host);
  const w = cw(), d = cwDone(), step = w.step, r = cwRestOp(), g = cwGql(), m = cwBff();
  const S = { src: [d[1], step <= 1], hub: [d[4], step >= 2 && step <= 4], cli: [d[5], step === 5], svr: [d[6], step === 6], tgt: [d[7], step === 7] };
  onbStages(host, S, CW_OV_PREV);
  onbEdge(host, "e1", onbFlow(S, "src", "hub")); onbEdge(host, "e2a", onbFlow(S, "hub", "cli")); onbEdge(host, "e2b", onbFlow(S, "hub", "svr", d[5])); onbEdge(host, "e3", onbFlow(S, "svr", "tgt", step === 7));
  onbSteps(host, d, step);
  const it = (slot, txt, ok, pick) => onbItemSet(host, slot, txt, ok, pick);
  it("reg", M.regTypes.length ? `${M.gqlOps.length} FedGQL ops · ${Object.keys(M.bff || {}).length} BFF mappings` : "load in step 1", d[0]);
  for (const k of Object.keys(CW_SOURCES)) it("src-" + k, w.source === k ? (cwSrcCount() ? `${cwSrcCount()} ${k === "monograph" ? "root fields" : "endpoints"} · ${String(w.specName).split("/").pop()}` : "selected · load the spec") : "", w.source === k && d[1], w.source ? w.source === k : undefined);
  it("clients", r ? `call ${restRefOf(r)}${r.mono ? " on the MonoGraph" : ""}` : "call the monolith (REST / MonoGraph)", false);
  onbSlot(host, "core", { bff: "BFF → FedGQL", monograph: "MonoGraph → FedGQL" }[w.source] || "REST → FedGQL");
  const orch = m && bffOrchestratorOp(m);
  const tgtEnt = w.source === "bff" ? (orch ? orch.entityId : m && m.ops[0] && m.ops[0].entityId) : g && g.EntityID;
  const svc = tgtEnt ? cwSvcOf(tgtEnt).type : "";
  onbSlot(host, "blue", r && (g || (m && m.ops.length)) ? `${restRefOf(r)} → ${w.source === "bff" ? (orch ? "mutation " + orch.name : `${m.ops.length} op federated query`) : g.kind + " " + g.Name} · ${subgraphOf(tgtEnt)} (${svc})` : r ? `${restRefOf(r)} → pick the FedGQL operations` : "pick a monolith endpoint");
  const isWeb = /^(JavaScript|Java)$/.test(w.clientLang);
  it("cli-web", d[5] && isWeb ? w.clientLang : "", d[5] && isWeb, step >= 5 ? isWeb : undefined);
  it("cli-mobile", d[5] && !isWeb ? w.clientLang : "", d[5] && !isWeb, step >= 5 ? !isWeb : undefined);
  onbSlot(host, "cli-sub", w.source === "bff" ? (orch ? "one mutation to the router" : "one federated query to the router") : "one operation to the router");
  for (const t of Object.keys(CW_SVC)) it("svc-" + t, svc === t ? `${subgraphOf(tgtEnt)}${d[6] ? " · " + w.serverLang : ""}` : "", svc === t && d[6], svc ? svc === t : undefined);
  onbSlot(host, "svr-sub", svc ? `${svc} service · REST + GraphQL API` : "target subgraph service");
  const sgs = m ? [...new Set(m.ops.map(o => subgraphOf(o.entityId)))] : tgtEnt ? [subgraphOf(tgtEnt)] : [];
  const plan = orch && orchestrationOf(orch.opId, w.bffRef), nR = plan ? plan.steps.filter(s => s.via === "rest").length : 0, nG = plan ? plan.steps.filter(s => s.via === "grpc").length : 0;
  it("tgt-router", d[4] ? (w.source === "bff" && !orch ? "stitches by @key" : "routes the operation") : "", d[7]);
  it("tgt-sg", sgs.join(", "), d[7]);
  it("tgt-calls", plan ? `${nR} REST · ${nG} gRPC` : w.source === "bff" ? "none (router stitches)" : "", d[7]);
  it("tgt-saved", w.savedAt ? "exported " + new Date(w.savedAt).toLocaleTimeString() : "", d[7]);
  it("tgt-ok", d[7] ? "when all clients use FedGQL" : "", false);
}

/* ------------------------------ wiring --------------------------------- */
// Header "Load example": sample registry + a sample spec + a ready-made endpoint, then the endpoint step.
async function cwLoadExample(which) {
  const b = await cwFetch("samples/GQLRegistry-sample.xlsx", true); if (!b) return;
  cwLoadRegistry(b, "GQLRegistry-sample.xlsx");
  const w = cw(), src = which === "bff" ? "bff" : which === "monograph" ? "monograph" : "rest";
  w.source = src; CW_MONO = { ops: [], types: [] }; M.restOps = []; M.restTypes = [];
  const p = src === "bff" ? "samples/bff-openapi.yaml" : src === "monograph" ? "samples/mono-graph.gql" : `samples/subgraph/${which}/openapi.yaml`;
  const t = await cwFetch(p); if (!t) return;
  cwLoadSpec(t, p);
  if (src === "bff") cwPickEndpoint("POST /bff/checkout");
  else if (src === "monograph") cwPickEndpoint("Query.product");
  else { const r = M.restOps.find(o => M.gqlOps.some(g => refMatches(g, o))) || M.restOps[0]; if (r) cwPickEndpoint(restRefOf(r)); }
  w.step = 2; cwSave(); cwRender(); toast(`Example loaded: ${p.split("/").slice(-2).join("/")}`);
}
function cwRestore() {
  const w = cw();
  try { const b = localStorage.getItem(CW_REG); if (b && !M.regTypes.length) { const bin = atob(b), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); loadRegWB(XLSX.read(u, { type: "array" })); M.sgName = w.regName || "GQLRegistry"; loadBff(); } } catch (_) {}
  try { const t = localStorage.getItem(CW_SPEC); if (t && w.specName && !M.restOps.length) cwApplySpec(t, w.specName); } catch (_) {}
  cwSync(); renderStatus(); render();
}
function cwInit() {
  const root = document.getElementById("cmGuide"); if (!root) return;
  cwRestore();
  document.getElementById("cwSteps").addEventListener("click", e => { const li = e.target.closest("li[data-step]"); if (li) cwGo(+li.dataset.step); });
  document.getElementById("cwBack").onclick = () => cwGo(cw().step - 1);
  document.getElementById("cwNext").onclick = () => {
    const w = cw(), flag = { 3: "targetOk", 4: "reviewed", 5: "clientDone", 6: "serverDone" }[w.step];
    if (flag) { w[flag] = true; cwSave(); return cwGo(w.step + 1); }
    if (w.step === CW_STEPS.length - 1) { Object.assign(w, { step: 2 }); cwResetFrom(1); cwSave(); return cwRender(); }
    cwGo(w.step + 1);
  };
  document.getElementById("cwRestart").onclick = () => { if (!confirm("Restart the code migration guide? The loaded registry and spec are kept.")) return; CW = null; try { localStorage.removeItem(CW_LS); } catch (_) {} const w = cw(); w.regName = M.sgName; cwSave(); cwRender(); };
  // top band / work area layout, toolbar collapse, overview toggle, drag bar (shared: onboarding.js)
  onbLayout({ root, top: document.getElementById("cwTop"), split: document.getElementById("cwHSplit"), ovBtn: document.getElementById("cwOvToggle"), chromeBtn: document.getElementById("chromeToggle"), key: "cm-onb" });
  const body = document.getElementById("cwBody");
  body.addEventListener("click", async e => {
    const el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
    const w = cw(), a = el.dataset.act, v = el.dataset.v;
    if (a === "pick-reg") cwPickFile(".xlsx", cwLoadRegistry, true);
    else if (a === "sample-reg") { const b = await cwFetch("samples/GQLRegistry-sample.xlsx", true); if (b) cwLoadRegistry(b, "GQLRegistry-sample.xlsx"); }
    else if (a === "src") { if (w.source !== v) { w.source = v; w.specName = ""; M.restOps = []; M.restTypes = []; CW_MONO = { ops: [], types: [] }; cwResetFrom(1); cwSync(); } cwSave(); cwRender(); }
    else if (a === "pick-spec") cwPickFile(w.source === "monograph" ? ".graphqls,.graphql,.gql,.txt" : ".json,.yaml,.yml,.txt", cwLoadSpec);
    else if (a === "sample-spec") { const p = document.getElementById("cwSample").value; const t = await cwFetch(p); if (t) cwLoadSpec(t, p); }
    else if (a === "add-op") { addBffOp(document.getElementById("cwAddOp").value); cwStale(); w.targetOk = false; cwSave(); cwRender(); }
    else if (a === "rm-op") { removeBffOp(+v); cwStale(); w.targetOk = false; cwSave(); cwRender(); }
    else if (a === "pat") { const m = curBff(); if (v === "stitch") setBffOrchestrator(""); else if (!bffOrchestratorOp(m)) { const mu = m.ops.find(o => o.kind === "mutation" && cwSvcOf(o.entityId).type === "Orchestrator") || m.ops.find(o => o.kind === "mutation"); if (!mu) return; setBffOrchestrator(mu.opId); } cwStale(); cwSave(); cwRender(); }
    else if (a === "via-all") { setAllVia(v); cwStale(); cwSave(); cwRender(); }
    else if (a === "clang" || a === "slang") { w[a === "clang" ? "clientLang" : "serverLang"] = v; if (a === "slang") orchLang = v; cwSave(); cwRender(); }
    else if (a === "stitch-sg") { w.stitchSg = v; cwSave(); cwRender(); }
    else if (a === "dl-client") cwDownload(cwClientText(w.clientLang), `client-${cwSlug()}.${cwExt(w.clientLang)}`);
    else if (a === "dl-server") cwDownload(cwServerText(w.serverLang), `server-${cwSlug()}.${cwExt(w.serverLang)}`);
    else if (a === "export") cwExport();
    else if (a === "dl-pack") cwPack();
  });
  body.addEventListener("change", e => {
    const el = e.target, w = cw();
    if (el.matches('[data-act="ep"]')) cwPickEndpoint(el.dataset.v);
    else if (el.id === "cwGqlSel") { w.gqlId = el.value; cwResetFrom(2); cwSync(); cwSave(); cwRender(); }
    else if (el.id === "cwBffName") { setBffName(el.value.trim()); cwStale(); cwSave(); cwRender(); }
    else if (el.id === "cwOrch") { setBffOrchestrator(el.value); cwStale(); cwSave(); cwRender(); }
    else if (el.id === "cwOwner") { setBffOwner(el.value); cwStale(); cwSave(); cwRender(); }
    else if (el.matches('[data-act="via"]')) { setBffField(+el.dataset.v, "via", el.value); cwStale(); cwSave(); cwRender(); }
  });
  cwRender();
}

cwInit();   // last: the step / overview constants above must be initialised first
