/* Upload banner — Facebook-style background "Posting…" bar. When the user posts,
   the compose screen navigates away immediately and the upload runs in the
   "background": its state lives in localStorage, so the bar appears (and keeps
   progressing from the real elapsed time) on ANY tab the user switches to, then
   flips to "Posted" and dismisses itself. Non-blocking — doesn't affect the page.
   Include on every tab screen; it auto-mounts. Needs icons.js (optional). */
window.UploadBanner = (function () {
  const KEY = "bz-upload";
  const get = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } };
  const set = (u) => localStorage.setItem(KEY, JSON.stringify(u));
  const clear = () => localStorage.removeItem(KEY);

  // called from the composer when the user taps Post
  function start(opts) {
    opts = opts || {};
    set({ start: Date.now(), dur: opts.dur || 6000, cover: opts.cover || "linear-gradient(135deg,#1f6e5f,#2a9d8f)", label: opts.label || "post", isVideo: !!opts.isVideo });
  }

  function ensureEl() {
    let el = document.querySelector(".ub-banner");
    if (!el) {
      el = document.createElement("div"); el.className = "ub-banner";
      el.innerHTML = `<div class="ub-cover"></div><div class="ub-body"><div class="ub-label"></div><div class="ub-bar"><i></i></div><div class="ub-sub"></div></div><div class="ub-pct"></div>`;
      const screen = document.querySelector(".screen"), sb = screen && screen.querySelector(".statusbar");
      if (sb && sb.parentNode) sb.parentNode.insertBefore(el, sb.nextSibling);   // just below the status bar, in normal flow
      else (document.querySelector(".screen-box") || document.body).appendChild(el);
    }
    return el;
  }
  function paint(el, u, pct, done) {
    const cover = el.querySelector(".ub-cover"), label = el.querySelector(".ub-label"),
      bar = el.querySelector(".ub-bar > i"), pctEl = el.querySelector(".ub-pct"), sub = el.querySelector(".ub-sub");
    el.classList.toggle("is-done", done);
    if (done) {
      cover.style.background = "var(--primary)"; cover.innerHTML = window.Icons ? Icons.svg("check", 18) : "✓";
      label.textContent = "Posted"; sub.textContent = "Your " + u.label + " is live."; pctEl.textContent = "";
    } else {
      cover.style.background = u.cover;
      if (window.Icons && !cover.dataset.ic) { cover.innerHTML = Icons.svg(u.isVideo ? "play" : "image", 15); cover.dataset.ic = "1"; }
      label.textContent = "Posting…"; bar.style.width = pct + "%"; pctEl.textContent = pct + "%"; sub.textContent = "";
    }
  }
  function dismiss(el) { if (!el) return; el.classList.add("ub-hide"); setTimeout(() => el.remove(), 350); }

  function tick() {
    const u = get();
    if (!u) { dismiss(document.querySelector(".ub-banner")); return; }
    const elapsed = Date.now() - u.start;
    if (elapsed >= u.dur) {
      if (elapsed > u.dur + 4000) { clear(); dismiss(document.querySelector(".ub-banner")); return; }  // stale (user was away) → finish silently
      const el = ensureEl();
      if (!u.doneAt) { u.doneAt = Date.now(); set(u); }
      paint(el, u, 100, true);
      if (Date.now() - u.doneAt > 2200) { clear(); dismiss(el); return; }
      setTimeout(tick, 300); return;
    }
    paint(ensureEl(), u, Math.max(4, Math.min(99, Math.round((elapsed / u.dur) * 100))), false);
    requestAnimationFrame(tick);
  }
  function mount() { if (get()) tick(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
  return { start, mount };
})();
