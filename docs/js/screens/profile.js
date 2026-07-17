/* Profile — 3 layout variants (Hero · Card · Minimal). UI/UX only — the backend
   does NOT change, so this uses ONLY fields the app actually has:
   profile image, name, online/last-seen, Following/Followers/Challenges/Streak,
   and the Stats (weekly workout chart) / Posts / Challenges tabs. Unified own vs
   other user (isCurrentUser): Edit (own) vs Follow/Following/Follow-back + Message
   (other), Block/Report, Delete account. No cover photo, no bio, no handle — those
   don't exist in the model. Token / palette / dark aware. */
window.Profile = (function () {
  const I = (n, s) => window.Icons.svg(n, s);
  const S = window.Social, ME = S.ME, EX = S.EX, ACT = S.ACT, fmt = S.fmt, grad = S.grad;
  const AVATARS = ["#6a8caf,#33566f", "#1f6e5f,#2a9d8f", "#8a5a1a,#e0922a", "#7a2a6a,#c0398e", "#1e3a5a,#3b6eff", "#7a1f2a,#ef4444"];

  function overrides() { try { return JSON.parse(localStorage.getItem("buzzend-profile") || "{}"); } catch (e) { return {}; } }
  function selfProfile() {
    const o = overrides();
    return { self: true, name: o.name || ME.name, av: o.av || ME.av, initials: ME.initials, online: true, lastSeen: null,
      following: ME.following, followers: ME.followers, challenges: ME.joinedChallenges, streak: ME.streak,
      person: ME, followed: false, isFollowingMe: false, blocked: false, posts: 12, active: true };
  }
  // other-user scenarios — real fields only, values stand in for backend data
  const OTHERS = {
    friend:     { name: "Anita Malan",   online: true,  followed: true,  isFollowingMe: true,  followers: 1240, following: 320, challenges: 22, streak: 63, posts: 48, active: true },
    stranger:   { name: "Adesh Pokhrel", online: false, lastSeen: "2h ago",   followed: false, isFollowingMe: false, followers: 8600, following: 210, challenges: 40, streak: 120, posts: 132, active: true },
    followback: { name: "Sita Rai",      online: false, lastSeen: "5m ago",   followed: false, isFollowingMe: true,  followers: 540,  following: 410, challenges: 12, streak: 18, posts: 20, active: true },
    blocked:    { name: "Drake Parker",  online: false, lastSeen: "1d ago",   followed: false, isFollowingMe: false, blocked: true, followers: 120, following: 80, challenges: 3, streak: 0, posts: 4, active: true },
    newuser:    { name: "Joseph Owl",    online: false, lastSeen: "just now", followed: false, isFollowingMe: false, followers: 0, following: 2, challenges: 0, streak: 0, posts: 0, active: false },
  };
  function otherProfile(key) {
    const o = OTHERS[key] || OTHERS.stranger;
    const p = S.PEOPLE.find((x) => x.name === o.name) || S.PEOPLE[1];
    return Object.assign({ self: false, person: p, av: p.av, initials: p.initials }, o);
  }
  function ctxFor(scenario) { return scenario === "me" ? selfProfile() : otherProfile(scenario); }

  let host, st = { v: "1", scenario: "me", tab: "stats", period: "week", pOff: 0, ctx: null };
  const cap = (s) => s[0].toUpperCase() + s.slice(1);

  /* Stats palette — mirrors the native ProfileStatsSection (WorkoutType.color)
     exactly, incl. native labels + native LEGEND_ORDER (Steps · Squats · Pushups
     · Situps · Jumping Jacks · Lunges). Also the vertical stacking order. */
  const STAT_TYPES = [
    { key: "steps",   n: "Steps",         i: "footprints", c: "#34D094" },
    { key: "squat",   n: "Squats",        i: "squat",      c: "#C56DE2" },
    { key: "pushup",  n: "Pushups",       i: "pushup",     c: "#F5A623" },
    { key: "situp",   n: "Situps",        i: "situp",      c: "#6466E3" },
    { key: "jumping", n: "Jumping Jacks", i: "jumping",    c: "#E670B7" },
    { key: "lunge",   n: "Lunges",        i: "lunge",      c: "#E74F5E" },
  ];
  const REP_KEYS = ["squat", "pushup", "situp", "jumping", "lunge"];
  const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const MON_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  /* ── shared bits ── */
  const presence = (c) => c.online ? `<span class="pf-on"><i></i>Online</span>` : `<span class="pf-off">Last seen ${c.lastSeen || "recently"}</span>`;
  function avatarEl(c, size) {
    const dot = c.online ? '<span class="pf-dot"></span>' : "";
    const cam = c.self ? `<button class="pf-avcam" onclick="Profile.editProfile()">${I("camera", 14)}</button>` : "";
    return `<div class="pf-av2" style="width:${size}px;height:${size}px;background-image:${grad(c.av)}">${dot}${cam}</div>`;
  }
  function actions(c, dark) {
    if (c.blocked) return `<div class="pf-actrow"><button class="pf-btn ghost" style="flex:1" onclick="Profile.block()">${I("block", 15)} Unblock</button></div>`;
    const g = dark ? "gloss" : "ghost", pr = dark ? "onhero" : "primary";
    if (c.self) return `<div class="pf-actrow"><button class="pf-btn ${pr}" style="flex:1" onclick="Profile.editProfile()">${I("edit", 15)} Edit profile</button><button class="pf-btn ${g} sq" onclick="Profile.menu()">${I("sliders", 16)}</button></div>`;
    const fLabel = c.followed ? "Following" : c.isFollowingMe ? "Follow back" : "Follow";
    return `<div class="pf-actrow">
      <button class="pf-btn ${c.followed ? g : pr}" style="flex:1" onclick="Profile.follow()">${I(c.followed ? "checks" : "plus", 15)} ${fLabel}</button>
      <button class="pf-btn ${g}" style="flex:1" onclick="Profile.message()">${I("comment", 15)} Message</button>
      <button class="pf-btn ${g} sq" onclick="Profile.menu()">${I("sliders", 16)}</button></div>`;
  }
  function topBar(c, dark) {
    const cls = dark ? "pf-navb glass" : "pf-navb";
    return `<div class="pf-navbar${dark ? " onhero" : ""}">
      <button class="${cls}" onclick="location.href='home-v7.html'">${I("back", 20)}</button>
      <div class="pf-navttl${dark ? " d" : ""}">Profile</div>
      <button class="${cls}" onclick="Profile.menu()">${I("sliders", 18)}</button></div>`;
  }
  function statStrip(c, style) {
    const cell = (v, l, tap) => `<button class="pf-scell${tap ? " tap" : ""}" ${tap ? `onclick="Profile.list('${tap}')"` : "disabled"}><b>${v}</b><span>${l}</span></button>`;
    const L = c.self; // follow lists open only on own profile (Flutter-faithful)
    return `<div class="pf-strip ${style}">
      ${cell(fmt(c.following), "Following", L ? "following" : "")}
      ${cell(fmt(c.followers), "Followers", L ? "followers" : "")}
      ${cell(c.challenges, "Challenges", "")}
      ${cell(c.streak, "Day streak", "")}</div>`;
  }

  /* ── tabs ── */
  function tabsBar() { const t = (id, l) => `<button class="pf-tab2 ${st.tab === id ? "on" : ""}" onclick="Profile.setTab('${id}')">${l}</button>`; return `<div class="pf-tabs2">${t("stats", "Stats")}${t("posts", "Posts")}${t("challenges", "Challenges")}</div>`; }
  function tabContent(c) { if (c.blocked) return blockedBody(c); return st.tab === "posts" ? postsTab(c) : st.tab === "challenges" ? challengesTab(c) : statsTab(c); }

  /* ── Stats tab: Day/Week/Month workout chart — matched 1:1 to the REAL native
     ProfileStatsSection captured on-device (emulator, 2026-07-17):
       · Day/Week/Month toggle · ‹prev/next› navigator + inline "Today" jump-back
       · WEEK title uses date numbers, MONDAY-start weeks (e.g. "13 Jul – 19 Jul")
       · each stacked bar prints its value INSIDE the segment — Month=none · Week=
         value ("250") · Day + tap-sheet=value+name ("250 Pushups")
       · calories = a SOLID accent tile, centred ("Calories burned / 182 🔥")
       · tap-a-bar → sheet: date · legend · tall bar LEFT / calories RIGHT (tight gap)
       · contextual calendar: Day=day grid · Week=week-row (Mon-first) · Month=month+year
       · data-backed empty state. Steps abbreviate (2.5K); reps are plain ints. */
  const CHART_H = 210, DAYMS = 86400000;
  const fmtC = (v) => (v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(/\.0$/, "") + "K" : "" + v);
  const repsOf = (d) => REP_KEYS.reduce((a, k) => a + d[k], 0);
  const calOf = (d) => Math.round(d.steps * 0.02 + repsOf(d) * 0.34);
  const units = (d) => d.steps + repsOf(d); // raw stack — matches native (no scaling)

  // deterministic per-day synthetic data (stable across navigation). Active days carry
  // ALL SIX types (steps + 5 reps) with substantial, comparable magnitudes so every
  // segment — and its value label — stays visible in one day. Steps kept moderate so it
  // doesn't dwarf the reps (keeps bars balanced across the week).
  const REP_BASE = { squat: 170, pushup: 250, situp: 160, jumping: 230, lunge: 200 };
  function genDay(dt) {
    const seed = dt.getFullYear() * 372 + (dt.getMonth() + 1) * 31 + dt.getDate();
    if (seed % 7 === 3 || seed % 11 === 5) return { steps: 0, squat: 0, pushup: 0, situp: 0, jumping: 0, lunge: 0 }; // rest day
    const d = { steps: Math.round(380 + 320 * Math.abs(Math.sin(seed * 0.9 + 1))) };
    REP_KEYS.forEach((k, j) => { d[k] = Math.round(REP_BASE[k] * (0.8 + 0.35 * Math.abs(Math.sin(seed * (j + 2))))); });
    return d;
  }
  function today0() { const t = new Date(); t.setHours(0, 0, 0, 0); return t; }
  function mondayOf(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  function periodAnchor(P, off) {
    const t = today0();
    if (P === "day") { const d = new Date(t); d.setDate(d.getDate() + off); return d; }
    if (P === "week") { const m = mondayOf(t); m.setDate(m.getDate() + off * 7); return m; } // Monday start (native)
    return new Date(t.getFullYear(), t.getMonth() + off, 1);
  }
  function periodDates(P, a) {
    if (P === "day") return [new Date(a)];
    const n = P === "week" ? 7 : new Date(a.getFullYear(), a.getMonth() + 1, 0).getDate();
    return Array.from({ length: n }, (_, i) => { const d = new Date(a); d.setDate(a.getDate() + i); return d; });
  }
  function periodTitle(P, a) {
    if (P === "day") return `${DOW[a.getDay()]}, ${a.getDate()} ${MON[a.getMonth()]}`;
    if (P === "week") { const e = new Date(a); e.setDate(a.getDate() + 6); return `${a.getDate()} ${MON[a.getMonth()]} – ${e.getDate()} ${MON[e.getMonth()]}`; }
    return `${MON_FULL[a.getMonth()]} ${a.getFullYear()}`;
  }

  // legend: colour swatch + label of the given types (native has no emoji)
  const legendEl = (types) => `<div class="pf-legend">${(types || STAT_TYPES).map((t) => `<span class="pf-lg"><i style="background:${t.c}"></i>${t.n}</span>`).join("")}</div>`;
  // solid accent "Calories burned" tile (centred)
  const caloriesTile = (d, cls) => `<div class="pf-cal2${cls ? " " + cls : ""}"><span class="k">Calories burned</span><b>${fmtC(calOf(d))} 🔥</b></div>`;
  // one stacked bar → each present segment sized by raw/max*H, labelled per `mode`
  function stackBar(d, max, H, mode) {
    if (!units(d)) return "";
    return STAT_TYPES.map((t) => {
      const raw = t.key === "steps" ? d.steps : d[t.key];
      if (!raw) return "";
      const h = (raw / max) * H;
      const txt = mode === "count" ? fmtC(raw) : mode === "full" ? `${fmtC(raw)} ${t.n}` : "";
      const show = txt && h >= (mode === "full" ? 14 : 10);
      return `<div class="pf-seg-fill" style="height:${h.toFixed(1)}px;background:${t.c}">${show ? `<span>${txt}</span>` : ""}</div>`;
    }).join("");
  }

  function statsTab(c) {
    const seg = (p) => `<button class="${st.period === p ? "on" : ""}" onclick="Profile.setPeriod('${p}')">${cap(p)}</button>`;
    const toggle = `<div class="pf-seg">${seg("day") + seg("week") + seg("month")}</div>`;
    if (!c.active) return `<div class="pf-pad">${toggle}${empty("activity", "No workouts yet", c.self ? "Start an AI workout — your reps are counted automatically." : "This user hasn't logged any workouts.")}</div>`;

    const P = st.period, off = st.pOff | 0, atNow = off === 0;
    const anchor = periodAnchor(P, off);
    const dates = periodDates(P, anchor);
    const data = dates.map(genDay);
    const emptyPeriod = off <= -4 || data.every((d) => !units(d)); // no logs this far back

    const nav = `<div class="pf-chnav">
      <button class="pf-chstep" onclick="Profile.statStep(-1)" title="Previous">${I("chevron", 18)}</button>
      <div class="pf-chttl"><span>${periodTitle(P, anchor)}</span>${atNow ? "" : `<button class="pf-today" onclick="Profile.statToday()">Today</button>`}</div>
      <button class="pf-chstep next" ${atNow ? "disabled" : ""} onclick="Profile.statStep(1)" title="Next">${I("chevron", 18)}</button>
      <button class="pf-chcal" onclick="Profile.openCalendar()" title="Pick a date">${I("calendar", 17)}</button></div>`;

    if (emptyPeriod)
      return `<div class="pf-pad">${toggle}<div class="pf-card">${nav}
        <div class="pf-chempty"><div class="ec">${I("activity", 26)}</div><div class="et">No workouts yet</div><div class="ed">No activity was logged for this period.</div></div></div></div>`;

    const max = Math.max.apply(null, data.map(units).concat(1));

    /* ── Day view: centred calories tile + single wide bar (value + name inside) ── */
    if (P === "day") {
      const d = data[0], iso = dates[0].getTime(), dmax = units(d) || 1;
      return `<div class="pf-pad">${toggle}
        <div class="pf-card">${nav}
          ${caloriesTile(d)}
          <div class="pf-bars dayone" style="height:${CHART_H + 90}px"><div class="pf-bar tap" onclick="Profile.openDaySheet(${iso})">${stackBar(d, dmax, CHART_H + 84, "full")}</div></div>
          ${legendEl()}</div></div>`;
    }

    /* ── Week / Month view: one stacked bar per day (Week=value labels, Month=none) ── */
    const isWeek = P === "week", gap = isWeek ? "10px" : "3px", mode = isWeek ? "count" : "none";
    const bars = data.map((d, i) => `<div class="pf-bar tap" onclick="Profile.openDaySheet(${dates[i].getTime()})">${stackBar(d, max, CHART_H, mode)}</div>`).join("");
    const xl = dates.map((dt) => {
      const show = isWeek ? dt.getDate() : (dt.getDate() === 1 || dt.getDate() % 5 === 0 ? dt.getDate() : "");
      return `<span>${show}</span>`;
    }).join("");
    return `<div class="pf-pad">${toggle}
      <div class="pf-card">${nav}
        <div class="pf-bars${isWeek ? "" : " dense"}" style="--bg:${gap};height:${CHART_H + 6}px">${bars}</div>
        <div class="pf-xl" style="--bg:${gap}">${xl}</div>
        ${legendEl()}</div></div>`;
  }

  /* Day-breakdown sheet (tap a bar): date title · legend · tall bar LEFT / calories RIGHT.
     Tight legend→bar gap (design feedback 2026-07-17), mirrored in native code too. */
  function openDaySheet(ms) {
    const dt = new Date(ms), d = genDay(dt), dmax = units(d) || 1, H = 240;
    const present = STAT_TYPES.filter((t) => (t.key === "steps" ? d.steps : d[t.key]));
    const legend = present.length
      ? `<div class="pf-legend sheet">${present.map((t) => `<span class="pf-lg"><i style="background:${t.c}"></i>${t.n}</span>`).join("")}</div>`
      : `<div class="pf-legend sheet"><span class="pf-lg">Rest day — no activity</span></div>`;
    const html = `<div class="pf-daysheet">${legend}
      <div class="pf-ds-row">
        <div class="pf-bars one sheetbar" style="height:${H + 6}px"><div class="pf-bar">${stackBar(d, dmax, H, "full")}</div></div>
        ${caloriesTile(d, "side")}</div></div>`;
    Buzzend.sheet({ closeBtn: false, title: `${DOW[dt.getDay()]}, ${dt.getDate()} ${MON[dt.getMonth()]}`, html });
  }

  /* Contextual calendar picker — Day/Week/Month. Native parity: NO sheet title,
     plain day numbers (no activity dots), tap SELECTS (highlights only), and an
     Apply button commits the selection. */
  let _calBase = null, _calSel = null; // shown month · pending selection
  function openCalendar() {
    const P = st.period, a = periodAnchor(P, st.pOff | 0);
    if (P === "month") { _calBase = new Date(a.getFullYear(), 0, 1); _calSel = { type: "month", y: a.getFullYear(), m: a.getMonth() }; return renderMonthPicker(); }
    _calBase = new Date(a.getFullYear(), a.getMonth(), 1);
    _calSel = P === "week" ? { type: "week", mon: +mondayOf(a) } : { type: "day", ms: +a };
    renderDayPicker();
  }
  const applyBtn = () => `<button class="pf-cal-apply" onclick="Profile.calApply()">Apply</button>`;
  function renderDayPicker() {
    const base = _calBase, tnow = today0(), weekMode = st.period === "week";
    const firstMi = (new Date(base.getFullYear(), base.getMonth(), 1).getDay() + 6) % 7;
    const nDays = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    let cells = "";
    for (let i = 0; i < firstMi; i++) cells += `<span class="pf-cd empty"></span>`;
    for (let day = 1; day <= nDays; day++) {
      const dt = new Date(base.getFullYear(), base.getMonth(), day), future = dt > tnow;
      const sel = !future && (weekMode ? +mondayOf(dt) === _calSel.mon : +dt === _calSel.ms);
      cells += `<button class="pf-cd${future ? " dis" : ""}${sel ? " sel" : ""}" data-ms="${+dt}" ${future ? "disabled" : `onclick="Profile.calPick(this,${+dt})"`}>${day}</button>`;
    }
    const nextDis = base.getFullYear() >= tnow.getFullYear() && base.getMonth() >= tnow.getMonth();
    Buzzend.sheet({ closeBtn: false, html: `<div class="pf-calpick">
      <div class="pf-cp-nav"><button onclick="Profile.calNav(-1)">${I("chevron", 16)}</button>
        <div><span class="yr">${base.getFullYear()}</span><b>${MON[base.getMonth()]}</b></div>
        <button class="nx" ${nextDis ? "disabled" : ""} onclick="Profile.calNav(1)">${I("chevron", 16)}</button></div>
      <div class="pf-cp-dow">${["M","T","W","T","F","S","S"].map((x) => `<span>${x}</span>`).join("")}</div>
      <div class="pf-cp-grid">${cells}</div>${applyBtn()}</div>` });
  }
  function renderMonthPicker() {
    const y = _calBase.getFullYear(), tnow = today0();
    const cells = MON.map((m, i) => {
      const future = new Date(y, i, 1) > new Date(tnow.getFullYear(), tnow.getMonth(), 1);
      const sel = _calSel.type === "month" && y === _calSel.y && i === _calSel.m;
      return `<button class="pf-mo${sel ? " sel" : ""}${future ? " dis" : ""}" data-m="${i}" ${future ? "disabled" : `onclick="Profile.calPickMonth(this,${y},${i})"`}>${m}</button>`;
    }).join("");
    Buzzend.sheet({ closeBtn: false, html: `<div class="pf-calpick">
      <div class="pf-cp-nav"><button onclick="Profile.calYearNav(-1)">${I("chevron", 16)}</button><b>${y}</b>
        <button class="nx" ${y >= tnow.getFullYear() ? "disabled" : ""} onclick="Profile.calYearNav(1)">${I("chevron", 16)}</button></div>
      <div class="pf-mo-grid">${cells}</div>${applyBtn()}</div>` });
  }
  function calHighlight(el) {
    const box = el.closest(".bz-dialog"); if (!box) return;
    box.querySelectorAll(".pf-cd.sel,.pf-mo.sel").forEach((x) => x.classList.remove("sel"));
    if (_calSel.type === "month") { const b = box.querySelector(`.pf-mo[data-m="${_calSel.m}"]`); if (b) b.classList.add("sel"); return; }
    box.querySelectorAll(".pf-cd[data-ms]").forEach((x) => {
      const dt = new Date(+x.dataset.ms);
      if (_calSel.type === "week" ? +mondayOf(dt) === _calSel.mon : +dt === _calSel.ms) x.classList.add("sel");
    });
  }
  function calPick(el, ms) { _calSel = st.period === "week" ? { type: "week", mon: +mondayOf(new Date(ms)) } : { type: "day", ms: ms }; calHighlight(el); }
  function calPickMonth(el, y, m) { _calSel = { type: "month", y: y, m: m }; calHighlight(el); }
  function calNav(dir) { _calBase = new Date(_calBase.getFullYear(), _calBase.getMonth() + dir, 1); _close(); renderDayPicker(); }
  function calYearNav(dir) { _calBase = new Date(_calBase.getFullYear() + dir, 0, 1); _close(); renderMonthPicker(); }
  function calApply() {
    _close(); const s = _calSel, t = today0();
    if (s.type === "day") { st.period = "day"; st.pOff = Math.round((s.ms - +t) / DAYMS); }
    else if (s.type === "week") { st.period = "week"; st.pOff = Math.round((s.mon - +mondayOf(t)) / (7 * DAYMS)); }
    else { st.period = "month"; st.pOff = (s.y - t.getFullYear()) * 12 + (s.m - t.getMonth()); }
    render();
  }
  function statStep(dir) { const n = (st.pOff | 0) + dir; if (n <= 0) { st.pOff = n; render(); } }
  function statToday() { st.pOff = 0; render(); }

  /* ── Posts tab: grid + "No Posts Yet" + 60-day expiry note (others) ── */
  function postsTab(c) {
    if (!c.posts) return empty("image", "No posts yet", c.self ? "Share a workout to start your grid." : "This user hasn't posted anything.");
    const cells = [
      { ex: "squat", g: "#1f6e5f,#2a9d8f", r: 150, v: true }, { ex: "pushup", g: "#8a5a1a,#e0922a", r: 96 },
      { ex: "jumping", g: "#7a2a6a,#c0398e", r: 120, v: true }, { ex: "situp", g: "#1e3a5a,#3b6eff", r: 88 },
      { ex: "lunge", g: "#7a1f2a,#ef4444", r: 64 }, { ex: "squat", g: "#3a3a5b,#5e60ce", r: 132, v: true },
    ];
    const grid = cells.slice(0, Math.min(cells.length, c.posts)).map((x) => `<div class="pf-cell2" style="background-image:linear-gradient(135deg,${x.g})" onclick="location.href='post-detail.html'">
      ${x.v ? `<span class="pc-play">${I("play", 22)}</span>` : ""}<span class="pc-rep">${I(x.ex, 12)} ${x.r}</span></div>`).join("");
    return `<div class="pf-pad"><div class="pf-grid2">${grid}</div>
      ${c.self ? "" : `<div class="pf-note">${I("clock", 12)} Posts expire after 60 days</div>`}</div>`;
  }

  /* ── Challenges tab: Active + Upcoming inline; the full list (which also holds
     Completed) lives behind "See all" → my-challenges.html?from=profile. ── */
  function challengesTab(c) {
    if (c.challenges === 0) return empty("trophy", "No challenges yet", c.self ? "Join a challenge to compete with friends." : "This user hasn't joined any challenges.");
    const mine = S.CHALLENGES.filter((x) => x.joined);
    const active = mine.filter((x) => x.status === "active");
    const upcoming = mine.filter((x) => x.status === "upcoming");
    const row = (x) => {
      const m = ACT.find((a) => a.key === x.ex) || ACT[1];
      const up = x.status === "upcoming";
      const pct = up ? 0 : Math.min(100, Math.round((x.myReps / x.goal) * 100));
      const meta = up ? `Starts in ${x.startsIn} day${x.startsIn > 1 ? "s" : ""}` : `Day ${x.day} / ${x.days} · ${fmt(x.myReps)} reps`;
      return `<div class="pf-chl" onclick="location.href='challenge-detail.html?role=${c.self ? "member" : "viewer"}'">
        <div class="ci" style="color:${m.c};background:color-mix(in srgb,${m.c} 14%,transparent)">${I(m.i, 18)}</div>
        <div class="cm"><div class="cn">${x.n}</div><div class="cd">${meta}</div>
          <div class="cbar"><i style="width:${up ? 0 : Math.max(pct, 2)}%;background:${up ? "var(--text-tertiary)" : m.c}"></i></div></div></div>`;
    };
    const sec = (label, arr) => arr.length ? `<div class="pf-sublbl">${label}</div>${arr.map(row).join("")}` : "";
    const header = c.self ? `<div class="pf-chsec"><h3>Your challenges</h3><a class="pf-seeall" href="my-challenges.html?from=profile">See all ${I("chevron", 15)}</a></div>` : "";
    const body = (active.length + upcoming.length)
      ? sec("Active", active) + sec("Upcoming", upcoming)
      : `<div class="pf-empty" style="padding:24px 20px"><div class="ec">${I("trophy", 26)}</div><div class="et">Nothing active right now</div><div class="ed">${c.self ? 'Your finished challenges are under "See all".' : "This user has no active or upcoming challenges."}</div></div>`;
    return `<div class="pf-pad">${header}${body}</div>`;
  }

  const empty = (ic, t, d) => `<div class="pf-empty"><div class="ec">${I(ic, 30)}</div><div class="et">${t}</div><div class="ed">${d}</div></div>`;
  const blockedBody = (c) => `<div class="pf-empty blk"><div class="ec">${I("block", 30)}</div><div class="et">You blocked ${c.name.split(" ")[0]}</div>
    <div class="ed">You can't see their posts, challenges or activity while blocked.</div>
    <button class="pf-btn primary" style="margin-top:16px" onclick="Profile.block()">Unblock</button></div>`;

  /* ═══ V1 · Hero (brand header panel + floating stats card) ═══ */
  function v1(c) {
    return `<div class="pf-v1">
      <div class="pf-herobg">${topBar(c, true)}
        <div class="pf-heroid">${avatarEl(c, 84)}
          <div class="pf-hnm">${c.name}</div><div class="pf-hsub">${presence(c)}</div></div></div>
      <div class="pf-v1card">${statStrip(c, "plain")}${actions(c)}</div>
      ${c.blocked ? "" : tabsBar()}
      <div class="pf-tabbody">${tabContent(c)}</div></div>`;
  }

  /* ═══ V2 · Card (light bg, profile card + stat mini-cards) ═══ */
  function v2(c) {
    return `<div class="pf-v2">${topBar(c, false)}
      <div class="pf-v2card">
        <div class="pf-v2top">${avatarEl(c, 70)}<div class="pf-v2id"><div class="pf-nm">${c.name}</div><div class="pf-sub">${presence(c)}</div></div></div>
        ${actions(c)}</div>
      <div class="pf-v2stats">${statStrip(c, "cards")}</div>
      ${c.blocked ? "" : tabsBar()}
      <div class="pf-tabbody">${tabContent(c)}</div></div>`;
  }

  /* ═══ V3 · Minimal (centered) ═══ */
  function v3(c) {
    return `<div class="pf-v3">${topBar(c, false)}
      <div class="pf-v3head">${avatarEl(c, 96)}
        <div class="pf-nm center">${c.name}</div><div class="pf-sub center">${presence(c)}</div>
        ${statStrip(c, "plain")}${actions(c)}</div>
      ${c.blocked ? "" : tabsBar()}
      <div class="pf-tabbody">${tabContent(c)}</div></div>`;
  }

  /* ═══ render + actions ═══ */
  function variant() { const c = st.ctx; return st.v === "2" ? v2(c) : st.v === "3" ? v3(c) : v1(c); }
  function render() { host.innerHTML = variant(); window.Icons.init(host); host.scrollTop = 0; }
  function setTab(t) { st.tab = t; st.pOff = 0; render(); }
  function setPeriod(p) { st.period = p; st.pOff = 0; render(); }

  function follow() {
    const c = st.ctx;
    if (c.followed) { Buzzend.confirm({ icon: "user", title: `Unfollow ${c.name.split(" ")[0]}?`, message: "You'll stop seeing their updates.", confirmLabel: "Unfollow", danger: true, onConfirm() { c.followed = false; render(); } }); return; }
    c.followed = true; render();
  }
  function message() { location.href = "../chat/chat-detail.html"; }
  function menu() {
    const c = st.ctx;
    const items = c.self
      ? [["edit", "Edit profile", "Profile.editProfile()"], ["sliders", "Settings", "location.href='settings.html'"], ["trash", "Delete account", "Profile.deleteAccount()", true]]
      : [[c.blocked ? "check" : "block", c.blocked ? "Unblock" : "Block", "Profile.block()", !c.blocked], ["flag", "Report", "Profile.report()", true]];
    Buzzend.sheet({ title: c.self ? "Options" : c.name, html: `<div class="pf-menu">${items.map(([ic, l, fn, d]) => `<button class="pf-mi${d ? " danger" : ""}" onclick="Profile._close();${fn}">${I(ic, 18)} ${l}</button>`).join("")}</div>` });
  }
  function _close() { const o = document.querySelector(".bz-overlay.open"); if (o) { o.classList.remove("open"); setTimeout(() => o.remove(), 220); } }
  function block() {
    const c = st.ctx;
    if (c.blocked) { c.blocked = false; render(); Buzzend.alert({ icon: "success", title: "Unblocked", message: `${c.name} has been unblocked.` }); return; }
    Buzzend.confirm({ icon: "block", danger: true, title: `Block ${c.name.split(" ")[0]}?`, message: "They won't be able to find your profile, posts or message you.", confirmLabel: "Block", onConfirm() { c.blocked = true; c.followed = false; render(); } });
  }
  function report() {
    Buzzend.sheet({ title: "Why are you reporting this account?", html: `<div class="pf-report">
      ${["User is posting abusive content", "User is maybe under the age of 18", "Something else"].map((r, i) => `<label class="pf-rp"><input type="radio" name="rp"${i === 0 ? " checked" : ""}><span>${r}</span></label>`).join("")}
      <button class="pf-btn primary" style="width:100%;margin-top:14px" onclick="Profile._close();Buzzend.alert({icon:'success',title:'Thanks for reporting',message:'Our team will review this account.'})">Report account</button></div>` });
  }
  function deleteAccount() { Buzzend.confirm({ icon: "alert", danger: true, title: "Delete account permanently?", message: "This can't be undone. All your workouts, posts and challenges will be removed.", confirmLabel: "Delete", onConfirm() { Buzzend.alert({ icon: "success", title: "Account scheduled for deletion", message: "You'll be signed out shortly." }); } }); }
  function list(which) {
    const c = st.ctx, people = which === "followers" ? S.PEOPLE.slice(1, 7) : S.PEOPLE.slice(2, 5);
    if ((which === "followers" && !c.followers) || (which === "following" && !c.following))
      return Buzzend.sheet({ title: cap(which), html: `<div class="pf-empty" style="padding:30px 10px">${I("users", 26)}<div class="et" style="margin-top:10px">${which === "followers" ? "No followers yet" : "Not following anyone yet"}</div></div>` });
    const rows = people.map((p) => `<div class="pf-lrow"><div class="la" style="background-image:${grad(p.av)}"></div>
      <div class="ln">${p.name}</div><button class="pf-btn ${p.friend ? "ghost" : "primary"} xs">${p.friend ? "Following" : "Follow"}</button></div>`).join("");
    Buzzend.sheet({ title: cap(which), html: `<div class="pf-list">${rows}</div>` });
  }
  function editProfile() { location.href = "profile-edit.html"; }

  function start(mountEl, v, scenario, tab) { host = mountEl; st.v = v || "1"; st.scenario = scenario || "me"; st.tab = tab || "stats"; st.period = "week"; st.ctx = ctxFor(st.scenario); render(); }
  function setScenario(s) { st.scenario = s; st.tab = "stats"; st.ctx = ctxFor(s); render(); }
  function setV(v) { st.v = v; render(); }

  return { start, setV, setScenario, setTab, setPeriod, statStep, statToday, openDaySheet, openCalendar, calPick, calPickMonth, calApply, calNav, calYearNav, follow, message, menu, block, report, deleteAccount, list, editProfile, _close, AVATARS, overrides };
})();
