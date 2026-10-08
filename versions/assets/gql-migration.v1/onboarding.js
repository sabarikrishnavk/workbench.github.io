/* onboarding.js — shared UI for the onboarding guides
   (gql-onboarding.js on gql-migration.html, code-onboarding.js on subgraph-codemigration.html).
   Icons plus the "Migration overview" mechanics: stage boxes turn grey (to do) → purple, pulsing
   (current) → green (done) and flash when they change; connectors animate while data is in flight.
   Styles live in onboarding.css. Loaded as a classic script before the page's guide script. */

const ONB_FI = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ONB_ICON = {
  upload: ONB_FI('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>'),
  app: ONB_FI('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5"/>'),
  graph: ONB_FI('<path d="m12 2.5 8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z"/><circle cx="12" cy="2.5" r="1.4"/><circle cx="20.2" cy="7.25" r="1.4"/><circle cx="20.2" cy="16.75" r="1.4"/><circle cx="12" cy="21.5" r="1.4"/><circle cx="3.8" cy="16.75" r="1.4"/><circle cx="3.8" cy="7.25" r="1.4"/>'),
  layers: ONB_FI('<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>'),
  spec: ONB_FI('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
  swap: ONB_FI('<path d="M4 8h13l-3-3M20 16H7l3 3"/>'),
  domain: ONB_FI('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>'),
  source: ONB_FI('<path d="M5 4h5v5H5zM14 15h5v5h-5z"/><path d="M7.5 9v4a2 2 0 0 0 2 2H14"/>'),
  pick: ONB_FI('<path d="M4 6h16M4 12h10M4 18h7"/><path d="m15 17 2 2 4-4"/>'),
  diff: ONB_FI('<path d="M7 4v10M3 9h8M13 18h8"/><rect x="2" y="2" width="20" height="20" rx="3" opacity=".35"/>'),
  save: ONB_FI('<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>'),
  merge: ONB_FI('<path d="M6 3v6a6 6 0 0 0 6 6h6"/><path d="m15 12 3 3-3 3"/><circle cx="6" cy="19" r="2"/>'),
  table: ONB_FI('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>'),
  key: ONB_FI('<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8.7-8.7M16 7l2.5 2.5M14 9l2 2"/>'),
  router: ONB_FI('<circle cx="12" cy="12" r="3"/><circle cx="4" cy="5" r="2"/><circle cx="20" cy="5" r="2"/><circle cx="4" cy="19" r="2"/><circle cx="20" cy="19" r="2"/><path d="m5.5 6.5 4.3 3.7M18.5 6.5l-4.3 3.7M5.5 17.5l4.3-3.7M18.5 17.5l-4.3-3.7"/>'),
  query: ONB_FI('<path d="M4 6h16M4 12h10M4 18h7"/><circle cx="17.5" cy="16.5" r="2.5"/><path d="m19.3 18.3 2 2"/>'),
  write: ONB_FI('<path d="M4 20h4l11-11-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
  check: ONB_FI('<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.7 2.7L16 9.8"/>'),
  code: ONB_FI('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9.5 9.5 7 12l2.5 2.5M14.5 9.5 17 12l-2.5 2.5"/>'),
  devices: ONB_FI('<rect x="2" y="4" width="14" height="11" rx="1.5"/><path d="M6 19h6"/><rect x="17" y="8" width="5" height="11" rx="1"/>'),
  server: ONB_FI('<rect x="3" y="3" width="18" height="7" rx="1.5"/><rect x="3" y="14" width="18" height="7" rx="1.5"/><path d="M7 6.5h.01M7 17.5h.01"/>'),
  db: ONB_FI('<ellipse cx="12" cy="5.5" rx="7" ry="2.5"/><path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>'),
  saga: ONB_FI('<path d="M20 12a8 8 0 0 1-14.3 4.9M4 12A8 8 0 0 1 18.3 7.1"/><path d="M18.5 3v4.2h-4.2M5.5 21v-4.2h4.2"/>'),
  plug: ONB_FI('<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0z"/><path d="M12 17v4"/>'),
  rest: ONB_FI('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>'),
  resolver: ONB_FI('<path d="M5 4h5v5H5zM14 15h5v5h-5z"/><path d="M7.5 9v4a2 2 0 0 0 2 2H14"/>'),
  target: ONB_FI('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>'),
};

// One labelled row inside a stage box; its <small> is updated through onbItemSet(slot).
const onbItem = (icon, label, slot) => `<div class="ov-item" data-item="${slot}"><span class="ov-ic">${ONB_ICON[icon] || ""}</span><span class="ov-lbl">${label}<small data-slot="${slot}"></small></span></div>`;
// The hub's row of step icons (clickable).
const onbStepsHTML = (steps, icons) => `<div class="ov-steps" style="grid-template-columns:repeat(${steps.length},1fr)">${steps.map((s, i) => `<div class="ov-step" data-ostep="${i}" title="Step ${i + 1}: ${esc(s.t)}"><div class="si">${ONB_ICON[icons[i]] || ""}</div><span>${esc(s.t)}</span></div>`).join("")}</div>`;
// A connector column: paths are SVG path data in a 40×100 box; each tip sits at a % height.
const onbConn = parts => `<div class="ov-conn"><svg viewBox="0 0 40 100" preserveAspectRatio="none">${parts.map(([id, d]) => `<path data-edge="${id}" d="${d}"/>`).join("")}</svg>${[...new Map(parts.filter(p => p[2] != null).map(p => [p[0] + p[2], p])).values()].map(([id, , top]) => `<span class="ov-tip" data-edge="${id}" style="top:${top}%"></span>`).join("")}</div>`;
// Click a stage (data-go) or a step icon (data-ostep) to jump; the flash class clears itself.
function onbWire(host, go) {
  host.addEventListener("click", e => { const st = e.target.closest("[data-ostep]"); if (st) { e.stopPropagation(); return go(+st.dataset.ostep); } const n = e.target.closest("[data-go]"); if (n) go(+n.dataset.go); });
  host.addEventListener("animationend", e => { if (e.target.classList) e.target.classList.remove("flash"); });
}
// S = { node: [done, current] }. Sets is-done / is-cur / is-back and flashes a stage that just became current or done.
function onbStages(host, S, prev) {
  for (const [k, [done, cur]] of Object.entries(S)) {
    const el = host.querySelector(`[data-node="${k}"]`); if (!el) continue;
    const sig = (done ? "d" : "") + (cur ? "c" : ""), was = prev[k];
    el.classList.toggle("is-done", !!done); el.classList.toggle("is-cur", !!cur && !done); el.classList.toggle("is-back", !!cur && !!done);
    if (was != null && ((done && !was.includes("d")) || (cur && !was.includes("c")))) { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
    prev[k] = sig;
  }
}
// Connector state: green once the stage it feeds is done, animated while that stage is current or its source is done.
const onbFlow = (S, from, to, also) => { const [td, tc] = S[to] || [], [fd] = S[from] || []; return td ? "done" : (tc || fd || also) ? "flowing" : ""; };
function onbEdge(host, id, st) { host.querySelectorAll(`[data-edge="${id}"]`).forEach(p => { p.classList.toggle("done", st === "done"); p.classList.toggle("flowing", st === "flowing"); }); }
function onbSteps(host, done, step) { host.querySelectorAll("[data-ostep]").forEach(x => { const i = +x.dataset.ostep; x.classList.toggle("done", !!done[i]); x.classList.toggle("cur", i === step); }); }
// pick: true = the chosen option, false = a dimmed alternative, undefined = neutral.
function onbItemSet(host, slot, txt, ok, pick) {
  const it = host.querySelector(`[data-item="${slot}"]`); if (!it) return;
  it.classList.toggle("ok", !!ok); it.classList.toggle("pick", !!pick); it.classList.toggle("dim", pick === false);
  const s = it.querySelector("small"); if (s) s.textContent = txt || "";
}
function onbSlot(host, slot, txt) { const el = host.querySelector(`[data-slot="${slot}"]`); if (el) el.textContent = txt; }
// Remember whether a <details> overview is collapsed.
function onbRememberOpen(el, key) {
  if (!el) return;
  try { if (localStorage.getItem(key) === "0") el.open = false; } catch (_) {}
  el.addEventListener("toggle", () => { try { localStorage.setItem(key, el.open ? "1" : "0"); } catch (_) {} });
}

/* ---------- Guide layout (top band / work area) ----------
   Wires the toolbar collapse, the overview show / hide and the drag bar between the top band and the
   work area; all three are remembered per page (key). onChange runs after the layout changes size. */
function onbLayout({ root, top, split, ovBtn, chromeBtn, key, onChange }) {
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (_) {} return null; };
  const fire = () => { if (onChange) setTimeout(onChange, 60); };
  document.body.classList.add("guide-on");
  if (ovBtn && top) {
    const setOv = hide => { top.classList.toggle("ov-hidden", hide); ovBtn.textContent = hide ? "Show overview" : "Hide overview"; ls(key + "-ov", hide ? "0" : "1"); };
    setOv(ls(key + "-ov") === "0"); ovBtn.onclick = () => { setOv(!top.classList.contains("ov-hidden")); fire(); };
  }
  if (chromeBtn) {
    const setC = hide => { document.body.classList.toggle("chrome-collapsed", hide); chromeBtn.textContent = hide ? "▾ Toolbar" : "▴ Hide toolbar"; ls(key + "-chrome", hide ? "1" : "0"); };
    setC(ls(key + "-chrome") !== "0"); chromeBtn.onclick = () => { setC(!document.body.classList.contains("chrome-collapsed")); fire(); };
  }
  if (split && root && top) {
    const setTop = px => { root.classList.toggle("toph", !!px); if (px) root.style.setProperty("--obtoph", px + "px"); else root.style.removeProperty("--obtoph"); };
    setTop(+ls(key + "-toph") || 0);
    split.addEventListener("pointerdown", ev => {
      ev.preventDefault(); try { split.setPointerCapture(ev.pointerId); } catch (_) {} split.classList.add("drag");
      const t0 = top.getBoundingClientRect().top, H = root.getBoundingClientRect().height;
      const move = e => setTop(Math.round(Math.min(H - 220, Math.max(90, e.clientY - t0))));
      const up = () => { split.removeEventListener("pointermove", move); split.removeEventListener("pointerup", up); split.classList.remove("drag"); ls(key + "-toph", String(parseInt(root.style.getPropertyValue("--obtoph"), 10) || 0)); fire(); };
      split.addEventListener("pointermove", move); split.addEventListener("pointerup", up);
    });
    split.addEventListener("dblclick", () => { setTop(0); ls(key + "-toph", null); fire(); });
  }
}
// Progress percentage that "pops" when it goes up.
function onbPct(el, pct) {
  if (!el) return;
  if (el.textContent && parseInt(el.textContent, 10) < pct) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
  el.textContent = pct + "%";
}
