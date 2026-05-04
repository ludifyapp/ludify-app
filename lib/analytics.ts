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

/** Fire-and-forget analytics table. Never throws. */
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

  // Tables
  tableCreated:   (p: { game: string; type: string })     => track('table_created',          p),
  tableViewed:    (p: { table_id: string; game: string; status: string }) => track('table_viewed', p),
  tableJoined:    (p: { table_id: string; game: string }) => track('table_joined',           p),
  tableLeft:      (p: { table_id: string; game: string }) => track('table_left',             p),
  tableCancelled: (p: { table_id: string; game: string }) => track('table_cancelled',        p),
  tableEdited:    (p: { table_id: string })               => track('table_edited',           p),

  // Discovery
  tabSwitched:    (tab: string)                           => track('tab_switched',           { tab }),
  searchPerformed:(p: { query_length: number; results_count: number; tab: string }) => track('search_performed', p),

  // Friends carousel
  carouselTapped: (p: { table_id: string; game: string; status: string }) => track('carousel_bubble_tapped', p),

  // Comments
  commentPosted:   (p: { table_id: string })              => track('comment_posted',         p),
  commentPinned:   (p: { table_id: string })              => track('comment_pinned',         p),
  commentDeleted:  (p: { table_id: string })              => track('comment_deleted',        p),
  reactionAdded:   (p: { table_id: string; emoji: string }) => track('reaction_added',       p),

  // Share
  shareLinkCopied:    (p: { table_id: string })           => track('table_link_copied',      p),
  shareModalOpened:   (p: { table_id: string })           => track('share_modal_opened',     p),
  inviteSent:         (p: { table_id: string; count: number }) => track('invite_sent',       p),

  // Marketplace
  listingCreated:   (p: { game: string; condition: string; price: number }) => track('listing_created',    p),
  listingViewed:    (p: { listing_id: string; game: string })               => track('listing_viewed',     p),
  listingMarkedSold:(p: { listing_id: string })                             => track('listing_marked_sold',p),
  contactSeller:    (p: { listing_id: string })                             => track('contact_seller',     p),

  // Invites
  inviteDeclined: (p: { table_id: string })               => track('invite_declined',          p),

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

  // Recaps
  recapPosted: (p: { table_id: string; game: string })   => track('recap_posted',             p),

  // Ratings
  hostRated:   (p: { table_id: string; score: number })  => track('host_rated',               p),

  // Messaging
  messageSent: (p: { conversation_id: string })          => track('message_sent',             p),
  conversationStarted: (p: { from_listing: boolean })    => track('conversation_started',     p),

  // Preferences
  themeSwitched:           (p: { theme: string })                        => track('theme_switched',              p),
  languageSwitched:        (p: { language: string })                     => track('language_switched',           p),
  notificationsToggled:    (p: { enabled: boolean })                     => track('notifications_toggled',       p),
  notificationPrefChanged: (p: { pref: string; enabled: boolean })       => track('notification_pref_changed',   p),

  // Onboarding
  onboardingActionTaken:   (p: { action: string })                       => track('onboarding_action_taken',     p),
  onboardingSkipped:       ()                                            => track('onboarding_skipped'),

  // PWA
  pwaInstallClicked:       ()                                            => track('pwa_install_clicked'),
  pwaInstallAccepted:      ()                                            => track('pwa_install_accepted'),
  pwaInstallDismissed:     ()                                            => track('pwa_install_dismissed'),

  // Discovery
  nearbyPlayersEnabled:    ()                                            => track('nearby_players_enabled'),
  nearbyRadiusChanged:     (p: { radius_km: number })                    => track('nearby_radius_changed',       p),
  profileViewed:           (p: { target_uid: string })                   => track('profile_viewed',              p),
  gameRecsOpened:          (p: { table_id: string; rec_count: number })  => track('game_recs_opened',            p),

  // Profile
  skillLevelSet:           (p: { skill_level: string })                  => track('skill_level_set',             p),
  locationSharingToggled:  (p: { enabled: boolean })                     => track('location_sharing_toggled',    p),
}
