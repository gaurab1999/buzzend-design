/* Shared Home data + section builders.
   One source of truth for New / Partial / Full; each layout (V1/V2/V3)
   composes these builders. Uses the line-icon system (no emojis) for a
   premium, theme-aware look. */
window.HomeData = (function () {
  const I = (n, s) => window.Icons.svg(n, s);

  // exercise → icon mapping (line icons)
  const WORKOUTS = [
    { i:"squat", n:"Squats" }, { i:"pushup", n:"Push-ups" }, { i:"situp", n:"Sit-ups" },
    { i:"lunge", n:"Lunges" }, { i:"jumping", n:"Jumping Jacks" }, { i:"walk", n:"Walk" },
  ];

  const DATA = {
    full: {
      greeting: "Good morning", bell: true,
      workout: { today: 3, reps: 320, streak: 47, best: 60, activeMin: 38, activePct: 65 },
      steps: { value: "3,000", goal: "6,000", pct: 50, kcal: 200, active: "55m", distance: "3.8km" },
      sessions: [
        { i:"squat", n:"Squats", reps:120, kcal:60, t:"9:12 AM" },
        { i:"pushup", n:"Push-ups", reps:80, kcal:45, t:"12:30 PM" },
        { i:"situp", n:"Sit-ups", reps:120, kcal:50, t:"6:05 PM" },
      ],
      challenges: [
        { i:"squat", n:"30-Day Squats", m:"Day 12 · 240 reps", p:60 },
        { i:"pushup", n:"Push-up Power", m:"Day 4 · 80 reps", p:30 },
      ],
      friends: [ {n:"Anita",s:"8.2k",r:1}, {n:"Ravi",s:"6.1k",r:2}, {n:"Sita",s:"5.5k",r:3}, {n:"Kiran",s:"4.9k"} ],
      feed: [
        {n:"Adesh Pokhrel", t:"2h ago", tag:"Walk", ex:"walk", action:"Finished a 5K Walk Challenge", likes:185, views:2400, dur:"0:42"},
        {n:"Maya Gurung", t:"5h ago", tag:"Push-ups", ex:"pushup", action:"Crushed 96 push-ups in one set", likes:96, views:1240, dur:"0:28"},
        {n:"Kiran Shah", t:"6h ago", tag:"Squats", ex:"squat", action:"New squat PR — 150 reps today!", likes:142, views:1820, dur:"0:35"},
      ],
    },
    partial: {
      greeting: "Good morning", bell: false,
      workout: { today: 1, reps: 40, streak: 1, best: 3, activeMin: 18, activePct: 25 },
      steps: { value: "1,200", goal: "6,000", pct: 20, kcal: 80, active: "18m", distance: "1.2km" },
      sessions: [ { i:"squat", n:"Squats", reps:40, kcal:40, t:"8:30 AM" } ],
      challenges: [ { i:"squat", n:"30-Day Squats", m:"Just joined · Day 1", p:5 } ],
      friends: [], feed: [],
    },
    new: {
      greeting: "Welcome to Buzzend", bell: false,
      workout: { today: 0, reps: 0, streak: 0, best: 0, activeMin: 0, activePct: 0 },
      steps: null, sessions: [], challenges: [], friends: [], feed: [],
    },
  };

  // ── primitives ──
  function sec(title, link) { return `<div class="sec"><h2>${title}</h2>${link ? '<a href="#">See all</a>' : ''}</div>`; }
  function ring(o) {
    const r = o.r || 52, c = 2 * Math.PI * r, off = c * (1 - o.pct / 100), s = o.size || 120, sw = o.stroke || 11;
    return `<div class="ring" style="width:${s}px;height:${s}px"><svg width="${s}" height="${s}">
      <circle cx="${s/2}" cy="${s/2}" r="${r}" fill="none" stroke="${o.track||'rgba(255,255,255,.18)'}" stroke-width="${sw}"/>
      <circle cx="${s/2}" cy="${s/2}" r="${r}" fill="none" stroke="${o.prog||'var(--success)'}" stroke-width="${sw}"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${s/2} ${s/2})"/></svg>
      ${o.center ? `<div class="ring-center">${o.center}</div>` : ''}</div>`;
  }
  function startWorkout(name) { Buzzend.alert({ icon:"camera", title:name + " · AI Pose Detection",
    message:"The camera opens and counts your " + String(name).toLowerCase() + " reps automatically — no tapping needed." }); }
  function empty(ic,t,d,cta){ return `<div class="empty"><div class="ei" style="color:var(--text-tertiary)">${I(ic,38)}</div><div class="et">${t}</div><div class="ed">${d}</div><button class="btn btn-primary" style="height:48px">${cta}</button></div>`; }
  const streakChip = (n) => `<span class="streak-chip">${I('flame',14)} ${n}-day streak</span>`;

  // ── shared sections ──
  function workoutHero(state, d) {
    const eyebrow = `<span class="wh-eyebrow">${I('zap',13)} AI REP COUNTER</span>`;
    const decor = `<span class="wh-emoji">${I('dumbbell',120)}</span>`;
    if (state === "new") {
      return `<div class="workout-hero">${decor}${eyebrow}
        <div class="wh-title">Try your first<br/>AI workout</div>
        <div class="wh-sub">Point your camera — Buzzend counts every rep for you, automatically.</div>
        <button class="btn wh-cta" onclick="HomeData.startWorkout('Squats')">${I('camera',18)} Start now</button></div>`;
    }
    const w = d.workout;
    return `<div class="workout-hero">${decor}${eyebrow}
      <div class="wh-title">Start an AI workout</div>
      <div class="wh-sub">Your camera counts every rep, automatically.</div>
      <button class="btn wh-cta" onclick="HomeData.startWorkout('Squats')">${I('camera',18)} Start Workout</button>
      <div class="wh-stats">
        <div class="wh-stat"><div class="v">${w.today}</div><div class="l">workouts today</div></div>
        <div class="wh-stat"><div class="v">${w.reps}</div><div class="l">reps</div></div>
        <div class="wh-stat"><div class="v" style="display:flex;align-items:center;gap:4px">${I('flame',15)}${w.streak}</div><div class="l">streak</div></div>
      </div></div>`;
  }

  function workoutPicker() {
    return sec("Choose a workout", false) + `<div class="workout-grid">` + WORKOUTS.map(w =>
      `<div class="wk" onclick="HomeData.startWorkout('${w.n}')"><span class="ai">AI</span><div class="wi" style="color:var(--primary)">${I(w.i,26)}</div><div class="wn">${w.n}</div></div>`).join("") + `</div>`;
  }

  function sessionLog(state, d) {
    if (state === "new") {
      return sec("Today's workouts", false) +
        empty("activity","No workouts yet today","Start your first AI workout — your reps are counted automatically.","Start a workout");
    }
    if (!d.sessions.length) return "";
    const tReps = d.sessions.reduce((a,s)=>a+s.reps,0), tKcal = d.sessions.reduce((a,s)=>a+s.kcal,0);
    return sec("Today's workouts", true) +
      `<div class="wsum">
        <div class="chip"><div class="v">${d.sessions.length}</div><div class="l">workouts</div></div>
        <div class="chip"><div class="v">${tReps}</div><div class="l">total reps</div></div>
        <div class="chip"><div class="v">${tKcal}</div><div class="l">kcal</div></div></div>` +
      `<div class="wlog">` + d.sessions.map(s => `<div class="wlog-row">
        <div class="wi" style="color:var(--primary)">${I(s.i,20)}</div><div class="wmid"><div class="wn">${s.n}</div><div class="wm">${s.kcal} kcal</div></div>
        <div class="wend"><div class="wreps">${s.reps} reps</div><div class="wtime">${s.t}</div></div></div>`).join("") +
        `<div class="wlog-add" onclick="HomeData.startWorkout('another')">${I('plus',16)} Start another workout</div></div>`;
  }

  function progressCard(state, d) {
    if (state === "new") {
      return sec("Today", false) + `<div class="progress-card"><div class="pc-top"><span class="pc-title">Daily goal</span></div>
        <div style="text-align:center;padding:6px 0"><div style="display:flex;justify-content:center">${I('target',30)}</div>
          <div style="font:900 18px var(--font);margin-top:8px">Set your daily goal</div>
          <div style="font:600 13px var(--font);opacity:.85;margin-top:6px">Track steps alongside your workouts.</div>
          <button class="btn" style="background:#fff;color:var(--surface-inverse);margin-top:14px;height:46px"
            onclick="Buzzend.alert({icon:'target',title:'Goal set!',message:'Your daily target is 6,000 steps.'})">Set my goal</button></div></div>`;
    }
    const p = d.steps, ringHtml = ring({ pct:p.pct, center:`<div class="rv">${p.value}</div><div class="rl">/ ${p.goal}</div>` });
    const stat = (ic,v,l)=>`<div class="pc-stat"><div class="si">${I(ic,16)}</div><div><div class="sv">${v}</div><div class="sl">${l}</div></div></div>`;
    return sec("Today's progress", false) + `<div class="progress-card"><div class="pc-top"><span class="pc-title">Steps &amp; activity</span>
      ${streakChip(d.workout.streak)}</div>
      <div class="pc-body">${ringHtml}<div class="pc-stats">${stat("flame",p.kcal,"kcal")+stat("clock",p.active,"active")+stat("pin",p.distance,"distance")}</div></div></div>`;
  }

  function checklist() {
    const chk=(done,label)=>`<div class="check-row ${done?'done':''}"><div class="ck">${done?I('check',14):''}</div><div class="cl">${label}</div>${done?'':`<span class="cgo">${I('chevron',18)}</span>`}</div>`;
    return sec("Get started", false) + `<div class="checklist">
      ${chk(true,"Create your account")}${chk(false,"Do your first AI workout")}
      ${chk(false,"Set your daily step goal")}${chk(false,"Join your first challenge")}</div>`;
  }

  function challenges(state, d) {
    let h = sec("Active challenges", state === "full");
    if (!d.challenges.length) return h + empty("trophy","No challenges yet","Join a challenge to compete with friends and stay motivated.","Browse challenges");
    return h + `<div class="h-scroll">` + d.challenges.map(c => `<div class="chal">
      <div class="ct"><div class="badge" style="color:var(--primary)">${I(c.i,19)}</div><div><div class="cname">${c.n}</div><div class="cmeta">${c.m}</div></div></div>
      <div class="pbar"><i style="width:${c.p}%"></i></div><div class="pct">${c.p}% complete</div></div>`).join("") + `</div>`;
  }

  function friends(state, d) {
    let h = sec("Friends' steps", state === "full");
    if (!d.friends.length) return h + empty("users","Add your friends","Compare steps and cheer each other on. It's more fun together!","Find friends");
    return h + `<div class="h-scroll">` + d.friends.map(f => `<div class="friend">
      <div class="fav" style="background-image:linear-gradient(135deg,#b8c6d1,#8aa0b3)">${f.r?`<span class="fr rank${f.r}">${f.r}</span>`:''}</div>
      <div class="fn">${f.n}</div><div class="fs">${f.s} steps</div></div>`).join("") +
      `<div class="friend add"><div class="fav">${I('plus',22)}</div><div class="fn">Invite</div></div></div>`;
  }

  function feed(state, d) {
    let h = sec("Community", state === "full");
    if (!d.feed.length) return h + empty("share","Your feed is quiet","Follow people or join a challenge to see posts and activity here.","Discover people");
    return h + d.feed.map(p => `<div class="post">
      <div class="ph"><div class="pa" style="background-image:linear-gradient(135deg,#caa,#a77)"></div>
        <div><div class="pn">${p.n}</div><div class="pt">${p.t}</div></div><span class="ptag">${p.tag}</span></div>
      <div class="pmedia"><div class="play">${I('play',20)}</div></div>
      <div class="pactions"><span>${I('heart',17)} ${p.likes}</span><span>${I('eye',17)} ${p.views>=1000?(p.views/1000).toFixed(1).replace(/\.0$/,'')+'k':p.views}</span><span>${I('share',17)} Share</span></div></div>`).join("");
  }

  // V2 activity-rings card
  function activityCard(state, d) {
    const w = d.workout;
    const mini = (pct, ic, color, v, l) => `<div class="mini"><div class="mr">${ring({pct,size:78,r:33,stroke:7,track:'var(--surface-alt)',prog:color})}<div class="mc" style="color:${color}">${I(ic,22)}</div></div><div class="mv">${v}</div><div class="ml">${l}</div></div>`;
    const streakPill = state === "new" ? "" : `<span style="display:inline-flex;align-items:center;gap:5px;font:800 12px var(--font);color:var(--primary);background:color-mix(in srgb,var(--primary) 12%,transparent);padding:6px 11px;border-radius:999px">${I('flame',13)} ${w.streak}-day streak</span>`;
    return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:18px;box-shadow:var(--shadow-card);margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px"><div style="font:900 16px var(--font)">Today's activity</div>${streakPill}</div>
      <div class="rings-row">
        ${mini(w.today?Math.min(w.today*25,100):0,"dumbbell","var(--primary)",w.today,"workouts")}
        ${mini(w.reps?Math.min(w.reps/4,100):0,"activity","var(--success)",w.reps,"reps")}
        ${mini(w.activePct,"clock","var(--accent)",w.activeMin+"m","active")}
      </div>
      <button class="btn btn-primary" style="margin-top:16px" onclick="HomeData.startWorkout('Squats')">${I('camera',18)} ${state==='new'?'Start your first workout':'Start AI Workout'}</button></div>`;
  }

  // V3 bento
  function bento(state, d) {
    const w = d.workout;
    const stepsCard = state === "new"
      ? `<div class="b" onclick="Buzzend.alert({icon:'target',title:'Set your goal'})" style="cursor:pointer"><div class="bl">Steps</div><div class="bv" style="font-size:18px;display:flex;align-items:center;gap:6px">${I('target',20)} Set goal</div><div class="bd">Tap to set</div></div>`
      : `<div class="b" style="display:flex;align-items:center;gap:14px">${ring({pct:d.steps.pct,size:74,r:31,stroke:8,track:'var(--surface-alt)',prog:'var(--primary)'})}<div><div class="bl">Steps</div><div class="bv" style="font-size:20px">${d.steps.value}</div><div class="bd">/ ${d.steps.goal}</div></div></div>`;
    return `<div class="bento">
      <div class="b hero span2" onclick="HomeData.startWorkout('Squats')"><span class="bemoji">${I('dumbbell',88)}</span>
        <div class="bl" style="display:flex;align-items:center;gap:5px">${I('zap',12)} AI Rep Counter</div><div class="bv">${state==='new'?'Try your first workout':'Start AI Workout'}</div>
        <div class="bd" style="opacity:.9">Camera counts every rep automatically</div>
        <button class="btn" style="background:#fff;color:var(--primary);height:46px;margin-top:14px;box-shadow:none">${I('camera',17)} Start now</button></div>
      <div class="b"><div class="bl">Streak</div><div class="bv" style="display:flex;align-items:center;gap:6px">${I('flame',22)} ${w.streak}</div><div class="bd">${state==='new'?'start today':'days in a row'}</div></div>
      <div class="b"><div class="bl">Reps today</div><div class="bv">${w.reps}</div><div class="bd">${w.today} workouts</div></div>
      ${stepsCard}
      <div class="b" onclick="HomeData.startWorkout('Push-ups')" style="cursor:pointer"><div class="bl">Up next</div><div class="bv" style="font-size:20px;display:flex;align-items:center;gap:8px">${I('pushup',20)} Push-ups</div><div class="bd">Tap to start</div></div>
    </div>`;
  }

  return { DATA, WORKOUTS, sec, ring, startWorkout, empty, workoutHero, workoutPicker,
    sessionLog, progressCard, checklist, challenges, friends, feed, activityCard, bento };
})();
