# ⚡ Buzzend — Redesign

Design assets and a working interactive prototype for the **redesign of Buzzend**, a social fitness app built around workout challenges, daily step / activity tracking, streaks, leaderboards, and a social feed.

This repository is **design + prototype only** — it is not the production app. It exists to explore, demonstrate, and sign off on the new look-and-feel before the visual system is ported into the production Flutter app (whose modules are referenced throughout). Everything here is plain HTML/CSS/JS and static images — no build step, no dependencies.

---

## What Buzzend is

Buzzend is a fitness/wellness app where people set fitness goals and compete in challenges with friends. The screens in this repo cover the full product surface:

- **Auth & onboarding** — title/splash, get-started, Google / Apple / phone login, OTP verification, complete-profile, take-a-tour
- **Home** — main dashboard / activity feed
- **Challenges** — create a challenge (3-step flow), join, view members, challenge lists & empty states
- **Daily challenge & step tracker** — daily activity goals and step counting
- **Streaks** — streak tracking with reset confirmation
- **Leaderboard / competition** — ranking views (creator-only, user in top 3, user in board)
- **Profile & stats** — self and other-user profiles, detailed activity stats (steps, calories, reps, per-exercise breakdowns by day/month)
- **Social** — posts/stories, chat & messages, followers
- **Search & discovery** — find friends and challenges, with empty states
- **Notifications** & **Settings** — goals, height, weight, phone, blocked users, support form

---

## Repository structure

```
Buzzend Design/
├── figma-images/        Exported Figma mockups, organized by app flow
│   ├── INDEX.md         Maps every PNG → Figma node ID + production app module
│   ├── auth-onboarding/ challenge-creation/ challenges/ chat/
│   ├── daily-challenge/ home/ leaderboard/ members/ notification/
│   ├── posts/ profile/ search-discovery/ settings/ step-tracker/
│   └── streak/ misc/
│
└── prototype/           Live, clickable HTML/CSS/JS redesign prototype
    ├── index.html       Launcher: pick a color set + font, jump to screens
    ├── css/
    │   ├── tokens.css       Design tokens (semantic CSS vars, light + dark)
    │   ├── palettes.css     6 selectable color sets (full light + dark each)
    │   ├── fonts.css        Font options
    │   ├── components/      bottom-nav, buttons, country-picker, dialog, field, icons
    │   └── screens/         auth-flow, home, login (+ variants)
    ├── js/
    │   ├── app.js           Theme / palette / font persistence (localStorage)
    │   ├── components/      auth-flow, country-picker, dialog, icons, otp
    │   └── screens/         home-data.js (shared Home data + section builders)
    └── screens/
        ├── auth/    login + 3 variants, verify-otp, complete-profile, index
        └── home/    home (V1) + home-v2, home-v3, index
```

### `figma-images/`
56 mockup PNGs exported from the Figma file **“Buzzend New Design”** (key `ZBgJGyd47Ico1ROEcfM9KF`), renamed from raw Figma exports to searchable names and grouped by flow. [`figma-images/INDEX.md`](figma-images/INDEX.md) is the source of truth: for each screen it records the file, a description, the Figma **node ID** (so any frame can be re-rendered at higher resolution via the Figma REST API), and the corresponding **production app module** (e.g. `user_challenge`, `daily_steps`, `competition`, `user_profile`, `user_login`).

### `prototype/`
A self-contained, interactive prototype of the redesign — the part you actually click through.

- **One token system drives everything.** [`css/tokens.css`](prototype/css/tokens.css) defines semantic CSS variables (surfaces, text, primary/secondary/accent, spacing on an 8pt grid, radii, elevation) named so they map **1:1 to a Flutter port** and so light/dark switch cleanly.
- **6 selectable color sets + 6 fonts.** From the launcher you pick a palette (Teal *current*, Neo Mint, Electric Blue, Black & Gold, Energy Orange, AI Purple & Cyan) and a font. The choice is saved to `localStorage` and applied **live to every screen**, in both light and dark. Each palette ([`css/palettes.css`](prototype/css/palettes.css)) ships a complete light + dark system and a recommended font.
- **Reusable components.** Dialogs, country picker, OTP input, auth-flow routing, a line-icon system, bottom nav, buttons, and fields live in `css/components/` + `js/components/` and are shared across screens.
- **Real flows & states, not just static screens.** Auth includes the full journey (Google/Apple/phone → loading → success/fail → complete profile) with working OTP (`123456` = success), inline errors, and a `?demo=fail` path. Home ships **3 layout variants** (V1 dashboard, V2 activity rings, V3 bento grid) and **data states** (new user / partial / full), all fed by one shared data source in [`js/screens/home-data.js`](prototype/js/screens/home-data.js).

---

## Running the prototype

No build, no install. Open it in a browser:

```bash
# from the repo root
open prototype/index.html          # macOS

# …or serve it (recommended, so relative paths & iframes load cleanly)
cd prototype && python3 -m http.server 8000
# then visit http://localhost:8000
```

From the launcher (`index.html`):
1. Pick a **color set** and **font** — they persist and apply across all screens.
2. Toggle **light / dark** with the button (also persisted).
3. Open a screen group (**Login** — 4 variations + flow; **Home** — 3 layouts + data states). Cards marked “Queued” are not built yet.

---

## Status

| Area | State |
|---|---|
| Design system (tokens, palettes, fonts, components) | ✅ Built |
| Auth & onboarding screens + flow | ✅ Built |
| Home (V1/V2/V3 + new/partial/full states) | ✅ Built |
| Create Challenge, Leaderboard, Daily Challenge, Profile + Stats | 🎨 Mockups in `figma-images/`, prototype queued |
| Dark theme | ⚠️ Derived from tokens, pending sign-off |

---

## For developers porting to Flutter

The token names in [`css/tokens.css`](prototype/css/tokens.css) are intentionally semantic so they translate directly to Flutter theme values, and [`figma-images/INDEX.md`](figma-images/INDEX.md) tells you which production module each screen belongs to. Use the prototype for interaction/behavior and the Figma node IDs for pixel-accurate specs.
