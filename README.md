# Game Night App

A web app for organizing board game nights with friends. Create events, invite players, and manage your game nights — with real-time comments, a friends system, dark mode, Firebase Analytics, and more.

## Features

- **Create events** — pick a board game (powered by BoardGameGeek API), set date/time, location, player limits, and visibility (public/private)
- **Saved addresses** — save frequently used venues for quick reuse when creating events
- **Join events** — guests join via shareable invite link; authenticated users join with one click
- **Host dashboard** — edit event details, add guests manually, remove players, cancel events
- **Real-time comments** — per-event comment threads; host can pin a comment
- **Friends activity carousel** — Instagram-style Stories carousel on the home tab showing friends hosting upcoming events; tap to preview event details with swipe/keyboard navigation
- **Friends** — send and accept friend requests, view friend profiles
- **Invites** — send event invitations directly to friends
- **My Events** — view all events you've hosted or joined, organized by upcoming / cancelled / past
- **Public event listing** — explore all upcoming public events on the home page
- **Marketplace** — buy and sell board games; grid/list view toggle, condition filter, price sort, seller trust stats (hosted event count + member since)
- **Dark mode** — full dark/light mode support, respects system preference
- **Google Maps embed** — static map shown on every event detail page; no API key required
- **PWA support** — installable as a home screen app on iOS and Android (Add to Home Screen)
- **Firebase Analytics** — custom event tracking across all major user flows
- **Dev/QA login** — development-only page with 20 pre-seeded test users for QA

## Tech Stack

