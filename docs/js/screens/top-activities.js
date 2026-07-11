/* Top activities · See all — Global / Friends ranking. Your rank pinned on top,
   then the same fc2-card activity design used on Home. Reads window.Social. */
window.TopAct = (function () {
  const I = (n, s) => window.Icons.svg(n, s);
  const S = window.Social, fmt = S.fmt, grad = S.grad, EX = S.EX;
  let root, cur = { scope: "top" };

  function metrics(p) {
    const reps = S.totalReps(p);
    return { reps, kcal: Math.round(reps * 0.55 + p.steps * 0.03), dist: (p.steps / 1350).toFixed(1) + "km", active: Math.round(reps / 6 + p.steps / 240) + "m" };
  }
  // same card design as Home (fc2-card chips)
  function card(entry) {
    const p = entry.p, m = metrics(p), me = p.me;
    const chips = EX.map((e) => p[e.key] ? `<span class="fc2-chip">${I(e.i, 13)} ${p[e.key]}</span>` : "").join("");
    return `<div class="fc2-card${me ? " ta-me" : ""}">
      <div class="fa-head"><span class="ta-rank rank${entry.rank <= 3 ? entry.rank : "x"}">${entry.rank}</span>
        <div class="fa-av" style="background-image:${grad(p.av)}"></div>
        <div class="fa-who"><div class="fa-n">${me ? "You" : p.name}${me ? '<span class="taf-badge">YOU</span>' : ""}</div><div class="fa-t">this week</div></div></div>
      <div class="fc2-chips"><span class="fc2-chip fc2-steps">${I("footprints", 13)} ${fmt(p.steps)}</span>${chips}</div>
      <div class="fc2-foot"><span>${I("flame", 13)} ${fmt(m.kcal)} kcal</span><span>${I("clock", 13)} ${m.active}</span><span>${I("pin", 13)} ${m.dist}</span></div></div>`;
  }

  function render() {
    const scope = cur.scope, board = S.rankBy("reps", scope), me = board.find((x) => x.p.me);
    const totalLabel = scope === "friends" ? `${board.length} friends` : "2,480 people";
    const tab = (s, ic, l) => `<button class="ta-tab ${cur.scope === s ? "on" : ""}" onclick="TopAct.setScope('${s}')">${I(ic, 14)} ${l}</button>`;
    const you = me ? `<div class="taf-you"><span class="rk">${me.rank}</span><div class="av" style="background-image:${grad(me.p.av)}"></div>
      <div class="tx"><div class="t">Your rank ${scope === "friends" ? "among friends" : "globally"}</div>
        <div class="s"><b>#${me.rank}</b> of ${totalLabel} · ${fmt(me.v)} reps this week</div></div></div>` : "";
    root.innerHTML = `<div class="taf-tabs"><div class="ta-tabs">${tab("top", "trophy", "Global") + tab("friends", "users", "Friends")}</div></div>
      <div class="taf-body">${you}<div class="taf-label">${scope === "friends" ? "Friends" : "Everyone"}</div>
      ${board.map(card).join("")}</div>`;
    window.Icons.init(root);
  }
  function setScope(s) { cur.scope = s; render(); root.scrollTop = 0; }
  function start(mountEl, scope) { root = mountEl; cur.scope = scope || "top"; render(); }
  return { start, setScope };
})();
