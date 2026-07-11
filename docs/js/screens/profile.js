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

  let host, st = { v: "1", scenario: "me", tab: "stats", period: "week", ctx: null };
  const cap = (s) => s[0].toUpperCase() + s.slice(1);

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

  /* ── Stats tab: Day/Week/Month workout chart ── */
  function periodData(period) {
    const n = period === "day" ? 1 : period === "week" ? 7 : 14, days = [];
    for (let i = 0; i < n; i++) {
      const w = 0.55 + 0.45 * Math.sin(i * 1.3 + 1), d = { steps: Math.round(900 + 1400 * w) };
      EX.forEach((e, j) => { d[e.key] = (i + j) % 3 === 0 ? Math.round((10 + 70 * w) * (e.key === "lunge" ? 0.4 : 1)) : (j < 2 ? Math.round(8 + 40 * w) : 0); });
      days.push(d);
    }
    return { n, days, label: period === "day" ? "Today" : period === "week" ? "This week" : "Last 14 days" };
  }
  const CHART_H = 150;
  function statsTab(c) {
    const seg = (p) => `<button class="${st.period === p ? "on" : ""}" onclick="Profile.setPeriod('${p}')">${cap(p)}</button>`;
    const toggle = `<div class="pf-seg">${seg("day") + seg("week") + seg("month")}</div>`;
    if (!c.active) return `<div class="pf-pad">${toggle}${empty("activity", "No workouts yet", c.self ? "Start an AI workout — your reps are counted automatically." : "This user hasn't logged any workouts.")}</div>`;
    const { n, days, label } = periodData(st.period);
    const norm = (d) => ({ steps: d.steps / 18, squat: d.squat, pushup: d.pushup, situp: d.situp, jumping: d.jumping, lunge: d.lunge });
    const total = (d) => ACT.reduce((a, k) => a + norm(d)[k.key], 0);
    const max = Math.max.apply(null, days.map(total).concat(1));
    const gap = n > 10 ? "4px" : "8px";
    const labels = n === 1 ? ["Today"] : n === 7 ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : Array.from({ length: n }, (_, i) => "" + (i + 1));
    const bars = days.map((d) => {
      const t = total(d), bh = (t / max) * CHART_H;
      const segs = ACT.map((a) => { const part = norm(d)[a.key]; if (!part) return ""; return `<div class="pf-seg-fill" style="height:${((part / t) * bh).toFixed(1)}px;background:${a.c}"></div>`; }).join("");
      return `<div class="pf-bar">${segs}</div>`;
    }).join("");
    const legend = ACT.map((a) => `<span class="pf-lg"><i style="background:${a.c}"></i>${a.n}</span>`).join("");
    return `<div class="pf-pad">${toggle}
      <div class="pf-card"><div class="pf-cardh"><span>${label}</span></div>
        <div class="pf-bars${n === 1 ? " one" : ""}" style="--bg:${gap};height:${CHART_H + 6}px">${bars}</div>
        <div class="pf-xl" style="--bg:${gap}">${labels.map((l) => `<span>${l}</span>`).join("")}</div>
        <div class="pf-legend">${legend}</div></div></div>`;
  }

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

  /* ── Challenges tab: Current + Completed ── */
  function challengesTab(c) {
    if (c.challenges === 0) return empty("trophy", "No challenges yet", c.self ? "Join a challenge to compete with friends." : "This user hasn't joined any challenges.");
    const mine = S.CHALLENGES.filter((x) => x.joined);
    const cur = mine.filter((x) => x.status !== "ended"), done = mine.filter((x) => x.status === "ended");
    const row = (x) => {
      const m = ACT.find((a) => a.key === x.ex) || ACT[1];
      const pct = x.status === "ended" ? 100 : Math.min(100, Math.round((x.myReps / x.goal) * 100));
      return `<div class="pf-chl" onclick="location.href='challenge-detail.html?role=${c.self ? "member" : "viewer"}'">
        <div class="ci" style="color:${m.c};background:color-mix(in srgb,${m.c} 14%,transparent)">${I(m.i, 18)}</div>
        <div class="cm"><div class="cn">${x.n}</div><div class="cd">${x.status === "ended" ? "Completed" : "Day " + x.day + " / " + x.days} · ${fmt(x.myReps)} reps</div>
          <div class="cbar"><i style="width:${pct}%;background:${m.c}"></i></div></div></div>`;
    };
    const sec = (label, arr) => arr.length ? `<div class="pf-sublbl">${label}</div>${arr.map(row).join("")}` : "";
    return `<div class="pf-pad">${sec("Current challenges", cur)}${sec("Completed", done)}</div>`;
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
  function setTab(t) { st.tab = t; render(); }
  function setPeriod(p) { st.period = p; render(); }

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

  return { start, setV, setScenario, setTab, setPeriod, follow, message, menu, block, report, deleteAccount, list, editProfile, _close, AVATARS, overrides };
})();
