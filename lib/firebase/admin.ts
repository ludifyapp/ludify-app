import 'server-only'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const app =
  getApps().length === 0
    ? initializeApp(
        process.env.GOOGLE_APPLICATION_CREDENTIALS
          ? { credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) }
          : undefined
      )
    : getApps()[0]

export const db = getFirestore(app)
