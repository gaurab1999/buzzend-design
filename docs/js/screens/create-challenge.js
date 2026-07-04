/* Create Challenge — faithful 3-step wizard (Flutter create_challenge.dart).
   Step 1 what/exercise/name/desc · Step 2 schedule/visibility/dates/winner/prizes
   · Step 3 review + launch. Full validation, templates, discard-confirm. */
window.CC = (function () {
  const I = (n, s) => window.Icons.svg(n, s);

  const EX = [
    { key: "squat", n: "Squats", i: "squat" }, { key: "pushup", n: "Push-ups", i: "pushup" },
    { key: "situp", n: "Sit-ups", i: "situp" }, { key: "lunge", n: "Lunges", i: "lunge" },
    { key: "jumping", n: "Jumping Jacks", i: "jumping" }, { key: "steps", n: "Walking", i: "walk" },
  ];
  const exMeta = (k) => EX.find((e) => e.key === k) || EX[0];
  // quick-start templates (Flutter ChallengeTemplates)
  const QUICK = [
    { id: "squat_30day", ic: "squat", label: "30-day squat", ex: "squat", name: "30-Day Squat Challenge", desc: "Do squats every day for 30 days. Camera verification required.", dur: 30, winner: "NORMAL_WINNER" },
    { id: "pushup_30day", ic: "pushup", label: "Push-up challenge", ex: "pushup", name: "30-Day Push-up Challenge", desc: "Build upper body strength with daily push-ups.", dur: 30, winner: "NORMAL_WINNER" },
    { id: "walk_10k", ic: "walk", label: "10k steps daily", ex: "steps", name: "10,000 Steps Daily Challenge", desc: "Walk 10,000 steps every day for 30 days.", dur: 30, winner: "NORMAL_WINNER" },
    { id: "custom", ic: "flame", label: "Custom", ex: null, name: "", desc: "", dur: 30, winner: "NO_WINNER" },
  ];
  const FREQ = [{ v: "DAILY", n: "Daily" }, { v: "WEEKLY", n: "Weekly" }, { v: "ONE_TIME", n: "One-time" }];
  const DURS = [7, 14, 30, 60];
  const WIN = [
    { v: "NO_WINNER", ic: "block", t: "None", s: "Casual · No pressure" },
    { v: "NORMAL_WINNER", ic: "trophy", t: "Top Score", s: "Competitive · Rewards" },
    { v: "RANDOM_WINNER", ic: "zap", t: "Random", s: "Fair · Exciting" },
  ];
  const freqLabel = (v) => (FREQ.find((f) => f.v === v) || FREQ[0]).n;
  const winLabel = (v) => (WIN.find((w) => w.v === v) || WIN[0]).t;
  const BAD = ["damn", "hell", "shit", "fuck", "crap", "idiot", "stupid"];

  // date helpers
  const pad = (n) => ("" + n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const today = iso(new Date());
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmtDate = (s) => { const p = s.split("-"); return `${MON[+p[1] - 1]} ${+p[2]}, ${p[0]}`; };
  const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
  const esc = (s) => ("" + s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  let S = { step: 0, template: null, exercise: null, name: "", desc: "", frequency: "DAILY", isPublic: true,
    start: today, dur: 30, durCustom: false, winner: "NO_WINNER", prizes: [], err: {} };
  const endISO = () => iso(addDays(new Date(S.start), S.dur));
  const isToday = (s) => s === today;
  const isTomorrow = (s) => s === iso(addDays(new Date(), 1));

  const hasData = () => !!(S.name.trim() || S.desc.trim() || S.exercise || S.template || S.prizes.some((p) => p.trim()));

  // ── render ──
  function render() {
    document.getElementById("app").innerHTML = header() + body() + footer();
    window.Icons.init(document.getElementById("app"));
  }
  function header() {
    return `<div class="cc-head"><div class="cc-htop"><button class="cc-back" onclick="CC.tryExit()">${I("back", 22)}</button>
      <div class="t">Create Challenge</div><div class="cc-step">Step ${S.step + 1} of 3</div></div>
      <div class="cc-prog"><i style="width:${((S.step + 1) / 3) * 100}%"></i></div></div>`;
  }
  function body() { return S.step === 0 ? step1() : S.step === 1 ? step2() : step3(); }

  function step1() {
    const chip = (q) => `<button class="cc-chip ${S.template === q.id ? "on" : ""}" onclick="CC.applyTemplate('${q.id}')">${I(q.ic, 15)} ${q.label}</button>`;
    const exc = (e) => `<button class="cc-ex-c ${S.exercise === e.key ? "on" : ""}" onclick="CC.pickEx('${e.key}')"><span class="ic">${I(e.i, 26)}</span><span class="n">${e.n}</span></button>`;
    return `<div class="cc-body">
      <div class="cc-h1">What's the challenge?</div><div class="cc-sub">Pick an exercise and give it a name</div>
      <div class="cc-lbl">Quick start</div><div class="cc-chips">${QUICK.map(chip).join("")}</div>
      <div class="cc-lbl">Exercise type</div><div class="cc-ex">${EX.map(exc).join("")}</div>
      ${S.err.exercise ? `<div class="cc-err" style="margin-top:9px">${S.err.exercise}</div>` : ""}
      <div class="cc-lbl">Challenge name</div>
      <input class="cc-input ${S.err.name ? "err" : ""}" maxlength="60" value="${esc(S.name)}" placeholder="e.g. 30-Day Squat Challenge" oninput="CC.setName(this.value)">
      <div class="cc-meta"><span class="cc-err">${S.err.name || ""}</span><span class="cc-count">${S.name.length}/60</span></div>
      <div class="cc-lbl">Description</div>
      <textarea class="cc-textarea ${S.err.desc ? "err" : ""}" maxlength="300" placeholder="What's the goal? Any rules?" oninput="CC.setDesc(this.value)">${esc(S.desc)}</textarea>
      <div class="cc-meta"><span class="cc-err">${S.err.desc || ""}</span><span class="cc-count">${S.desc.length}/300</span></div></div>`;
  }

  function step2() {
    const win = (w) => `<button class="cc-win ${S.winner === w.v ? "on" : ""}" onclick="CC.setWinner('${w.v}')">
      <span class="wic" style="color:${S.winner === w.v ? "var(--primary)" : "var(--text-secondary)"}">${I(w.ic, 22)}</span><div class="wt">${w.t}</div><div class="ws">${w.s}</div></button>`;
    return `<div class="cc-body">
      <div class="cc-h1">When &amp; who can join?</div><div class="cc-sub">Set the schedule and visibility</div>
      <div class="cc-lbl">Duration</div><div class="cc-seg">${FREQ.map((f) => `<button class="${S.frequency === f.v ? "on" : ""}" onclick="CC.setFreq('${f.v}')">${f.n}</button>`).join("")}</div>
      <div class="cc-lbl">Who can join?</div>
      <div class="cc-two">
        <div class="cc-pick ${S.isPublic ? "on" : ""}" onclick="CC.setPublic(true)"><span class="pic">${I("users", 26)}</span><div class="pt">Public</div><div class="pd">Anyone can join</div></div>
        <div class="cc-pick ${!S.isPublic ? "on" : ""}" onclick="CC.setPublic(false)"><span class="pic">${I("lock", 24)}</span><div class="pt">Private</div><div class="pd">Invite only</div></div></div>
      <div class="cc-lbl">Start date</div>
      <div class="cc-startquick">
        <button class="${isToday(S.start) ? "on" : ""}" onclick="CC.setStartQuick(0)">Today</button>
        <button class="${isTomorrow(S.start) ? "on" : ""}" onclick="CC.setStartQuick(1)">Tomorrow</button></div>
      <div class="cc-startfield"><input type="date" value="${S.start}" min="${today}" onchange="CC.setStart(this.value)"></div>
      <div class="cc-lbl">Length</div>
      <div class="cc-chips">${DURS.map((d) => `<button class="cc-chip ${!S.durCustom && S.dur === d ? "on" : ""}" onclick="CC.setDur(${d})">${d} days</button>`).join("")}
        <button class="cc-chip ${S.durCustom ? "on" : ""}" onclick="CC.setCustomDur()">Custom</button></div>
      ${S.durCustom ? `<div class="cc-customdur"><button onclick="CC.durStep(-1)">${I("chevron-down", 18)}</button><input type="number" min="1" max="365" value="${S.dur}" oninput="CC.setDurInput(this.value)"><button onclick="CC.durStep(1)">${I("chevron-up", 18)}</button><span class="u">days</span></div>` : ""}
      <div class="cc-ends"><span class="ic">${I("calendar", 15)}</span>Ends <b>${fmtDate(endISO())}</b> · ${S.dur} days</div>
      <div class="cc-lbl">Winner selection</div><div class="cc-three">${WIN.map(win).join("")}</div>
      ${S.winner !== "NO_WINNER" ? prizes() : ""}</div>`;
  }
  function prizes() {
    const rows = S.prizes.map((p, i) => `<div class="cc-prize-row"><span class="medal" style="color:${["#f5a623", "#b8c0c8", "#c8894a"][i]}">${I("medal", 18)}</span>
      <input value="${esc(p)}" maxlength="40" placeholder="${["1st", "2nd", "3rd"][i]} place prize" oninput="CC.setPrize(${i},this.value)">
      <button class="rm" onclick="CC.removePrize(${i})">${I("x", 16)}</button></div>`).join("");
    return `<div class="cc-lbl">Prizes (optional)</div>${rows}
      <button class="cc-addprize" onclick="CC.addPrize()" ${S.prizes.length >= 3 ? "disabled" : ""}>${I("plus", 16)} Add prize</button>
      <div class="cc-prize-hint">${S.prizes.length}/3 · rewards for the top finishers</div>`;
  }

  function step3() {
    const e = exMeta(S.exercise), days = S.dur, name = S.name.trim() || "Your challenge";
    const row = (ic, k, v) => `<div class="cc-sum-row"><span class="sic">${I(ic, 16)}</span><span class="sk">${k}</span><span class="sv">${v}</span></div>`;
    const noteIc = S.exercise === "steps" ? "walk" : "camera";
    const noteTx = S.exercise === "steps" ? "Steps are tracked automatically from your phone — no camera needed." : "Camera verification required. AI auto-counts every rep.";
    return `<div class="cc-body">
      <div class="cc-h1">Review your challenge</div><div class="cc-sub">Looks good? Launch it!</div>
      <div class="cc-lbl">Preview</div>
      <div class="cc-preview"><div class="art">${I(e.i, 40)}</div><div style="min-width:0">
        <div class="pt">${esc(name)}</div><div class="tag">${I(e.i, 13)} ${e.n}</div>
        <div class="meta">${freqLabel(S.frequency)} · ${S.isPublic ? "Public" : "Private"} · ${days} days</div></div></div>
      <div class="cc-lbl">Summary</div>
      <div class="cc-sum">
        ${row(e.i, "Exercise", e.n)}${row("calendar", "Schedule", freqLabel(S.frequency))}
        ${row("users", "Visibility", S.isPublic ? "Public" : "Private")}${row("flag", "Duration", days + " days")}
        ${row("trophy", "Winner", winLabel(S.winner))}${row("star", "Prizes", S.prizes.length ? S.prizes.length + " prize(s)" : "None")}</div>
      <div class="cc-note"><span class="nic">${I(noteIc, 18)}</span><span class="nt">${noteTx}</span></div></div>`;
  }

  function footer() {
    const primary = S.step === 0 ? "Next: When &amp; who" : S.step === 1 ? "Next: Review" : I("rocket", 18) + " Launch Challenge";
    return `<div class="cc-foot"><button class="cc-cancel" onclick="CC.cancel()">${S.step === 0 ? "Cancel" : "Back"}</button>
      <button class="cc-nextbtn" onclick="CC.next()">${primary}${S.step < 2 ? " " + I("chevron", 18) : ""}</button></div>`;
  }

  // ── field setters ──
  function setName(v) { S.name = v; if (S.err.name) { S.err.name = null; } document.querySelector(".cc-count").textContent = v.length + "/60"; }
  function setDesc(v) { S.desc = v; if (S.err.desc) S.err.desc = null; document.querySelectorAll(".cc-count")[1].textContent = v.length + "/300"; }
  function pickEx(k) { S.exercise = k; S.err.exercise = null; S.template = null; render(); }
  function applyTemplate(id) {
    const q = QUICK.find((x) => x.id === id); if (!q) return;
    S.template = id; S.err = {};
    if (id === "custom") { S.exercise = null; S.name = ""; S.desc = ""; S.winner = "NO_WINNER"; S.isPublic = true; S.prizes = []; S.frequency = "DAILY"; S.dur = 30; S.durCustom = false; }
    else { S.exercise = q.ex; S.name = q.name; S.desc = q.desc; S.winner = q.winner; S.isPublic = true; S.dur = q.dur; S.durCustom = false; }
    render();
  }
  function setFreq(v) { S.frequency = v; render(); }
  function setPublic(v) { S.isPublic = v; render(); }
  function setStart(v) { S.start = v || today; render(); }
  function setStartQuick(n) { S.start = iso(addDays(new Date(), n)); render(); }
  function setDur(d) { S.dur = d; S.durCustom = false; render(); }
  function setCustomDur() { S.durCustom = true; render(); }
  function durStep(delta) { S.dur = clamp(S.dur + delta, 1, 365); render(); }
  function setDurInput(v) { S.dur = clamp(parseInt(v) || 1, 1, 365); }
  function setWinner(v) { S.winner = v; if (v === "NO_WINNER") S.prizes = []; else if (!S.prizes.length) S.prizes = [""]; render(); }
  function addPrize() { if (S.prizes.length < 3) { S.prizes.push(""); render(); } }
  function removePrize(i) { S.prizes.splice(i, 1); render(); }
  function setPrize(i, v) { S.prizes[i] = v; }

  // ── validation + nav ──
  function validate1() {
    S.err = {};
    if (!S.exercise) S.err.exercise = "Pick an exercise to continue.";
    if (!S.name.trim()) S.err.name = "Field required";
    const d = S.desc.trim();
    if (!d) S.err.desc = "Field required";
    else if (d.length < 10) S.err.desc = "Minimum 10 characters required";
    if ((S.name + " " + S.desc).toLowerCase().split(/\W+/).some((w) => BAD.includes(w))) S.err.desc = "Please avoid using improper words.";
    return !S.err.exercise && !S.err.name && !S.err.desc;
  }
  function validate2() { S.prizes = S.prizes.filter((p) => p.trim()); return true; }   // start+duration can't be invalid
  function next() {
    if (S.step === 0 && !validate1()) return render();
    if (S.step === 1 && !validate2()) return render();
    if (S.step < 2) { S.step++; render(); document.getElementById("app").querySelector(".cc-body").scrollTop = 0; }
    else launch();
  }
  function cancel() { if (S.step > 0) { S.step--; render(); } else tryExit(); }
  function tryExit() { hasData() ? discard() : exit(); }
  function exit() { location.href = "discover.html"; }

  let _ov = null;
  function discard() {
    const o = document.createElement("div"); o.className = "cc-ov";
    o.innerHTML = `<div class="cc-dlg"><div class="di">${I("alert", 26)}</div><div class="dt">Discard challenge?</div>
      <div class="dd">Your draft will be lost. This can't be undone.</div>
      <div class="cc-dlg-row"><button class="cc-keep" onclick="CC.closeDiscard()">Keep editing</button><button class="cc-discard" onclick="CC.exit()">Discard</button></div></div>`;
    o.addEventListener("click", (e) => { if (e.target === o) closeDiscard(); });
    document.querySelector(".screen").appendChild(o); window.Icons.init(o); _ov = o;
  }
  function closeDiscard() { if (_ov) { _ov.remove(); _ov = null; } }

  function launch() {
    Buzzend.alert({ icon: "trophy", title: "Challenge created!", message: "“" + (S.name.trim() || "Your challenge") + "” is live. Invite friends and record your first set." });
    setTimeout(() => { location.href = "challenges.html"; }, 400);
  }

  function start(step) {
    step = +step || 0;
    if (step > 0) {   // prefill so deep-linked steps 2/3 preview real data
      S.template = "squat_30day"; S.exercise = "squat"; S.name = "30-Day Squat Challenge";
      S.desc = "Do squats every day for 30 days. Camera verification required."; S.winner = "NORMAL_WINNER"; S.prizes = ["Gold medal + shoutout"];
    }
    S.step = Math.max(0, Math.min(2, step));
    if (new URLSearchParams(location.search).get("err")) validate1();   // QA: show step-1 validation state
    render();
  }
  return { start, render, setName, setDesc, pickEx, applyTemplate, setFreq, setPublic, setStart, setStartQuick, setDur, setCustomDur, durStep, setDurInput, setWinner, addPrize, removePrize, setPrize, next, cancel, tryExit, exit, discard, closeDiscard };
})();
