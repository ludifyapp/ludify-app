# Game Night App

A web app for organizing board game nights with friends. Create events, invite players, and manage your game nights — with a real-time comments section, friends system, dark mode, and more.

## Features

- **Create events** — pick a board game, set date/time, location, player limits, and visibility (public/private)
- **Saved addresses** — save your frequently used venues for quick reuse when creating events
- **Join events** — guests join via shareable invite link; authenticated users join with one click
- **Host dashboard** — edit event details, add guests manually, remove players, cancel events
- **Real-time comments** — YouTube-style comments per event; host can pin a comment
- **Friends** — send and accept friend requests, view friend profiles
- **Invites** — send event invitations directly to friends
- **My Events** — view all events you've hosted or joined, organized by upcoming / cancelled / past
- **Public event listing** — explore all upcoming public events on the home page
- **Dark mode** — full dark/light mode support, respects system preference

## Tech Stack

- [Next.js 15](https://nextjs.org/) — App Router, TypeScript
- [Firebase](https://firebase.google.com/) — Authentication (Google Sign-In), Firestore database
- [Tailwind CSS v4](https://tailwindcss.com/) — styling with custom teal brand palette
- [next-themes](https://github.com/pacocoursey/next-themes) — dark mode

## Prerequisites

- Node.js 18+
- A [Firebase project](https://console.firebase.google.com/) with Authentication and Firestore enabled

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/misskbar/game-night-app.git
cd game-night-app
npm install
```

### 2. Configure Firebase

**Authentication** — in the Firebase Console, enable Google as a sign-in provider under Authentication → Sign-in method.

**Firestore security rules** — deploy the rules from `firestore.rules` in the project root, or paste them in Firebase Console → Firestore → Rules:

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
      match /messages/{msgId} { ... }
      match /comments/{commentId} { ... }
    }
  }
}
```

See `firestore.rules` for the full ruleset.

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
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  page.tsx              # Home (explore + my events tabs)
  create/               # Create event form
  event/[id]/           # Event detail page
  event/[id]/manage/    # Host management dashboard
  my-events/            # Events you've hosted or joined
  friends/              # Friends list and requests
  invites/              # Pending invitations
  profile/              # Your profile
  profile/[uid]/        # Public user profile
  settings/             # App settings (appearance, etc.)
  api/                  # API routes (events, players, friends, invites, addresses, BGG)
components/
  event/                # EventCard, EventComments, EventChat, PlayerList, ShareLink, …
  forms/                # CreateEventForm, EditEventForm, JoinEventForm
  layout/               # HomeHeader
  ui/                   # Button, Input, Spinner, …
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
