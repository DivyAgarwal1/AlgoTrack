<div align='center'>
  <img src='public/navbar_logo.svg' width='120' alt='AlgoTrack Logo' />
  <h1>AlgoTrack</h1>
</div>

AlgoTrack is a high-performance, unified dashboard for Competitive Programmers. It aggregates your live statistics, contest ratings, and recent submissions across **Codeforces**, **LeetCode**, and **AtCoder** into a single, beautiful interface.

## ✨ Features

- **📊 Unified Dashboard:** Track your problem-solving progress and rating changes across multiple competitive programming platforms in one place.
- **🟩 365-Day Activity Heatmap:** A GitHub-style contribution graph that combines your daily problem-solving activity across all platforms.
- **⭐ Cloud-Synced Bookmarks:** Bookmark interesting problems you find on any platform. Your bookmarks are instantly synced across all your devices using Firebase Firestore.
- **⚡ Offline-First Architecture:** Built with an advanced Cache-First architecture. Data is stored in your browser's IndexedDB and LocalStorage, bypassing API rate limits and providing instant page loads.
- **🔒 Secure Authentication:** OAuth integration powered by Google Firebase.

## 🛠️ Tech Stack

- **Frontend:** React 19, JavaScript (ES6+)
- **Build Tool:** Vite
- **Routing:** React Router v7
- **Backend / Database:** Firebase Authentication, Firebase Firestore (NoSQL)
- **Data Visualization:** Recharts
- **External APIs:** Codeforces REST API, LeetCode GraphQL API, Kenkoooo (AtCoder) API

## 🚀 Live Demo

Check out the live website here:
👉 **[https://algotrack-app.vercel.app](https://algotrack-app.vercel.app)**

## 💻 Local Setup Instructions

If you want to run this project locally on your machine:

1. **Clone the repository:**
   \ash
   git clone https://github.com/DivyAgarwal1/cp-tracker.git
   cd cp-tracker
   \\n
2. **Install dependencies:**
   \ash
   npm install
   \\n
3. **Start the development server:**
   \ash
   npm run dev
   \\n
4. Open http://localhost:5173 in your browser.

## 📐 Architecture Notes

- **API Caching:** To prevent IP bans from Codeforces and LeetCode, the app uses a custom localStorage engine with a 5-minute stale-while-revalidate policy.
- **Serverless Proxies:** In production, Vercel Serverless Rewrites are used to securely proxy GraphQL requests to LeetCode and AtCoder, bypassing strict CORS policies.
