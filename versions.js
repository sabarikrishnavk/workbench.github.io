/* versions.js — the "Version" dropdown on every workbench page (installed by the version-html Claude skill).
   Reads versions/manifest.js (window.HTML_VERSIONS) and lists the page's current version and its archived
   copies (versions/<page>.v<N>.html). Works on the live page and inside archived pages (whose
   <base href="../"> makes every path below resolve from the site root), over http(s) and file://. */
(function () {
  if (window.top !== window) return;                       // not inside embedded frames (e.g. index.html's demo)
  const base = document.baseURI;
  const file = decodeURIComponent(location.pathname.split("/").pop() || "index.html");
  const m = file.match(/^(.+)\.v(\d+)\.html$/), archived = !!m && /\/versions\/[^/]*$/.test(location.pathname);
  const page = archived ? m[1] + ".html" : file, viewing = archived ? +m[2] : null;

  function css() {
    if (document.getElementById("hvCss")) return;
    const s = document.createElement("style"); s.id = "hvCss";
    s.textContent = `.hv-wrap{ display:inline-flex; align-items:center; gap:5px; font-size:12px; color:#6b7280; white-space:nowrap; }
.hv-wrap select{ font:inherit; font-size:12px; padding:3px 6px; border:1px solid #e4e7eb; border-radius:6px; background:#fff; color:#1f2933; max-width:260px; cursor:pointer; }
.hv-wrap.hv-archived select{ border-color:#f59e0b; background:#fffbeb; color:#92400e; font-weight:600; }
.hv-float{ position:fixed; left:12px; bottom:12px; z-index:50; background:#fff; border:1px solid #e4e7eb; border-radius:8px; padding:4px 8px; box-shadow:0 2px 10px rgba(0,0,0,.08); }
.hv-banner{ background:#fffbeb; border-bottom:1px solid #fcd34d; color:#92400e; font-size:12.5px; padding:5px 16px; display:flex; gap:10px; align-items:center; }
.hv-banner a{ color:#7048e8; font-weight:600; }`;
    document.head.appendChild(s);
  }
  function render() {
    const e = (window.HTML_VERSIONS || {})[page]; if (!e) return;
    css();
    const cur = e.current || 1, list = (e.versions || []).slice().sort((a, b) => b.v - a.v);
    const sel = document.createElement("select");
    sel.title = "Open another version of this page";
    const opt = (value, label, on) => { const o = document.createElement("option"); o.value = value; o.textContent = label; o.selected = on; sel.appendChild(o); };
    opt(page, `v${cur} · current`, !archived);
    for (const v of list) opt(v.file, `v${v.v} · ${v.date}${v.note ? " · " + v.note : ""}`, archived && v.v === viewing);
    sel.onchange = () => { location.href = new URL(sel.value, base).href; };
    const wrap = document.createElement("span");
    wrap.className = "hv-wrap" + (archived ? " hv-archived" : "");
    wrap.innerHTML = "<span>Version</span>"; wrap.appendChild(sel);
    // placement: an explicit slot, next to the page's toolbar toggle (visible while the toolbar is collapsed),
    // the end of the header, or a floating badge
    const slot = document.querySelector("[data-version-slot]"), toggle = document.getElementById("chromeToggle"), header = document.querySelector("body > header");
    if (slot) slot.appendChild(wrap);
    else if (toggle) toggle.parentNode.insertBefore(wrap, toggle);
    else if (header) header.appendChild(wrap);
    else { wrap.classList.add("hv-float"); document.body.appendChild(wrap); }
    if (archived) {
      const b = document.createElement("div"); b.className = "hv-banner";
      const v = list.find(x => x.v === viewing);
      b.innerHTML = `<b>Archived v${viewing}</b> of ${page}${v && v.date ? " · " + v.date : ""}${v && v.note ? " · " + v.note.replace(/</g, "&lt;") : ""} — read-only snapshot. <a href="${new URL(page, base).href}">Open the current version (v${cur}) →</a>`;
      document.body.insertBefore(b, document.body.firstChild);
    }
  }
  if (window.HTML_VERSIONS) render();
  else {
    const s = document.createElement("script");
    s.src = new URL("versions/manifest.js", base).href;
    s.onload = render; s.onerror = () => {};                // no manifest yet: no dropdown
    document.head.appendChild(s);
  }
})();
