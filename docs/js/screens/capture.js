/* Capture — reusable camera + gallery picker, grounded in the old Flutter
   custom_media_library (CameraScreen: Photo/Video modes, flash, mic, flip,
   record timer, "Cannot switch while recording"; gallery multi-select max 10,
   images-multi OR single video). Configurable by ?purpose:
     post   → photo/video, multi-select → Compose (edit → post)
     avatar → single image  → back to Edit Profile (sets the picture)
     chat   → photo/video, single → back to chat (send)
   Reused by the Plus sheet, Edit Profile and (optionally) chat. Reads Social. */
window.Capture = (function () {
  const I = (n, s) => window.Icons.svg(n, s);
  const fmt = (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  const MAX = 10;
  // simulated camera shots (the prototype's stand-in for real capture)
  const SHOTS = [
    { g: "linear-gradient(135deg,#f0a6c0,#c65f88)", pair: "#f0a6c0,#c65f88" },
    { g: "linear-gradient(135deg,#9ec5e0,#4c7fb0)", pair: "#9ec5e0,#4c7fb0" },
    { g: "linear-gradient(135deg,#a6d6b8,#4f9e73)", pair: "#a6d6b8,#4f9e73" },
    { g: "linear-gradient(135deg,#e6c9a0,#b58a4e)", pair: "#e6c9a0,#b58a4e" },
  ];
  const IMGG = SHOTS.map((s) => s.g);
  const GAL = [
    { type: "video", g: "linear-gradient(150deg,#1f6e5f,#2a9d8f)", dur: 42 }, { type: "image", g: IMGG[0] }, { type: "image", g: IMGG[1] },
    { type: "image", g: IMGG[2] }, { type: "video", g: "linear-gradient(150deg,#8a5a1a,#e0922a)", dur: 28 }, { type: "image", g: IMGG[3] },
    { type: "image", g: "linear-gradient(160deg,#7a5a8a,#3a2a4a)" }, { type: "image", g: "linear-gradient(160deg,#5a7a8a,#2a3a45)" }, { type: "video", g: "linear-gradient(150deg,#6f1f2a,#ef4444)", dur: 15 },
    { type: "image", g: "linear-gradient(160deg,#3a6b4a,#1e3a2a)" }, { type: "image", g: "linear-gradient(160deg,#c98a3a,#7a4a1e)" }, { type: "image", g: IMGG[1] },
  ];

  let host, st;
  function cfg() {
    const p = new URLSearchParams(location.search), purpose = p.get("purpose") || "post";
    const map = { post: { accept: "all", multiple: true }, avatar: { accept: "image", multiple: false }, chat: { accept: "all", multiple: false } };
    const c = map[purpose] || map.post;
    return { purpose, accept: p.get("accept") || c.accept, multiple: p.get("multiple") ? p.get("multiple") === "true" : c.multiple };
  }
  function start(mount) {
    host = mount; const c = cfg();
    st = Object.assign({ tab: "camera", camMode: "photo", flash: "off", mic: true, facing: "back", recording: false, recSecs: 0, timer: null, shot: 0, sel: [] }, c);
    render();
  }

  /* ── selection rules (images-multi OR single video, max 10) ── */
  function canAdd(a, silent) {
    const hasVideo = st.sel.some((x) => x.type === "video");
    if (!st.multiple) return true;
    if (a.type === "video") { if (st.sel.length) { if (!silent) warn("Upload either multiple images or a single video only."); return false; } return true; }
    if (hasVideo) { if (!silent) warn("Only one video allowed — you can't mix photos and video."); return false; }
    if (st.sel.length >= MAX) { if (!silent) warn("Maximum 10 images allowed."); return false; }
    return true;
  }
  const warn = (m) => Buzzend.alert({ icon: "alert", title: "Can't add that", message: m });
  function addAsset(a) {
    if (!st.multiple) { st.sel = [a]; return finish(); }
    if (!canAdd(a)) return;
    st.sel.push(a); render();
  }

  /* ── camera ── */
  function renderCamera() {
    const both = st.accept === "all";
    const mode = (m, l) => `<button class="cap-mode ${st.camMode === m ? "on" : ""}" onclick="Capture.setMode('${m}')">${l}</button>`;
    const toggle = st.camMode === "photo"
      ? `<button class="cap-tg" onclick="Capture.flash()">${I(st.flash === "on" ? "zap" : "zap", 20)}<i class="cap-tglbl">${st.flash}</i></button>`
      : `<button class="cap-tg ${st.mic ? "" : "off"}" onclick="Capture.mic()">${I(st.mic ? "volume" : "mute", 20)}</button>`;
    const galThumb = st.sel.length ? `style="background-image:${st.sel[st.sel.length - 1].g};background-size:cover"` : "";
    const tray = (st.multiple && st.sel.length) ? trayHtml() : "";
    return `<div class="cap cap-camera facing-${st.facing}">
      <div class="cap-view"><div class="cap-vf"></div><div class="cap-reticle"></div>
        ${st.recording ? `<div class="cap-rec"><span class="dot"></span><span id="cap-timer">${fmt(st.recSecs)}</span></div>` : ""}</div>
      <div class="cap-top">
        <button class="cap-x" onclick="Capture.close()">${I("x", 22)}</button>
        <div class="cap-title">${st.purpose === "avatar" ? "Profile photo" : st.purpose === "chat" ? "Camera" : "New post"}</div>
        <div class="cap-tgs">${toggle}</div></div>
      <div class="cap-bottom">
        ${tray}
        ${both ? `<div class="cap-modes">${mode("photo", "Photo")}${mode("video", "Video")}</div>` : ""}
        <div class="cap-controls">
          <button class="cap-gal" ${galThumb} onclick="Capture.goGallery()">${st.sel.length ? "" : I("images", 22)}</button>
          <button class="cap-shutter ${st.camMode}${st.recording ? " rec" : ""}" onclick="Capture.shutter()"></button>
          <button class="cap-flip" onclick="Capture.flip()">${I("refresh", 22)}</button></div>
      </div></div>`;
  }
  function trayHtml() {
    const thumbs = st.sel.map((a, i) => `<div class="cap-tt" style="background:${a.g}">${a.type === "video" ? `<span class="cap-ttv">${I("play", 9)}</span>` : ""}<button class="cap-ttx" onclick="Capture.unsel(${i})">${I("x", 10)}</button></div>`).join("");
    return `<div class="cap-tray"><div class="cap-tt-row">${thumbs}</div><button class="cap-next" onclick="Capture.finish()">Next · ${st.sel.length}</button></div>`;
  }

  function setMode(m) { if (st.recording) return; st.camMode = m; render(); }
  function flash() { st.flash = st.flash === "off" ? "on" : st.flash === "on" ? "auto" : "off"; render(); }
  function mic() { st.mic = !st.mic; render(); }
  function flip() { if (st.recording) return Buzzend.alert({ icon: "camera", title: "Recording", message: "Cannot switch camera while recording." }); st.facing = st.facing === "back" ? "front" : "back"; render(); }
  function shutter() {
    if (st.camMode === "photo") { const s = SHOTS[st.shot % SHOTS.length]; st.shot++; addAsset({ type: "image", g: s.g, pair: s.pair }); return; }
    if (!st.recording) { st.recording = true; st.recSecs = 0; render(); st.timer = setInterval(() => { st.recSecs++; const t = document.getElementById("cap-timer"); if (t) t.textContent = fmt(st.recSecs); }, 1000); }
    else { clearInterval(st.timer); st.recording = false; const dur = Math.max(1, st.recSecs); const s = SHOTS[st.shot % SHOTS.length]; st.shot++; addAsset({ type: "video", g: s.g, pair: s.pair, dur }); }
  }
  function unsel(i) { st.sel.splice(i, 1); render(); }

  /* ── gallery ── */
  function goGallery() { st.tab = "gallery"; render(); }
  function goCamera() { st.tab = "camera"; render(); }
  function renderGallery() {
    const items = GAL.map((g, i) => {
      if (st.accept === "image" && g.type !== "image") return "";
      const at = st.sel.findIndex((x) => x._gi === i);
      const disabled = at < 0 && !canAdd(g, true);
      return `<button class="cap-tile${at >= 0 ? " on" : ""}${disabled ? " off" : ""}" style="background-image:${g.g}" onclick="Capture.pick(${i})">
        ${g.type === "video" ? `<span class="cap-vb">${I("play", 11)} ${fmt(g.dur)}</span>` : ""}
        ${st.multiple ? `<span class="cap-selb">${at >= 0 ? at + 1 : ""}</span>` : ""}</button>`;
    }).join("");
    return `<div class="cap cap-gallery">
      <div class="cap-gtop"><button class="cap-x" onclick="Capture.goCamera()">${I("back", 22)}</button>
        <div class="cap-title dark">Gallery</div>
        ${st.multiple ? `<button class="cap-gnext ${st.sel.length ? "" : "dis"}" onclick="Capture.finish()">Next</button>` : `<span style="width:44px"></span>`}</div>
      <div class="cap-grid">${items}</div>
      ${st.multiple ? `<div class="cap-ghint">${st.sel.some((x) => x.type === "video") ? "1 video selected" : st.sel.length + " / 10 selected"}</div>` : ""}</div>`;
  }
  function pick(i) {
    const g = GAL[i], at = st.sel.findIndex((x) => x._gi === i);
    if (at >= 0) { st.sel.splice(at, 1); return render(); }
    if (!st.multiple) { finish({ type: g.type, g: g.g }); return; }
    if (!canAdd(g)) return;
    st.sel.push(Object.assign({ _gi: i }, g)); render();
  }

  function render() { host.innerHTML = st.tab === "gallery" ? renderGallery() : renderCamera(); window.Icons.init(host); }
  function close() { if (history.length > 1) history.back(); else location.href = "home-v7.html"; }

  /* ── done: route by purpose ── */
  function finish(single) {
    const sel = single ? [single] : st.sel;
    if (!sel.length) return;
    if (st.purpose === "avatar") {
      sessionStorage.setItem("bz-avatar-pick", sel[0].pair || "#9ec5e0,#4c7fb0");
      location.href = "profile-edit.html"; return;
    }
    if (st.purpose === "chat") {
      Buzzend.alert({ icon: "success", title: "Sent", message: "Your photo has been sent to the chat.", onConfirm() { location.href = "../chat/chat-detail.html"; } }); return;
    }
    // post → hand off to the composer for editing
    sessionStorage.setItem("bz-compose-assets", JSON.stringify(sel.map((a) => ({ type: a.type, g: a.g, dur: a.dur || 0 }))));
    location.href = "compose.html?from=capture";
  }

  return { start, setMode, flash, mic, flip, shutter, unsel, goGallery, goCamera, pick, finish, close };
})();
