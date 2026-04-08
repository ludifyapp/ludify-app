/**
 * Mock data for testing the Friends Activity story overlay.
 * Use at /dev/stories — never imported in production code.
 */
import type { FriendDisplayItem, GameEvent } from '@/types'

const now = new Date()
const h = (hours: number) => new Date(now.getTime() + hours * 3_600_000).toISOString()
const d = (days: number) => new Date(now.getTime() + days * 86_400_000).toISOString()

// ─── Shared players ───────────────────────────────────────────────────────────

const HOST = {
  id: 'host-1',
  name: 'Ana Lima',
  isHost: true,
  joinedAt: d(-1),
  photoURL: 'https://i.pravatar.cc/150?u=ana',
}

const PLAYERS = [
  { id: 'p1', name: 'Rodrigo Melo',    isHost: false, joinedAt: d(-1), photoURL: 'https://i.pravatar.cc/150?u=rod' },
  { id: 'p2', name: 'Camila Souza',    isHost: false, joinedAt: d(-1), photoURL: 'https://i.pravatar.cc/150?u=cam' },
  { id: 'p3', name: 'Felipe Torres',   isHost: false, joinedAt: d(-1), photoURL: undefined },
  { id: 'p4', name: 'Beatriz Nunes',   isHost: false, joinedAt: d(-1), photoURL: 'https://i.pravatar.cc/150?u=bea' },
  { id: 'p5', name: 'Lucas Carvalho',  isHost: false, joinedAt: d(-1), photoURL: 'https://i.pravatar.cc/150?u=luc' },
  { id: 'p6', name: 'Mariana Fonseca', isHost: false, joinedAt: d(-1), photoURL: undefined },
]

// ─── Helper ───────────────────────────────────────────────────────────────────

function event(overrides: Partial<GameEvent> & Pick<GameEvent, 'id' | 'boardGame' | 'dateTime'>): GameEvent {
  return {
    description: undefined,
    endDateTime: undefined,
    address: 'Rua das Flores, 42, São Paulo, SP',
    addressLabel: 'Rua das Flores, 42',
    minPlayers: 2,
    maxPlayers: 6,
    type: 'public',
    status: 'active',
    hostUid: HOST.id,
    playerUids: [HOST.id, PLAYERS[0].id, PLAYERS[1].id],
    players: [HOST, PLAYERS[0], PLAYERS[1]],
    allowComments: true,
    createdAt: d(-3),
    ...overrides,
  }
}

// ─── Mock events ─────────────────────────────────────────────────────────────

const evCatan1: GameEvent = event({
  id: 'ev-catan-1',
  boardGame: { bggId: '13', name: 'Catan', thumbnail: 'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__thumb/img/8a9HeqFydO7C5BNMjhkFpCFNbFc=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg' },
  dateTime: d(1),
  description: 'Weekly Catan night! Bring snacks.',
  players: [HOST, PLAYERS[0], PLAYERS[1]],
  playerUids: [HOST.id, PLAYERS[0].id, PLAYERS[1].id],
})

const evCatan2: GameEvent = event({
  id: 'ev-catan-2',
  boardGame: { bggId: '13', name: 'Catan', thumbnail: 'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__thumb/img/8a9HeqFydO7C5BNMjhkFpCFNbFc=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg' },
  dateTime: d(5),
  addressLabel: 'Bar da Vila',
  address: 'Bar da Vila, Av. Paulista 1200, São Paulo',
  players: [HOST, PLAYERS[2], PLAYERS[3], PLAYERS[4]],
  playerUids: [HOST.id, PLAYERS[2].id, PLAYERS[3].id, PLAYERS[4].id],
})

const evCatan3: GameEvent = event({
  id: 'ev-catan-3',
  boardGame: { bggId: '13', name: 'Catan: Seafarers', thumbnail: 'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__thumb/img/8a9HeqFydO7C5BNMjhkFpCFNbFc=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg' },
  dateTime: d(12),
  description: 'Seafarers expansion — first time trying it!',
  maxPlayers: 4,
  players: [HOST, PLAYERS[0]],
  playerUids: [HOST.id, PLAYERS[0].id],
})

