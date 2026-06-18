/* Buzzend Home — "Pro" redesign builders (V4 Focus · V5 Pulse · V6 Momentum).
   Modern, premium home variations grounded in the real Figma home mockups
   (figma-images/home/*): a combined goal/stats hero, Share action, friends
   leaderboard, active challenges, feed filter tabs and a video community feed.

   Reuses the existing system end-to-end — HomeData (DATA / ring / startWorkout /
   empty / checklist / sessionLog / workoutPicker / challenges), the Icons set,
   the dialog component, and the token / palette / font / light-dark system — so
   every color set, font and theme applies here too. Keeps ALL existing info:
   greeting · streak · daily-goal progress · steps · distance · calories · reps ·
   active minutes · today's workout · AI Pose Detection · friends leaderboard ·
   challenges · community feed · likes / views / share. */
window.HomePro = (function () {
  const I = (n, s) => window.Icons.svg(n, s);
  const H = window.HomeData;
  const sec = (t, link) => H.sec(t, link);

  const fmt = (v) => (v >= 1000 ? (v / 1000).toFixed(1).replace(/\.0$/, "") + "k" : "" + v);

  function motiv(streak) {
    if (!streak) return "Let's start your streak today.";
    if (streak < 3) return "Nice start — keep it going!";
    if (streak < 14) return "You're building momentum.";
    if (streak < 30) return "Don't break the chain!";
    return "You're on fire 🔥";
  }
  function goalMotiv(pct) {
    if (pct >= 100) return "Goal complete! 🎯";
    if (pct >= 60) return "Almost there!";
    if (pct >= 30) return "Halfway there!";
    return "Let's get moving!";
  }

  const shareBtn = (label) =>
    `<button class="pro-share-btn" onclick="event.stopPropagation();Buzzend.alert({icon:'share',title:'Share your progress',message:'Post your ${label} to the community feed and challenge friends.'})">${I("share", 14)} Share</button>`;

  /* ── Combined goal + stats spotlight (dark premium) — V4 / V6 ──
     Mirrors the Figma hero: ring (steps / goal) + distance + calories +
     active minutes + reps + streak + Share. */
  function goalSpotlight(state, d) {
    if (state === "new" || !d.steps) {
      return `<div class="pro-spot pro-spot-empty">
        <div class="ps-title">Set your daily goal</div>
        <div class="ps-sub">Track steps, distance &amp; calories alongside your AI workouts.</div>
        <button class="btn" style="background:#fff;color:var(--surface-inverse);height:48px;margin-top:14px;max-width:240px;margin-left:auto;margin-right:auto"
          onclick="Buzzend.alert({icon:'target',title:'Goal set!',message:'Your daily target is 6,000 steps.'})">${I("target", 18)} Set my goal</button></div>`;
    }
    const p = d.steps, w = d.workout;
    const ringHtml = H.ring({ pct: p.pct, size: 118, r: 50, stroke: 11,
      track: "rgba(255,255,255,.16)", prog: "var(--accent)",
      center: `<div class="rv">${p.value}</div><div class="rl">of ${p.goal}</div>` });
    const stat = (ic, v, l) => `<div class="ps-stat"><span class="psi">${I(ic, 16)}</span><div><div class="psv">${v}</div><div class="psl">${l}</div></div></div>`;
    return `<div class="pro-spot">
      <div class="ps-head">
        <div><div class="ps-eyebrow">${I("target", 13)} Today's goal · ${p.pct}%</div>
          <div class="ps-dist">${I("pin", 14)} ${p.distance} walked</div></div>
        <div class="ps-head-r">${shareBtn("daily progress")}<span class="pro-streak">${I("flame", 14)} ${w.streak}</span></div>
      </div>
      <div class="ps-body">${ringHtml}
        <div class="ps-stats">
          ${stat("flame", p.kcal + " kcal", "calories")}
          ${stat("activity", w.reps + " reps", "today")}
          ${stat("clock", p.active, "active")}
          ${stat("zap", w.today, "workouts")}
        </div></div></div>`;
  }

  /* ── "This week" streak calendar — models every day-state ──
     active (worked out) · missed (skipped) · today (current) · upcoming.
     Day-states are derived from the screen state so each state demonstrates
     a different case: full = all active, partial = has missed days, new = fresh start. */
  function streakWeek(state, w, tone) {
    const cls = tone === "light" ? " sw-light" : "";
    const labels = ["M", "T", "W", "T", "F", "S", "S"], todayIdx = 3;
    let active = 0, missed = 0;
    const cells = labels.map((lab, i) => {
      let st;
      if (i > todayIdx) st = "future";
      else if (i === todayIdx) st = (state === "new" || !w.today) ? "start" : "active";
      else if (state === "full") st = "active";       // long streak — every day done
      else if (state === "partial") st = "missed";    // broke it, restarted today
      else st = "future";                              // new user — no history yet
      if (st === "active") active++; else if (st === "missed") missed++;
      const pip = st === "active" ? `<span class="sd-pip sd-active">${I("check", 12)}</span>`
        : st === "start" ? `<span class="sd-pip sd-start"></span>`
        : st === "missed" ? `<span class="sd-pip sd-missed"></span>`
        : `<span class="sd-pip sd-future"></span>`;
      return `<div class="sd-cell${i === todayIdx ? " is-today" : ""}"><span class="sd-lab">${lab}</span>${pip}</div>`;
    }).join("");
    const cap = (!active && !missed) ? "Work out today to start your streak"
      : missed ? `${active} active · ${missed} missed this week`
      : "Every day this week — keep it going!";
    return `<div class="streak-week${cls}">${cells}</div>
      <div class="streak-cap${cls}">${I("flame", 13)} ${cap}</div>`;
  }

  /* ── AI Pose Detection band — primary CTA + streak detail (top of screen) ──
     Carries the streak forward from the old Figma header: a streak badge +
     a "this week" calendar that shows active / missed / today / upcoming days. */
  function aiBand(state, d) {
    const w = d.workout, streak = w.streak;
    const badge = streak > 0
      ? `<div class="ai-streak"><span class="ai-fl">${I("flame", 16)}</span><div><div class="ai-streak-n">${streak}</div><div class="ai-streak-l">day streak</div></div></div>`
      : `<div class="ai-streak ai-streak-0"><span class="ai-fl">${I("flame", 15)}</span><span>Start streak</span></div>`;
    const stats = state === "new" ? "" :
      `<div class="ai-stats"><span><b>${w.today}</b> today</span><span><b>${w.reps}</b> reps</span></div>`;
    return `<div class="pro-ai">
      <span class="pro-ai-bg">${I("dumbbell", 104)}</span>
      <div class="pro-ai-head"><div class="pro-ai-eyebrow">${I("zap", 13)} AI POSE DETECTION</div>${badge}</div>
      <div class="pro-ai-title">${state === "new" ? "Try your first AI workout" : "Start an AI workout"}</div>
      <div class="pro-ai-sub">Point your camera — every rep counted automatically.</div>
      ${stats}
      <button class="btn pro-ai-cta" onclick="HomeData.startWorkout('Squats')">${I("camera", 18)} ${state === "new" ? "Start now" : "Start AI Pose Detection"}</button>
      ${streakWeek(state, w)}</div>`;
  }

  /* ── V5 · Pulse top — modular & light: slim gradient CTA bar + light streak card ── */
  function aiPulse(state, d) {
    const w = d.workout;
    return `<div class="pulse-cta" onclick="HomeData.startWorkout('Squats')">
        <span class="pulse-cta-ic">${I("camera", 22)}</span>
        <div class="pulse-cta-t"><div class="pct-eyebrow">${I("zap", 11)} AI POSE DETECTION</div>
          <div class="pct-title">${state === "new" ? "Try your first AI workout" : "Start an AI workout"}</div></div>
        <span class="pct-go">${I("chevron", 20)}</span></div>
      <div class="pulse-streak">
        <div class="pls-stats">
          <div class="pls-stat"><span class="pls-ic cur">${I("flame", 15)}</span><div><div class="pls-v">${w.streak} days</div><div class="pls-l">Current streak</div></div></div>
          <div class="pls-stat"><span class="pls-ic best">${I("trophy", 15)}</span><div><div class="pls-v">${w.best} days</div><div class="pls-l">Best streak</div></div></div>
        </div>
        ${streakWeek(state, w, "light")}</div>`;
  }

  /* ── V6 · Momentum top — bold & streak-forward: giant streak number is the hero ── */
  function aiMomentum(state, d) {
    const w = d.workout, streak = w.streak;
    const streakBlock = streak > 0
      ? `<div class="mom-streak"><div class="mom-num">${streak}</div><div class="mom-slab"><span class="ai-fl">${I("flame", 13)}</span> DAY STREAK</div></div>`
      : `<div class="mom-streak mom-streak-0"><div class="mom-num">${I("flame", 32)}</div><div class="mom-slab">START STREAK</div></div>`;
    const motivLine = streak > 0 ? motiv(streak) : "Start your journey";
    return `<div class="pro-ai mom-ai">
      <span class="pro-ai-bg">${I("flame", 150)}</span>
      <div class="mom-head">${streakBlock}
        <div class="mom-r"><div class="mom-eyebrow">${I("zap", 12)} AI POSE DETECTION</div>
          <div class="mom-motiv">${motivLine}</div>
          <div class="mom-sub">Camera counts every rep automatically.</div></div></div>
      ${streakWeek(state, w)}
      <button class="btn pro-ai-cta mom-cta" onclick="HomeData.startWorkout('Squats')">${I("camera", 18)} ${state === "new" ? "Start now" : "Start AI Pose Detection"}</button></div>`;
  }

  /* ── V5: slim linear daily-goal banner ── */
  function goalBanner(state, d) {
    if (state === "new" || !d.steps) {
      return `<div class="pro-banner pro-banner-cta" onclick="Buzzend.alert({icon:'target',title:'Set your goal',message:'Your daily target is 6,000 steps.'})">
        <div><div class="pb-t">Set your daily goal</div><div class="pb-s">Tap to start tracking steps</div></div>
        <span class="pb-go">${I("chevron", 20)}</span></div>`;
    }
    const p = d.steps;
    return `<div class="pro-banner">
      <div class="pb-top"><div class="pb-t">${I("target", 15)} Daily goal</div>
        <div class="pb-top-r">${shareBtn("daily goal")}<span class="pro-streak sm">${I("flame", 13)} ${d.workout.streak}</span></div></div>
      <div class="pb-row"><div class="pb-val">${p.value} <span>/ ${p.goal} steps</span></div><div class="pb-pct">${p.pct}%</div></div>
      <div class="pb-bar"><i style="width:${p.pct}%"></i></div></div>`;
  }

  /* ── V5: 6 uniform metric tiles ──
     steps · distance · calories · reps · active minutes · streak. */
  function statTiles(state, d) {
    if (state === "new" || !d.steps) return "";
    const p = d.steps, w = d.workout;
    const tile = (ic, v, l, c) => `<div class="pro-tile"><span class="pt-ic" style="color:${c}">${I(ic, 20)}</span><div class="pt-v">${v}</div><div class="pt-l">${l}</div></div>`;
    return sec("Today at a glance", false) + `<div class="pro-tiles">
      ${tile("footprints", p.value, "steps", "var(--primary)")}
      ${tile("pin", p.distance, "distance", "var(--secondary)")}
      ${tile("flame", p.kcal, "calories", "var(--accent)")}
      ${tile("activity", w.reps, "reps", "var(--success)")}
      ${tile("clock", p.active, "active min", "var(--secondary)")}
      ${tile("flame", w.streak, "day streak", "var(--accent)")}</div>`;
  }

  /* ── V6: motivational gradient hero (streak-forward) ── */
  function momentumHero(state, d) {
    const w = d.workout;
    if (state === "new" || !d.steps) {
      return `<div class="pro-hero"><span class="ph-bg">${I("flame", 150)}</span>
        <div class="ph-l"><div class="ph-streak">${I("flame", 15)} Start your streak</div>
          <div class="ph-title">Welcome to Buzzend</div>
          <div class="ph-sub">Do your first AI workout to begin.</div></div></div>`;
    }
    const p = d.steps;
    const ringHtml = H.ring({ pct: p.pct, size: 96, r: 40, stroke: 9, track: "rgba(255,255,255,.22)", prog: "#fff", center: `<div class="phr-v">${p.pct}%</div>` });
    return `<div class="pro-hero"><span class="ph-bg">${I("flame", 150)}</span>
      <div class="ph-l"><div class="ph-streak">${I("flame", 15)} ${w.streak}-day streak</div>
        <div class="ph-title">${motiv(w.streak)}</div>
        <div class="ph-sub">${p.value} / ${p.goal} steps · ${p.distance}</div>
        ${shareBtn("streak")}</div>
      ${ringHtml}</div>`;
  }

  /* ── V6: horizontal stat pills (steps/distance/calories/reps/active) ── */
  function statPills(state, d) {
    const p = d.steps; if (!p) return "";
    const w = d.workout;
    const pill = (ic, v, l) => `<div class="pro-pill"><span>${I(ic, 15)}</span><div><div class="pp-v">${v}</div><div class="pp-l">${l}</div></div></div>`;
    return `<div class="pro-pills">
      ${pill("footprints", p.value, "steps")}${pill("pin", p.distance, "distance")}
      ${pill("flame", p.kcal, "kcal")}${pill("activity", w.reps, "reps")}${pill("clock", p.active, "active")}</div>`;
  }

  /* ── Friends leaderboard — podium (V4/V6) ── */
  function leaderPodium(state, d) {
    const h = sec("Friends leaderboard", state === "full");
    if (!d.friends.length) return h + H.empty("users", "Add your friends", "Compare steps and cheer each other on. It's more fun together!", "Find friends");
    const top = d.friends.slice(0, 3);
    const podium = [1, 0, 2].map((idx) => { const f = top[idx]; if (!f) return ""; const rank = idx + 1;
      return `<div class="pod pod${rank}"><div class="pod-av" style="background-image:linear-gradient(135deg,#b8c6d1,#8aa0b3)"><span class="pod-rank r${rank}">${rank}</span></div>
        <div class="pod-n">${f.n}</div><div class="pod-s">${f.s} steps</div></div>`; }).join("");
    const rest = d.friends.slice(3).map((f, i) => `<div class="lr"><span class="lr-rank">${i + 4}</span>
      <div class="lr-av" style="background-image:linear-gradient(135deg,#caa,#a77)"></div><div class="lr-n">${f.n}</div><div class="lr-s">${f.s} steps</div></div>`).join("");
    const invite = `<div class="lr lr-invite" onclick="Buzzend.alert({icon:'users',title:'Invite friends',message:'Share your invite link to compete together.'})"><span class="lr-rank">${I("plus", 16)}</span><div class="lr-n">Invite friends</div></div>`;
    return h + `<div class="pro-podium">${podium}</div><div class="pro-leadlist">${rest}${invite}</div>`;
  }

  /* ── Friends leaderboard — compact ranked list (V5) ── */
  function leaderList(state, d) {
    const h = sec("Friends leaderboard", state === "full");
    if (!d.friends.length) return h + H.empty("users", "Add your friends", "Compare steps and cheer each other on.", "Find friends");
    const rows = d.friends.map((f, i) => { const rank = f.r || i + 1;
      return `<div class="ll-row"><span class="ll-rank rank${rank <= 3 ? rank : "x"}">${rank}</span>
        <div class="ll-av" style="background-image:linear-gradient(135deg,#b8c6d1,#8aa0b3)"></div>
        <div class="ll-n">${f.n}</div><div class="ll-s">${f.s}<span> steps</span></div></div>`; }).join("");
    return h + `<div class="pro-llist">${rows}
      <div class="ll-row ll-invite" onclick="Buzzend.alert({icon:'users',title:'Invite friends'})">${I("plus", 16)}<span>Invite friends to compete</span></div></div>`;
  }

  /* ── Community feed filter tabs (Feed / Following / Challenges) ── */
  function feedTabs() {
    const t = (label, on) => `<button class="pro-tab ${on ? "on" : ""}" onclick="HomePro.switchTab(this)">${label}</button>`;
    return `<div class="pro-tabs">${t("Feed", true)}${t("Following", false)}${t("Challenges", false)}</div>`;
  }
  function switchTab(el) { el.parentNode.querySelectorAll(".pro-tab").forEach((b) => b.classList.toggle("on", b === el)); }

  /* ── Community feed ── three clean designs (research-driven) ──
     feed (clean card · default) · feedActivity (Strava-style list) · feedImmersive (Reels-style). */
  const MEDIA = ["linear-gradient(135deg,#3a5a40,#588157)", "linear-gradient(135deg,#22555f,#2a9d8f)", "linear-gradient(135deg,#3d3a5b,#5e60ce)"];
  const media = (i) => MEDIA[i % MEDIA.length];
  const avatar = (g) => `style="background-image:linear-gradient(135deg,${g})"`;
  const AVS = ["#c9a6a6,#a77", "#9bb7c9,#5e7d99", "#c9c19b,#9a8c5e"];
  const feedEmpty = (h) => h + H.empty("share", "Your feed is quiet", "Follow people or join a challenge to see posts and activity here.", "Discover people");

  // V1 · clean card (Instagram / Facebook style)
  function feed(state, d) {
    const h = sec("Community", state === "full");
    if (!d.feed.length) return feedEmpty(h);
    return h + feedTabs() + d.feed.map((p, i) => `<div class="fc-post">
      <div class="fc-head"><div class="fc-av" ${avatar(AVS[i % 3])}></div>
        <div class="fc-meta"><div class="fc-n">${p.n}</div><div class="fc-t">${p.t} · <span class="fc-tag">${p.tag}</span></div></div>
        <span class="fc-ex">${I(p.ex || "activity", 18)}</span></div>
      ${p.action ? `<div class="fc-cap">${p.action}</div>` : ""}
      <div class="fc-media" style="background:${media(i)}"><div class="fc-play">${I("play", 22)}</div><span class="fc-dur">${p.dur || ""}</span></div>
      <div class="fc-actions">
        <button class="fc-act">${I("heart", 20)}<b>${p.likes}</b></button>
        <button class="fc-act">${I("eye", 19)}<b>${fmt(p.views || 0)}</b></button>
        <button class="fc-act fc-share">${I("share", 19)} Share</button></div></div>`).join("");
  }

  // V2 · activity list (Strava style — compact, scannable)
  function feedActivity(state, d) {
    const h = sec("Community", state === "full");
    if (!d.feed.length) return feedEmpty(h);
    return h + feedTabs() + `<div class="fa-list">` + d.feed.map((p, i) => `<div class="fa-row">
      <div class="fa-av" ${avatar(AVS[i % 3])}></div>
      <div class="fa-body">
        <div class="fa-top"><span class="fa-n">${p.n}</span><span class="fa-t">${p.t}</span></div>
        <div class="fa-action"><span class="fa-ex">${I(p.ex || "activity", 15)}</span> ${p.action || p.tag}</div>
        <div class="fa-stats"><span>${I("heart", 14)} ${p.likes}</span><span>${I("eye", 14)} ${fmt(p.views || 0)}</span><span>${I("share", 13)} Share</span></div>
      </div>
      <div class="fa-thumb" style="background:${media(i)}"><span>${I("play", 16)}</span></div></div>`).join("") + `</div>`;
  }

  // V3 · immersive media (Reels / TikTok style — full-bleed cards)
  function feedImmersive(state, d) {
    const h = sec("Community", state === "full");
    if (!d.feed.length) return feedEmpty(h);
    return h + feedTabs() + d.feed.map((p, i) => `<div class="fi-post" style="background:${media(i)}">
      <div class="fi-top"><div class="fi-av" ${avatar(AVS[i % 3])}></div><div class="fi-n">${p.n}<span>${p.t}</span></div><button class="fi-follow">Follow</button></div>
      <div class="fi-play">${I("play", 24)}</div>
      <div class="fi-side">
        <span class="fi-s">${I("heart", 23)}<b>${p.likes}</b></span>
        <span class="fi-s">${I("eye", 22)}<b>${fmt(p.views || 0)}</b></span>
        <span class="fi-s">${I("share", 21)}</span></div>
      <div class="fi-cap"><span class="fi-tag">${I(p.ex || "activity", 13)} ${p.tag}</span>${p.action ? `<div class="fi-action">${p.action}</div>` : ""}</div></div>`).join("");
  }

  /* ════ Combined "Today" card — daily goal + today's workouts in ONE card ════
     kind: 'spot' (V4, dark) · 'banner' (V5, light) · 'hero' (V6, gradient).
     The colored goal header and the workout log share a single card. */
  function comboGoalTop(state, d, kind, opts) {
    const w = d.workout, p = d.steps;

    if (kind === "banner") {
      if (state === "new" || !p) {
        return `<div class="pb-top"><div class="pb-t">${I("target", 15)} Daily goal</div></div>
          <div class="combo-goalcta-l">Set a daily step goal to track progress.
            <button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="Buzzend.alert({icon:'target',title:'Goal set!',message:'Your daily target is 6,000 steps.'})">${I("target", 16)} Set my goal</button></div>`;
      }
      return `<div class="pb-top"><div class="pb-t">${I("target", 15)} Daily goal</div>
          <div class="pb-top-r">${shareBtn("daily goal")}</div></div>
        <div class="pb-row"><div class="pb-val">${p.value} <span>/ ${p.goal} steps</span></div><div class="pb-pct">${p.pct}%</div></div>
        <div class="pb-bar"><i style="width:${p.pct}%"></i></div>
        ${opts && opts.stats ? `<div class="pb-stats">
          <div class="pbs"><span class="pbs-ic">${I("pin", 15)}</span><div><div class="pbs-v">${p.distance}</div><div class="pbs-l">distance</div></div></div>
          <div class="pbs"><span class="pbs-ic">${I("clock", 15)}</span><div><div class="pbs-v">${p.active}</div><div class="pbs-l">active min</div></div></div></div>` : ""}`;
    }

    if (kind === "hero") {
      if (state === "new" || !p) {
        return `<span class="ph-bg">${I("flame", 140)}</span><div class="ph-l">
          <div class="ph-eyebrow">${I("target", 13)} Today's goal</div>
          <div class="ph-title">Welcome to Buzzend</div><div class="ph-sub">Do your first AI workout to begin.</div></div>`;
      }
      const ringHtml = H.ring({ pct: p.pct, size: 92, r: 38, stroke: 9, track: "var(--surface-alt)", prog: "var(--primary)", center: `<div class="phr-v">${p.pct}%</div>` });
      const cg = (v, l) => `<div class="cg"><div class="cgv">${v}</div><div class="cgl">${l}</div></div>`;
      return `<span class="ph-bg">${I("flame", 140)}</span>
        <div class="ph-l"><div class="ph-eyebrow">${I("target", 13)} Today's goal · ${p.pct}%</div>
          <div class="ph-title">${goalMotiv(p.pct)}</div>
          <div class="ph-sub">${p.value} / ${p.goal} steps today</div>
          ${shareBtn("progress")}</div>
        ${ringHtml}
        <div class="combo-glass">${cg(p.value, "steps")}${cg(p.distance, "distance")}${cg(p.kcal, "kcal")}${cg(w.reps, "reps")}${cg(p.active, "active")}</div>`;
    }

    // kind === "spot"
    if (state === "new" || !p) {
      return `<div class="ps-eyebrow">${I("target", 13)} Today's goal</div>
        <div class="combo-goalcta">Set a daily step goal to track progress alongside your workouts.
          <button class="btn" style="background:#fff;color:var(--surface-inverse);height:44px;margin-top:12px;max-width:220px" onclick="Buzzend.alert({icon:'target',title:'Goal set!',message:'Your daily target is 6,000 steps.'})">${I("target", 16)} Set my goal</button></div>`;
    }
    const ringHtml = H.ring({ pct: p.pct, size: 104, r: 44, stroke: 10, track: "rgba(255,255,255,.16)", prog: "var(--accent)", center: `<div class="rv">${p.value}</div><div class="rl">/ ${p.goal}</div>` });
    const stat = (ic, v, l) => `<div class="ps-stat"><span class="psi">${I(ic, 15)}</span><div><div class="psv">${v}</div><div class="psl">${l}</div></div></div>`;
    return `<div class="ps-head"><div><div class="ps-eyebrow">${I("target", 13)} Today's goal · ${p.pct}%</div>
        <div class="ps-dist">${I("pin", 13)} ${p.distance} walked</div></div>
        <div class="ps-head-r">${shareBtn("daily progress")}</div></div>
      <div class="ps-body">${ringHtml}<div class="ps-stats">
        ${stat("flame", p.kcal + " kcal", "calories")}${stat("activity", w.reps + " reps", "today")}
        ${stat("clock", p.active, "active")}${stat("zap", w.today, "workouts")}</div></div>`;
  }

  /* The workouts body is laid out DIFFERENTLY per variant so each combined
     card reads as its own design:
       spot   → vertical LIST rows      (V4)
       banner → horizontal RAIL of cards (V5)
       hero   → 2-column GRID of tiles   (V6)  */
  function comboWorkouts(state, d, kind, opts) {
    const layout = kind === "banner" ? "rail" : kind === "hero" ? "grid" : "list";
    const has = d.sessions && d.sessions.length;
    const head = `<div class="combo-sec"><h3>Today's workouts</h3>${has ? '<a href="#">See all</a>' : ""}</div>`;
    if (!has) {
      return head + `<div class="combo-empty"><div class="ce-ic">${I("activity", 30)}</div>
        <div class="ce-t">No workouts yet today</div>
        <div class="ce-d">Start your first AI workout — reps are counted automatically.</div>
        <button class="btn btn-primary" style="height:46px;margin-top:12px" onclick="HomeData.startWorkout('Squats')">${I("camera", 17)} Start a workout</button></div>`;
    }
    const tReps = d.sessions.reduce((a, s) => a + s.reps, 0), tKcal = d.sessions.reduce((a, s) => a + s.kcal, 0);
    const summary = `<div class="combo-summary"><span><b>${d.sessions.length}</b> workouts</span><span><b>${tReps}</b> reps</span><span><b>${tKcal}</b> kcal</span></div>`;

    if (layout === "list") {
      const rows = d.sessions.map((s) => `<div class="combo-row"><div class="cr-ic">${I(s.i, 20)}</div>
        <div class="cr-mid"><div class="cr-n">${s.n}</div><div class="cr-m">${s.kcal} kcal</div></div>
        <div class="cr-end"><div class="cr-reps">${s.reps} reps</div><div class="cr-t">${s.t}</div></div></div>`).join("");
      return head + summary + `<div class="combo-list">${rows}
        <div class="combo-add" onclick="HomeData.startWorkout('another')">${I("plus", 16)} Start another workout</div></div>`;
    }

    if (layout === "rail") {
      const cards = d.sessions.map((s) => `<div class="cw-card"><div class="cw-ic">${I(s.i, 22)}</div>
        <div class="cw-n">${s.n}</div><div class="cw-reps">${s.reps}<span> reps</span></div>
        <div class="cw-meta">${s.kcal} kcal</div></div>`).join("");
      const add = `<div class="cw-card cw-add" onclick="HomeData.startWorkout('another')">${I("plus", 22)}<div>Start<br>another</div></div>`;
      return head + summary + `<div class="combo-rail">${opts && opts.addFirst ? add + cards : cards + add}</div>`;
    }

    // grid (V6)
    const tiles = d.sessions.map((s) => `<div class="cw-tile">
      <div class="cw-top"><span class="cw-ic">${I(s.i, 18)}</span><span class="cw-reps">${s.reps}<span> reps</span></span></div>
      <div class="cw-n">${s.n}</div><div class="cw-meta">${s.kcal} kcal · ${s.t}</div></div>`).join("");
    return head + `<div class="combo-grid">${tiles}
      <div class="cw-tile cw-add" onclick="HomeData.startWorkout('another')">${I("plus", 18)} New workout</div></div>`;
  }

  function todayCard(state, d, kind, opts) {
    return `<div class="pro-combo combo-${kind}"><div class="combo-top">${comboGoalTop(state, d, kind, opts)}</div>
      <div class="combo-body">${comboWorkouts(state, d, kind, opts)}</div></div>`;
  }

  /* ── Active challenges (V7) — circular progress ring + group-chat button ── */
  function challengesPro(state, d) {
    const h = sec("Active challenges", state === "full");
    if (!d.challenges.length) return h + H.empty("trophy", "No challenges yet", "Join a challenge to compete with friends and stay motivated.", "Browse challenges");
    return h + `<div class="h-scroll">` + d.challenges.map((c) => {
      const ring = H.ring({ pct: c.p, size: 50, r: 21, stroke: 5.5, track: "var(--surface-alt)", prog: "var(--primary)", center: `<div class="cx-pct">${c.p}%</div>` });
      return `<div class="chalx">
        <div class="chalx-ring">${ring}<span class="chalx-ex" style="color:var(--primary)">${I(c.i, 11)}</span></div>
        <div class="chalx-info"><div class="cx-name">${c.n}</div><div class="cx-meta">${c.m}</div></div>
        <button class="chalx-chat" onclick="Buzzend.alert({icon:'comment',title:'${c.n} · Chat',message:'Open the challenge group chat to cheer members on and share your progress.'})">${I("comment", 16)}</button></div>`;
    }).join("") + `</div>`;
  }

  /* ── League (V7) — weekly division ranked by Active points (steps + AI reps) ── */
  const LEAGUE = {
    tier: "Gold League", left: "4d", promote: 5,
    rows: [
      { rank: 1, n: "Anita Malan", pts: 3120, av: "#b8c6d1,#8aa0b3" },
      { rank: 2, n: "Ravi Thapa",  pts: 2940, av: "#c9a6a6,#a87" },
      { rank: 3, n: "Sita Rai",    pts: 2710, av: "#a6c9b5,#5e996f" },
      { rank: 4, n: "Ema William", pts: 2480, av: "#6a8caf,#33566f", you: true },
      { rank: 5, n: "Kiran Shah",  pts: 2150, av: "#c9c19b,#9a8c5e" },
      { rank: 6, n: "Maya Gurung", pts: 1980, av: "#9bb7c9,#5e7d99" },
    ],
  };
  function leagueBoard(state, d) {
    const L = LEAGUE;
    const rows = L.rows.map((r) => {
      const cls = r.rank <= 3 ? ` rank${r.rank}` : (r.rank <= L.promote ? " promo" : "");
      const row = `<div class="lg-row${r.you ? " you" : ""}">
        <span class="lg-rank${cls}">${r.rank}</span>
        <div class="lg-av" style="background-image:linear-gradient(135deg,${r.av})"></div>
        <div class="lg-n">${r.n}${r.you ? ' <span class="lg-you">You</span>' : ""}</div>
        <div class="lg-pts">${r.pts.toLocaleString()}<span> pts</span></div></div>`;
      return row + (r.rank === L.promote ? `<div class="lg-divider"><span>${I("zap", 11)} Promotion zone · top ${L.promote} advance</span></div>` : "");
    }).join("");
    return sec("League", true) + `<div class="lg-card">
      <div class="lg-head"><span class="lg-badge">${I("trophy", 20)}</span>
        <div class="lg-h"><div class="lg-name">${L.tier}</div><div class="lg-sub">Active points = steps + AI reps this week</div></div>
        <span class="lg-timer">${I("clock", 13)} ${L.left} left</span></div>
      <div class="lg-list">${rows}</div></div>`;
  }

  /* ── Friends' activity rail (modernized "Friends Steps" — horizontal avatars) ── */
  function friendsRail(state, d) {
    const h = sec("Friends' activity", state === "full");
    if (!d.friends.length) return h + H.empty("users", "Add your friends", "Compare steps and cheer each other on. It's more fun together!", "Find friends");
    const items = d.friends.map((f, i) => {
      const r = f.r || i + 1;
      return `<div class="fr-item">
        <div class="fr-avwrap"><div class="fr-av rk${r}" style="background-image:linear-gradient(135deg,#b8c6d1,#8aa0b3)"></div>
          <span class="fr-rank rk${r}">${r}</span></div>
        <div class="fr-n">${f.n}</div><div class="fr-s">${f.s} steps</div></div>`;
    }).join("");
    const invite = `<div class="fr-item fr-add" onclick="Buzzend.alert({icon:'users',title:'Invite friends',message:'Share your invite link to compete and cheer each other on.'})">
      <div class="fr-avwrap"><div class="fr-av fr-plus">${I("plus", 22)}</div></div><div class="fr-n">Invite</div></div>`;
    return h + `<div class="h-scroll fr-scroll">${items}${invite}</div>`;
  }

  /* ── Friends' activity — rich session data: steps + 0..5 exercises + distance/kcal/active.
     Anita = max (5 exercises) · Ravi/Maya = medium (2) · Sita = steps only. No likes. ── */
  const EXC = { squat: "var(--primary)", pushup: "var(--secondary)", situp: "var(--accent)", jumping: "var(--success)", lunge: "#e25b40", walk: "#5e7d99" };
  const FRIENDS_ACT = [
    { n: "Anita Malan", t: "2h", av: "#b8c6d1,#8aa0b3", steps: "6.2k", dist: "4.1km", kcal: 520, active: "1h 10m",
      ex: [{ i: "squat", n: "Squats", r: 120 }, { i: "pushup", n: "Push-ups", r: 80 }, { i: "situp", n: "Sit-ups", r: 90 }, { i: "jumping", n: "Jumping Jacks", r: 60 }, { i: "lunge", n: "Lunges", r: 40 }] },
    { n: "Ravi Thapa", t: "4h", av: "#c9a6a6,#a87", steps: "5.1k", dist: "3.3km", kcal: 300, active: "40m",
      ex: [{ i: "pushup", n: "Push-ups", r: 90 }, { i: "situp", n: "Sit-ups", r: 70 }] },
    { n: "Maya Gurung", t: "6h", av: "#9bb7c9,#5e7d99", steps: "3.4k", dist: "2.2km", kcal: 210, active: "28m",
      ex: [{ i: "squat", n: "Squats", r: 60 }, { i: "jumping", n: "Jumping Jacks", r: 50 }] },
    { n: "Sita Rai", t: "5h", av: "#a6c9b5,#5e996f", steps: "8.4k", dist: "5.6km", kcal: 240, active: "1h 02m", ex: [] },
  ];
  const faHead = (f, right) => `<div class="fa-head"><div class="fa-av" style="background-image:linear-gradient(135deg,${f.av})"></div>
    <div class="fa-who"><div class="fa-n">${f.n}</div><div class="fa-t">${f.t} ago</div></div>${right || ""}</div>`;
  const faEmpty = (h) => h + H.empty("users", "Add your friends", "Follow friends to see their workouts here.", "Find friends");

  // baseline · feed (exercises summary + metric chips, scales via "+N more")
  function friendsActivity(state, d) {
    const h = sec("Friends' activity", state === "full");
    if (state === "new") return faEmpty(h);
    return h + FRIENDS_ACT.map((f) => {
      const pi = f.ex[0] ? f.ex[0].i : "walk";
      const sum = f.ex.length ? f.ex.slice(0, 2).map((e) => `${e.r} ${e.n}`).join(" · ") + (f.ex.length > 2 ? ` · +${f.ex.length - 2} more` : "") : `${f.dist} walk`;
      return `<div class="fa-card">${faHead(f)}
        <div class="fa-ex"><span class="fa-exic">${I(pi, 15)}</span><span class="fa-exsum">${sum}</span></div>
        <div class="fa-metrics"><span class="fa-m">${I("footprints", 14)} ${f.steps}</span><span class="fa-m">${I("flame", 14)} ${f.kcal} kcal</span><span class="fa-m">${I("clock", 14)} ${f.active}</span></div></div>`;
    }).join("");
  }

  // A · chips grid — every data point is a chip that wraps (1 → 6+ cleanly)
  function friendsChips(state, d) {
    const h = sec("Friends' activity", state === "full");
    if (state === "new") return faEmpty(h);
    return h + FRIENDS_ACT.map((f) => `<div class="fc2-card">${faHead(f)}
      <div class="fc2-chips"><span class="fc2-chip fc2-steps">${I("footprints", 13)} ${f.steps}</span>${f.ex.map((e) => `<span class="fc2-chip">${I(e.i, 13)} ${e.r}</span>`).join("")}</div>
      <div class="fc2-foot"><span>${I("flame", 13)} ${f.kcal} kcal</span><span>${I("clock", 13)} ${f.active}</span><span>${I("pin", 13)} ${f.dist}</span></div></div>`).join("");
  }

  // B · breakdown bar — stacked rep distribution by exercise (steps-progress bar when no reps)
  function friendsBars(state, d) {
    const h = sec("Friends' activity", state === "full");
    if (state === "new") return faEmpty(h);
    return h + FRIENDS_ACT.map((f) => {
      const total = f.ex.reduce((a, e) => a + e.r, 0);
      let bar, legend, right;
      if (f.ex.length) {
        bar = f.ex.map((e) => `<i style="width:${(e.r / total * 100).toFixed(1)}%;background:${EXC[e.i]}"></i>`).join("");
        legend = f.ex.map((e) => `<span class="fb-leg"><i style="background:${EXC[e.i]}"></i>${e.n} ${e.r}</span>`).join("");
        right = `<span class="fb-total">${total} reps</span>`;
      } else {
        const pct = Math.min(parseFloat(f.steps) * 1000 / 10000 * 100, 100).toFixed(0);
        bar = `<i style="width:${pct}%;background:var(--primary)"></i>`;
        legend = `<span class="fb-leg"><i style="background:var(--primary)"></i>Steps only · ${f.steps} of 10k goal</span>`;
        right = `<span class="fb-total">${f.steps} steps</span>`;
      }
      return `<div class="fb-card">${faHead(f, right)}
        <div class="fb-bar">${bar}</div><div class="fb-legend">${legend}</div>
        <div class="fb-metrics"><span>${I("footprints", 13)} ${f.steps}</span><span>${I("flame", 13)} ${f.kcal} kcal</span><span>${I("clock", 13)} ${f.active}</span></div></div>`;
    }).join("");
  }

  // C · compact list — dominant activity + "+N more", one key metric (densest)
  function friendsCompact(state, d) {
    const h = sec("Friends' activity", state === "full");
    if (state === "new") return faEmpty(h);
    return h + `<div class="fco-list">` + FRIENDS_ACT.map((f) => {
      const pi = f.ex[0] ? f.ex[0].i : "walk";
      const head = f.ex[0] ? `${f.ex[0].r} ${f.ex[0].n}` : `${f.steps} steps`;
      const more = f.ex.length > 1 ? `+${f.ex.length - 1} more` : (f.ex.length === 0 ? f.dist : "");
      return `<div class="fco-row"><div class="fa-av sm" style="background-image:linear-gradient(135deg,${f.av})"></div>
        <div class="fco-info"><div class="fco-top">${f.n} <span>· ${f.t} ago</span></div>
          <div class="fco-act"><span class="fco-ic">${I(pi, 13)}</span>${head}${more ? ` <span class="fco-more">· ${more}</span>` : ""}</div></div>
        <div class="fco-kcal">${I("flame", 13)} ${f.kcal}</div></div>`;
    }).join("") + `</div>`;
  }

  /* ── Top activities — switch between globally Top-ranked people and Friends ──
     Same scalable activity card; Top view adds a rank badge (ordered by activity). */
  const TOP_ACT = [
    { n: "Bishal Karki", t: "1h", av: "#b9a6c9,#6d5e99", steps: "12.4k", dist: "8.2km", kcal: 920, active: "1h 48m",
      ex: [{ i: "squat", n: "Squats", r: 200 }, { i: "pushup", n: "Push-ups", r: 150 }, { i: "situp", n: "Sit-ups", r: 140 }, { i: "jumping", n: "Jumping Jacks", r: 120 }, { i: "lunge", n: "Lunges", r: 90 }] },
    { n: "Priya Sharma", t: "2h", av: "#c9a6a6,#a87", steps: "10.8k", dist: "7.1km", kcal: 760, active: "1h 30m",
      ex: [{ i: "pushup", n: "Push-ups", r: 160 }, { i: "squat", n: "Squats", r: 130 }, { i: "lunge", n: "Lunges", r: 80 }] },
    { n: "Sara Lama", t: "3h", av: "#a6c9b5,#5e996f", steps: "11.2k", dist: "7.4km", kcal: 540, active: "1h 05m", ex: [] },
    { n: "Dev Gurung", t: "3h", av: "#9bb7c9,#5e7d99", steps: "9.5k", dist: "6.3km", kcal: 680, active: "1h 12m",
      ex: [{ i: "situp", n: "Sit-ups", r: 180 }, { i: "jumping", n: "Jumping Jacks", r: 140 }] },
  ];
  const rankBadge = (r) => r ? `<span class="ta-rank rank${r <= 3 ? r : "x"}">${r}</span>` : "";
  const headOf = (p, rank, right) => `<div class="fa-head">${rankBadge(rank)}<div class="fa-av" style="background-image:linear-gradient(135deg,${p.av})"></div>
    <div class="fa-who"><div class="fa-n">${p.n}</div><div class="fa-t">${p.t} ago</div></div>${right || ""}</div>`;

  // card styles — each takes a person + optional rank, scales to 0..5 exercises
  function cardFeed(p, rank) {
    const pi = p.ex[0] ? p.ex[0].i : "walk";
    const sum = p.ex.length ? p.ex.slice(0, 2).map((e) => `${e.r} ${e.n}`).join(" · ") + (p.ex.length > 2 ? ` · +${p.ex.length - 2} more` : "") : `${p.dist} walk`;
    return `<div class="fa-card">${headOf(p, rank)}
      <div class="fa-ex"><span class="fa-exic">${I(pi, 15)}</span><span class="fa-exsum">${sum}</span></div>
      <div class="fa-metrics"><span class="fa-m">${I("footprints", 14)} ${p.steps}</span><span class="fa-m">${I("flame", 14)} ${p.kcal} kcal</span><span class="fa-m">${I("clock", 14)} ${p.active}</span></div></div>`;
  }
  function cardChips(p, rank) {
    return `<div class="fc2-card">${headOf(p, rank)}
      <div class="fc2-chips"><span class="fc2-chip fc2-steps">${I("footprints", 13)} ${p.steps}</span>${p.ex.map((e) => `<span class="fc2-chip">${I(e.i, 13)} ${e.r}</span>`).join("")}</div>
      <div class="fc2-foot"><span>${I("flame", 13)} ${p.kcal} kcal</span><span>${I("clock", 13)} ${p.active}</span><span>${I("pin", 13)} ${p.dist}</span></div></div>`;
  }
  function cardBars(p, rank) {
    const total = p.ex.reduce((a, e) => a + e.r, 0);
    let bar, legend, right;
    if (p.ex.length) {
      bar = p.ex.map((e) => `<i style="width:${(e.r / total * 100).toFixed(1)}%;background:${EXC[e.i]}"></i>`).join("");
      legend = p.ex.map((e) => `<span class="fb-leg"><i style="background:${EXC[e.i]}"></i>${e.n} ${e.r}</span>`).join("");
      right = `${total} reps`;
    } else {
      const pct = Math.min(parseFloat(p.steps) * 1000 / 10000 * 100, 100).toFixed(0);
      bar = `<i style="width:${pct}%;background:var(--primary)"></i>`;
      legend = `<span class="fb-leg"><i style="background:var(--primary)"></i>Steps only · ${p.steps} of 10k goal</span>`;
      right = `${p.steps} steps`;
    }
    return `<div class="fb-card">${headOf(p, rank, `<span class="fb-total">${right}</span>`)}
      <div class="fb-bar">${bar}</div><div class="fb-legend">${legend}</div>
      <div class="fb-metrics"><span>${I("footprints", 13)} ${p.steps}</span><span>${I("flame", 13)} ${p.kcal} kcal</span><span>${I("clock", 13)} ${p.active}</span></div></div>`;
  }
  function cardCompact(p, rank) {
    const pi = p.ex[0] ? p.ex[0].i : "walk";
    const head = p.ex[0] ? `${p.ex[0].r} ${p.ex[0].n}` : `${p.steps} steps`;
    const more = p.ex.length > 1 ? `+${p.ex.length - 1} more` : (p.ex.length === 0 ? p.dist : "");
    return `<div class="fco-row">${rankBadge(rank)}<div class="fa-av sm" style="background-image:linear-gradient(135deg,${p.av})"></div>
      <div class="fco-info"><div class="fco-top">${p.n} <span>· ${p.t} ago</span></div>
        <div class="fco-act"><span class="fco-ic">${I(pi, 13)}</span>${head}${more ? ` <span class="fco-more">· ${more}</span>` : ""}</div></div>
      <div class="fco-kcal">${I("flame", 13)} ${p.kcal}</div></div>`;
  }
  const CARDS = { feed: cardFeed, chips: cardChips, bars: cardBars, compact: cardCompact };

  function topActivities(state, d, variant) {
    variant = variant || "chips";
    const h = sec("Top activities", state === "full");
    const card = CARDS[variant] || cardChips;
    const wrap = (html) => variant === "compact" ? `<div class="fco-list">${html}</div>` : html;
    const tabs = `<div class="ta-tabs">
      <button class="ta-tab on" onclick="HomePro.scope(this,'top')">${I("trophy", 14)} Top</button>
      <button class="ta-tab" onclick="HomePro.scope(this,'friends')">${I("users", 14)} Friends</button></div>`;
    const top = wrap(TOP_ACT.map((p, i) => card(p, i + 1)).join(""));
    const friends = state === "new"
      ? H.empty("users", "No friends yet", "Follow friends to see their activity here.", "Find friends")
      : wrap(FRIENDS_ACT.map((p) => card(p)).join(""));
    return h + `<div class="ta-wrap scope-top">${tabs}<div class="ta-list ta-top">${top}</div><div class="ta-list ta-friends">${friends}</div></div>`;
  }
  function scope(btn, s) {
    const w = btn.closest(".ta-wrap"); w.className = "ta-wrap scope-" + s;
    w.querySelectorAll(".ta-tab").forEach((b) => b.classList.toggle("on", b === btn));
  }

  return { goalSpotlight, aiBand, aiPulse, aiMomentum, goalBanner, statTiles, momentumHero, statPills,
    leaderPodium, leaderList, leagueBoard, friendsRail, friendsActivity, friendsChips, friendsBars, friendsCompact,
    topActivities, scope, challengesPro, feedTabs, switchTab, feed, feedActivity, feedImmersive, todayCard };
})();
