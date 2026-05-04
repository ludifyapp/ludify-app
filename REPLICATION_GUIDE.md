Guia usada para cambiar de Eventos a Mesas

# Migration Guide: Event to Table Refactoring

This document outlines the steps to replicate the "Event to Table" refactoring in a new Firebase environment.

## 1. Codebase Refactoring

The refactoring was a project-wide replacement of `event` with `table`. Use a single-pass script or a global replace with **word boundaries** to avoid breaking built-in methods (like `addEventListener` or `logEvent`).

### Key Replacement Patterns
- `\bevent\b` -> `table`
- `\bEvent\b` -> `Table`
- `\bevents\b` -> `tables`
- `\bEvents\b` -> `Tables`
- `\beventId\b` -> `tableId`
- `\bGameEvent\b` -> `GameTable`
- `(?<!-)pointer-events-none` -> (Preserve this CSS class)

### Critical Manual Fixes
- **DOM Classes:** Ensure `(e: Event)` in event handlers or `extends Event` (e.g., in PWA logic) are NOT renamed to `Table`.
- **Firebase/Analytics:** Keep `logEvent` name but update parameters (e.g., `logEvent(analytics, 'table_joined', { table_id: id })`).

## 2. Firebase Rules
Update `firestore.rules` to match the new collection name:
- Rename `match /events/{eventId}` to `match /tables/{tableId}`.
- Update all internal path references, e.g., `get(/databases/$(database)/documents/tables/$(tableId))`.

## 3. Database Migration (Firestore)

If you have existing data in another environment, you must migrate the collection.

### Strategy A: Export/Import (Recommended for large datasets)
1. **Export `events` collection:**
   ```bash
   gcloud firestore export gs://[BUCKET_NAME]/migration-export --collection-ids=events
   ```
2. **Import into `tables`:**
   Note: Cloud Firestore import doesn't allow renaming collections on import. You must import them and then use a script to move documents from `events` to `tables`.

### Strategy B: Migration Script (Best for smaller datasets)
A ready-to-run script is included at `scripts/migrate-events-to-tables.ts`. It migrates the `events` collection to `tables`, and renames `eventId` → `tableId` in the `recaps` and `ratings` collections. It is idempotent — safe to re-run if interrupted.

```bash
# Export the service account for the target environment, then run:
export GOOGLE_APPLICATION_CREDENTIALS=./service-account-dev.json
npx ts-node scripts/migrate-events-to-tables.ts --env dev
```

Replace `dev` with `qa` or `prod` and point to the corresponding service account file.

## 4. Seed Scripts
Update your `scripts/seed.ts` to use `collection(db, 'tables')` instead of `events`.

## 5. Firebase Project Setup
If setting up a brand new project:
1. `firebase use [alias]` (point to the new project)
2. `firebase deploy --only firestore:rules,firestore:indexes`
3. Update `.env.[env]` files with the new Firebase config.

## 6. Local Emulator Setup — Critical Pitfalls

> **Emulators are for local development only.** Production, QA, and dev environments connect directly to real Firebase projects — they never use emulators. Steps in this section do not apply to those environments.

### The `demo-*` project ID convention
Firebase treats any project ID starting with `demo-` as a fully local, sandboxed project. It disables all outbound calls to real Google services, which is why the emulators work without a service account or real credentials.

The project uses `demo-ludify` locally. You can rename it to anything with a `demo-` prefix (e.g. `demo-myapp`) as long as you keep it consistent across:
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` in `.env.local`
- The `--project` flag when starting emulators

### Always pass the `--project` flag matching your `.env.local`
The `.firebaserc` default project is `ludify-app-dev` (the real dev project). If you start emulators without `--project`, Auth tokens get issued with `aud: "ludify-app-dev"`. The Admin SDK will reject every token with:
> _Firebase ID token has incorrect "aud" (audience) claim. Expected "demo-ludify" but got "ludify-app-dev"._

This causes **every authenticated API route to return 500 Internal Server Error** with no obvious clue in the logs.

**Always start emulators with the project matching `NEXT_PUBLIC_FIREBASE_PROJECT_ID`:**
```bash
npx firebase emulators:start --only auth,firestore --project demo-ludify
```
Or use the npm script (which already includes the flag):
```bash
npm run emulators
```
> Note: `npm run emulators` also starts the hosting emulator which conflicts with `npm run dev`. If both are running, use the `npx` command above with `--only auth,firestore`.

### Re-seed after restarting emulators
Emulator data is in-memory only. After any restart, run:
```bash
npm run seed
```
