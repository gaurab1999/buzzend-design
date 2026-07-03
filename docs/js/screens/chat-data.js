/* Chat prototype data — UI/UX only, fully faked.
   Conversations are derived from the shared Social module (js/screens/social-data.js):
     · Friend (1:1) chats  ← Social.PEOPLE where friend === true
     · Challenge (group) chats ← Social.CHALLENGES where joined === true
   Grounded in the live Flutter chatsV1 model (private/group, unread, reactions,
   replies, mentions, read receipts, presence) but reshaped for a fresh UI. */
window.Chat = (function () {
  const S = window.Social;
  const grad = (av) => `linear-gradient(135deg,${av})`;

  // person lookup by name → { name, av(gradient css), initials, online }
  const PMAP = {};
  (S ? S.PEOPLE : []).forEach((p) => {
    PMAP[p.name] = { name: p.name, av: grad(p.av), initials: p.initials, online: !!p.online };
  });
  // a couple of non-friend faces used only inside group chats
  function ghost(name, av) {
    if (!PMAP[name]) PMAP[name] = { name, av: grad(av), initials: name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(), online: false };
    return PMAP[name];
  }
  ghost("Adesh Pokhrel", "#9bb7c9,#5e7d99");
  ghost("Maya Gurung", "#caa6c9,#9a5e96");
  ghost("Coach Bina", "#f0b46b,#d98324");
  // Buzzend official / support account
  PMAP["Buzzend Support"] = { name: "Buzzend Support", av: grad("#008080,#006666"), initials: "⚡", online: true };
  const ME = { name: "Ema William", av: grad("#6a8caf,#33566f"), initials: "EW", me: true };
  const person = (name) => (name === "me" ? ME : PMAP[name] || ghost(name, "#b8c6d1,#8aa0b3"));

  /* ── message factory ──────────────────────────────────────────────
     m(from, text, opts) — from = "me" or a person name.
     opts: { t:'text'|'image'|'emoji'|'gif'|'system', img, caption, ts,
             react:{'👍':['Anita Malan',...]}, replyTo, edited, deleted,
             mentions:['@all'], seenBy:['Anita Malan',...], status } */
  let _id = 0;
  const m = (from, text, opts = {}) => Object.assign(
    { id: "m" + ++_id, from, text: text || "", t: "text", ts: "" }, opts);

  /* reaction map → flat list [{emoji, by:[names]}] preserving order */
  const reactList = (r) => Object.keys(r || {}).map((e) => ({ emoji: e, by: r[e] }));
  const reactCount = (r) => Object.values(r || {}).reduce((a, b) => a + b.length, 0);

  /* ── THREADS ─────────────────────────────────────────────────────── */
  // 1) Rich friend chat — Anita (all message features)
  const anita = [
    m("me", "Hey! Did you finish the squat challenge today? 🏋️", { ts: "9:02 AM", status: "seen" }),
    m("Anita Malan", "Just wrapped 40 reps 💪 you?", { ts: "9:03 AM" }),
    m("me", "Not yet 😅 saving it for the evening", { ts: "9:03 AM", status: "seen",
      react: { "😂": ["Anita Malan"] } }),
    m("Anita Malan", "Look at this form though 👇", { ts: "9:05 AM" }),
    m("Anita Malan", "", { t: "image", img: "#1f6e5f,#2a9d8f", caption: "Morning session done ✅", ts: "9:05 AM",
      react: { "🔥": ["Ema William", "Ravi Thapa"], "❤️": ["Ema William"] } }),
    m("me", "Whoa that's clean form 🔥", { ts: "9:06 AM", status: "seen",
      replyTo: null }),
    m("Anita Malan", "Wanna join my private squad challenge? Starts Monday", { ts: "9:10 AM" }),
    m("me", "For sure, count me in 🙌", { ts: "9:11 AM", status: "seen", edited: true }),
    m("Anita Malan", "🎉", { t: "emoji", ts: "9:11 AM" }),
    m("me", "This message got unsent", { ts: "9:12 AM", deleted: true }),
    m("Anita Malan", "See you on the leaderboard 😏", { ts: "9:14 AM",
      react: { "😂": ["Ema William"] } }),
    m("me", "You're going down 😤", { ts: "9:15 AM", status: "delivered" }),
  ];

  // 2) Rich group challenge chat — 30-Day Squats
  const squads = [
    m("system", "Ema William joined the challenge", { t: "system", ts: "Mon" }),
    m("Adesh Pokhrel", "Welcome everyone to 30-Day Squats! Let's crush it 🔥", { ts: "8:00 AM" }),
    m("Ravi Thapa", "Day 12 done ✅ legs are jelly", { ts: "8:12 AM",
      react: { "😂": ["Ema William", "Anita Malan", "Sita Rai"], "💪": ["Adesh Pokhrel"] } }),
    m("Anita Malan", "@Ema William you're catching up fast!", { ts: "8:15 AM", mentions: ["Ema William"] }),
    m("me", "Trying my best 😤 240 reps in", { ts: "8:16 AM", status: "seen",
      seenBy: ["Adesh Pokhrel", "Ravi Thapa", "Anita Malan"] }),
    m("Coach Bina", "", { t: "image", img: "#8a5a1a,#e0922a", caption: "Reference form — keep your back straight 👌", ts: "8:20 AM",
      react: { "❤️": ["Ema William", "Ravi Thapa", "Sita Rai", "Anita Malan"] } }),
    m("Ravi Thapa", "Saving this 🙏", { ts: "8:21 AM", replyTo: 6 }),
    m("me", "@all who's up for a weekend bonus round?", { ts: "8:25 AM", mentions: ["all"], status: "seen",
      seenBy: ["Adesh Pokhrel", "Ravi Thapa", "Anita Malan", "Sita Rai", "Coach Bina"] }),
    m("Sita Rai", "Me! 🙋‍♀️", { t: "emoji", ts: "8:26 AM" }),
    m("Adesh Pokhrel", "Check the leaderboard: buzzend.com/c/sq30", { ts: "8:30 AM" }),
  ];
  // fix replyTo references (index → message id)
  squads[6].replyTo = squads[5].id;

  // 3) Another friend — Ravi (short, unread)
  const ravi = [
    m("Ravi Thapa", "Bro you saw the new push-up challenge?", { ts: "7:40 AM" }),
    m("Ravi Thapa", "600 people already joined 😳", { ts: "7:40 AM" }),
    m("Ravi Thapa", "We should team up", { ts: "7:41 AM" }),
  ];

  // 4) Group — Push-up Power (typing)
  const pushup = [
    m("Maya Gurung", "Halfway there team 💥", { ts: "Yesterday" }),
    m("me", "Push-up Power never disappoints", { ts: "Yesterday", status: "seen" }),
    m("Ravi Thapa", "", { t: "gif", img: "#5a3a8a,#7c5ce0", caption: "GIF", ts: "Yesterday" }),
  ];

  // 5) Empty group — the "Be the first" state (Figma)
  const emptyGroup = [];

  // 6) Blocked friend — Drake
  const drake = [
    m("Drake Parker", "hey", { ts: "Mon" }),
  ];

  // 7) Support chat — official account (plaintext, no E2E)
  const support = [
    m("system", "Support request · Technical issue", { t: "system", ts: "Tue" }),
    m("Buzzend Support", "Hi Ema! 👋 Thanks for reaching out. How can we help you today?", { ts: "Tue" }),
    m("me", "The step counter stopped syncing after the latest update", { ts: "Tue", status: "seen" }),
    m("Buzzend Support", "Sorry about that! Could you tell us your device model and Android version so we can dig in?", { ts: "Tue" }),
  ];

  /* ── CONVERSATIONS ───────────────────────────────────────────────── */
  // kind: 'friend' | 'group'
  const CONVOS = [
    { id: "anita", kind: "friend", who: "Anita Malan", pinned: true,
      time: "9:15 AM", unread: 0, muted: false,
      last: { from: "me", text: "You're going down 😤", t: "text" }, msgs: anita },

    { id: "sq30", kind: "group", name: "30-Day Squats", cover: "#1f6e5f,#2a9d8f",
      members: 245, active: 18, pinned: true, time: "8:30 AM", unread: 5, muted: false,
      memberNames: ["Adesh Pokhrel", "Ravi Thapa", "Anita Malan", "Sita Rai", "Coach Bina"],
      last: { from: "Adesh Pokhrel", text: "Check the leaderboard: buzzend.com/c/sq30", t: "text" }, msgs: squads },

    { id: "ravi", kind: "friend", who: "Ravi Thapa", time: "7:41 AM", unread: 3, muted: false,
      last: { from: "Ravi Thapa", text: "We should team up", t: "text" }, msgs: ravi },

    { id: "pp", kind: "group", name: "Push-up Power", cover: "#8a5a1a,#e0922a",
      members: 132, active: 9, time: "Yesterday", unread: 0, muted: true, typing: "Ravi Thapa",
      memberNames: ["Maya Gurung", "Ravi Thapa", "Sita Rai"],
      last: { from: "Ravi Thapa", text: "GIF", t: "gif" }, msgs: pushup },

    { id: "sita", kind: "friend", who: "Sita Rai", time: "Yesterday", unread: 0, muted: false,
      last: { from: "Sita Rai", text: "Photo", t: "image" }, msgs: [
        m("Sita Rai", "", { t: "image", img: "#a6c9b5,#5e996f", caption: "New PB! 🎉", ts: "Yesterday" }),
        m("me", "Amazing 👏", { ts: "Yesterday", status: "seen" }),
      ] },

    { id: "mile", kind: "group", name: "Mile Run Challenge", cover: "#155e63,#22a39a",
      members: 25, active: 12, time: "Mon", unread: 0, muted: false, empty: true,
      memberNames: ["Kiran Shah", "Anita Malan", "Ravi Thapa"],
      last: null, msgs: emptyGroup },

    { id: "kiran", kind: "friend", who: "Kiran Shah", time: "Mon", unread: 0, muted: true,
      last: { from: "Kiran Shah", text: "Thanks for the tip!", t: "text" }, msgs: [
        m("Kiran Shah", "Thanks for the tip!", { ts: "Mon" }),
      ] },

    { id: "drake", kind: "friend", who: "Drake Parker", time: "Mon", unread: 0, muted: false, blocked: true,
      last: { from: "Drake Parker", text: "hey", t: "text" }, msgs: drake },

    { id: "support", kind: "support", name: "Buzzend Support", cover: "#008080,#006666",
      official: true, category: "Technical issue", time: "Tue", unread: 1, muted: false,
      last: { from: "Buzzend Support", text: "Could you tell us your device model and Android version?", t: "text" }, msgs: support },
  ];

  const byId = (id) => CONVOS.find((c) => c.id === id);
  const all = () => CONVOS.slice();
  const friends = () => CONVOS.filter((c) => c.kind === "friend");
  const groups = () => CONVOS.filter((c) => c.kind === "group");
  const supportConv = () => CONVOS.find((c) => c.kind === "support");

  // title/avatar helpers
  const convTitle = (c) => (c.kind === "friend" ? person(c.who).name : c.name);
  const convAvatar = (c) => (c.kind === "friend" ? person(c.who).av : grad(c.cover));
  const convInitials = (c) => (c.kind === "friend" ? person(c.who).initials
    : c.kind === "support" ? "⚡" : (c.name[0] || "#"));
  const isOnline = (c) => c.kind === "friend" && person(c.who).online;

  // ── fresh-concept extras (Huddle / Focus / Arena) ──
  // people shown in the "active now" presence rail, with what they're doing
  const ACTIVE = [
    { name: "Anita Malan",   doing: "Squatting 🏋️" },
    { name: "Ravi Thapa",    doing: "On a run 🏃" },
    { name: "Sita Rai",      doing: "Just logged ✅" },
    { name: "Adesh Pokhrel", doing: "Push-ups 💪" },
    { name: "Kiran Shah",    doing: "Online" },
    { name: "Maya Gurung",   doing: "Warming up" },
  ];
  // this-week rep total for a person (for VS strips / signals)
  const weekReps = (name) => { const p = (S ? S.PEOPLE : []).find((x) => x.name === name); return p ? S.totalReps(p) : 0; };
  // fitness-flavoured "cheers" replacing plain reactions
  const CHEERS = ["💪", "🔥", "👏", "⚡", "🏆", "🙌"];
  // inline activity events for a challenge "huddle" feed
  const EVENTS = {
    sq30: [
      { actor: "Ravi Thapa",  action: "logged 40 squats", pts: 240, cheers: { "💪": 4, "🔥": 2 }, ts: "8:11 AM" },
      { actor: "Anita Malan", action: "hit a 12-day streak", pts: 120, icon: "🔥", cheers: { "🙌": 5 }, ts: "8:14 AM" },
      { actor: "Sita Rai",    action: "reached 100% of today's goal", pts: 90, cheers: { "👏": 3 }, ts: "8:22 AM" },
    ],
  };

  // quick reactions offered on long-press
  const QUICK = ["👍", "❤️", "😂", "🔥", "😮", "🙏"];
  // emoji picker set (compact)
  const EMOJIS = ("😀 😁 😂 🤣 😊 😍 😘 😎 🤩 🥳 😢 😭 😤 😅 🙄 😴 👍 👎 👏 🙏 💪 🔥 " +
    "✨ 🎉 ❤️ 🧡 💛 💚 💙 💜 🖤 💯 ⚡ 🏃 🏋️ 🚴 🤸 🥇 🥈 🥉 🏆 🎯 ✅ 👀 🫶 🤝").split(" ");

  return {
    ME, person, PMAP, grad, CONVOS, byId, all, friends, groups, supportConv,
    convTitle, convAvatar, convInitials, isOnline,
    reactList, reactCount, QUICK, EMOJIS,
    ACTIVE, weekReps, CHEERS, EVENTS,
  };
})();
