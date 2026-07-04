/* Discover / Challenges — faithful port of the old Flutter SearchDiscoverScreen.
   Sections: search header (search · Create Challenge · Join with Code) → Categories
   (multi-select workout chips) → 🔥 Trending Today (cards + Join) → People you may
   want to follow. Includes empty states, skeletons, and the join-with-code dialog. */
window.Discover = (function () {
  const I = (n, s) => window.Icons.svg(n, s);
  const S = window.Social, fmt = S.fmt, grad = S.grad;

  // workout-type categories (drives chips + trending filter)
  const CATS = [
    { code: "squat", n: "Squats", i: "squat" }, { code: "pushup", n: "Push-ups", i: "pushup" },
    { code: "situp", n: "Sit-ups", i: "situp" }, { code: "jumping", n: "Jumping Jacks", i: "jumping" },
    { code: "lunge", n: "Lunges", i: "lunge" }, { code: "steps", n: "Walking", i: "walk" },
  ];
  const labelFor = (code) => (CATS.find((c) => c.code === code) || {}).n || code;
  const iconFor = (code) => (CATS.find((c) => c.code === code) || {}).i || "trophy";

  // trending public challenges (not joined, non-expired) — no Lunges → demos empty filter
  const TREND = [
    { title: "30-Day Squat Streak", code: "squat", members: 245 },
    { title: "Sunrise Squats", code: "squat", members: 88 },
    { title: "Push-up Power", code: "pushup", members: 132 },
    { title: "100 Push-up Club", code: "pushup", members: 1240 },
    { title: "Core Crusher · Sit-ups", code: "situp", members: 410 },
    { title: "Jumping Jack Blast", code: "jumping", members: 12400 },
    { title: "Cardio Kickstart", code: "jumping", members: 320 },
    { title: "10K Steps Daily", code: "steps", members: 5600 },
  ];
  // suggested people to follow
  const PEOPLE = S.PEOPLE.slice(1).map((p, i) => ({ name: p.name, av: p.av, initials: p.initials, followed: false, id: i }));
  // accent cycle (teal→primary, then fixed content colors) — matches old [teal, blue, purple, amber]
  const ACC = [{ c: "var(--primary)", t: "var(--on-primary)" }, { c: "#3b82f6", t: "#fff" }, { c: "#8b5cf6", t: "#fff" }, { c: "#f59e0b", t: "#fff" }];

  let cur = { state: "loaded", selected: [], filtering: false }, _dlg = null;

  // ── header (fixed) ──
  function header() {
    return `<div class="dc-head">
      <div class="dc-search" onclick="Discover.search()">${I("search", 18)}<span class="txt">Search challenges, people…</span></div>
      <div class="dc-actions">
        <button class="dc-btn create" onclick="Discover.createChallenge()"><span class="plus">+</span> Create Challenge</button>
        <button class="dc-btn code" onclick="Discover.joinCode()">🔗 Join with Code</button>
      </div></div>`;
  }

  // ── sections ──
  const sh = (title, spin) => `<div class="dc-sh"><h2>${title}</h2>${spin ? '<span class="spin"></span>' : ""}</div>`;

  function categoriesSec() {
    if (cur.state === "loading") return `<div class="dc-sec"><div class="dc-sh"><h2>Categories</h2></div><div class="dc-scroll">${'<div class="dc-chip-skel"></div>'.repeat(5)}</div></div>`;
    const chips = CATS.map((c) => `<button class="dc-chip ${cur.selected.includes(c.code) ? "on" : ""}" onclick="Discover.toggleCat('${c.code}')">${c.n}</button>`).join("");
    return `<div class="dc-sec">${sh("Categories")}<div class="dc-scroll">${chips}</div></div>`;
  }

  function trendingCard(t, i) {
    const a = ACC[i % ACC.length];
    return `<div class="dc-tcard" style="border:1.5px solid color-mix(in srgb,${a.c} 25%,transparent);background:linear-gradient(135deg,color-mix(in srgb,${a.c} 12%,transparent),color-mix(in srgb,${a.c} 4%,transparent))">
      <div class="ic" style="color:${a.c}">${I(iconFor(t.code), 40)}</div>
      <div class="nm">${t.title}</div>
      <div class="cnt" style="color:${a.c}"><span class="dot" style="background:${a.c}"></span>${fmt(t.members)} joining</div>
      <button class="join" style="background:${a.c};color:${a.t}" onclick="event.stopPropagation();Discover.join(this,'${t.title.replace(/'/g, "")}')">Join</button></div>`;
  }
  function trendingSec() {
    if (cur.state === "loading") return `<div class="dc-sec t18">${sh("🔥 Trending Today")}<div class="dc-scroll">${'<div class="dc-tskel"></div>'.repeat(3)}</div></div>`;
    const list = cur.selected.length ? TREND.filter((t) => cur.selected.includes(t.code)) : TREND;
    let inner;
    if (!list.length) {
      const single = cur.selected.length === 1 ? cur.selected[0] : null;
      inner = `<div class="dc-empty"><div class="ei">${I(single ? iconFor(single) : "trophy", 40)}</div>
        <div class="et">${single ? "No " + labelFor(single) + " challenges yet" : "No challenges yet"}</div>
        <div class="ed">Use the ‘Create challenge’ button<br/>to get started.</div></div>`;
    } else {
      inner = `<div class="dc-scroll">${list.map(trendingCard).join("")}</div>`;
    }
    return `<div class="dc-sec t18">${sh("🔥 Trending Today", cur.filtering)}${inner}</div>`;
  }

  function personCard(p) {
    return `<div class="dc-person">
      <div class="dc-pav" style="background-image:${grad(p.av)}">${p.initials}</div>
      <div class="pn">${p.name.split(" ")[0]}</div>
      <button class="dc-follow ${p.followed ? "yes" : "no"}" onclick="Discover.follow(this,${p.id})">${p.followed ? "Following" : "Follow"}</button></div>`;
  }
  function peopleSec() {
    if (cur.state === "loading") {
      const sk = '<div class="dc-pskel"><div class="c"></div><div class="b"></div><div class="p"></div></div>';
      return `<div class="dc-sec t18">${sh("People you may want to follow")}<div class="dc-scroll">${sk.repeat(3)}</div></div>`;
    }
    if (!PEOPLE.length) return `<div class="dc-sec t18">${sh("People you may want to follow")}<div class="dc-none">No suggestions right now.</div></div>`;
    return `<div class="dc-sec t18">${sh("People you may want to follow")}<div class="dc-scroll">${PEOPLE.slice(0, 7).map(personCard).join("")}</div></div><div style="height:24px"></div>`;
  }

  function body() { return categoriesSec() + trendingSec() + peopleSec(); }
  function rebody() { const el = document.getElementById("content"); el.innerHTML = body(); window.Icons.init(el); }

  // ── interactions ──
  function toggleCat(code) {
    if (cur.state === "loading") return;
    cur.selected = cur.selected.includes(code) ? cur.selected.filter((c) => c !== code) : cur.selected.concat(code);
    cur.filtering = true; rebody();
    setTimeout(() => { cur.filtering = false; if (document.getElementById("content")) rebody(); }, 500);
  }
  function follow(btn, id) { const p = PEOPLE.find((x) => x.id === id); if (!p) return; p.followed = !p.followed; btn.textContent = p.followed ? "Following" : "Follow"; btn.className = "dc-follow " + (p.followed ? "yes" : "no"); }
  function join(btn, title) { Buzzend.alert({ icon: "trophy", title: "You're in!", message: "You joined “" + title + "”. Record a set to climb the board." }); }
  function search() { Buzzend.alert({ icon: "search", title: "Search", message: "Search challenges and people by name — opens the search screen." }); }
  function createChallenge() { location.href = "create-challenge.html"; }

  // ── join-with-code dialog (faithful validation) ──
  function joinCode() {
    const screen = document.querySelector(".screen");
    const o = document.createElement("div"); o.className = "dc-ov";
    o.innerHTML = `<div class="dc-dlg">
      <div class="dt">Join using code or link</div>
      <div class="dsub">Use your invite code or link to join instantly</div>
      <div class="dcap">Codes from links are detected automatically</div>
      <div class="dc-field"><label>Invitation</label><input id="dc-code" placeholder="Enter the code or link" autocomplete="off" spellcheck="false"></div>
      <div class="dc-err" id="dc-err"></div>
      <div class="dc-dlg-actions" id="dc-acts"><button onclick="Discover.closeDlg()">Cancel</button><button onclick="Discover.submitCode()">Join</button></div></div>`;
    o.addEventListener("click", (e) => { if (e.target === o) closeDlg(); });
    screen.appendChild(o); _dlg = o;
    const inp = o.querySelector("#dc-code"); setTimeout(() => inp.focus(), 60);
    inp.addEventListener("input", () => { o.querySelector("#dc-err").textContent = ""; });
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") submitCode(); });
  }
  function submitCode() {
    if (!_dlg) return;
    const inp = _dlg.querySelector("#dc-code"), err = _dlg.querySelector("#dc-err");
    let v = (inp.value || "").trim();
    if (/https?:\/\//i.test(v)) { const mm = v.match(/([a-zA-Z0-9]{6})(?![a-zA-Z0-9])/); if (mm) v = mm[1]; }        // extract code from a link
    if (!v) { err.textContent = "Enter the code."; return; }
    if (!/^[a-zA-Z0-9]+$/.test(v)) { err.textContent = "Use only letters and numbers in the code."; return; }
    if (v.length !== 6) { err.textContent = "The code should be 6 characters long."; return; }
    _dlg.querySelector("#dc-acts").innerHTML = '<div class="dc-dlg-spin"></div>';           // processing
    setTimeout(() => { closeDlg(); Buzzend.alert({ icon: "trophy", title: "Joined!", message: "You joined the challenge with code “" + v.toUpperCase() + "”." }); }, 900);
  }
  function closeDlg() { if (_dlg) { _dlg.remove(); _dlg = null; } }

  function render(state) {
    cur.state = state === "loading" ? "loading" : "loaded";
    cur.selected = state === "emptyfilter" ? ["lunge"] : [];
    cur.filtering = false;
    return body();
  }
  return { header, render, rebody, toggleCat, follow, join, search, createChallenge, joinCode, submitCode, closeDlg };
})();
