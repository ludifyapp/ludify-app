# 🎲 Game Night App

A web app for organizing board game nights with friends. Create events, invite players, and manage your game nights.

## Features

- **Create events** — pick a board game, set date/time, location, player limits, visibility (public/private), and an optional description
- **Join events** — guests join via shareable invite link using just their name
- **Host dashboard** — edit event details, add guests manually, remove players, cancel events
- **My Events** — view all events you've hosted or joined, organized by upcoming / cancelled / past
- **Public event listing** — home page shows all upcoming public events

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router, TypeScript)
- [Firebase Firestore](https://firebase.google.com/docs/firestore) — database
- [Tailwind CSS](https://tailwindcss.com/) — styling

## Prerequisites

- Node.js 18+
- A [Firebase project](https://console.firebase.google.com/) with Firestore enabled

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/misskbar/game-night-app.git
cd game-night-app
npm install
```

### 2. Configure Firebase

**Firestore security rules** — in the Firebase Console under Firestore → Rules, set:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      allow read: if true;
      allow write: if false;
      match /secret/{doc} {
        allow read, write: if false;
      }
    }
  }
}
```

**Service account** — download a service account key from Firebase Console → Project Settings → Service accounts → Generate new private key. Save it as `service-account.json` in the project root (it is gitignored).

### 3. Environment variables

Create a `.env.local` file in the project root:

```env
# Firebase client SDK (from Firebase Console → Project Settings → Your apps)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

# BoardGameGeek API token (optional — enables board game autocomplete)
BGG_API_TOKEN=
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

### Host token

When you create an event, a secret `hostToken` (UUID) is stored in a Firestore subcollection (`events/{id}/secret/host`) and saved to your browser's `localStorage`. This token identifies you as the host and is required to edit the event or manage players — no account needed.

### Joining events

Guests join via the shareable link. Their `playerId` is saved to `localStorage` so the event appears in their My Events page.

### Board game search

The app integrates with the [BoardGameGeek XML API2](https://boardgamegeek.com/wiki/page/BGG_XML_API2). Autocomplete requires a BGG API token (free, requires registration at boardgamegeek.com/applications). Until then, enter the board game name manually.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
