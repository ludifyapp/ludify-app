// scripts/seed.ts
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { randomUUID } from 'crypto'

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
      // 4: future ~14 days, some cancelled
      { days: 14 + ui, hour: 19, durationH: 0, cancelled: ui % 8 === 0, type: 'public', extraPlayers: 1, makeFull: false, ongoing: false },
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

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Seeding Game Night App...\n')
  const t = Date.now()

  await clearSeedData()
  await clearListings()
  await createUsers()
  const eventIds = await createEvents()
  await createFriendships()
  await createComments(eventIds)
  await createAddresses()
  await createCollections()
  await createBios()
  await createListings()

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
