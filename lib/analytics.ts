import { getAnalytics, logEvent, isSupported, type Analytics } from 'firebase/analytics'
import { app } from '@/lib/firebase/client'

// Lazily initialised — reuses the same promise on every call
let _promise: Promise<Analytics | null> | null = null

function getAnalyticsInstance(): Promise<Analytics | null> {
  if (_promise) return _promise
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
    return Promise.resolve(null)
  }
  _promise = isSupported()
    .then((yes) => (yes ? getAnalytics(app) : null))
    .catch(() => null)
  return _promise
}

type Params = Record<string, string | number | boolean>

/** Fire-and-forget analytics event. Never throws. */
export function track(name: string, params?: Params): void {
  getAnalyticsInstance()
    .then((a) => { if (a) logEvent(a, name, params) })
    .catch(() => {})
}

// ── Typed helpers ─────────────────────────────────────────────────────────────

export const Analytics = {
  // Auth
  login:          (method: string)                        => track('login',                  { method }),
  signOut:        ()                                      => track('sign_out'),

  // Events
  eventCreated:   (p: { game: string; type: string })     => track('event_created',          p),
  eventViewed:    (p: { event_id: string; game: string; status: string }) => track('event_viewed', p),
  eventJoined:    (p: { event_id: string; game: string }) => track('event_joined',           p),
  eventLeft:      (p: { event_id: string; game: string }) => track('event_left',             p),
  eventCancelled: (p: { event_id: string; game: string }) => track('event_cancelled',        p),
  eventEdited:    (p: { event_id: string })               => track('event_edited',           p),

  // Discovery
  tabSwitched:    (tab: string)                           => track('tab_switched',           { tab }),
  searchPerformed:(p: { query_length: number; results_count: number; tab: string }) => track('search_performed', p),

  // Friends carousel
  carouselTapped: (p: { event_id: string; game: string; status: string }) => track('carousel_bubble_tapped', p),

  // Comments
  commentPosted:  (p: { event_id: string })               => track('comment_posted',         p),
  commentPinned:  (p: { event_id: string })               => track('comment_pinned',         p),
  commentDeleted: (p: { event_id: string })               => track('comment_deleted',        p),

  // Share
  shareLinkCopied:    (p: { event_id: string })           => track('event_link_copied',      p),
  shareModalOpened:   (p: { event_id: string })           => track('share_modal_opened',     p),
  inviteSent:         (p: { event_id: string; count: number }) => track('invite_sent',       p),

  // Social
  friendRequestAccepted: ()                               => track('friend_request_accepted'),
  friendRequestDeclined: ()                               => track('friend_request_declined'),
  friendRemoved:         ()                               => track('friend_removed'),
  friendRequestCancelled:()                               => track('friend_request_cancelled'),
}
