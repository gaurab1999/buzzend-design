/* Community — impressive full-bleed feed. Posts can have MULTIPLE assets (image +
   video carousel), be image-only, and are NOT always tied to a challenge. Challenge
   posts show the user's reps. No duration timing. Tapping a post opens a full-screen
   story-style detail viewer. Designs: Immersive · Story · Explore. Reads Social. */
window.Community = (function () {
  const I = (n, s) => window.Icons.svg(n, s);
  const S = window.Social, fmt = S.fmt, grad = S.grad;
  const EX = { squat: "Squats", pushup: "Push-ups", situp: "Sit-ups", lunge: "Lunges", jumping: "Jumping Jacks", walk: "Walk" };
  const EXI = { squat: "squat", pushup: "pushup", situp: "situp", lunge: "lunge", jumping: "jumping", walk: "walk" };
  const exG = { squat: "linear-gradient(150deg,#1f6e5f,#2a9d8f)", pushup: "linear-gradient(150deg,#8a5a1a,#e0922a)", situp: "linear-gradient(150deg,#1e3a5a,#3b6eff)", jumping: "linear-gradient(150deg,#6a2560,#c0398e)", lunge: "linear-gradient(150deg,#6f1f2a,#ef4444)", walk: "linear-gradient(150deg,#243b57,#4a6b8a)" };
  const IMG = ["linear-gradient(160deg,#c98a3a,#7a4a1e)", "linear-gradient(160deg,#3a6b4a,#1e3a2a)", "linear-gradient(160deg,#4a5a7a,#232b45)", "linear-gradient(160deg,#7a5a8a,#3a2a4a)", "linear-gradient(160deg,#5a7a8a,#2a3a45)"];
  const V = (ex) => ({ type: "video", g: exG[ex] }), IM = (n) => ({ type: "image", g: IMG[n % IMG.length] });

  // kind: 'challenge' (reps + challenge link) · 'workout' (reps, no challenge) · 'photo' (image(s), no reps/challenge)
  const FEED = [
    { p: 5, kind: "challenge", ch: "30-Day Squats", ex: "squat", reps: 150, cap: "New squat PR — 150 reps today!", likes: 142, views: 1820, t: "2h", assets: [V("squat")] },
    { p: 6, kind: "photo", cap: "Morning trail run. The views were unreal.", likes: 185, views: 2400, t: "5h", assets: [IM(0), IM(1), IM(2)] },
    { p: 1, kind: "workout", ex: "pushup", reps: 96, cap: "Crushed 96 push-ups in one set.", likes: 96, views: 1240, t: "3h", assets: [V("pushup"), IM(3)] },
    { p: 3, kind: "challenge", ch: "Jumping Jack Blast", ex: "jumping", reps: 140, cap: "Cardio kickstart done!", likes: 88, views: 990, t: "6h", assets: [V("jumping")] },
    { p: 4, kind: "photo", cap: "Post-workout glow. Rest day tomorrow.", likes: 64, views: 720, t: "8h", assets: [IM(4)] },
    { p: 2, kind: "workout", ex: "lunge", reps: 64, cap: "Leg day lunges, slow and controlled.", likes: 51, views: 610, t: "1d", assets: [V("lunge"), IM(1), IM(2), IM(0)] },
  ];
  const person = (i) => S.PEOPLE[i] || S.PEOPLE[1];
  const actionText = (post) => post.kind === "challenge" ? `recorded ${fmt(post.reps)} ${EX[post.ex].toLowerCase()}` : post.kind === "workout" ? `posted a workout · ${fmt(post.reps)} reps` : `posted ${post.assets.length} ${post.assets.length > 1 ? "photos" : "photo"}`;

  let cur = { v: "imm", tab: "For you" }, root, _vEl = null;

  function header() {
    const tab = (t) => `<div class="cf-tab ${cur.tab === t ? "on" : ""}" onclick="Community.setTab('${t}')">${t}</div>`;
    return `<div class="cf-top"><div class="cf-toprow"><div class="cf-title">Community</div>
      <button class="cf-ic" onclick="Buzzend.alert({icon:'search',title:'Search',message:'Find people and posts.'})">${I("search", 18)}</button>
      <button class="cf-ic" onclick="location.href='../workout/moment.html'">${I("plus", 20)}</button></div>
      <div class="cf-tabs">${tab("For you") + tab("Following") + tab("Challenges")}</div></div>`;
  }

  // carousel slides + dots (multi-asset)
  function slides(post) {
    const s = post.assets.map((a) => `<div class="cf-slide" style="background:${a.g}">${a.type === "video" ? `<span class="sl-wm">${I(EXI[post.ex] || "activity", 120)}</span><span class="sl-play">${I("play", 22)}</span>` : ""}</div>`).join("");
    const dots = post.assets.length > 1 ? `<div class="cf-dots">${post.assets.map((a, i) => `<i class="${i === 0 ? "on" : ""}"></i>`).join("")}</div>` : "";
    return `<div class="cf-carousel">${s}</div>${dots}`;
  }
  const chTag = (post) => post.ch ? `<span class="cf-tag">${I(EXI[post.ex], 13)} ${post.ch}</span>` : "";
  const topRight = (post) => post.reps ? `<span class="cf-rep"><span class="z">${I("zap", 12)}</span>${fmt(post.reps)} ${EX[post.ex].toLowerCase()}</span>`
    : (post.assets.length > 1 ? `<span class="cf-count">${I("image", 12)} ${post.assets.length}</span>` : "");

  // ── Immersive ──
  function immersivePost(post, i) {
    const pe = person(post.p);
    return `<div class="cf-post" onclick="Community.open(${i})">
      <div class="cf-media">${slides(post)}${chTag(post)}${topRight(post)}
        <div class="cf-rail">
          <button onclick="event.stopPropagation();this.classList.toggle('liked')"><span class="ib">${I("heart", 22)}</span>${fmt(post.likes)}</button>
          <button onclick="event.stopPropagation();Community.open(${i})"><span class="ib">${I("eye", 22)}</span>${fmt(post.views)}</button>
          <button onclick="event.stopPropagation();Community.share()"><span class="ib">${I("share", 20)}</span>Share</button></div>
        <div class="cf-scrim"><div class="cf-author"><div class="av" style="background-image:${grad(pe.av)}"></div>
          <div><b>${pe.name}</b><div class="tm">${post.t} ago</div></div>
          <button class="cf-follow" onclick="event.stopPropagation();this.classList.toggle('on');this.textContent=this.classList.contains('on')?'Following':'Follow'">Follow</button></div>
          <div class="cf-cap">${post.cap}</div></div></div></div>`;
  }
  const immersive = () => `<div class="cf-imm">${FEED.map(immersivePost).join("")}</div>`;

  // ── Story ──
  function story() {
    return `<div class="cf-story">${FEED.map((post, i) => {
      const pe = person(post.p);
      return `<div class="cf-post">
        <div class="cf-shead" onclick="Community.open(${i})"><div class="av" style="background-image:${grad(pe.av)}"></div><div style="flex:1"><b>${pe.name}</b><div class="tm">${post.t} ago</div></div>${post.ch ? `<span class="tag2">${I(EXI[post.ex], 12)} ${post.ch}</span>` : ""}</div>
        <div class="cf-media" onclick="Community.open(${i})">${slides(post)}${topRight(post)}</div>
        <div class="cf-sactions"><button onclick="this.classList.toggle('liked')">${I("heart", 20)} ${fmt(post.likes)}</button><button onclick="Community.open(${i})">${I("eye", 20)} ${fmt(post.views)}</button><button class="share" onclick="Community.share()">${I("share", 20)} Share</button></div>
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

  function render() { root.innerHTML = header() + (cur.v === "story" ? story() : cur.v === "explore" ? explore() : immersive()); window.Icons.init(root); }

  // ── home V7 embed (full-bleed, breaks out of 18px padding) ──
  function homeFeed(state) {
    const h = `<div class="sec"><h2>Community</h2><a href="community.html">See all</a></div>`;
    return h + `<div class="cf-imm" style="margin:0 -18px">${FEED.map(immersivePost).join("")}</div>`;
  }

  // ── post detail viewer — TikTok-style endless vertical pager ──
  function vpost(post) {
    const pe = person(post.p);
    const slides = post.assets.map((a) => `<div class="cf-vslide" style="background:${a.g}">${a.type === "video" ? `<span class="sl-wm">${I(EXI[post.ex] || "activity", 150)}</span><span class="sl-play">${I("play", 26)}</span>` : ""}</div>`).join("");
    const dots = post.assets.length > 1 ? `<div class="cf-vdots">${post.assets.map((a, k) => `<i class="${k === 0 ? "on" : ""}"></i>`).join("")}</div>` : "";
    const tag = post.reps ? `<span class="cf-vtag"><span style="color:#ffd66b;display:inline-flex">${I("zap", 12)}</span> ${fmt(post.reps)} ${EX[post.ex].toLowerCase()}</span>` : (post.assets.length > 1 ? `<span class="cf-vtag">${I("image", 12)} ${post.assets.length} photos</span>` : "");
    const chip = post.ch ? `<div class="cf-vchip">${I(EXI[post.ex], 13)} ${post.ch}</div>` : "";
    return `<div class="cf-vpost"><div class="cf-vassets">${slides}</div><div class="cf-vscrim"></div>${dots}${tag}
      <div class="cf-vrail"><button onclick="this.classList.toggle('liked')"><span class="ib">${I("heart", 22)}</span>${fmt(post.likes)}</button>
        <button><span class="ib">${I("eye", 22)}</span>${fmt(post.views)}</button>
        <button onclick="Community.share()"><span class="ib">${I("share", 20)}</span>Share</button></div>
      <div class="cf-vbottom"><div class="cf-vauthor"><div class="av" style="background-image:${grad(pe.av)}"></div>
        <div style="flex:1"><b>${pe.name}</b><div class="tm">${post.t} ago</div></div>
        <button class="cf-vfollow" onclick="this.classList.toggle('on');this.textContent=this.classList.contains('on')?'Following':'Follow'">Follow</button></div>
        <div class="cf-vaction">${actionText(post)}</div><div class="cf-vcap">${post.cap}</div>${chip}</div></div>`;
  }
  function appendPosts(feed, arr) {
    arr.forEach((post) => { const tmp = document.createElement("div"); tmp.innerHTML = vpost(post); const node = tmp.firstElementChild; feed.appendChild(node); wireDots(node); });
  }
  function wireDots(node) {
    const car = node.querySelector(".cf-vassets"), dots = node.querySelector(".cf-vdots");
    if (!dots) return;
    car.addEventListener("scroll", () => { const i = Math.round(car.scrollLeft / Math.max(1, car.clientWidth)); dots.querySelectorAll("i").forEach((d, k) => d.classList.toggle("on", k === i)); });
  }
  function open(i) {
    const start = FEED.slice(i).concat(FEED.slice(0, i));   // tapped post first, then the rest
    const o = document.createElement("div"); o.className = "cf-viewer";
    o.innerHTML = `<button class="cf-vback" onclick="Community.closeViewer()">${I("back", 20)}</button><div class="cf-vfeed"></div>`;
    document.querySelector(".screen").appendChild(o); _vEl = o;
    const feed = o.querySelector(".cf-vfeed");
    appendPosts(feed, start); appendPosts(feed, FEED);   // initial + buffer
    feed.addEventListener("scroll", () => { if (feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 1200) appendPosts(feed, FEED); });   // endless
  }
  function closeViewer() { if (_vEl) { _vEl.remove(); _vEl = null; } }

  function setTab(t) { cur.tab = t; render(); }
  function share() { Buzzend.alert({ icon: "share", title: "Share post", message: "Send this to friends or your story." }); }
  function start(mountEl, v) { root = mountEl; cur.v = v || "imm"; cur.tab = "For you"; render(); }
  return { start, render, homeFeed, setTab, open, closeViewer, share };
})();
