/* Buzzend splash + onboarding builders. Reuses the Icons set + token system.
   OB.splash(v, el)      → render a splash variation (1|2|3)
   OB.onboarding(v, el)  → render an onboarding variation (1|2|3) */
window.OB = (function () {
  const I = (n, s) => window.Icons.svg(n, s);
  const LOGIN = "../auth/login.html"; // where "Get started" / "Log in" route

  // Buzzend lightning-bolt logo (brand gradient, or mono white on color/dark)
  function logo(size, tone) {
    const s = size || 64, fill = tone === "mono" ? "#fff" : "url(#bzg)";
    return `<svg class="bz-logo" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" aria-label="Buzzend">
      <defs><linearGradient id="bzg" x1="2" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="var(--primary)"/><stop offset="1" stop-color="var(--primary-deep)"/></linearGradient></defs>
      <path d="M13 2 L4 14 L10 14 L9 22 L18 10 L12 10 Z" fill="${fill}"/></svg>`;
  }
  const wordmark = (cls) => `<div class="bz-word ${cls || ""}">BUZZEND</div>`;

  // app value props (about Buzzend)
  const SLIDES = [
    { icon: "camera",   accent: "var(--primary)",   eyebrow: "AI Pose Detection", title: "Reps count themselves", text: "Point your camera and Buzzend counts every squat, push-up and sit-up for you — automatically, no tapping." },
    { icon: "trophy",   accent: "var(--accent)",    eyebrow: "Challenges",        title: "Compete with friends",  text: "Join daily and 30-day challenges, climb the leaderboard and keep each other moving." },
    { icon: "flame",    accent: "var(--success)",   eyebrow: "Streaks & Stats",   title: "Track every move",      text: "Steps, calories, active minutes and workout streaks — your whole day in one place." },
    { icon: "share",    accent: "var(--secondary)", eyebrow: "Community",          title: "Share your wins",       text: "Post your workouts, cheer on friends and grow stronger together." },
  ];

  const tint = (c, p) => `color-mix(in srgb, ${c} ${p}%, var(--surface))`;
  const go = () => { window.location.href = LOGIN; };

  /* ───────────── SPLASH ───────────── */
  function splash(v, el) {
    el.classList.add("splash", "sp-v" + v);
    const tone = v === "2" ? "mono" : "brand";
    el.innerHTML = `
      <div class="statusbar"><span>9:41</span><span>5G&nbsp;&nbsp;&middot;&nbsp;&nbsp;100%</span></div>
      <div class="sp-stage"><div class="sp-logo-wrap">${logo(76, tone)}${wordmark()}</div></div>
      <div class="sp-tag bz-tag">Fitness &amp; Challenge</div>
      <div class="sp-loader"><i></i></div>`;
  }

  /* ───────────── ONBOARDING ───────────── */
  function onboarding(v, el) {
    if (v === "3") return features(el);
    const carousel = v === "2" ? "ob-v2" : "ob-v1";
    el.classList.add("ob", carousel);
    let i = 0;
    const n = SLIDES.length;
    const render = v === "2" ? renderV2 : renderV1;
    el.innerHTML = render(i);
    el.addEventListener("click", (e) => {
      const t = e.target.closest("[data-action]"); if (!t) return;
      const a = t.getAttribute("data-action");
      if (a === "skip" || a === "start") return go();
      if (a === "next") i = Math.min(n - 1, i + 1);
      if (a === "dot") i = +t.getAttribute("data-i");
      el.innerHTML = render(i);
    });
  }

  function dots(i) {
    return `<div class="ob-dots">${SLIDES.map((_, k) =>
      `<i class="${k === i ? "on" : ""}" data-action="dot" data-i="${k}"></i>`).join("")}</div>`;
  }
  const cta = (i) => i === SLIDES.length - 1
    ? `<button class="btn btn-primary" data-action="start">${I("zap", 18)} Get Started</button>`
    : `<button class="btn btn-primary" data-action="next">Continue</button>`;
  const altLink = `<div class="ob-alt">Already have an account? <a data-action="skip">Log in</a></div>`;

  function renderV1(i) {
    const s = SLIDES[i];
    return `<button class="ob-skip" data-action="skip">Skip</button>
      <div class="ob-hero" style="background:${tint(s.accent, 14)}">
        <span class="ob-blob" style="width:230px;height:230px;background:${tint(s.accent, 26)};top:-40px;left:-40px"></span>
        <span class="ob-blob" style="width:150px;height:150px;background:${tint(s.accent, 22)};bottom:-30px;right:-20px"></span>
        <div class="ob-icon" style="color:${s.accent}">${I(s.icon, 56)}</div>
      </div>
      <div class="ob-body">
        ${dots(i)}
        <div class="ob-eyebrow" style="color:${s.accent}">${s.eyebrow}</div>
        <h1 class="ob-title">${s.title}</h1>
        <p class="ob-text">${s.text}</p>
        <div class="ob-foot">${cta(i)}${altLink}</div>
      </div>`;
  }

  function renderV2(i) {
    const s = SLIDES[i];
    return `<div class="ob-v2-top" style="background:linear-gradient(160deg, ${s.accent}, color-mix(in srgb, ${s.accent} 60%, #000 12%))">
        <button class="ob-skip light" data-action="skip">Skip</button>
        <span class="ob-blob" style="width:260px;height:260px;top:-60px;right:-70px"></span>
        <span class="ob-blob" style="width:160px;height:160px;bottom:30px;left:-50px"></span>
        <div class="ob-icon-lg">${I(s.icon, 60)}</div>
      </div>
      <div class="ob-sheet">
        ${dots(i)}
        <div class="ob-eyebrow" style="color:${s.accent}">${s.eyebrow}</div>
        <h1 class="ob-title">${s.title}</h1>
        <p class="ob-text">${s.text}</p>
        <div class="ob-foot">${cta(i)}${altLink}</div>
      </div>`;
  }

  function features(el) {
    el.classList.add("ob", "ob-v3");
    el.innerHTML = `<div class="ob-v3-scroll">
      <div class="ob-v3-head">${logo(58, "brand")}${wordmark("sm")}
        <h1>Welcome to Buzzend</h1><p>Your AI fitness &amp; challenge companion.</p></div>
      <div class="ob-feat-list">${SLIDES.map((s) => `<div class="ob-feat">
        <div class="ob-feat-ic" style="color:${s.accent};background:${tint(s.accent, 14)}">${I(s.icon, 24)}</div>
        <div><div class="ob-feat-t">${s.title}</div><div class="ob-feat-d">${s.text}</div></div></div>`).join("")}</div>
      <div class="ob-v3-foot">
        <button class="btn btn-primary" data-action="start">${I("zap", 18)} Get Started</button>
        ${altLink}</div></div>`;
    el.addEventListener("click", (e) => { if (e.target.closest("[data-action]")) go(); });
  }

  /* ───────────── AI POSE DETECTION focus ─────────────
     A person rendered with pose landmarks (joints) + skeleton edges,
     like a live pose-detection overlay. */
  const EDGES = [["neck", "sL"], ["neck", "sR"], ["sL", "sR"], ["sL", "eL"], ["eL", "wL"],
    ["sR", "eR"], ["eR", "wR"], ["sL", "hL"], ["sR", "hR"], ["hL", "hR"],
    ["hL", "kL"], ["kL", "aL"], ["hR", "kR"], ["kR", "aR"], ["neck", "head"]];

  // squat keyframes — FRONT-FACING. The body lowers and the thighs foreshorten
  // (knees travel toward the camera, staying ~stance-width) so it reads as a real
  // squat descent, not a wide sideways/sumo splay.
  const STAND = { head:[110,52],neck:[110,82], sL:[86,98],sR:[134,98], eL:[76,140],eR:[144,140], wL:[80,182],wR:[140,182], hL:[96,186],hR:[124,186], kL:[95,250],kR:[125,250], aL:[94,322],aR:[126,322] };
  const SQUAT = { head:[110,110],neck:[110,138], sL:[86,152],sR:[134,152], eL:[82,156],eR:[138,156], wL:[96,155],wR:[124,155], hL:[99,244],hR:[121,244], kL:[80,258],kR:[140,258], aL:[86,322],aR:[134,322] };
  const KEYS = { squat: { a: STAND, b: SQUAT, period: 2000, inc: 1 } };

  function poseFigure(accent, body) {
    const P = SQUAT; // initial frame = bottom of the squat
    const ln = (a, b, w, c) => `<line data-e="${a},${b}" x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
    const floor = `<ellipse cx="110" cy="334" rx="56" ry="8" fill="${body}"/>`;
    const silhouette = EDGES.map((e) => ln(e[0], e[1], 18, body)).join("") + `<circle data-j="head" cx="${P.head[0]}" cy="${P.head[1]}" r="21" fill="${body}"/>`;
    const skeleton = EDGES.map((e) => ln(e[0], e[1], 2.4, accent)).join("");
    const dots = Object.keys(P).map((k) =>
      `<circle class="lm" data-j="${k}" cx="${P[k][0]}" cy="${P[k][1]}" r="4.4" fill="#fff" stroke="${accent}" stroke-width="2.3"/>`).join("");
    return `<svg class="pose-fig" data-ex="squat" viewBox="0 0 220 360" fill="none">${floor}${silhouette}${skeleton}${dots}</svg>`;
  }

  // drive the rep: interpolate joints A↔B each frame, tick the rep counter
  function animateFigure(svg, repEl) {
    const k = KEYS[svg.getAttribute("data-ex")]; if (!k) return;
    const lines = svg.querySelectorAll("line[data-e]"), circles = svg.querySelectorAll("circle[data-j]");
    let reps = repEl ? (parseInt(repEl.textContent, 10) || 0) : 0, lastCyc = 0, start = performance.now();
    (function frame(now) {
      if (!svg.isConnected) return; // stop when the screen is swapped
      const el = now - start, cyc = Math.floor(el / k.period), ph = (el % k.period) / k.period;
      const t = (1 - Math.cos(ph * 2 * Math.PI)) / 2; // 0→1→0 ease over one rep
      if (cyc !== lastCyc) { lastCyc = cyc; if (repEl) repEl.textContent = (reps += k.inc); }
      const cur = {};
      Object.keys(k.a).forEach((j) => { cur[j] = [k.a[j][0] + (k.b[j][0] - k.a[j][0]) * t, k.a[j][1] + (k.b[j][1] - k.a[j][1]) * t]; });
      circles.forEach((c) => { const j = c.getAttribute("data-j"); if (cur[j]) { c.setAttribute("cx", cur[j][0].toFixed(1)); c.setAttribute("cy", cur[j][1].toFixed(1)); } });
      lines.forEach((l) => { const e = l.getAttribute("data-e").split(","), a = cur[e[0]], b = cur[e[1]]; if (a && b) { l.setAttribute("x1", a[0].toFixed(1)); l.setAttribute("y1", a[1].toFixed(1)); l.setAttribute("x2", b[0].toFixed(1)); l.setAttribute("y2", b[1].toFixed(1)); } });
      requestAnimationFrame(frame);
    })(start);
  }

  const POSE = {
    titles: { "1": "Reps count themselves", "2": "Every body point, tracked", "3": "Perfect squat form, live" },
    text: "Just point your camera. Buzzend reads your body and counts every squat for you — no tapping, no guesswork.",
  };

  function pose(v, el) {
    el.classList.add("ob", "pose-ob", "pose-v" + v);
    const content = `<div class="pose-content">
        <div class="ob-dots"><i class="on"></i><i></i><i></i><i></i></div>
        <div class="ob-eyebrow">${I("zap", 12)} AI Pose Detection</div>
        <h1 class="ob-title">${POSE.titles[v] || POSE.titles["1"]}</h1>
        <p class="ob-text">${POSE.text}</p>
        <div class="ob-foot"><button class="btn btn-primary" data-action="next">Continue</button></div></div>`;

    if (v === "1") {
      // camera viewfinder (dark)
      el.innerHTML = `<div class="pose-stage pose-dark">
          <button class="ob-skip light" data-action="skip">Skip</button>
          <span class="pb pb1"></span><span class="pb pb2"></span><span class="pb pb3"></span><span class="pb pb4"></span>
          <span class="pose-live">TRACKING</span>
          ${poseFigure("var(--accent)", "rgba(255,255,255,.13)")}
          <div class="pose-scan"></div>
          <div class="pose-rep"><div class="pr-n">8</div><div class="pr-l">SQUATS</div></div></div>
        ${content}`;
    } else if (v === "2") {
      // clean light
      el.innerHTML = `<button class="ob-skip" data-action="skip">Skip</button>
        <div class="pose-stage pose-light">
          <span class="pose-glow"></span>
          <span class="pose-chip">${I("zap", 11)} Real-time tracking</span>
          ${poseFigure("var(--primary)", "color-mix(in srgb, var(--primary) 15%, transparent)")}</div>
        ${content}`;
    } else {
      // gradient + landmark callouts
      el.innerHTML = `<div class="pose-stage pose-grad">
          <button class="ob-skip light" data-action="skip">Skip</button>
          ${poseFigure("#fff", "rgba(255,255,255,.2)")}
          <span class="pose-callout" style="top:46%;left:10%"><i></i>Hips</span>
          <span class="pose-callout" style="top:64%;right:12%"><i></i>Knees</span>
          <div class="pose-rep glass"><div class="pr-n">8</div><div class="pr-l">SQUATS</div></div></div>
        ${content}`;
    }
    animateFigure(el.querySelector(".pose-fig"), el.querySelector(".pr-n"));
    el.addEventListener("click", (e) => { if (e.target.closest("[data-action]")) go(); });
  }

  return { logo, wordmark, SLIDES, splash, onboarding, pose };
})();
