/* Buzzend AI Workout — complete flow, all screens + edge cases.
   select → [permission] → get-ready(position+countdown) → camera(record+count)
        → summary → [review → uploading → posted].
   Edge: permission denied · no body in frame · low light · tracking lost · pause ·
         quit-confirm · 0-rep finish · manual correct · upload fail+retry.
   Camera/reps simulated (skeleton + auto count). Deep-link any screen via ?step=. */
window.AIFlow = (function () {
  const I = (n, s) => window.Icons.svg(n, s);
  const EX = { squat:{n:"Squats",i:"squat"}, pushup:{n:"Push-ups",i:"pushup"}, situp:{n:"Sit-ups",i:"situp"}, jumping:{n:"Jumping Jacks",i:"jumping"}, lunge:{n:"Lunges",i:"lunge"} };
  const ORDER = ["squat","pushup","situp","jumping","lunge"];
  const STAND = { head:[110,52],neck:[110,82], sL:[86,98],sR:[134,98], eL:[76,140],eR:[144,140], wL:[80,182],wR:[140,182], hL:[96,186],hR:[124,186], kL:[95,250],kR:[125,250], aL:[94,322],aR:[126,322] };
  const SQUAT = { head:[110,108],neck:[110,136], sL:[86,150],sR:[134,150], eL:[82,156],eR:[138,156], wL:[96,154],wR:[124,154], hL:[99,242],hR:[121,242], kL:[80,258],kR:[140,258], aL:[86,322],aR:[134,322] };
  const EDGES = [["neck","sL"],["neck","sR"],["sL","sR"],["sL","eL"],["eL","wL"],["sR","eR"],["eR","wR"],["sL","hL"],["sR","hR"],["hL","hR"],["hL","kL"],["kL","aL"],["hR","kR"],["kR","aR"],["neck","head"]];

  let root, S;
  const say = (t) => { try { if (!window.speechSynthesis) return; const u = new SpeechSynthesisUtterance("" + t); u.rate = 1.15; u.volume = .7; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} };
  const buzz = () => { try { navigator.vibrate && navigator.vibrate(15); } catch (e) {} };
  const mmss = (s) => Math.floor(s / 60) + ":" + ("" + (s % 60)).padStart(2, "0");
  const home = () => location.href = "index.html";
  function clear() { (S.timers || []).forEach((t) => clearInterval(t)); if (S.raf) cancelAnimationFrame(S.raf); S.timers = []; S.raf = null; try { speechSynthesis.cancel(); } catch (e) {} }
  function go(step) { clear(); S.step = step; render(); }

  function skeletonSVG(extraTop) {
    const ln = (a, b, cls, w) => `<line class="${cls}" data-e="${a},${b}" stroke-width="${w}" stroke-linecap="round" x1="${STAND[a][0]}" y1="${STAND[a][1]}" x2="${STAND[b][0]}" y2="${STAND[b][1]}"/>`;
    return `<svg viewBox="0 0 220 360" fill="none">${EDGES.map((x) => ln(x[0], x[1], "cm-body-bone", 18)).join("")}<circle class="cm-body-bone" data-j="head" cx="110" cy="52" r="20"/>${EDGES.map((x) => ln(x[0], x[1], "cm-bone", 3)).join("")}${Object.keys(STAND).map((k) => `<circle class="cm-joint" data-j="${k}" cx="${STAND[k][0]}" cy="${STAND[k][1]}" r="4"/>`).join("")}</svg>`;
  }
  function poser(fig) {
    const lines = fig.querySelectorAll("[data-e]"), circles = fig.querySelectorAll("[data-j]");
    return (t) => { const c = {}; Object.keys(STAND).forEach((j) => c[j] = [STAND[j][0] + (SQUAT[j][0] - STAND[j][0]) * t, STAND[j][1] + (SQUAT[j][1] - STAND[j][1]) * t]);
      circles.forEach((n) => { const j = n.dataset.j; if (c[j]) { n.setAttribute("cx", c[j][0].toFixed(1)); n.setAttribute("cy", c[j][1].toFixed(1)); } });
      lines.forEach((l) => { const p = l.dataset.e.split(","), a = c[p[0]], b = c[p[1]]; if (a && b) { l.setAttribute("x1", a[0].toFixed(1)); l.setAttribute("y1", a[1].toFixed(1)); l.setAttribute("x2", b[0].toFixed(1)); l.setAttribute("y2", b[1].toFixed(1)); } }); };
  }

  // ───────── screens ─────────
  function render() {
    ({ select: rSelect, permission: rPermission, denied: rDenied, getready: rGetReady, camera: rCamera,
       summary: rSummary, review: rReview, uploading: rUploading, uploadfail: rUploadFail, posted: rPosted }[S.step] || rSelect)();
    window.Icons.init(root);
  }

  function rSelect() {
    S.reps = 0; S.secs = 0;
    root.innerHTML = `<div class="fl">
      <div class="fl-head"><button class="cm-x glass" onclick="location.href='index.html'">${I("x", 20)}</button><div class="fl-title">Choose a workout</div></div>
      <div class="fl-sub">Pick an exercise — the camera will count your reps automatically.</div>
      <div class="fl-list">${ORDER.map((k) => `<button class="fl-ex glass" data-ex="${k}"><span class="fl-ex-ic">${I(EX[k].i, 26)}</span><span class="fl-ex-n">${EX[k].n}</span><span class="fl-ex-go">${I("chevron", 20)}</span></button>`).join("")}</div></div>`;
    root.querySelectorAll("[data-ex]").forEach((b) => b.addEventListener("click", () => { S.exKey = b.dataset.ex; go(S.granted ? "getready" : "permission"); }));
  }

  function rPermission() {
    root.innerHTML = `<div class="fl fl-center">
      <div class="fl-ic">${I("camera", 40)}</div>
      <div class="fl-c-t">Let Buzzend see you</div>
      <div class="fl-c-d">The camera counts your reps <b>on-device</b>. Nothing is recorded or shared unless you choose to post.</div>
      <div class="fl-f-foot"><button class="fl-btn-primary" id="enable">${I("camera", 18)} Enable camera</button>
        <button class="fl-btn-ghost" id="deny">Not now</button></div></div>`;
    root.querySelector("#enable").addEventListener("click", () => { S.granted = true; go("getready"); });
    root.querySelector("#deny").addEventListener("click", () => go("denied"));
  }
  function rDenied() {
    root.innerHTML = `<div class="fl fl-center">
      <div class="fl-ic bad">${I("camera", 40)}</div>
      <div class="fl-c-t">Camera is off</div>
      <div class="fl-c-d">Buzzend needs the camera to count reps. Turn it on in your phone's Settings, then try again.</div>
      <div class="fl-f-foot"><button class="fl-btn-primary" id="retry">Try again</button>
        <button class="fl-btn-ghost" onclick="location.href='index.html'">Back</button></div></div>`;
    root.querySelector("#retry").addEventListener("click", () => go("permission"));
  }

  // get-ready: frame your shot (front/back flip) → positioning → tap start → countdown
  function rGetReady() {
    const e = EX[S.exKey];
    root.innerHTML = `<div class="cm partial" id="cm">
      <span class="cm-spot"></span>
      <div class="cm-frame"><i></i><i></i><i></i><i></i></div>
      <div class="cm-top"><button class="cm-x glass" id="back">${I("x", 20)}</button>
        <span class="cm-status glass"><span class="dot"></span>SET UP YOUR SHOT</span>
        <button class="cm-flip glass" id="flip">${I("flip-camera", 18)}<span id="facing">${S.facing === "front" ? "Front" : "Back"}</span></button></div>
      <div class="cm-fig ${S.facing === "front" ? "mirror" : ""}" id="fig">${skeletonSVG()}</div>
      <div class="cm-facing" id="facelbl">${S.facing === "front" ? "Front camera" : "Back camera"} · tap to flip</div>
      <div class="cm-cue glass" id="cue">Stand back so your whole body fits</div>
      <div class="cm-controls"><button class="cm-finish" id="start">${I("check", 18)} Start ${e.n.toLowerCase()}</button></div>
      <div class="cm-cd-wrap" id="cd" style="display:none"><div class="cm-cd" id="cdn">3</div><div class="cm-cd-l">Get ready</div></div></div>`;
    const cm = root.querySelector("#cm"), fig = root.querySelector("#fig"), cue = root.querySelector("#cue");
    const setPose = poser(fig); let t0 = performance.now();
    S.raf = requestAnimationFrame(function loop(now) { if (!fig.isConnected) return; setPose((1 - Math.cos(((now - t0) % 1700) / 1700 * 2 * Math.PI)) / 2); S.raf = requestAnimationFrame(loop); });
    root.querySelector("#back").addEventListener("click", () => go("select"));
    // front/back camera switch (before starting)
    const facing = root.querySelector("#facing"), facelbl = root.querySelector("#facelbl");
    root.querySelector("#flip").addEventListener("click", () => {
      S.facing = S.facing === "front" ? "back" : "front";
      facing.textContent = S.facing === "front" ? "Front" : "Back";
      facelbl.textContent = (S.facing === "front" ? "Front camera" : "Back camera") + " · tap to flip";
      fig.classList.toggle("mirror", S.facing === "front");
      fig.classList.remove("flip-anim"); void fig.offsetWidth; fig.classList.add("flip-anim"); buzz();
    });
    // positioning beat → "locked"
    S.timers.push(setTimeout(() => { cm.classList.remove("partial"); cm.classList.add("locked"); cue.textContent = "Perfect — hold still"; }, 1600));
    // tap start → 3·2·1 countdown → camera
    root.querySelector("#start").addEventListener("click", () => {
      const cd = root.querySelector("#cd"), cdn = root.querySelector("#cdn"); cd.style.display = "grid"; let n = 3; cdn.textContent = n; say(n);
      const iv = setInterval(() => { n--; if (n <= 0) { cdn.textContent = "GO"; cdn.classList.add("go"); say("go"); clearInterval(iv); S.timers.push(setTimeout(() => go("camera"), 550)); } else { cdn.textContent = n; say(n); } }, 800);
      S.timers.push(iv);
    });
  }

  // camera: record + count, with live states + quit-confirm
  function rCamera(forceState) {
    const e = EX[S.exKey]; S.reps = 0; S.secs = 0;
    root.innerHTML = `<div class="cm locked" id="cm">
      <span class="cm-spot"></span>
      <div class="cm-frame"><i></i><i></i><i></i><i></i></div>
      <div class="cm-top"><button class="cm-x glass" id="quit">${I("x", 20)}</button>
        <span class="cm-status glass"><span class="dot"></span><span id="stat">${e.n.toUpperCase()}</span></span>
        <span class="cm-rectime glass"><span class="rd"></span><span id="rec">0:00</span></span></div>
      <div class="cm-hud"><div class="cm-eyebrow">${I(e.i, 14)} ${e.n}</div><div class="cm-count" id="count" title="Tap to correct">0</div>
        <div class="cm-hint" id="hint">tap the number to fix a miss</div></div>
      <div class="cm-fig ${S.facing === "front" ? "mirror" : ""}" id="fig">${skeletonSVG()}</div>
      <div class="cm-cue glass" id="cue">${e.n} · counting</div>
      <div class="cm-controls"><button class="cm-pause glass" id="pause">${I("clock", 18)} Pause</button>
        <button class="cm-finish" id="finish">${I("check", 18)} Finish</button></div>
      <div class="cm-toast" id="toast"></div></div>`;
    const cm = root.querySelector("#cm"), fig = root.querySelector("#fig"), countEl = root.querySelector("#count"),
      stat = root.querySelector("#stat"), cue = root.querySelector("#cue"), hint = root.querySelector("#hint"),
      toast = root.querySelector("#toast"), rec = root.querySelector("#rec");
    const setPose = poser(fig); let locked = true, glitched = false, paused = false, lastCyc = 0, t0 = performance.now();
    function status(state, txt, label) { cm.className = "cm " + state; stat.textContent = txt; if (label != null) cue.textContent = label; }
    function paint() { countEl.textContent = S.reps; countEl.classList.remove("pop"); void countEl.offsetWidth; countEl.classList.add("pop"); say(S.reps); buzz(); if (S.reps === 3) hint.classList.add("show"); if (S.reps === 6) hint.classList.remove("show"); }
    function glitch() { locked = false; status("partial", "MOVE BACK", "Step back — fit your whole body in frame"); say("step back"); S.timers.push(setTimeout(() => { if (fig.isConnected) { locked = true; status("locked", e.n.toUpperCase(), e.n + " · counting"); } }, 2100)); }
    S.raf = requestAnimationFrame(function loop(now) { if (!fig.isConnected) return;
      if (!paused) { const el = now - t0, ph = (el % 1700) / 1700; setPose((1 - Math.cos(ph * 2 * Math.PI)) / 2);
        const cyc = Math.floor(el / 1700); if (cyc !== lastCyc) { lastCyc = cyc; if (locked) { S.reps++; paint(); if (S.reps === 6 && !glitched) { glitched = true; glitch(); } } } }
      S.raf = requestAnimationFrame(loop); });
    S.timers.push(setInterval(() => { if (!paused) { S.secs++; rec.textContent = mmss(S.secs); } }, 1000));
    // forced edge states for review
    if (forceState === "lost") { locked = false; status("lost", "MORE LIGHT", "Too dark — find better light"); }
    if (forceState === "noframe") { locked = false; status("partial", "STEP INTO FRAME", "I can't see you — step into view"); }
    countEl.addEventListener("click", () => { if (S.reps <= 0) return; S.reps--; countEl.textContent = S.reps; toast.textContent = "−1 · corrected"; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 1100); });
    root.querySelector("#pause").addEventListener("click", function () { paused = !paused; this.classList.toggle("on", paused); this.innerHTML = paused ? `${I("play", 18)} Resume` : `${I("clock", 18)} Pause`; });
    root.querySelector("#finish").addEventListener("click", () => go("summary"));
    root.querySelector("#quit").addEventListener("click", () => { paused = true; quitOverlay(cm, () => { paused = false; }); });
  }
  function quitOverlay(cm, onKeep) {
    const o = document.createElement("div"); o.className = "fl-quit";
    o.innerHTML = `<div class="fl-quit-card"><div class="t">End this set?</div><div class="d">Your ${S.reps} reps won't be saved.</div>
      <div class="row"><button class="fl-btn-primary" id="q-keep">Keep going</button><button class="fl-btn-ghost" id="q-end" style="color:#ff6a62;border-color:rgba(255,106,98,.4)">Discard &amp; exit</button></div></div>`;
    cm.appendChild(o);
    o.querySelector("#q-keep").addEventListener("click", () => { o.remove(); onKeep && onKeep(); });
    o.querySelector("#q-end").addEventListener("click", () => go("select"));
  }

  function rSummary() {
    const e = EX[S.exKey];
    if (S.reps <= 0) {
      root.innerHTML = `<div class="fl fl-center">
        <div class="fl-ic warn">${I("alert", 38)}</div><div class="fl-c-t">No reps counted</div>
        <div class="fl-c-d">I didn't catch any ${e.n.toLowerCase()}. Make sure your whole body is in frame with good light, then try again.</div>
        <div class="fl-f-foot"><button class="fl-btn-primary" id="retry">Try again</button><button class="fl-btn-ghost" onclick="location.href='index.html'">Exit</button></div></div>`;
      root.querySelector("#retry").addEventListener("click", () => go("getready")); return;
    }
    root.innerHTML = `<div class="fl fl-finish">
      <div class="fl-burst">${I("zap", 40)}</div><div class="fl-f-head">You crushed it!</div>
      <div class="fl-f-big">${S.reps}</div><div class="fl-f-sub">${e.n.toLowerCase()}</div>
      <div class="fl-f-stats"><div class="fl-f-st glass"><b>${mmss(S.secs)}</b><span>duration</span></div>
        <div class="fl-f-st glass"><b>${(S.reps * 0.4).toFixed(1)}</b><span>kcal</span></div>
        <div class="fl-f-st glass"><b>+${Math.round(S.reps * 2.6)}</b><span>points</span></div></div>
      <div class="fl-f-foot"><button class="fl-btn-primary" id="share">${I("share", 18)} Share clip</button>
        <button class="fl-btn-ghost" onclick="location.href='index.html'">Save &amp; done</button></div></div>`;
    say(S.reps + " " + e.n.toLowerCase());
    root.querySelector("#share").addEventListener("click", () => go("review"));
  }

  function rReview() {
    const e = EX[S.exKey];
    root.innerHTML = `<div class="fl fl-scr">
      <div class="fl-head"><button class="cm-x glass" id="back">${I("chevron", 20)}</button><div class="fl-title" style="font-size:20px">Share your set</div></div>
      <div class="fl-clip"><span class="fl-clip-badge">${I(e.i, 14)} ${S.reps}</span><div class="cm-fig">${skeletonSVG()}</div></div>
      <div class="fl-cap" contenteditable="true" id="cap">Just counted ${S.reps} ${e.n.toLowerCase()} with Buzzend 💪</div>
      <div class="fl-f-foot"><button class="fl-btn-primary" id="post">${I("share", 18)} Post to feed</button>
        <button class="fl-btn-ghost" id="discard" style="color:#ff6a62;border-color:rgba(255,106,98,.4)">Discard</button></div></div>`;
    const fig = root.querySelector(".cm-fig"); const setPose = poser(fig); setPose(0.55);
    root.querySelector("#back").addEventListener("click", () => go("summary"));
    root.querySelector("#discard").addEventListener("click", () => go("select"));
    root.querySelector("#post").addEventListener("click", () => go("uploading"));
  }

  function rUploading(fail) {
    const e = EX[S.exKey];
    root.innerHTML = `<div class="fl fl-scr fl-center">
      <div class="fl-clip" style="opacity:.55"><span class="fl-clip-badge">${I(e.i, 14)} ${S.reps}</span><div class="cm-fig">${skeletonSVG()}</div></div>
      <div class="fl-prog"><i id="bar"></i></div><div class="fl-prog-l" id="pl">Uploading your set… 0%</div></div>`;
    const fig = root.querySelector(".cm-fig"); poser(fig)(0.55);
    const bar = root.querySelector("#bar"), pl = root.querySelector("#pl"); let p = 0;
    const iv = setInterval(() => { p += 12 + Math.round(8 * (p < 60 ? 1 : 0.4)); if (p > 100) p = 100; bar.style.width = p + "%"; pl.textContent = "Uploading your set… " + p + "%";
      if (p >= 100) { clearInterval(iv); setTimeout(() => go(fail ? "uploadfail" : "posted"), 400); } }, 320);
    S.timers.push(iv);
  }
  function rUploadFail() {
    root.innerHTML = `<div class="fl fl-center">
      <div class="fl-ic bad">${I("alert", 38)}</div><div class="fl-c-t">Couldn't post</div>
      <div class="fl-c-d">Your set is saved on your device. Check your connection and try again.</div>
      <div class="fl-f-foot"><button class="fl-btn-primary" id="retry">Retry</button><button class="fl-btn-ghost" onclick="location.href='index.html'">Save for later</button></div></div>`;
    root.querySelector("#retry").addEventListener("click", () => go("uploading"));
  }
  function rPosted() {
    root.innerHTML = `<div class="fl fl-center">
      <div class="fl-ic">${I("success", 40)}</div><div class="fl-c-t">Posted to your feed</div>
      <div class="fl-c-d">Nice work — your set is live for friends to cheer on.</div>
      <div class="fl-f-foot"><button class="fl-btn-primary" onclick="location.href='../home/community.html'">${I("users", 18)} View in feed</button>
        <button class="fl-btn-ghost" onclick="location.href='index.html'">Done</button></div></div>`;
  }

  function start(mountEl, deep) {
    root = mountEl; S = { step: "select", exKey: "squat", reps: 0, secs: 0, granted: false, facing: "front", timers: [], raf: null };
    if (deep) {
      const m = deep.split(":"); S.exKey = "squat"; S.reps = 12; S.secs = 38; S.granted = true;
      if (m[0] === "camera" && m[1]) return clear(), (S.step = "camera"), rCamera(m[1]), window.Icons.init(root);
      if (m[0] === "uploadfail2") return clear(), rUploading(true), void window.Icons.init(root);
      return go(m[0]);
    }
    go("select");
  }
  return { start };
})();
