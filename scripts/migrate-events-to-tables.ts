// scripts/migrate-events-to-tables.ts
// Migrates Firestore data from the old 'events' collection to 'tables',
// and renames the 'eventId' field to 'tableId' in 'recaps' and 'ratings'.
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=./service-accounts/dev.json \
//     npx ts-node scripts/migrate-events-to-tables.ts --env dev
//
// The script is idempotent — safe to re-run if interrupted.

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const BATCH_SIZE = 400 // Firestore limit is 500 ops per batch

const envArg = process.argv[process.argv.indexOf('--env') + 1]
if (!['dev', 'qa', 'prod'].includes(envArg)) {
  console.error('Usage: npx ts-node scripts/migrate-events-to-tables.ts --env dev|qa|prod')
  process.exit(1)
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('GOOGLE_APPLICATION_CREDENTIALS env var is required')
  process.exit(1)
}

const app = getApps().length === 0
  ? initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) })
  : getApps()[0]

const db = getFirestore(app)

async function migrateCollection(fromName: string, toName: string): Promise<void> {
  console.log(`\n[${fromName} → ${toName}] Starting collection migration...`)
  const snapshot = await db.collection(fromName).get()

  if (snapshot.empty) {
    console.log(`  No documents found in '${fromName}'. Skipping.`)
    return
  }

  let copied = 0
  let skipped = 0
  let deleted = 0

  const docs = snapshot.docs
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const chunk = docs.slice(i, i + BATCH_SIZE)
    const batch = db.batch()

    for (const doc of chunk) {
      const destRef = db.collection(toName).doc(doc.id)
      const destSnap = await destRef.get()

      if (destSnap.exists) {
        skipped++
        continue
      }

      batch.set(destRef, doc.data())
      copied++
    }

    if (copied - skipped > 0 || copied > 0) {
      await batch.commit()
    }
  }

  console.log(`  Copied: ${copied}, Already existed (skipped): ${skipped}`)

  // Delete source docs in batches after all copies are confirmed
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const chunk = docs.slice(i, i + BATCH_SIZE)
    const batch = db.batch()

    for (const doc of chunk) {
      batch.delete(db.collection(fromName).doc(doc.id))
      deleted++
    }

    await batch.commit()
  }

  console.log(`  Deleted from source: ${deleted}`)
}

async function renameField(collName: string, oldField: string, newField: string): Promise<void> {
  console.log(`\n[${collName}] Renaming field '${oldField}' → '${newField}'...`)
  const snapshot = await db.collection(collName).get()

  if (snapshot.empty) {
    console.log(`  No documents found in '${collName}'. Skipping.`)
    return
  }

  let updated = 0
  let skipped = 0

  const docs = snapshot.docs.filter(doc => {
    const data = doc.data()
    if (newField in data) { skipped++; return false }
    return oldField in data
  })

  console.log(`  Found ${docs.length} docs to update, ${skipped} already migrated.`)

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const chunk = docs.slice(i, i + BATCH_SIZE)
    const batch = db.batch()

    for (const doc of chunk) {
      const data = doc.data()
      batch.update(doc.ref, {
        [newField]: data[oldField],
        [oldField]: FieldValue.delete(),
      })
      updated++
    }

    await batch.commit()
  }

  console.log(`  Updated: ${updated}`)
}

async function main() {
  console.log(`\n=== Ludify: events → tables migration (env: ${envArg}) ===`)

  await migrateCollection('events', 'tables')
  await renameField('recaps', 'eventId', 'tableId')
  await renameField('ratings', 'eventId', 'tableId')

  console.log('\n=== Migration complete ===\n')
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
