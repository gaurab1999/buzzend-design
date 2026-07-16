/* Post / Feed → Competition → Leaderboard  ("Beat it" social loop).
   Flutter parity: lib/modules/competition/  (internally "Competition",
   distinct from group Challenges). A pose activity becomes a post; when a
   post carries a competition (PostResponse.isCompetition + competitionSummary)
   the feed shows an inline leaderboard. "Beat it" → BeatItScreen ("Beat This
   Score") → camera pose activity → the attempt becomes a new post bound back
   to the competition. Ranking is by score (reps) desc, tie-break duration asc.
   Endpoints (reference): GET /post-contents/content-type?type=PUBLIC (feed),
   GET /competitions/{id}, /leaderboard, /my-standing, /posts. */
window.PostLB = (function () {
  const grad = Social.grad, fmt = Social.fmt, I = (n, s) => Icons.svg(n, s);

  // WorkoutType (custom_media_library) — wire code · displayName · icon
  const WT = {
    SQUAT:  { dn: "Squat",        i: "squat" },
    LUNGE:  { dn: "Lunge",        i: "lunge" },
    JJACK:  { dn: "Jumping Jack", i: "jumping" },
    PUSHP:  { dn: "Push-up",      i: "pushup" },
    SITUP:  { dn: "Sit-up",       i: "situp" },
  };

  // people (av = gradient stops, matches social-data.js style)
  const U = {
    riya:   { name: "Riya Bharati",  av: "#caa6c9,#9a5e96" },
    kriti:  { name: "Kriti Karki",   av: "#c9a6a6,#a87766" },
    sh:     { name: "shhdjdjdjdjfjf", av: "#a6c9b5,#5e996f" },
    ema:    { name: "Ema William",   av: "#6a8caf,#33566f" },
    amy:    { name: "Amy",           av: "#57d9a3,#2f9e78", me: true },
    jack:   { name: "Jack",          av: "#4d5bbf,#2f3a8f" },
    neha:   { name: "Neha Rana",     av: "#d98fb0,#a4477a" },
    lauren: { name: "Lauren Gabs",   av: "#c9b59b,#9a7d5e" },
    drake:  { name: "Drake Parker",  av: "#9b9bc9,#5e5e9a" },
    joseph: { name: "Joseph Owl",    av: "#9bc9c1,#5e9a8c" },
    gaurav: { name: "Gaurav Rana",   av: "#b78a5a,#7a5326" },
  };
  const first = (u) => (u.me ? "You" : u.name.split(" ")[0]);
  const initials = (u) => u.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  // an attempt = { user, score(reps), dur(sec) }.  rank(): sort + rank number
  const rank = (attempts) =>
    attempts.slice().sort((a, b) => b.score - a.score || a.dur - b.dur).map((a, i) => ({ ...a, rank: i + 1 }));

  // video thumbnails (stand-ins for previewUrl)
  const THUMB = [
    "linear-gradient(135deg,#3a5a40,#1b3a2a)",
    "linear-gradient(135deg,#4a3a2a,#2a1e14)",
    "linear-gradient(135deg,#2a3a4a,#141e2a)",
    "linear-gradient(135deg,#3a2a4a,#1e142a)",
  ];

  /* ══════════ competitions ══════════ */
  // Feed card #1 — Riya's squat post, populated (matches "post challenge attempted leaderboard")
  const COMP_SQUAT_FEED = {
    id: "c_sq1", wt: "SQUAT", owner: U.riya,
    ownerAttempt: { user: U.riya, score: 5, dur: 8 },
    attempts: [
      { user: U.riya, score: 5, dur: 8 },
      { user: U.sh, score: 3, dur: 13 },
      { user: U.kriti, score: 2, dur: 10 },
    ],
  };
  // Feed card #3 — Kriti's jumping-jack post, no challengers ("Be the first")
  const COMP_JJ_EMPTY = {
    id: "c_jj1", wt: "JJACK", owner: U.kriti,
    ownerAttempt: { user: U.kriti, score: 4, dur: 11 },
    attempts: [{ user: U.kriti, score: 4, dur: 11 }],
  };

  // Main competition for the full leaderboard (SQUAT).  `standing` toggles the
  // viewer's presence → the three LeaderboardState variants (leaderboard_screen.dart:38).
  function mainComp(standing) {
    // Owner (Ema) set the original TARGET; a challenger (Jack) has since BEATEN it
    // and is the current leader / Best Score → Target ≠ Best on the Beat-it screen.
    // delta = rank movement since last refresh (momentum): +up / -down / "new".
    const ownerAttempt = { user: U.ema, score: 9, dur: 8, delta: -1 };   // owner original = Target
    const challengers = [
      { user: U.jack, score: 12, dur: 10, delta: 2 },   // beat the owner → leader / Best
      { user: U.lauren, score: 4, dur: 10, delta: 0 },
      { user: U.drake, score: 3, dur: 14, delta: "new" },
      { user: U.joseph, score: 2, dur: 15, delta: 0 },
    ];
    let attempts;
    if (standing === "onlyOwner") attempts = [ownerAttempt];
    else if (standing === "ranked") attempts = [ownerAttempt, ...challengers, { user: U.amy, score: 7, dur: 9, delta: "new" }];
    else attempts = [ownerAttempt, ...challengers]; // notRanked — viewer absent
    return { id: "c_main", wt: "SQUAT", owner: U.ema, ownerAttempt, attempts, standing };
  }

  /* ══════════ leaderboard CASE matrix (leaderboard_screen.dart parity) ══════════
     Every distinct visual state a NON-OWNER viewer can hit. Owner = Ema throughout;
     her ORIGINAL attempt (9 reps) is always the TARGET strip even when she's outranked.
     att = [userKey, score, durSec, delta].  ownerTot = owner's attempt count
     (splits the "owner only" state: ==1 → empty state, >1 → owner-only podium). */
  const LB_CASES = {
    a:       { t: "a · Owner only — 1st attempt",     owner: "ema", ownerTot: 1, me: null,  att: [["ema", 9, 8, 0]] },
    aN:      { t: "a′ · Owner only — replayed",        owner: "ema", ownerTot: 4, me: null,  att: [["ema", 9, 8, 0]] },
    open3:   { t: "d · Podium slot open — not attempted", owner: "ema", me: null,  att: [["jack", 12, 10, 2], ["ema", 9, 8, -1]] },
    full:    { t: "c · Top-3 full — not attempted",    owner: "ema", me: null,  att: [["jack", 12, 10, 2], ["neha", 10, 9, "new"], ["ema", 9, 8, -1], ["lauren", 8, 12, 0], ["drake", 6, 14, 0]] },
    podium:  { t: "e · You on podium (#2)",            owner: "ema", me: "amy", att: [["jack", 12, 10, 0], ["amy", 10, 9, "new"], ["ema", 9, 8, -1], ["lauren", 8, 12, 0], ["drake", 6, 14, 0]] },
    outside: { t: "f · You outside top-3 (#5)",        owner: "ema", me: "amy", att: [["jack", 12, 10, 0], ["neha", 10, 9, 1], ["ema", 9, 8, -1], ["lauren", 8, 12, 0], ["amy", 6, 11, "new"], ["drake", 4, 14, -1], ["joseph", 2, 15, 0]] },
    leader:  { t: "g · You lead (#1)",                 owner: "ema", me: "amy", att: [["amy", 14, 9, 2], ["jack", 12, 10, -1], ["neha", 10, 9, 0], ["ema", 9, 8, -1], ["lauren", 8, 12, 0]] },
    ended:   { t: "🏁 Challenge ended — final standings", owner: "ema", me: "amy", ended: true, att: [["jack", 12, 10, 0], ["amy", 10, 9, 0], ["ema", 9, 8, 0], ["lauren", 8, 12, 0], ["drake", 6, 14, 0]] },
  };

  function buildLbComp(key) {
    const c = LB_CASES[key] || LB_CASES.podium;
    const attempts = c.att.map(([u, s, d, delta]) => ({ user: U[u], score: s, dur: d, delta }));
    // ownerAttempt is a SEPARATE field (like Flutter) — the TARGET strip always shows the
    // owner's original (Ema, 9/8s) even when the owner isn't a ranked entry on the page.
    return { key, wt: "SQUAT", owner: U[c.owner], ownerTot: c.ownerTot || 1, attempts, ended: !!c.ended,
      ownerAttempt: { user: U[c.owner], score: 9, dur: 8 } };
  }

  // Flutter-faithful derivation (_deriveState + nextAvailableRank + isTopSpotTaken).
  function deriveLb(c) {
    const B = rank(c.attempts);
    const me = B.find((a) => a.user.me) || null;
    const topEntry = B[0];                                   // rank #1 (all "behind"/"catch up" copy references #1)
    const ownerEntry = B.find((a) => a.user.name === c.owner.name) || null;
    const occupied = new Set(B.map((a) => a.rank));
    const nextAvail = !occupied.has(2) ? 2 : !occupied.has(3) ? 3 : null;
    const isTopSpotTaken = B.length ? B[B.length - 1].rank >= 3 : false;
    const onlyOwner = B.length === 1 && B[0].user.name === c.owner.name;
    const state = onlyOwner ? "onlyOwner" : me ? "ranked" : "notRanked";
    return { B, me, topEntry, ownerEntry, occupied, nextAvail, isTopSpotTaken, onlyOwner, state };
  }

  /* ══════════ status / urgency chip ══════════ */
  function statusChip(st) {
    if (!st) return "";
    return st.ended
      ? `<span class="status-chip ended">Ended</span>`
      : `<span class="status-chip live"><span class="d"></span>Live · ${st.txt}</span>`;
  }

  const medalEmoji = (r) => (r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : "");

  /* ══════════ inline competition strip (light card, matches community feed) ══════════
     Sits between the post media and the actions row. Shows top-3 · who-to-beat ·
     one Beat-it CTA. Replaces the old dark glass overlay so the feed matches
     home-v7's community cards. */
  function compStrip(c) {
    const B = rank(c.attempts), w = WT[c.wt];
    const me = B.find((a) => a.user.me);
    const challengers = B.filter((a) => a.user.name !== c.owner.name);
    const chev = `<span class="pc-chev">${I("chevron", 18)}</span>`;
    // one leaderboard row: rank (medal / #) · avatar · name · rep count
    const row = (u, score, rk) => `<div class="pc-r${rk === 1 ? " top" : ""}">
      <span class="pc-rk">${medalEmoji(rk) || `#${rk}`}</span>
      <div class="pc-av" style="background-image:${grad(u.av)}"></div>
      <span class="pc-nm">${u.me ? "You" : first(u)}</span>
      <span class="pc-sc">${score}<small>reps</small></span></div>`;

    if (challengers.length === 0) {
      const o = c.ownerAttempt;
      return `<div class="plbc-comp" onclick="PostLB.go('leaderboard')">
        <div class="pc-head"><span class="pc-tr">🏆</span><span class="pc-tt">${w.dn} Challenge</span>
          <span class="pc-tag hot">Be first</span>
          <span class="pc-right">${chev}</span></div>
        <div class="pc-board">${row(c.owner, o.score, 1)}</div>
        <button class="pc-cta full" onclick="event.stopPropagation();PostLB.go('beatit')">${I("target", 15)} Be #1 — beat ${o.score}</button>
      </div>`;
    }
    return `<div class="plbc-comp" onclick="PostLB.go('leaderboard')">
      <div class="pc-head"><span class="pc-tr">🏆</span><span class="pc-tt">${w.dn} Challenge</span>
        <span class="pc-tag">${challengers.length} competing</span>
        <span class="pc-right">${me ? `<span class="pc-you">You #${me.rank}</span>` : ""}${chev}</span></div>
      <div class="pc-board">${B.slice(0, 3).map((a) => row(a.user, a.score, a.rank)).join("")}</div>
      <button class="pc-cta full" onclick="event.stopPropagation();PostLB.go('beatit')">${I("target", 15)} Beat it</button>
    </div>`;
  }

  // media status pill (top-right): Live · Nd left  /  Ended
  function mediaStatus(st) {
    if (!st) return "";
    return st.ended
      ? `<span class="cf-cstatus ended">Ended</span>`
      : `<span class="cf-cstatus live"><span class="d"></span>Live · ${st.txt}</span>`;
  }

  /* ══════════ FEED — community-card style (home-v7 parity) ══════════
     Each post is a light .cf-card (community.css): inset header + actions,
     edge-to-edge media. Competition posts add compStrip() under the media. */
  const _liked = {};
  function like(i, base, ev) {
    ev.stopPropagation();
    _liked[i] = !_liked[i];
    const on = _liked[i];
    _root.querySelectorAll(`[data-plike="${i}"]`).forEach((el) => el.classList.toggle("liked", on));
    _root.querySelectorAll(`[data-plikec="${i}"]`).forEach((el) => { el.textContent = fmt(base + (on ? 1 : 0)); });
  }

  function feedCard(post, i) {
    const u = post.u, c = post.competition, w = c ? WT[c.wt] : null;
    const sub = post.attemptOf
      ? `${post.time} · challenged <a class="cf-chlink" onclick="event.stopPropagation();PostLB.go('leaderboard')">${first(post.attemptOf)}</a>`
      : c
      ? `${post.time} · <a class="cf-chlink" onclick="event.stopPropagation();PostLB.go('leaderboard')">${I(w.i, 12)} ${w.dn} Challenge</a>`
      : `${post.time}`;
    const dest = c ? "leaderboard" : "video";
    const repBadge = post.repChip
      ? `<span class="cf-cbadge rep"><span class="z">${I("zap", 12)}</span>${post.repChip} reps</span>`
      : c ? `<span class="cf-cbadge">${I(w.i, 12)} ${w.dn}</span>` : "";
    const media = `<div class="cf-card-media" style="background:${post.thumb}" onclick="PostLB.go('${dest}')">
      ${post.cap ? `<div class="cap">${post.cap}</div>` : ""}
      <span class="cf-mplay">${I("play", 20)}</span>
      ${repBadge}${mediaStatus(post.status)}</div>`;
    const actions = `<div class="cf-card-a">
      <span class="cf-a"><span class="like${_liked[i] ? " liked" : ""}" data-plike="${i}" onclick="PostLB.like(${i},${post.likes},event)">${I("heart", 17)}</span><b data-plikec="${i}">${fmt(post.likes + (_liked[i] ? 1 : 0))}</b></span>
      <span class="cf-a">${I("eye", 17)} ${post.views}</span>
      <span class="cf-a">${I("share", 17)} Share</span></div>`;
    return `<div class="cf-card">
      <div class="cf-card-h">
        <div class="av" style="background-image:${grad(u.av)}"></div>
        <div class="who"><div class="nm"><b>${u.name}</b></div><div class="t">${sub}</div></div>
        <button class="mm">${I("more", 18)}</button></div>
      ${media}
      ${c ? compStrip(c) : ""}
      ${actions}</div>`;
  }

  function feed() {
    const posts = [
      { u: U.riya, thumb: THUMB[0], time: "2h ago", likes: 12, views: 340, competition: COMP_SQUAT_FEED, status: { live: true, txt: "2d left" }, cap: "5 clean squats — who's beating this?" },
      { u: U.kriti, thumb: THUMB[1], time: "15d", likes: 8, views: 210, wt: "SQUAT", repChip: 2, attemptOf: U.riya, competition: COMP_SQUAT_FEED, status: { live: true, txt: "2d left" } },
      { u: U.kriti, thumb: THUMB[2], time: "1d ago", likes: 4, views: 88, competition: COMP_JJ_EMPTY, status: { live: true, txt: "5h left" }, cap: "Jumping-jack sprint — beat me!" },
      { u: U.gaurav, thumb: THUMB[3], time: "5min ago", likes: 120, views: "15.6k", cap: "Morning grind, done 💪" },
    ];
    return `<div class="plb-cardfeed"><div class="cf-cards">${posts.map(feedCard).join("")}</div></div>`;
  }

  /* ══════════ BEAT IT — "Beat This Score" (beat_it_screen.dart) ══════════
     Viewer-agnostic (Flutter has NO owner/leader branching). The ONLY layout
     variable: the Best card shows iff bestScorerAttempt exists AND its attempt
     differs from the owner's original. When no one has beaten the owner yet the
     server returns best == owner → single Target card (`single`). */
  function beatIt(mode) {
    const single = mode === "single";                     // no one's beaten the owner yet → one card
    const ended = mode === "ended";                        // competition.active == false / past expiresAt
    const c = mainComp("ranked"), B = rank(c.attempts);
    const target = c.ownerAttempt;                        // ownerOriginalAttempt (Target)
    const best = single ? target : B[0];                  // single ⇒ best == owner attempt (collapse)
    const showVs = !single && best.user.name !== target.user.name;
    const w = WT[c.wt];
    const goal = best.score + 1;
    const champ = best;                                    // whoever holds #1 (owner in single mode)

    // ── hero: the number to beat, front and centre, over a teal gradient ──
    const heroLabel = ended ? "WINNING SCORE" : "SCORE TO BEAT";
    const champLine = ended
      ? `<b>${first(champ.user)}</b> won this challenge`
      : single
      ? `<b>${first(champ.user)}</b> set the pace`
      : `<b>${first(champ.user)}</b> holds #1`;
    const goalLine = ended
      ? `Attempts are closed for this challenge`
      : single
      ? `Be first to <b>${goal}+ reps</b> to claim #1`
      : `Hit <b>${goal}+ reps</b> to take the top spot`;
    const hero = `<div class="bi2-hero">
      <div class="bi2-bar"><span class="bk" onclick="PostLB.go('feed')">${I("back", 22)}</span><span class="ti">${ended ? "Challenge Over" : "Beat This Score"}</span></div>
      <span class="bi2-ex">${I(w.i, 17)} ${w.dn.toUpperCase()}</span>
      <div class="bi2-label">${heroLabel}</div>
      <div class="bi2-big"><span class="n">${best.score}</span><span class="u">reps</span></div>
      <div class="bi2-champ"><span class="crown">${ended ? "🏆" : "👑"}</span>
        <div class="av" style="background-image:${grad(champ.user.av)}"></div>
        <span class="who">${champLine} · ${champ.dur}s</span></div>
      <div class="bi2-goal">${goalLine}</div>
    </div>`;

    // ── head-to-head: original target vs current best (only once beaten) ──
    const vsCard = (cls, lbl, a) => `<div class="vs-card ${cls}">
      <div class="vh"><div class="av" style="background-image:${grad(a.user.av)}"></div>
        <div class="vmeta"><b>${first(a.user)}</b><span>${lbl}</span></div></div>
      <div class="vv"><span class="n">${a.score}</span><small>reps</small></div>
      <div class="vt">${I("clock", 13)} ${a.dur}s</div></div>`;
    const vs = showVs || ended
      ? `<div class="bi2-vs">${vsCard("target", "Original target", target)}<div class="vs-mid">VS</div>${vsCard("best", ended ? "Winner" : "Current best", best)}</div>`
      : `<div class="bi2-vs solo">${vsCard("target", "The one to beat", target)}</div>`;

    // ── how it works ──
    const steps = ended
      ? [`This challenge is now closed`, `${first(best.user)} took the win with ${best.score} reps`, `Start a challenge of your own to compete`]
      : [`Record your ${w.dn.toLowerCase()} attempt`, `AI counts your reps live as you go`, `Beat ${best.score} reps to claim the #1 spot`];
    const how = `<div class="bi2-how"><div class="hh">How it works</div>
      ${steps.map((s, k) => `<div class="step"><span class="k">${k + 1}</span><span class="tx">${s}</span></div>`).join("")}</div>`;

    const cta = ended
      ? `<button class="bi2-start disabled" disabled>Challenge ended</button>`
      : `<button class="bi2-start" onclick="PostLB.go('leaderboard')">${I("target", 20)} Start challenge</button>`;

    return `<div class="bi2${ended ? " ended" : ""}">
      ${hero}
      <div class="bi2-sheet">${vs}${how}</div>
      ${cta}</div>`;
  }

  /* ══════════ FULL LEADERBOARD (leaderboard_screen.dart) ══════════ */
  let _lbTab = "leaderboard", _lbCase = "podium";

  function podium(top3) {
    // Classic rank-based silhouette (centre tallest). Avatars sit ON the pedestal
    // (overlapping the top) with a medal badge; score on the block, name beneath.
    const ht = (r) => (r === 1 ? 96 : r === 2 ? 74 : 60);
    const bg = (r) => (r === 1 ? "linear-gradient(180deg,#ffd66b,#ffb020)"
      : r === 2 ? "linear-gradient(180deg,#e3e8ee,#aeb7c1)"
      : "linear-gradient(180deg,#e6a769,#c17e40)");
    const medal = (r) => (r === 1 ? "🥇" : r === 2 ? "🥈" : "🥉");
    const slot = (r) => {
      const b = top3.find((x) => x.rank === r);
      const first_ = r === 1 ? "first" : "";
      if (!b) return `<div class="lb-pod ghost ${first_}">
        <div class="pa"></div>
        <div class="bar" style="height:${ht(r)}px"><span class="psc ghostn">#${r}</span></div>
        <div class="pn">Open</div></div>`;
      return `<div class="lb-pod ${first_}">
        ${first_ ? `<div class="crown">👑</div>` : ""}
        <div class="pa" style="background-image:${grad(b.user.av)}"><span class="pmedal">${medal(r)}</span></div>
        <div class="bar" style="height:${ht(r)}px;background:${bg(r)}"><span class="psc">${b.score}<small>reps</small></span></div>
        <div class="pn">${first(b.user)}</div></div>`;
    };
    return `<div class="lb-podium">${slot(2)}${slot(1)}${slot(3)}</div>`;
  }

  // ✨ rank-delta chip — movement since last refresh (momentum)
  const deltaChip = (d) => {
    if (d == null || d === 0) return "";
    if (d === "new") return `<span class="rank-delta new">NEW</span>`;
    return d > 0 ? `<span class="rank-delta up">▲${d}</span>` : `<span class="rank-delta down">▼${-d}</span>`;
  };

  const lbRow = (b) => {
    const m = b.rank === 1 ? "🥇" : b.rank === 2 ? "🥈" : b.rank === 3 ? "🥉" : "";
    return `<div class="lb-row ${b.user.me ? "me" : ""}"><span class="rk">${b.rank}</span>
      <div class="lb-av" style="background-image:${grad(b.user.av)}">${m ? `<span class="m">${m}</span>` : ""}</div>
      <span class="nm">${b.user.me ? "You" : b.user.name}${deltaChip(b.delta)}</span>
      <span class="v">${b.score} <small>reps</small></span></div>`;
  };

  function leaderboardTab(c, D) {
    const { B, me, topEntry, isTopSpotTaken, onlyOwner, state } = D;
    const top3 = B.slice(0, 3), others = B.slice(3);
    const owner = c.ownerAttempt;   // owner's ORIGINAL attempt (separate field), not a board entry

    // Rank banner — solid iff the viewer has a standing, else ghost (my-standing null).
    // Copy references the rank DIRECTLY ABOVE (the next one to overtake), not always #1.
    let banner;
    if (me) {
      const above = me.rank > 1 ? B[me.rank - 2] : null;
      const sub = me.rank === 1 ? `You lead · ${me.dur} sec` : `${above.score - me.score} reps behind #${me.rank - 1} ${first(above.user)}`;
      banner = `<div class="lb-you"><span class="rk">#${me.rank}</span>
        <div class="tx"><b>YOUR RANK</b><span>${sub}</span></div><div class="v">${me.score}<small>reps</small></div></div>`;
    } else {
      const txt = c.ended ? "You didn't compete" : onlyOwner ? "Be the first to attempt" : "Not ranked yet";
      const btn = c.ended
        ? `<button class="beat off" disabled>ENDED</button>`
        : `<button class="beat" onclick="PostLB.go('beatit')">BEAT IT</button>`;
      banner = `<div class="lb-ghost"><span class="pf">${I("user", 20)}</span>
        <div class="tx"><b>YOUR RANK</b><span>${txt}</span></div>${btn}</div>`;
    }

    // TARGET ATTEMPT strip — always the owner's ORIGINAL attempt (even if she's outranked).
    const ref = `<div class="lb-ref" onclick="PostLB.go('video')">
      <span class="th" style="background-image:${THUMB[0]}">${I("play", 15)}</span>
      <div class="tx"><b>TARGET ATTEMPT</b><span>${first(owner.user)} · ${owner.dur}s</span></div>
      <div class="v">${owner.score} reps</div></div>`;

    // onlyOwner + single attempt → empty state, NO podium (getNoChallengerLeaderboard).
    if (onlyOwner && c.ownerTot === 1) {
      return `<div class="lbs-body">${banner}<div style="height:9px"></div>${ref}
        <div class="empty" style="margin-top:16px"><div class="ei">🎯</div>
          <div class="et">First attempt starts with you</div>
          <div class="ed">Be the first to take on this challenge and set the pace.</div></div></div>`;
    }

    // Others list — ghost "You" row appended only when notRanked AND top-3 is taken.
    let othersHtml = others.map(lbRow).join("");
    if (state === "notRanked" && isTopSpotTaken) {
      othersHtml += `<div class="lb-row ghost"><span class="rk">?</span>
        <div class="lb-av">YOU</div><span class="nm">You <span style="font-weight:700;color:var(--text-tertiary)">· post to appear here</span></span><span class="v">— reps</span></div>`;
    }
    const othersSec = `<div style="font:800 13px var(--font);color:var(--text-tertiary);margin:18px 0 4px">Others</div>${othersHtml || `<div style="font:700 13px var(--font);color:var(--text-tertiary);padding:8px 2px">No one outside the top 3 yet.</div>`}`;

    return `<div class="lbs-body">${banner}
      <div style="height:9px"></div>${ref}
      ${podium(top3)}
      ${othersSec}
    </div>`;
  }

  function postsTab(c) {
    const B = c.attempts.slice().sort((a, b) => b.score - a.score || a.dur - b.dur);
    const row = (a, i) => `<div class="lb-att" onclick="PostLB.go('video')">
      <span class="th" style="background-image:${THUMB[i % THUMB.length]}">${I("play", 16)}</span>
      <div class="mid"><div class="n">${a.user.me ? "You" : a.user.name}</div><div class="d">${a.dur} sec</div></div>
      <div class="end"><span class="r">${a.score} <small>reps</small></span><span class="chev">${I("chevron", 18)}</span></div></div>`;
    return `<div class="lbs-body">
      <div class="lb-date">25 Jun</div>
      ${B.map((a, i) => row(a, i)).join("")}
    </div>`;
  }

  // Bottom CTA banner text. Ranked copy references the rank directly ABOVE the viewer
  // (the next one to overtake), not always #1.
  function lbCtaText(c, D) {
    const { B, me, nextAvail, onlyOwner, state } = D;
    // Concise, verb-first labels — the CTA records an attempt.
    // onlyOwner ⇒ viewer is always a NON-owner (owner-as-viewer derives `ranked`).
    if (onlyOwner) return "Be the first";
    if (state === "notRanked") return nextAvail === 3 ? "Claim bronze" : "Get ranked";
    if (me.rank === 1) return "Beat your best";
    const above = B[me.rank - 2];
    return `Beat ${first(above.user)}`;
  }

  function leaderboard() {
    const c = buildLbComp(_lbCase), D = deriveLb(c), w = WT[c.wt];
    const attCount = c.attempts.length;
    const avs = D.B.slice(0, 3).map((a) => `<i style="background-image:${grad(a.user.av)}"></i>`).join("");
    const tab = (id, label) => `<div class="t ${_lbTab === id ? "on" : ""}" onclick="PostLB.lbTab('${id}')">${label}</div>`;

    // header indicator: live "N attempted" vs an "Ended" status chip
    const indicator = c.ended ? statusChip({ ended: true }) : `<span class="avs">${avs}</span>${attCount} attempted`;
    // bottom CTA: disabled winner banner when the competition is over
    const cta = c.ended
      ? `<button class="lbs-cta disabled" disabled>🏁 Challenge closed</button>`
      : `<button class="lbs-cta" onclick="PostLB.go('beatit')">${lbCtaText(c, D)} ${I("chevron", 18)}</button>`;

    return `<div class="lbs">
      <div class="lbs-bar"><span class="bk" onclick="PostLB.go('feed')">${I("back", 20)}</span><span class="ti">Leaderboard</span>
        <span class="att">${indicator}</span></div>
      <div class="lbs-owner"><div class="av" style="background-image:${grad(c.owner.av)}"></div>
        <div class="nm">${c.owner.name}</div>
        <span class="exchip">${I(w.i, 16)} ${w.dn.toUpperCase()}</span></div>
      <div class="lbs-tabs">${tab("leaderboard", "Leaderboard")}${tab("posts", "Posts")}</div>
      ${_lbTab === "posts" ? postsTab(c) : leaderboardTab(c, D)}
      ${cta}
    </div>`;
  }

  /* ══════════ VIDEO OPEN STATE (post hero popup) ══════════ */
  function video() {
    const owner = U.kriti;
    return `<div class="plb-video">
      <div class="vbar"><span class="bk" onclick="PostLB.go('leaderboard')">${I("back", 22)}</span></div>
      <div class="stage">
        <div class="vhead"><div class="av" style="background-image:${grad(owner.av)}"></div>
          <div style="flex:1"><div class="nm">${owner.name}</div><div class="dt">25 Jun</div></div>
          <span class="tm">34 sec</span></div>
        <div class="ring"><span class="dot"></span></div>
        <div class="reppill"><span class="n">2</span> <span class="u">reps</span></div>
        <div class="load">Loading video…</div>
      </div></div>`;
  }

  /* ══════════ controller ══════════ */
  let _root, _view = "feed";
  const VIEWS = { feed, beatit: () => beatIt(_biMode), leaderboard, video };
  let _biMode = "beaten";   // beat-it: "beaten" (two cards) | "single" (not beaten yet) | "ended"

  function paint() {
    _root.innerHTML = VIEWS[_view]();
    window.Icons.init(_root);
    // status bar contrast for dark video / cyan beat-it stays default
    const sb = document.getElementById("sb");
    if (sb) sb.style.color = "var(--text-primary)";
  }
  function go(v) { _view = v; syncChips(); paint(); }
  function lbTab(t) { _lbTab = t; paint(); }
  function setCase(k) { _lbCase = k; _lbTab = "leaderboard"; if (_view !== "leaderboard") _view = "leaderboard"; syncChips(); paint(); }
  function setBiMode(m) { _biMode = m; if (_view !== "beatit") _view = "beatit"; syncChips(); paint(); }

  function syncChips() {
    document.querySelectorAll(".state-switch button").forEach((b) => b.classList.toggle("active", b.dataset.v === _view));
    document.querySelectorAll("[data-sub]").forEach((el) => el.style.display =
      (el.dataset.sub === "lb" && _view === "leaderboard") || (el.dataset.sub === "bi" && _view === "beatit") ? "flex" : "none");
    const sel = document.getElementById("lbCase"); if (sel) sel.value = _lbCase;
    document.querySelectorAll("[data-bi]").forEach((b) => b.classList.toggle("active", b.dataset.bi === _biMode));
  }

  function start(root, v) { _root = root; _view = v || "feed"; syncChips(); paint(); }

  return { start, go, lbTab, setCase, setBiMode, like, render: paint };
})();
