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
}

export interface Recap {
  id: string
  eventId: string
  hostUid: string
  hostName: string
  hostPhoto: string
  game: { name: string; thumbnail: string; bggId: string }
  note: string
  winner?: string
  playerCount: number
  createdAt: string
}

export interface GameEvent {
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
  createdAt: string
}
