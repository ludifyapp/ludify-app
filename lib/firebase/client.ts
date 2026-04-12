import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator, initializeFirestore, memoryLocalCache, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth'

const usingEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'

// In emulator mode omit appId/messagingSenderId/measurementId — those fields
// trigger the Installations SDK which tries to phone home to Google and fails
// with 403 PERMISSION_DENIED against a demo-* project.
const firebaseConfig = usingEmulator
  ? {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      apiKey: 'demo-key',
      authDomain: typeof window !== 'undefined'
      ? window.location.hostname
      : (process.env.NEXT_PUBLIC_EMULATOR_HOST ?? '127.0.0.1'),
    }
  : {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    }

const isNewApp = getApps().length === 0
export const app = isNewApp ? initializeApp(firebaseConfig) : getApps()[0]

// In emulator mode use long-polling + memory cache — WebSockets and IndexedDB
// persistence both cause Firestore's internal state machine (ca9) to fail on
// SPA back-navigation when listeners are torn down and recreated.
export const db = (isNewApp && usingEmulator)
  ? initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: memoryLocalCache(),
    })
  : isNewApp
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  : getFirestore(app)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

if (usingEmulator && isNewApp) {
  const emulatorHost =
    typeof window !== 'undefined'
      ? window.location.hostname
      : (process.env.NEXT_PUBLIC_EMULATOR_HOST ?? '127.0.0.1')
  connectFirestoreEmulator(db, emulatorHost, 8080)
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true })
}
