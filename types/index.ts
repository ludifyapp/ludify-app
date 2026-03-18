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
}

export interface GameEvent {
  id: string
  boardGame: BggGame
  description?: string
  dateTime: string
  endDateTime?: string
  address: string
  minPlayers: number
  maxPlayers: number
  type: 'public' | 'private'
  status: 'active' | 'cancelled'
  players: Player[]
  createdAt: string
}
