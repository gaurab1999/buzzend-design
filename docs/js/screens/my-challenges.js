/* Active challenges · See all — "Your challenges". Reuses the home ring-card
   design (chalx) in a full vertical list, grouped Active / Upcoming / Completed,
   with a name search. Source-aware: from Home (default) the Completed group is
   hidden; from Profile (?from=profile) Completed is shown. Reads window.Social. */
window.MyCh = (function () {
  const I = (n, s) => window.Icons.svg(n, s);
  const S = window.Social, fmt = S.fmt;
  const exMeta = (k) => S.ACT.find((a) => a.key === k) || S.ACT[1];
  let root, from = "home", q = "";
  const matches = (c) => !q || c.n.toLowerCase().includes(q.toLowerCase());

  // same ring markup as Home (HomeData.ring)
  function ring(o) {
    const r = o.r || 21, c = 2 * Math.PI * r, off = c * (1 - o.pct / 100), s = o.size || 50, sw = o.stroke || 5.5;
    return `<div class="ring" style="width:${s}px;height:${s}px"><svg width="${s}" height="${s}">
      <circle cx="${s/2}" cy="${s/2}" r="${r}" fill="none" stroke="var(--surface-alt)" stroke-width="${sw}"/>
      <circle cx="${s/2}" cy="${s/2}" r="${r}" fill="none" stroke="${o.prog||'var(--primary)'}" stroke-width="${sw}"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${s/2} ${s/2})"/></svg>
      ${o.center ? `<div class="ring-center">${o.center}</div>` : ""}</div>`;
  }

  function pctOf(c) {
    if (c.status === "upcoming") return 0;
    return Math.min(100, Math.round((c.myReps / c.goal) * 100));
  }
  function metaOf(c) {
    if (c.status === "upcoming") return `<span class="soon">Starts in ${c.startsIn} ${c.startsIn === 1 ? "day" : "days"}</span> · ${c.days}-day plan`;
    if (c.status === "ended") return `<span class="ended">Ended</span> · ${fmt(c.myReps)} of ${fmt(c.goal)} reps`;
    return `Day ${c.day} of ${c.days} · ${fmt(c.myReps)} reps`;
  }

  function card(c) {
    const m = exMeta(c.ex), pct = pctOf(c), color = c.status === "ended" ? "var(--text-tertiary)" : "var(--primary)";
    const center = c.status === "upcoming"
      ? `<div class="cx-pct" style="font-size:11px">${c.startsIn}d</div>`
      : `<div class="cx-pct">${pct}%</div>`;
    const role = c.createdByMe ? "owner" : "member";
    return `<div class="mc-card${c.status === "ended" ? " done" : ""}" onclick="location.href='challenge-detail.html?role=${role}'">
      <div class="chalx-ring">${ring({ pct, prog: color, center })}<span class="chalx-ex" style="color:${m.c}">${I(m.i, 11)}</span></div>
      <div class="mc-info">
        <div class="cx-name">${c.n}${c.createdByMe ? ' <span class="taf-badge">OWNER</span>' : ""}</div>
        <div class="cx-meta">${metaOf(c)}</div>
        <div class="mc-bar"><i style="width:${Math.max(pct, 2)}%;background:${c.status === "ended" ? "var(--text-tertiary)" : m.c}"></i></div>
      </div>
      <button class="mc-chat" onclick="event.stopPropagation();Buzzend.alert({icon:'comment',title:'${c.n} · Group chat',message:'Open the challenge group chat to cheer members on and share your progress.'})">${I("comment", 17)}</button>
    </div>`;
  }

  function section(label, items) {
    if (!items.length) return "";
    return `<div class="mc-sec">${label} · ${items.length}</div>${items.map(card).join("")}`;
  }

  function render() {
    const mine = S.CHALLENGES.filter((c) => c.joined);
    const showCompleted = from === "profile";
    const filt = mine.filter(matches);
    const active = filt.filter((c) => c.status === "active");
    const upcoming = filt.filter((c) => c.status === "upcoming");
    const ended = filt.filter((c) => c.status === "ended");

    const countEl = document.getElementById("mc-count");
    if (countEl) countEl.textContent = mine.length;
    const qx = document.getElementById("mc-qx");
    if (qx) qx.style.display = q ? "grid" : "none";

    if (!mine.length) {
      root.innerHTML = `<div class="mc-empty"><div class="ic">${I("trophy", 34)}</div>
        <div class="t">No challenges yet</div>
        <div class="d">Join a challenge to compete with friends and stay motivated.</div>
        <button class="btn btn-primary" onclick="location.href='discover.html'">Browse challenges</button></div>`;
      return;
    }

    const shown = active.length + upcoming.length + (showCompleted ? ended.length : 0);
    if (q && !shown) {
      root.innerHTML = `<div class="mc-body"><div class="mc-empty" style="padding:52px 30px">
        <div class="ic">${I("search", 30)}</div><div class="t">No results</div>
        <div class="d">No challenges match “${q}”.</div></div></div>`;
      window.Icons.init(root);
      return;
    }

    root.innerHTML = `<div class="mc-body">
      ${section("Active", active)}
      ${section("Upcoming", upcoming)}
      ${showCompleted ? section("Completed", ended) : ""}
      ${q ? "" : `<div class="mc-browse" onclick="location.href='discover.html'">
        <div class="ic">${I("search", 22)}</div>
        <div><b>Discover more challenges</b><span>Find new goals and friends to compete with</span></div>
        <span class="go">${I("chevron", 20)}</span>
      </div>`}</div>`;
    window.Icons.init(root);
  }

  function search(v) { q = (v || "").trim(); render(); }
  function clearQ() { q = ""; const el = document.getElementById("mc-q"); if (el) { el.value = ""; el.focus(); } render(); }

  function start(mountEl) {
    root = mountEl;
    from = new URLSearchParams(location.search).get("from") === "profile" ? "profile" : "home";
    render();
  }
  return { start, render, search, clearQ };
})();
