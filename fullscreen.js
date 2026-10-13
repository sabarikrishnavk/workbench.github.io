/* fullscreen.js — full-screen mode for the visualizers on every page (no dependencies).
   Mark a container with data-fullscreen="<label>" (static markup, or set when a diagram is drawn). It gets a ⛶ button: inside the container's
   [data-fs-slot] element when it has one (e.g. a drawer's header bar), otherwise pinned top-right.
   The button makes the container fill the window (class .fs-on, styles in styles.css) and asks the
   browser for full screen; ⛶ again, Esc or leaving browser full screen restores it. After every
   change the container's own "Fit to view" button is clicked so the drawing refits, and an
   "fs-change" event ({ detail: { on } }) is fired on the container for pages that need more. */
(function () {
  let cur = null;
  const fitIn = el => { const b = el.querySelector('button[title^="Fit to view"]'); if (b && b.offsetParent) b.click(); };
  function refit(el, on) {
    window.dispatchEvent(new Event("resize"));
    el.dispatchEvent(new CustomEvent("fs-change", { detail: { on } }));
    setTimeout(() => { window.dispatchEvent(new Event("resize")); fitIn(el); }, 80);
  }
  function setBtn(el, on) {
    const b = el._fsBtn; if (!b) return;
    b.textContent = on ? "✕" : "⛶"; b.classList.toggle("on", on);
    b.title = on ? "Exit full screen (Esc)" : `Full screen: ${el.getAttribute("data-fullscreen") || "visualizer"}`;
  }
  function exit() {
    if (!cur) return; const el = cur; cur = null;
    el.classList.remove("fs-on"); document.body.classList.remove("fs-active"); setBtn(el, false);
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    refit(el, false);
  }
  function enter(el) {
    if (cur) exit(); cur = el;
    el.classList.add("fs-on"); document.body.classList.add("fs-active"); setBtn(el, true);
    // the whole page goes full screen, so dialogs opened from the visualizer still show on top of it
    const de = document.documentElement; if (!document.fullscreenElement && de.requestFullscreen) de.requestFullscreen().catch(() => {});
    refit(el, true);
  }
  // (Re)adds the button: diagrams that redraw by replacing their innerHTML drop it, so it is put back.
  function decorate(root) {
    (root || document).querySelectorAll("[data-fullscreen]").forEach(el => {
      if (el._fsBtn && el.contains(el._fsBtn)) return;
      const b = el._fsBtn = document.createElement("button"); b.type = "button"; b.className = "fs-btn";
      const slot = el.querySelector("[data-fs-slot]");
      if (slot) slot.appendChild(b); else { b.classList.add("fs-pin"); el.appendChild(b); }
      b.addEventListener("click", e => { e.stopPropagation(); cur === el ? exit() : enter(el); });
      setBtn(el, cur === el);
    });
  }
  document.addEventListener("keydown", e => { if (e.key === "Escape" && cur && !document.querySelector(".modal:not([hidden])")) exit(); });
  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && cur) exit(); });
  window.fsExit = exit;
  const start = () => { decorate(document); new MutationObserver(() => decorate(document)).observe(document.body, { childList: true, subtree: true }); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
