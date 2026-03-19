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
