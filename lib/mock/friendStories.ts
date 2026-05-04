/**
 * Mock data for testing the Friends Activity story overlay.
 * Use at /dev/stories — never imported in production code.
 */
import type { FriendDisplayItem, GameTable, Recap } from '@/types'

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

function table(overrides: Partial<GameTable> & Pick<GameTable, 'id' | 'boardGame' | 'dateTime'>): GameTable {
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

// ─── Mock tables ─────────────────────────────────────────────────────────────

const evCatan1: GameTable = table({
  id: 'ev-catan-1',
  boardGame: { bggId: '13', name: 'Catan', thumbnail: 'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__thumb/img/8a9HeqFydO7C5BNMjhkFpCFNbFc=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg' },
  dateTime: d(1),
  description: 'Weekly Catan night! Bring snacks.',
  players: [HOST, PLAYERS[0], PLAYERS[1]],
  playerUids: [HOST.id, PLAYERS[0].id, PLAYERS[1].id],
})

const evCatan2: GameTable = table({
  id: 'ev-catan-2',
  boardGame: { bggId: '13', name: 'Catan', thumbnail: 'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__thumb/img/8a9HeqFydO7C5BNMjhkFpCFNbFc=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg' },
  dateTime: d(5),
  addressLabel: 'Bar da Vila',
  address: 'Bar da Vila, Av. Paulista 1200, São Paulo',
  players: [HOST, PLAYERS[2], PLAYERS[3], PLAYERS[4]],
  playerUids: [HOST.id, PLAYERS[2].id, PLAYERS[3].id, PLAYERS[4].id],
})

const evCatan3: GameTable = table({
  id: 'ev-catan-3',
  boardGame: { bggId: '13', name: 'Catan: Seafarers', thumbnail: 'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__thumb/img/8a9HeqFydO7C5BNMjhkFpCFNbFc=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg' },
  dateTime: d(12),
  description: 'Seafarers expansion — first time trying it!',
  maxPlayers: 4,
  players: [HOST, PLAYERS[0]],
  playerUids: [HOST.id, PLAYERS[0].id],
})

const evPandemic: GameTable = table({
  id: 'ev-pandemic',
  boardGame: { bggId: '30549', name: 'Pandemic', thumbnail: 'https://cf.geekdo-images.com/S3ybV1LAp-8SnHIXLLjVqA__thumb/img/B9J0U0fX5BUgJjPNOa07MXCgYwM=/fit-in/200x150/filters:strip_icc()/pic1534148.jpg' },
  dateTime: d(3),
  description: 'Co-op night. Can we save the world?',
  maxPlayers: 4,
  players: [HOST, PLAYERS[1], PLAYERS[2], PLAYERS[3]],
  playerUids: [HOST.id, PLAYERS[1].id, PLAYERS[2].id, PLAYERS[3].id],
})

const evTicketToRide: GameTable = table({
  id: 'ev-ttr',
  boardGame: { bggId: '9209', name: 'Ticket to Ride', thumbnail: 'https://cf.geekdo-images.com/ZWJg0dCdrWHxVnc0eFXK8w__thumb/img/x0ULrqMnza5GNSMK1MqTqzWlMcQ=/fit-in/200x150/filters:strip_icc()/pic38668.jpg' },
  dateTime: d(2),
  players: [HOST, PLAYERS[4], PLAYERS[5], ...PLAYERS.slice(0, 3)],
  playerUids: [HOST.id, ...PLAYERS.map(p => p.id)],
  maxPlayers: 6,
})

const evPrivate: GameTable = table({
  id: 'ev-private',
  boardGame: { bggId: '68448', name: 'Dominion', thumbnail: 'https://cf.geekdo-images.com/j6iQpZ4XkemZP07BNWT3dA__thumb/img/O3pBOPVwMJX5V3GmjUAUtLn1kDs=/fit-in/200x150/filters:strip_icc()/pic394356.jpg' },
  dateTime: d(4),
  type: 'private',
  description: 'Private game night for close friends.',
  players: [HOST, PLAYERS[0], PLAYERS[2]],
  playerUids: [HOST.id, PLAYERS[0].id, PLAYERS[2].id],
})

const evOngoing: GameTable = table({
  id: 'ev-ongoing',
  boardGame: { bggId: '167791', name: 'Terraforming Mars', thumbnail: 'https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__thumb/img/BTi6mJHlrChFcHAFBxpL9BQBZCY=/fit-in/200x150/filters:strip_icc()/pic3536616.jpg' },
  dateTime: h(-1),
  endDateTime: h(3),
  players: [HOST, PLAYERS[0], PLAYERS[1], PLAYERS[2]],
  playerUids: [HOST.id, PLAYERS[0].id, PLAYERS[1].id, PLAYERS[2].id],
})

const evNoThumbnail: GameTable = table({
  id: 'ev-no-thumb',
  boardGame: { bggId: '99999', name: 'Homebrew Dungeon Crawl' },
  dateTime: d(6),
  description: 'Custom game, no thumbnail available. Tests the placeholder.',
  players: [HOST],
  playerUids: [HOST.id],
  maxPlayers: 8,
})

const evFullRoom: GameTable = table({
  id: 'ev-full',
  boardGame: { bggId: '161936', name: 'Pandemic Legacy: Season 1', thumbnail: 'https://cf.geekdo-images.com/MHT7YKDnPasMcxEsHCkMEw__thumb/img/I5z2J-wU3bSQWuBgWBDOxP_NDDE=/fit-in/200x150/filters:strip_icc()/pic2452831.jpg' },
  dateTime: d(7),
  maxPlayers: 4,
  players: [HOST, PLAYERS[0], PLAYERS[1], PLAYERS[2]],
  playerUids: [HOST.id, PLAYERS[0].id, PLAYERS[1].id, PLAYERS[2].id],
})

const evManyPlayers: GameTable = table({
  id: 'ev-many',
  boardGame: { bggId: '110', name: 'Bang!', thumbnail: 'https://cf.geekdo-images.com/8bk39pBKhE6mmwbvMhOaAQ__thumb/img/Kk2zMKYY4u68pGlDq0dVfzXNEWQ=/fit-in/200x150/filters:strip_icc()/pic1840924.jpg' },
  dateTime: d(9),
  maxPlayers: 8,
  players: [HOST, ...PLAYERS],
  playerUids: [HOST.id, ...PLAYERS.map(p => p.id)],
  description: 'The more the merrier! Overflow count should show.',
})

const evCancelled: GameTable = table({
  id: 'ev-cancelled',
  boardGame: { bggId: '174430', name: 'Gloomhaven', thumbnail: 'https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__thumb/img/veqFeP4d_3zNiNDzMonADkMCGHQ=/fit-in/200x150/filters:strip_icc()/pic2437871.jpg' },
  dateTime: d(10),
  status: 'cancelled',
  players: [HOST, PLAYERS[0]],
  playerUids: [HOST.id, PLAYERS[0].id],
})

// ── Border case tables ─────────────────────────────────────────────────────────

// Weekday label: 4 days out → should show e.g. "Thursday", not "Today"/"Tomorrow"
const evWeekday: GameTable = table({
  id: 'ev-weekday',
  boardGame: { bggId: '169786', name: 'Scythe', thumbnail: 'https://cf.geekdo-images.com/7k_nOxpO9OGIjhLq2BvynA__thumb/img/5Gx1VbyNSFivIhXB-T6KJhZF3Hk=/fit-in/200x150/filters:strip_icc()/pic3163924.jpg' },
  dateTime: d(4),
  players: [HOST, PLAYERS[0], PLAYERS[1]],
  playerUids: [HOST.id, PLAYERS[0].id, PLAYERS[1].id],
})

// No address: both address and addressLabel are empty → location row must be hidden
const evNoAddress: GameTable = table({
  id: 'ev-no-address',
  boardGame: { bggId: '167791', name: 'Terraforming Mars', thumbnail: 'https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__thumb/img/BTi6mJHlrChFcHAFBxpL9BQBZCY=/fit-in/200x150/filters:strip_icc()/pic3536616.jpg' },
  dateTime: d(6),
  address: '',
  addressLabel: '',
  description: 'TBD venue — will share location closer to the date.',
  players: [HOST, PLAYERS[2]],
  playerUids: [HOST.id, PLAYERS[2].id],
})

// Far-future date: 21 days out → should show "Month Day" format (e.g. "May 12")
const evFarFuture: GameTable = table({
  id: 'ev-far-future',
  boardGame: { bggId: '266192', name: 'Wingspan', thumbnail: 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__thumb/img/SaOFQmGEgFVBiCRQVBDUTpjH4WU=/fit-in/200x150/filters:strip_icc()/pic4458123.jpg' },
  dateTime: d(21),
  players: [HOST, PLAYERS[1]],
  playerUids: [HOST.id, PLAYERS[1].id],
})

// Azul for Maya's 5th table slot
const evAzul: GameTable = table({
  id: 'ev-azul',
  boardGame: { bggId: '230802', name: 'Azul', thumbnail: 'https://cf.geekdo-images.com/aPSHJO0d0XOpQR5X-wJonw__thumb/img/mGzMjIDKwxST-Q5bNWRKWHD4JZA=/fit-in/200x150/filters:strip_icc()/pic3718275.jpg' },
  dateTime: d(14),
  maxPlayers: 4,
  players: [HOST, PLAYERS[3]],
  playerUids: [HOST.id, PLAYERS[3].id],
})

// ─── Mock friends ─────────────────────────────────────────────────────────────

export const MOCK_STORY_FRIENDS: FriendDisplayItem[] = [
  // 1. FIRST in list — no prev card on desktop
  {
    uid: 'friend-multi-3',
    name: 'Pedro Almeida',
    photo: 'https://i.pravatar.cc/150?u=pedro',
    activity: 'upcoming',
    tables: [evCatan1, evCatan2, evCatan3], // 3 tables → tests full dot navigation
  },

  // 2. One public upcoming table
  {
    uid: 'friend-single-public',
    name: 'Juliana Ramos',
    photo: 'https://i.pravatar.cc/150?u=jul',
    activity: 'upcoming',
    tables: [evPandemic],
  },

  // 3. Two upcoming tables (2 dots)
  {
    uid: 'friend-multi-2',
    name: 'Thiago Barros',
    photo: 'https://i.pravatar.cc/150?u=thiago',
    activity: 'upcoming',
    tables: [evTicketToRide, evCatan2],
  },

  // 4. Ongoing table (green border, "playing now")
  {
    uid: 'friend-ongoing',
    name: 'Fernanda Costa',
    photo: 'https://i.pravatar.cc/150?u=fernanda',
    activity: 'ongoing',
    tables: [evOngoing],
  },

  // 5. Private table (green border, lock badge inside story)
  {
    uid: 'friend-private',
    name: 'Gustavo Leal',
    photo: 'https://i.pravatar.cc/150?u=gus',
    activity: 'upcoming_private',
    tables: [evPrivate],
  },

  // 6. No avatar photo — tests initial fallback
  {
    uid: 'friend-no-photo',
    name: 'Valentina Ximenes',
    photo: undefined,
    activity: 'upcoming',
    tables: [evCatan1],
  },

  // 7. Table with no thumbnail — tests image placeholder
  {
    uid: 'friend-no-thumb',
    name: 'Bruno Salave\'a',
    photo: 'https://i.pravatar.cc/150?u=bruno',
    activity: 'upcoming',
    tables: [evNoThumbnail],
  },

  // 8. Full table (no spots left)
  {
    uid: 'friend-full-room',
    name: 'Carla Weidmann',
    photo: 'https://i.pravatar.cc/150?u=carla',
    activity: 'upcoming',
    tables: [evFullRoom],
  },

  // 9. Many players — tests overflow count (+N)
  {
    uid: 'friend-many-players',
    name: 'Diego Okonkwo',
    photo: 'https://i.pravatar.cc/150?u=diego',
    activity: 'upcoming',
    tables: [evManyPlayers],
  },

  // 10. Cancelled table — tests error/cancelled status style
  {
    uid: 'friend-cancelled',
    name: 'Ingrid Nakamura',
    photo: 'https://i.pravatar.cc/150?u=ingrid',
    activity: 'upcoming',
    tables: [evCancelled],
  },

  // 11. Very long name — tests truncation everywhere
  {
    uid: 'friend-long-name',
    name: 'Bartholomew Alexandros Konstantinidis',
    photo: 'https://i.pravatar.cc/150?u=bart',
    activity: 'upcoming',
    tables: [evTicketToRide],
  },

  // 12. LAST upcoming — no next card on desktop; tapping right → closes overlay
  {
    uid: 'friend-last',
    name: 'Zoe Park',
    photo: 'https://i.pravatar.cc/150?u=zoe',
    activity: 'upcoming',
    tables: [evCatan1, evPandemic],
  },

  // 13. Recap — full data: winner + note + thumbnail
  {
    uid: 'friend-recap-full',
    name: 'Mariana Fonseca',
    photo: 'https://i.pravatar.cc/150?u=mari',
    activity: 'recap',
    tables: [],
    recap: {
      id: 'recap-full',
      tableId: 'ev-catan-1',
      hostUid: 'friend-recap-full',
      hostName: 'Mariana Fonseca',
      hostPhoto: 'https://i.pravatar.cc/150?u=mari',
      game: {
        bggId: '13',
        name: 'Catan',
        thumbnail: 'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__thumb/img/8a9HeqFydO7C5BNMjhkFpCFNbFc=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg',
      },
      winner: 'Mariana Fonseca',
      note: 'Epic comeback from last place — monopolized the wheat port and nobody saw it coming. Best Catan session in months!',
      playerCount: 4,
      createdAt: h(-3), // 3 hours ago — within 24h window
    } satisfies Recap,
  },

  // 14. Recap — no winner, has note
  {
    uid: 'friend-recap-no-winner',
    name: 'Rafael Duarte',
    photo: 'https://i.pravatar.cc/150?u=rafa',
    activity: 'recap',
    tables: [],
    recap: {
      id: 'recap-no-winner',
      tableId: 'ev-pandemic',
      hostUid: 'friend-recap-no-winner',
      hostName: 'Rafael Duarte',
      hostPhoto: 'https://i.pravatar.cc/150?u=rafa',
      game: {
        bggId: '30549',
        name: 'Pandemic',
        thumbnail: 'https://cf.geekdo-images.com/S3ybV1LAp-8SnHIXLLjVqA__thumb/img/B9J0U0fX5BUgJjPNOa07MXCgYwM=/fit-in/200x150/filters:strip_icc()/pic1534148.jpg',
      },
      note: 'We almost saved humanity… almost. Three cures found, fourth was one card away. Great co-op session!',
      playerCount: 3,
      createdAt: h(-8), // 8 hours ago
    } satisfies Recap,
  },

  // 15. Recap — no thumbnail, no note (minimal data border case)
  {
    uid: 'friend-recap-minimal',
    name: 'Siosaia Taufa',
    photo: 'https://i.pravatar.cc/150?u=sio',
    activity: 'recap',
    tables: [],
    recap: {
      id: 'recap-minimal',
      tableId: 'ev-no-thumb',
      hostUid: 'friend-recap-minimal',
      hostName: 'Siosaia Taufa',
      hostPhoto: 'https://i.pravatar.cc/150?u=sio',
      game: {
        bggId: '99999',
        name: 'Homebrew Dungeon Crawl',
        thumbnail: '', // no thumbnail — tests placeholder in RecapStoryCard
      },
      note: '',        // no note — tests empty note branch
      playerCount: 2,
      createdAt: h(-1), // 1 hour ago
    } satisfies Recap,
  },

  // ── Extended border cases ──────────────────────────────────────────────────

  // 16. Weekday date label — table 4 days out → shows e.g. "Thursday"
  {
    uid: 'friend-weekday',
    name: 'Henry Osei',
    photo: 'https://i.pravatar.cc/150?u=henry',
    activity: 'upcoming',
    tables: [evWeekday],
  },

  // 17. No address — location row must be hidden (both fields empty)
  {
    uid: 'friend-no-address',
    name: 'Noah Ferreira',
    photo: 'https://i.pravatar.cc/150?u=noah2',
    activity: 'upcoming',
    tables: [evNoAddress],
  },

  // 18. 5 upcoming tables — 5-dot progress bar, full navigation stress test
  {
    uid: 'friend-5-tables',
    name: 'Maya Ortega',
    photo: 'https://i.pravatar.cc/150?u=maya2',
    activity: 'upcoming',
    tables: [evCatan1, evPandemic, evTicketToRide, evWeekday, evAzul],
  },

  // 19. Far-future date — 21 days out → "Month Day" label (e.g. "May 12")
  {
    uid: 'friend-far-future',
    name: 'Olivia Park',
    photo: 'https://i.pravatar.cc/150?u=olivia2',
    activity: 'upcoming',
    tables: [evFarFuture],
  },

  // 20. Upcoming + recent recap — activity stays 'upcoming'; recap field present but unused
  {
    uid: 'friend-upcoming-recap',
    name: 'Peter Walsh',
    photo: 'https://i.pravatar.cc/150?u=peter2',
    activity: 'upcoming',
    tables: [evCatan2],
    recap: {
      id: 'recap-peter',
      tableId: 'ev-catan-1',
      hostUid: 'friend-upcoming-recap',
      hostName: 'Peter Walsh',
      hostPhoto: 'https://i.pravatar.cc/150?u=peter2',
      game: {
        bggId: '68448',
        name: '7 Wonders',
        thumbnail: 'https://cf.geekdo-images.com/RvFVTEpnbb4NM7k0IF8V7A__thumb/img/sGYFMGCl-4s3oMoEBDDPJ-2J4BM=/fit-in/200x150/filters:strip_icc()/pic860217.jpg',
      },
      note: 'Seven Wonders with 5 players — incredible session.',
      winner: 'Peter Walsh',
      playerCount: 5,
      createdAt: h(-4), // fresh recap but upcoming table takes priority
    } satisfies Recap,
  },

  // 21. Stale recap (26 h ago) — in production this friend would be HIDDEN (>24h cutoff);
  //     visible here in /dev to verify the RecapStoryCard UI still renders correctly
  {
    uid: 'friend-recap-stale',
    name: 'Kate Müller',
    photo: 'https://i.pravatar.cc/150?u=kate2',
    activity: 'recap',
    tables: [],
    recap: {
      id: 'recap-stale',
      tableId: 'ev-catan-2',
      hostUid: 'friend-recap-stale',
      hostName: 'Kate Müller',
      hostPhoto: 'https://i.pravatar.cc/150?u=kate2',
      game: {
        bggId: '13',
        name: 'Catan',
        thumbnail: 'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__thumb/img/8a9HeqFydO7C5BNMjhkFpCFNbFc=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg',
      },
      note: 'Close game, came down to 2 points.',
      winner: 'Kate Müller',
      playerCount: 3,
      createdAt: h(-26), // 26h ago — OLDER than 24h cutoff → hidden in real app
    } satisfies Recap,
  },

  // 22. No profile photo (host) — avatar letter fallback in bubble AND story card header
  {
    uid: 'friend-no-photo-host',
    name: 'Yuki',
    photo: undefined, // no photo → initial letter fallback
    activity: 'upcoming',
    tables: [evPandemic],
  },
]
