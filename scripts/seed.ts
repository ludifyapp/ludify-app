// scripts/seed.ts
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { randomUUID } from 'crypto'
import { geohashForLocation } from 'geofire-common'

// Load .env.local
;(function loadEnv() {
  try {
    const txt = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([^#=][^=]*?)\s*=\s*(.*?)\s*$/)
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch { /* no .env.local */ }
})()

const app = getApps().length === 0
  ? initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS!) })
  : getApps()[0]

const adminAuth = getAuth(app)
const db = getFirestore(app)

// ── Data ──────────────────────────────────────────────────────────────────────

export const SEED_USERS = [
  { uid: 'seed_u_01', name: 'Alice Chen',     email: 'alice@gamenight.test',   bg: 'b6e3f4' },
  { uid: 'seed_u_02', name: 'Bob Martinez',   email: 'bob@gamenight.test',     bg: 'c0aede' },
  { uid: 'seed_u_03', name: 'Carol Johnson',  email: 'carol@gamenight.test',   bg: 'd1d4f9' },
  { uid: 'seed_u_04', name: 'David Kim',      email: 'david@gamenight.test',   bg: 'ffd5dc' },
  { uid: 'seed_u_05', name: 'Emma Wilson',    email: 'emma@gamenight.test',    bg: 'ffdfbf' },
  { uid: 'seed_u_06', name: 'Frank Davis',    email: 'frank@gamenight.test',   bg: 'b6e3f4' },
  { uid: 'seed_u_07', name: 'Grace Lee',      email: 'grace@gamenight.test',   bg: 'c0aede' },
  { uid: 'seed_u_08', name: 'Henry Brown',    email: 'henry@gamenight.test',   bg: 'd1d4f9' },
  { uid: 'seed_u_09', name: 'Iris Taylor',    email: 'iris@gamenight.test',    bg: 'ffd5dc' },
  { uid: 'seed_u_10', name: 'Jack Anderson',  email: 'jack@gamenight.test',    bg: 'ffdfbf' },
  { uid: 'seed_u_11', name: 'Kate Thomas',    email: 'kate@gamenight.test',    bg: 'b6e3f4' },
  { uid: 'seed_u_12', name: 'Leo Garcia',     email: 'leo@gamenight.test',     bg: 'c0aede' },
  { uid: 'seed_u_13', name: 'Maya Robinson',  email: 'maya@gamenight.test',    bg: 'd1d4f9' },
  { uid: 'seed_u_14', name: 'Noah Clark',     email: 'noah@gamenight.test',    bg: 'ffd5dc' },
  { uid: 'seed_u_15', name: 'Olivia White',   email: 'olivia@gamenight.test',  bg: 'ffdfbf' },
  { uid: 'seed_u_16', name: 'Peter Lewis',    email: 'peter@gamenight.test',   bg: 'b6e3f4' },
  { uid: 'seed_u_17', name: 'Quinn Hall',     email: 'quinn@gamenight.test',   bg: 'c0aede' },
  { uid: 'seed_u_18', name: 'Rose Allen',     email: 'rose@gamenight.test',    bg: 'd1d4f9' },
  { uid: 'seed_u_19', name: 'Sam Young',      email: 'sam@gamenight.test',     bg: 'ffd5dc' },
  { uid: 'seed_u_20', name: 'Tina Walker',    email: 'tina@gamenight.test',    bg: 'ffdfbf' },
] as const

const GAMES = [
  { name: 'Catan',                          min: 3, max: 4 },
  { name: 'Ticket to Ride',                 min: 2, max: 5 },
  { name: 'Pandemic',                       min: 2, max: 4 },
  { name: 'Wingspan',                       min: 1, max: 5 },
  { name: 'Azul',                           min: 2, max: 4 },
  { name: 'Codenames',                      min: 4, max: 8 },
  { name: '7 Wonders',                      min: 2, max: 7 },
  { name: 'Terraforming Mars',              min: 1, max: 5 },
  { name: 'Dominion',                       min: 2, max: 4 },
  { name: 'Spirit Island',                  min: 1, max: 4 },
  { name: 'Root',                           min: 2, max: 4 },
  { name: 'Viticulture',                    min: 2, max: 6 },
  { name: 'Gloomhaven',                     min: 1, max: 4 },
  { name: 'Scythe',                         min: 1, max: 5 },
  { name: 'Sheriff of Nottingham',          min: 3, max: 5 },
  { name: 'Dixit',                          min: 3, max: 6 },
  { name: 'Splendor',                       min: 2, max: 4 },
  { name: 'Arkham Horror',                  min: 1, max: 8 },
  { name: 'Power Grid',                     min: 2, max: 6 },
  { name: 'Betrayal at House on the Hill',  min: 3, max: 6 },
]

const VENUES = [
  { label: 'Board Game Cafe SF',   address: '123 Mission St, San Francisco, CA 94103' },
  { label: 'The Dice Den',         address: '456 Broadway, New York, NY 10013' },
  { label: 'Meeple House',         address: '789 N Michigan Ave, Chicago, IL 60611' },
  { label: 'Game On Lounge',       address: '321 6th St, Austin, TX 78701' },
  { label: 'Card Kingdom',         address: '654 Pine St, Seattle, WA 98101' },
  { label: 'Tabletop LA',          address: '987 Sunset Blvd, Los Angeles, CA 90028' },
  { label: 'Player One Boston',    address: '147 Newbury St, Boston, MA 02116' },
  { label: 'Roll for Fun Denver',  address: '258 16th St Mall, Denver, CO 80202' },
  { label: 'Geek Chic Portland',   address: '369 NW 23rd Ave, Portland, OR 97210' },
  { label: 'Game Theory Miami',    address: '741 Lincoln Rd, Miami Beach, FL 33139' },
]

const DESCRIPTIONS = [
  'All skill levels welcome! I have the base game and several expansions.',
  'Casual evening — pizza will be provided. Bring drinks!',
  'Experienced players only. We play fast and competitive.',
  'Great for beginners. I will walk everyone through the rules.',
  'Monthly game night series — regulars always welcome back!',
  "New to this game myself, let's learn together!",
  'Bringing all my expansions. Snacks provided.',
  'Quiet focused session, no distractions.',
]

