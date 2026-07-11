/* Today's workouts · See all — "Workout log". Weekly momentum chart on top,
   then rich per-session cards grouped by day. Reads exercise colors/icons from
   window.Social.ACT. Sessions are counted by the AI camera. */
window.MyWk = (function () {
  const I = (n, s) => window.Icons.svg(n, s);
  const S = window.Social;
  const ex = (k) => S.ACT.find((a) => a.key === k) || S.ACT[1];
  let root;

  // last 7 days of total reps (rightmost = today)
  const WEEK = [
    { d: "Sun", reps: 260 }, { d: "Mon", reps: 310 }, { d: "Tue", reps: 0 },
    { d: "Wed", reps: 240 }, { d: "Thu", reps: 300 }, { d: "Fri", reps: 340 },
    { d: "Sat", reps: 320, today: true },
  ];

  // recent workout log, grouped by day (most recent first)
  const DAYS = [
    { label: "Today", sessions: [
      { k: "squat",  reps: 120, kcal: 60, time: "9:12 AM",  dur: "6:20" },
      { k: "pushup", reps: 80,  kcal: 45, time: "12:30 PM", dur: "4:05" },
      { k: "situp",  reps: 120, kcal: 50, time: "6:05 PM",  dur: "5:40" },
    ] },
    { label: "Yesterday", sessions: [
      { k: "squat",   reps: 100, kcal: 52, time: "8:40 AM", dur: "5:30" },
      { k: "jumping", reps: 150, kcal: 70, time: "7:15 PM", dur: "6:00" },
    ] },
    { label: "2 days ago", sessions: [
      { k: "lunge",  reps: 60,  kcal: 38, time: "9:00 AM", dur: "4:10" },
      { k: "pushup", reps: 90,  kcal: 48, time: "6:30 PM", dur: "4:45" },
      { k: "situp",  reps: 110, kcal: 47, time: "9:20 PM", dur: "5:15" },
    ] },
  ];

  function hero() {
    const total = WEEK.reduce((a, w) => a + w.reps, 0);
    const totalKcal = DAYS.reduce((a, d) => a + d.sessions.reduce((x, s) => x + s.kcal, 0), 0);
    const nSess = DAYS.reduce((a, d) => a + d.sessions.length, 0);
    const max = Math.max.apply(null, WEEK.map((w) => w.reps));
    const bars = WEEK.map((w) => {
      const h = w.reps ? Math.max(6, Math.round((w.reps / max) * 68)) : 4;
      return `<div class="wl-col"><div class="wl-track"><div class="wl-bar${w.today ? " on" : ""}" style="height:${h}px"></div></div>
        <div class="wl-d${w.today ? " on" : ""}">${w.d}</div></div>`;
    }).join("");
    return `<div class="wl-hero">
      <div class="wl-hero-top">
        <div><div class="wl-eyebrow">${I("calendar", 13)} This week</div>
          <div class="wl-big">${S.fmt(total)}<span>reps</span></div>
          <div class="wl-sub">${nSess} sessions · ${totalKcal} kcal burned</div></div>
        <div class="wl-trend"><span class="wl-up">${I("chevron", 12)}</span> 18%</div>
      </div>
      <div class="wl-chart">${bars}</div></div>`;
  }

  function card(s) {
    const m = ex(s.k);
    return `<div class="wl-card" onclick="Buzzend.alert({icon:'${m.i}',title:'${m.n} · ${s.reps} reps',message:'Counted automatically by the AI camera · ${s.kcal} kcal · ${s.dur} min · ${s.time}.'})">
      <div class="wl-ic" style="color:${m.c};background:color-mix(in srgb,${m.c} 15%,transparent)">${I(m.i, 22)}</div>
      <div class="wl-mid">
        <div class="wl-n">${m.n} <span class="wl-ai">AI</span></div>
        <div class="wl-meta"><span class="wl-mi">${I("clock", 12)} ${s.time}</span><span class="wl-sep">·</span><span class="wl-mi">${I("play", 11)} ${s.dur} min</span></div>
      </div>
      <div class="wl-end"><div class="wl-reps">${s.reps}<span>reps</span></div><div class="wl-kcal">${I("flame", 11)} ${s.kcal} kcal</div></div>
    </div>`;
  }

  function daySection(day) {
    const reps = day.sessions.reduce((a, s) => a + s.reps, 0);
    const kcal = day.sessions.reduce((a, s) => a + s.kcal, 0);
    return `<div class="wl-day"><div class="l">${day.label}</div>
      <div class="s"><b>${day.sessions.length} workouts</b> · ${reps} reps · ${kcal} kcal</div></div>
      ${day.sessions.map(card).join("")}`;
  }

  function render() {
    if (!DAYS.length) {
      root.innerHTML = `<div class="wl-empty"><div class="ic">${I("activity", 34)}</div>
        <div class="t">No workouts yet</div><div class="d">Start your first AI workout — reps are counted automatically.</div>
        <button class="btn btn-primary" onclick="location.href='../workout/moment.html'">Start a workout</button></div>`;
      return;
    }
    root.innerHTML = `<div class="wl-body">${hero()}
      ${DAYS.map(daySection).join("")}
      <button class="wl-cta" onclick="location.href='../workout/moment.html'">${I("camera", 18)} Start a workout</button></div>`;
    window.Icons.init(root);
  }

  function start(mountEl) { root = mountEl; render(); }
  return { start, render };
})();