- [Next.js 15](https://nextjs.org/) — App Router, TypeScript, Turbopack
- [Firebase](https://firebase.google.com/) — Authentication (Google Sign-In), Firestore, Analytics
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) — server-side writes, custom auth tokens
- [Tailwind CSS v4](https://tailwindcss.com/) — styling with custom teal brand palette
- [next-themes](https://github.com/pacocoursey/next-themes) — dark mode

---

## Prerequisites

- Node.js 18+
- A [Firebase project](https://console.firebase.google.com/) with **Authentication**, **Firestore**, and **Analytics** enabled

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/misskbar/game-night-app.git
cd game-night-app
npm install
```

---

### 2. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Add project**
2. Give it a name and enable **Google Analytics** when prompted (required for Analytics features)
3. Once created, click **Web** (`</>`) to register a web app — copy the config values shown

---

### 3. Enable Firebase services

#### Authentication
1. Firebase Console → **Authentication** → **Get started**
2. **Sign-in method** tab → enable **Google**
3. Add your domain to **Authorized domains** (add `localhost` for local dev — it's usually there by default)

#### Firestore
1. Firebase Console → **Firestore Database** → **Create database**
2. Choose **production mode** (you'll set rules in the next step)
3. Pick a region close to your users

#### Firestore security rules
Firebase Console → **Firestore** → **Rules** tab — paste the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Events — public reads, all writes via Admin SDK (API routes)
    match /events/{eventId} {
      allow read: if true;
      allow write: if false;

      match /secret/{doc} {
        allow read, write: if false;
      }

      match /messages/{msgId} {
        allow read: if true;
        allow create: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/events/$(eventId)).data.playerUids
          && request.resource.data.uid == request.auth.uid
          && request.resource.data.text is string
          && request.resource.data.text.size() > 0
          && request.resource.data.text.size() <= 500;
        allow delete: if request.auth != null
          && request.auth.uid == resource.data.uid;
      }

      match /comments/{commentId} {
        allow read: if true;
        allow create: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/events/$(eventId)).data.playerUids
          && request.resource.data.uid == request.auth.uid
          && request.resource.data.text is string
          && request.resource.data.text.size() > 0
          && request.resource.data.text.size() <= 500;
        allow update: if request.auth != null
          && get(/databases/$(database)/documents/events/$(eventId)).data.hostUid == request.auth.uid
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['pinned']);
        allow delete: if request.auth != null
          && (resource.data.uid == request.auth.uid
            || get(/databases/$(database)/documents/events/$(eventId)).data.hostUid == request.auth.uid);
      }
    }

    // Friendships — only the two parties can read; writes via Admin SDK
    match /friendships/{docId} {
      allow read: if request.auth != null
        && (resource.data.fromUid == request.auth.uid
          || resource.data.toUid == request.auth.uid);
      allow write: if false;
    }

    // Invites — only recipient or sender can read; writes via Admin SDK
    match /invites/{docId} {
      allow read: if request.auth != null
        && (resource.data.fromUid == request.auth.uid
          || resource.data.toUid == request.auth.uid);
      allow write: if false;
    }

    // User addresses — private to owner; writes via Admin SDK
    match /addresses/{docId} {
      allow read, write: if request.auth != null
        && resource.data.uid == request.auth.uid;
    }
  }
}
```

Click **Publish**.

#### Analytics
1. Firebase Console → **Analytics** → it should already be enabled if you opted in during project creation
2. Firebase Console → **Project Settings** → **General** → scroll to **Your apps** → select your web app → copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

---

### 4. Service account (Admin SDK)

The server-side API routes use the Firebase Admin SDK and need a service account key.

1. Firebase Console → **Project Settings** → **Service accounts** tab
2. Click **Generate new private key** → confirm → a JSON file downloads
3. Rename it to `service-account.json` and place it in the **project root**

> `service-account.json` is in `.gitignore` — never commit it.

---

### 5. Web Push VAPID keys (optional — for push notifications)

If you want Web Push notifications:

1. Firebase Console → **Project Settings** → **Cloud Messaging** tab
2. Scroll to **Web Push certificates** → **Generate key pair**
3. Copy the public and private keys

---

### 6. Update `.gitignore`

Make sure your `.gitignore` includes the following entries to avoid accidentally committing secrets:

```gitignore
# Environment variables (contain API keys and secrets)
.env*

# Firebase Admin service account private key
service-account.json
```

Both are already present in the repo's `.gitignore`. If you fork this project or start from scratch, add them before your first commit.

> **Never commit `.env.local` or `service-account.json`.** These files contain credentials that give full access to your Firebase project.

---

### 7. Environment variables

Create a `.env.local` file in the project root (never commit this file):

```env
# ─── Firebase Client SDK ─────────────────────────────────────────────────────
# From Firebase Console → Project Settings → General → Your apps → Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=1:your_sender_id:web:your_app_id

# ─── Firebase Analytics ──────────────────────────────────────────────────────
# From Firebase Console → Project Settings → General → Your apps → Measurement ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# ─── Firebase Admin SDK ──────────────────────────────────────────────────────
# Path to your service account JSON (relative to project root)
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

# ─── Web Push VAPID keys (optional) ──────────────────────────────────────────
# From Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# ─── BoardGameGeek API (optional) ────────────────────────────────────────────
# Register at https://boardgamegeek.com/applications
BGG_API_TOKEN=
```

---

### 8. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

### 9. Seed test data (optional)

The seed script creates 20 test users, 120 events, friendships, comments, and saved addresses in Firestore — useful for QA.

**Prerequisites:** `service-account.json` must be present and `.env.local` must have `NEXT_PUBLIC_FIREBASE_PROJECT_ID` set.

```bash
npm run seed
```

> The script is idempotent — it clears existing seed data before writing fresh data.

After seeding, visit [http://localhost:3000/dev](http://localhost:3000/dev) to log in as any of the 20 test users with one click.

> The `/dev` login page is only available when `NODE_ENV=development` or `ENABLE_DEV_LOGIN=true`. It returns 404 in production.

---

## PWA (Progressive Web App)

The app ships with a Web App Manifest (`public/manifest.json`) so users can install it on their phone home screen.

### Add app icons

Two icon files are required for the full install experience:

| File | Size | Use |
|---|---|---|
| `public/icon-192.png` | 192×192 | Android home screen, push notification icon |
| `public/icon-512.png` | 512×512 | Android splash screen |

Create a teal dice (or any square logo) at those sizes and place them in `public/`. Until then the app installs without a custom icon.

### iOS install

Safari → Share button → **Add to Home Screen**

### Android install

Chrome → ⋮ menu → **Add to Home Screen** (or the install banner appears automatically)

---

## Analytics

The app uses Firebase Analytics with these custom events:

| Event | When fired |
|---|---|
| `login` | User signs in with Google |
| `sign_out` | User signs out |
| `event_created` | New event successfully created |
| `event_viewed` | Event detail page loaded |
| `event_joined` | User joins an event |
| `event_left` | User leaves an event |
| `event_cancelled` | Host cancels an event |
| `event_edited` | Host saves event edits |
| `tab_switched` | Home tab changed (For You / Friends / My Events) |
| `search_performed` | Search query entered (debounced 1s) |
| `carousel_bubble_tapped` | Friends activity carousel item opened |
| `comment_posted` | Comment submitted on an event |
| `comment_pinned` | Host pins a comment |
| `comment_deleted` | Comment deleted |
| `reaction_added` | Emoji reaction added to a comment |
| `event_link_copied` | Share link copied to clipboard |
| `share_modal_opened` | Share with Friends modal opened |
| `invite_sent` | Friend invitations sent |
| `invite_declined` | User declines an event invite |
| `friend_request_sent` | Friend request sent from a profile page |
| `friend_request_accepted` | Friend request accepted |
| `friend_request_declined` | Friend request declined |
| `friend_request_cancelled` | Sent friend request cancelled |
| `friend_removed` | Friend removed |
| `listing_created` | Marketplace listing created |
| `listing_viewed` | Marketplace listing detail opened |
| `listing_marked_sold` | Seller marks listing as sold |
| `listing_relisted` | Seller re-activates a sold listing |
| `listing_deleted` | Seller deletes a listing |
| `contact_seller` | Buyer taps WhatsApp contact button |

View events in Firebase Console → **Analytics** → **Events** (may take up to 24h to appear; use **DebugView** for real-time testing).

---

## Project Structure

```
app/
  page.tsx              # Home (For You / Friends / My Events tabs)
  create/               # Create event form
  event/[id]/           # Event detail page
  event/[id]/manage/    # Host management dashboard
  my-events/            # Events you've hosted or joined
  friends/              # Friends list and requests
  invites/              # Pending invitations
  profile/              # Your profile
  profile/[uid]/        # Public user profile
  settings/             # App settings (appearance, etc.)
  dev/                  # Dev/QA login page (development only)
  api/
    events/             # CRUD for events
    players/            # Join / leave event
    friends/            # Friend requests
    invites/            # Event invitations
    addresses/          # Saved addresses
    bgg/                # BoardGameGeek proxy
    dev/token/          # Custom auth token (dev only)
components/
  event/                # EventCard, EventComments, FriendsCarousel, ShareLink, …
  forms/                # CreateEventForm, EditEventForm, JoinEventForm
  layout/               # HomeHeader
  ui/                   # Button, Input, Spinner, …
contexts/
  AuthContext.tsx        # Firebase auth state
lib/
  analytics.ts          # Firebase Analytics helpers
  firebase/
    client.ts           # Firebase client SDK
    admin.ts            # Firebase Admin SDK
scripts/
  seed.ts               # Database seeder (npm run seed)
```

---

## Deploying to Vercel

### 1. Push your code to GitHub

Make sure all your changes are committed and pushed to the `main` branch on GitHub.

### 2. Create a Vercel project

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository (`game-night-app`)
3. Vercel will auto-detect Next.js — leave the build settings as-is
4. Click **Deploy** (it will fail on the first attempt because env vars aren't set yet — that's fine)

### 3. Add environment variables

In your Vercel project → **Settings** → **Environment Variables**, add the following:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | From Firebase project settings |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | From Firebase project settings |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | From Firebase project settings |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | From Firebase project settings |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | From Firebase project settings |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | From Firebase project settings |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | From Firebase project settings |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | See below |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Optional — for push notifications |
| `VAPID_PRIVATE_KEY` | Optional — for push notifications |

#### Generating `FIREBASE_SERVICE_ACCOUNT_JSON`

Vercel can't read a local file, so the service account must be passed as a single-line JSON string:

```bash
cat service-account.json | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)))"
```

Copy the output and paste it as the value of `FIREBASE_SERVICE_ACCOUNT_JSON` in Vercel.

### 4. Redeploy

After adding all env vars, go to **Deployments** → click **⋯** on the latest deployment → **Redeploy**.

### 5. Add your Vercel domain to Firebase Auth

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Click **Add domain** → enter your Vercel URL (e.g. `your-app.vercel.app`)
3. Save

Google Sign-In will not work until this step is complete.

### 6. Connect GitHub for automatic deploys (recommended)

1. Vercel project → **Settings** → **Git**
2. Click **Connect Git Repository** → select your GitHub repo
3. Set the production branch to `main`

After connecting, every push to `main` will trigger an automatic deployment.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed Firestore with 20 test users and 120 events |
