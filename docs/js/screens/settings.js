/* Settings — faithful port of the old Flutter SettingsScreen + UX improvements.
   Fitness goals (steps chip-grid · height cm↔ft/in · weight kg↔lb, all with
   steppers + validation) · Preferences (appearance/units/notifs) · Account
   (provider identity · blocked · privacy) · Support · Log out / Delete account. */
window.Settings = (function () {
  const I = (n, s) => window.Icons.svg(n, s);
  const ME = window.Social ? window.Social.ME : { name: "Ema William", av: "#6a8caf,#33566f", handle: "@ema", initials: "EW" };
  const grad = (av) => `linear-gradient(135deg,${av})`;
  const el = (sel) => _dlg && _dlg.querySelector(sel);

  const STEP_GOALS = [
    { steps: 3000, label: "Light" }, { steps: 5000, label: "Moderate" }, { steps: 7000, label: "Active" },
    { steps: 10000, label: "Classic" }, { steps: 15000, label: "Fit" }, { steps: 20000, label: "Athletic" },
  ];
  const BOUNDS = { cm: [50, 300], ft: [2, 10], in: [0, 11], kg: [35, 300], lb: [77, 661] };

  let S = { units: "metric", notifs: true, reminders: true, sound: true, stepGoal: 10000,
    height: { value: "5.67", unit: "ft" }, weight: { value: "72", unit: "kg" }, identity: "google" };
  let _dlg = null, _stepSel = 0, _h = {}, _w = {};

  const commas = (n) => ("" + n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  function themeVal() { const t = document.documentElement.getAttribute("data-theme"); return t === "dark" ? "Dark" : (localStorage.getItem("buzzend-theme") ? "Light" : "System"); }
  function fmtHeight(h) { if (!h || !h.value) return "Not set"; if (h.unit === "cm") return `${h.value} cm`; const raw = parseFloat(h.value); const ft = Math.floor(raw), inch = Math.round((raw - ft) * 12); return `${ft}ft ${inch}in`; }
  function fmtWeight(w) { return w && w.value ? `${w.value} ${w.unit}` : "Not set"; }

  const googleLogo = () => '<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 12 1 11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>';
  const appleLogo = () => '<svg width="19" height="19" viewBox="0 0 24 24" fill="#fff"><path d="M17.53 12.7c-.02-2.4 1.96-3.55 2.05-3.61-1.12-1.64-2.86-1.86-3.48-1.89-1.48-.15-2.89.87-3.64.87-.75 0-1.91-.85-3.14-.83-1.61.02-3.1.94-3.93 2.38-1.68 2.91-.43 7.22 1.2 9.58.8 1.15 1.75 2.44 3 2.39 1.2-.05 1.66-.78 3.11-.78 1.45 0 1.86.78 3.14.75 1.3-.02 2.12-1.17 2.91-2.33.92-1.34 1.3-2.64 1.32-2.71-.03-.01-2.53-.97-2.55-3.85zM15.11 5.6c.66-.8 1.11-1.92.99-3.03-.95.04-2.11.64-2.8 1.44-.61.7-1.15 1.84-1.01 2.92 1.07.08 2.15-.54 2.82-1.33z"/></svg>';

  // ── hero ──
  function hero() {
    return `<div class="st-hero"><div class="st-hero-top"><button class="st-back" onclick="Settings.back()">${I("back", 22)}</button><div class="st-hero-title">Settings</div></div>
      <div class="st-id"><div class="st-av" style="background-image:${grad(ME.av)}">${ME.initials || ""}</div>
        <div style="flex:1;min-width:0"><div class="nm">${ME.name}</div><div class="hd">${ME.handle || "@ema"}</div></div>
        <button class="st-edit" onclick="Settings.editProfile()">${I("edit", 14)} Edit</button></div></div>`;
  }

  // ── row builders ──
  function row(o) {
    const lead = o.leading || `<div class="st-ic" style="color:${o.tint};background:color-mix(in srgb,${o.tint} 13%,transparent)">${I(o.icon, 18)}</div>`;
    const tx = `<div class="st-tx ${o.danger ? "danger" : ""}"><div class="l">${o.label}</div>${o.sub ? `<div class="s">${o.sub}</div>` : ""}</div>`;
    let right = "";
    if (o.toggle) right = `<div class="st-sw ${S[o.toggle] ? "on" : ""}"><i></i></div>`;
    else { if (o.badge != null) right += `<span class="st-badge">${o.badge}</span>`; else if (o.value != null) right += `<span class="st-val">${o.value}</span>`; if (o.chev !== false) right += `<span class="st-chev">${I("chevron", 18)}</span>`; }
    const click = o.toggle ? `Settings.toggle('${o.toggle}',this)` : (o.on || "");
    return `<div class="st-row" onclick="${click}">${lead}${tx}${right}</div>`;
  }
  const section = (label, rows) => `<div class="st-sec">${label ? `<div class="lbl">${label}</div>` : ""}<div class="st-card">${rows.join('<div class="st-div"></div>')}</div></div>`;

  function identityRow() {
    if (S.identity === "phone") return row({ icon: "phone", tint: "#f59e0b", label: "Phone number", value: "+1 555 018 2299", on: "Settings.verifyPhone()" });
    if (S.identity === "apple") return row({ leading: `<div class="st-ic" style="background:#1a1a1a">${appleLogo()}</div>`, label: "Apple account", sub: "Hidden by Apple", chev: false, on: "" });
    if (S.identity === "email") return row({ leading: `<div class="st-ic" style="color:#f59e0b;background:color-mix(in srgb,#f59e0b 13%,transparent);font:900 16px var(--font)">@</div>`, label: "Email", sub: "ema.william@buzzend.app", chev: false, on: "" });
    return row({ leading: `<div class="st-ic brand">${googleLogo()}</div>`, label: "Google account", sub: "ema.william@gmail.com", chev: false, on: "" });
  }

  function body() {
    return `<div class="st-body">
      ${section("Fitness goals", [
        row({ icon: "walk", tint: "var(--primary)", label: "Daily steps goal", badge: commas(S.stepGoal), on: "Settings.openSteps()" }),
        row({ icon: "ruler", tint: "#f59e0b", label: "Height", value: fmtHeight(S.height), on: "Settings.openHeight()" }),
        row({ icon: "dumbbell", tint: "#f59e0b", label: "Weight", value: fmtWeight(S.weight), on: "Settings.openWeight()" }),
      ])}
      ${section("Preferences", [
        row({ icon: "moon", tint: "#8b5cf6", label: "Appearance", value: themeVal(), on: "Settings.openAppearance()" }),
        row({ icon: "sliders", tint: "#3b82f6", label: "Units", value: S.units === "metric" ? "Metric" : "Imperial", on: "Settings.cycleUnits()" }),
        row({ icon: "bell", tint: "var(--primary)", label: "Push notifications", toggle: "notifs" }),
        row({ icon: "clock", tint: "#3b82f6", label: "Workout reminders", sub: "Daily nudge to hit your goal", toggle: "reminders" }),
        row({ icon: "volume", tint: "#8b5cf6", label: "Sound & haptics", toggle: "sound" }),
      ])}
      ${section("Account", [
        identityRow(),
        row({ icon: "block", tint: "#e5524a", label: "Blocked users", on: "Settings.blocked()" }),
        row({ icon: "lock", tint: "#3b82f6", label: "Privacy", on: "Settings.privacy()" }),
      ])}
      ${section("Support", [
        row({ icon: "comment", tint: "var(--primary)", label: "Help & Support", on: "Settings.help()" }),
        row({ icon: "info", tint: "#8b5cf6", label: "Know your app", on: "Settings.tour()" }),
        row({ icon: "star", tint: "#f59e0b", label: "Rate Buzzend", on: "Settings.rate()" }),
        row({ icon: "share", tint: "#3b82f6", label: "Share Buzzend", on: "Settings.shareApp()" }),
        row({ icon: "shield", tint: "var(--primary)", label: "About", value: "v2.4.1", on: "Settings.about()" }),
      ])}
      ${section("", [
        row({ icon: "logout", tint: "#e5524a", label: "Log out", danger: true, chev: false, on: "Settings.confirmLogout()" }),
        row({ icon: "trash", tint: "#e5524a", label: "Delete account", danger: true, chev: false, on: "Settings.confirmDelete()" }),
      ])}
      <div class="st-foot">Buzzend · v2.4.1 (build 240)</div></div>`;
  }
  function renderBody() { const c = document.getElementById("content"); c.innerHTML = body(); window.Icons.init(c); }

  // ── toggles / simple actions ──
  function toggle(key, rowEl) { S[key] = !S[key]; rowEl.querySelector(".st-sw").classList.toggle("on", S[key]); }
  function cycleUnits() { S.units = S.units === "metric" ? "imperial" : "metric"; renderBody(); }
  function back() { location.href = "profile.html"; }
  function editProfile() { location.href = "profile.html"; }
  const info = (icon, title, message) => Buzzend.alert({ icon, title, message });
  function verifyPhone() { info("phone", "Verify to continue", "Verify your credentials to update your phone number."); }
  function blocked() { location.href = "blocked-users.html"; }
  function privacy() { window.open("https://buzzend.com/#/privacy", "_blank"); }   // real hosted Privacy Policy (same as sign-up)
  function help() { location.href = "support.html"; }
  function tour() { location.href = "../onboarding/index.html"; }
  function about() { location.href = "about.html"; }
  function rate() { openRate(); }
  function shareApp() { openShare(); }

  // rate sheet — 4★+ → store, lower → feedback
  let _rating = 0;
  const rtStars = () => { let h = ""; for (let i = 1; i <= 5; i++) h += `<button class="rt-star ${i <= _rating ? "on" : ""}" onclick="Settings.rateStar(${i})">${I("star", 34)}</button>`; return h; };
  function openRate() {
    _rating = 0;
    mount(`<div class="st-sheet-card"><div class="st-grab"></div><div class="st-sheet-t">Enjoying Buzzend?</div>
      <div style="font:600 13px var(--font);color:var(--text-secondary);padding:0 12px 2px">Tap a star — we'll take it from there.</div>
      <div class="rt-stars" id="rt-stars">${rtStars()}</div><div class="rt-cap" id="rt-cap">&nbsp;</div><div style="height:6px"></div></div>`, true);
  }
  function rateStar(n) {
    _rating = n; el("#rt-stars").innerHTML = rtStars();
    el("#rt-cap").textContent = n >= 4 ? "Thank you! Opening the App Store…" : "Thanks — we'd love your feedback.";
    setTimeout(() => { closeDlg(); if (n >= 4) window.open("https://play.google.com/store/apps/details?id=com.inventechgroup.buzzend", "_blank"); else info("comment", "Share your feedback", "Tell us what we can improve — opening support."); }, 850);
  }

  // share sheet
  function openShare() {
    const targets = [["copy", "Copy link", "#5b8def", "Settings.copyLink()"], ["comment", "Messages", "#34c759", "Settings.doShare('Messages')"], ["users", "Invite", "var(--primary)", "Settings.doShare('Invite')"], ["share", "More", "#8b8f98", "Settings.doShare('More')"]];
    mount(`<div class="st-sheet-card"><div class="st-grab"></div><div class="st-sheet-t">Share Buzzend</div>
      <div class="sh-link"><span class="u">buzzend.com/#/dl</span><span class="cp" onclick="Settings.copyLink()">Copy</span></div>
      <div class="sh-grid">${targets.map(([ic, n, c, on]) => `<button class="sh-t" onclick="${on}"><span class="c" style="background:${c}">${I(ic, 22)}</span><span class="n">${n}</span></button>`).join("")}</div></div>`, true);
  }
  function copyLink() { closeDlg(); info("copy", "Link copied", "buzzend.com/#/dl copied to your clipboard."); }
  function doShare(t) { closeDlg(); info("share", "Shared via " + t, "Your Buzzend invite is on its way."); }

  // ── overlay helpers ──
  function mount(html, sheet) { const s = document.querySelector(".screen"); const o = document.createElement("div"); o.className = "st-ov" + (sheet ? " sheet" : ""); o.innerHTML = html; o.addEventListener("click", (e) => { if (e.target === o) closeDlg(); }); s.appendChild(o); window.Icons.init(o); _dlg = o; return o; }
  function closeDlg() { if (_dlg) { _dlg.remove(); _dlg = null; } }

  // ── steps dialog ──
  function openSteps() {
    _stepSel = Math.max(0, STEP_GOALS.findIndex((g) => g.steps === S.stepGoal));
    mount(`<div class="st-dlg"><div class="st-eyebrow">Fitness goal</div>
      <div class="st-dlg-hd" style="margin-top:4px"><span class="t">Daily steps target</span></div>
      <div class="cur">Current goal: <b id="st-cur">${commas(STEP_GOALS[_stepSel].steps)} steps</b></div>
      <div class="st-chips" id="st-chips">${chipsHtml()}</div>
      <div class="st-dlg-actions"><button class="st-b-cancel" onclick="Settings.closeDlg()">Cancel</button><button class="st-b-confirm" onclick="Settings.saveSteps()">Confirm</button></div></div>`);
  }
  const chipsHtml = () => STEP_GOALS.map((g, i) => `<div class="st-chip ${i === _stepSel ? "on" : ""}" onclick="Settings.pickStep(${i})"><div class="v">${commas(g.steps)}</div><div class="k">${g.label}</div></div>`).join("");
  function pickStep(i) { _stepSel = i; el("#st-chips").innerHTML = chipsHtml(); el("#st-cur").textContent = commas(STEP_GOALS[i].steps) + " steps"; }
  function saveSteps() { S.stepGoal = STEP_GOALS[_stepSel].steps; closeDlg(); renderBody(); info("success", "Steps goal updated", "Daily steps goal set to " + commas(S.stepGoal) + " steps."); }

  // ── height dialog ──
  function openHeight() {
    if (S.height.unit === "cm") _h = { unit: "cm", cm: S.height.value, ft: "5", in: "8" };
    else { const raw = parseFloat(S.height.value) || 5.67; _h = { unit: "ft", cm: "173", ft: "" + Math.floor(raw), in: "" + Math.round((raw - Math.floor(raw)) * 12) }; }
    mount(measureShell("Height", heightBody()));
  }
  function heightBody() {
    const err = `<div class="st-merr" id="st-err"></div>`;
    const tog = unitToggle("cm", "ft/in", _h.unit === "cm", "Settings.hUnit('cm')", "Settings.hUnit('ft')");
    let inputs;
    if (_h.unit === "cm") inputs = `<div class="st-mrow">${mInput("h-cm", _h.cm, "170", "Settings.hStep('cm',1)", "Settings.hStep('cm',-1)")}${tog}</div>`;
    else inputs = `<div class="st-mrow">${mInput("h-ft", _h.ft, "5", "Settings.hStep('ft',1)", "Settings.hStep('ft',-1)", "'")}${mInput("h-in", _h.in, "0", "Settings.hStep('in',1)", "Settings.hStep('in',-1)", '"')}${tog}</div>`;
    return `${inputs}${err}<div class="st-mhint">${_h.unit === "cm" ? "50–300 cm" : "2–10 ft, 0–11 in"}</div><button class="st-mconfirm" onclick="Settings.saveHeight()">Confirm</button>`;
  }
  function readHeight() { if (_h.unit === "cm") _h.cm = el("#h-cm").value; else { _h.ft = el("#h-ft").value; _h.in = el("#h-in").value; } }
  function hUnit(u) { readHeight(); _h.unit = u; el("#st-mbody").innerHTML = heightBody(); window.Icons.init(_dlg); }
  function hStep(f, d) { readHeight(); const b = BOUNDS[f]; _h[f] = "" + clamp(Math.round((parseFloat(_h[f]) || (f === "cm" ? 170 : f === "ft" ? 5 : 0)) + d), b[0], b[1]); el("#st-mbody").innerHTML = heightBody(); window.Icons.init(_dlg); }
  function saveHeight() {
    readHeight(); const errEl = el("#st-err");
    if (_h.unit === "cm") { const v = parseFloat(_h.cm); if (!(v >= 50 && v <= 300)) { errEl.textContent = "Set between 50 and 300 cm"; return; } S.height = { value: _h.cm, unit: "cm" }; }
    else { const ft = parseInt(_h.ft) || 0, inch = parseInt(_h.in) || 0; if (ft < 2 || ft > 10) { errEl.textContent = "Feet must be between 2 and 10"; return; } if (inch > 11) { errEl.textContent = "Inches must be between 0 and 11"; return; } S.height = { value: (ft + inch / 12).toFixed(2), unit: "ft" }; }
    closeDlg(); renderBody();
  }

  // ── weight dialog ──
  function openWeight() {
    _w = { unit: S.weight.unit === "lb" ? "lb" : "kg", val: S.weight.value || "70" };
    mount(measureShell("Weight", weightBody()));
  }
  function weightBody() {
    const tog = unitToggle("kg", "lb", _w.unit === "kg", "Settings.wUnit('kg')", "Settings.wUnit('lb')");
    return `<div class="st-mrow">${mInput("w-val", _w.val, _w.unit === "kg" ? "70" : "154", "Settings.wStep(1)", "Settings.wStep(-1)")}${tog}</div>
      <div class="st-merr" id="st-err"></div><div class="st-mhint">${_w.unit === "kg" ? "35–300 kg" : "77–661 lb"}</div><button class="st-mconfirm" onclick="Settings.saveWeight()">Confirm</button>`;
  }
  function readWeight() { _w.val = el("#w-val").value; }
  function wUnit(u) { readWeight(); _w.unit = u; el("#st-mbody").innerHTML = weightBody(); window.Icons.init(_dlg); }
  function wStep(d) { readWeight(); const b = BOUNDS[_w.unit]; _w.val = "" + clamp(Math.round((parseFloat(_w.val) || b[0]) + d), b[0], b[1]); el("#st-mbody").innerHTML = weightBody(); window.Icons.init(_dlg); }
  function saveWeight() { readWeight(); const b = BOUNDS[_w.unit], v = parseFloat(_w.val); if (!(v >= b[0] && v <= b[1])) { el("#st-err").textContent = `Set between ${b[0]} and ${b[1]} ${_w.unit}`; return; } S.weight = { value: _w.val, unit: _w.unit }; closeDlg(); renderBody(); }

  // measurement shared bits
  const measureShell = (title, inner) => `<div class="st-dlg"><div class="st-dlg-hd"><span class="t">${title}</span><button class="st-dlg-x" onclick="Settings.closeDlg()">${I("x", 22)}</button></div><div id="st-mbody" style="margin-top:4px">${inner}</div></div>`;
  const mInput = (id, val, hint, up, down, suf) => `<div class="st-mi"><input id="${id}" value="${val}" placeholder="${hint}" inputmode="decimal" autocomplete="off">${suf ? `<span class="suf">${suf}</span>` : ""}<div class="arrows"><button onclick="${up}">${I("chevron-up", 16) || "▲"}</button><button onclick="${down}">${I("chevron-down", 16)}</button></div></div>`;
  const unitToggle = (l, r, leftOn, onL, onR) => `<div class="st-utog"><button class="${leftOn ? "on" : ""}" onclick="${onL}">${l}</button><button class="${!leftOn ? "on" : ""}" onclick="${onR}">${r}</button></div>`;

  // ── appearance sheet ──
  function openAppearance() {
    const cur = themeVal();
    const opt = (label, icon, val) => `<button class="st-opt ${cur === label ? "on" : ""}" onclick="Settings.setTheme('${val}')"><span class="oic">${I(icon, 18)}</span><span class="ol">${label}</span><span class="ock">${I("check", 20)}</span></button>`;
    mount(`<div class="st-sheet-card"><div class="st-grab"></div><div class="st-sheet-t">Appearance</div>
      ${opt("Light", "eye", "light")}${opt("Dark", "moon", "dark")}${opt("System", "sliders", "system")}
      <div style="height:6px"></div></div>`, true);
  }
  function setTheme(mode) {
    if (mode === "dark") { document.documentElement.setAttribute("data-theme", "dark"); localStorage.setItem("buzzend-theme", "dark"); }
    else if (mode === "light") { document.documentElement.setAttribute("data-theme", "light"); localStorage.setItem("buzzend-theme", "light"); }
    else { localStorage.removeItem("buzzend-theme"); document.documentElement.setAttribute("data-theme", "light"); }
    closeDlg(); renderBody();
  }

  // ── confirm dialogs ──
  function confirmDlg(icon, tint, title, desc, action, actionLabel) {
    mount(`<div class="st-dlg cf"><div class="st-cf-ic" style="color:${tint};background:color-mix(in srgb,${tint} 13%,transparent)">${I(icon, 28)}</div>
      <div class="t">${title}</div><div class="d">${desc}</div>
      <div class="st-dlg-actions"><button class="st-b-cancel" onclick="Settings.closeDlg()">Cancel</button><button class="st-b-danger" onclick="${action}">${actionLabel}</button></div></div>`);
  }
  function confirmLogout() { confirmDlg("logout", "#e5524a", "Log out?", "You'll need to sign in again to track your workouts.", "Settings.doLogout()", "Log out"); }
  function doLogout() { closeDlg(); location.href = "../auth/index.html"; }
  function confirmDelete() { confirmDlg("trash", "#e5524a", "Delete account?", "This permanently removes your profile, stats and challenges. This can't be undone.", "Settings.doDelete()", "Delete"); }
  function doDelete() { closeDlg(); info("trash", "Account scheduled for deletion", "Your account and data will be removed. You can cancel within 30 days by signing in."); }

  function init(identity) { if (identity) S.identity = identity; return body(); }
  return { hero, init, body, renderBody, toggle, cycleUnits, back, editProfile, verifyPhone, blocked, privacy, help, tour, rate, shareApp, about,
    openSteps, pickStep, saveSteps, openHeight, hUnit, hStep, saveHeight, openWeight, wUnit, wStep, saveWeight,
    openAppearance, setTheme, confirmLogout, doLogout, confirmDelete, doDelete, closeDlg,
    openRate, rateStar, openShare, copyLink, doShare };
})();
