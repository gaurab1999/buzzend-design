/* Reusable popup dialog component.
   Include css/components/dialog.css + this file on any screen, then:

     Buzzend.confirm({ title, message, confirmLabel, cancelLabel, danger, icon,
                       onConfirm });
     Buzzend.alert({ title, message, confirmLabel, icon });
     Buzzend.sheet({ title, html });

   Mounts inside the nearest .screen-box (so it stays within the device frame),
   or full-window if none is present. */
(function () {
  function host() {
    return document.querySelector(".screen-box") || document.body;
  }

  function build({ sheet = false, danger = false, icon, title, message, html, closeBtn = true }) {
    const overlay = document.createElement("div");
    overlay.className = "bz-overlay" + (sheet ? " sheet" : "") +
      (host() === document.body ? " fixed" : "");

    const dialog = document.createElement("div");
    dialog.className = "bz-dialog";

    if (sheet) dialog.innerHTML = '<div class="bz-grip"></div>';
    if (closeBtn) {
      const x = document.createElement("button");
      x.className = "bz-close"; x.innerHTML = "✕";
      x.onclick = () => close(overlay);
      dialog.appendChild(x);
    }
    if (icon) {
      const ic = document.createElement("div");
      ic.className = "bz-icon" + (danger ? " danger" : "");
      if (window.Icons && Icons.has(icon)) ic.innerHTML = Icons.svg(icon, 28);
      else ic.textContent = icon; // fallback (e.g. a flag emoji)
      dialog.appendChild(ic);
    }
    if (title) {
      const t = document.createElement("div");
      t.className = "bz-title"; t.textContent = title; dialog.appendChild(t);
    }
    if (message) {
      const m = document.createElement("div");
      m.className = "bz-msg"; m.textContent = message; dialog.appendChild(m);
    }
    if (html) {
      const c = document.createElement("div"); c.innerHTML = html; dialog.appendChild(c);
    }

    overlay.appendChild(dialog);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(overlay); });
    host().appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("open"));
    return { overlay, dialog };
  }

  function close(overlay) {
    overlay.classList.remove("open");
    setTimeout(() => overlay.remove(), 220);
  }

  window.Buzzend = window.Buzzend || {};

  window.Buzzend.confirm = function (opts) {
    const { overlay, dialog } = build(opts);
    const actions = document.createElement("div");
    actions.className = "bz-actions";

    const cancel = document.createElement("button");
    cancel.className = "btn btn-ghost";
    cancel.textContent = opts.cancelLabel || "Cancel";
    cancel.onclick = () => { close(overlay); opts.onCancel && opts.onCancel(); };

    const ok = document.createElement("button");
    ok.className = "btn " + (opts.danger ? "btn-danger" : "btn-primary");
    ok.textContent = opts.confirmLabel || "Confirm";
    ok.onclick = () => { close(overlay); opts.onConfirm && opts.onConfirm(); };

    actions.appendChild(cancel); actions.appendChild(ok);
    dialog.appendChild(actions);
  };

  window.Buzzend.alert = function (opts) {
    const { overlay, dialog } = build(opts);
    const actions = document.createElement("div");
    actions.className = "bz-actions";
    const ok = document.createElement("button");
    ok.className = "btn btn-primary";
    ok.textContent = opts.confirmLabel || "Got it";
    ok.onclick = () => { close(overlay); opts.onConfirm && opts.onConfirm(); };
    actions.appendChild(ok);
    dialog.appendChild(actions);
  };

  window.Buzzend.sheet = function (opts) {
    build(Object.assign({ sheet: true }, opts));
  };

  // non-dismissible loading dialog → returns a handle with .close()
  window.Buzzend.loading = function (message) {
    const { overlay, dialog } = build({ closeBtn: false, message });
    const sp = document.createElement("div");
    sp.className = "bz-spinner";
    dialog.insertBefore(sp, dialog.firstChild);
    return { close: () => close(overlay) };
  };
})();
