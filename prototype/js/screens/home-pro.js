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
    const w = d.workout, streak = w.streak;
    const badge = `<span class="pls-badge"><span class="ai-fl">${I("flame", 14)}</span> ${streak > 0 ? streak + "-day streak" : "Start streak"}</span>`;
    return `<div class="pulse-cta" onclick="HomeData.startWorkout('Squats')">
        <span class="pulse-cta-ic">${I("camera", 22)}</span>
        <div class="pulse-cta-t"><div class="pct-eyebrow">${I("zap", 11)} AI POSE DETECTION</div>
          <div class="pct-title">${state === "new" ? "Try your first AI workout" : "Start an AI workout"}</div></div>
        <span class="pct-go">${I("chevron", 20)}</span></div>
      <div class="pulse-streak">
        <div class="pls-head"><div class="pls-h">This week</div>${badge}</div>
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

  /* ── Community video feed — likes / views / share ── */
  function feed(state, d) {
    const h = sec("Community", state === "full");
    if (!d.feed.length) return h + H.empty("share", "Your feed is quiet", "Follow people or join a challenge to see posts and activity here.", "Discover people");
    return h + feedTabs() + d.feed.map((p) => `<div class="pro-post">
      <div class="pp-head"><div class="pp-av" style="background-image:linear-gradient(135deg,#caa,#a77)"></div>
        <div class="pp-meta"><div class="pp-n">${p.n}</div><div class="pp-t">${p.t}</div></div><span class="pp-tag">${p.tag}</span></div>
      <div class="pp-media"><div class="pp-play">${I("play", 20)}</div><span class="pp-views">${I("eye", 12)} ${fmt(p.views || 0)} views</span></div>
      <div class="pp-actions"><span>${I("heart", 17)} ${p.likes}</span><span>${I("comment", 17)} ${p.comments}</span>
        <span class="pp-spacer"></span><span class="pp-share" onclick="Buzzend.alert({icon:'share',title:'Share post',message:'Share ${p.n}\\'s ${p.tag} clip.'})">${I("share", 16)} Share</span></div></div>`).join("");
  }

  /* ════ Combined "Today" card — daily goal + today's workouts in ONE card ════
     kind: 'spot' (V4, dark) · 'banner' (V5, light) · 'hero' (V6, gradient).
     The colored goal header and the workout log share a single card. */
  function comboGoalTop(state, d, kind) {
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
        <div class="pb-bar"><i style="width:${p.pct}%"></i></div>`;
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
  function comboWorkouts(state, d, kind) {
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
        <div class="cw-meta">${s.kcal} kcal · ${s.t}</div></div>`).join("");
      return head + summary + `<div class="combo-rail">${cards}
        <div class="cw-card cw-add" onclick="HomeData.startWorkout('another')">${I("plus", 22)}<div>Start<br>another</div></div></div>`;
    }

    // grid (V6)
    const tiles = d.sessions.map((s) => `<div class="cw-tile">
      <div class="cw-top"><span class="cw-ic">${I(s.i, 18)}</span><span class="cw-reps">${s.reps}<span> reps</span></span></div>
      <div class="cw-n">${s.n}</div><div class="cw-meta">${s.kcal} kcal · ${s.t}</div></div>`).join("");
    return head + `<div class="combo-grid">${tiles}
      <div class="cw-tile cw-add" onclick="HomeData.startWorkout('another')">${I("plus", 18)} New workout</div></div>`;
  }

  function todayCard(state, d, kind) {
    return `<div class="pro-combo combo-${kind}"><div class="combo-top">${comboGoalTop(state, d, kind)}</div>
      <div class="combo-body">${comboWorkouts(state, d, kind)}</div></div>`;
  }

  return { goalSpotlight, aiBand, aiPulse, aiMomentum, goalBanner, statTiles, momentumHero, statPills,
    leaderPodium, leaderList, feedTabs, switchTab, feed, todayCard };
})();
