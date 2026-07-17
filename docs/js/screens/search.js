/* Search — the screen behind Discover's search bar. Two independent endpoints:
   one searches PEOPLE, one searches CHALLENGES. Both fire in parallel on each
   (debounced) query so switching tabs is instant and each tab carries its own
   result count + loading + empty state. A per-query sequence token guards against
   a slow endpoint overwriting a newer query's results (latest-query-wins).
   UI/UX only — reads the existing Social model, invents no backend fields. */
window.Search = (function () {
  const I = (n, s) => window.Icons.svg(n, s);
  const S = window.Social, fmt = S.fmt, grad = S.grad;
  const RECENT_KEY = "buzzend-recent-search";

  // exercise → icon + color + label (from the shared activity model)
  const exMeta = (k) => S.ACT.find((a) => a.key === k) || { i: "trophy", c: "var(--primary)", n: k };
  const topAct = (p) => S.EX.reduce((b, e) => ((p[e.key] || 0) > (p[b.key] || 0) ? e : b), S.EX[0]);

  // local follow / join overlays (session only — backend unchanged)
  const FOL = {}, JOI = {};
  const findP = (name) => S.PEOPLE.find((p) => p.name === name);
  const isFollowing = (name) => (name in FOL ? FOL[name] : !!(findP(name) || {}).friend);
  const findC = (id) => S.CHALLENGES.find((c) => c.id === id);
  const isJoined = (id) => (id in JOI ? JOI[id] : !!(findC(id) || {}).joined);

  // ── the two "endpoints" (simulated latency, resolve independently) ──
  const matchPeople = (q) => S.PEOPLE.filter((p) => p.name.toLowerCase().includes(q));
  const matchChallenges = (q) =>
    S.CHALLENGES.filter((c) =>
      (c.n + " " + c.by + " " + exMeta(c.ex).n).toLowerCase().includes(q));
  const apiPeople = (q) => new Promise((res) => setTimeout(() => res(matchPeople(q)), 430));
  const apiChallenges = (q) => new Promise((res) => setTimeout(() => res(matchChallenges(q)), 620));

  // state
  let st = {
    q: "", tab: "people", seq: 0, timer: null,
    people: { status: "idle", results: [] },   // status: idle | loading | done
    ch: { status: "idle", results: [] },
  };

  // ── helpers ──
  function esc(s) { return (s + "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  function hl(text, q) {                                   // bold the matched span
    const t = esc(text); if (!q) return t;
    const i = text.toLowerCase().indexOf(q.toLowerCase()); if (i < 0) return t;
    return esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
  }
  function recents() { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch (e) { return []; } }
  function saveRecents(a) { try { localStorage.setItem(RECENT_KEY, JSON.stringify(a.slice(0, 8))); } catch (e) {} }
  function addRecent(term) { const t = (term || "").trim(); if (!t) return; saveRecents([t].concat(recents().filter((x) => x.toLowerCase() !== t.toLowerCase()))); }

  // ── rows ──
  function personRow(p) {
    const fo = isFollowing(p.name), a = topAct(p);
    return `<button class="sr-row" onclick="Search.openPerson('${esc(p.name)}')">
      <span class="sr-av" style="background-image:${grad(p.av)}">${p.initials}</span>
      <span class="sr-meta"><span class="nm">${hl(p.name, st.q)}</span>
        <span class="sub">${I(a.i, 13)}Most active in ${a.n}</span></span>
      <span class="sr-act ${fo ? "on" : ""}" onclick="event.stopPropagation();Search.toggleFollow(this,'${esc(p.name)}')">${fo ? "Following" : "Follow"}</span>
    </button>`;
  }
  function challengeRow(c) {
    const m = exMeta(c.ex), jn = isJoined(c.id);
    const stat = { active: ["Active", "live"], upcoming: ["Upcoming", "soon"], open: ["Open", "open"], ended: ["Ended", "end"] }[c.status] || ["", ""];
    const act = jn ? `<span class="sr-act on">${I("check", 14)}Joined</span>`
      : c.status === "ended" ? `<span class="sr-act ghost">View</span>`
      : `<span class="sr-act" onclick="event.stopPropagation();Search.toggleJoin(this,'${c.id}')">Join</span>`;
    return `<button class="sr-row" onclick="Search.openChallenge('${c.id}')">
      <span class="sr-cover" style="background:${c.cover}">${I(m.i, 22)}</span>
      <span class="sr-meta"><span class="nm">${hl(c.n, st.q)}</span>
        <span class="sub"><span class="sr-pill ${stat[1]}">${stat[0]}</span>${I(c.vis === "Private" ? "lock" : "globe", 12)}${fmt(c.members)} members</span></span>
      ${act}
    </button>`;
  }

  // ── tabs (with per-endpoint counts) ──
  function tabsHtml() {
    const T = (id, label, slice) => {
      const showN = st.q && slice.status === "done";
      return `<button class="sr-tab ${st.tab === id ? "on" : ""}" onclick="Search.setTab('${id}')">${label}${showN ? `<span class="c">${slice.results.length}</span>` : ""}</button>`;
    };
    return T("people", "People", st.people) + T("challenges", "Challenges", st.ch);
  }
  function renderTabs() { const el = document.getElementById("sr-tabs"); if (el) { el.innerHTML = tabsHtml(); } }

  // ── body ──
  function skeleton(n) {
    return `<div class="sr-list">${Array.from({ length: n }, () =>
      `<div class="sr-sk"><span class="c"></span><span class="t"><i></i><b></b></span><span class="p"></span></div>`).join("")}</div>`;
  }
  function noResults() {
    const ppl = st.tab === "people";
    return `<div class="sr-none"><span class="ic">${I("search", 34)}</span>
      <div class="t">No ${ppl ? "people" : "challenges"} found</div>
      <div class="d">We couldn't find any ${ppl ? "people" : "challenges"} matching<br><b>"${esc(st.q)}"</b>. Try a different spelling.</div></div>`;
  }
  function emptyState() {
    const rec = recents();
    const recBlock = rec.length
      ? `<div class="sr-sec"><div class="sr-sh">Recent<button class="lnk" onclick="Search.clearRecent()">Clear all</button></div>
          ${rec.map((r) => `<div class="sr-rec" onclick="Search.useRecent('${esc(r)}')">
            <span class="ic">${I("clock", 16)}</span><span class="tx">${esc(r)}</span>
            <span class="rm" onclick="event.stopPropagation();Search.removeRecent('${esc(r)}')">${I("x", 15)}</span></div>`).join("")}</div>`
      : "";
    const ppl = st.tab === "people";
    const suggested = ppl
      ? `<div class="sr-sec"><div class="sr-sh">${I("users", 16)}Suggested people</div>
          <div class="sr-list">${S.PEOPLE.filter((p) => !p.me).slice(0, 5).map(personRow).join("")}</div></div>`
      : `<div class="sr-sec"><div class="sr-sh">${I("flame", 16)}Trending challenges</div>
          <div class="sr-list">${S.CHALLENGES.filter((c) => c.vis === "Public").slice(0, 5).map(challengeRow).join("")}</div></div>`;
    return recBlock + suggested;
  }
  function resultsHtml() {
    const slice = st.tab === "people" ? st.people : st.ch;
    if (slice.status === "loading" || slice.status === "idle") return skeleton(6);
    if (!slice.results.length) return noResults();
    const rows = (st.tab === "people" ? slice.results.map(personRow) : slice.results.map(challengeRow)).join("");
    return `<div class="sr-count">${slice.results.length} ${st.tab === "people" ? "people" : "challenges"}</div><div class="sr-list">${rows}</div>`;
  }
  function bodyHtml() { return st.q ? resultsHtml() : emptyState(); }
  function renderBody() { const el = document.getElementById("sr-body"); if (el) { el.innerHTML = bodyHtml(); window.Icons.init(el); } }

  // ── search flow ──
  function runSearch() {
    const q = st.q.toLowerCase(), mine = st.seq;                 // capture the current query token
    st.people.status = "loading"; st.ch.status = "loading";
    renderTabs(); renderBody();
    apiPeople(q).then((r) => { if (mine !== st.seq) return; st.people = { status: "done", results: r }; renderTabs(); if (st.tab === "people") renderBody(); });
    apiChallenges(q).then((r) => { if (mine !== st.seq) return; st.ch = { status: "done", results: r }; renderTabs(); if (st.tab === "challenges") renderBody(); });
  }
  function onInput(v) {
    st.q = v; st.seq++;                                          // any keystroke invalidates in-flight responses
    const clr = document.getElementById("sr-clear"); if (clr) clr.classList.toggle("show", !!v);
    clearTimeout(st.timer);
    if (!v.trim()) { st.people = { status: "idle", results: [] }; st.ch = { status: "idle", results: [] }; renderTabs(); renderBody(); return; }
    renderBody();                                                // show skeleton immediately
    st.timer = setTimeout(runSearch, 280);                       // debounce the endpoint calls
  }
  function setTab(t) { st.tab = t; renderTabs(); renderBody(); }
  function clearInput() { const i = document.getElementById("sr-input"); if (i) { i.value = ""; i.focus(); } onInput(""); }
  function useRecent(term) { const i = document.getElementById("sr-input"); if (i) i.value = term; onInput(term); clearTimeout(st.timer); runSearch(); }
  function removeRecent(term) { saveRecents(recents().filter((x) => x !== term)); if (!st.q) renderBody(); }
  function clearRecent() { saveRecents([]); if (!st.q) renderBody(); }

  function toggleFollow(el, name) { const now = !isFollowing(name); FOL[name] = now; el.classList.toggle("on", now); el.textContent = now ? "Following" : "Follow"; }
  function toggleJoin(el, id) { JOI[id] = true; el.className = "sr-act on"; el.innerHTML = I("check", 14) + "Joined"; window.Icons.init(el); Buzzend && Buzzend.alert && Buzzend.alert({ icon: "trophy", title: "You're in!", message: "You joined “" + (findC(id) || {}).n + "”." }); }
  function openPerson(name) {                                    // open the existing profile screen (own vs other)
    addRecent(name); const p = findP(name);
    if (p && p.me) { location.href = "profile.html"; return; }
    const scenario = isFollowing(name) ? "friend" : "stranger";
    location.href = "profile.html?scenario=" + scenario + "&user=" + encodeURIComponent(name);
  }
  function openChallenge(id) { const c = findC(id); addRecent(c ? c.n : id); location.href = "challenge-detail.html?id=" + id; }

  // ── mount + demo states ──
  function start() {
    if (!recents().length) saveRecents(["30-Day Squats", "Push-ups", "Anita"]);   // seed for the prototype
    renderTabs(); renderBody();
    const i = document.getElementById("sr-input");
    if (i) { setTimeout(() => i.focus(), 80); i.addEventListener("keydown", (e) => { if (e.key === "Enter" && st.q.trim()) { clearTimeout(st.timer); addRecent(st.q); runSearch(); i.blur(); } }); }
  }
  function setState(v) {                                          // dev state-switch
    clearTimeout(st.timer); st.seq++;
    const set = (q, tab) => { st.q = q; st.tab = tab; const i = document.getElementById("sr-input"); if (i) i.value = q; const clr = document.getElementById("sr-clear"); if (clr) clr.classList.toggle("show", !!q); };
    if (v === "results") { set("squat", "challenges"); st.people = { status: "done", results: matchPeople("squat") }; st.ch = { status: "done", results: matchChallenges("squat") }; }
    else if (v === "people") { set("an", "people"); st.people = { status: "done", results: matchPeople("an") }; st.ch = { status: "done", results: matchChallenges("an") }; }
    else if (v === "empty") { set("zxq", "challenges"); st.people = { status: "done", results: [] }; st.ch = { status: "done", results: [] }; }
    else if (v === "loading") { set("squat", "challenges"); st.people = { status: "loading", results: [] }; st.ch = { status: "loading", results: [] }; }
    else { set("", "people"); st.people = { status: "idle", results: [] }; st.ch = { status: "idle", results: [] }; }
    renderTabs(); renderBody();
  }

  return { start, setState, onInput, setTab, clearInput, useRecent, removeRecent, clearRecent, toggleFollow, toggleJoin, openPerson, openChallenge };
})();
