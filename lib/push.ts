import 'server-only'
import webpush from 'web-push'
import { db } from '@/lib/firebase/admin'

webpush.setVapidDetails(
  'mailto:admin@gamenight.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

interface PushPayload {
  title: string
  body: string
  url?: string
}

export async function sendPushToUser(
  uid: string,
  payload: PushPayload,
  preferenceKey?: 'invites' | 'joinLeave' | 'comments'
): Promise<void> {
  const doc = await db.collection('pushSubscriptions').doc(uid).get()
  if (!doc.exists) return

  const { subscription, preferences } = doc.data()!

  // Respect per-type preference if specified
  if (preferenceKey && preferences?.[preferenceKey] === false) return

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
  } catch (err: any) {
    // Expired or invalid subscription — clean up
    if (err.statusCode === 404 || err.statusCode === 410) {
      await db.collection('pushSubscriptions').doc(uid).delete()
    }
  }
}
