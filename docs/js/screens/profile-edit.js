/* Edit Profile — profile picture + Full name only (matches the app: avatar
   Camera/Gallery/Remove + updateFullName). No cover, no username, no bio — those
   aren't in the backend. Saves {name, av} to localStorage so Profile reflects it. */
window.ProfileEdit = (function () {
  const I = (n, s) => window.Icons.svg(n, s);
  const S = window.Social, ME = S.ME, grad = S.grad;
  const AVATARS = window.Profile.AVATARS, DEFAULT_AV = "#aab3bf,#7c8794";
  let host, draft;

  function load() {
    let o = {}; try { o = JSON.parse(localStorage.getItem("buzzend-profile") || "{}"); } catch (e) {}
    const draft = { name: o.name || ME.name, av: o.av || ME.av };
    const picked = sessionStorage.getItem("bz-avatar-pick");   // returned from the Capture screen
    if (picked) { draft.av = picked; sessionStorage.removeItem("bz-avatar-pick"); }
    return draft;
  }
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

  function render() {
    const c = draft;
    const avs = AVATARS.map((a) => `<button class="ed-pick av${c.av === a ? " on" : ""}" style="background-image:${grad(a)}" onclick="ProfileEdit.setAv('${a}')">${c.av === a ? `<span class="ed-tick">${I("check", 13)}</span>` : ""}</button>`).join("");
    host.innerHTML = `
      <div class="ed-avhero">
        <div class="ed-av" style="background-image:${grad(c.av)}"><button class="ed-avcam" onclick="ProfileEdit.pick()">${I("camera", 16)}</button></div>
        <div class="ed-avactions">
          <button class="ed-txtbtn" onclick="ProfileEdit.pick()">${I("camera", 14)} Change photo</button>
          <button class="ed-txtbtn danger" onclick="ProfileEdit.remove()">${I("trash", 14)} Remove</button>
        </div>
      </div>
      <div class="ed-body">
        <div class="ed-lbl">Choose a picture</div>
        <div class="ed-picks avs">${avs}</div>

        <div class="ed-field"><label>Full name</label>
          <input id="ed-name" maxlength="100" value="${esc(c.name)}" oninput="ProfileEdit.on('name',this.value)" placeholder="Your name" />
          <div class="ed-err" id="err-name"></div></div>
        <div class="ed-hint">This is the name other members see. 3–100 characters.</div>
      </div>`;
    window.Icons.init(host);
  }

  function on(k, v) { draft[k] = v; if (k === "name") document.getElementById("err-name").textContent = ""; }
  function setAv(a) { draft.av = a; render(); }
  function pick() { location.href = "capture.html?purpose=avatar"; }
  function remove() { Buzzend.confirm({ icon: "alert", danger: true, title: "Remove profile photo?", message: "Your profile will return to the default photo.", confirmLabel: "Remove", onConfirm() { draft.av = DEFAULT_AV; render(); } }); }

  function save() {
    const name = (draft.name || "").trim();
    if (name.length < 3) { document.getElementById("err-name").textContent = "Name must be at least 3 characters."; document.getElementById("ed-name").focus(); return; }
    localStorage.setItem("buzzend-profile", JSON.stringify({ name, av: draft.av }));
    Buzzend.alert({ icon: "success", title: "Profile updated", message: "Your changes have been saved.", confirmLabel: "Done", onConfirm() { location.href = "profile.html"; } });
  }

  function start(mountEl) { host = mountEl; draft = load(); render(); }
  return { start, on, setAv, pick, remove, save };
})();
