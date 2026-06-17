/* Buzzend notifications — clean activity list modelled on Instagram / X / Strava,
   mapped 1:1 to the backend (NotificationResponse):
     notificationTypeName · sender(avatar,name) · isRead · template · created · coverImage.
   Person notifications show an avatar (+ Follow button or post thumbnail);
   system/challenge notifications show an icon tile. Flat list, no cards. */
window.Notif = (function () {
  const I = (n, s) => window.Icons.svg(n, s);

  const TYPE = {
    follow:             { icon: "user",   c: "var(--primary)", cat: "follows" },
    follow_back:        { icon: "users",  c: "var(--primary)", cat: "follows" },
    content_liked:      { icon: "heart",  c: "#e25b40",        cat: "social" },
    content_uploaded:   { icon: "play",   c: "var(--primary)", cat: "social" },
    member_joined:      { icon: "users",  c: "var(--accent)",  cat: "challenges" },
    challenge_created:  { icon: "trophy", c: "var(--accent)",  cat: "challenges" },
    challenge_updated:  { icon: "trophy", c: "var(--accent)",  cat: "challenges" },
    challenge_starting: { icon: "trophy", c: "var(--accent)",  cat: "challenges" },
    challenge_ending:   { icon: "trophy", c: "var(--accent)",  cat: "challenges" },
  };
  const PERSON = ["follow", "follow_back", "content_liked", "content_uploaded", "member_joined"];
  const NAME_LED = ["follow", "follow_back", "content_liked", "content_uploaded", "member_joined"];
  const MEDIA = ["linear-gradient(135deg,#3a5a40,#588157)", "linear-gradient(135deg,#22555f,#2a9d8f)", "linear-gradient(135deg,#3d3a5b,#5e60ce)"];

  const DATA = [
    { type: "content_liked",     g: "today", name: "Ravi Thapa",  template: "liked your Walk clip",                          t: "18m", unread: true,  av: "#c9a6a6,#a87",    cover: true },
    { type: "follow",            g: "today", name: "Anita Malan", template: "started following you",                        t: "40m", unread: true,  av: "#b8c6d1,#8aa0b3" },
    { type: "member_joined",     g: "today", name: "Kiran Shah",  template: "joined your “30-Day Squats” challenge",         t: "1h",  unread: true,  av: "#c9c19b,#9a8c5e", cover: true },
    { type: "content_uploaded",  g: "today", name: "Maya Gurung", template: "posted a new push-up clip",                    t: "3h",  unread: false, av: "#9bb7c9,#5e7d99", cover: true },
    { type: "challenge_starting", g: "week", name: "Buzzend",     template: "“Push-up Power” is starting soon — get ready", t: "1d",  unread: false, cover: true },
    { type: "follow_back",       g: "week",  name: "Sita Rai",    template: "followed you back",                            t: "1d",  unread: false, av: "#a6c9b5,#5e996f" },
    { type: "challenge_ending",  g: "week",  name: "Buzzend",     template: "“30-Day Squats” is ending soon — don't miss out", t: "2d", unread: false, cover: true },
  ];

  function lead(n) {
    if (PERSON.includes(n.type) && n.av) return `<div class="nf-av" style="background-image:linear-gradient(135deg,${n.av})"></div>`;
    const t = TYPE[n.type];
    return `<div class="nf-tile" style="color:${t.c};background:color-mix(in srgb, ${t.c} 15%, transparent)">${I(t.icon, 22)}</div>`;
  }
  const text = (n) => `<div class="nf-text">${NAME_LED.includes(n.type) ? `<b>${n.name}</b> ` : ""}${n.template}<span class="nf-t"> · ${n.t}</span></div>`;
  function trailing(n, i) {
    if (n.type === "follow" || n.type === "follow_back") return `<button class="nf-follow">Follow</button>`;
    if (n.cover) return `<div class="nf-post" style="background:${MEDIA[i % 3]}">${n.type === "content_uploaded" ? `<span>${I("play", 13)}</span>` : ""}</div>`;
    return "";
  }
  const item = (n, i, cls) => `<div class="nf-item ${n.unread ? "unread" : ""}" ${cls ? `data-cat="${TYPE[n.type].cat}"` : ""}>${lead(n)}${text(n)}${trailing(n, i)}</div>`;

  // V1 · grouped activity list (Instagram style)
  function list() {
    let k = 0;
    return [["today", "Today"], ["week", "This week"]].map(([g, label]) => {
      const items = DATA.filter((n) => n.g === g); if (!items.length) return "";
      return `<div class="nf-sec">${label}</div>${items.map((n) => item(n, k++)).join("")}`;
    }).join("");
  }

  // V2 · tabbed (All / Follows / Challenges)
  function tabbed() {
    const tabs = [["all", "All"], ["follows", "Follows"], ["challenges", "Challenges"]]
      .map(([c, l], i) => `<button class="nf-tab ${i === 0 ? "on" : ""}" onclick="Notif.setCat(this,'${c}')">${l}</button>`).join("");
    const rows = DATA.map((n, i) => item(n, i, true)).join("");
    return `<div class="nf-wrap cat-all"><div class="nf-tabs">${tabs}</div>${rows}</div>`;
  }
  function setCat(el, cat) {
    const wrap = el.closest(".nf-wrap"); wrap.className = "nf-wrap cat-" + cat;
    wrap.querySelectorAll(".nf-tab").forEach((b) => b.classList.toggle("on", b === el));
  }

  function empty() {
    return `<div class="nf-empty"><div class="nf-bell"><span class="nf-zz">z</span>${I("bell", 58)}<span class="nf-floor"></span></div>
      <div class="nf-empty-t">No notifications right now</div>
      <div class="nf-empty-d">You're all caught up — we'll let you know when something happens.</div></div>`;
  }

  function render(v) {
    if (v === "empty") return empty();
    if (v === "2") return tabbed();
    return list();
  }
  return { render, setCat, DATA };
})();
