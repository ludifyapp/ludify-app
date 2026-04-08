import 'server-only'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

const usingEmulator = !!process.env.FIRESTORE_EMULATOR_HOST

function getCredential() {
  if (usingEmulator) return undefined // emulator needs no credentials
  // Vercel: service account JSON stored as env var
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
  }
  // Local dev: path to service account file
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return cert(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  }
  return undefined
}

const app =
  getApps().length === 0
    ? initializeApp(
        usingEmulator
          ? { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-ludify' }
          : { credential: getCredential() }
      )
    : getApps()[0]

export const db = getFirestore(app)
export const adminAuth = getAuth(app)
