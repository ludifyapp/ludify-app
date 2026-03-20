import { getAnalytics, logEvent, isSupported, type Analytics as FirebaseAnalytics } from 'firebase/analytics'
import { app } from '@/lib/firebase/client'

// Lazily initialised — reuses the same promise on every call
let _promise: Promise<FirebaseAnalytics | null> | null = null

function getAnalyticsInstance(): Promise<FirebaseAnalytics | null> {
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
  commentPosted:   (p: { event_id: string })              => track('comment_posted',         p),
  commentPinned:   (p: { event_id: string })              => track('comment_pinned',         p),
  commentDeleted:  (p: { event_id: string })              => track('comment_deleted',        p),
  reactionAdded:   (p: { event_id: string; emoji: string }) => track('reaction_added',       p),

  // Share
  shareLinkCopied:    (p: { event_id: string })           => track('event_link_copied',      p),
  shareModalOpened:   (p: { event_id: string })           => track('share_modal_opened',     p),
  inviteSent:         (p: { event_id: string; count: number }) => track('invite_sent',       p),

  // Marketplace
  listingCreated:   (p: { game: string; condition: string; price: number }) => track('listing_created',    p),
  listingViewed:    (p: { listing_id: string; game: string })               => track('listing_viewed',     p),
  listingMarkedSold:(p: { listing_id: string })                             => track('listing_marked_sold',p),
  contactSeller:    (p: { listing_id: string })                             => track('contact_seller',     p),

  // Invites
  inviteDeclined: (p: { event_id: string })               => track('invite_declined',          p),

  // Social
  friendRequestSent:     (p: { to_uid: string })          => track('friend_request_sent',      p),
  friendRequestAccepted: ()                               => track('friend_request_accepted'),
  friendRequestDeclined: ()                               => track('friend_request_declined'),
  friendRemoved:         ()                               => track('friend_removed'),
  friendRequestCancelled:()                               => track('friend_request_cancelled'),

  // Marketplace (seller actions)
  listingRelisted: (p: { listing_id: string })            => track('listing_relisted',         p),
  listingDeleted:  (p: { listing_id: string })            => track('listing_deleted',          p),

  // Game collection
  collectionGameAdded:   (p: { game: string })            => track('collection_game_added',    p),
  collectionGameRemoved: (p: { game: string })            => track('collection_game_removed',  p),
}
