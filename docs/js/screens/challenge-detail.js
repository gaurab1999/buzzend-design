/* Challenge Detail — V1 faithful (Flutter user_challenge_detail_screen) + V2 progress-
   first, V3 immersive, V4 dashboard. Shared sub-views Leaderboard/Members/Posts, plus
   role-based ⋯ menu, report, chat, leave/delete, join/record. Reads window.Social. */
window.CDetail = (function () {
  const I = (n, s) => window.Icons.svg(n, s);
  const S = window.Social, fmt = S.fmt, grad = S.grad;
  const EX = { squat: "Squats", pushup: "Push-ups", situp: "Sit-ups", lunge: "Lunges", jumping: "Jumping Jacks", steps: "Walking" };
  const EXI = { squat: "squat", pushup: "pushup", situp: "situp", lunge: "lunge", jumping: "jumping", steps: "walk" };

  const C = { title: "Squats Challenge", ex: "squat", by: "Adesh Pokhrel", byAv: "#9bb7c9,#5e7d99",
    range: "1–30 Jun", freq: "Daily", vis: "Public", status: "active", members: 245, day: 12, days: 30,
    myReps: 240, goal: 600, cover: "linear-gradient(135deg,#1f6e5f,#2a9d8f)",
    desc: "Do squats every day for 30 days. Camera verification counts every rep automatically — climb the board and win." };
  const exName = () => EX[C.ex], exIcon = () => EXI[C.ex];
  const daysLeft = () => Math.max(0, C.days - C.day);
  const statusLabel = () => ({ active: "Active", upcoming: "Upcoming", expired: "Expired", ended: "Ended" }[C.status] || "Active");

  const POSTS = [
    { pi: 5, cap: "Crushed 52 squats today. Legs are on fire!", likes: 120, views: 15600, t: "5m ago", liked: true, g: "linear-gradient(135deg,#2a3d55,#4a6b8a)" },
    { pi: 1, cap: "New personal best — 48 clean reps.", likes: 86, views: 9200, t: "1h ago", liked: false, g: "linear-gradient(135deg,#3a3a5b,#5e60ce)" },
    { pi: 3, cap: "Day 12 done. Consistency wins.", likes: 64, views: 5400, t: "3h ago", liked: false, g: "linear-gradient(135deg,#1f6e5f,#2a9d8f)" },
  ];

  function board() { return S.challengeBoard(C); }
  const meEntry = () => board().find((b) => b.p.me);

  let cur = { v: 1, tab: "members", role: "viewer", sub: null }, _ov = null, _reason = null;

  // ── rings ──
  function ring(pct, size, track, prog, center) {
    const r = size / 2 - 8, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
    return `<div style="position:relative;width:${size}px;height:${size}px;flex:none"><svg width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="8"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${prog}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>
      ${center ? `<div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center">${center}</div>` : ""}</div>`;
  }

  // ── shared leaderboard / members / posts ──
  function podium(top3) {
    const order = [top3[1], top3[0], top3[2]].filter(Boolean), hts = [60, 84, 48];
    return `<div class="lb-podium">${order.map((b, i) => { const first = b.rank === 1;
      return `<div class="lb-pod ${first ? "first" : ""}"><div class="crown">${first ? "👑" : ""}</div><div class="pa" style="background-image:${grad(b.p.av)}"></div>
        <div class="pn">${b.p.me ? "You" : b.p.name.split(" ")[0]}</div><div class="pv">${fmt(b.v)} reps</div>
        <div class="bar" style="height:${hts[i]}px;background:${first ? "linear-gradient(180deg,#ffd66b,#ffb020)" : b.rank === 2 ? "var(--surface-alt)" : "color-mix(in srgb,var(--primary) 35%,transparent)"}"></div></div>`; }).join("")}</div>`;
  }
  function lbRow(b) {
    const m = b.rank === 1 ? "🥇" : b.rank === 2 ? "🥈" : b.rank === 3 ? "🥉" : "";
    return `<div class="lb-row ${b.p.me ? "me" : ""}"><span class="rk">${b.rank}</span><div class="lb-av" style="background-image:${grad(b.p.av)}">${m ? `<span class="m">${m}</span>` : ""}</div>
      <span class="nm">${b.p.me ? "You" : b.p.name}</span><span class="v">${fmt(b.v)} <small>reps</small></span></div>`;
  }
  function leaderboardView() {
    const B = board(), me = B.find((x) => x.p.me), ref = B[0], top3 = B.slice(0, 3), rest = B.slice(3, 9);
    return `<div class="cd-lbwrap">
      ${me ? `<div class="lb-you"><span class="rk">#${me.rank}</span><div class="tx"><b>YOUR RANK</b><span>${me.rank > 1 ? (B[me.rank - 2].v - me.v) + " reps behind #" + (me.rank - 1) : "You're leading!"}</span></div><div class="v">${fmt(me.v)}</div></div>` : ""}
      <div class="lb-ref"><span class="pl">${I("play", 16)}</span><div class="tx"><b>REFERENCE ATTEMPT</b><span>${ref.p.me ? "You" : ref.p.name}</span></div><div class="v">${fmt(ref.v)}</div></div>
      ${podium(top3)}<div style="font:800 12px var(--font);color:var(--text-tertiary);margin:16px 0 2px">OTHERS</div>
      ${rest.map(lbRow).join("")}<div style="height:14px"></div></div>`;
  }
  function membersView() {
    const B = board();
    const row = (b) => { const m = b.rank <= 3 ? ["🥇", "🥈", "🥉"][b.rank - 1] : "";
      return `<div class="cd-m"><span class="rk">${b.rank}</span><div class="av" style="background-image:${grad(b.p.av)}">${m ? `<span class="medal">${m}</span>` : ""}</div>
        <span class="nm">${b.p.me ? "You" : b.p.name}${b.p.me ? '<span class="you">YOU</span>' : ""}${b.rank === 1 ? ' <span class="crown">· Leader</span>' : ""}</span>
        <span class="reps"><span class="z">${I("zap", 13)}</span>${fmt(b.v)} <small>reps</small></span></div>`; };
    return `<div class="cd-attempts" style="padding-top:14px">${fmt(C.members)} members · ranked by reps</div>${B.map(row).join("")}<div style="height:14px"></div>`;
  }
  function postsView() {
    if (!POSTS.length) return `<div class="cd-empty">${I("play", 34)}<div class="t">No posts yet</div><div class="d">Be the first to share a clip from this challenge.</div></div>`;
    return POSTS.map((p, pIdx) => { const pe = S.PEOPLE[p.pi];
      return `<div class="cd-post"><div class="cd-post-h"><div class="av" style="background-image:${grad(pe.av)}"></div>
        <div style="flex:1;min-width:0"><div class="nm"><b>${pe.name}</b> · ${exName()}</div><div class="t">${p.t}<span class="cd-badge ${C.status}">${statusLabel()}</span></div></div>
        <span class="mm" onclick="CDetail.postMenu()">⋯</span></div>
        <div class="cd-post-media" style="background:${p.g}"><div class="cap">${p.cap}</div><span class="play">${I("play", 16)}</span></div>
        <div class="cd-post-a">
          <span class="cd-a"><span class="ib${p.liked ? " liked" : ""}" onclick="this.classList.toggle('liked')">${I("heart", 17)}</span><b onclick="CDetail.likers(${pIdx})">${p.likes}</b></span>
          <span class="cd-a" onclick="CDetail.viewers(${pIdx})">${I("eye", 17)} ${fmt(p.views)}</span>
          <span class="cd-a" onclick="CDetail.postMenu()">${I("share", 17)} Share</span></div></div>`; }).join("");
  }
  function subview(t) { return t === "members" ? membersView() : t === "posts" ? postsView() : leaderboardView(); }
  function tabbar() {
    const tab = (id, label) => `<div class="cd-tab ${cur.tab === id ? "on" : ""}" onclick="CDetail.setTab('${id}')">${label}</div>`;
    return `<div class="cd-tabs">${tab("members", fmt(C.members) + " Members") + tab("posts", "Posts")}</div>`;
  }

  // ── CTA (role + status aware) ──
  function cta() {
    if (C.status === "ended" || C.status === "expired") return `<button class="cd-primary" disabled>Challenge ended</button>`;
    if (cur.role === "viewer") return `<button class="cd-primary" onclick="CDetail.join()">${C.vis === "Private" ? I("lock", 17) + " Request to join" : "Join Challenge"}</button>`;
    return `<button class="cd-primary" onclick="CDetail.record()">${I("camera", 18)} Record ${exName()}</button>
      <button class="cd-chatbtn" onclick="CDetail.chat()">${I("comment", 20)}<span class="bdg">3</span></button>`;
  }

  // ── headers ──
  function badge() { return `<span class="cd-badge ${C.status}">${statusLabel()}</span>`; }
  const mchip = (ic, t) => `<span>${I(ic, 13)} ${t}</span>`;
  function about(extraMeta) { return `<div class="cd-about">${extraMeta ? `<div class="cd-about-meta">${extraMeta}</div>` : ""}<div class="cd-desc2">${C.desc}</div></div>`; }
  function v1() {
    return `<div class="cd1-cover"><div class="img" style="background:${C.cover}"></div>
        <button class="cd-fab back" onclick="CDetail.back()">${I("back", 20)}</button><button class="cd-fab more" onclick="CDetail.menu()">⋯</button>
        <span class="extag">${I(exIcon(), 13)} ${exName()}</span></div>
      <div class="cd1-body"><div class="cd1-crow"><div class="cd1-av" style="background-image:${grad(C.byAv)}"></div>
        <div class="who"><div class="nm">${C.by}</div><div class="role">Creator</div></div>${badge()}</div>
        <div class="cd1-meta"><span>${I("calendar", 13)} ${C.range}</span><span>${I("activity", 13)} ${C.freq}</span><span>${I(C.vis === "Public" ? "users" : "lock", 13)} ${C.vis}</span></div>
        <div class="cd1-title">${C.title}</div><div class="cd1-desc">${C.desc}</div>
        <div class="cd1-cta">${cta()}</div></div>${tabbar()}<div class="cd-sub">${subview(cur.tab)}</div>`;
  }
  function v2() {
    const me = meEntry(), pct = Math.round((C.day / C.days) * 100);
    return `<div class="cd2-top"><div class="cd2-topbar"><button class="bk" onclick="CDetail.back()">${I("back", 20)}</button><div class="tt">${C.title}</div><button class="mm" onclick="CDetail.menu()">⋯</button></div>
        <div class="cd2-hero">${ring(pct, 104, "rgba(255,255,255,.25)", "#fff", `<div style="color:#fff"><b>Day ${C.day}</b><span>of ${C.days}</span></div>`)}
        <div class="r"><b>${C.title}</b><div class="s">${C.freq} · ${C.vis} · ${daysLeft()} days left</div>
          <div class="chips"><span class="chip">${I("trophy", 12)} #${me.rank} of ${fmt(C.members)}</span><span class="chip">${I("zap", 12)} ${fmt(me.v)} reps</span></div></div></div></div>
      ${cur.role === "viewer" ? `<button class="cd2-rec" onclick="CDetail.join()">Join Challenge</button>` : `<button class="cd2-rec" onclick="CDetail.record()">${I("camera", 18)} Record today's ${exName().toLowerCase()}</button>`}
      ${tabbar()}<div class="cd-sub">${subview(cur.tab)}</div>`;
  }
  function v3() {
    const me = meEntry();
    return `<div class="cd3-hero"><div class="img" style="background:${C.cover}"></div><div class="scrim"></div>
        <div class="cd3-fabs"><button class="cd-fab back" onclick="CDetail.back()">${I("back", 20)}</button><button class="cd-fab more" onclick="CDetail.menu()">⋯</button></div>
        <span class="extag">${I(exIcon(), 13)} ${exName()}</span>
        <div class="h1">${C.title}</div>
        <div class="cd3-crow"><div class="av" style="background-image:${grad(C.byAv)}"></div><div class="nm">${C.by}</div>${badge()}</div></div>
      <div class="cd3-glass"><div class="st"><b>${fmt(C.members)}</b><span>MEMBERS</span></div><div class="st"><b>${daysLeft()}</b><span>DAYS LEFT</span></div><div class="st"><b>#${me.rank}</b><span>YOUR RANK</span></div></div>
      ${about(mchip("calendar", C.range) + mchip("activity", C.freq) + mchip(C.vis === "Public" ? "users" : "lock", C.vis))}
      <div class="cd3-cta">${cta()}</div>${tabbar()}<div class="cd-sub">${subview(cur.tab)}</div>`;
  }
  function v4() {
    if (cur.sub) return `<div class="cd4-head"><button class="bk" onclick="CDetail.drill(null)">${I("back", 20)}</button><div class="tt">${cur.sub === "leaderboard" ? "Leaderboard" : cur.sub === "members" ? "Members" : "Posts"}</div><span style="width:40px"></span></div><div class="cd-sub">${subview(cur.sub)}</div>`;
    const me = meEntry(), pct = Math.round((C.day / C.days) * 100), B = board(), top3 = B.slice(0, 3);
    const mini = (b) => `<div class="cd4-mini-row"><div class="av" style="background-image:${grad(b.p.av)}"></div><span class="n">${b.p.me ? "You" : b.p.name}</span><span class="v">${fmt(b.v)} reps</span></div>`;
    const pe = S.PEOPLE[POSTS[0].pi];
    return `<div class="cd4-head"><button class="bk" onclick="CDetail.back()">${I("back", 20)}</button><div class="tt">${C.title}</div><button class="mm" onclick="CDetail.menu()">⋯</button></div>
      <div class="cd4-grid">
        <div class="cd4-card cd4-hero span2"><div class="badge2">${I(exIcon(), 26)}</div><div style="min-width:0"><div class="lbl">${statusLabel()} · ${C.freq} · ${C.vis}</div><div class="t">${C.title}</div><div class="m">by ${C.by} · ${C.range}</div></div></div>
        <div class="cd4-card"><div class="lbl">${I("zap", 12)} Your reps</div><div class="cd4-big">${fmt(me.v)}</div><div class="cd4-sub">rank #${me.rank} of ${fmt(C.members)}</div></div>
        <div class="cd4-card"><div class="lbl">${I("calendar", 12)} Progress</div><div class="cd4-ringmini">${ring(pct, 54, "var(--surface-alt)", "var(--primary)", "")}<div><div class="cd4-big" style="font-size:19px">Day ${C.day}</div><div class="cd4-sub">${daysLeft()} left</div></div></div></div>
        <div class="cd4-card span2"><div class="lbl">${I("trophy", 12)} Leaderboard <span class="seeall" onclick="CDetail.drill('leaderboard')">See all</span></div>${podium(top3)}</div>
        ${cur.role === "viewer" ? `<button class="cd4-rec" onclick="CDetail.join()">Join Challenge</button>` : `<button class="cd4-rec" onclick="CDetail.record()">${I("camera", 18)} Record today's ${exName().toLowerCase()}</button>`}
        <div class="cd4-card span2"><div class="lbl">${I("users", 12)} Members <span class="seeall" onclick="CDetail.drill('members')">See all ${fmt(C.members)}</span></div>${B.slice(0, 3).map(mini).join("")}</div>
        <div class="cd4-card span2"><div class="lbl">${I("play", 12)} Recent posts <span class="seeall" onclick="CDetail.drill('posts')">See all</span></div>
          <div class="cd4-mini-row"><div class="av" style="background-image:${grad(pe.av)}"></div><span class="n">${pe.name}</span><span class="v">${fmt(POSTS[0].views)} views</span></div></div>
      </div><div style="height:20px"></div>`;
  }

  // ═══════ C — floating card ═══════
  function v5() {
    return `<div class="cd5-cover"><div class="img" style="background:${C.cover}"></div>
        <button class="cd-fab back" onclick="CDetail.back()">${I("back", 20)}</button><button class="cd-fab more" onclick="CDetail.menu()">⋯</button>
        <span class="extag">${I(exIcon(), 13)} ${exName()}</span></div>
      <div class="cd5-card"><div class="cd5-titrow"><div class="cd5-title">${C.title}</div>${badge()}</div>
        <div class="cd5-crow"><div class="cd5-av" style="background-image:${grad(C.byAv)}"></div><div><div class="nm">${C.by}</div><div class="role">Creator</div></div></div>
        <div class="cd5-meta"><span>${I("calendar", 13)} ${C.range}</span><span>${I("activity", 13)} ${C.freq}</span><span>${I(C.vis === "Public" ? "users" : "lock", 13)} ${C.vis}</span><span>${I("users", 13)} ${fmt(C.members)}</span></div>
        <div class="cd5-desc">${C.desc}</div></div>
      <div class="cd5-cta">${cta()}</div>${tabbar()}<div class="cd-sub">${subview(cur.tab)}</div>`;
  }
  // ═══════ D — compact icon-led ═══════
  function v6() {
    return `<div class="cd6-top"><div class="cd6-bar"><button class="bk" onclick="CDetail.back()">${I("back", 20)}</button><button class="mm" onclick="CDetail.menu()">⋯</button></div>
        <div class="cd6-row"><div class="cd6-badge">${I(exIcon(), 30)}</div><div style="min-width:0"><div class="t">${C.title}</div><div class="by">by ${C.by} ${badge()}</div></div></div>
        <div class="cd6-pills"><span class="cd6-pill">${I("calendar", 12)} ${C.range}</span><span class="cd6-pill">${I("users", 12)} ${fmt(C.members)} members</span><span class="cd6-pill">${I("clock", 12)} ${daysLeft()} days left</span><span class="cd6-pill">${I("activity", 12)} ${C.freq}</span><span class="cd6-pill">${I(C.vis === "Public" ? "users" : "lock", 12)} ${C.vis}</span></div></div>
      ${about()}<div class="cd6-cta">${cta()}</div>${tabbar()}<div class="cd-sub">${subview(cur.tab)}</div>`;
  }
  // ═══════ E — poster + meta grid ═══════
  function v7() {
    const cell = (ic, k, v) => `<div class="cd7-cell"><div class="ic">${I(ic, 17)}</div><div style="min-width:0"><div class="k">${k}</div><div class="val">${v}</div></div></div>`;
    return `<div class="cd7-hero"><div class="img" style="background:${C.cover}"></div><div class="scrim"></div>
        <div class="cd3-fabs"><button class="cd-fab back" onclick="CDetail.back()">${I("back", 20)}</button><button class="cd-fab more" onclick="CDetail.menu()">⋯</button></div>
        <span class="extag">${I(exIcon(), 13)} ${exName()}</span><div class="h1">${C.title}</div>
        <div class="cr"><div class="av" style="background-image:${grad(C.byAv)}"></div>by ${C.by} ${badge()}</div></div>
      <div class="cd7-grid">${cell(exIcon(), "Exercise", exName())}${cell("activity", "Schedule", C.freq)}${cell("users", "Members", fmt(C.members))}${cell("clock", "Days left", daysLeft())}</div>
      ${about(mchip("calendar", C.range) + mchip(C.vis === "Public" ? "users" : "lock", C.vis))}
      <div class="cd7-cta">${cta()}</div>${tabbar()}<div class="cd-sub">${subview(cur.tab)}</div>`;
  }

  function render() { root.innerHTML = ({ 1: v1, 3: v3, 5: v5, 6: v6, 7: v7 }[cur.v] || v1)(); window.Icons.init(root); root.scrollTop = 0; }

  // ── nav / actions ──
  let root;
  function setTab(t) { cur.tab = t; render(); }
  function drill(s) { cur.sub = s; render(); }
  function back() { location.href = "challenges.html"; }
  function join() { cur.role = "member"; render(); Buzzend.alert({ icon: "trophy", title: "You're in!", message: "You joined “" + C.title + "”. Record a set to climb the board." }); }
  function record() { location.href = "../workout/moment.html"; }

  // sheets
  function mountSheet(inner, center) { const o = document.createElement("div"); o.className = "cd-ov" + (center ? " center" : ""); o.innerHTML = inner; o.addEventListener("click", (e) => { if (e.target === o) close(); }); document.querySelector(".screen").appendChild(o); window.Icons.init(o); _ov = o; }
  function close() { if (_ov) { _ov.remove(); _ov = null; } }
  function menu() {
    let items;
    if (cur.role === "creator") items = `
      <button class="cd-mi" onclick="CDetail.act('edit')"><span class="mic">${I("edit", 18)}</span> Edit challenge</button>
      <button class="cd-mi" onclick="CDetail.act('cover')"><span class="mic">${I("image", 18)}</span> Change cover image</button>
      <button class="cd-mi" onclick="CDetail.act('invite')"><span class="mic">${I("share", 18)}</span> Invite / share code</button>
      <button class="cd-mi danger" onclick="CDetail.confirmDelete()"><span class="mic">${I("trash", 18)}</span> Delete challenge</button>`;
    else if (cur.role === "member") items = `
      <button class="cd-mi" onclick="CDetail.act('invite')"><span class="mic">${I("share", 18)}</span> Invite / share code</button>
      <button class="cd-mi danger" onclick="CDetail.confirmLeave()"><span class="mic">${I("logout", 18)}</span> Leave challenge</button>
      <button class="cd-mi" onclick="CDetail.report()"><span class="mic">${I("flag", 18)}</span> Report</button>`;
    else items = `
      <button class="cd-mi" onclick="CDetail.act('invite')"><span class="mic">${I("share", 18)}</span> Share</button>
      <button class="cd-mi" onclick="CDetail.report()"><span class="mic">${I("flag", 18)}</span> Report</button>`;
    mountSheet(`<div class="cd-sheet"><div class="cd-grab"></div>${items}<button class="cd-mi cancel" onclick="CDetail.close()">Cancel</button></div>`);
  }
  function postMenu() { mountSheet(`<div class="cd-sheet"><div class="cd-grab"></div><button class="cd-mi" onclick="CDetail.close()"><span class="mic">${I("share", 18)}</span> Share post</button><button class="cd-mi danger" onclick="CDetail.report()"><span class="mic">${I("flag", 18)}</span> Report post</button><button class="cd-mi cancel" onclick="CDetail.close()">Cancel</button></div>`); }
  // Liked by / Viewed by — people sheet
  function peopleList(seed, n) { const pool = S.PEOPLE.slice(1); n = Math.min(n, pool.length); const out = []; for (let k = 0; k < n; k++) out.push(pool[(seed + k) % pool.length]); return out; }
  function openPeople(title, ic, total, seed) {
    const rows = peopleList(seed, Math.min(9, total)).map((p) => `<div class="cd-prow"><div class="av" style="background-image:${grad(p.av)}"></div>
      <div class="nm"><b>${p.name}</b><span>${p.friend ? "Following" : "@" + p.name.split(" ")[0].toLowerCase()}</span></div>
      ${p.friend ? `<button class="cd-pfollow on">Following</button>` : `<button class="cd-pfollow" onclick="this.classList.toggle('on');this.textContent=this.classList.contains('on')?'Following':'Follow'">Follow</button>`}</div>`).join("");
    mountSheet(`<div class="cd-sheet"><div class="cd-grab"></div><div class="cd-phead">${I(ic, 18)}<span>${title}</span><b>${fmt(total)}</b></div><div class="cd-people">${rows}</div></div>`);
  }
  function likers(i) { openPeople("Liked by", "heart", POSTS[i].likes, i + 1); }
  function viewers(i) { openPeople("Viewed by", "eye", POSTS[i].views, i + 4); }
  function act(a) { close(); const msg = { edit: ["edit", "Edit challenge", "Opens the create wizard pre-filled with this challenge."], cover: ["image", "Change cover", "Pick a new cover image for this challenge."], invite: ["share", "Invite code: SQ7X2A", "Share this code or link so friends can join instantly."] }[a]; Buzzend.alert({ icon: msg[0], title: msg[1], message: msg[2] }); }

  // report
  const REASONS = ["User is posting abusive content", "User may be under the age of 18", "Something else"];
  function report() { close(); _reason = null; renderReport(); }
  function renderReport() {
    close();
    const rows = REASONS.map((r, i) => `<button class="cd-reason ${_reason === i ? "on" : ""}" onclick="CDetail.pickReason(${i})"><span class="rdo"></span>${r}</button>`).join("");
    mountSheet(`<div class="cd-sheet"><div class="cd-grab"></div><div class="cd-sheet-t">Report challenge</div>${rows}
      <button class="cd-submit" ${_reason === null ? "disabled" : ""} onclick="CDetail.submitReport()">Submit report</button><button class="cd-mi cancel" onclick="CDetail.close()">Cancel</button></div>`);
  }
  function pickReason(i) { _reason = i; renderReport(); }
  function submitReport() { close(); Buzzend.alert({ icon: "flag", title: "Report submitted", message: "Thanks — our team will review this challenge." }); }

  function confirmLeave() { close(); mountSheet(`<div class="cd-dlg"><div class="di">${I("logout", 26)}</div><div class="dt">Leave challenge?</div><div class="dd">You'll lose your spot on the leaderboard. You can re-join anytime.</div><div class="cd-dlg-row"><button class="cd-keep" onclick="CDetail.close()">Stay</button><button class="cd-danger" onclick="CDetail.doLeave()">Leave</button></div></div>`, true); }
  function doLeave() { close(); cur.role = "viewer"; render(); Buzzend.alert({ icon: "logout", title: "Left challenge", message: "You left “" + C.title + "”." }); }
  function confirmDelete() { close(); mountSheet(`<div class="cd-dlg"><div class="di">${I("trash", 26)}</div><div class="dt">Delete this challenge?</div><div class="dd">This permanently removes it for all ${fmt(C.members)} members. This can't be undone.</div><div class="cd-dlg-row"><button class="cd-keep" onclick="CDetail.close()">Cancel</button><button class="cd-danger" onclick="CDetail.doDelete()">Delete</button></div></div>`, true); }
  function doDelete() { close(); Buzzend.alert({ icon: "trash", title: "Challenge deleted", message: "“" + C.title + "” has been removed." }); setTimeout(() => location.href = "challenges.html", 400); }

  // chat
  function chat() {
    const m = (pi, tx, me) => { const pe = me ? S.ME : S.PEOPLE[pi]; return `<div class="cd-chat-msg ${me ? "me" : ""}"><div class="av" style="background-image:${grad(pe.av)}"></div><div class="bub">${me ? "" : `<div class="who">${pe.name.split(" ")[0]}</div>`}<div class="tx">${tx}</div></div></div>`; };
    mountSheet(`<div class="cd-sheet cd-chat"><div class="cd-grab"></div><div class="cd-sheet-t">${C.title} · Group chat</div>
      <div style="flex:1;overflow-y:auto;padding:6px 0">${m(1, "Day 12 and still going strong 💪", false)}${m(5, "Anyone hit 50 today?", false)}${m(null, "Just did 52! Onto the board.", true)}${m(3, "Nice! Catching up tomorrow.", false)}</div>
      <div class="cd-chat-input"><input placeholder="Message the group…"><button onclick="CDetail.close()">${I("send", 18)}</button></div></div>`);
  }

  function start(mountEl, v, role, tab) {
    root = mountEl; cur.v = +v || 1; cur.role = role || "viewer"; cur.tab = tab || "members"; cur.sub = null;
    render();
  }
  return { start, render, setTab, drill, back, join, record, menu, postMenu, likers, viewers, act, report, pickReason, submitReport, renderReport, confirmLeave, doLeave, confirmDelete, doDelete, chat, close };
})();
