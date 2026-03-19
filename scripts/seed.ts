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

      batch.set(ref, {
        boardGame: { bggId: '', name: game.name, thumbnail: '' },
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
      await db.collection('events').doc(eventId).collection('comments').add({
        uid: u.uid,
        name: u.name,
        photoURL: avatar(u.name, u.bg),
        text,
        createdAt: Timestamp.fromMillis(Date.now() - msAgo),
        pinned: c === 0 && i % 4 === 0, // pin first comment on every 4th event
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

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Seeding Game Night App...\n')
  const t = Date.now()

  await clearSeedData()
  await createUsers()
  const eventIds = await createEvents()
  await createFriendships()
  await createComments(eventIds)
  await createAddresses()

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
