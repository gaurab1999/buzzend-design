/* Challenges — expert redesign.
   HUB answers "what needs my reps today?" first, then organizes by actionability:
   Today (reps due) → Active → Upcoming → Ended, with Discover promoted. Detail +
   Discover-browse kept for deeper increments. Reads window.Social. Theme/palette aware. */
window.Challenges = (function () {
  const I = (n, s) => window.Icons.svg(n, s);
  const S = window.Social, fmt = S.fmt, grad = S.grad;
  const exMeta = (k) => S.ACT.find((a) => a.key === k) || S.ACT[1];
  const av = (a, cls) => `<div class="${cls}" style="background-image:${grad(a)}"></div>`;
  const bdgBg = (m) => `background-image:linear-gradient(135deg,${m.c},color-mix(in srgb,${m.c} 58%,#000))`;
  const memberAvs = (n) => `<div class="ch-avs">${S.PEOPLE.slice(1, 5).map((p) => `<span class="a" style="background-image:${grad(p.av)}"></span>`).join("")}<span class="more">+${fmt(Math.max(0, n - 4))}</span></div>`;
  function myStanding(c) { const b = S.challengeBoard(c), me = b.find((x) => x.p.me); if (!me) return null; const ahead = me.rank > 1 ? b[me.rank - 2] : null; return { rank: me.rank, total: b.length, gap: ahead ? ahead.v - me.v : 0 }; }

  function ring(pct, c) {
    const r = 27, C = 2 * Math.PI * r, off = C * (1 - pct / 100);
    return `<div class="ch-ring"><svg width="64" height="64"><circle cx="32" cy="32" r="${r}" fill="none" stroke="var(--surface-alt)" stroke-width="7"/>
      <circle cx="32" cy="32" r="${r}" fill="none" stroke="${c || "var(--primary)"}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${off}" transform="rotate(-90 32 32)"/></svg><div class="pc">${pct}%</div></div>`;
  }

  // ════════ HUB ════════
  function headerMain() {
    return `<div class="ch-top"><div class="t">Challenges</div><div class="acts">
      <button class="ch-ic" onclick="Challenges.openDiscover()">${I("search", 18)}</button>
      <button class="ch-ic" onclick="Challenges.create()">${I("plus", 20)}</button></div></div>`;
  }
  const sh = (t, c) => `<div class="ch-sh"><h2>${t}</h2><span class="c">${c}</span></div>`;

  function dueRow(c) {
    const m = exMeta(c.ex), dl = S.daysLeft(c), urgent = dl <= 2;
    return `<div class="ch-due ${urgent ? "urgent" : ""}" onclick="Challenges.openDetail('${c.id}')">
      <div class="bdg" style="${bdgBg(m)}">${I(m.i, 22)}</div>
      <div class="mid"><div class="nm">${c.n}</div><div class="m">${urgent ? `<span class="due">${dl === 0 ? "Ends today" : "Ends in " + dl + "d"}</span> · ` : ""}Target ${S.todayTarget(c)} ${m.n.toLowerCase()} today</div></div>
      <button class="ch-rec" onclick="event.stopPropagation();Challenges.record('${c.id}')">${I("camera", 15)} Record</button></div>`;
  }
  function activeCard2(c) {
    const m = exMeta(c.ex), pct = Math.min(100, Math.round((c.myReps / c.goal) * 100)), dl = S.daysLeft(c), soon = dl <= 2, st = myStanding(c);
    const pill = soon ? `<span class="ch-pill soon">${dl === 0 ? "Last day" : "Ends in " + dl + "d"}</span>` : `<span class="ch-pill day">Day ${c.day}/${c.days}</span>`;
    return `<div class="ch-c2" onclick="Challenges.openDetail('${c.id}')">
      <div class="ch-c2-h"><div class="bdg" style="${bdgBg(m)}">${I(m.i, 24)}</div>
        <div style="flex:1;min-width:0"><div class="nm">${c.n}</div><div class="by">${I("user", 11)} ${c.by}</div></div>${pill}</div>
      <div class="ch-c2-prog"><div class="pl"><span>Your reps · <b>${fmt(c.myReps)}</b>/${fmt(c.goal)}</span>${st ? `<span class="rank">#${st.rank} of ${fmt(st.total)}${st.gap ? " · " + fmt(st.gap) + " to climb" : ""}</span>` : ""}</div>
        <div class="ch-pbar"><i style="width:${pct}%;background:${m.c}"></i></div></div>
      <div class="ch-c2-f">${memberAvs(c.members)}
        ${c.loggedToday ? `<span class="ch-pill logged">${I("check", 11)} Logged today</span>` : `<button class="ch-rec" onclick="event.stopPropagation();Challenges.record('${c.id}')">${I("camera", 14)} Record</button>`}</div></div>`;
  }
  function upcomingCard(c) {
    const m = exMeta(c.ex);
    return `<div class="ch-up" onclick="Challenges.openDetail('${c.id}')"><div class="bdg" style="${bdgBg(m)}">${I(m.i, 22)}</div>
      <div style="flex:1;min-width:0"><div class="nm">${c.n}</div><div class="cd">${I("clock", 12)} Starts in ${c.startsIn} day${c.startsIn > 1 ? "s" : ""}</div></div>
      <button class="lv" onclick="event.stopPropagation();Buzzend.alert({icon:'bell',title:'Reminder set',message:'We will nudge you when ${c.n} starts.'})">Remind me</button></div>`;
  }
  function endedCard(c) {
    const m = exMeta(c.ex), st = myStanding(c), medal = st && st.rank <= 3 ? (st.rank === 1 ? "🥇" : st.rank === 2 ? "🥈" : "🥉") : "";
    return `<div class="ch-ended" onclick="Challenges.openDetail('${c.id}')"><div class="bdg" style="${bdgBg(m)}">${I(m.i, 20)}</div>
      <div style="flex:1;min-width:0"><div class="nm">${c.n}</div><div class="res">Finished ${st ? "#" + st.rank + " of " + fmt(st.total) : ""} · ${fmt(c.myReps)} reps</div></div>
      ${medal ? `<span class="medal">${medal}</span>` : `<span class="ch-pill day">Ended</span>`}</div>`;
  }
  function discoverEntry() {
    const open = S.CHALLENGES.filter((c) => !c.joined).length;
    return `<div class="ch-disc-entry" onclick="Challenges.openDiscover()"><div class="ic">${I("search", 22)}</div>
      <div style="flex:1"><b>Discover challenges</b><span>${open}+ open to join · find your next goal</span></div><span class="go">${I("chevron", 20)}</span></div>`;
  }
  function emptyNew() {
    return headerMain() + `<div class="ch-empty2"><div class="ic">${I("trophy", 38)}</div><div class="t">Turn reps into a game</div>
      <div class="d">Join a challenge to compete with friends, climb the leaderboard and keep your streak alive.</div>
      <button class="btn btn-primary" style="max-width:260px;margin:0 auto" onclick="Challenges.openDiscover()">${I("search", 18)} Browse challenges</button></div>
      <div class="ch-sh"><h2>Popular right now</h2></div><div class="ch-list">${S.CHALLENGES.filter((c) => !c.joined).slice(0, 2).map(discCard).join("")}</div>`;
  }
  function offline() {
    return headerMain() + `<div class="ch-empty2"><div class="ic" style="color:var(--text-tertiary);background:var(--surface-alt)">${I("alert", 36)}</div>
      <div class="t">Can't load challenges</div><div class="d">Check your connection and try again.</div>
      <button class="btn btn-primary" style="max-width:200px;margin:0 auto" onclick="Challenges.retry()">Retry</button></div>`;
  }
  function skeleton() { return headerMain() + `<div style="padding-top:6px"></div><div class="ch-skel sm" style="margin-bottom:16px"></div>` + '<div class="ch-skel"></div>'.repeat(3); }

  function hub(state) {
    if (state === "loading") return skeleton();
    if (state === "offline") return offline();
    const all = S.CHALLENGES;
    let active = all.filter((c) => c.status === "active"), upcoming = all.filter((c) => c.status === "upcoming"), ended = all.filter((c) => c.status === "ended");
    if (state === "new") { active = []; upcoming = []; ended = []; }
    if (state === "ended") { active = []; upcoming = []; }
    if (!(active.length + upcoming.length + ended.length)) return emptyNew();
    const caughtUp = state === "caughtup";
    const due = caughtUp ? [] : active.filter((c) => !c.loggedToday);
    const activeView = caughtUp ? active.map((c) => Object.assign({}, c, { loggedToday: true })) : active;

    let h = headerMain();
    if (due.length) h += `<div class="ch-today"><div class="ch-today-h"><span class="zap">${I("zap", 15)}</span> Needs your reps today<span class="n">${due.length}</span></div>${due.map(dueRow).join("")}</div>`;
    else if (active.length) h += `<div class="ch-caught"><div class="ic">${I("check", 20)}</div><div><b>All caught up today</b><span>Every active challenge logged. Back tomorrow!</span></div></div>`;
    if (activeView.length) h += sh("Active", activeView.length) + activeView.map(activeCard2).join("");
    if (upcoming.length) h += sh("Upcoming", upcoming.length) + upcoming.map(upcomingCard).join("");
    if (ended.length) h += sh("Ended", ended.length) + ended.map(endedCard).join("");
    return h + `<div style="height:6px"></div>` + discoverEntry() + `<div style="height:18px"></div>`;
  }

  // ════════ DISCOVER (browse) — kept for next increment ════════
  function discCard(c) {
    const m = exMeta(c.ex), can = !c.full;
    return `<div class="ch-disc" onclick="Challenges.openDetail('${c.id}')">
      <div class="ch-thumb" style="${bdgBg(m)}">${I(m.i, 26)}</div>
      <div style="flex:1;min-width:0"><div class="nm">${c.n}</div>
        <div class="mt"><span class="ch-meta-chip">${I("users", 12)} ${fmt(c.members)}</span><span class="ch-meta-chip">${I("clock", 12)} ${c.freq}</span><span class="ch-meta-chip">${c.vis}</span></div></div>
      <button class="btn ${can ? "btn-primary" : "btn-ghost"} btn-sm ch-join" ${can ? "" : "disabled style=opacity:.6"} onclick="event.stopPropagation();${can ? "Challenges.join('" + c.id + "',this)" : ""}">${can ? "Join" : "Full"}</button></div>`;
  }
  function discoverView() {
    const cats = [["trophy", "All", true], ["squat", "Squats"], ["pushup", "Push-ups"], ["jumping", "Cardio"], ["situp", "Core"]];
    return `<div class="ch-top"><button class="ch-ic" onclick="Challenges.back()">${I("chevron", 20)}</button><div class="t">Discover</div><span style="width:40px"></span></div>
      <div class="ch-cats">${cats.map(([i, l, on]) => `<button class="ch-cat ${on ? "on" : ""}">${I(i, 15)} ${l}</button>`).join("")}</div>
      <div class="ch-list">${S.CHALLENGES.filter((c) => !c.joined).map(discCard).join("")}</div><div style="height:16px"></div>`;
  }

  // ════════ DETAIL (+ leaderboard) ════════
  function tieRank(board) {
    let lastV = null, rank = 0;
    const ranked = board.map((b, i) => { if (b.v !== lastV) { rank = i + 1; lastV = b.v; } return Object.assign({}, b, { rank }); });
    return ranked.map((b) => Object.assign({}, b, { tie: ranked.filter((x) => x.rank === b.rank).length > 1 }));
  }
  function detail(id) {
    const c = typeof id === "string" ? (S.CHALLENGES.find((x) => x.id === id) || S.CHALLENGES[0]) : id;
    const m = exMeta(c.ex), board = tieRank(S.challengeBoard(c)), me = board.find((b) => b.p.me), top3 = board.slice(0, 3), others = board.slice(3, 8), ref = board[0];
    const onBoard = c.joined && c.myReps > 0 && c.status !== "upcoming";
    const metaChip = (ic, t) => `<span>${I(ic, 13)} ${t}</span>`;
    const stateLabel = c.status === "active" ? "Active" : c.status === "ended" ? "Ended" : c.status === "upcoming" ? "Upcoming" : "Open";
    const chatBtn = `<button class="ch-ic" style="width:54px" onclick="Buzzend.alert({icon:'comment',title:'${c.n} · Group chat',message:'Cheer members and trade tips.'})">${I("comment", 18)}</button>`;
    const remindBtn = `<button class="ch-ic" style="width:54px" onclick="Buzzend.alert({icon:'bell',title:'Reminder set'})">${I("bell", 18)}</button>`;

    let cta;
    if (c.createdByMe) cta = `<button class="btn btn-primary" onclick="Challenges.record('${c.id}')">${I("camera", 18)} Record now</button><button class="ch-ic" style="width:54px" onclick="Buzzend.alert({icon:'user',title:'Manage challenge',message:'Edit details, invite members, or end early — creator tools.'})">${I("user", 18)}</button>`;
    else if (!c.joined) {
      if (c.full) cta = `<button class="btn btn-social" disabled style="opacity:.7;flex:1">Challenge full</button>${remindBtn}`;
      else if (c.vis === "Private") cta = `<button class="btn btn-social" disabled style="opacity:.78;flex:1"><span class="ch-dlock">${I("user", 16)} Invite only</span></button><button class="ch-ic" style="width:54px" onclick="Buzzend.alert({icon:'user',title:'Request sent',message:'The creator will review your request to join.'})">${I("plus", 18)}</button>`;
      else cta = `<button class="btn btn-primary" onclick="Challenges.join('${c.id}',this)">Join challenge</button>`;
    } else if (c.status === "ended") cta = `<button class="btn btn-social" disabled style="opacity:.7;flex:1">Challenge ended</button>`;
    else if (c.status === "upcoming") cta = `<button class="btn btn-social" disabled style="opacity:.82;flex:1">${I("clock", 16)} Starts in ${c.startsIn}d</button>${remindBtn}`;
    else cta = `<button class="btn btn-primary" onclick="Challenges.record('${c.id}')">${I("camera", 18)} ${c.loggedToday ? "Record again" : "Record now"}</button>${chatBtn}`;

    let standing;
    if (onBoard && me) standing = `<div class="lb-you"><span class="rk">#${me.rank}</span><div class="tx"><b>YOUR RANK</b><span>${me.rank > 1 ? (board[me.rank - 2].v - me.v) + " reps behind #" + (me.rank - 1) : "You're leading! 🎉"}</span></div><div class="v">${fmt(me.v)}</div></div>`;
    else if (c.joined && c.status === "upcoming") standing = `<div class="lb-notyet"><div class="ic">${I("clock", 18)}</div><div><b>Not started yet</b><span>Records open when this begins in ${c.startsIn} days.</span></div></div>`;
    else if (c.joined) standing = `<div class="lb-notyet"><div class="ic">${I("camera", 18)}</div><div><b>You're not on the board yet</b><span>Record your first set to claim a rank.</span></div></div>`;
    else standing = `<div class="lb-notyet"><div class="ic">${I("trophy", 18)}</div><div><b>Join to claim your spot</b><span>${fmt(c.members)} already competing — see how you stack up.</span></div></div>`;

    return `<div class="ch-cover" style="background-image:${c.cover}">
        <div class="top-row"><button class="bk" onclick="Challenges.back()">${I("chevron", 20)}</button>
          <button class="more" onclick="Challenges.menu('${c.id}')">⋯</button></div>
        <span class="extag">${I(m.i, 13)} ${m.n}</span></div>
      <div class="ch-dwrap"><div class="ch-dhead">${av(c.byAv, "av")}<div><div class="by">${c.createdByMe ? "You" : c.by}</div><div class="role">Creator</div></div>
        <span class="ch-state ${c.status === "open" ? "open" : c.status}" style="margin-left:auto">${stateLabel}</span></div>
        <div class="ch-dtitle">${c.n}</div>
        <div class="ch-dmeta">${metaChip("clock", c.range) + metaChip("activity", c.freq) + metaChip(c.vis === "Public" ? "users" : "user", c.vis) + metaChip("users", fmt(c.members) + " members")}</div>
        <div class="ch-ddesc">${c.desc}</div>
        <div class="ch-dcta">${cta}</div>
        <div class="ch-dtabs"><div class="ch-dtab on">Leaderboard</div><div class="ch-dtab">${fmt(c.members)} Members</div><div class="ch-dtab">Posts</div></div>
        ${standing}
        <div class="lb-ref"><span class="pl">${I("play", 16)}</span><div class="tx"><b>REFERENCE ATTEMPT</b><span>${ref.p.me ? "You" : ref.p.name}</span></div><div class="v">${fmt(ref.v)}</div></div>
        ${podium(top3)}<div style="font:800 12px var(--font);color:var(--text-tertiary);margin:14px 0 2px">OTHERS</div>
        ${others.map((b) => lbRow(b)).join("")}<div style="height:14px"></div></div>`;
  }
  function podium(top3) {
    const order = [top3[1], top3[0], top3[2]].filter(Boolean), hts = [60, 84, 48];
    return `<div class="lb-podium">${order.map((b, idx) => { const place = b.rank, first = place === 1;
      return `<div class="lb-pod ${first ? "first" : ""}"><div class="crown">${first ? "👑" : ""}</div>${av(b.p.av, "pa")}<div class="pn">${b.p.me ? "You" : b.p.name.split(" ")[0]}</div><div class="pv">${fmt(b.v)} reps</div>
        <div class="bar" style="height:${hts[idx]}px;background:${first ? "linear-gradient(180deg,#ffd66b,#ffb020)" : place === 2 ? "var(--surface-alt)" : "color-mix(in srgb,var(--primary) 35%,transparent)"}"></div></div>`; }).join("")}</div>`;
  }
  function lbRow(b) {
    const medal = b.rank === 1 ? "🥇" : b.rank === 2 ? "🥈" : b.rank === 3 ? "🥉" : "";
    return `<div class="lb-row ${b.p.me ? "me" : ""}"><span class="rk">${b.rank}</span><div class="lb-av" style="background-image:${grad(b.p.av)}">${medal ? `<span class="m">${medal}</span>` : ""}</div>
      <span class="nm">${b.p.me ? "You" : b.p.name}${b.tie ? '<span class="tie">TIED</span>' : ""}</span><span class="v">${fmt(b.v)} <small>reps</small></span></div>`;
  }

  // ⋯ action sheet (share / leave / report)
  let _sheet = null;
  function menu(id) {
    const c = S.CHALLENGES.find((x) => x.id === id); if (!c) return;
    const screen = document.querySelector(".screen");
    const o = document.createElement("div"); o.className = "ch-sheet";
    const leaveItem = c.joined && !c.createdByMe ? `<button class="ch-mi danger" onclick="Challenges.leave('${id}')"><span class="mic">${I("x", 18)}</span> Leave challenge</button>` : "";
    const endItem = c.createdByMe ? `<button class="ch-mi danger" onclick="Challenges.closeSheet();Buzzend.alert({icon:'alert',title:'End challenge?',message:'Ending closes it for all ${c.members} members.'})"><span class="mic">${I("alert", 18)}</span> End challenge</button>` : "";
    o.innerHTML = `<div class="ch-sheet-card"><div class="ch-sheet-grab"></div>
      <button class="ch-mi" onclick="Challenges.closeSheet();Buzzend.alert({icon:'share',title:'Share challenge',message:'Send an invite link to friends.'})"><span class="mic">${I("share", 18)}</span> Share / invite</button>
      ${endItem}${leaveItem}
      <button class="ch-mi" onclick="Challenges.closeSheet();Buzzend.alert({icon:'alert',title:'Reported',message:'Thanks — our team will review this challenge.'})"><span class="mic">${I("alert", 18)}</span> Report</button>
      <button class="ch-mi cancel" onclick="Challenges.closeSheet()">Cancel</button></div>`;
    o.addEventListener("click", (e) => { if (e.target === o) closeSheet(); });
    screen.appendChild(o); window.Icons.init(o); _sheet = o;
  }
  function closeSheet() { if (_sheet) { _sheet.remove(); _sheet = null; } }
  function leave(id) { const c = S.CHALLENGES.find((x) => x.id === id); if (c) c.joined = false; closeSheet(); back(); Buzzend.alert({ icon: "x", title: "Left challenge", message: "You left “" + (c ? c.n : "the challenge") + "”. You can re-join anytime." }); }

  // ════════ state + actions ════════
  let cur = { state: "today", view: "hub", detailId: null };
  function render(state) { cur.state = state || "today"; cur.view = "hub"; cur.detailId = null; return hub(cur.state); }
  function rerender() { const h = document.getElementById("content"); h.innerHTML = cur.view === "detail" ? detail(cur.detailId) : cur.view === "discover" ? discoverView() : hub(cur.state); window.Icons.init(h); h.scrollTop = 0; }
  function openDetail(id) { cur.view = "detail"; cur.detailId = id; rerender(); }
  function openDiscover() { cur.view = "discover"; rerender(); }
  function back() { cur.view = "hub"; cur.detailId = null; rerender(); }
  function retry() { cur.view = "hub"; cur.state = "today"; rerender(); }
  function record(id) { location.href = "../workout/moment.html"; }
  function create() { location.href = "create-challenge.html"; }
  function join(id, btn) { const c = S.CHALLENGES.find((x) => x.id === id); if (c) c.joined = true; if (btn) { btn.textContent = "Joined ✓"; btn.classList.remove("btn-primary"); btn.classList.add("btn-social"); } if (cur.view === "detail") rerender(); else Buzzend.alert({ icon: "trophy", title: "You're in!", message: "You joined “" + (c ? c.n : "the challenge") + "”. Record a set to climb the board." }); }
  return { render, rerender, openDetail, openDiscover, back, retry, record, create, join, menu, closeSheet, leave };
})();