const evPandemic: GameEvent = event({
  id: 'ev-pandemic',
  boardGame: { bggId: '30549', name: 'Pandemic', thumbnail: 'https://cf.geekdo-images.com/S3ybV1LAp-8SnHIXLLjVqA__thumb/img/B9J0U0fX5BUgJjPNOa07MXCgYwM=/fit-in/200x150/filters:strip_icc()/pic1534148.jpg' },
  dateTime: d(3),
  description: 'Co-op night. Can we save the world?',
  maxPlayers: 4,
  players: [HOST, PLAYERS[1], PLAYERS[2], PLAYERS[3]],
  playerUids: [HOST.id, PLAYERS[1].id, PLAYERS[2].id, PLAYERS[3].id],
})

const evTicketToRide: GameEvent = event({
  id: 'ev-ttr',
  boardGame: { bggId: '9209', name: 'Ticket to Ride', thumbnail: 'https://cf.geekdo-images.com/ZWJg0dCdrWHxVnc0eFXK8w__thumb/img/x0ULrqMnza5GNSMK1MqTqzWlMcQ=/fit-in/200x150/filters:strip_icc()/pic38668.jpg' },
  dateTime: d(2),
  players: [HOST, PLAYERS[4], PLAYERS[5], ...PLAYERS.slice(0, 3)],
  playerUids: [HOST.id, ...PLAYERS.map(p => p.id)],
  maxPlayers: 6,
})

const evPrivate: GameEvent = event({
  id: 'ev-private',
  boardGame: { bggId: '68448', name: 'Dominion', thumbnail: 'https://cf.geekdo-images.com/j6iQpZ4XkemZP07BNWT3dA__thumb/img/O3pBOPVwMJX5V3GmjUAUtLn1kDs=/fit-in/200x150/filters:strip_icc()/pic394356.jpg' },
  dateTime: d(4),
  type: 'private',
  description: 'Private game night for close friends.',
  players: [HOST, PLAYERS[0], PLAYERS[2]],
  playerUids: [HOST.id, PLAYERS[0].id, PLAYERS[2].id],
})

const evOngoing: GameEvent = event({
  id: 'ev-ongoing',
  boardGame: { bggId: '167791', name: 'Terraforming Mars', thumbnail: 'https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__thumb/img/BTi6mJHlrChFcHAFBxpL9BQBZCY=/fit-in/200x150/filters:strip_icc()/pic3536616.jpg' },
  dateTime: h(-1),
  endDateTime: h(3),
  players: [HOST, PLAYERS[0], PLAYERS[1], PLAYERS[2]],
  playerUids: [HOST.id, PLAYERS[0].id, PLAYERS[1].id, PLAYERS[2].id],
})

const evNoThumbnail: GameEvent = event({
  id: 'ev-no-thumb',
  boardGame: { bggId: '99999', name: 'Homebrew Dungeon Crawl' },
  dateTime: d(6),
  description: 'Custom game, no thumbnail available. Tests the placeholder.',
  players: [HOST],
  playerUids: [HOST.id],
  maxPlayers: 8,
})

const evFullRoom: GameEvent = event({
  id: 'ev-full',
  boardGame: { bggId: '161936', name: 'Pandemic Legacy: Season 1', thumbnail: 'https://cf.geekdo-images.com/MHT7YKDnPasMcxEsHCkMEw__thumb/img/I5z2J-wU3bSQWuBgWBDOxP_NDDE=/fit-in/200x150/filters:strip_icc()/pic2452831.jpg' },
  dateTime: d(7),
  maxPlayers: 4,
  players: [HOST, PLAYERS[0], PLAYERS[1], PLAYERS[2]],
  playerUids: [HOST.id, PLAYERS[0].id, PLAYERS[1].id, PLAYERS[2].id],
})

const evManyPlayers: GameEvent = event({
  id: 'ev-many',
  boardGame: { bggId: '110', name: 'Bang!', thumbnail: 'https://cf.geekdo-images.com/8bk39pBKhE6mmwbvMhOaAQ__thumb/img/Kk2zMKYY4u68pGlDq0dVfzXNEWQ=/fit-in/200x150/filters:strip_icc()/pic1840924.jpg' },
  dateTime: d(9),
  maxPlayers: 8,
  players: [HOST, ...PLAYERS],
  playerUids: [HOST.id, ...PLAYERS.map(p => p.id)],
  description: 'The more the merrier! Overflow count should show.',
})

