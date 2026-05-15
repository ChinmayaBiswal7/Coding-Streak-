<div align="center">

<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
<img src="https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
<img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/Framer_Motion-Animations-EF0080?style=for-the-badge&logo=framer&logoColor=white" />
<img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />

<br /><br />

```
  ███████╗████████╗██████╗ ███████╗ █████╗ ██╗  ██╗███████╗██╗   ██╗███╗   ██╗ ██████╗
  ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██╔══██╗██║ ██╔╝██╔════╝╚██╗ ██╔╝████╗  ██║██╔════╝
  ███████╗   ██║   ██████╔╝█████╗  ███████║█████╔╝ ███████╗ ╚████╔╝ ██╔██╗ ██║██║
  ╚════██║   ██║   ██╔══██╗██╔══╝  ██╔══██║██╔═██╗ ╚════██║  ╚██╔╝  ██║╚██╗██║██║
  ███████║   ██║   ██║  ██║███████╗██║  ██║██║  ██╗███████║   ██║   ██║ ╚████║╚██████╗
  ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═══╝ ╚═════╝
```

### 🔥 The Social Competitive Coding Tracker — Track. Battle. Dominate.

**Track coding streaks across 5 platforms, compete with friends in real-time VS battles, and never break your streak again.**

[🚀 Live Demo](#) · [📖 Docs](#architecture) · [🐛 Report Bug](https://github.com/ChinmayaBiswal7/Coding-Streak-/issues) · [✨ Request Feature](https://github.com/ChinmayaBiswal7/Coding-Streak-/issues)

<br />

![StreakSync Dashboard Preview](https://img.shields.io/badge/Status-Live_&_Active-brightgreen?style=for-the-badge)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🏆 Multi-Platform Sync
Connect **5 coding platforms** simultaneously:
- 🟡 **LeetCode** — Submission calendar via Alfa API
- 🔵 **Codeforces** — AC submissions via Official CF API
- ⚪ **GitHub** — Contribution graph via Jogruber proxy
- 🟤 **CodeChef** — Heatmap via community API
- 🩵 **AtCoder** — AC submissions via Kenkoooo API

</td>
<td width="50%">

### ⚔️ VS Battle Cards
Real-time streak duels with friends:
- Side-by-side avatar comparison
- Live solved/unsolved status indicators
- Glowing neon mutual streak counter
- Platform-specific color theming
- Auto-fetched real profile pictures

</td>
</tr>
<tr>
<td width="50%">

### 👥 Social Network
Full Instagram-style social graph:
- Follow/Follower system with real-time counts
- Clickable follower/following modals
- Public profile routing (`/profile/:username`)
- Search by username **or** display name
- Click-through social graph exploration

</td>
<td width="50%">

### 📊 Activity Graphs
GitHub-style contribution heatmaps:
- Full year (365-day) activity grid
- Platform-specific color palettes
- Hover tooltips with exact submission counts
- 7-day line chart with daily submission counts
- Universal "All Platforms" aggregated view

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + Vite | SPA framework |
| **Animations** | Framer Motion | Page transitions & micro-animations |
| **Auth** | Firebase Auth | Email/Password + Google OAuth |
| **Database** | Firestore (NoSQL) | Real-time social graph & user data |
| **Styling** | Vanilla CSS + Glassmorphism | Premium dark UI design system |
| **Icons** | Lucide React | Consistent icon library |
| **Routing** | React Router v6 | Client-side navigation |

### External APIs

| Platform | API Endpoint | Data |
|---|---|---|
| LeetCode | `alfa-leetcode-api.onrender.com` | Calendar, Avatar, Name |
| Codeforces | `codeforces.com/api` | Submissions (official) |
| GitHub | `github-contributions-api.jogruber.de` | Contribution graph |
| CodeChef | `codechef-api.vercel.app` | Heatmap |
| AtCoder | `kenkoooo.com/atcoder/atcoder-api` | AC submissions |
| Avatars | `api.dicebear.com` | Fallback avatars |

---

## 🏗️ Architecture

```
src/
├── components/
│   ├── Navbar.jsx          # Global nav + "Add Friend" modal
│   ├── StreakCard.jsx       # VS Battle card with real-time API data
│   └── ActivityGraph.jsx   # 365-day contribution heatmap
├── pages/
│   ├── Landing.jsx         # Marketing landing page
│   ├── Auth.jsx            # Login/Register with Google OAuth
│   ├── Dashboard.jsx       # Main dashboard with platform tabs
│   └── Profile.jsx         # Public/private user profiles
├── firebase.js             # Firebase config & exports
├── App.jsx                 # Routes & layout
└── index.css               # Global design system (CSS variables, glass-panel)
```

### Data Flow

```
User Auth (Firebase Auth)
        │
        ▼
Firestore Document (users/{uid})
{
  username: string,
  displayName: string,
  friends: string[],          ← mutual streak tracking list
  leetcodeHandle: string,
  codeforcesHandle: string,
  githubHandle: string,
  codechefHandle: string,
  atcoderHandle: string,
  syncedAvatar: string        ← fetched from LeetCode API
}
        │
        ▼
onSnapshot listener → real-time UI updates
        │
        ├── ActivityGraph → fetches platform API
        └── StreakCard    → fetches both users' data in parallel
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- A Firebase project with Firestore + Auth enabled

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ChinmayaBiswal7/Coding-Streak-.git
cd Coding-Streak-

# 2. Install dependencies
npm install

# 3. Set up Firebase environment variables
cp .env.example .env
# Fill in your Firebase config values

# 4. Start the development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 🔐 Firebase Setup

### Firestore Rules
```javascript
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

### Required Firestore Indexes
- Collection: `users` | Field: `friends` (Array) + `username` (Ascending)

---

## 📸 Screenshots

| Dashboard | VS Battle Card | Public Profile |
|---|---|---|
| Platform activity heatmaps | Real-time streak duels | Social following system |

---

## 🗺️ Roadmap

- [x] LeetCode integration
- [x] Codeforces integration
- [x] GitHub integration
- [x] CodeChef integration
- [x] AtCoder integration
- [x] Social follow/follower system
- [x] Public profile routing
- [x] Real-time avatar syncing
- [ ] Global activity feed
- [ ] Push notifications for streak breaks
- [ ] Leaderboard by platform rating
- [ ] Mobile app (React Native)
- [ ] Weekly streak digest email

---

## 🤝 Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) before submitting a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👤 Author

**Chinmaya Biswal**

[![GitHub](https://img.shields.io/badge/GitHub-ChinmayaBiswal7-181717?style=for-the-badge&logo=github)](https://github.com/ChinmayaBiswal7)
[![LeetCode](https://img.shields.io/badge/LeetCode-Profile-FFA116?style=for-the-badge&logo=leetcode&logoColor=black)](https://leetcode.com)

---

<div align="center">

**If this project helped you, give it a ⭐ — it keeps the streak alive!**

Made with 🔥 and too many late nights

</div>