const BIOS = [
  'Euro gamer obsessed with engine builders. Host biweekly game nights.',
  'Cooperative games are my jam — Pandemic, Spirit Island, Gloomhaven. Always teaching newbies.',
  'Casual player who loves anything with beautiful art. Wingspan convert for life.',
  'Competitive through and through. Scythe and Terraforming Mars specialist.',
  'Board game café regular. Trying to work through my shelf of shame.',
  'Party game champion — Codenames, Dixit, Sheriff of Nottingham. The louder the better.',
  'Strategy gamer who somehow ends up losing to newcomers every time.',
  'Solo gamer who finally discovered how fun playing with humans is.',
  'Organizer of the Tuesday Night Tabletop crew. 50+ games and counting.',
  'Collector first, player second. My collection is my prized possession.',
  'New to the hobby — got into it this year and already have 20 games.',
  'Card game addict. Dominion, 7 Wonders, anything with drafting mechanics.',
  'Area control evangelist. If it has territories I am in.',
  'Teach-at-the-table type. Rules lawyer by reputation, hugger by heart.',
  'Designer wannabe. Currently playtesting my first prototype.',
  'I only play games that fit in a tote bag. Portability is key.',
  'Wargamer crossing over into modern euros. Still learning the lingo.',
  'Heavy game devotee. Gloomhaven campaigns are my cardio.',
  'Mix of casual and competitive depending on the crowd. Flexible player.',
  'Looking for a regular group — moved to the city last year. Let\'s play!',
]

// Skill level for each seed user (index-aligned to SEED_USERS)
const SKILL_LEVELS = [
  'casual',       // Alice
  'intermediate', // Bob
  'hardcore',     // Carol
  'intermediate', // David
  'casual',       // Emma
  'hardcore',     // Frank
  'casual',       // Grace
  'intermediate', // Henry
  'casual',       // Iris
  'hardcore',     // Jack
  'intermediate', // Kate
  'casual',       // Leo
  'intermediate', // Maya
  'hardcore',     // Noah
  'casual',       // Olivia
  'intermediate', // Peter
  'hardcore',     // Quinn
  'casual',       // Rose
  'intermediate', // Sam
  'hardcore',     // Tina
] as const

// Realistic city coords — clustered so NearbyPlayers returns results
// 6 users per city cluster; slight jitter within ~5km of center
const GEO_CLUSTERS = [
  // San Francisco cluster (users 0-5)
  { lat: 37.78, lng: -122.42 },
  { lat: 37.77, lng: -122.43 },
  { lat: 37.79, lng: -122.41 },
  { lat: 37.76, lng: -122.44 },
  { lat: 37.80, lng: -122.40 },
  { lat: 37.77, lng: -122.45 },
  // New York cluster (users 6-11)
  { lat: 40.72, lng: -74.01 },
  { lat: 40.73, lng: -73.99 },
  { lat: 40.71, lng: -74.00 },
  { lat: 40.74, lng: -74.02 },
  { lat: 40.72, lng: -73.98 },
  { lat: 40.70, lng: -74.01 },
  // Chicago cluster (users 12-15)
  { lat: 41.88, lng: -87.63 },
  { lat: 41.87, lng: -87.62 },
  { lat: 41.89, lng: -87.64 },
  { lat: 41.86, lng: -87.63 },
  // Austin cluster (users 16-17)
  { lat: 30.27, lng: -97.74 },
  { lat: 30.26, lng: -97.73 },
  // Seattle cluster (users 18-19)
  { lat: 47.61, lng: -122.33 },
  { lat: 47.60, lng: -122.34 },
]

// Host rating data per user (ratingTotal, ratingCount) → avg shown on public profile
// Indexes align to SEED_USERS; undefined means no ratings yet
const HOST_RATINGS: (readonly [number, number] | undefined)[] = [
  [23, 5],   // Alice:   4.6 avg
  [18, 4],   // Bob:     4.5 avg
  [14, 3],   // Carol:   4.7 avg
  [20, 5],   // David:   4.0 avg
  [17, 4],   // Emma:    4.3 avg
  [12, 3],   // Frank:   4.0 avg
  [25, 5],   // Grace:   5.0 avg
  undefined, // Henry:   no ratings
  [16, 4],   // Iris:    4.0 avg
  [14, 3],   // Jack:    4.7 avg
  undefined, // Kate:    no ratings
  [19, 4],   // Leo:     4.8 avg
  [10, 2],   // Maya:    5.0 avg
  undefined, // Noah:    no ratings
  [22, 5],   // Olivia:  4.4 avg
  [15, 3],   // Peter:   5.0 avg
  undefined, // Quinn:   no ratings
  [18, 4],   // Rose:    4.5 avg
  undefined, // Sam:     no ratings
  [21, 5],   // Tina:    4.2 avg
]