const evCancelled: GameEvent = event({
  id: 'ev-cancelled',
  boardGame: { bggId: '174430', name: 'Gloomhaven', thumbnail: 'https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__thumb/img/veqFeP4d_3zNiNDzMonADkMCGHQ=/fit-in/200x150/filters:strip_icc()/pic2437871.jpg' },
  dateTime: d(10),
  status: 'cancelled',
  players: [HOST, PLAYERS[0]],
  playerUids: [HOST.id, PLAYERS[0].id],
})

// ─── Mock friends ─────────────────────────────────────────────────────────────

export const MOCK_STORY_FRIENDS: FriendDisplayItem[] = [
  // 1. FIRST in list — no prev card on desktop
  {
    uid: 'friend-multi-3',
    name: 'Pedro Almeida',
    photo: 'https://i.pravatar.cc/150?u=pedro',
    activity: 'upcoming',
    events: [evCatan1, evCatan2, evCatan3], // 3 events → tests full dot navigation
  },

  // 2. One public upcoming event
  {
    uid: 'friend-single-public',
    name: 'Juliana Ramos',
    photo: 'https://i.pravatar.cc/150?u=jul',
    activity: 'upcoming',
    events: [evPandemic],
  },

  // 3. Two upcoming events (2 dots)
  {
    uid: 'friend-multi-2',
    name: 'Thiago Barros',
    photo: 'https://i.pravatar.cc/150?u=thiago',
    activity: 'upcoming',
    events: [evTicketToRide, evCatan2],
  },

  // 4. Ongoing event (green border, "playing now")
  {
    uid: 'friend-ongoing',
    name: 'Fernanda Costa',
    photo: 'https://i.pravatar.cc/150?u=fernanda',
    activity: 'ongoing',
    events: [evOngoing],
  },

  // 5. Private event (green border, lock badge inside story)
  {
    uid: 'friend-private',
    name: 'Gustavo Leal',
    photo: 'https://i.pravatar.cc/150?u=gus',
    activity: 'upcoming_private',
    events: [evPrivate],
  },

  // 6. No avatar photo — tests initial fallback
  {
    uid: 'friend-no-photo',
    name: 'Valentina Ximenes',
    photo: undefined,
    activity: 'upcoming',
    events: [evCatan1],
  },

  // 7. Event with no thumbnail — tests image placeholder
  {
    uid: 'friend-no-thumb',
    name: 'Bruno Salave\'a',
    photo: 'https://i.pravatar.cc/150?u=bruno',
    activity: 'upcoming',
    events: [evNoThumbnail],
  },

  // 8. Full event (no spots left)
  {
    uid: 'friend-full-room',
    name: 'Carla Weidmann',
    photo: 'https://i.pravatar.cc/150?u=carla',
    activity: 'upcoming',
    events: [evFullRoom],
  },

  // 9. Many players — tests overflow count (+N)
  {
    uid: 'friend-many-players',
    name: 'Diego Okonkwo',
    photo: 'https://i.pravatar.cc/150?u=diego',
    activity: 'upcoming',
    events: [evManyPlayers],
  },

  // 10. Cancelled event — tests error/cancelled status style
  {
    uid: 'friend-cancelled',
    name: 'Ingrid Nakamura',
    photo: 'https://i.pravatar.cc/150?u=ingrid',
    activity: 'upcoming',
    events: [evCancelled],
  },

  // 11. Very long name — tests truncation everywhere
  {
    uid: 'friend-long-name',
    name: 'Bartholomew Alexandros Konstantinidis',
    photo: 'https://i.pravatar.cc/150?u=bart',
    activity: 'upcoming',
    events: [evTicketToRide],
  },

  // 12. LAST in list — no next card on desktop; tapping right → closes overlay
  {
    uid: 'friend-last',
    name: 'Zoe Park',
    photo: 'https://i.pravatar.cc/150?u=zoe',
    activity: 'upcoming',
    events: [evCatan1, evPandemic],
  },
]
