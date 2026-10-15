import { describe, it, expect } from 'vitest'
import { createClient } from '@libsql/client'
import { readMigrationFiles } from 'drizzle-orm/migrator'

describe('calendar display upgrade', () => {
  it('preserves existing events and registrations while adding the published flyer details', async () => {
    const client = createClient({ url: 'file::memory:' })
    try {
      const migrations = readMigrationFiles({ migrationsFolder: './server/db/migrations' })
      for (const migration of migrations.slice(0, -1)) {
        for (const sql of migration.sql) if (sql.trim()) await client.execute(sql)
      }
      await client.execute({ sql: 'INSERT INTO event (id,start_date,title,color,is_highlight,is_public,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)', args: ['af71ab8e-0dd8-4517-b50b-0ad33c0dfe7f', '2026-10-31', 'Little Lifelines – CPR Basic Essentials', 'sage', 1, 1, 123, 123] })
      await client.execute({ sql: 'INSERT INTO event (id,start_date,title,color,is_highlight,is_public,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)', args: ['other', '2026-11-01', 'Existing private event', 'pink', 0, 0, 123, 123] })
      await client.execute({ sql: 'INSERT INTO booking (id,event_id,name,surname,email,phone,created_at) VALUES (?,?,?,?,?,?,?)', args: ['saved-rsvp', 'af71ab8e-0dd8-4517-b50b-0ad33c0dfe7f', 'Test', 'Parent', 'parent@example.test', '', 123] })
      for (const sql of migrations[migrations.length - 1]!.sql) if (sql.trim()) await client.execute(sql)
      const rows = (await client.execute('SELECT * FROM event ORDER BY id')).rows
      expect(rows).toHaveLength(2)
      const cpr = rows.find(row => row.id === 'af71ab8e-0dd8-4517-b50b-0ad33c0dfe7f')!
      expect(JSON.parse(cpr.public_details as string)).toMatchObject({ startTime: '08:30', endTime: '12:00', posterUrl: '/events/little-lifelines-cpr-2026-10-31.webp' })
      expect(cpr.created_at).toBe(123)
      expect(rows.find(row => row.id === 'other')).toMatchObject({ title: 'Existing private event', is_public: 0, updated_at: 123, public_details: null })
      expect((await client.execute('SELECT id,event_id FROM booking')).rows).toEqual([{ id: 'saved-rsvp', event_id: cpr.id }])
    } finally { client.close() }
  })
})
