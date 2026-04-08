# Ludify

A social platform for board game enthusiasts. Discover players, organise game nights, buy and sell games, and build your board game identity — all in one place.

## Features

### Events
- **Create events** — pick a board game via BoardGameGeek search (with thumbnails), set date/time, address (with saved addresses autocomplete), player limits (min/max), and visibility (public/private)
- **Join events** — guests join via shareable link with just a name; authenticated users join with one click
- **Host dashboard** — edit all event details, manually add guests, remove players, cancel events, and post a post-game recap
- **Real-time comments** — per-event threads; host can pin a comment; emoji reactions (👍 ❤️ 😂 😮 🎲) on any comment; host can delete any comment
- **Post-event recaps** — after an event ends, the host posts a note + winner + player count; recaps appear in friends' For You feeds as `RecapCard`
- **"What Should We Play?" recommender** — collects all attendees' game collections, intersects them, and ranks suggestions by group fit (owned by the most people)
- **Join confirmation push** — push notification sent immediately after a player joins, with event name, date, and address

### Discovery & Social
- **5-tab home** — For You (friends' events + recaps), Explore (all public events), Friends, My Events, Marketplace
- **Friends activity carousel** — Instagram-style story bubbles at the top of the Friends tab; event bubbles (colour gradient) for friends with upcoming events; recap bubbles (amber gradient + 🏆 badge for winners) for friends' recent games; swipe/keyboard navigation in preview modal
- **Friends system** — send/accept/decline/cancel friend requests; view pending requests; remove friends
- **Public profiles** — bio, skill level badge (Casual / Intermediate / Hardcore), member since year, host rating (⭐ avg from attendees), hosted/played/games/friends stats, upcoming events list, full game collection grid
- **Skill level** — set your experience level on your profile (Casual / Intermediate / Hardcore); displayed on public profiles and nearby player cards
- **Host ratings** — attendees rate the host 1–5 stars after an event ends; average shown on the host's public profile
- **Map-based nearby player discovery** — opt-in location sharing; geohash-based radius queries (5–50km) show nearby players with their avatar, name, game collection size, and skill level; shown in the Explore tab for logged-in users

### Marketplace
- **Buy and sell board games** — create listings with BGG game search, condition, price, location, and description
- **Condition + price filters** — filter by condition (New, Like New, Good, Fair, Poor); sort by price low→high or high→low
- **Seller trust layer** — listing detail pages show how many events the seller has hosted and their member since date
- **In-app DMs** — buyers message sellers directly inside the app (replaces WhatsApp redirect for logged-in users); real-time threads via Firestore `onSnapshot`; unread message badge in the header menu

### Invitations & Notifications
- **Event invitations** — hosts send direct invites to friends from the manage page; recipients see them on the Invites page with accept/decline
- **Web Push notifications** — opt-in browser push for: event invites, player join/leave activity, and join confirmations; per-type toggle in Settings

### Onboarding & Settings
- **Onboarding modal** — shown on first login with three action cards (browse events / add to collection / find friends); tracks action taken vs. skipped via Analytics
- **PWA install prompt** — install banner with accept/dismiss tracking
- **Settings page** — toggle browser notifications on/off; per-preference controls for invites and player activity notifications
- **Dark mode** — full dark/light mode, respects OS preference; switcher in the header menu

### Internationalisation
- **3 languages** — English, Español, Português (BR); detected automatically from browser locale; persisted in `localStorage`; switchable from the header menu
- All UI chrome is translated (navigation, buttons, status labels, empty states, settings); user-generated content (event descriptions, game names, bios) is intentionally left untranslated

### Feature Flags (Firebase Remote Config)
- **Remote Config integration** — three boolean flags fetched on app load; defaults to `true` so the app works fully before RC is configured
- **`marketplace_enabled`** — hides the Marketplace tab, My Listings menu item, and Sell a Game FAB
- **`nearby_players_enabled`** — hides the Nearby Players section in the Explore tab
- **`dms_enabled`** — hides the Messages menu item and unread badge; reverts the listing contact button to WhatsApp for all users
- **Safe fallback** — any network error or missing RC configuration leaves all flags enabled; 1-hour cache in production, 0ms in development for instant iteration

### Developer
- **Firebase Analytics** — custom event tracking across all major user flows (see [Analytics Events](#analytics-events) table)
- **Dev/QA login page** — one-click login as any of 20 seeded test users (development only, returns 404 in production)
- **Seed script** — fully idempotent; seeds 20 users, 120 events, friendships, comments, reactions, game collections, bios, skill levels, host ratings, geo data, marketplace listings, recaps with winners, conversations with messages, and event invitations

---

## Tech Stack

| Layer | Library/Service | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS v4 | 4 |
| Auth & DB | Firebase (Auth, Firestore, Analytics, Remote Config) | 12 |
| Server | Firebase Admin SDK | 13 |
| Dark mode | next-themes | 0.4 |
| i18n | react-i18next + i18next-browser-languagedetector | 25/8 |
| Geolocation | geofire-common (geohash queries) | 6 |
| Push | web-push (VAPID) | 3.6 |
| Validation | Zod | 4 |
| BGG | BoardGameGeek XML API2 (proxied) | — |

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
3. **Settings** tab → **Authorized domains** → add `localhost` for local dev (usually present by default)

#### Firestore
1. Firebase Console → **Firestore Database** → **Create database**
2. Choose **production mode** (security rules are set in the next step)
3. Pick a region close to your users

#### Firestore security rules

Firebase Console → **Firestore** → **Rules** tab — paste the following and click **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Events — public reads; all writes go through Admin SDK (API routes)
    match /events/{eventId} {
      allow read: if true;
      allow write: if false;

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

    // Direct messages — participants only; all writes via Admin SDK
    match /conversations/{convId} {
      allow read: if request.auth != null
        && request.auth.uid in resource.data.participants;
      allow write: if false;

      match /messages/{msgId} {
        allow read: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/conversations/$(convId)).data.participants;
        allow write: if false;
      }
    }
  }
}
```

#### Analytics
1. Firebase Console → **Analytics** — should already be enabled if you opted in during project creation
2. **Project Settings** → **General** → **Your apps** → select your web app → copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

#### Remote Config (feature flags)
1. Firebase Console → **Remote Config** → **Create configuration**
2. Add the following parameters — all Boolean type, all default value `true`:

| Parameter key | Description |
|---|---|
| `marketplace_enabled` | Show/hide the Marketplace tab and Sell a Game FAB |
| `nearby_players_enabled` | Show/hide Nearby Players in the Explore tab |
| `dms_enabled` | Show/hide in-app messaging; falls back to WhatsApp when disabled |

3. Click **Publish changes**

To disable a feature in production: set its value to `false` → **Publish**. Active sessions pick up the change within 1 hour with no redeploy required.

> Remote Config is optional — if it isn't configured, all features default to enabled and the app works normally.

---

### 4. Service account (Admin SDK)

The server-side API routes use the Firebase Admin SDK and need a service account key.

1. Firebase Console → **Project Settings** → **Service accounts** tab
2. Click **Generate new private key** → confirm → a JSON file downloads
3. Rename it to `service-account.json` and place it in the **project root**

> `service-account.json` is in `.gitignore` — never commit it.

---

### 5. Web Push VAPID keys (optional — for push notifications)

If you want Web Push (join confirmations, invite notifications, player activity):

1. Firebase Console → **Project Settings** → **Cloud Messaging** tab
2. Scroll to **Web Push certificates** → **Generate key pair**
3. Copy the public and private keys

If these keys are absent, push notifications are silently disabled — the rest of the app works normally.

---

### 6. Environment variables

Create `.env.local` in the project root (never commit this file):

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
# From Firebase Console → Project Settings → General → Measurement ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# ─── Firebase Admin SDK ──────────────────────────────────────────────────────
# Path to your service account JSON (relative to project root)
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

# ─── Web Push VAPID keys (optional) ──────────────────────────────────────────
# From Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

---

### 7. Local development with Firebase Emulators (recommended)

Running the Firebase emulators locally prevents development traffic from consuming real Firestore quota (free-tier Spark plan has a 50k reads/day limit that is easy to exhaust) and lets you use the one-click dev login at `/dev` without a real service account.

#### Prerequisites

The emulators require **Java 21 or later**.

```bash
# Check your version
java -version

# Install Java 21 via Homebrew if needed
brew install openjdk@21

# Add it to your PATH (copy the exact command Homebrew prints, or use:)
echo 'export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

#### Add emulator env vars

Add these lines to your `.env.local`:

```env
# Routes Admin SDK Firestore traffic to the local emulator
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080

# Routes Admin SDK Auth traffic to the local emulator (required for dev login / custom tokens)
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099

# Tells the client SDK to connect to the local emulators instead of production Firebase
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
```

> Remove or comment out these lines when you want to connect to real Firebase (e.g. for QA/production testing).

#### Start the emulators and seed

Open **three terminals**:

**Terminal 1** — start the emulators (both auth and Firestore are required):
```bash
firebase emulators:start --only firestore,auth
```
Wait until you see `✔ All emulators ready!`. The emulator UI is available at [http://localhost:4000](http://localhost:4000).

**Terminal 2** — seed with test data:
```bash
npm run seed
```
The seed script picks up the emulator env vars from `.env.local` and writes all data locally.

**Terminal 3** — start the dev server:
```bash
npm run dev
```

> You must restart `npm run dev` whenever you add or change env vars in `.env.local` — Next.js does not hot-reload environment variables.

#### Testing from a phone on the same Wi-Fi network

The emulators and Next.js dev server both need to accept connections from your phone.

**1. Find your machine's local IP:**
```bash
ipconfig getifaddr en0
# e.g. 192.168.1.91
```

**2. Add your IP to `.env.local`:**
```env
# Phone-accessible IP for the emulators (client SDK uses this, not 127.0.0.1)
NEXT_PUBLIC_EMULATOR_HOST=192.168.1.91
```

**3. Start the dev server bound to all interfaces:**
```bash
npm run dev -- -H 0.0.0.0
```

**4. On your phone**, navigate to `http://<YOUR_IP>:3000` (e.g. `http://192.168.1.91:3000`).

The dev login page at `/dev` will work from the phone — tap any seed user to sign in instantly.

> `NEXT_PUBLIC_EMULATOR_HOST` defaults to `127.0.0.1` when unset, so local browser access is unaffected if you omit it.

---

### 8. Run the development server (without emulator)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

### 9. Seed test data (optional)

The seed script populates Firestore with a full dataset for QA and development:

| Collection | Count | Details |
|---|---|---|
| Auth users | 20 | alice@gamenight.test … tina@gamenight.test, password `Test1234!` |
| Events | 120 | 6 per user — past, ongoing, future, cancelled, public, private |
| Friendships | 27 | 24 accepted + 3 pending |
| Comments | 62 | On the first 25 events, with emoji reactions |
| Game collections | 120 entries | 4–8 BGG games per user |
| Marketplace listings | 40 | 2 per user; mix of active and sold |
| Recaps | 16 | For ended events; half include a winner |
| Conversations | 7 | With 35 total messages; 3 linked to marketplace listings |
| Invitations | 9 | Pending invites from hosts to friends |
| Saved addresses | 20 | 2 per user (first 10 users) |
| Skill levels | 20 | Casual / Intermediate / Hardcore |
| Host ratings | 15 | `ratingTotal` + `ratingCount` (avg 4.0–5.0) |
| Geo data | 20 | 5 city clusters (SF, NYC, Chicago, Austin, Seattle) |
| Bios | 20 | Unique bio per user |

**Prerequisites:** `service-account.json` present, `NEXT_PUBLIC_FIREBASE_PROJECT_ID` set in `.env.local`, and (if using the emulator) the emulator running.

```bash
npm run seed
```

The script is idempotent — it clears all existing seed data before writing fresh data.

After seeding, visit [http://localhost:3000/dev](http://localhost:3000/dev) to sign in as any test user with one click (no password required in dev mode).

> The `/dev` page returns 404 in production. It is only available when `NODE_ENV=development`.

---

## PWA (Progressive Web App)

The app ships with `public/manifest.json` so users can install it on their home screen.

### Icons

| File | Size | Used for |
|---|---|---|
| `public/icon-192.png` | 192×192 | Android home screen, push notification icon |
| `public/icon-512.png` | 512×512 | Android splash screen |

Place a square logo at both sizes in `public/`. Until then, the app installs without a custom icon.

### Install

- **iOS** — Safari → Share → **Add to Home Screen**
- **Android** — Chrome → ⋮ → **Add to Home Screen** (or accept the in-app install prompt)

---

## Analytics Events

All events are fire-and-forget via `lib/analytics.ts`. View them in Firebase Console → **Analytics** → **Events** (up to 24h delay; use **DebugView** for real-time).

| Event | Fired when |
|---|---|
| `login` | User signs in with Google |
| `sign_out` | User signs out |
| `event_created` | New event successfully created |
| `event_viewed` | Event detail page loaded |
| `event_joined` | User joins an event |
| `event_left` | User leaves an event |
| `event_cancelled` | Host cancels an event |
| `event_edited` | Host saves event edits |
| `tab_switched` | Home tab changed |
| `search_performed` | Search query submitted (debounced 1 s) |
| `carousel_bubble_tapped` | Friends carousel story bubble opened |
| `comment_posted` | Comment submitted |
| `comment_pinned` | Host pins a comment |
| `comment_deleted` | Comment deleted |
| `reaction_added` | Emoji reaction toggled on a comment |
| `event_link_copied` | Share link copied to clipboard |
| `share_modal_opened` | Share with Friends modal opened |
| `invite_sent` | Friend invitations sent |
| `invite_declined` | User declines an event invite |
| `friend_request_sent` | Friend request sent |
| `friend_request_accepted` | Friend request accepted |
| `friend_request_declined` | Friend request declined |
| `friend_request_cancelled` | Sent friend request cancelled |
| `friend_removed` | Friend removed |
| `listing_created` | Marketplace listing created |
| `listing_viewed` | Marketplace listing detail opened |
| `listing_marked_sold` | Seller marks listing as sold |
| `listing_relisted` | Seller re-activates a sold listing |
| `listing_deleted` | Seller deletes a listing |
| `contact_seller` | Buyer opens a DM conversation from a listing |
| `collection_game_added` | User adds a game to their collection |
| `collection_game_removed` | User removes a game from their collection |
| `recap_posted` | Host posts a game night recap |
| `host_rated` | Attendee submits a host rating |
| `message_sent` | User sends a direct message |
| `conversation_started` | New DM conversation opened (tracks `from_listing`) |
| `theme_switched` | Appearance changed (light / dark / system) |
| `language_switched` | UI language changed |
| `notifications_toggled` | Browser push master toggle changed |
| `notification_pref_changed` | Per-type notification preference changed |
| `onboarding_action_taken` | User acts on a first-login onboarding card |
| `onboarding_skipped` | User dismisses onboarding without acting |
| `pwa_install_clicked` | User taps the PWA install prompt |
| `pwa_install_accepted` | User accepts the PWA install |
| `pwa_install_dismissed` | User dismisses the PWA install prompt |
| `nearby_players_enabled` | User grants location access for nearby player discovery |
| `nearby_radius_changed` | User changes the discovery radius |
| `profile_viewed` | A public user profile is loaded |
| `game_recs_opened` | "What Should We Play?" accordion expanded |
| `skill_level_set` | User sets their skill level on their profile |
| `location_sharing_toggled` | User enables/disables location sharing |

---

## Project Structure

```
app/
  page.tsx                        # Home — For You / Friends / Explore / My Events / Marketplace tabs
  create/                         # Create event form
  event/[id]/                     # Event detail page (join, comments, recap, game recs, nearby map)
  event/[id]/manage/              # Host management dashboard (edit, guests, recap form)
  my-events/                      # All events you've hosted or joined (upcoming / cancelled / past)
  friends/                        # Friends list, pending requests
  invites/                        # Pending event invitations
  profile/                        # Your profile (bio, skill level, collection, saved addresses, location)
  profile/[uid]/                  # Public user profile (stats, rating, skill, bio, collection, events)
  settings/                       # Push notification settings
  marketplace/
    listing/[id]/                 # Listing detail with seller trust info and DM button
  messages/                       # DM conversation list
  messages/[id]/                  # DM thread (real-time via Firestore onSnapshot)
  dev/                            # One-click dev login (development only — 404 in production)
  api/
    events/                       # GET (list) / POST (create) events
    events/[id]/                  # GET / PATCH / DELETE single event
    events/[id]/players/          # POST join / DELETE leave; fires push to host + joiner
    events/[id]/players/[id]/     # DELETE specific player (host removes guest)
    events/[id]/comments/         # POST comment
    events/[id]/comments/[id]/reactions/  # POST toggle emoji reaction
    events/[id]/recap/            # GET / POST game night recap (host only, after event ends)
    events/[id]/rating/           # POST host rating (attendee only, after event ends)
    events/[id]/recommendations/  # GET "What Should We Play?" suggestions
    recaps/                       # GET recent recaps, filterable by hostUids (friends feed)
    friends/                      # GET list / POST send request
    friends/[uid]/                # PATCH accept/decline / DELETE remove
    invites/                      # GET received / POST send / PATCH mark seen
    invites/[id]/                 # PATCH accept/decline
    addresses/                    # GET / POST saved addresses
    addresses/[id]/               # DELETE saved address
    users/[uid]/                  # GET profile / PATCH bio + skill level
    users/[uid]/events/           # GET events hosted or joined by this user
    users/[uid]/collection/       # GET / POST / DELETE game collection
    users/photos/                 # GET avatar URLs for a list of UIDs
    conversations/                # GET list / POST create conversation
    conversations/[id]/           # GET single conversation
    conversations/[id]/messages/  # POST send message
    players/nearby/               # GET nearby players via geohash radius query
    profile/location/             # POST save lat/lng + geohash / DELETE remove
    listings/                     # GET list / POST create listing
    listings/[id]/                # GET / PATCH / DELETE listing
    push/subscribe/               # GET prefs / POST save subscription / PATCH update prefs / DELETE unsubscribe
    bgg/search/                   # GET BoardGameGeek game search (proxied)
    bgg/thing/                    # GET BGG game detail by ID (proxied)
    dev/token/                    # GET custom auth token for seed users (dev only)

components/
  event/
    EventCard.tsx                 # Compact event card for lists
    EventListCard.tsx             # Expanded event card with host + date chip
    EventPageClient.tsx           # Full event detail page client component
    EventStatusBadge.tsx          # Waiting / Full / Ongoing / Ended / Cancelled pill
    FriendsCarousel.tsx           # Story-style bubbles; event + recap items; preview modals
    GameRecommendations.tsx       # "What Should We Play?" accordion
    HostRatingForm.tsx            # 1–5 star rating form (shown post-event to attendees)
    PlayerList.tsx                # Player avatars + open spots display
    RecapCard.tsx                 # Post-event recap card shown in feeds
    ShareLink.tsx                 # Copy link + Share with Friends modal
  forms/
    CreateEventForm.tsx           # Full create event form with BGG search
    EditEventForm.tsx             # Pre-filled edit form for hosts
    JoinEventForm.tsx             # Name entry + join button for guests
  layout/
    HomeHeader.tsx                # Header with menu (profile, friends, DMs, settings, appearance, language)
    I18nProvider.tsx              # react-i18next initialisation + locale persistence
    OnboardingModal.tsx           # First-login welcome modal
    PWAInstallPrompt.tsx          # Browser install banner
    ThemeProvider.tsx             # next-themes wrapper
  marketplace/
    ConditionBadge.tsx            # Condition label pill (New / Like New / Good / Fair / Poor)
    ListingCard.tsx               # Marketplace grid card
  players/
    NearbyPlayers.tsx             # Geolocation-based nearby players component (Explore tab)
  profile/
    CollectionManager.tsx         # Add/remove games from collection via BGG search
  ui/
    Spinner.tsx                   # Loading spinner

contexts/
  AuthContext.tsx                 # Firebase auth state (user, loading)
  FeatureFlagsContext.tsx         # Firebase Remote Config flags (marketplace, nearbyPlayers, dms)

hooks/
  useBggSearch.ts                 # Debounced BGG search hook
  usePushNotifications.ts         # Push subscription lifecycle (request, subscribe, unsubscribe)

lib/
  analytics.ts                    # Typed Analytics helpers (fire-and-forget wrappers)
  api-auth.ts                     # Server-side token verification helpers
  push.ts                         # sendPushToUser() — web-push VAPID sender
  utils.ts                        # getEffectiveStatus(), formatDateTime(), cn()
  firebase/
    client.ts                     # Firebase client SDK initialisation
    admin.ts                      # Firebase Admin SDK initialisation

types/
  index.ts                        # Shared TypeScript interfaces (GameEvent, Player, Recap, …)

public/
  locales/
    en/common.json                # English strings (source of truth)
    es/common.json                # Spanish translations
    pt-BR/common.json             # Portuguese (Brazil) translations
  manifest.json                   # PWA manifest
  sw.js                           # Service worker (push notifications)

scripts/
  seed.ts                         # Firestore seeder — run with `npm run seed`
```

---

## Deploying to Vercel

### 1. Push to GitHub

Make sure all changes are committed and pushed to `main`.

### 2. Create a Vercel project

1. [vercel.com](https://vercel.com) → **Add New Project** → import your repo
2. Vercel auto-detects Next.js — leave build settings as-is
3. Click **Deploy** (it will fail until env vars are set — that's fine)

### 3. Add environment variables

In Vercel project → **Settings** → **Environment Variables**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase project settings |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase project settings |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project settings |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase project settings |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase project settings |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase project settings |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase project settings |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | See below |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Optional — push notifications |
| `VAPID_PRIVATE_KEY` | Optional — push notifications |

#### Generating `FIREBASE_SERVICE_ACCOUNT_JSON`

Vercel can't read local files, so the service account must be inlined as a JSON string:

```bash
cat service-account.json | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)))"
```

Copy the output and paste it as the value of `FIREBASE_SERVICE_ACCOUNT_JSON`.

### 4. Redeploy

**Deployments** → ⋯ on the latest → **Redeploy**.

### 5. Add Vercel domain to Firebase Auth

Firebase Console → **Authentication** → **Settings** → **Authorized domains** → **Add domain** → enter your `.vercel.app` URL.

Google Sign-In will not work until this step is done.

### 6. Connect GitHub for automatic deploys (recommended)

Vercel project → **Settings** → **Git** → connect your repo → set production branch to `main`. Every push to `main` will trigger a deployment automatically.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run seed` | Seed Firestore with full test dataset (20 users, 120 events, …) |


## For now use Ludifyapp user for Git
## Se configuró el dominio de namecheap con Vercel