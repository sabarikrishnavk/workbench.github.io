// Knowledge graph visualiser for the harness (harness-engineering.html → Knowledge graph).
// Shows a work item's graph memory as a force-directed graph (2D / 3D), coloured by type, team or community,
// with search, filters, centrality, impact / trace traversal and a replay of the graph build in approval order.
// Sources: the sample work item (samples/workitems/WI-101/graph.js), the playbook catalog, or any graph.json
// in the { entities, relationships, artifacts | articles } shape used by harness-engineering.ai/knowledge-graph.
// Needs force-graph@1.51.4 on the page; 3d-force-graph is loaded on demand.
(function () {
"use strict";
let HOST = null, OPT = {};
const $ = id => document.getElementById(id);
const E = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const say = m => (OPT.toast || alert)(m);
const SAMPLE_BASE = "samples/workitems/WI-101/";
const CSS = `
.kg{ --accent: #7048e8; --kg-bg: #0b1020; --kg-panel: #121a30; --kg-line: #24304f; --kg-ink: #e6e9f2; --kg-muted: #93a0bf;
  display: grid; grid-template-columns: 220px minmax(0, 1fr) 320px; grid-template-rows: auto minmax(0, 1fr) auto; height: 82vh; min-height: 600px; background: var(--kg-bg); color: var(--kg-ink); border-radius: 10px; overflow: hidden; border: 1px solid #1c2440; font-size: 13px; line-height: 1.45; }
.kg.full{ position: fixed; inset: 0; z-index: 100; height: 100vh; border-radius: 0; }
.kg-bar{ grid-column: 1 / -1; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 8px 10px; background: var(--kg-panel); border-bottom: 1px solid var(--kg-line); }
.kg-bar .ttl{ font-weight: 700; margin-right: 6px; }
.kg button, .kg select, .kg input{ font: inherit; font-size: 12.5px; background: #1a2442; color: var(--kg-ink); border: 1px solid var(--kg-line); border-radius: 6px; padding: 4px 9px; }
.kg button:hover{ background: #23305a; }
.kg .seg{ display: inline-flex; border: 1px solid var(--kg-line); border-radius: 6px; overflow: hidden; }
.kg .seg button{ border: none; border-radius: 0; }
.kg .seg button.on{ background: var(--accent); color: #fff; }
.kg .lbl{ color: var(--kg-muted); font-size: 11.5px; }
.kg-search{ position: relative; }
.kg-search input{ width: 210px; }
.kg-search .res{ position: absolute; top: 100%; left: 0; width: 320px; max-height: 300px; overflow: auto; background: #141d38; border: 1px solid var(--kg-line); border-radius: 6px; z-index: 5; margin-top: 3px; }
.kg-search .res div{ padding: 5px 9px; cursor: pointer; display: flex; gap: 6px; align-items: center; }
.kg-search .res div:hover, .kg-search .res div.on{ background: #23305a; }
.kg-side{ background: var(--kg-panel); border-right: 1px solid var(--kg-line); overflow: auto; padding: 10px; }
.kg-side h5, .kg-det h5{ margin: 10px 0 6px; font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--kg-muted); }
.kg-side h5:first-child{ margin-top: 0; }
.kg-leg label{ display: flex; align-items: center; gap: 7px; padding: 2px 4px; border-radius: 4px; cursor: pointer; }
.kg-leg label:hover{ background: #1a2442; }
.kg-leg label.off{ opacity: .4; }
.kg-leg input{ display: none; }
.kg-leg .n{ margin-left: auto; color: var(--kg-muted); font-size: 11.5px; }
.dot{ width: 10px; height: 10px; border-radius: 50%; flex: none; display: inline-block; }
.kg-canvas{ position: relative; min-width: 0; min-height: 0; overflow: hidden; }
.kg-canvas .msg{ position: absolute; inset: 0; display: grid; place-items: center; color: var(--kg-muted); text-align: center; padding: 20px; }
.kg-canvas .hint{ position: absolute; left: 10px; bottom: 8px; color: var(--kg-muted); font-size: 11.5px; pointer-events: none; }
.kg-det{ background: var(--kg-panel); border-left: 1px solid var(--kg-line); overflow: auto; padding: 12px 14px; }
.kg-det .nm{ font-size: 16px; font-weight: 700; margin: 4px 0 2px; word-break: break-word; }
.kg-det .id{ font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; color: var(--kg-muted); }
.kg-det .ds{ margin: 6px 0; color: #c9d1e6; }
.kg-det .tp{ display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; padding: 1px 8px; border-radius: 999px; background: #1f2a4d; }
.kg-det .kv{ display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; font-size: 12px; }
.kg-det .kv span:nth-child(odd){ color: var(--kg-muted); }
.kg-det .metric{ display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.kg-det .metric div{ background: #18213f; border-radius: 6px; padding: 6px 8px; }
.kg-det .metric b{ display: block; font-size: 15px; }
.kg-det .metric small{ color: var(--kg-muted); font-size: 11px; }
.kg-det .rel{ display: flex; gap: 6px; align-items: baseline; padding: 2px 0; font-size: 12px; }
.kg-det .rel .r{ font-family: ui-monospace, Menlo, monospace; font-size: 10.5px; color: #a5b4fc; white-space: nowrap; }
.kg-det .lk{ color: #c7d2fe; cursor: pointer; text-decoration: none; border-bottom: 1px dotted #5b6aa8; }
.kg-det .lk:hover{ color: #fff; }
.kg-det .art{ display: block; padding: 4px 0; border-bottom: 1px solid var(--kg-line); font-size: 12px; }
.kg-det .art a{ color: #c7d2fe; }
.kg-det .art small{ color: var(--kg-muted); }
.kg-det .acts{ display: flex; gap: 6px; flex-wrap: wrap; margin: 8px 0; }
.kg-det .kg-empty{ color: var(--kg-muted); text-align: left; padding: 0; }
.kg a{ color: #c7d2fe; }
.kg .tp{ color: var(--kg-ink); }
.kg-foot{ grid-column: 1 / -1; display: flex; align-items: center; gap: 10px; padding: 7px 12px; background: var(--kg-panel); border-top: 1px solid var(--kg-line); flex-wrap: wrap; }
.kg-foot input[type=range]{ flex: 1; min-width: 160px; padding: 0; accent-color: var(--accent); }
.kg-foot .stat{ color: var(--kg-muted); font-size: 12px; white-space: nowrap; }
.kg-tip{ font-size: 12px; }
@media (max-width: 1000px){
  .kg{ grid-template-columns: 1fr; grid-template-rows: auto 60vh auto auto auto; height: auto; }
  .kg-side, .kg-det{ border: none; border-top: 1px solid var(--kg-line); max-height: 320px; }
  .kg-canvas{ order: 1; } .kg-side{ order: 2; } .kg-det{ order: 3; } .kg-foot{ order: 4; }
}
`;
const MARKUP = `
    <div class="kg-bar">
      <span class="ttl">Knowledge Graph</span>
      <select id="kgSrc" title="Graph source">
        <option value="sample">Sample: WI-101 retail BOPIS</option>
        <option value="catalog">Playbook catalog (this browser)</option>
        <option value="file">Load graph.json…</option>
      </select>
      <input type="file" id="kgFile" accept=".json,application/json" hidden />
      <div class="kg-search"><input id="kgQ" type="search" placeholder="Search nodes..." autocomplete="off" /><div class="res" id="kgRes" hidden></div></div>
      <span class="lbl">Color Mode</span>
      <span class="seg" id="kgColor"><button data-m="type" class="on">By Type</button><button data-m="team">By Team</button><button data-m="community">By Community</button></span>
      <span class="seg" id="kgDim"><button data-d="2" class="on">2D</button><button data-d="3">3D</button></span>
      <label class="lbl" style="display:flex;gap:5px;align-items:center;cursor:pointer"><input type="checkbox" id="kgArts" /> Artifact nodes</label>
      <span style="flex:1"></span>
      <button id="kgFit" title="Fit the graph to the view">Fit</button>
      <button id="kgReset" title="Clear selection and filters">Reset</button>
      <button id="kgFull" title="Full screen">⛶</button>
    </div>
    <div class="kg-side">
      <h5 id="kgLegT">Entity Types</h5>
      <div class="kg-leg" id="kgLeg"></div>
      <h5>Graph</h5>
      <div class="kg-tip" id="kgStats"></div>
    </div>
    <div class="kg-canvas" id="kgCanvas"><div class="msg" id="kgMsg">Loading knowledge graph...</div><div class="hint">Click a node · double-click to focus · Esc to clear</div></div>
    <div class="kg-det" id="kgDet"></div>
    <div class="kg-foot">
      <button id="kgPlay" title="Replay the graph build in approval order">▶ Replay</button>
      <input type="range" id="kgTime" min="0" max="0" value="0" />
      <span class="stat" id="kgTimeL"></span>
    </div>
`;

/* --------------------------------------------------------------- colours */
const TEAM_COL = { Product: "#8b5cf6", Architecture: "#14b8a6", Engineering: "#3b82f6", Quality: "#f97316", SRE: "#eab308", Platform: "#94a3b8", Other: "#64748b" };
const PALETTE = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#84cc16", "#14b8a6", "#f97316", "#a855f7", "#22d3ee", "#eab308", "#6366f1", "#f43f5e", "#2dd4bf", "#fb923c", "#a3e635", "#38bdf8", "#e879f9", "#facc15", "#4ade80", "#c084fc", "#fda4af"];
// fixed type colours, grouped by the team that usually writes them; anything else gets the next palette colour
const TYPE_COL = { WorkItem: "#f8fafc", Persona: "#c4b5fd", Outcome: "#a78bfa", Metric: "#8b5cf6", Journey: "#d946ef", Requirement: "#7c3aed", Epic: "#e879f9", Story: "#c026d3", Screen: "#f0abfc", Component: "#60a5fa", Token: "#93c5fd",
  Decision: "#2dd4bf", Option: "#5eead4", Dispensation: "#f43f5e", TechDebt: "#fb7185", Application: "#14b8a6", ADR: "#0d9488", Container: "#99f6e4", Risk: "#fda4af", NFR: "#34d399", Entity: "#22c55e", Attribute: "#86efac",
  Interface: "#06b6d4", Dataset: "#67e8f9", Mapping: "#a5f3fc", Task: "#38bdf8", Contract: "#3b82f6", Operation: "#2563eb", Field: "#818cf8", Topic: "#6366f1", EventSchema: "#a5b4fc", Migration: "#1d4ed8",
  Review: "#0ea5e9", Waiver: "#fca5a5", PullRequest: "#60a5fa", TestLevel: "#fdba74", TestCase: "#f97316", TestSuite: "#fb923c", TestRun: "#ea580c", Defect: "#ef4444", Verdict: "#fde047", PerfResult: "#fed7aa", Acceptance: "#d9f99d",
  SLO: "#facc15", Alert: "#eab308", RunbookSection: "#fde68a", Release: "#ca8a04", Deployment: "#a16207", Incident: "#dc2626", Action: "#fecaca", Learning: "#bef264", BacklogItem: "#a3e635", Artifact: "#e2e8f0",
  Agent: "#60a5fa", Skill: "#a78bfa", Gate: "#f97316", Concept: "#8b5cf6", Technology: "#06b6d4", Pattern: "#10b981", Organization: "#f59e0b" };

/* --------------------------------------------------------------- graph model */
let G = null;   // { nodes, links, arts, base, title, byId, out, inc, types, teams, comms }
function normalise(raw, base, title) {
  const ents = raw.entities || {}, arts = raw.artifacts || raw.articles || {}, nodes = [], byId = {};
  Object.entries(ents).forEach(([id, e]) => { const n = { id, name: e.name || id, type: e.type || "Entity", desc: e.description || "", team: e.team || "Other", artifact: e.artifact || "", props: e.props || {}, first: e.first_seen || "", mentions: e.mentions ? [...e.mentions] : [] };
    nodes.push(n); byId[id] = n; });
  const links = [];
  (raw.relationships || []).forEach(r => { if (!byId[r.source] || !byId[r.target]) return; const a = r.artifacts || r.articles || [];
    links.push({ s: r.source, t: r.target, type: r.type || "RELATED_TO", arts: a, props: r.props || {} });
    a.forEach(x => [r.source, r.target].forEach(id => { if (!byId[id].mentions.includes(x)) byId[id].mentions.push(x); })); });
  nodes.forEach(n => { if (!n.first) n.first = n.mentions.map(m => (arts[m] || {}).approved || (arts[m] || {}).extracted_at || "").filter(Boolean).sort()[0] || ""; });
  G = { nodes, links, arts, base: base || "", title: title || (raw.metadata && (raw.metadata.title || raw.metadata.workItem)) || "Graph", byId, meta: raw.metadata || {} };
  index(); analyse();
}
function index() {
  G.out = {}; G.inc = {}; G.nodes.forEach(n => { G.out[n.id] = []; G.inc[n.id] = []; });
  G.links.forEach(l => { G.out[l.s].push(l); G.inc[l.t].push(l); });
}
// degree + betweenness (Brandes, undirected) + communities (Louvain, local moving phase repeated)
function analyse() {
  const ids = G.nodes.map(n => n.id), N = ids.length, ix = Object.fromEntries(ids.map((id, i) => [id, i])), adj = ids.map(() => new Set());
  G.links.forEach(l => { const a = ix[l.s], b = ix[l.t]; if (a !== b) { adj[a].add(b); adj[b].add(a); } });
  const A = adj.map(s => [...s]), bc = new Float64Array(N);
  for (let s = 0; s < N; s++) {
    const S = [], P = ids.map(() => []), sig = new Float64Array(N), d = new Int32Array(N).fill(-1), dl = new Float64Array(N); sig[s] = 1; d[s] = 0; const Q = [s];
    for (let qi = 0; qi < Q.length; qi++) { const v = Q[qi]; S.push(v); for (const w of A[v]) { if (d[w] < 0) { d[w] = d[v] + 1; Q.push(w); } if (d[w] === d[v] + 1) { sig[w] += sig[v]; P[w].push(v); } } }
    while (S.length) { const w = S.pop(); for (const v of P[w]) dl[v] += sig[v] / sig[w] * (1 + dl[w]); if (w !== s) bc[w] += dl[w]; }
  }
  const norm = N > 2 ? (N - 1) * (N - 2) : 1;
  G.nodes.forEach((n, i) => { n.deg = A[i].length; n.bc = bc[i] / norm; });
  const byBc = [...G.nodes].sort((a, b) => b.bc - a.bc); byBc.forEach((n, i) => n.rank = i + 1);
  // Louvain phase 1 on the undirected graph
  const m2 = A.reduce((s, x) => s + x.length, 0) || 1, k = A.map(x => x.length), com = ids.map((_, i) => i), tot = k.slice();
  for (let pass = 0, moved = true; moved && pass < 20; pass++) {
    moved = false;
    for (let i = 0; i < N; i++) {
      const ci = com[i], w = {}; A[i].forEach(j => w[com[j]] = (w[com[j]] || 0) + 1);
      tot[ci] -= k[i]; let best = ci, gain = (w[ci] || 0) - tot[ci] * k[i] / m2;
      for (const c in w) { const g = w[c] - tot[c] * k[i] / m2; if (g > gain + 1e-12) { gain = g; best = +c; } }
      tot[best] += k[i]; if (best !== ci) { com[i] = best; moved = true; }
    }
  }
  const sizes = {}; com.forEach(c => sizes[c] = (sizes[c] || 0) + 1);
  const order = Object.keys(sizes).sort((a, b) => sizes[b] - sizes[a]), rename = Object.fromEntries(order.map((c, i) => [c, i + 1]));
  G.nodes.forEach((n, i) => n.com = rename[com[i]]);
  G.comms = order.map((c, i) => { const ms = G.nodes.filter(n => n.com === i + 1), top = [...ms].sort((a, b) => b.deg - a.deg)[0]; return { id: i + 1, size: sizes[c], label: top ? top.name : "" }; });
  G.types = count(G.nodes.map(n => n.type)); G.teams = count(G.nodes.map(n => n.team));
  let pi = 0; G.typeCol = {}; Object.keys(G.types).forEach(t => G.typeCol[t] = TYPE_COL[t] || PALETTE[pi++ % PALETTE.length]);
}
const count = a => a.reduce((m, x) => (m[x] = (m[x] || 0) + 1, m), {});

/* --------------------------------------------------------------- view state */
const V = { color: "type", dim: 2, arts: false, hidden: new Set(), sel: null, hl: null, hlMode: "", t: -1, fg: null, dates: [], playing: null };
function colorOf(n) {
  if (n.isArt) return "#e2e8f0";
  if (V.color === "team") return TEAM_COL[n.team] || TEAM_COL.Other;
  if (V.color === "community") return PALETTE[(n.com - 1) % PALETTE.length];
  return G.typeCol[n.type] || "#94a3b8";
}
const groupOf = n => V.color === "team" ? n.team : V.color === "community" ? "C" + n.com : n.type;
function visibleData() {
  const cut = V.t >= 0 && V.t < V.dates.length - 1 ? V.dates[V.t] : null;
  const artDate = a => (G.arts[a] || {}).approved || "";
  const shown = n => !V.hidden.has(V.color + ":" + groupOf(n)) && (!cut || !n.first || n.first <= cut);
  const nodes = G.nodes.filter(shown), on = new Set(nodes.map(n => n.id));
  const links = G.links.filter(l => on.has(l.s) && on.has(l.t) && (!cut || !l.arts.length || l.arts.some(a => !artDate(a) || artDate(a) <= cut))).map(l => ({ source: l.s, target: l.t, type: l.type, ref: l }));
  if (V.arts) {
    G.artNodes = G.artNodes || {};
    Object.entries(G.arts).forEach(([aid, a]) => { if (cut && a.approved && a.approved > cut) return;
      const members = nodes.filter(n => n.artifact === aid); if (!members.length) return;
      const an = G.artNodes[aid] = G.artNodes[aid] || { id: "§" + aid, aid, isArt: true, name: `${aid} ${a.title || ""}`, type: "Artifact", team: a.team || "Other", deg: members.length, bc: 0, com: 0 };
      nodes.push(an); members.forEach(m => links.push({ source: an.id, target: m.id, type: "WROTE", art: true })); });
  }
  return { nodes, links };
}

/* --------------------------------------------------------------- renderer */
let raf = 0;
function draw(refit) {
  const el = $("kgCanvas"), box = el.getBoundingClientRect();
  if (!box.width) return;   // hidden tab: drawn by the ResizeObserver when it becomes visible
  if (!window.ForceGraph) { $("kgMsg").hidden = false; $("kgMsg").textContent = "The graph library didn't load (are you offline?). The rest of the tutorial still works."; return; }
  const data = visibleData();
  $("kgMsg").hidden = !!data.nodes.length; if (!data.nodes.length) $("kgMsg").textContent = "No nodes to show. Check the filters on the left.";
  const make = V.dim === 3 ? window.ForceGraph3D : window.ForceGraph;
  if (!V.fg || V.fg._dim !== V.dim) {
    if (V.fg) { try { V.fg._destructor && V.fg._destructor(); } catch (e) {} el.querySelectorAll("canvas, .scene-container, .force-graph-container").forEach(x => x.remove()); }
    const host = document.createElement("div"); host.className = "force-graph-container"; el.prepend(host);
    const fg = make()(host).backgroundColor("#0b1020").nodeId("id").nodeLabel(n => `<b>${E(n.name)}</b><br>${E(n.type)}${n.isArt ? "" : " · " + E(n.id)}`)
      .nodeVal(n => n.isArt ? 6 : 1 + Math.sqrt(n.deg || 1) * 1.6).nodeColor(n => nodeCol(n))
      .linkColor(l => linkCol(l)).linkWidth(l => isHlLink(l) ? 1.6 : 0.5).linkDirectionalArrowLength(V.dim === 2 ? 3 : 2.5).linkDirectionalArrowRelPos(1)
      .linkLabel(l => E(l.type)).onNodeClick(n => select(n.isArt ? null : n.id, n.isArt ? n.aid : null)).onBackgroundClick(() => select(null))
      .cooldownTicks(220).d3VelocityDecay(0.32);
    if (V.dim === 2) {
      fg.nodeCanvasObjectMode(() => "after").nodeCanvasObject((n, ctx, scale) => {
        const show = n === focusNode() || (V.hl && V.hl.has(n.id)) || scale > 2.4 || (n.deg >= 14 && scale > 0.9) || n.isArt && scale > 1.2;
        if (!show) return; const fs = Math.max(10 / scale, 1.6); ctx.font = `${fs}px -apple-system, Segoe UI, sans-serif`;
        ctx.fillStyle = V.hl && !V.hl.has(n.id) && n !== focusNode() ? "rgba(230,233,242,.25)" : "rgba(230,233,242,.92)"; ctx.textAlign = "center"; ctx.textBaseline = "top";
        const r = Math.sqrt(1 + Math.sqrt(n.deg || 1) * 1.6) * 4; ctx.fillText(n.name.length > 34 ? n.name.slice(0, 32) + "…" : n.name, n.x, n.y + r + 1);
      });
      fg.onNodeHover(n => { el.style.cursor = n ? "pointer" : ""; });
      fg.d3Force("charge").strength(-60); fg.d3Force("link").distance(l => l.art ? 26 : 34);
    }
    fg._dim = V.dim; V.fg = fg;
    let dbl = 0; fg.onNodeClick(n => { const t = Date.now(); if (t - dbl < 350) focus(n); dbl = t; select(n.isArt ? null : n.id, n.isArt ? n.aid : null); });
  }
  V.fg.width(box.width).height(box.height).graphData(data);
  if (refit) setTimeout(() => V.fg && V.fg.zoomToFit && V.fg.zoomToFit(600, 40), 900);
}
const focusNode = () => V.sel && (G.byId[V.sel] || (G.artNodes || {})[V.sel.slice(1)]);
function nodeCol(n) { const c = colorOf(n); return !V.hl || V.hl.has(n.id) || n.id === V.sel ? c : "rgba(120,130,160,0.18)"; }
function isHlLink(l) { if (!V.hl) return false; const s = l.source.id || l.source, t = l.target.id || l.target; return V.hl.has(s) && V.hl.has(t); }
function linkCol(l) { return isHlLink(l) ? "rgba(199,210,254,.9)" : V.hl ? "rgba(120,130,160,.08)" : l.art ? "rgba(226,232,240,.12)" : "rgba(148,163,184,.28)"; }
function refresh() { if (!V.fg) return; V.fg.nodeColor(V.fg.nodeColor()).linkColor(V.fg.linkColor()).linkWidth(V.fg.linkWidth()); if (V.dim === 3 && V.fg.refresh) V.fg.refresh(); }
function focus(n) {
  if (!V.fg || !n) return;
  if (V.dim === 2) { if (n.x == null) return; V.fg.centerAt(n.x, n.y, 700); V.fg.zoom(3.2, 700); }
  else if (n.x != null) { const d = 90, r = 1 + d / Math.hypot(n.x || 1, n.y || 1, n.z || 1); V.fg.cameraPosition({ x: n.x * r, y: n.y * r, z: n.z * r }, n, 900); }
}

/* --------------------------------------------------------------- traversal */
// upstream = what this traces to (follow outgoing edges); impact = what depends on it (follow incoming edges)
function walk(id, dir) {
  const seen = new Set([id]), q = [id];
  while (q.length) { const v = q.shift(); (dir === "up" ? G.out[v] : G.inc[v]).forEach(l => { const w = dir === "up" ? l.t : l.s; if (!seen.has(w)) { seen.add(w); q.push(w); } }); }
  return seen;
}
function highlight(id, mode) {
  V.hlMode = mode || "";
  if (!id) V.hl = null;
  else if (mode === "up" || mode === "impact") V.hl = walk(id, mode === "up" ? "up" : "down");
  else V.hl = new Set([id, ...G.out[id].map(l => l.t), ...G.inc[id].map(l => l.s)]);
  refresh();
}

/* --------------------------------------------------------------- panels */
function docLink(aid) { const a = G.arts[aid] || {}; const href = a.doc ? G.base + a.doc : a.url || ""; return href ? `<a href="${E(href)}" target="_blank" rel="noopener">${E(aid)}</a>` : E(aid); }
function select(id, aid) {
  V.sel = id ? id : aid ? "§" + aid : null;
  if (id) highlight(id); else if (aid) { V.hl = new Set(["§" + aid, ...G.nodes.filter(n => n.artifact === aid).map(n => n.id)]); refresh(); } else highlight(null);
  renderDetail();
}
function renderDetail() {
  const d = $("kgDet");
  if (!V.sel) {
    const top = [...G.nodes].sort((a, b) => b.bc - a.bc).slice(0, 8);
    d.innerHTML = `<h5>${E(G.title)}</h5><div class="ds">${E(G.meta.domain || "")}</div>
      <div class="metric"><div><b>${G.nodes.length}</b><small>nodes</small></div><div><b>${G.links.length}</b><small>relationships</small></div><div><b>${Object.keys(G.types).length}</b><small>entity types</small></div><div><b>${Object.keys(G.arts).length}</b><small>artifacts</small></div></div>
      <h5>Most central</h5>${top.map(n => `<div class="rel"><span class="dot" style="background:${colorOf(n)}"></span><span class="lk" data-go="${E(n.id)}">${E(n.name)}</span><span class="r">${E(n.type)}</span></div>`).join("")}
      <h5>Try</h5><div class="kg-empty">Search for <span class="lk" data-go="KDD-02">KDD-02</span>, <span class="lk" data-go="REQ-03">REQ-03</span> or <span class="lk" data-go="INC-2041">INC-2041</span>, then use <b>Impact</b> to see what depends on it.</div>`;
    return wireDet();
  }
  if (V.sel.startsWith("§")) {
    const aid = V.sel.slice(1), a = G.arts[aid] || {}, ms = G.nodes.filter(n => n.artifact === aid);
    d.innerHTML = `<span class="tp"><span class="dot" style="background:#e2e8f0"></span>Artifact</span><div class="nm">${E(a.title || aid)}</div><div class="id">${E(aid)} · v${E(a.version || 1)} · approved ${E(a.approved || "—")}</div>
      <div class="kv" style="margin-top:8px"><span>Document</span><span>${docLink(aid)} <small>${E(a.doc || "")}</small></span><span>Produced by</span><span>${E(a.produced_by || "")}</span><span>Emits</span><span>${E(a.emits || "")}</span><span>Inputs</span><span>${E((a.inputs || []).join(", ") || "—")}</span></div>
      <h5>Wrote ${ms.length} nodes</h5>${ms.map(n => `<div class="rel"><span class="dot" style="background:${colorOf(n)}"></span><span class="lk" data-go="${E(n.id)}">${E(n.name)}</span><span class="r">${E(n.type)}</span></div>`).join("") || '<div class="kg-empty">None</div>'}`;
    return wireDet();
  }
  const n = G.byId[V.sel]; if (!n) return;
  const group = (ls, dir) => { const by = {}; ls.forEach(l => (by[l.type] = by[l.type] || []).push(dir === "out" ? l.t : l.s));
    return Object.entries(by).map(([r, xs]) => `<div class="rel"><span class="r">${dir === "out" ? "" : "← "}${E(r)}${dir === "out" ? " →" : ""}</span><span>${xs.map(x => `<span class="lk" data-go="${E(x)}">${E(G.byId[x].name.length > 40 ? x : G.byId[x].name)}</span>`).join(", ")}</span></div>`).join(""); };
  const props = Object.entries(n.props || {}).filter(([, v]) => v !== "" && v != null);
  const imp = V.hlMode === "impact" ? V.hl : null, up = V.hlMode === "up" ? V.hl : null, set = imp || up;
  const setArts = set ? [...new Set([...set].map(x => (G.byId[x] || {}).artifact).filter(Boolean))] : [];
  const cm = G.comms[n.com - 1] || {};
  d.innerHTML = `<span class="tp"><span class="dot" style="background:${G.typeCol[n.type]}"></span>${E(n.type)}</span> <span class="tp" style="background:none;border:1px solid var(--kg-line)">${E(n.team)}</span>
    <div class="nm">${E(n.name)}</div><div class="id">${E(n.id)}</div>${n.desc && n.desc !== n.name ? `<div class="ds">${E(n.desc)}</div>` : ""}
    ${props.length ? `<div class="kv">${props.map(([k, v]) => `<span>${E(k)}</span><span>${E(v)}</span>`).join("")}</div>` : ""}
    <div class="acts"><button data-hl="near" class="${!V.hlMode ? "on" : ""}">Neighbours</button><button data-hl="up" title="Everything this node traces to">Trace up</button><button data-hl="impact" title="Everything that depends on this node: what goes stale if it changes">Impact</button><button data-focus>Center</button></div>
    ${set ? `<div class="ds"><b>${set.size - 1}</b> ${imp ? "nodes depend on this. Changing it would make these artifacts stale" : "nodes upstream, from these artifacts"}: ${setArts.map(docLink).join(", ") || "—"}</div>` : ""}
    <h5>Centrality</h5><div class="metric"><div><b>${n.deg}</b><small>degree</small></div><div><b>${n.bc.toFixed(3)}</b><small>betweenness · #${n.rank} of ${G.nodes.length}</small></div></div>
    <h5>Community</h5><div class="rel"><span class="dot" style="background:${PALETTE[(n.com - 1) % PALETTE.length]}"></span><span>Community ${n.com} · ${cm.size || 0} nodes, around <span class="lk" data-go="${E((G.nodes.find(x => x.com === n.com && x.name === cm.label) || {}).id || "")}">${E(cm.label || "")}</span></span></div>
    <h5>Relationships (${G.out[n.id].length + G.inc[n.id].length})</h5>${group(G.out[n.id], "out")}${group(G.inc[n.id], "in") || ""}${!G.out[n.id].length && !G.inc[n.id].length ? '<div class="kg-empty">None</div>' : ""}
    <h5>Mentions (${n.mentions.length})</h5>${n.mentions.map(m => { const a = G.arts[m] || {}; return `<span class="art">${docLink(m)} ${E(a.title || "")}<br><small>${m === n.artifact ? "wrote this node" : "references it"}${a.approved ? " · " + E(a.approved) : ""}</small></span>`; }).join("") || '<div class="kg-empty">None</div>'}`;
  wireDet();
}
function wireDet() {
  const d = $("kgDet");
  d.querySelectorAll("[data-go]").forEach(x => x.onclick = () => go(x.dataset.go));
  d.querySelectorAll("[data-hl]").forEach(x => x.onclick = () => { highlight(V.sel, x.dataset.hl === "near" ? "" : x.dataset.hl); renderDetail(); });
  d.querySelectorAll("[data-focus]").forEach(x => x.onclick = () => focus(G.byId[V.sel]));
}
function go(id, mode) {
  const n = G.byId[id]; if (!n) return;
  const k = V.color + ":" + groupOf(n); if (V.hidden.has(k)) { V.hidden.delete(k); renderLegend(); draw(); }
  if (V.t >= 0 && V.t < V.dates.length - 1 && n.first > V.dates[V.t]) { V.t = V.dates.length - 1; $("kgTime").value = V.t; timeLabel(); draw(); }
  select(id); if (mode) { highlight(id, mode); renderDetail(); }
  setTimeout(() => focus(n), 60);
}
function renderLegend() {
  const groups = V.color === "team" ? Object.entries(G.teams).map(([k, c]) => [k, k, c, TEAM_COL[k] || TEAM_COL.Other])
    : V.color === "community" ? G.comms.map(c => ["C" + c.id, `${c.id}. ${c.label}`, c.size, PALETTE[(c.id - 1) % PALETTE.length]])
    : Object.entries(G.types).sort((a, b) => b[1] - a[1]).map(([k, c]) => [k, k, c, G.typeCol[k]]);
  $("kgLegT").textContent = V.color === "team" ? "Teams" : V.color === "community" ? "Communities" : "Entity Types";
  $("kgLeg").innerHTML = groups.map(([k, l, c, col]) => `<label class="${V.hidden.has(V.color + ":" + k) ? "off" : ""}" title="Click to hide or show; double-click to show only this"><input type="checkbox" data-k="${E(k)}"><span class="dot" style="background:${col}"></span><span>${E(l)}</span><span class="n">${c}</span></label>`).join("")
    + `<div style="margin-top:6px;display:flex;gap:6px"><button id="kgAll">All</button><button id="kgNone">None</button></div>`;
  $("kgLeg").querySelectorAll("label").forEach(lb => { const k = V.color + ":" + lb.querySelector("input").dataset.k;
    lb.onclick = e => { e.preventDefault(); V.hidden.has(k) ? V.hidden.delete(k) : V.hidden.add(k); renderLegend(); draw(); };
    lb.ondblclick = e => { e.preventDefault(); groups.forEach(([g]) => V.hidden.add(V.color + ":" + g)); V.hidden.delete(k); renderLegend(); draw(true); }; });
  $("kgAll").onclick = () => { [...V.hidden].filter(h => h.startsWith(V.color + ":")).forEach(h => V.hidden.delete(h)); renderLegend(); draw(); };
  $("kgNone").onclick = () => { groups.forEach(([g]) => V.hidden.add(V.color + ":" + g)); renderLegend(); draw(); };
  const dens = G.nodes.length > 1 ? (2 * G.links.length / (G.nodes.length * (G.nodes.length - 1))).toFixed(3) : 0;
  $("kgStats").innerHTML = `${G.nodes.length} nodes · ${G.links.length} edges<br>${Object.keys(G.types).length} types · ${G.comms.length} communities<br>density ${dens} · ${Object.keys(count(G.links.map(l => l.type))).length} relation types`;
}
function timeLabel() {
  if (!V.dates.length) { $("kgTimeL").textContent = "No approval dates in this graph"; return; }
  const cut = V.dates[V.t], done = Object.values(G.arts).filter(a => a.approved && a.approved <= cut), last = Object.entries(G.arts).filter(([, a]) => a.approved === cut).map(([k]) => k);
  const nn = G.nodes.filter(n => !n.first || n.first <= cut).length;
  $("kgTimeL").textContent = `${cut} · ${done.length} / ${Object.keys(G.arts).length} artifacts approved · ${nn} nodes · latest: ${last.join(", ")}`;
}
function setupTime() {
  V.dates = [...new Set(Object.values(G.arts).map(a => a.approved).filter(Boolean))].sort();
  $("kgTime").max = Math.max(0, V.dates.length - 1); V.t = V.dates.length - 1; $("kgTime").value = V.t; $("kgTime").disabled = !V.dates.length; $("kgPlay").disabled = !V.dates.length; timeLabel();
}
function load(raw, base, title) {
  normalise(raw, base, title); V.hidden.clear(); V.sel = null; V.hl = null; V.hlMode = ""; G.artNodes = null;
  setupTime(); renderLegend(); renderDetail(); draw(true);
}

/* --------------------------------------------------------------- sources */
function catalogGraph() {
  let db = null; try { db = OPT.catalog ? OPT.catalog() : JSON.parse(localStorage.getItem("hx.catalog.v3") || localStorage.getItem("hx.catalog.v2") || "null"); } catch (e) {}
  if (!db || !db.Skills || !db.Skills.length) return null;
  const ents = {}, rels = [], list = s => String(s || "").split(",").map(x => x.trim()).filter(Boolean), pers = {}, agTeam = {};
  (db.Personas || []).forEach(p => { pers[p.PersonaID] = p; ents[p.PersonaID] = { name: p.Name, type: "Persona", team: p.Team, description: p.Accountable ? "Accountable: " + p.Accountable : "" }; });
  (db.Agents || []).forEach(a => { const t = (pers[a.PersonaID] || {}).Team || "Other"; agTeam[a.AgentID] = t; ents[a.AgentID] = { name: a.Name, type: "Agent", team: t, description: a.Description || "", props: { model: a.Model || "" } }; if (ents[a.PersonaID]) rels.push({ source: a.AgentID, type: "PLAYS", target: a.PersonaID }); });
  (db.Artifacts || []).forEach(a => ents[a.ArtifactID] = { name: a.Name, type: "Artifact", team: "Other", description: `${a.Doc || a.Path || ""}`, props: { event: a.Event || "", format: a.Format || "" } });
  (db.Gates || []).forEach(g => ents[g.GateID] = { name: g.Name, type: "Gate", team: "Quality", description: g.Check || "", props: { kind: g.Kind || "", blocking: g.Blocking || "" } });
  db.Skills.forEach(s => { const t = agTeam[s.AgentID] || "Other"; ents[s.SkillID] = { name: "/" + s.Name, type: "Skill", team: t, description: s.Purpose || "", props: { stage: s.Stage || "", approval: s.Approval || "Auto" } };
    if (ents[s.AgentID]) rels.push({ source: s.SkillID, type: "RUN_BY", target: s.AgentID });
    list(s.Inputs).forEach(a => ents[a] && rels.push({ source: s.SkillID, type: "READS", target: a }));
    list(s.Context).forEach(a => ents[a] && rels.push({ source: s.SkillID, type: "CONTEXT", target: a }));
    if (ents[s.Output]) { rels.push({ source: s.SkillID, type: "WRITES", target: s.Output }); ents[s.Output].team = t; }
    list(s.Gates).forEach(g => ents[g] && rels.push({ source: s.SkillID, type: "GATED_BY", target: g })); });
  return { entities: ents, relationships: rels, artifacts: {}, metadata: { title: "Playbook catalog", domain: "Personas, agents, skills, artifacts and gates from the master data" } };
}
function loadSample() { if (!window.HX_SAMPLE_GRAPH) { $("kgMsg").hidden = false; $("kgMsg").textContent = "samples/workitems/WI-101/graph.js is missing."; return; } $("kgSrc").value = "sample"; load(window.HX_SAMPLE_GRAPH, OPT.sampleBase || SAMPLE_BASE); }

function wire() {
  $("kgSrc").onchange = e => {
    const v = e.target.value;
    if (v === "sample") return loadSample();
    if (v === "catalog") { const g = catalogGraph(); if (!g) { say("The catalog is empty. Click Load example or load your master data first."); e.target.value = "sample"; return; } return load(g, "", "Playbook catalog"); }
    if (v === "file") $("kgFile").click();
  };
  $("kgFile").onchange = e => { const f = e.target.files[0]; if (!f) { $("kgSrc").value = "sample"; return; }
    const rd = new FileReader(); rd.onload = () => { try { const raw = JSON.parse(rd.result); if (!raw.entities) throw new Error("expected { entities, relationships }"); load(raw, "", f.name); } catch (err) { say("Could not read " + f.name + ": " + err.message); $("kgSrc").value = "sample"; } };
    rd.readAsText(f); e.target.value = ""; };

  $("kgColor").onclick = e => { const b = e.target.closest("button"); if (!b) return; V.color = b.dataset.m; $("kgColor").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); renderLegend(); draw(); refresh(); renderDetail(); };
  $("kgDim").onclick = e => { const b = e.target.closest("button"); if (!b) return; const d = +b.dataset.d; if (d === V.dim) return;
    const set = () => { V.dim = d; $("kgDim").querySelectorAll("button").forEach(x => x.classList.toggle("on", +x.dataset.d === d)); draw(true); };
    if (d === 3 && !window.ForceGraph3D) { b.textContent = "…"; const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/3d-force-graph@1.80.0/dist/3d-force-graph.min.js";
      s.onload = () => { b.textContent = "3D"; set(); }; s.onerror = () => { b.textContent = "3D"; say("Couldn't load the 3D library (are you offline?)."); }; document.head.appendChild(s); }
    else set(); };
  $("kgArts").onchange = e => { V.arts = e.target.checked; draw(); };
  $("kgFit").onclick = () => V.fg && V.fg.zoomToFit && V.fg.zoomToFit(600, 40);
  $("kgReset").onclick = () => { V.hidden.clear(); V.t = V.dates.length - 1; $("kgTime").value = V.t; timeLabel(); select(null); renderLegend(); draw(true); };
  $("kgFull").onclick = () => { $("kg").classList.toggle("full"); setTimeout(() => draw(), 50); };
  $("kgTime").oninput = e => { V.t = +e.target.value; timeLabel(); draw(); };
  $("kgPlay").onclick = () => {
    if (V.playing) { clearInterval(V.playing); V.playing = null; $("kgPlay").textContent = "▶ Replay"; return; }
    V.t = 0; $("kgPlay").textContent = "❚❚ Pause";
    const step = () => { $("kgTime").value = V.t; timeLabel(); draw(); if (V.t >= V.dates.length - 1) { clearInterval(V.playing); V.playing = null; $("kgPlay").textContent = "▶ Replay"; setTimeout(() => V.fg && V.fg.zoomToFit(600, 40), 600); } V.t++; };
    step(); V.playing = setInterval(step, 900);
  };
  document.addEventListener("keydown", e => { if (e.key === "Escape" && HOST.offsetParent) { if ($("kg").classList.contains("full")) { $("kg").classList.remove("full"); setTimeout(() => draw(), 50); } else select(null); } });
  new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const c = $("kgCanvas"); if (!c.clientWidth) return; if (!V.fg && G) draw(true); else if (V.fg) V.fg.width(c.clientWidth).height(c.clientHeight); }); }).observe($("kgCanvas"));
  // search
  (() => { const q = $("kgQ"), res = $("kgRes"); let hits = [], cur = 0;
    const show = () => { const s = q.value.trim().toLowerCase(); if (!s || !G) { res.hidden = true; return; }
      hits = G.nodes.filter(n => n.name.toLowerCase().includes(s) || n.id.toLowerCase().includes(s) || n.type.toLowerCase() === s).sort((a, b) => (b.id.toLowerCase() === s) - (a.id.toLowerCase() === s) || b.deg - a.deg).slice(0, 30); cur = 0;
      res.innerHTML = hits.map((n, i) => `<div data-i="${i}" class="${i === cur ? "on" : ""}"><span class="dot" style="background:${colorOf(n)}"></span><span>${E(n.name)}</span><small style="margin-left:auto;color:var(--kg-muted)">${E(n.type)}</small></div>`).join("") || '<div style="color:var(--kg-muted)">No match</div>';
      res.hidden = false; res.querySelectorAll("[data-i]").forEach(d => d.onmousedown = () => { go(hits[+d.dataset.i].id); res.hidden = true; }); };
    q.oninput = show; q.onfocus = show; q.onblur = () => setTimeout(() => res.hidden = true, 150);
    q.onkeydown = e => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { cur = Math.max(0, Math.min(hits.length - 1, cur + (e.key === "ArrowDown" ? 1 : -1))); res.querySelectorAll("[data-i]").forEach((d, i) => d.classList.toggle("on", i === cur)); e.preventDefault(); }
      if (e.key === "Enter" && hits[cur]) { go(hits[cur].id); res.hidden = true; q.blur(); } }; })();
}

// mount(host, { catalog: () => DB, toast, sampleBase }) renders the visualiser into host and loads the sample graph
function mount(host, opt) {
  if (HOST) return API;
  HOST = host; OPT = opt || {};
  if (!document.getElementById("kg-css")) { const st = document.createElement("style"); st.id = "kg-css"; st.textContent = CSS; document.head.appendChild(st); }
  host.innerHTML = `<div class="kg" id="kg">${MARKUP}</div>`;
  wire(); loadSample();
  return API;
}
// go(id, mode): select a node and optionally highlight its "impact" (dependants) or "up" (what it traces to)
function goTo(id, mode) { if (!G || !G.byId[id]) { if ($("kgSrc") && $("kgSrc").value !== "sample") loadSample(); } setTimeout(() => go(id, mode), 400); }
function reloadCatalog() { if ($("kgSrc") && $("kgSrc").value === "catalog") { const g = catalogGraph(); if (g) load(g, "", "Playbook catalog"); } }
const API = { mount, go: goTo, loadSample: () => loadSample(), reloadCatalog, TYPE_COL, TEAM_COL };
window.HarnessKG = API;
})();