const COMMENT_TEXTS = [
  "Can't wait for this! 🎲",
  "Who's bringing snacks?",
  "I'll be a few minutes late, please don't start without me!",
  "Happy to teach anyone who's new to the game.",
  'Is parking easy around there?',
  'Should I bring any expansions?',
  'First time playing this — any tips?',
  'Bringing my lucky dice 🍀',
  'Looking forward to meeting everyone!',
  "I played this at a con last year, so much fun!",
  'Is this beginner friendly? Asking for a friend 😅',
  'I can bring extra chairs if needed.',
  "Super excited, I've been waiting for a chance to play this!",
  "Will there be house rules or straight from the rulebook?",
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function avatar(name: string, bg: string): string {
  return `https://api.dicebear.com/9.x/avataaars/png?seed=${name.split(' ')[0]}&backgroundColor=${bg}`
}

function dateAt(offsetDays: number, hour = 19): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

function addHours(iso: string, h: number): string {
  return new Date(new Date(iso).getTime() + h * 3_600_000).toISOString()
}

// ── Clear existing seed data ──────────────────────────────────────────────────

async function clearSeedData(): Promise<void> {
  console.log('  Clearing existing seed data...')
  const seedUids = SEED_USERS.map(u => u.uid)

  // Firestore 'in' supports up to 30 items; split into chunks of 10 to be safe
  const chunks: string[][] = []
  for (let i = 0; i < seedUids.length; i += 10) chunks.push(seedUids.slice(i, i + 10))

  let deletedEvents = 0
  for (const chunk of chunks) {
    const snap = await db.collection('events').where('hostUid', 'in', chunk).get()
    for (const doc of snap.docs) {
      const comments = await doc.ref.collection('comments').get()
      for (const c of comments.docs) await c.ref.delete()
      const messages = await doc.ref.collection('messages').get()
      for (const m of messages.docs) await m.ref.delete()
      await doc.ref.delete()
      deletedEvents++
    }
  }

  // Friendships
  let deletedFriendships = 0
  for (const chunk of chunks) {
    const snap = await db.collection('friendships').where('uids', 'array-contains-any', chunk).get()
    const batch = db.batch()
    snap.docs.forEach(d => batch.delete(d.ref))
    if (!snap.empty) await batch.commit()
    deletedFriendships += snap.size
  }

  // User docs (savedAddresses + bio)
  const userBatch = db.batch()
  for (const uid of seedUids) {
    userBatch.delete(db.collection('users').doc(uid))
  }
  await userBatch.commit()

  console.log(`  Cleared ${deletedEvents} events, ${deletedFriendships} friendships`)
}

// ── Create Firebase Auth users ────────────────────────────────────────────────

async function createUsers(): Promise<void> {
  console.log('  Creating 20 test users in Firebase Auth...')
  let created = 0, updated = 0

  for (const u of SEED_USERS) {
    const photo = avatar(u.name, u.bg)
    try {
      await adminAuth.createUser({
        uid: u.uid,
        displayName: u.name,
        email: u.email,
        password: 'Test1234!',
        photoURL: photo,
        emailVerified: true,
      })
      created++
    } catch (err: any) {
      if (err.code === 'auth/uid-already-exists' || err.code === 'auth/email-already-exists') {
        await adminAuth.updateUser(u.uid, { displayName: u.name, email: u.email, photoURL: photo })
        updated++
      } else {
        throw err
      }
    }
  }
  console.log(`  Auth users: ${created} created, ${updated} updated`)
}

// ── Create events ─────────────────────────────────────────────────────────────

interface EventConfig {
  days: number
  hour: number
  durationH: number
  cancelled: boolean
  type: 'public' | 'private'
  extraPlayers: number
  makeFull: boolean
  ongoing: boolean
  allowComments?: boolean
}

async function createEvents(): Promise<string[]> {
  console.log('  Creating 120 events...')
  const eventIds: string[] = []
  const batch = db.batch()

  for (let ui = 0; ui < SEED_USERS.length; ui++) {
    const host = SEED_USERS[ui]
    const photo = avatar(host.name, host.bg)

    // 6 events per user with varied scenarios
    const configs: EventConfig[] = [
      // 0: ended ~30 days ago
      { days: -30, hour: 19, durationH: 3, cancelled: false, type: 'public',  extraPlayers: 2, makeFull: false, ongoing: false },
      // 1: ended ~12 days ago
      { days: -12, hour: 19, durationH: 3, cancelled: false, type: 'public',  extraPlayers: 1, makeFull: false, ongoing: false },
      // 2: ongoing (first 5 users) or ended 5 days ago (rest)
      ui < 5
        ? { days: 0,   hour: 17, durationH: 4, cancelled: false, type: 'public',  extraPlayers: 2, makeFull: false, ongoing: true  }
        : { days: -5,  hour: 19, durationH: 3, cancelled: false, type: 'public',  extraPlayers: 1, makeFull: false, ongoing: false },
      // 3: future, varied (some private, some full)
      { days: 5 + ui,  hour: 18, durationH: 3, cancelled: false,
        type: ui % 5 === 0 ? 'private' : 'public',
        extraPlayers: 2, makeFull: ui % 6 === 0, ongoing: false },
      // 4: future ~14 days, some cancelled, half with comments disabled
      { days: 14 + ui, hour: 19, durationH: 0, cancelled: ui % 8 === 0, type: 'public', extraPlayers: 1, makeFull: false, ongoing: false, allowComments: ui % 2 !== 0 },
      // 5: future ~30-70 days
      { days: 30 + ui * 2, hour: 19, durationH: 4, cancelled: false, type: 'public', extraPlayers: 0, makeFull: false, ongoing: false },
    ]

    for (let ei = 0; ei < configs.length; ei++) {
      const cfg = configs[ei]
      const game = GAMES[(ui * 6 + ei) % GAMES.length]
      const venue = VENUES[(ui + ei) % VENUES.length]
      const desc = DESCRIPTIONS[(ui + ei) % DESCRIPTIONS.length]

      const startIso = cfg.ongoing
        ? new Date(Date.now() - 2 * 3_600_000).toISOString()
        : dateAt(cfg.days, cfg.hour)

      const endIso = cfg.durationH > 0 ? addHours(startIso, cfg.durationH) : undefined

      const maxP = Math.min(game.max, game.min + 2)
      const minP = game.min

      // Pick extra players deterministically (skip host)
      const extraIdxs: number[] = []
      for (let p = 0; p < cfg.extraPlayers && extraIdxs.length < maxP - 1; p++) {
        const idx = (ui + p + 1) % SEED_USERS.length
        extraIdxs.push(idx)
      }
      if (cfg.makeFull) {
        while (extraIdxs.length < maxP - 1) {
          const idx = (ui + extraIdxs.length + 1) % SEED_USERS.length
          if (!extraIdxs.includes(idx)) extraIdxs.push(idx)
        }
      }

      const joinedAt = startIso
      const playerUids = [host.uid, ...extraIdxs.map(i => SEED_USERS[i].uid)]
      const players = [
        { id: host.uid, name: host.name, isHost: true, joinedAt, photoURL: photo },
        ...extraIdxs.map(i => {
          const u = SEED_USERS[i]
          return { id: u.uid, name: u.name, isHost: false, joinedAt, photoURL: avatar(u.name, u.bg) }
        }),
      ]

      const ref = db.collection('events').doc()
      eventIds.push(ref.id)

      const lgMatch = LISTING_GAMES.find(lg => lg.name === game.name)
      batch.set(ref, {
        boardGame: { bggId: lgMatch?.bggId ?? '', name: game.name, thumbnail: lgMatch?.thumbnail ?? '' },
        description: desc,
        dateTime: startIso,
        ...(endIso && { endDateTime: endIso }),
        address: venue.address,
        addressLabel: venue.label,
        minPlayers: minP,
        maxPlayers: maxP,
        type: cfg.type,
        status: cfg.cancelled ? 'cancelled' : 'active',
        ...(cfg.allowComments === false && { allowComments: false }),
        hostUid: host.uid,
        playerUids,
        players,
        createdAt: dateAt(cfg.days - 7, 10),
      })
    }
  }

  await batch.commit()
  console.log(`  Created ${eventIds.length} events`)
  return eventIds
}

// ── Create friendships ────────────────────────────────────────────────────────

async function createFriendships(): Promise<void> {
  console.log('  Creating friendships...')
  const now = new Date().toISOString()

  const ACCEPTED: [number, number][] = [
    [0,1],[0,2],[0,3],[0,4],
    [1,5],[1,6],
    [2,7],[2,8],
    [3,9],[3,10],
    [4,11],[4,12],
    [5,13],[5,14],
    [6,15],[6,16],
    [7,17],[7,18],
    [8,19],
    [9,11],[10,12],[13,15],[14,16],[17,19],
  ]
  const PENDING: [number, number][] = [
    [2,10],[5,18],[11,17],
  ]

  const batch = db.batch()
  for (const [ai, bi] of ACCEPTED) {
    const a = SEED_USERS[ai], b = SEED_USERS[bi]
    const id = [a.uid, b.uid].sort().join('_')
    batch.set(db.collection('friendships').doc(id), {
      uids: [a.uid, b.uid].sort(),
      fromUid: a.uid, toUid: b.uid, status: 'accepted',
      fromName: a.name, fromPhoto: avatar(a.name, a.bg),
      toName: b.name, toPhoto: avatar(b.name, b.bg),
      createdAt: now, updatedAt: now,
    })
  }
  for (const [ai, bi] of PENDING) {
    const a = SEED_USERS[ai], b = SEED_USERS[bi]
    const id = [a.uid, b.uid].sort().join('_')
    batch.set(db.collection('friendships').doc(id), {
      uids: [a.uid, b.uid].sort(),
      fromUid: a.uid, toUid: b.uid, status: 'pending',
      fromName: a.name, fromPhoto: avatar(a.name, a.bg),
      toName: b.name, toPhoto: avatar(b.name, b.bg),
      createdAt: now, updatedAt: now,
    })
  }
  await batch.commit()
  console.log(`  Created ${ACCEPTED.length} accepted + ${PENDING.length} pending friendships`)
}

const EVENT_CHAT_TEXTS = [
  "I'm on my way, be there in 10!",
  'Should I bring anything?',
  'Running a bit late, please start without me.',
  "Who's winning so far? 😄",
  'Can someone explain the trade rules again?',
  "Great move! Didn't see that coming.",
  "I think I'm in last place already 😅",
  'This is so fun, we need to do this more often.',
  'Snacks are on the table, help yourselves!',
  'I call the blue pieces next time.',
]

// ── Create event chat messages ────────────────────────────────────────────────

async function createEventMessages(eventIds: string[]): Promise<void> {
  console.log('  Creating event chat messages...')
  let count = 0

  // Seed messages for: 5 ongoing events (slot 2, users 0-4) + 5 recent ended events (slot 1, users 0-4)
  const targetSlots = [
    ...Array.from({ length: 5 }, (_, ui) => ui * 6 + 2), // ongoing (users 0-4, slot 2)
    ...Array.from({ length: 5 }, (_, ui) => ui * 6 + 1), // recent ended (users 0-4, slot 1)
  ]

  for (let t = 0; t < targetSlots.length; t++) {
    const eventIdx = targetSlots[t]
    const eventId = eventIds[eventIdx]
    if (!eventId) continue

    const hostUser = SEED_USERS[Math.floor(eventIdx / 6)]
    const extraPlayerIdx = (Math.floor(eventIdx / 6) + 1) % SEED_USERS.length
    const extraUser = SEED_USERS[extraPlayerIdx]
    const senders = [hostUser, extraUser]

    const numMessages = 3 + (t % 3) // 3, 4, or 5 messages
    const baseTime = Date.now() - numMessages * 4 * 60_000

    const batch = db.batch()
    for (let mi = 0; mi < numMessages; mi++) {
      const sender = senders[mi % senders.length]
      const text = EVENT_CHAT_TEXTS[(t * 4 + mi) % EVENT_CHAT_TEXTS.length]
      const msgRef = db.collection('events').doc(eventId).collection('messages').doc()
      batch.set(msgRef, {
        uid: sender.uid,
        name: sender.name,
        photoURL: avatar(sender.name, sender.bg),
        text,
        createdAt: Timestamp.fromMillis(baseTime + mi * 4 * 60_000),
      })
      count++
    }
    await batch.commit()
  }

  console.log(`  Created ${count} event chat messages`)
}

// ── Create comments ───────────────────────────────────────────────────────────

async function createComments(eventIds: string[]): Promise<void> {
  console.log('  Creating comments...')
  let count = 0
  const targets = eventIds.slice(0, 25) // add comments to first 25 events

  for (let i = 0; i < targets.length; i++) {
    const eventId = targets[i]
    const numComments = 2 + (i % 2) // 2 or 3 comments per event
    for (let c = 0; c < numComments; c++) {
      const commenterIdx = (i + c + 1) % SEED_USERS.length
      const u = SEED_USERS[commenterIdx]
      const text = COMMENT_TEXTS[(i * 3 + c) % COMMENT_TEXTS.length]
      const msAgo = (targets.length - i + c) * 1_800_000 // stagger timestamps
      // Add reactions from a couple of other seed users on some comments
      const reactions: Record<string, string[]> = {}
      if (i % 3 !== 0) { // skip every 3rd event for variety
        const EMOJIS = ['👍', '❤️', '😂', '😮', '🎲']
        const emoji1 = EMOJIS[(i + c) % EMOJIS.length]
        const reactor1 = SEED_USERS[(commenterIdx + 2) % SEED_USERS.length].uid
        const reactor2 = SEED_USERS[(commenterIdx + 4) % SEED_USERS.length].uid
        reactions[emoji1] = [reactor1]
        if (c % 2 === 0) {
          const emoji2 = EMOJIS[(i + c + 2) % EMOJIS.length]
          if (emoji2 !== emoji1) reactions[emoji2] = [reactor2]
          else reactions[emoji1] = [reactor1, reactor2]
        }
      }
      await db.collection('events').doc(eventId).collection('comments').add({
        uid: u.uid,
        name: u.name,
        photoURL: avatar(u.name, u.bg),
        text,
        createdAt: Timestamp.fromMillis(Date.now() - msAgo),
        pinned: c === 0 && i % 4 === 0, // pin first comment on every 4th event
        ...(Object.keys(reactions).length > 0 && { reactions }),
      })
      count++
    }
  }
  console.log(`  Created ${count} comments`)
}

// ── Create saved addresses ────────────────────────────────────────────────────

async function createAddresses(): Promise<void> {
  console.log('  Creating saved addresses...')
  const batch = db.batch()
  let count = 0
  for (let i = 0; i < 10; i++) {
    const u = SEED_USERS[i]
    const saved = [
      { id: randomUUID(), label: VENUES[i % VENUES.length].label, address: VENUES[i % VENUES.length].address },
      { id: randomUUID(), label: VENUES[(i + 1) % VENUES.length].label, address: VENUES[(i + 1) % VENUES.length].address },
    ]
    batch.set(db.collection('users').doc(u.uid), { savedAddresses: saved }, { merge: true })
    count += 2
  }
  await batch.commit()
  console.log(`  Created ${count} saved addresses across 10 users`)
}

// ── Marketplace listings ──────────────────────────────────────────────────────

const LISTING_GAMES = [
  { name: 'Catan',                         bggId: '13', thumbnail: 'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__thumb/img/8a9HeqFydO7UnHRCRzgobFGtfr4=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg' },
  { name: 'Ticket to Ride',                bggId: '9209', thumbnail: 'https://cf.geekdo-images.com/ZWJg0dCdrWHxVnc0eFXK8w__thumb/img/a9x2BuFt-YFSv5bST7dqsWJAHiE=/fit-in/200x150/filters:strip_icc()/pic38668.jpg' },
  { name: 'Pandemic',                      bggId: '30549', thumbnail: 'https://cf.geekdo-images.com/S3oBBaslKDtmWcwmwi3DNQ__thumb/img/I9iHMrpAbmWVEP5Y8wh82XHuBUA=/fit-in/200x150/filters:strip_icc()/pic1534148.jpg' },
  { name: 'Wingspan',                      bggId: '266192', thumbnail: 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__thumb/img/SaOFQmGEgFVBiCRQVBDUTpjH4WU=/fit-in/200x150/filters:strip_icc()/pic4458123.jpg' },
  { name: 'Azul',                          bggId: '230802', thumbnail: 'https://cf.geekdo-images.com/aPSHJO0d0XOpQR5X-wJonw__thumb/img/mGzMjIDKwxST-Q5bNWRKWHD4JZA=/fit-in/200x150/filters:strip_icc()/pic3718275.jpg' },
  { name: 'Codenames',                     bggId: '178900', thumbnail: 'https://cf.geekdo-images.com/F_KDEu0GjdClml8N7c8Imw__thumb/img/fBT7FV9kMcQ7CX9Sb4FjHDGxqEA=/fit-in/200x150/filters:strip_icc()/pic2582929.jpg' },
  { name: '7 Wonders',                     bggId: '68448', thumbnail: 'https://cf.geekdo-images.com/RvFVTEpnbb4NM7k0IF8V7A__thumb/img/sGYFMGCl-4s3oMoEBDDPJ-2J4BM=/fit-in/200x150/filters:strip_icc()/pic860217.jpg' },
  { name: 'Terraforming Mars',             bggId: '167791', thumbnail: 'https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__thumb/img/BTxqxgYay5tHJfVoJ2NMQGwMkQs=/fit-in/200x150/filters:strip_icc()/pic3536616.jpg' },
  { name: 'Gloomhaven',                    bggId: '174430', thumbnail: 'https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__thumb/img/veqFeP4d_3zNgOCGdQGMpRNqYX8=/fit-in/200x150/filters:strip_icc()/pic2437871.jpg' },
  { name: 'Scythe',                        bggId: '169786', thumbnail: 'https://cf.geekdo-images.com/7k_nOxpO9OGIjhLq2BvynA__thumb/img/5Gx1VbyNSFivIhXB-T6KJhZF3Hk=/fit-in/200x150/filters:strip_icc()/pic3163924.jpg' },
]

const CONDITIONS = ['new', 'like_new', 'like_new', 'good', 'good', 'good', 'fair', 'poor'] as const

const LISTING_LOCATIONS = [
  'San Francisco, CA', 'New York, NY', 'Chicago, IL', 'Austin, TX',
  'Seattle, WA', 'Los Angeles, CA', 'Boston, MA', 'Denver, CO',
  'Portland, OR', 'Miami, FL',
]

const LISTING_DESCRIPTIONS = [
  'Played only twice, all components in perfect condition.',
  'Complete with all expansions. Comes with custom insert.',
  'Well loved but all pieces present. Slight shelf wear on box.',
  'Bought as a gift but already have a copy. Never opened.',
  'Missing 2 resource tokens. Still very playable.',
  'Sleeved cards, excellent condition. Selling to make room.',
  'Great game, just not my group\'s style.',
  '',
  'All cards sleeved. Includes promo cards.',
  'Box has some wear but game is in great shape.',
]

const WHATSAPP_NUMBERS = [
  '+14155550101', '+12125550102', '+13125550103', '+15125550104',
  '+12065550105', '+13105550106', '+16175550107', '+17205550108',
  '+15035550109', '+13055550110', '+14155550111', '+12125550112',
  '+13125550113', '+15125550114', '+12065550115', '+13105550116',
  '+16175550117', '+17205550118', '+15035550119', '+13055550120',
]

async function clearListings(): Promise<void> {
  const seedUids = SEED_USERS.map(u => u.uid)
  const chunks: string[][] = []
  for (let i = 0; i < seedUids.length; i += 10) chunks.push(seedUids.slice(i, i + 10))

  let deleted = 0
  for (const chunk of chunks) {
    const snap = await db.collection('listings').where('sellerUid', 'in', chunk).get()
    const batch = db.batch()
    snap.docs.forEach(d => batch.delete(d.ref))
    if (!snap.empty) await batch.commit()
    deleted += snap.size
  }
  console.log(`  Cleared ${deleted} listings`)
}

async function createListings(): Promise<void> {
  console.log('  Creating marketplace listings...')
  const now = new Date().toISOString()
  const batch = db.batch()
  let count = 0

  for (let ui = 0; ui < SEED_USERS.length; ui++) {
    const user = SEED_USERS[ui]
    const photo = avatar(user.name, user.bg)
    // 2 listings per user = 40 total; mix of active and sold
    for (let li = 0; li < 2; li++) {
      const gameIdx = (ui * 2 + li) % LISTING_GAMES.length
      const game = LISTING_GAMES[gameIdx]
      const condition = CONDITIONS[(ui + li * 3) % CONDITIONS.length]
      // Prices from $5 to $85 in varied steps
      const priceBase = [500, 800, 1200, 1500, 1800, 2000, 2500, 3000, 4000, 4500, 5000, 6000, 7000, 7500, 8000, 8500]
      const price = priceBase[(ui * 2 + li) % priceBase.length]
      const location = LISTING_LOCATIONS[ui % LISTING_LOCATIONS.length]
      const description = LISTING_DESCRIPTIONS[(ui + li) % LISTING_DESCRIPTIONS.length]
      const whatsapp = WHATSAPP_NUMBERS[ui]
      // Last 4 listings per seller marked sold
      const status = ui >= 18 && li === 0 ? 'sold' : 'active'

      const ref = db.collection('listings').doc()
      batch.set(ref, {
        sellerUid: user.uid,
        sellerName: user.name,
        sellerPhoto: photo,
        boardGame: { bggId: game.bggId, name: game.name, thumbnail: game.thumbnail, yearPublished: null },
        condition,
        price,
        description,
        location,
        whatsapp,
        status,
        soldAt: status === 'sold' ? now : null,
        createdAt: now,
        updatedAt: now,
      })
      count++
    }
  }

  await batch.commit()
  console.log(`  Created ${count} listings`)
}

// ── Create recaps ─────────────────────────────────────────────────────────────

// Winners for recaps — alternates between having a winner and no winner
const RECAP_WINNERS = [
  'Alice Chen', 'Bob Martinez', '', 'David Kim', 'Emma Wilson',
  '', 'Grace Lee', 'Henry Brown', '', 'Jack Anderson',
  'Kate Thomas', '', 'Maya Robinson', 'Noah Clark', '', 'Rose Allen',
]

const RECAP_NOTES = [
  'Amazing game night! Came down to the wire in the final round.',
  'Best session yet. Everyone brought their A-game.',
  'First time playing with this group — can\'t wait to do it again!',
  'Epic comeback from last place. Will not forget this one.',
  'Taught two new players and they both loved it. Mission accomplished.',
  '',
  'Tight game from start to finish. One point decided it all.',
  'Great evening — the pizza helped too 🍕',
]

async function createRecaps(eventIds: string[]): Promise<void> {
  console.log('  Creating recaps for ended events...')
  const batch = db.batch()
  let count = 0

  // Add recaps for a subset of the ended events (roughly the first 12 ended events)
  const endedEventIdxs: number[] = []
  for (let ui = 0; ui < SEED_USERS.length; ui++) {
    // Events 0 and 1 per user are ended (past days -30 and -12)
    endedEventIdxs.push(ui * 6, ui * 6 + 1)
  }

  for (let i = 0; i < Math.min(endedEventIdxs.length, 16); i++) {
    const eventIdx = endedEventIdxs[i]
    const eventId = eventIds[eventIdx]
    if (!eventId) continue
    const hostUser = SEED_USERS[Math.floor(eventIdx / 6)]
    const game = GAMES[eventIdx % GAMES.length]
    const lgMatch = LISTING_GAMES.find(lg => lg.name === game.name)
    const note = RECAP_NOTES[i % RECAP_NOTES.length]
    const playerCount = 2 + (i % 3)
    const createdAt = new Date(Date.now() - (16 - i) * 3 * 86_400_000).toISOString()

    const winner = RECAP_WINNERS[i % RECAP_WINNERS.length]

    const ref = db.collection('recaps').doc()
    batch.set(ref, {
      eventId,
      hostUid: hostUser.uid,
      hostName: hostUser.name,
      hostPhoto: avatar(hostUser.name, hostUser.bg),
      game: {
        name: game.name,
        thumbnail: lgMatch?.thumbnail ?? '',
        bggId: lgMatch?.bggId ?? '',
      },
      note,
      ...(winner && { winner }),
      playerCount,
      createdAt,
    })
    count++
  }

  await batch.commit()
  console.log(`  Created ${count} recaps`)
}

async function clearRecaps(): Promise<void> {
  const seedUids = SEED_USERS.map(u => u.uid)
  const chunks: string[][] = []
  for (let i = 0; i < seedUids.length; i += 10) chunks.push(seedUids.slice(i, i + 10))
  let deleted = 0
  for (const chunk of chunks) {
    const snap = await db.collection('recaps').where('hostUid', 'in', chunk).get()
    const batch = db.batch()
    snap.docs.forEach(d => batch.delete(d.ref))
    if (!snap.empty) await batch.commit()
    deleted += snap.size
  }
  if (deleted > 0) console.log(`  Cleared ${deleted} recaps`)
}

// ── Create game collections ───────────────────────────────────────────────────

async function createCollections(): Promise<void> {
  console.log('  Creating game collections...')
  const now = new Date().toISOString()
  const batch = db.batch()
  let total = 0

  for (let ui = 0; ui < SEED_USERS.length; ui++) {
    const u = SEED_USERS[ui]
    // Each user owns 4–8 games, offset by their index for variety
    const count = 4 + (ui % 5)
    const collection = []
    for (let gi = 0; gi < count; gi++) {
      const game = LISTING_GAMES[(ui + gi) % LISTING_GAMES.length]
      collection.push({
        bggId: game.bggId,
        name: game.name,
        thumbnail: game.thumbnail,
        yearPublished: null,
        addedAt: now,
      })
    }
    batch.set(db.collection('users').doc(u.uid), { collection }, { merge: true })
    total += collection.length
  }

  await batch.commit()
  console.log(`  Created ${total} collection entries across ${SEED_USERS.length} users`)
}

// ── Create user bios ──────────────────────────────────────────────────────────

async function createBios(): Promise<void> {
  console.log('  Creating user bios...')
  const batch = db.batch()
  for (let ui = 0; ui < SEED_USERS.length; ui++) {
    const u = SEED_USERS[ui]
    batch.set(db.collection('users').doc(u.uid), { bio: BIOS[ui] }, { merge: true })
  }
  await batch.commit()
  console.log(`  Created ${SEED_USERS.length} bios`)
}

// ── Create skill levels ───────────────────────────────────────────────────────

async function createSkillLevels(): Promise<void> {
  console.log('  Creating skill levels...')
  const batch = db.batch()
  for (let ui = 0; ui < SEED_USERS.length; ui++) {
    const u = SEED_USERS[ui]
    batch.set(db.collection('users').doc(u.uid), { skillLevel: SKILL_LEVELS[ui] }, { merge: true })
  }
  await batch.commit()
  console.log(`  Set skill levels for ${SEED_USERS.length} users`)
}

// ── Create host ratings ───────────────────────────────────────────────────────

async function createRatings(): Promise<void> {
  console.log('  Creating host ratings...')
  const batch = db.batch()
  let count = 0
  for (let ui = 0; ui < SEED_USERS.length; ui++) {
    const rating = HOST_RATINGS[ui]
    if (!rating) continue
    const u = SEED_USERS[ui]
    batch.set(db.collection('users').doc(u.uid), { ratingTotal: rating[0], ratingCount: rating[1] }, { merge: true })
    count++
  }
  await batch.commit()
  console.log(`  Created ratings for ${count} users`)
}

// ── Create geo data (for NearbyPlayers) ──────────────────────────────────────

async function createGeoData(): Promise<void> {
  console.log('  Creating geo data for NearbyPlayers...')
  const batch = db.batch()
  for (let ui = 0; ui < SEED_USERS.length; ui++) {
    const u = SEED_USERS[ui]
    const coords = GEO_CLUSTERS[ui]
    if (!coords) continue
    const geohash = geohashForLocation([coords.lat, coords.lng])
    batch.set(db.collection('users').doc(u.uid), { geo: { lat: coords.lat, lng: coords.lng, geohash } }, { merge: true })
  }
  await batch.commit()
  console.log(`  Set geo data for ${GEO_CLUSTERS.length} users across 5 city clusters`)
}

// ── Create conversations + messages ──────────────────────────────────────────

const CONV_THREADS: { ai: number; bi: number; listing?: { name: string; bggId: string; thumbnail: string }; msgs: { from: 'a' | 'b'; text: string }[] }[] = [
  {
    ai: 0, bi: 1,
    listing: LISTING_GAMES[0], // Catan
    msgs: [
      { from: 'b', text: 'Hey! Is the Catan listing still available?' },
      { from: 'a', text: "Yes it is! Just played it last week, everything's there." },
      { from: 'b', text: 'Great, what condition is the box in?' },
      { from: 'a', text: 'A bit of shelf wear but components are mint. Happy to send more pics!' },
      { from: 'b', text: "Sounds good, I'll take it!" },
    ],
  },
  {
    ai: 0, bi: 2,
    msgs: [
      { from: 'a', text: 'Are you coming to game night this Saturday?' },
      { from: 'b', text: "Wouldn't miss it! Who else is going?" },
      { from: 'a', text: 'Bob, David, and maybe Emma. Should be a great group!' },
      { from: 'b', text: "Perfect, I'll bring my Wingspan expansion 🐦" },
    ],
  },
  {
    ai: 1, bi: 5,
    listing: LISTING_GAMES[2], // Pandemic
    msgs: [
      { from: 'b', text: 'Hi, is the Pandemic still for sale?' },
      { from: 'a', text: 'Yes! All cards sleeved, box is in great shape.' },
      { from: 'b', text: 'Any expansions included?' },
      { from: 'a', text: 'Just the base game, but I can do $20.' },
      { from: 'b', text: 'Deal! Can we meet near the café on Thursday?' },
      { from: 'a', text: 'Thursday works, see you at 6!' },
    ],
  },
  {
    ai: 3, bi: 9,
    msgs: [
      { from: 'a', text: 'Great game last night! That final round was intense 🎲' },
      { from: 'b', text: "I almost had you! Next time I'm not going easy." },
      { from: 'a', text: 'Want to do Terraforming Mars next time? More complex but so worth it.' },
      { from: 'b', text: "100%, I've been wanting to try it." },
    ],
  },
  {
    ai: 4, bi: 12,
    msgs: [
      { from: 'b', text: 'Hey, do you have a regular group I could join?' },
      { from: 'a', text: 'Yes! We play every other Friday. Next one is the 28th.' },
      { from: 'b', text: 'What do you usually play?' },
      { from: 'a', text: 'Mix of euros and social deduction. Codenames is a favourite.' },
      { from: 'b', text: 'I love Codenames! Count me in!' },
    ],
  },
  {
    ai: 6, bi: 15,
    listing: LISTING_GAMES[7], // Terraforming Mars
    msgs: [
      { from: 'b', text: 'Still selling the Terraforming Mars?' },
      { from: 'a', text: 'Yep! Includes the Prelude expansion.' },
      { from: 'b', text: 'How many plays on it?' },
      { from: 'a', text: 'Maybe 15-20. Cards are in perfect condition, sleeved.' },
      { from: 'b', text: "I'll take it. Can you ship or local pickup only?" },
      { from: 'a', text: "Local only, I'm in the Mission district." },
    ],
  },
  {
    ai: 7, bi: 17,
    msgs: [
      { from: 'a', text: 'Loved meeting you at the event last week!' },
      { from: 'b', text: 'Same! That Root game was wild, never played it before.' },
      { from: 'a', text: "It's one of my favourites. Different every time." },
      { from: 'b', text: 'I need to buy a copy. Any idea where to find it locally?' },
      { from: 'a', text: 'Card Kingdom usually has it, or check the marketplace here!' },
    ],
  },
]

async function clearConversations(): Promise<void> {
  // Conversations use stable IDs (sorted uid pair), so query from first user of each known thread
  const deleted = new Set<string>()
  for (const thread of CONV_THREADS) {
    const a = SEED_USERS[thread.ai]
    const b = SEED_USERS[thread.bi]
    const convId = [a.uid, b.uid].sort().join('_')
    if (deleted.has(convId)) continue
    const ref = db.collection('conversations').doc(convId)
    const snap = await ref.get()
    if (!snap.exists) continue
    const msgs = await ref.collection('messages').get()
    const batch = db.batch()
    msgs.docs.forEach(m => batch.delete(m.ref))
    batch.delete(ref)
    await batch.commit()
    deleted.add(convId)
  }
  if (deleted.size > 0) console.log(`  Cleared ${deleted.size} conversations`)
}

async function createConversations(): Promise<void> {
  console.log('  Creating conversations and messages...')
  let convCount = 0
  let msgCount = 0

  for (const thread of CONV_THREADS) {
    const a = SEED_USERS[thread.ai]
    const b = SEED_USERS[thread.bi]
    const participants = [a.uid, b.uid].sort()
    const convId = participants.join('_')
    const lastMsg = thread.msgs[thread.msgs.length - 1]
    const lastSender = lastMsg.from === 'a' ? a.uid : b.uid
    const now = Date.now()
    // Stagger message times: last message a few minutes ago
    const baseTime = now - thread.msgs.length * 5 * 60_000

    const convData: Record<string, unknown> = {
      participants,
      participantNames: { [a.uid]: a.name, [b.uid]: b.name },
      participantPhotos: { [a.uid]: avatar(a.name, a.bg), [b.uid]: avatar(b.name, b.bg) },
      lastMessage: lastMsg.text,
      lastMessageAt: new Date(now).toISOString(),
      lastSenderUid: lastSender,
      unread: { [a.uid]: 0, [b.uid]: 1 },
      createdAt: new Date(baseTime).toISOString(),
    }
    if (thread.listing) {
      convData.listingName = thread.listing.name
      convData.listingThumbnail = thread.listing.thumbnail
    }

    const convRef = db.collection('conversations').doc(convId)
    await convRef.set(convData)
    convCount++

    const batch = db.batch()
    for (let mi = 0; mi < thread.msgs.length; mi++) {
      const m = thread.msgs[mi]
      const senderUid = m.from === 'a' ? a.uid : b.uid
      const msgRef = convRef.collection('messages').doc()
      batch.set(msgRef, {
        uid: senderUid,
        text: m.text,
        createdAt: Timestamp.fromMillis(baseTime + mi * 5 * 60_000),
      })
      msgCount++
    }
    await batch.commit()
  }

  console.log(`  Created ${convCount} conversations, ${msgCount} messages`)
}

// ── Create invitations ────────────────────────────────────────────────────────

async function clearInvites(): Promise<void> {
  const seedUids = SEED_USERS.map(u => u.uid)
  const chunks: string[][] = []
  for (let i = 0; i < seedUids.length; i += 10) chunks.push(seedUids.slice(i, i + 10))
  let deleted = 0
  for (const chunk of chunks) {
    const snap = await db.collection('invites').where('fromUid', 'in', chunk).get()
    const batch = db.batch()
    snap.docs.forEach(d => batch.delete(d.ref))
    if (!snap.empty) await batch.commit()
    deleted += snap.size
  }
  if (deleted > 0) console.log(`  Cleared ${deleted} invites`)
}

async function createInvites(eventIds: string[]): Promise<void> {
  console.log('  Creating event invitations...')
  const now = new Date().toISOString()
  const batch = db.batch()
  let count = 0

  // Each entry: host index, target friend index, event index (within that host's 6 events)
  // Use upcoming events (event index 3 = days 5+ui ahead) which are still joinable
  const INVITE_CONFIGS: { hostIdx: number; friendIdxs: number[]; eventSlot: number }[] = [
    { hostIdx: 0, friendIdxs: [5, 6],    eventSlot: 3 }, // Alice invites Frank + Grace
    { hostIdx: 1, friendIdxs: [7],        eventSlot: 3 }, // Bob invites Henry
    { hostIdx: 2, friendIdxs: [8, 9],    eventSlot: 3 }, // Carol invites Iris + Jack
    { hostIdx: 4, friendIdxs: [13],      eventSlot: 3 }, // Emma invites Sam
    { hostIdx: 6, friendIdxs: [17, 18],  eventSlot: 3 }, // Grace invites Rose + Tina (wait, Grace is hostIdx 6)
    { hostIdx: 9, friendIdxs: [11],      eventSlot: 5 }, // Jack invites Kate (far future event)
  ]

  for (const cfg of INVITE_CONFIGS) {
    const host = SEED_USERS[cfg.hostIdx]
    const eventId = eventIds[cfg.hostIdx * 6 + cfg.eventSlot]
    if (!eventId) continue

    // Get event info from already-computed data
    const game = GAMES[(cfg.hostIdx * 6 + cfg.eventSlot) % GAMES.length]
    const eventDate = dateAt(5 + cfg.hostIdx, 18) // matches what createEvents generated

    for (const friendIdx of cfg.friendIdxs) {
      const friend = SEED_USERS[friendIdx]
      const docId = `${host.uid}_${eventId}_${friend.uid}`
      batch.set(db.collection('invites').doc(docId), {
        eventId,
        fromUid: host.uid,
        toUid: friend.uid,
        status: 'pending',
        fromName: host.name,
        fromPhoto: avatar(host.name, host.bg),
        eventName: game.name,
        eventDate,
        eventAddress: VENUES[(cfg.hostIdx + cfg.eventSlot) % VENUES.length].address,
        createdAt: now,
      })
      count++
    }
  }

  await batch.commit()
  console.log(`  Created ${count} invitations`)
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Seeding Ludify...\n')
  const t = Date.now()

  await clearSeedData()
  await clearListings()
  await clearRecaps()
  await clearConversations()
  await clearInvites()
  await createUsers()
  const eventIds = await createEvents()
  await createFriendships()
  await createComments(eventIds)
  await createEventMessages(eventIds)
  await createAddresses()
  await createCollections()
  await createBios()
  await createSkillLevels()
  await createRatings()
  await createGeoData()
  await createListings()
  await createRecaps(eventIds)
  await createConversations()
  await createInvites(eventIds)

  console.log(`\n✅ Done in ${((Date.now() - t) / 1000).toFixed(1)}s`)
  console.log('\nTest users (sign in at /dev):')
  for (const u of SEED_USERS) {
    console.log(`  ${u.name.padEnd(16)} ${u.uid}  ${u.email}`)
  }
  process.exit(0)
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err)
  process.exit(1)
})
