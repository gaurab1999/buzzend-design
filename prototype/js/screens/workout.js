/* Buzzend AI rep-counting flow — one engine, three variations (config-driven).
   A Beginner · B Balanced · C Advanced.  Reuses Icons + tokens + the landmark figure.
   Camera/reps are simulated for the prototype (auto-count + the squat landmark gif). */
window.Workout = (function () {
  const I = (n, s) => window.Icons.svg(n, s);

  const EX = {
    squat:   { name: "Squats",        icon: "squat",   target: 15, cue: "Chest up — drop to parallel", cues: ["Go a little lower 👍", "Great depth!", "Drive through your heels"] },
    pushup:  { name: "Push-ups",      icon: "pushup",  target: 12, cue: "Straight line, head to heels", cues: ["Lower your chest", "Solid form!", "Elbows ~45°"] },
    situp:   { name: "Sit-ups",       icon: "situp",   target: 20, cue: "Curl up smooth — ease your neck", cues: ["Controlled down", "Nice tempo!"] },
    jumping: { name: "Jumping Jacks", icon: "jumping", target: 30, cue: "Full extension, arms overhead", cues: ["Bigger arms!", "Light on your feet"] },
    lunge:   { name: "Lunges",        icon: "lunge",   target: 12, cue: "Front knee over ankle", cues: ["Deeper lunge", "Stay tall"] },
  };
  const ORDER = ["squat", "pushup", "situp", "jumping", "lunge"];
  const FIG = "../../assets/landmark-squat.gif"; // animated skeleton stand-in for the camera

  const CONFIG = {
    a: { label: "Beginner",  target: false, sets: 1, rest: false, confidence: false, record: false, voice: true,  summary: "simple",    title: "Pick a workout" },
    b: { label: "Balanced",  target: true,  sets: 3, rest: true,  confidence: true,  record: true,  voice: false, summary: "rich",      title: "Choose your exercise" },
    c: { label: "Advanced",  target: true,  sets: 3, rest: true,  confidence: true,  record: false, voice: false, rom: true, tempo: true, queue: true, summary: "breakdown", title: "Build your session" },
  };

  let el, S;

  function ring(pct, o) {
    o = o || {};
    const s = o.size || 64, sw = o.sw || 6, r = (s / 2) - sw, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
    return `<svg class="wo-ringsvg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
      <circle cx="${s/2}" cy="${s/2}" r="${r}" fill="none" stroke="${o.track || 'rgba(255,255,255,.16)'}" stroke-width="${sw}"/>
      <circle cx="${s/2}" cy="${s/2}" r="${r}" fill="none" stroke="${o.color || '#15c2b0'}" stroke-width="${sw}" stroke-linecap="round"
        stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 ${s/2} ${s/2})" style="transition:stroke-dashoffset .3s"/></svg>`;
  }

  // ───────── controller ─────────
  function start(v, mountEl) {
    el = mountEl;
    const cfg = CONFIG[v] || CONFIG.b;
    S = { v, cfg, step: cfg.queue ? "build" : "pick", exKey: "squat",
      queue: [], qi: 0, set: 1, reps: 0, target: 0, timer: null, conf: 0 };
    if (cfg.queue) S.queue = [{ exKey: "squat", sets: 3 }, { exKey: "pushup", sets: 3 }];
    go(S.step);
  }
  function clearTimer() { if (S.timer) { clearInterval(S.timer); S.timer = null; } }
  function go(step) { clearTimer(); S.step = step; render(); }

  function render() {
    const R = { pick: renderPick, build: renderBuild, permission: renderPermission, setup: renderSetup,
      countdown: renderCountdown, train: renderTrain, rest: renderRest, summary: renderSummary }[S.step];
    el.innerHTML = R();
    window.Icons.init(el);
    el.querySelectorAll("[data-go]").forEach((n) => n.addEventListener("click", () => go(n.dataset.go)));
    const after = { setup: afterSetup, countdown: afterCountdown, train: afterTrain, rest: afterRest, summary: afterSummary }[S.step];
    if (after) after();
  }

  const cur = () => S.queue[S.qi];
  function beginExercise(exKey) {
    S.exKey = exKey; S.qi = 0; S.set = 1;
    S.queue = [{ exKey, sets: S.cfg.sets }];
    go("permission");
  }
  function setComplete() {
    const c = cur(), moreSets = S.set < c.sets, moreEx = S.qi < S.queue.length - 1;
    if (!moreSets && !moreEx) return go("summary");
    S.cfg.rest ? go("rest") : advance();
  }
  function advance() {
    const c = cur();
    if (S.set < c.sets) S.set++; else { S.qi++; S.set = 1; }
    go("train");
  }

  // ───────── screens ─────────
  const exName = () => EX[cur() ? cur().exKey : S.exKey].name;
  const totalSets = () => (cur() ? cur().sets : 1);

  function exCard(k, withTarget) {
    const e = EX[k];
    return `<button class="wo-ex" data-ex="${k}">
      <span class="wo-ex-ic">${I(e.icon, 26)}</span>
      <span class="wo-ex-n">${e.name}</span>
      ${withTarget ? `<span class="wo-ex-t">${S.cfg.sets}×${e.target}</span>` : ""}
      <span class="wo-ex-go">${I("chevron", 18)}</span></button>`;
  }
  function renderPick() {
    return `<div class="wo-screen wo-light">
      <div class="wo-head"><button class="wo-x" onclick="location.href='index.html'">${I("x", 20)}</button>
        <div class="wo-h-t">${S.cfg.title}</div></div>
      <div class="wo-sub">Tap an exercise — the camera counts your reps automatically.</div>
      <div class="wo-exlist">${ORDER.map((k) => exCard(k, S.cfg.target)).join("")}</div></div>`;
  }
  function renderBuild() {
    const rows = S.queue.map((q, i) => { const e = EX[q.exKey];
      return `<div class="wo-qrow"><span class="wo-ex-ic">${I(e.icon, 22)}</span>
        <div class="wo-q-n">${e.name}<span>${q.sets} sets · ${e.target} reps</span></div>
        <span class="wo-q-i">${i + 1}</span></div>`; }).join("");
    return `<div class="wo-screen wo-light">
      <div class="wo-head"><button class="wo-x" onclick="location.href='index.html'">${I("x", 20)}</button>
        <div class="wo-h-t">${S.cfg.title}</div></div>
      <div class="wo-sub">Your session queue — runs back-to-back with rest between.</div>
      <div class="wo-queue">${rows}</div>
      <button class="wo-addq" data-go="pick-add">${I("plus", 16)} Add exercise</button>
      <div class="wo-foot"><button class="btn btn-primary" data-go="permission">${I("zap", 18)} Start session · ${S.queue.length} exercises</button></div></div>`;
  }
  function renderPermission() {
    return `<div class="wo-screen wo-light wo-perm">
      <div class="wo-perm-ic">${I("camera", 40)}</div>
      <div class="wo-perm-t">Count reps hands-free</div>
      <div class="wo-perm-d">Buzzend uses your camera <b>on-device</b> to count reps. Nothing is recorded or uploaded unless you choose to.</div>
      <div class="wo-foot"><button class="btn btn-primary" data-go="setup">${I("camera", 18)} Enable camera</button>
        <button class="wo-text-btn" data-go="setup">Maybe later</button></div></div>`;
  }

  function camStage(extra) {
    return `<div class="wo-cam"><img class="wo-figure" src="${FIG}" alt="" />${extra || ""}</div>`;
  }
  function renderSetup() {
    return `<div class="wo-screen wo-dark wo-stage">
      <button class="wo-x dark" data-go="${S.cfg.queue ? 'build' : 'pick'}">${I("x", 20)}</button>
      ${camStage(`<div class="wo-outline"></div>`)}
      <div class="wo-setup">
        <div class="wo-setup-status" id="wo-status">${I("user", 16)} <span>Stand back so your whole body fits…</span></div>
        ${S.cfg.confidence ? `<div class="wo-conf" id="wo-conf">${ring(8, { size: 26, sw: 4 })}<span>Finding you…</span></div>` : ""}
        <div class="wo-demo">${I(EX[S.queue[S.qi] ? S.queue[S.qi].exKey : S.exKey].icon, 18)} ${exName()} — ${EX[S.queue[S.qi] ? S.queue[S.qi].exKey : S.exKey].cue}</div>
      </div>
      <div class="wo-stage-foot"><button class="btn btn-primary" id="wo-ready" data-go="countdown" disabled>${I("camera", 18)} I'm ready</button></div></div>`;
  }
  function afterSetup() {
    const status = el.querySelector("#wo-status"), conf = el.querySelector("#wo-conf"), ready = el.querySelector("#wo-ready");
    setTimeout(() => {
      if (status) status.innerHTML = `${I("success", 16)} <span>Locked in — you're all set</span>`, status.classList.add("ok");
      if (conf) conf.innerHTML = `${ring(100, { size: 26, sw: 4, color: "#34d094" })}<span>Tracking</span>`, conf.classList.add("ok");
      if (ready) ready.disabled = false;
      el.querySelector(".wo-outline") && el.querySelector(".wo-outline").classList.add("ok");
    }, 1600);
  }

  function renderCountdown() {
    return `<div class="wo-screen wo-dark wo-stage">${camStage(`<div class="wo-count-overlay"><div class="wo-cd" id="wo-cd">3</div><div class="wo-cd-l">Get ready</div></div>`)}</div>`;
  }
  function afterCountdown() {
    let n = 3; const node = el.querySelector("#wo-cd");
    const tick = () => { n--; if (n <= 0) { node.textContent = "GO"; node.classList.add("go"); setTimeout(() => { S.reps = 0; go("train"); }, 600); }
      else { node.textContent = n; node.classList.remove("wo-cd-pop"); void node.offsetWidth; node.classList.add("wo-cd-pop"); } };
    S.timer = setInterval(() => { tick(); if (n <= 0) clearTimer(); }, 800);
  }

  function renderTrain() {
    const e = EX[cur().exKey]; S.target = e.target;
    const cfg = S.cfg;
    const goalRing = cfg.target ? `<div class="wo-count-ring">${ring(0, { size: 232, sw: 12 })}</div>` : "";
    const sub = cfg.target ? `<div class="wo-count-sub" id="wo-sub">/ ${e.target} reps</div>` : `<div class="wo-count-sub">reps</div>`;
    return `<div class="wo-screen wo-dark wo-stage wo-train">
      <div class="wo-topbar">
        <button class="wo-x dark" data-go="${cfg.queue ? 'build' : 'pick'}">${I("x", 18)}</button>
        ${cfg.confidence ? `<span class="wo-chip ok" id="wo-tconf">${ring(100, { size: 18, sw: 3, color: "#fff" })} Tracking</span>` : ""}
        ${cfg.voice ? `<span class="wo-chip">${I("zap", 13)} Voice on</span>` : ""}
        ${cfg.record ? `<button class="wo-rec" id="wo-rec"><span class="wo-rec-dot"></span> Record</button>` : "<span></span>"}
      </div>
      ${camStage("")}
      <div class="wo-count-wrap">${goalRing}
        <div class="wo-count" id="wo-count">0</div>${sub}</div>
      <div class="wo-cue" id="wo-cue">${e.cue}</div>
      <div class="wo-ctx">${I(e.icon, 14)} ${e.name}${cfg.sets > 1 ? ` · Set ${S.set} of ${totalSets()}` : ""}${cfg.rom ? ` · ROM ●●●○` : ""}</div>
      ${cfg.queue && S.qi < S.queue.length - 1 ? `<div class="wo-next">Next: ${EX[S.queue[S.qi + 1].exKey].name}</div>` : ""}
      <div class="wo-controls"><button class="wo-pause" id="wo-pause">${I("clock", 18)} Pause</button>
        <button class="btn btn-primary wo-finish" data-go="" id="wo-finish">Finish set</button></div></div>`;
  }
  function afterTrain() {
    const countN = el.querySelector("#wo-count"), ringEl = el.querySelector(".wo-count-ring .wo-ringsvg circle:last-child");
    const sub = el.querySelector("#wo-sub"), cue = el.querySelector("#wo-cue"), finish = el.querySelector("#wo-finish");
    const e = EX[cur().exKey], target = e.target;
    let paused = false;
    const ringLen = ringEl ? parseFloat(ringEl.getAttribute("stroke-dasharray")) : 0;
    function paint() {
      countN.textContent = S.reps;
      countN.classList.remove("wo-pop"); void countN.offsetWidth; countN.classList.add("wo-pop");
      if (ringEl) ringEl.setAttribute("stroke-dashoffset", (ringLen * (1 - Math.min(S.reps / target, 1))).toFixed(1));
      if (S.cfg.voice && window.speechSynthesis) { try { const u = new SpeechSynthesisUtterance("" + S.reps); u.volume = .5; u.rate = 1.2; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} }
      if (cue && S.reps && e.cues.length && S.reps % 4 === 0) cue.textContent = e.cues[(S.reps / 4) % e.cues.length | 0];
    }
    function done() { clearTimer(); countN.classList.add("wo-done"); el.querySelector(".wo-count-wrap").classList.add("complete"); setTimeout(setComplete, 850); }
    S.reps = 0; paint();
    S.timer = setInterval(() => { if (paused) return; S.reps++; paint(); if (S.reps >= target) done(); }, 850);
    const pause = el.querySelector("#wo-pause");
    if (pause) pause.addEventListener("click", () => { paused = !paused; pause.classList.toggle("on", paused); pause.innerHTML = paused ? `${I("play", 18)} Resume` : `${I("clock", 18)} Pause`; });
    if (finish) finish.addEventListener("click", done);
    const rec = el.querySelector("#wo-rec");
    if (rec) rec.addEventListener("click", () => rec.classList.toggle("on"));
  }

  function renderRest() {
    const nextSet = S.set < cur().sets, nextEx = !nextSet && S.qi < S.queue.length - 1;
    const label = nextEx ? `Next: ${EX[S.queue[S.qi + 1].exKey].name}` : `Next: Set ${S.set + 1} of ${totalSets()}`;
    return `<div class="wo-screen wo-rest wo-light">
      <div class="wo-rest-done">${I("success", 22)} Set complete</div>
      <div class="wo-rest-ring">${ring(100, { size: 180, sw: 10, color: "var(--primary)", track: "var(--surface-alt)" })}
        <div class="wo-rest-num" id="wo-rest-num">30</div><div class="wo-rest-sub">rest</div></div>
      <div class="wo-rest-next">${label}<span>${EX[cur().exKey].name} · ${EX[cur().exKey].target} reps</span></div>
      <div class="wo-rest-ctrl"><button class="btn btn-ghost btn-sm" id="wo-add15">+15s</button>
        <button class="btn btn-primary btn-sm" data-go="" id="wo-skip">Skip rest</button></div></div>`;
  }
  function afterRest() {
    const num = el.querySelector("#wo-rest-num"), ringEl = el.querySelector(".wo-rest-ring .wo-ringsvg circle:last-child");
    const ringLen = ringEl ? parseFloat(ringEl.getAttribute("stroke-dasharray")) : 0;
    let t = 30; const total = 30;
    function paint() { num.textContent = t; if (ringEl) ringEl.setAttribute("stroke-dashoffset", (ringLen * (1 - t / total)).toFixed(1)); if (t <= 3) num.classList.add("low"); }
    paint();
    S.timer = setInterval(() => { t--; paint(); if (t <= 0) { clearTimer(); advance(); } }, 1000);
    el.querySelector("#wo-add15").addEventListener("click", () => { t += 15; paint(); });
    el.querySelector("#wo-skip").addEventListener("click", () => { clearTimer(); advance(); });
  }

  function renderSummary() {
    const e = EX[S.queue[0].exKey];
    const totalReps = S.queue.reduce((a, q) => a + EX[q.exKey].target * q.sets, 0);
    const totalSetsN = S.queue.reduce((a, q) => a + q.sets, 0);
    const pts = Math.round(totalReps * 2.6), kcal = (totalReps * 0.4).toFixed(0);
    if (S.cfg.summary === "simple") {
      return `<div class="wo-screen wo-sum wo-light">
        <div class="wo-sum-burst">${I("zap", 40)}</div>
        <div class="wo-sum-big">${EX[S.queue[0].exKey].target}</div>
        <div class="wo-sum-head">${e.name} done — nice work!</div>
        <div class="wo-sum-row"><span>${I("flame", 15)} ${kcal} kcal</span><span>${I("clock", 15)} ~1 min</span></div>
        <div class="wo-foot"><button class="btn btn-primary" onclick="location.href='index.html'">Done</button></div></div>`;
    }
    if (S.cfg.summary === "breakdown") {
      const rows = S.queue.map((q) => { const x = EX[q.exKey];
        return `<div class="wo-br-row"><span class="wo-ex-ic sm">${I(x.icon, 16)}</span><div class="wo-br-n">${x.name}<span>${q.sets} sets · ROM 92% · tempo good</span></div><div class="wo-br-v">${x.target * q.sets}<span>reps</span></div></div>`; }).join("");
      return `<div class="wo-screen wo-sum wo-light">
        <div class="wo-sum-burst sm">${I("zap", 32)}</div><div class="wo-sum-head">Session complete</div>
        <div class="wo-sum-stats"><div class="wo-st"><b>${totalReps}</b>reps</div><div class="wo-st"><b>${totalSetsN}</b>sets</div><div class="wo-st"><b>+${pts}</b>points</div></div>
        <div class="wo-br">${rows}</div>
        <div class="wo-foot"><button class="btn btn-primary" onclick="location.href='index.html'">Save session</button>
          <button class="wo-text-btn">Export</button></div></div>`;
    }
    return `<div class="wo-screen wo-sum wo-light">
      <div class="wo-sum-burst">${I("zap", 40)}</div>
      <div class="wo-sum-head">Great work!</div>
      <div class="wo-sum-big" id="wo-sum-big">0</div><div class="wo-sum-biglabel">reps · ${totalSetsN} sets</div>
      <div class="wo-sum-stats"><div class="wo-st"><b id="wo-pts">0</b>points 🔥</div><div class="wo-st"><b>48</b>day streak</div><div class="wo-st"><b>${kcal}</b>kcal</div></div>
      <div class="wo-pr">${I("trophy", 15)} New personal best — ${EX[S.queue[0].exKey].target} ${e.name.toLowerCase()} in a set!</div>
      <div class="wo-foot"><button class="btn btn-primary" onclick="location.href='index.html'">Save</button>
        <button class="btn btn-ghost" data-go="pick">${I("share", 17)} Share clip</button></div></div>`;
  }
  function afterSummary() {
    const big = el.querySelector("#wo-sum-big"), pts = el.querySelector("#wo-pts");
    const totalReps = S.queue.reduce((a, q) => a + EX[q.exKey].target * q.sets, 0);
    if (big) countUp(big, totalReps, 700);
    if (pts) countUp(pts, Math.round(totalReps * 2.6), 900, "+");
  }
  function countUp(node, to, ms, prefix) {
    const start = performance.now();
    function f(now) { const p = Math.min((now - start) / ms, 1); node.textContent = (prefix || "") + Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); }
    requestAnimationFrame(f);
  }

  // exercise selection (delegated, since cards are data-ex not data-go)
  function bindEx() {
    el.addEventListener("click", (ev) => {
      const c = ev.target.closest("[data-ex]"); if (c) beginExercise(c.dataset.ex);
      const add = ev.target.closest('[data-go="pick-add"]'); if (add) { /* prototype: cycle a new exercise into the queue */
        const used = S.queue.map(q => q.exKey); const nextEx = ORDER.find(k => !used.includes(k)) || "lunge";
        S.queue.push({ exKey: nextEx, sets: 3 }); go("build"); }
    });
  }

  return { start: (v, mountEl, debug) => {
    start(v, mountEl); bindEx();
    if (debug) { if (!S.queue.length) S.queue = [{ exKey: "squat", sets: S.cfg.sets }]; S.qi = 0; S.set = 1; go(debug); }
  } };
})();
