# 🔥 StreakSync

> A social coding streak tracker — track your grind across platforms, battle friends in real-time, and never break your streak again.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black&style=flat-square)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white&style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## What is this?

I built StreakSync because I wanted to see how my friends were doing on LeetCode without having to ask them every day. It turned into a full social platform.

You connect your coding profiles, add friends, and it shows you a **live VS battle card** — your streak vs theirs, with real profile pictures and activity status. It supports 5 platforms and has a social follow/follower system just like Instagram.

---

## Features

- **Multi-platform sync** — LeetCode, Codeforces, GitHub, CodeChef, AtCoder
- **VS Battle Cards** — real-time streak duels with avatars and activity indicators
- **365-day heatmaps** — GitHub-style contribution graphs per platform
- **Social graph** — follow friends, view their public profiles, click through their followers
- **Real-time updates** — Firestore `onSnapshot` means no refresh needed
- **Avatar sync** — pulls your actual LeetCode profile picture automatically

---

## Tech Stack

- **React 18 + Vite** — frontend
- **Firebase Auth** — email/password + Google OAuth
- **Firestore** — real-time social graph and user data
- **Framer Motion** — animations and transitions
- **Vanilla CSS** — glassmorphism dark theme

### APIs used

| Platform | API |
|---|---|
| LeetCode | alfa-leetcode-api.onrender.com |
| Codeforces | codeforces.com/api (official) |
| GitHub | github-contributions-api.jogruber.de |
| CodeChef | codechef-api.vercel.app |
| AtCoder | kenkoooo.com/atcoder/atcoder-api |

---

## Getting Started

```bash
git clone https://github.com/ChinmayaBiswal7/Coding-Streak-.git
cd Coding-Streak-
npm install
```

Create a `.env` file (see `.env.example`):

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

```bash
npm run dev
```

---

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx        # Global nav + Add Friend modal
│   ├── StreakCard.jsx     # VS battle card
│   └── ActivityGraph.jsx # 365-day heatmap
├── pages/
│   ├── Landing.jsx
│   ├── Auth.jsx
│   ├── Dashboard.jsx
│   └── Profile.jsx       # Supports /profile/:username public routing
├── firebase.js
└── index.css
```

---

## Firestore Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Roadmap

- [x] LeetCode, Codeforces, GitHub, CodeChef, AtCoder sync
- [x] VS battle cards with real avatars
- [x] Social follow/follower system
- [x] Public profile pages
- [ ] Global activity feed
- [ ] Streak break notifications
- [ ] Weekly leaderboard

---

Made by [Chinmaya Biswal](https://github.com/ChinmayaBiswal7)
