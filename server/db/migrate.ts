import { migrate } from 'drizzle-orm/libsql/migrator'
import { db } from './client'

export async function runMigrations() {
  await migrate(db, { migrationsFolder: './server/db/migrations' })
}

// Allow `tsx server/db/migrate.ts` to run standalone.
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().then(() => {
    console.log('migrations applied')
    process.exit(0)
  }).catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
