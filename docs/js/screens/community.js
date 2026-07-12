/* Community — full-bleed feed + post detail viewer. Posts can have MULTIPLE assets
   (Facebook-style grid in Cards). Optimistic like state is shared across every
   surface (feed card, immersive, story, viewer) so a like in one place updates
   everywhere instantly, then syncs to the API in parallel. Designs: Cards ·
   Immersive · Story · Explore. Reads window.Social. */
window.Community = (function () {
  const I = (n, s) => window.Icons.svg(n, s);
  const S = window.Social, fmt = S.fmt, grad = S.grad;
  const EX = { squat: "Squats", pushup: "Push-ups", situp: "Sit-ups", lunge: "Lunges", jumping: "Jumping Jacks", walk: "Walk" };
  const EXI = { squat: "squat", pushup: "pushup", situp: "situp", lunge: "lunge", jumping: "jumping", walk: "walk" };
  const exG = { squat: "linear-gradient(150deg,#1f6e5f,#2a9d8f)", pushup: "linear-gradient(150deg,#8a5a1a,#e0922a)", situp: "linear-gradient(150deg,#1e3a5a,#3b6eff)", jumping: "linear-gradient(150deg,#6a2560,#c0398e)", lunge: "linear-gradient(150deg,#6f1f2a,#ef4444)", walk: "linear-gradient(150deg,#243b57,#4a6b8a)" };
  const IMG = ["linear-gradient(160deg,#c98a3a,#7a4a1e)", "linear-gradient(160deg,#3a6b4a,#1e3a2a)", "linear-gradient(160deg,#4a5a7a,#232b45)", "linear-gradient(160deg,#7a5a8a,#3a2a4a)", "linear-gradient(160deg,#5a7a8a,#2a3a45)"];
  const V = (ex) => ({ type: "video", g: exG[ex] }), IM = (n) => ({ type: "image", g: IMG[n % IMG.length] });

  const FEED = [
    { p: 5, kind: "challenge", ch: "30-Day Squats", ex: "squat", reps: 150, cap: "New squat PR — 150 reps today!", likes: 142, views: 1820, t: "2h", assets: [V("squat")] },
    { p: 6, kind: "photo", cap: "Morning trail run. The views were unreal.", likes: 185, views: 2400, t: "5h", assets: [IM(0), IM(1), IM(2), IM(3), IM(4)] },
    { p: 1, kind: "workout", ex: "pushup", reps: 96, cap: "Crushed 96 push-ups in one set.", likes: 96, views: 1240, t: "3h", assets: [V("pushup"), IM(3)] },
    { p: 3, kind: "challenge", ch: "Jumping Jack Blast", ex: "jumping", reps: 140, cap: "Cardio kickstart done!", likes: 88, views: 990, t: "6h", assets: [V("jumping")] },
    { p: 4, kind: "photo", cap: "Post-workout glow. Rest day tomorrow.", likes: 64, views: 720, t: "8h", assets: [IM(4), IM(0), IM(2)] },
    { p: 2, kind: "workout", ex: "lunge", reps: 64, cap: "Leg day lunges, slow and controlled.", likes: 51, views: 610, t: "1d", assets: [V("lunge"), IM(1), IM(2), IM(0)] },
  ];
  FEED.forEach((p) => { p.liked = false; });   // local like state
  const person = (i) => S.PEOPLE[i] || S.PEOPLE[1];
  const actionText = (post) => post.kind === "challenge" ? `recorded ${fmt(post.reps)} ${EX[post.ex].toLowerCase()}` : post.kind === "workout" ? `posted a workout · ${fmt(post.reps)} reps` : `posted ${post.assets.length} ${post.assets.length > 1 ? "photos" : "photo"}`;

  let cur = { v: "imm", tab: "For you" }, root, _vEl = null;

  /* ── tap-movement guard: ignore taps that were part of a scroll/swipe ── */
  let _tap = { x: 0, y: 0, moved: false };
  document.addEventListener("pointerdown", (e) => { _tap = { x: e.clientX, y: e.clientY, moved: false }; }, true);
  document.addEventListener("pointermove", (e) => { if (Math.abs(e.clientX - _tap.x) > 9 || Math.abs(e.clientY - _tap.y) > 9) _tap.moved = true; }, true);
  const guard = () => _tap.moved;

  /* ── optimistic like: update UI everywhere, then sync API in parallel ── */
  function toggleLike(i, ev) {
    if (ev) ev.stopPropagation();
    if (guard()) return;
    const p = FEED[i]; p.liked = !p.liked; p.likes += p.liked ? 1 : -1;
    syncLike(i); persistLike(i);
  }
  function syncLike(i) {
    document.querySelectorAll(`[data-like="${i}"]`).forEach((el) => el.classList.toggle("liked", FEED[i].liked));
    document.querySelectorAll(`[data-likecount="${i}"]`).forEach((el) => { el.textContent = fmt(FEED[i].likes); });
  }
  const _likeq = {};
  function persistLike(i) {                 // write-behind; roll back on failure
    const want = FEED[i].liked; _likeq[i] = want;
    Promise.resolve().then(() => new Promise((r) => setTimeout(r, 350))).then(() => {
      if (_likeq[i] !== want) return;       // a newer toggle superseded this one
      // success → nothing to do. On error we would revert:
      // FEED[i].liked = !want; FEED[i].likes += want ? -1 : 1; syncLike(i);
    });
  }
  function openProfile(name, ev) { if (ev) ev.stopPropagation(); if (guard()) return; location.href = "user-profile.html?name=" + encodeURIComponent(name); }
  function openChallenge(ev) { if (ev) ev.stopPropagation(); if (guard()) return; location.href = "challenge-detail.html?role=viewer"; }

  /* ── shared like controls (data-* let syncLike update every instance) ── */
  const likeH = (i) => `<span class="cf-a"><span class="like${FEED[i].liked ? " liked" : ""}" data-like="${i}" onclick="Community.toggleLike(${i},event)">${I("heart", 17)}</span><b class="cf-cnt" data-likecount="${i}" onclick="Community.likers(${i},event)">${fmt(FEED[i].likes)}</b></span>`;
  const likeV = (i, sz) => `<button class="like${FEED[i].liked ? " liked" : ""}" data-like="${i}"><span class="ib" onclick="Community.toggleLike(${i},event)">${I("heart", sz)}</span><span class="ct" data-likecount="${i}" onclick="Community.likers(${i},event)">${fmt(FEED[i].likes)}</span></button>`;
  const chLink = (post, ic) => `<a class="cf-chlink" onclick="Community.openChallenge(event)">${ic ? I(EXI[post.ex], 12) + " " : ""}${post.ch}</a>`;

  function header() {
    const tab = (t) => `<div class="cf-tab ${cur.tab === t ? "on" : ""}" onclick="Community.setTab('${t}')">${t}</div>`;
    return `<div class="cf-top"><div class="cf-toprow"><div class="cf-title">Community</div>
      <button class="cf-ic" onclick="Buzzend.alert({icon:'search',title:'Search',message:'Find people and posts.'})">${I("search", 18)}</button>
      <button class="cf-ic" onclick="location.href='compose.html'">${I("plus", 20)}</button></div>
      <div class="cf-tabs">${tab("For you") + tab("Following") + tab("Challenges")}</div></div>`;
  }

  // carousel slides + dots (multi-asset)
  function slides(post) {
    const s = post.assets.map((a) => `<div class="cf-slide" style="background:${a.g}">${a.type === "video" ? `<span class="sl-wm">${I(EXI[post.ex] || "activity", 120)}</span><span class="sl-play">${I("play", 22)}</span>` : ""}</div>`).join("");
    const dots = post.assets.length > 1 ? `<div class="cf-dots">${post.assets.map((a, i) => `<i class="${i === 0 ? "on" : ""}"></i>`).join("")}</div>` : "";
    return `<div class="cf-carousel">${s}</div>${dots}`;
  }
  const chTag = (post) => post.ch ? `<span class="cf-tag cf-chlink" onclick="Community.openChallenge(event)">${I(EXI[post.ex], 13)} ${post.ch}</span>` : "";
  const topRight = (post) => post.reps ? `<span class="cf-rep"><span class="z">${I("zap", 12)}</span>${fmt(post.reps)} ${EX[post.ex].toLowerCase()}</span>`
    : (post.assets.length > 1 ? `<span class="cf-count">${I("image", 12)} ${post.assets.length}</span>` : "");

  // ── Immersive ──
  function immersivePost(post, i) {
    const pe = person(post.p);
    return `<div class="cf-post" onclick="Community.open(${i})">
      <div class="cf-media">${slides(post)}${chTag(post)}${topRight(post)}
        <div class="cf-rail">${likeV(i, 22)}
          <button onclick="event.stopPropagation();Community.viewers(${i},event)"><span class="ib">${I("eye", 22)}</span>${fmt(post.views)}</button>
          <button onclick="event.stopPropagation();Community.postMenu(${i})"><span class="ib">${I("more-v", 22)}</span></button></div>
        <div class="cf-scrim"><div class="cf-author" onclick="Community.openProfile('${pe.name}',event)"><div class="av" style="background-image:${grad(pe.av)}"></div>
          <div><b>${pe.name}</b><div class="tm">${post.t} ago</div></div></div>
          <button class="cf-follow" onclick="event.stopPropagation();this.classList.toggle('on');this.textContent=this.classList.contains('on')?'Following':'Follow'">Follow</button>
          <div class="cf-cap">${post.cap}</div></div></div></div>`;
  }
  const immersive = () => `<div class="cf-imm">${FEED.map(immersivePost).join("")}</div>`;

  // ── Cards (same post design as the Challenge Detail posts section) ──
  function cardBadges(post) {
    return (post.reps ? `<span class="cf-cbadge rep"><span class="z">${I("zap", 12)}</span>${fmt(post.reps)} ${EX[post.ex].toLowerCase()}</span>` : "")
      + (post.ch ? `<span class="cf-cchip cf-chlink" onclick="Community.openChallenge(event)">${I(EXI[post.ex], 12)} ${post.ch}</span>` : "");
  }
  // Facebook-style mosaic: 2 → cols · 3 → 1 big + 2 · 4 → 2×2 · 5+ → 2 top + 3 bottom, "+N"
  function fbGrid(post, i) {
    const n = post.assets.length, show = Math.min(5, n);
    const tiles = post.assets.slice(0, show).map((a, k) => {
      const more = (k === show - 1 && n > show) ? `<span class="cf-more">+${n - show}</span>` : "";
      const play = a.type === "video" ? `<span class="cf-gplay">${I("play", 15)}</span>` : "";
      return `<div class="cf-gt" style="background:${a.g}">${play}${more}</div>`;
    }).join("");
    return `<div class="cf-gridmedia n${show}" onclick="Community.open(${i})">${tiles}${cardBadges(post)}</div>`;
  }
  function subHtml(post) {
    if (post.ch) return `${post.t} ago · ${chLink(post, true)}`;
    return `${post.t} ago · ${post.reps ? EX[post.ex] : post.assets.length + " " + (post.assets.length > 1 ? "photos" : "photo")}`;
  }
  function cardPost(post, i) {
    const pe = person(post.p), n = post.assets.length, a0 = post.assets[0];
    const media = n === 1
      ? `<div class="cf-card-media" style="background:${a0.g}" onclick="Community.open(${i})"><div class="cap">${post.cap}</div>${a0.type === "video" ? `<span class="play">${I("play", 16)}</span>` : ""}${cardBadges(post)}</div>`
      : `<div class="cf-card-cap">${post.cap}</div>${fbGrid(post, i)}`;
    return `<div class="cf-card">
      <div class="cf-card-h">
        <div class="av" style="background-image:${grad(pe.av)}" onclick="Community.openProfile('${pe.name}',event)"></div>
        <div class="who" onclick="Community.openProfile('${pe.name}',event)"><div class="nm"><b>${pe.name}</b></div><div class="t">${subHtml(post)}</div></div>
        <button class="mm" onclick="Community.postMenu(${i})">${I("more", 18)}</button></div>
      ${media}
      <div class="cf-card-a">
        ${likeH(i)}
        <span class="cf-a" onclick="Community.viewers(${i},event)">${I("eye", 17)} ${fmt(post.views)}</span>
        <span class="cf-a" onclick="Community.share()">${I("share", 17)} Share</span></div></div>`;
  }
  const cards = () => `<div class="cf-cards">${FEED.map(cardPost).join("")}</div>`;

  // ── Post options / report sheets ──
  function postMenu(i) {
    Buzzend.sheet({ html: `<div class="cf-pmenu">
      <button class="cf-pm" onclick="Community._close();Community.share()">${I("send", 18)} Share to…</button>
      <button class="cf-pm" onclick="Community._close();Buzzend.alert({icon:'copy',title:'Link copied',message:'Post link copied to your clipboard.'})">${I("copy", 18)} Copy link</button>
      <button class="cf-pm" onclick="Community._close();Buzzend.alert({icon:'eye',title:'Got it',message:'We will show fewer posts like this.'})">${I("eye", 18)} Not interested</button>
      <button class="cf-pm danger" onclick="Community._close();Community.reportPost()">${I("flag", 18)} Report post</button></div>` });
  }
  function reportPost() {
    Buzzend.sheet({ html: `<div class="cf-phead">${I("flag", 18)} <span>Report post</span></div><div class="cf-report">
      ${["It's spam", "Nudity or sexual content", "Violence or harmful content", "False information", "Something else"].map((r, k) => `<label class="cf-rp"><input type="radio" name="rp"${k === 0 ? " checked" : ""}><span>${r}</span></label>`).join("")}
      <button class="cf-submit" onclick="Community._close();Buzzend.alert({icon:'success',title:'Thanks for reporting',message:'Our team will review this post.'})">Submit report</button></div>` });
  }
  function _close() { const o = document.querySelector(".bz-overlay.open"); if (o) { o.classList.remove("open"); setTimeout(() => o.remove(), 220); } }

  // ── Liked by / Viewed by — people bottom sheet ──
  function peopleList(seed, n) { const pool = S.PEOPLE.slice(1); n = Math.min(n, pool.length); const out = []; for (let k = 0; k < n; k++) out.push(pool[(seed + k) % pool.length]); return out; }
  function openPeople(title, ic, total, seed) {
    const rows = peopleList(seed, Math.min(9, total)).map((p) => `<div class="cf-prow"><div class="av" style="background-image:${grad(p.av)}" onclick="Community.openProfile('${p.name}')"></div>
      <div class="nm" onclick="Community.openProfile('${p.name}')"><b>${p.name}</b><span>${p.friend ? "Following" : "@" + p.name.split(" ")[0].toLowerCase()}</span></div>
      ${p.friend ? `<button class="cf-pfollow on">Following</button>` : `<button class="cf-pfollow" onclick="this.classList.toggle('on');this.textContent=this.classList.contains('on')?'Following':'Follow'">Follow</button>`}</div>`).join("");
    Buzzend.sheet({ html: `<div class="cf-phead">${I(ic, 18)} <span>${title}</span><b>${fmt(total)}</b></div><div class="cf-people">${rows}</div>` });
  }
  function likers(i, ev) { if (ev) ev.stopPropagation(); if (guard()) return; openPeople("Liked by", "heart", FEED[i].likes, i + 1); }
  function viewers(i, ev) { if (ev) ev.stopPropagation(); if (guard()) return; openPeople("Viewed by", "eye", FEED[i].views, i + 4); }

  // ── Story ──
  function story() {
    return `<div class="cf-story">${FEED.map((post, i) => {
      const pe = person(post.p);
      return `<div class="cf-post">
        <div class="cf-shead"><div class="av" style="background-image:${grad(pe.av)}" onclick="Community.openProfile('${pe.name}')"></div><div style="flex:1" onclick="Community.openProfile('${pe.name}')"><b>${pe.name}</b><div class="tm">${post.t} ago</div></div>${post.ch ? chTag(post) : ""}<button class="cf-smm" onclick="Community.postMenu(${i})">${I("more", 18)}</button></div>
        <div class="cf-media" onclick="Community.open(${i})">${slides(post)}${topRight(post)}</div>
        <div class="cf-sactions">${likeH(i)}<button onclick="Community.viewers(${i},event)">${I("eye", 20)} ${fmt(post.views)}</button><button class="share" onclick="Community.share()">${I("share", 20)} Share</button></div>
        <div class="cf-scap"><b>${pe.name.split(" ")[0]}</b> ${post.cap}</div></div>`;
    }).join("")}</div>`;
  }

  // ── Explore ──
  function explore() {
    const tall = { 0: true, 4: true, 5: true };
    const idx = [0, 1, 2, 3, 4, 5, 1, 3, 0];
    return `<div class="cf-grid">${idx.map((fi, k) => { const post = FEED[fi];
      return `<div class="cf-tile ${tall[k] ? "tall" : ""}" style="background:${post.assets[0].g}" onclick="Community.open(${fi})">
        <span class="cf-wm">${I(EXI[post.ex] || "activity", tall[k] ? 96 : 66)}</span>
        <span class="tg">${post.assets.length > 1 ? I("image", 14) : post.assets[0].type === "video" ? I("play", 14) : I("image", 14)}</span>
        <span class="ov">${I("eye", 13)} ${fmt(post.views)}</span></div>`; }).join("")}</div>`;
  }

  function render() { root.innerHTML = header() + (cur.v === "cards" ? cards() : cur.v === "story" ? story() : cur.v === "explore" ? explore() : immersive()); window.Icons.init(root); }

  // ── home V7 embed — same post cards (full-bleed) ──
  function homeFeed(state) {
    const h = `<div class="sec"><h2>Community</h2><a href="community.html">See all</a></div>`;
    return h + `<div class="cf-cards" style="margin:0 -18px">${FEED.map(cardPost).join("")}</div>`;
  }

  // ── post detail viewer — TikTok-style endless vertical pager ──
  function vpost(post) {
    const pe = person(post.p), i = FEED.indexOf(post);
    const slides = post.assets.map((a) => `<div class="cf-vslide" style="background:${a.g}">${a.type === "video" ? `<span class="sl-wm">${I(EXI[post.ex] || "activity", 150)}</span>` : ""}</div>`).join("");
    const prog = `<div class="cf-vprog">${post.assets.map(() => `<div class="cf-seg"><i class="fill"></i></div>`).join("")}</div>`;
    const dots = post.assets.length > 1 ? `<div class="cf-vdots">${post.assets.map((a, k) => `<i class="${k === 0 ? "on" : ""}"></i>`).join("")}</div>` : "";
    const tag = post.reps ? `<span class="cf-vtag"><span style="color:#ffd66b;display:inline-flex">${I("zap", 12)}</span> ${fmt(post.reps)} ${EX[post.ex].toLowerCase()}</span>` : (post.assets.length > 1 ? `<span class="cf-vtag">${I("image", 12)} ${post.assets.length} photos</span>` : "");
    const chip = post.ch ? `<div class="cf-vchip cf-chlink" onclick="Community.openChallenge(event)">${I(EXI[post.ex], 13)} ${post.ch}</div>` : "";
    return `<div class="cf-vpost" data-i="${i}"><div class="cf-vassets">${slides}</div><div class="cf-vscrim"></div>
      <span class="cf-vpp">${I("play", 34)}</span>${prog}${dots}${tag}
      <div class="cf-vrail">${likeV(i, 22)}
        <button onclick="Community.viewers(${i},event)"><span class="ib">${I("eye", 22)}</span>${fmt(post.views)}</button>
        <button onclick="Community.postMenu(${i})"><span class="ib">${I("more-v", 22)}</span></button></div>
      <div class="cf-vbottom"><div class="cf-vauthor"><div class="av" style="background-image:${grad(pe.av)}" onclick="Community.openProfile('${pe.name}',event)"></div>
        <div style="flex:1" onclick="Community.openProfile('${pe.name}',event)"><b>${pe.name}</b><div class="tm">${post.t} ago</div></div>
        <button class="cf-vfollow" onclick="event.stopPropagation();this.classList.toggle('on');this.textContent=this.classList.contains('on')?'Following':'Follow'">Follow</button></div>
        <div class="cf-vaction">${actionText(post)}</div><div class="cf-vcap">${post.cap}</div>${chip}</div>
      <div class="cf-vscrub"><i class="fill"></i></div></div>`;
  }
  function appendPosts(feed, arr) {
    arr.forEach((post) => { const tmp = document.createElement("div"); tmp.innerHTML = vpost(post); const node = tmp.firstElementChild; feed.appendChild(node); wireDots(node); attachPlayer(node, post); if (feed._io) feed._io.observe(node); });
  }
  function wireDots(node) {
    const car = node.querySelector(".cf-vassets"), dots = node.querySelector(".cf-vdots");
    if (!dots) return;
    car.addEventListener("scroll", () => { const i = Math.round(car.scrollLeft / Math.max(1, car.clientWidth)); dots.querySelectorAll("i").forEach((d, k) => d.classList.toggle("on", k === i)); });
  }

  /* ── per-post playback: image = 5s auto-advance (top segments) ·
        video = plays; scrubber shows only when paused. Long-press hides chrome. ── */
  function attachPlayer(node, post) {
    const assets = post.assets, car = node.querySelector(".cf-vassets");
    const scrubFill = node.querySelector(".cf-vscrub .fill");
    const segFills = node.querySelectorAll(".cf-vprog .fill");
    let idx = 0, active = false, paused = false, elapsed = 0, last = 0, raf = 0;
    const DUR = () => assets[idx].type === "video" ? 8000 : 5000;
    const isVideo = () => assets[idx].type === "video";

    function paint() {
      node.classList.toggle("is-video", isVideo());
      node.classList.toggle("paused", paused);
      const pct = Math.min(1, elapsed / DUR());
      segFills.forEach((f, k) => { f.style.width = (k < idx ? 1 : k === idx ? pct : 0) * 100 + "%"; });
      if (scrubFill) scrubFill.style.width = pct * 100 + "%";
    }
    function loop(ts) {
      const dt = last ? ts - last : 0; last = ts;
      if (active && !paused) elapsed += dt;
      if (elapsed >= DUR()) { advance(); return; }
      paint(); raf = requestAnimationFrame(loop);
    }
    function run() { cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(loop); }
    function advance() {
      elapsed = 0; last = 0;
      if (isVideo() && assets.length === 1) { paint(); run(); return; }   // single video loops
      if (idx < assets.length - 1) { goAsset(idx + 1); }
      else { const nx = node.nextElementSibling; if (nx) nx.scrollIntoView({ behavior: "smooth" }); else { paint(); run(); } }
    }
    function goAsset(k) { idx = k; car.scrollTo({ left: k * car.clientWidth, behavior: "smooth" }); paint(); run(); }
    const readIdx = () => Math.max(0, Math.min(assets.length - 1, Math.round(car.scrollLeft / Math.max(1, car.clientWidth))));
    function activate() { if (active) return; active = true; paused = false; idx = readIdx(); elapsed = 0; paint(); run(); }
    function deactivate() { active = false; cancelAnimationFrame(raf); raf = 0; elapsed = 0; last = 0; paused = false; paint(); }
    function setPaused(p) { paused = p; last = 0; paint(); }
    function togglePause() { paused = !paused; last = 0; paint(); }
    car.addEventListener("scroll", () => { const k = readIdx(); if (k !== idx) { idx = k; elapsed = 0; last = 0; paint(); if (active) run(); } });
    node._player = { activate, deactivate, setPaused };

    // tap = play/pause · long-press = peek (hide chrome + pause)
    const CHROME = "button, a, .cf-vrail, .cf-vbottom, .cf-vback, .cf-vdots, .cf-vchip, .ct, .cf-cnt, [data-like], .cf-chlink";
    let lt = 0, longed = false, dx = 0, dy = 0;
    node.addEventListener("pointerdown", (e) => {
      if (e.target.closest(CHROME)) return;
      dx = e.clientX; dy = e.clientY; longed = false;
      lt = setTimeout(() => { longed = true; node.classList.add("peek"); const vw = node.closest(".cf-viewer"); if (vw) vw.classList.add("peeking"); setPaused(true); }, 340);
    });
    const unpeek = () => { node.classList.remove("peek"); const vw = node.closest(".cf-viewer"); if (vw) vw.classList.remove("peeking"); };
    const end = (e) => {
      clearTimeout(lt);
      if (longed) { longed = false; unpeek(); setPaused(false); return; }
      if (e.target.closest(CHROME)) return;
      if (Math.abs(e.clientX - dx) > 9 || Math.abs(e.clientY - dy) > 9) return;   // was a swipe
      togglePause();
    };
    node.addEventListener("pointerup", end);
    node.addEventListener("pointercancel", () => { clearTimeout(lt); if (longed) { longed = false; unpeek(); setPaused(false); } });
    paint();
  }

  function open(i) {
    const startArr = FEED.slice(i).concat(FEED.slice(0, i));
    const o = document.createElement("div"); o.className = "cf-viewer";
    o.innerHTML = `<button class="cf-vback" onclick="Community.closeViewer()">${I("back", 20)}</button><div class="cf-vfeed"></div>`;
    document.querySelector(".screen").appendChild(o); _vEl = o;
    const feed = o.querySelector(".cf-vfeed");
    feed._io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { const pl = e.target._player; if (!pl) return; (e.isIntersecting && e.intersectionRatio >= 0.6) ? pl.activate() : pl.deactivate(); });
    }, { root: feed, threshold: [0, 0.6, 1] });
    appendPosts(feed, startArr); appendPosts(feed, FEED);
    feed.addEventListener("scroll", () => { if (feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 1200) appendPosts(feed, FEED); });
    requestAnimationFrame(() => { const first = feed.querySelector(".cf-vpost"); if (first && first._player) first._player.activate(); });
  }
  function closeViewer() { if (_vEl) { if (_vEl.querySelector(".cf-vfeed")._io) _vEl.querySelector(".cf-vfeed")._io.disconnect(); _vEl.remove(); _vEl = null; } }

  function setTab(t) { cur.tab = t; render(); }
  function share() { Buzzend.alert({ icon: "share", title: "Share post", message: "Send this to friends or your story." }); }
  function start(mountEl, v) { root = mountEl; cur.v = v || "imm"; cur.tab = "For you"; render(); }
  return { start, render, homeFeed, setTab, open, closeViewer, share, postMenu, reportPost, _close, likers, viewers, toggleLike, openProfile, openChallenge };
})();
