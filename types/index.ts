export interface Friendship {
  id: string
  uids: [string, string]
  fromUid: string
  toUid: string
  status: 'pending' | 'accepted'
  fromName: string
  fromPhoto?: string
  toName: string
  toPhoto?: string
  createdAt: string
  updatedAt: string
}

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends'

export interface BggGame {
  bggId: string
  name: string
  yearPublished?: number | null
  thumbnail?: string
}

export interface CollectionGame {
  bggId: string
  name: string
  thumbnail: string
  yearPublished?: number | null
  addedAt: string
}

export interface UserProfile {
  bggUsername?: string
  bggLastSyncedAt?: string
}

export interface Player {
  id: string
  name: string
  isHost: boolean
  joinedAt: string
  photoURL?: string
}

export type EffectiveStatus = 'waiting' | 'full' | 'ongoing' | 'ended' | 'cancelled'

export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor'
export type ListingStatus = 'active' | 'sold'

export interface Listing {
  id: string
  sellerUid: string
  sellerName: string
  sellerPhoto: string | null
  boardGame: BggGame
  condition: ListingCondition
  price: number        // stored in cents
  description: string
  location: string
  whatsapp: string
  status: ListingStatus
  soldAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Conversation {
  id: string
  participants: string[]
  participantNames: Record<string, string>
  participantPhotos: Record<string, string>
  lastMessage: string
  lastMessageAt: string
  lastSenderUid: string
  unread: Record<string, number>
  createdAt: string
  listingId?: string
  listingName?: string
  listingThumbnail?: string
}

export interface DirectMessage {
  id: string
  uid: string
  text: string
  createdAt: string
  type?: 'text' | 'listing'
  listing?: { id: string; name: string; thumbnail?: string }
  reactions?: Record<string, string[]>
}

export interface Recap {
  id: string
  tableId: string
  hostUid: string
  hostName: string
  hostPhoto: string
  game: { name: string; thumbnail: string; bggId: string }
  note: string
  winner?: string
  playerCount: number
  createdAt: string
}

export interface GameTable {
  id: string
  boardGame: BggGame
  description?: string
  dateTime: string
  endDateTime?: string
  address: string
  addressLabel?: string
  minPlayers: number
  maxPlayers: number
  type: 'public' | 'private'
  status: 'active' | 'cancelled'
  hostUid: string
  playerUids: string[]
  players: Player[]
  allowComments?: boolean
  createdAt: string
}

export type FriendDisplayItem = {
  uid: string
  name: string
  photo?: string
  activity: 'ongoing' | 'upcoming' | 'upcoming_private' | 'recap'
  tables: GameTable[]   // all upcoming/ongoing tables; empty for recap
  recap?: Recap         // populated only when activity === 'recap'
}

export interface TrendingGame {
  bggId: string
  name: string
  thumbnail: string
  playCount: number
  totalPlayers: number
}
