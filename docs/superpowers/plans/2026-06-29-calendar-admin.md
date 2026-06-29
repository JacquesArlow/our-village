# Our Village Calendar + Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a content calendar with a login-protected admin (`/village-desk`) where staff manage events + hand-curated sidebar lists with a per-item "show on public site" toggle, and public pages (`/calendar`, `/calendar/events`) that render only public-toggled items in the Our Village printed-calendar style.

**Architecture:** Nuxt 3 (Nitro `node-server`) full-stack app. Drizzle ORM over SQLite (libSQL `file:` driver) on a persistent Docker volume. Better Auth (Drizzle adapter, email+password) for the admin. Nitro server routes split into public read endpoints and session-guarded admin CRUD. Shared Vue calendar components render both public (read-only, public rows) and admin (editable, all rows). Cloudflare WAF blocks non-ZA traffic to the admin surface.

**Tech Stack:** Nuxt 3.14, Tailwind v4 + daisyUI v5 (`ourvillage` theme), Drizzle ORM, `@libsql/client`, drizzle-kit, Better Auth + Drizzle adapter, Vitest (+ `@nuxt/test-utils`) for unit tests, Docker Compose, Cloudflare.

## Global Constraints

- Nuxt `3.14.1592`; Nitro preset `node-server`. Do not introduce a different SSR preset.
- Styling: Tailwind v4 + daisyUI v5 only, on the existing `ourvillage` theme. Reuse tokens (`primary`/sage `#a9b791`, `secondary` `#6a7971`, `base-200` cream `#f4f5ee`, `accent` pink `#ffbae2`). No new CSS frameworks.
- Database: SQLite via Drizzle + `@libsql/client`, URL from `DATABASE_URL` (e.g. `file:/data/ourvillage.db`). Postgres only if libSQL proves impossible (not expected).
- Auth: Better Auth, email+password, Drizzle adapter, mounted at `/api/auth/[...all]`. Session cookie httpOnly + secure.
- Public endpoints (`/api/calendar/*`) MUST return only rows where `isPublic = true`. Admin endpoints (`/api/admin/*`) MUST call the `requireAdmin` guard before any data access.
- Admin path is exactly `/village-desk`. Day edit path `/village-desk/day/YYYY-MM-DD`.
- Booleans stored as SQLite integers (0/1) via Drizzle `integer({ mode: 'boolean' })`. Dates of events stored as `YYYY-MM-DD` text. Timestamps as epoch-ms integers.
- Colour token values are exactly: `sage` | `pink` | `red` | `default`.
- `month_block.section` values are exactly: `important_dates` | `hot_topics` | `focus` | `training`.
- All new work on the `staging` branch; commit after every task; do not wire production.
- Co-author every commit:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_012efjZHoAPiegckH7zmAd1K`

---

## File Structure

**Create:**
- `server/db/client.ts` — Drizzle libSQL client (`db` export).
- `server/db/schema.app.ts` — `event`, `monthBlock` tables + inferred types.
- `server/db/schema.auth.ts` — Better Auth tables (generated via CLI, committed).
- `server/db/schema.ts` — re-exports both schema files.
- `drizzle.config.ts` — drizzle-kit config.
- `server/db/migrate.ts` — programmatic migrator (run at startup).
- `server/plugins/migrate.ts` — Nitro startup plugin that runs migrations + seeds admin.
- `lib/auth.ts` — Better Auth server instance.
- `lib/auth-client.ts` — Better Auth Vue client.
- `server/api/auth/[...all].ts` — Better Auth handler mount.
- `server/utils/requireAdmin.ts` — session guard for admin routes.
- `server/utils/calendarRepo.ts` — query helpers (month fetch, events list, CRUD).
- `server/api/calendar/month.get.ts` — public month data.
- `server/api/calendar/events.get.ts` — public events, current→oldest.
- `server/api/admin/month.get.ts` — all month data.
- `server/api/admin/event.post.ts` / `.patch.ts` / `.delete.ts` — event CRUD.
- `server/api/admin/block.post.ts` / `.patch.ts` / `.delete.ts` — block CRUD.
- `shared/calendar.ts` — shared types + colour/section constants + date utils (importable by server and client).
- `components/calendar/CalendarGrid.vue`, `CalendarDayCell.vue`, `CalendarSidebar.vue`, `CalendarMonthNav.vue`.
- `components/calendar/EventEditForm.vue`, `BlockListEditor.vue` (admin-only editors).
- `composables/useCalendar.ts` — fetch helpers.
- `pages/calendar/index.vue`, `pages/calendar/events.vue`.
- `pages/village-desk/index.vue`, `pages/village-desk/day/[date].vue`.
- `middleware/admin.ts` — route guard for `/village-desk/**`.
- `tests/setup.ts`, `vitest.config.ts`, and `tests/**` unit tests.
- `docker-entrypoint.sh` — optional; migrations run via Nitro plugin instead (kept simple).

**Modify:**
- `package.json` — deps + scripts.
- `nuxt.config.ts` — add script font link, runtimeConfig for auth/db, nitro externals if needed.
- `assets/css/main.css` — script font token + calendar utilities.
- `components/AppHeader.vue` — add "Calendar" nav link.
- `docker-compose.yml` — `/data` volume + env.
- `Dockerfile` — ensure migrations dir + runtime deps; alpine build deps if a native module needs them (libSQL ships prebuilt, so likely none).
- `.gitignore` — ignore local `*.db` files.

---

## Task 1: Tooling + Drizzle/libSQL DB layer with app schema

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`, `tests/setup.ts`
- Create: `shared/calendar.ts`
- Create: `server/db/client.ts`, `server/db/schema.app.ts`, `server/db/schema.ts`
- Create: `drizzle.config.ts`
- Create: `server/db/migrate.ts`
- Modify: `.gitignore`
- Test: `tests/db/calendarRepo.test.ts` (repo added Task 3; here test schema+client only via `tests/db/schema.test.ts`)

**Interfaces:**
- Produces:
  - `shared/calendar.ts`: `type ColorToken = 'sage'|'pink'|'red'|'default'`; `type BlockSection = 'important_dates'|'hot_topics'|'focus'|'training'`; `const COLOR_TOKENS`, `const BLOCK_SECTIONS`; `function ymd(date: Date): string`; `function monthRange(year:number, month:number): { start:string; end:string }` (start = `YYYY-MM-01`, end = `YYYY-MM-<lastDay>`); `interface EventRow`, `interface BlockRow` (mirror DB columns).
  - `server/db/schema.app.ts`: `event` table (cols: `id` text PK, `startDate` text, `endDate` text nullable, `title` text, `detail` text nullable, `staff` text nullable, `color` text default `'default'`, `isHighlight` int bool default false, `isPublic` int bool default false, `createdAt` int, `updatedAt` int); `monthBlock` table (`id` text PK, `year` int, `month` int, `section` text, `text` text, `color` text default `'default'`, `sortOrder` int default 0, `isPublic` int bool default false, `createdAt` int, `updatedAt` int). Export `type Event = typeof event.$inferSelect` etc.
  - `server/db/client.ts`: `export const db` (drizzle libSQL instance bound to schema).

- [ ] **Step 1: Add dependencies**

Run (in repo root):
```bash
npm install drizzle-orm @libsql/client
npm install -D drizzle-kit vitest @nuxt/test-utils happy-dom
```
Expected: `package.json` updated, `package-lock.json` changes.

- [ ] **Step 2: Add npm scripts**

Edit `package.json` `scripts` to add:
```json
"test": "vitest run",
"test:watch": "vitest",
"db:generate": "drizzle-kit generate",
"db:migrate": "tsx server/db/migrate.ts"
```
(Install `tsx` as dev dep too: `npm install -D tsx`.)

- [ ] **Step 3: Write `shared/calendar.ts`**

```ts
export type ColorToken = 'sage' | 'pink' | 'red' | 'default'
export const COLOR_TOKENS: ColorToken[] = ['sage', 'pink', 'red', 'default']

export type BlockSection = 'important_dates' | 'hot_topics' | 'focus' | 'training'
export const BLOCK_SECTIONS: BlockSection[] = ['important_dates', 'hot_topics', 'focus', 'training']

export const BLOCK_SECTION_LABELS: Record<BlockSection, string> = {
  important_dates: 'Important dates',
  hot_topics: 'Hot Topics',
  focus: 'Focus list',
  training: 'Training note'
}

/** Format a Date as YYYY-MM-DD (local). */
export function ymd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Inclusive YYYY-MM-DD bounds for a calendar month. */
export function monthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate() // month is 1-based here
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

export interface EventRow {
  id: string
  startDate: string
  endDate: string | null
  title: string
  detail: string | null
  staff: string | null
  color: ColorToken
  isHighlight: boolean
  isPublic: boolean
  createdAt: number
  updatedAt: number
}

export interface BlockRow {
  id: string
  year: number
  month: number
  section: BlockSection
  text: string
  color: ColorToken
  sortOrder: number
  isPublic: boolean
  createdAt: number
  updatedAt: number
}
```

- [ ] **Step 4: Write `tests/setup.ts`** (empty global setup for now)

```ts
// Reserved for global test setup (e.g. env defaults).
process.env.DATABASE_URL ||= 'file::memory:'
```

- [ ] **Step 5: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.ts']
  },
  resolve: {
    alias: {
      '~~': fileURLToPath(new URL('.', import.meta.url)),
      '~': fileURLToPath(new URL('.', import.meta.url))
    }
  }
})
```

- [ ] **Step 6: Write `server/db/schema.app.ts`**

```ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const event = sqliteTable('event', {
  id: text('id').primaryKey(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  title: text('title').notNull(),
  detail: text('detail'),
  staff: text('staff'),
  color: text('color').notNull().default('default'),
  isHighlight: integer('is_highlight', { mode: 'boolean' }).notNull().default(false),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

export const monthBlock = sqliteTable('month_block', {
  id: text('id').primaryKey(),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  section: text('section').notNull(),
  text: text('text').notNull(),
  color: text('color').notNull().default('default'),
  sortOrder: integer('sort_order').notNull().default(0),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

export type EventSelect = typeof event.$inferSelect
export type EventInsert = typeof event.$inferInsert
export type MonthBlockSelect = typeof monthBlock.$inferSelect
export type MonthBlockInsert = typeof monthBlock.$inferInsert
```

- [ ] **Step 7: Write `server/db/schema.auth.ts` placeholder + `server/db/schema.ts`**

`server/db/schema.auth.ts` (temporary; replaced by CLI output in Task 2):
```ts
// Better Auth tables are generated in Task 2 via `npx @better-auth/cli generate`.
export {}
```
`server/db/schema.ts`:
```ts
export * from './schema.app'
export * from './schema.auth'
```

- [ ] **Step 8: Write `server/db/client.ts`**

```ts
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'

const url = process.env.DATABASE_URL || 'file:./local.db'
const client = createClient({ url })
export const db = drizzle(client, { schema })
export { schema }
```

- [ ] **Step 9: Write `drizzle.config.ts`**

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'turso', // libSQL; works with file: URLs
  dbCredentials: { url: process.env.DATABASE_URL || 'file:./local.db' }
})
```

- [ ] **Step 10: Write `server/db/migrate.ts`**

```ts
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
```

- [ ] **Step 11: Generate the app-table migration**

Run:
```bash
npm run db:generate
```
Expected: a SQL file appears under `server/db/migrations/` containing `CREATE TABLE event` and `CREATE TABLE month_block`. Commit it.

- [ ] **Step 12: Update `.gitignore`**

Append:
```
# local sqlite
*.db
local.db
```

- [ ] **Step 13: Write `tests/db/schema.test.ts`** (failing first)

```ts
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { event } from '~~/server/db/schema.app'

describe('app schema', () => {
  let db: ReturnType<typeof drizzle>
  beforeAll(async () => {
    const client = createClient({ url: 'file::memory:' })
    db = drizzle(client)
    await migrate(db, { migrationsFolder: './server/db/migrations' })
  })

  it('inserts and reads an event with boolean coercion', async () => {
    const now = 1_700_000_000_000
    await db.insert(event).values({
      id: 'e1', startDate: '2026-06-25', title: 'World Vitiligo Day',
      color: 'sage', isHighlight: true, isPublic: true, createdAt: now, updatedAt: now
    })
    const rows = await db.select().from(event)
    expect(rows).toHaveLength(1)
    expect(rows[0].isPublic).toBe(true)
    expect(rows[0].title).toBe('World Vitiligo Day')
  })
})
```

- [ ] **Step 14: Run test — verify it passes** (migration already generated in Step 11)

Run: `npm test -- tests/db/schema.test.ts`
Expected: PASS. If FAIL on missing migrations folder, re-run Step 11.

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "feat(db): Drizzle/libSQL client + event & month_block schema + tooling"
```

---

## Task 2: Better Auth instance, schema, handler, seed

**Files:**
- Create: `lib/auth.ts`, `lib/auth-client.ts`
- Create: `server/api/auth/[...all].ts`
- Create: `server/utils/requireAdmin.ts`
- Replace: `server/db/schema.auth.ts` (CLI-generated)
- Create: `server/plugins/migrate.ts`
- Modify: `nuxt.config.ts` (runtimeConfig), `package.json` (better-auth deps)
- Test: `tests/server/requireAdmin.test.ts`

**Interfaces:**
- Consumes: `db` from `server/db/client.ts`.
- Produces:
  - `lib/auth.ts`: `export const auth` (Better Auth instance).
  - `server/utils/requireAdmin.ts`: `export async function requireAdmin(event: H3Event): Promise<{ userId: string }>` — throws `createError({ statusCode: 401 })` when no valid session.
  - `server/plugins/migrate.ts`: runs `runMigrations()` then seeds an admin user from env on first boot.

- [ ] **Step 1: Install Better Auth**

```bash
npm install better-auth @better-auth/drizzle-adapter
```
(If `@better-auth/drizzle-adapter` is not found for the installed version, the adapter is exported from `better-auth/adapters/drizzle` instead — verify with `node -e "require('better-auth/adapters/drizzle')"` and use whichever import resolves. Record the working import in `lib/auth.ts`.)

- [ ] **Step 2: Write `lib/auth.ts`**

```ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db } from '~~/server/db/client'
import * as schema from '~~/server/db/schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL
})
```

- [ ] **Step 3: Generate the Better Auth Drizzle schema**

Run:
```bash
npx @better-auth/cli@latest generate --output server/db/schema.auth.ts -y
```
Expected: `server/db/schema.auth.ts` now exports `user`, `session`, `account`, `verification` Drizzle tables. (If the CLI cannot resolve `lib/auth.ts`, pass `--config lib/auth.ts`.) Review the file; ensure it imports from `drizzle-orm/sqlite-core`.

- [ ] **Step 4: Regenerate migrations to include auth tables**

Run:
```bash
npm run db:generate
```
Expected: a new migration file adding `user`/`session`/`account`/`verification`. Commit it.

- [ ] **Step 5: Write `server/api/auth/[...all].ts`**

```ts
import { auth } from '~~/lib/auth'

export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event))
})
```

- [ ] **Step 6: Write `lib/auth-client.ts`**

```ts
import { createAuthClient } from 'better-auth/vue'

export const authClient = createAuthClient()
export const { signIn, signOut, useSession } = authClient
```

- [ ] **Step 7: Write `server/utils/requireAdmin.ts`**

```ts
import type { H3Event } from 'h3'
import { auth } from '~~/lib/auth'

export async function requireAdmin(event: H3Event): Promise<{ userId: string }> {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return { userId: session.user.id }
}
```

- [ ] **Step 8: Write `server/plugins/migrate.ts`** (startup migrate + seed)

```ts
import { runMigrations } from '~~/server/db/migrate'
import { auth } from '~~/lib/auth'

export default defineNitroPlugin(async () => {
  await runMigrations()

  const email = process.env.ADMIN_SEED_EMAIL
  const password = process.env.ADMIN_SEED_PASSWORD
  if (!email || !password) return

  // Seed the first admin only if no users exist yet.
  const { db } = await import('~~/server/db/client')
  const { user } = await import('~~/server/db/schema')
  const existing = await db.select().from(user).limit(1)
  if (existing.length > 0) return

  try {
    await auth.api.signUpEmail({ body: { email, password, name: 'Our Village Admin' } })
    console.log(`[seed] created initial admin ${email}`)
  } catch (e) {
    console.error('[seed] admin creation failed', e)
  }
})
```

- [ ] **Step 9: Add runtimeConfig + env to `nuxt.config.ts`**

Add inside `defineNuxtConfig({ ... })`:
```ts
runtimeConfig: {
  // server-only secrets read from env: DATABASE_URL, BETTER_AUTH_SECRET,
  // BETTER_AUTH_URL, ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD
  public: {
    // ...existing public keys stay...
  }
},
nitro: {
  preset: 'node-server'
}
```
(Keep existing `runtimeConfig.public` keys; Better Auth reads its own env vars directly.)

- [ ] **Step 10: Write `tests/server/requireAdmin.test.ts`** (failing first)

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getSession = vi.fn()
vi.mock('~~/lib/auth', () => ({ auth: { api: { getSession } } }))
// h3 auto-imports: provide createError global
;(globalThis as any).createError = (o: any) => Object.assign(new Error(o.statusMessage), o)

import { requireAdmin } from '~~/server/utils/requireAdmin'

describe('requireAdmin', () => {
  beforeEach(() => getSession.mockReset())

  it('throws 401 when no session', async () => {
    getSession.mockResolvedValue(null)
    await expect(requireAdmin({ headers: new Headers() } as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns userId when session valid', async () => {
    getSession.mockResolvedValue({ user: { id: 'u1' } })
    await expect(requireAdmin({ headers: new Headers() } as any)).resolves.toEqual({ userId: 'u1' })
  })
})
```

- [ ] **Step 11: Run test — verify pass**

Run: `npm test -- tests/server/requireAdmin.test.ts`
Expected: PASS (both cases).

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(auth): Better Auth (Drizzle/sqlite) + handler + requireAdmin + startup migrate/seed"
```

---

## Task 3: Calendar repository (query helpers)

**Files:**
- Create: `server/utils/calendarRepo.ts`
- Test: `tests/db/calendarRepo.test.ts`

**Interfaces:**
- Consumes: `db`, `event`, `monthBlock` from schema; `monthRange` from `shared/calendar.ts`.
- Produces (`server/utils/calendarRepo.ts`):
  - `getMonth(year:number, month:number, opts?:{ publicOnly?:boolean }): Promise<{ events: EventSelect[]; blocks: MonthBlockSelect[] }>` — events whose `[startDate, endDate||startDate]` intersect the month; blocks for that year+month; when `publicOnly`, filter `isPublic`.
  - `listEvents(opts?:{ publicOnly?:boolean }): Promise<EventSelect[]>` — ordered `startDate` DESC (current→oldest).
  - `createEvent(input)`, `updateEvent(id, patch)`, `deleteEvent(id)`.
  - `createBlock(input)`, `updateBlock(id, patch)`, `deleteBlock(id)`.
  - id generation via `crypto.randomUUID()`; timestamps via `Date.now()`.

- [ ] **Step 1: Write `tests/db/calendarRepo.test.ts`** (failing)

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

// Inject a fresh in-memory db per test via module mock of the client.
let db: any
vi.mock('~~/server/db/client', () => ({ get db() { return db }, schema: {} }))
import { vi } from 'vitest'
import * as schema from '~~/server/db/schema'
import { getMonth, listEvents, createEvent } from '~~/server/utils/calendarRepo'

beforeEach(async () => {
  const client = createClient({ url: 'file::memory:' })
  db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder: './server/db/migrations' })
})

describe('calendarRepo', () => {
  it('getMonth returns only public events when publicOnly', async () => {
    await createEvent({ startDate: '2026-06-05', title: 'Public day', isPublic: true })
    await createEvent({ startDate: '2026-06-06', title: 'Private day', isPublic: false })
    const pub = await getMonth(2026, 6, { publicOnly: true })
    expect(pub.events.map(e => e.title)).toEqual(['Public day'])
    const all = await getMonth(2026, 6)
    expect(all.events).toHaveLength(2)
  })

  it('getMonth includes events whose range overlaps the month', async () => {
    await createEvent({ startDate: '2026-05-30', endDate: '2026-06-02', title: 'Spanning week', isPublic: true })
    const june = await getMonth(2026, 6, { publicOnly: true })
    expect(june.events.map(e => e.title)).toContain('Spanning week')
  })

  it('listEvents orders newest first', async () => {
    await createEvent({ startDate: '2026-01-01', title: 'Old', isPublic: true })
    await createEvent({ startDate: '2026-06-01', title: 'New', isPublic: true })
    const list = await listEvents({ publicOnly: true })
    expect(list.map(e => e.title)).toEqual(['New', 'Old'])
  })
})
```

- [ ] **Step 2: Run — verify fail** (`getMonth` not defined)

Run: `npm test -- tests/db/calendarRepo.test.ts`
Expected: FAIL (module not found / not a function).

- [ ] **Step 3: Write `server/utils/calendarRepo.ts`**

```ts
import { and, or, eq, gte, lte, desc } from 'drizzle-orm'
import { db } from '~~/server/db/client'
import { event, monthBlock } from '~~/server/db/schema'
import type { EventInsert, MonthBlockInsert } from '~~/server/db/schema'
import { monthRange } from '~~/shared/calendar'

const now = () => Date.now()
const id = () => crypto.randomUUID()

export async function getMonth(year: number, month: number, opts: { publicOnly?: boolean } = {}) {
  const { start, end } = monthRange(year, month)
  // overlap: event.startDate <= monthEnd AND (event.endDate ?? startDate) >= monthStart
  const overlap = and(
    lte(event.startDate, end),
    gte(/* coalesce */ event.endDate ?? event.startDate as any, start)
  )
  // Drizzle can't coalesce inline cleanly; use OR for null endDate.
  const eventWhere = and(
    lte(event.startDate, end),
    or(
      and(eq(event.endDate, null as any)), // handled below
      gte(event.endDate, start)
    )
  )
  // Simpler & correct: fetch by startDate<=end and (endDate is null OR endDate>=start)
  const events = (await db.select().from(event)
    .where(and(lte(event.startDate, end))))
    .filter(e => (e.endDate ?? e.startDate) >= start)
    .filter(e => (opts.publicOnly ? e.isPublic : true))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  let blocksQ = db.select().from(monthBlock)
    .where(and(eq(monthBlock.year, year), eq(monthBlock.month, month)))
  let blocks = (await blocksQ)
    .filter(b => (opts.publicOnly ? b.isPublic : true))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return { events, blocks }
}

export async function listEvents(opts: { publicOnly?: boolean } = {}) {
  const rows = await db.select().from(event).orderBy(desc(event.startDate))
  return opts.publicOnly ? rows.filter(e => e.isPublic) : rows
}

export async function createEvent(input: Partial<EventInsert> & { startDate: string; title: string }) {
  const row: EventInsert = {
    id: id(), startDate: input.startDate, endDate: input.endDate ?? null,
    title: input.title, detail: input.detail ?? null, staff: input.staff ?? null,
    color: input.color ?? 'default', isHighlight: input.isHighlight ?? false,
    isPublic: input.isPublic ?? false, createdAt: now(), updatedAt: now()
  }
  await db.insert(event).values(row)
  return row
}

export async function updateEvent(eventId: string, patch: Partial<EventInsert>) {
  await db.update(event).set({ ...patch, updatedAt: now() }).where(eq(event.id, eventId))
}

export async function deleteEvent(eventId: string) {
  await db.delete(event).where(eq(event.id, eventId))
}

export async function createBlock(input: Partial<MonthBlockInsert> & { year: number; month: number; section: string; text: string }) {
  const row: MonthBlockInsert = {
    id: id(), year: input.year, month: input.month, section: input.section,
    text: input.text, color: input.color ?? 'default', sortOrder: input.sortOrder ?? 0,
    isPublic: input.isPublic ?? false, createdAt: now(), updatedAt: now()
  }
  await db.insert(monthBlock).values(row)
  return row
}

export async function updateBlock(blockId: string, patch: Partial<MonthBlockInsert>) {
  await db.update(monthBlock).set({ ...patch, updatedAt: now() }).where(eq(monthBlock.id, blockId))
}

export async function deleteBlock(blockId: string) {
  await db.delete(monthBlock).where(eq(monthBlock.id, blockId))
}
```
> Note: the overlap filter is done in JS after a coarse `startDate <= end` SQL filter to keep the null-`endDate` logic simple and correct. Remove the dead `overlap`/`eventWhere` locals during implementation (left here to document the SQL intent) — final code keeps only the working `events` query.

- [ ] **Step 4: Run — verify pass**

Run: `npm test -- tests/db/calendarRepo.test.ts`
Expected: PASS (3 tests). Fix the overlap/JS filter until green; delete dead locals.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(db): calendarRepo query + CRUD helpers with public filtering"
```

---

## Task 4: Server API routes (public + admin)

**Files:**
- Create: `server/api/calendar/month.get.ts`, `server/api/calendar/events.get.ts`
- Create: `server/api/admin/month.get.ts`
- Create: `server/api/admin/event.post.ts`, `event.patch.ts`, `event.delete.ts`
- Create: `server/api/admin/block.post.ts`, `block.patch.ts`, `block.delete.ts`
- Test: `tests/server/api.guard.test.ts`

**Interfaces:**
- Consumes: `calendarRepo` functions; `requireAdmin`.
- Produces HTTP endpoints. Admin write bodies: event `{ id?, startDate, endDate?, title, detail?, staff?, color?, isHighlight?, isPublic? }`; block `{ id?, year, month, section, text, color?, sortOrder?, isPublic? }`. Delete bodies `{ id }`.

- [ ] **Step 1: Public month endpoint `server/api/calendar/month.get.ts`**

```ts
import { getMonth } from '~~/server/utils/calendarRepo'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const year = Number(q.year)
  const month = Number(q.month)
  if (!year || !month) throw createError({ statusCode: 400, statusMessage: 'year and month required' })
  return await getMonth(year, month, { publicOnly: true })
})
```

- [ ] **Step 2: Public events list `server/api/calendar/events.get.ts`**

```ts
import { listEvents } from '~~/server/utils/calendarRepo'
export default defineEventHandler(async () => {
  return await listEvents({ publicOnly: true })
})
```

- [ ] **Step 3: Admin month `server/api/admin/month.get.ts`**

```ts
import { getMonth } from '~~/server/utils/calendarRepo'
import { requireAdmin } from '~~/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const q = getQuery(event)
  return await getMonth(Number(q.year), Number(q.month))
})
```

- [ ] **Step 4: Admin event CRUD**

`server/api/admin/event.post.ts`:
```ts
import { requireAdmin } from '~~/server/utils/requireAdmin'
import { createEvent } from '~~/server/utils/calendarRepo'
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  return await createEvent(body)
})
```
`server/api/admin/event.patch.ts`:
```ts
import { requireAdmin } from '~~/server/utils/requireAdmin'
import { updateEvent } from '~~/server/utils/calendarRepo'
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const { id, ...patch } = body
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  await updateEvent(id, patch)
  return { ok: true }
})
```
`server/api/admin/event.delete.ts`:
```ts
import { requireAdmin } from '~~/server/utils/requireAdmin'
import { deleteEvent } from '~~/server/utils/calendarRepo'
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { id } = await readBody(event)
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  await deleteEvent(id)
  return { ok: true }
})
```

- [ ] **Step 5: Admin block CRUD** (mirror event CRUD with `createBlock`/`updateBlock`/`deleteBlock` in `block.post.ts`/`block.patch.ts`/`block.delete.ts`; each calls `requireAdmin` first)

`server/api/admin/block.post.ts`:
```ts
import { requireAdmin } from '~~/server/utils/requireAdmin'
import { createBlock } from '~~/server/utils/calendarRepo'
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  return await createBlock(body)
})
```
`server/api/admin/block.patch.ts`:
```ts
import { requireAdmin } from '~~/server/utils/requireAdmin'
import { updateBlock } from '~~/server/utils/calendarRepo'
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { id, ...patch } = await readBody(event)
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  await updateBlock(id, patch)
  return { ok: true }
})
```
`server/api/admin/block.delete.ts`:
```ts
import { requireAdmin } from '~~/server/utils/requireAdmin'
import { deleteBlock } from '~~/server/utils/calendarRepo'
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { id } = await readBody(event)
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  await deleteBlock(id)
  return { ok: true }
})
```

- [ ] **Step 6: Guard smoke test `tests/server/api.guard.test.ts`**

This verifies the admin handlers call `requireAdmin` before touching the repo. Test the handler-level wiring by importing the handler module with mocks:
```ts
import { describe, it, expect, vi } from 'vitest'
const requireAdmin = vi.fn()
const createEvent = vi.fn().mockResolvedValue({ id: 'x' })
vi.mock('~~/server/utils/requireAdmin', () => ({ requireAdmin }))
vi.mock('~~/server/utils/calendarRepo', () => ({ createEvent }))
;(globalThis as any).defineEventHandler = (fn: any) => fn
;(globalThis as any).readBody = async () => ({ startDate: '2026-06-01', title: 'X' })
;(globalThis as any).createError = (o: any) => Object.assign(new Error(o.statusMessage), o)

import handler from '~~/server/api/admin/event.post'

describe('admin event.post', () => {
  it('calls requireAdmin before createEvent', async () => {
    const order: string[] = []
    requireAdmin.mockImplementation(async () => { order.push('guard') })
    createEvent.mockImplementation(async () => { order.push('create'); return { id: 'x' } })
    await handler({} as any)
    expect(order).toEqual(['guard', 'create'])
  })
})
```

- [ ] **Step 7: Run — verify pass**

Run: `npm test -- tests/server/api.guard.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(api): public calendar reads + guarded admin CRUD endpoints"
```

---

## Task 5: Calendar design system + shared render components

**Files:**
- Modify: `nuxt.config.ts` (add script font to Google Fonts link), `assets/css/main.css`
- Create: `components/calendar/CalendarMonthNav.vue`, `CalendarDayCell.vue`, `CalendarGrid.vue`, `CalendarSidebar.vue`
- Create: `composables/useCalendar.ts`
- Test: visual (verified in Task 11 browser pass) + a unit test for grid date math in `tests/calendar/grid.test.ts`

**Interfaces:**
- Consumes: `EventRow`, `BlockRow`, `BLOCK_SECTIONS`, `ymd` from `shared/calendar.ts`.
- Produces:
  - `useCalendar.ts`: `useMonthName(month:number):string`; `buildWeeks(year:number, month:number): { date: string|null }[][]` (6×7 grid, leading/trailing blanks as `null`); `eventsForDay(events, date)`; `blocksBySection(blocks)`.
  - `CalendarGrid.vue` props: `{ year:number; month:number; events:EventRow[]; editable?:boolean }`; emits `@day-click(date:string)` when `editable`.
  - `CalendarDayCell.vue` props: `{ date:string|null; events:EventRow[]; editable?:boolean }`.
  - `CalendarSidebar.vue` props: `{ blocks:BlockRow[]; editable?:boolean }`.
  - `CalendarMonthNav.vue` props: `{ year:number; month:number }`; emits `@prev`, `@next`.

- [ ] **Step 1: Add the script font**

In `nuxt.config.ts`, change the Google Fonts `href` to also load a script face:
```
https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&family=Source+Sans+3:wght@400;500;600;700&family=Pinyon+Script&display=swap
```

- [ ] **Step 2: Add font token + calendar utilities to `assets/css/main.css`**

Append:
```css
@theme {
  --font-script: "Pinyon Script", "Segoe Script", cursive;
}
@utility font-script { font-family: var(--font-script); }
@utility cal-daylabel { @apply text-center font-display font-bold tracking-[0.25em] text-base-content/80 uppercase; }
```

- [ ] **Step 3: Write `composables/useCalendar.ts`**

```ts
import type { EventRow, BlockRow, BlockSection } from '~~/shared/calendar'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
export const useMonthName = (month: number) => MONTHS[month - 1] ?? ''

export function buildWeeks(year: number, month: number): ({ date: string | null })[][] {
  const first = new Date(year, month - 1, 1)
  const startDow = first.getDay() // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: ({ date: string | null })[] = []
  for (let i = 0; i < startDow; i++) cells.push({ date: null })
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}` })
  }
  while (cells.length % 7 !== 0) cells.push({ date: null })
  const weeks: ({ date: string | null })[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export function eventsForDay(events: EventRow[], date: string): EventRow[] {
  return events.filter(e => date >= e.startDate && date <= (e.endDate ?? e.startDate))
}

export function blocksBySection(blocks: BlockRow[]): Record<BlockSection, BlockRow[]> {
  const out = { important_dates: [], hot_topics: [], focus: [], training: [] } as Record<BlockSection, BlockRow[]>
  for (const b of blocks) out[b.section]?.push(b)
  for (const k of Object.keys(out) as BlockSection[]) out[k].sort((a,b)=>a.sortOrder-b.sortOrder)
  return out
}

const COLOR_CLASS: Record<string,string> = {
  sage: 'text-primary', pink: 'text-accent', red: 'text-error', default: 'text-base-content'
}
export const colorClass = (c?: string) => COLOR_CLASS[c ?? 'default'] ?? COLOR_CLASS.default
```

- [ ] **Step 4: Write `tests/calendar/grid.test.ts`** (date math)

```ts
import { describe, it, expect } from 'vitest'
import { buildWeeks, eventsForDay } from '~~/composables/useCalendar'

describe('buildWeeks', () => {
  it('June 2026 starts on Monday and has 30 days', () => {
    const weeks = buildWeeks(2026, 6)
    expect(weeks[0][0].date).toBeNull() // Sunday blank (June 1 2026 is Monday)
    expect(weeks[0][1].date).toBe('2026-06-01')
    const days = weeks.flat().filter(c => c.date).length
    expect(days).toBe(30)
  })
})

describe('eventsForDay', () => {
  it('matches ranges inclusively', () => {
    const ev = [{ startDate:'2026-06-02', endDate:'2026-06-06', title:'Week' } as any]
    expect(eventsForDay(ev, '2026-06-04')).toHaveLength(1)
    expect(eventsForDay(ev, '2026-06-07')).toHaveLength(0)
  })
})
```

- [ ] **Step 5: Run — verify pass**

Run: `npm test -- tests/calendar/grid.test.ts`
Expected: PASS.

- [ ] **Step 6: Write `CalendarMonthNav.vue`**

```vue
<script setup lang="ts">
import { useMonthName } from '~~/composables/useCalendar'
const props = defineProps<{ year: number; month: number }>()
defineEmits<{ prev: []; next: [] }>()
</script>
<template>
  <div class="flex items-center justify-center gap-4">
    <button class="btn btn-ghost btn-sm" @click="$emit('prev')" aria-label="Previous month">‹</button>
    <h2 class="font-script text-5xl leading-none text-secondary">{{ useMonthName(month) }} {{ year }}</h2>
    <button class="btn btn-ghost btn-sm" @click="$emit('next')" aria-label="Next month">›</button>
  </div>
</template>
```

- [ ] **Step 7: Write `CalendarDayCell.vue`**

```vue
<script setup lang="ts">
import type { EventRow } from '~~/shared/calendar'
import { colorClass } from '~~/composables/useCalendar'
const props = defineProps<{ date: string | null; events: EventRow[]; editable?: boolean }>()
const dayNum = (d: string) => Number(d.slice(-2))
const highlighted = computed(() => props.events.some(e => e.isHighlight))
</script>
<template>
  <div
    class="relative min-h-[92px] border border-base-300 p-1.5 text-[11px] leading-tight"
    :class="[editable && date ? 'cursor-pointer hover:bg-base-200/60' : '']"
  >
    <div v-if="date" class="mb-1 flex items-center justify-between">
      <span class="font-display font-bold text-base-content/80">{{ dayNum(date) }}</span>
      <span v-if="highlighted" class="absolute right-1 top-1 h-7 w-7 rounded-full bg-primary/55"></span>
    </div>
    <ul class="relative space-y-0.5">
      <li v-for="e in events" :key="e.id" :class="colorClass(e.color)">
        <span :class="e.detail ? 'font-semibold' : ''">{{ e.title }}</span>
        <span v-if="!e.isPublic && editable" class="ml-1 text-[9px] uppercase text-base-content/40">(private)</span>
      </li>
    </ul>
  </div>
</template>
```

- [ ] **Step 8: Write `CalendarGrid.vue`**

```vue
<script setup lang="ts">
import type { EventRow } from '~~/shared/calendar'
import { buildWeeks, eventsForDay } from '~~/composables/useCalendar'
const props = defineProps<{ year: number; month: number; events: EventRow[]; editable?: boolean }>()
const emit = defineEmits<{ 'day-click': [date: string] }>()
const weeks = computed(() => buildWeeks(props.year, props.month))
const labels = ['SUN','MON','TUE','WED','THU','FRI','SAT']
</script>
<template>
  <div class="overflow-x-auto">
    <div class="min-w-[680px]">
      <div class="grid grid-cols-7 border-b-2 border-base-content/70 py-2">
        <div v-for="l in labels" :key="l" class="cal-daylabel text-xs">{{ l }}</div>
      </div>
      <div v-for="(week, wi) in weeks" :key="wi" class="grid grid-cols-7">
        <CalendarDayCell
          v-for="(cell, ci) in week" :key="ci"
          :date="cell.date"
          :events="cell.date ? eventsForDay(events, cell.date) : []"
          :editable="editable"
          @click="cell.date && editable ? emit('day-click', cell.date) : null"
        />
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 9: Write `CalendarSidebar.vue`**

```vue
<script setup lang="ts">
import type { BlockRow } from '~~/shared/calendar'
import { blocksBySection, colorClass } from '~~/composables/useCalendar'
const props = defineProps<{ blocks: BlockRow[]; editable?: boolean }>()
const grouped = computed(() => blocksBySection(props.blocks))
</script>
<template>
  <aside class="space-y-6">
    <div>
      <h3 class="font-script text-4xl text-secondary">Important dates:</h3>
      <ul class="mt-2 space-y-1 text-sm">
        <li v-for="b in grouped.important_dates" :key="b.id" :class="colorClass(b.color)">{{ b.text }}</li>
      </ul>
    </div>
    <div>
      <div class="inline-block rounded-full bg-primary px-6 py-2 font-display font-bold tracking-[0.2em] text-primary-content">HOT TOPICS:</div>
      <ul class="mt-3 space-y-1 text-sm">
        <li v-for="b in grouped.hot_topics" :key="b.id">{{ b.text }}</li>
      </ul>
      <ul class="mt-3 space-y-1 text-sm font-semibold">
        <li v-for="b in grouped.focus" :key="b.id" :class="colorClass(b.color)">• {{ b.text }}</li>
      </ul>
    </div>
  </aside>
</template>
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(ui): calendar design system + shared grid/sidebar/nav components"
```

---

## Task 6: Public pages (`/calendar`, `/calendar/events`) + nav

**Files:**
- Create: `pages/calendar/index.vue`, `pages/calendar/events.vue`
- Modify: `components/AppHeader.vue` (add nav link)

**Interfaces:**
- Consumes: public endpoints `/api/calendar/month`, `/api/calendar/events`; shared components; `CalendarMonthNav`, `CalendarGrid`, `CalendarSidebar`; training block rendered above the grid.

- [ ] **Step 1: `pages/calendar/index.vue`**

```vue
<script setup lang="ts">
import type { EventRow, BlockRow } from '~~/shared/calendar'
const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const { data, refresh } = await useFetch<{ events: EventRow[]; blocks: BlockRow[] }>('/api/calendar/month', {
  query: { year, month }
})
function prev() { if (month.value === 1) { month.value = 12; year.value-- } else month.value--; refresh() }
function next() { if (month.value === 12) { month.value = 1; year.value++ } else month.value++; refresh() }
const training = computed(() => (data.value?.blocks ?? []).filter(b => b.section === 'training'))
useHead({ title: 'Calendar — Our Village' })
</script>
<template>
  <section class="container-px section-y">
    <div class="mb-6 flex items-center justify-between">
      <img src="/logo.png" alt="Our Village" class="h-12 w-auto" />
      <CalendarMonthNav :year="year" :month="month" @prev="prev" @next="next" />
      <NuxtLink to="/calendar/events" class="btn btn-ghost btn-sm">All events ›</NuxtLink>
    </div>
    <p v-if="training.length" class="mb-3 text-sm font-semibold text-error">
      <span v-for="t in training" :key="t.id">● {{ t.text }} </span>
    </p>
    <div class="grid gap-8 lg:grid-cols-[1fr_320px]">
      <CalendarGrid :year="year" :month="month" :events="data?.events ?? []" />
      <CalendarSidebar :blocks="data?.blocks ?? []" />
    </div>
  </section>
</template>
```

- [ ] **Step 2: `pages/calendar/events.vue`**

```vue
<script setup lang="ts">
import type { EventRow } from '~~/shared/calendar'
import { colorClass } from '~~/composables/useCalendar'
const { data } = await useFetch<EventRow[]>('/api/calendar/events')
useHead({ title: 'All events — Our Village' })
const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
</script>
<template>
  <section class="container-px section-y">
    <h1 class="font-script text-5xl text-secondary">Events</h1>
    <ul class="mt-8 divide-y divide-base-200">
      <li v-for="e in data ?? []" :key="e.id" class="flex gap-4 py-4">
        <span class="w-40 shrink-0 text-sm text-base-content/60">{{ fmt(e.startDate) }}</span>
        <div>
          <p class="font-semibold" :class="colorClass(e.color)">{{ e.title }}</p>
          <p v-if="e.detail" class="text-sm text-base-content/70">{{ e.detail }}</p>
        </div>
      </li>
    </ul>
  </section>
</template>
```

- [ ] **Step 3: Add nav link in `components/AppHeader.vue`**

Add `{ label: 'Calendar', to: '/calendar' }` to the `links` array (after "Our Team").

- [ ] **Step 4: Manual dev check**

Run: `npm run dev`, open `http://localhost:3000/calendar`. Expected: grid renders current month (empty until data exists), month nav works, no console errors. (Data appears after Task 8 admin entry or a seed.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(public): /calendar grid + /calendar/events list + nav link"
```

---

## Task 7: Admin auth gate (login page + middleware)

**Files:**
- Create: `pages/village-desk/index.vue` (login + planner shell; planner filled in Task 8)
- Create: `middleware/admin.ts`
- Test: none (covered by browser verification Task 11); logic is thin.

**Interfaces:**
- Consumes: `authClient` from `lib/auth-client.ts`.
- Produces: `/village-desk` shows a login form when unauthenticated; authenticated users see the planner (Task 8). `middleware/admin.ts` redirects unauthenticated users of `/village-desk/day/*` back to `/village-desk`.

- [ ] **Step 1: `middleware/admin.ts`**

```ts
import { authClient } from '~~/lib/auth-client'
export default defineNuxtRouteMiddleware(async () => {
  const { data: session } = await authClient.useSession(useFetch)
  if (!session.value) return navigateTo('/village-desk')
})
```

- [ ] **Step 2: `pages/village-desk/index.vue`** (login + placeholder planner)

```vue
<script setup lang="ts">
import { authClient } from '~~/lib/auth-client'
definePageMeta({ layout: false })
const { data: session } = await authClient.useSession(useFetch)
const email = ref(''); const password = ref(''); const err = ref('')
async function login() {
  err.value = ''
  const { error } = await authClient.signIn.email({ email: email.value, password: password.value })
  if (error) err.value = error.message || 'Login failed'
  else await refreshNuxtData()
}
useHead({ title: 'Village Desk' })
</script>
<template>
  <div class="min-h-screen bg-base-200">
    <div v-if="!session" class="grid min-h-screen place-items-center p-6">
      <form class="w-full max-w-sm space-y-4 rounded-box bg-base-100 p-8 shadow" @submit.prevent="login">
        <h1 class="font-script text-4xl text-secondary">Village Desk</h1>
        <input v-model="email" type="email" placeholder="Email" class="input input-bordered w-full" required />
        <input v-model="password" type="password" placeholder="Password" class="input input-bordered w-full" required />
        <p v-if="err" class="text-sm text-error">{{ err }}</p>
        <button class="btn btn-primary w-full" type="submit">Sign in</button>
      </form>
    </div>
    <AdminPlanner v-else @signout="authClient.signOut().then(refreshNuxtData)" />
  </div>
</template>
```
(`AdminPlanner` component is created in Task 8; until then, temporarily replace `<AdminPlanner .../>` with `<div class="p-8">Signed in. Planner coming in Task 8. <button class="btn" @click="authClient.signOut().then(refreshNuxtData)">Sign out</button></div>` so the page compiles.)

- [ ] **Step 3: Manual check**

Run `npm run dev` with `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` set in a local `.env`; visit `/village-desk`, log in with the seeded creds. Expected: login succeeds, placeholder shows; refresh keeps session; sign out returns to login.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(admin): /village-desk login + auth middleware"
```

---

## Task 8: Admin planner (editable month + sidebar editors)

**Files:**
- Create: `components/calendar/BlockListEditor.vue`
- Create: `components/admin/AdminPlanner.vue`
- Modify: `pages/village-desk/index.vue` (use real `AdminPlanner`)

**Interfaces:**
- Consumes: `/api/admin/month`, `/api/admin/block` CRUD, `/api/admin/event` PATCH (for publish toggle from grid); `CalendarGrid` (editable), `CalendarMonthNav`.
- Produces: `AdminPlanner.vue` — month nav + editable grid (`@day-click` → navigate to day edit) + four `BlockListEditor` sections + sign-out. `BlockListEditor.vue` props `{ year, month, section, items }`, emits `@changed` to refetch.

- [ ] **Step 1: `components/calendar/BlockListEditor.vue`**

```vue
<script setup lang="ts">
import type { BlockRow, BlockSection } from '~~/shared/calendar'
import { COLOR_TOKENS, BLOCK_SECTION_LABELS } from '~~/shared/calendar'
const props = defineProps<{ year: number; month: number; section: BlockSection; items: BlockRow[] }>()
const emit = defineEmits<{ changed: [] }>()
const newText = ref('')
async function add() {
  if (!newText.value.trim()) return
  await $fetch('/api/admin/block', { method: 'POST', body: {
    year: props.year, month: props.month, section: props.section,
    text: newText.value, sortOrder: props.items.length, isPublic: false
  }})
  newText.value = ''; emit('changed')
}
async function patch(b: BlockRow, p: Partial<BlockRow>) {
  await $fetch('/api/admin/block', { method: 'PATCH', body: { id: b.id, ...p } }); emit('changed')
}
async function remove(b: BlockRow) {
  await $fetch('/api/admin/block', { method: 'DELETE', body: { id: b.id } }); emit('changed')
}
</script>
<template>
  <div class="rounded-box bg-base-100 p-4">
    <h4 class="font-display font-bold text-secondary">{{ BLOCK_SECTION_LABELS[section] }}</h4>
    <ul class="mt-2 space-y-2">
      <li v-for="b in items" :key="b.id" class="flex items-center gap-2">
        <input class="input input-bordered input-sm flex-1" :value="b.text" @change="patch(b, { text: ($event.target as HTMLInputElement).value })" />
        <select class="select select-bordered select-sm" :value="b.color" @change="patch(b, { color: ($event.target as HTMLSelectElement).value as any })">
          <option v-for="c in COLOR_TOKENS" :key="c" :value="c">{{ c }}</option>
        </select>
        <label class="flex items-center gap-1 text-xs">
          <input type="checkbox" class="toggle toggle-primary toggle-sm" :checked="b.isPublic" @change="patch(b, { isPublic: ($event.target as HTMLInputElement).checked })" />
          public
        </label>
        <button class="btn btn-ghost btn-xs text-error" @click="remove(b)">✕</button>
      </li>
    </ul>
    <div class="mt-2 flex gap-2">
      <input v-model="newText" class="input input-bordered input-sm flex-1" placeholder="Add item…" @keyup.enter="add" />
      <button class="btn btn-primary btn-sm" @click="add">Add</button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: `components/admin/AdminPlanner.vue`**

```vue
<script setup lang="ts">
import type { EventRow, BlockRow, BlockSection } from '~~/shared/calendar'
import { BLOCK_SECTIONS } from '~~/shared/calendar'
import { blocksBySection } from '~~/composables/useCalendar'
defineEmits<{ signout: [] }>()
const now = new Date()
const year = ref(now.getFullYear()); const month = ref(now.getMonth() + 1)
const { data, refresh } = await useFetch<{ events: EventRow[]; blocks: BlockRow[] }>('/api/admin/month', { query: { year, month } })
function prev() { if (month.value===1){month.value=12;year.value--}else month.value--; refresh() }
function next() { if (month.value===12){month.value=1;year.value++}else month.value++; refresh() }
const grouped = computed(() => blocksBySection(data.value?.blocks ?? []))
const sections = BLOCK_SECTIONS as BlockSection[]
function openDay(date: string) { navigateTo(`/village-desk/day/${date}`) }
</script>
<template>
  <div class="container-px py-8">
    <div class="mb-6 flex items-center justify-between">
      <CalendarMonthNav :year="year" :month="month" @prev="prev" @next="next" />
      <button class="btn btn-ghost btn-sm" @click="$emit('signout')">Sign out</button>
    </div>
    <div class="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <p class="mb-2 text-sm text-base-content/60">Click a day to add or edit events.</p>
        <CalendarGrid :year="year" :month="month" :events="data?.events ?? []" editable @day-click="openDay" />
      </div>
      <div class="space-y-4">
        <BlockListEditor v-for="s in sections" :key="s" :year="year" :month="month" :section="s" :items="grouped[s]" @changed="refresh" />
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Wire real planner into `pages/village-desk/index.vue`** (replace the Task 7 placeholder with `<AdminPlanner @signout="authClient.signOut().then(refreshNuxtData)" />`).

- [ ] **Step 4: Manual check**

`npm run dev`, log in, add an "Important dates" bullet, toggle it public, change month back/forward. Expected: items persist (GET re-fetch shows them), toggle saves.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(admin): planner with editable grid + sidebar block editors"
```

---

## Task 9: Day edit page (`/village-desk/day/[date]`)

**Files:**
- Create: `components/calendar/EventEditForm.vue`
- Create: `pages/village-desk/day/[date].vue`

**Interfaces:**
- Consumes: `/api/admin/month` (to list that day's events), `/api/admin/event` CRUD; `middleware/admin`.
- Produces: a page listing the date's events with add/edit/delete + publish/highlight/colour controls.

- [ ] **Step 1: `components/calendar/EventEditForm.vue`**

```vue
<script setup lang="ts">
import type { EventRow } from '~~/shared/calendar'
import { COLOR_TOKENS } from '~~/shared/calendar'
const props = defineProps<{ date: string; model?: EventRow | null }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()
const f = reactive({
  id: props.model?.id, startDate: props.model?.startDate ?? props.date,
  endDate: props.model?.endDate ?? '', title: props.model?.title ?? '',
  detail: props.model?.detail ?? '', staff: props.model?.staff ?? '',
  color: props.model?.color ?? 'default', isHighlight: props.model?.isHighlight ?? false,
  isPublic: props.model?.isPublic ?? false
})
async function save() {
  const body = { ...f, endDate: f.endDate || null }
  if (f.id) await $fetch('/api/admin/event', { method: 'PATCH', body })
  else await $fetch('/api/admin/event', { method: 'POST', body })
  emit('saved')
}
</script>
<template>
  <form class="space-y-3 rounded-box bg-base-100 p-4" @submit.prevent="save">
    <input v-model="f.title" class="input input-bordered w-full" placeholder="Title" required />
    <input v-model="f.detail" class="input input-bordered w-full" placeholder="Detail (optional)" />
    <input v-model="f.staff" class="input input-bordered w-full" placeholder="Staff (optional, internal)" />
    <div class="flex gap-3">
      <label class="text-sm">Start <input v-model="f.startDate" type="date" class="input input-bordered input-sm" /></label>
      <label class="text-sm">End <input v-model="f.endDate" type="date" class="input input-bordered input-sm" /></label>
      <select v-model="f.color" class="select select-bordered select-sm"><option v-for="c in COLOR_TOKENS" :key="c" :value="c">{{ c }}</option></select>
    </div>
    <div class="flex gap-4">
      <label class="flex items-center gap-2 text-sm"><input v-model="f.isHighlight" type="checkbox" class="checkbox checkbox-sm" /> Highlight dot</label>
      <label class="flex items-center gap-2 text-sm"><input v-model="f.isPublic" type="checkbox" class="toggle toggle-primary toggle-sm" /> Show on public site</label>
    </div>
    <div class="flex gap-2">
      <button class="btn btn-primary btn-sm" type="submit">Save</button>
      <button class="btn btn-ghost btn-sm" type="button" @click="$emit('cancel')">Cancel</button>
    </div>
  </form>
</template>
```

- [ ] **Step 2: `pages/village-desk/day/[date].vue`**

```vue
<script setup lang="ts">
import type { EventRow, BlockRow } from '~~/shared/calendar'
import { eventsForDay } from '~~/composables/useCalendar'
definePageMeta({ middleware: 'admin', layout: false })
const route = useRoute()
const date = route.params.date as string
const [y, m] = date.split('-').map(Number)
const { data, refresh } = await useFetch<{ events: EventRow[]; blocks: BlockRow[] }>('/api/admin/month', { query: { year: y, month: m } })
const dayEvents = computed(() => eventsForDay(data.value?.events ?? [], date))
const editing = ref<EventRow | null>(null)
const adding = ref(false)
async function del(e: EventRow) { await $fetch('/api/admin/event', { method:'DELETE', body:{ id:e.id } }); refresh() }
function onSaved() { editing.value=null; adding.value=false; refresh() }
useHead({ title: `Edit ${date} — Village Desk` })
</script>
<template>
  <div class="container-px py-8">
    <NuxtLink to="/village-desk" class="btn btn-ghost btn-sm">‹ Back to planner</NuxtLink>
    <h1 class="mt-2 font-script text-4xl text-secondary">{{ date }}</h1>
    <ul class="mt-4 space-y-2">
      <li v-for="e in dayEvents" :key="e.id" class="flex items-center justify-between rounded-box bg-base-100 p-3">
        <span>{{ e.title }} <span v-if="!e.isPublic" class="text-xs text-base-content/40">(private)</span></span>
        <span class="flex gap-2">
          <button class="btn btn-ghost btn-xs" @click="editing = e">Edit</button>
          <button class="btn btn-ghost btn-xs text-error" @click="del(e)">Delete</button>
        </span>
      </li>
    </ul>
    <div class="mt-4">
      <button v-if="!adding && !editing" class="btn btn-primary btn-sm" @click="adding = true">+ Add event</button>
      <EventEditForm v-if="adding" :date="date" @saved="onSaved" @cancel="adding=false" />
      <EventEditForm v-if="editing" :date="date" :model="editing" @saved="onSaved" @cancel="editing=null" />
    </div>
  </div>
</template>
```

- [ ] **Step 3: Manual check**

Log in → planner → click June 25 → add "World Vitiligo Day", mark public + highlight → Save. Back to `/calendar` (public) for June: the event shows with a sage dot. A non-public event does NOT show on `/calendar` but shows on the planner.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(admin): day edit page with event CRUD + publish/highlight toggles"
```

---

## Task 10: Docker persistence + deploy to staging

**Files:**
- Modify: `docker-compose.yml`, `Dockerfile`
- (Deploy via existing staging workflow on push.)

**Interfaces:** persistent `/data` volume; env for DB + auth + seed.

- [ ] **Step 1: Update `docker-compose.yml`**

Add a named volume + env (keep existing `web` service keys):
```yaml
    environment:
      - NODE_ENV=production
      - NITRO_HOST=0.0.0.0
      - NITRO_PORT=3000
      - DATABASE_URL=file:/data/ourvillage.db
      - BETTER_AUTH_URL=${BETTER_AUTH_URL:-https://staging.our-village.co.za}
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - ADMIN_SEED_EMAIL=${ADMIN_SEED_EMAIL}
      - ADMIN_SEED_PASSWORD=${ADMIN_SEED_PASSWORD}
      - NUXT_PUBLIC_WHATSAPP_NUMBER=27798279327
      - NUXT_PUBLIC_WHATSAPP_DEFAULT_TEXT=Hi Our Village, I'd like to book an appointment.
    volumes:
      - ourvillage_data:/data

volumes:
  ourvillage_data:
```

- [ ] **Step 2: Ensure migrations ship in the image**

In `Dockerfile` runtime stage, copy the migrations folder alongside `.output`:
```dockerfile
COPY --from=build /app/.output ./.output
COPY --from=build /app/server/db/migrations ./server/db/migrations
```
(The Nitro plugin reads `./server/db/migrations` at runtime relative to the container workdir `/app`.)

- [ ] **Step 3: Provide secrets to the runner environment**

On the `cloud` host, store `BETTER_AUTH_SECRET`, `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` in an env file the compose reads (e.g. `/opt/ourvillage-web-staging/.env`, git-ignored) — the deploy workflow runs `docker compose` in that dir so it picks up `.env` automatically. Generate the secret: `openssl rand -base64 32`. Do NOT commit secrets.

- [ ] **Step 4: Verify migrations path at runtime**

Confirm the Nitro plugin's `migrationsFolder: './server/db/migrations'` resolves in-container. If Nitro bundles cwd differently, switch the plugin to an absolute path via `process.cwd()`:
```ts
await migrate(db, { migrationsFolder: `${process.cwd()}/server/db/migrations` })
```

- [ ] **Step 5: Commit + push (auto-deploys to staging)**

```bash
git add -A
git commit -m "chore(deploy): persistent /data volume + auth/db env + ship migrations"
git push origin staging
```
Watch: `gh run watch $(gh run list --branch staging -L1 --json databaseId --jq '.[0].databaseId') --exit-status`. Expected: green.

- [ ] **Step 6: Verify container booted + migrated**

`ssh cloud`: `docker logs ourvillage-web-staging --tail 30` shows "migrations applied" and the seed line on first boot. `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8093/calendar` → 200.

---

## Task 11: Cloudflare ZA-only gating for the admin surface

**Files:** none in repo (Cloudflare config via API).

- [ ] **Step 1: Locate token + zone**

Fetch the `cfat_our_village` token from the vault on the glob host (do NOT print it into chat/logs). Find the `our-village.co.za` zone ID via the CF API.

- [ ] **Step 2: Add a WAF custom rule** to the `http_request_firewall_custom` ruleset on the `our-village.co.za` zone:
```
description: ZA-only: Our Village admin (/village-desk)
expression: (http.host contains "our-village.co.za" and ip.geoip.country ne "ZA" and (starts_with(http.request.uri.path, "/village-desk") or starts_with(http.request.uri.path, "/api/admin") or starts_with(http.request.uri.path, "/api/auth")))
action: block
```

- [ ] **Step 3: Verify**

From a ZA IP (or `cdn-cgi/trace` shows `loc=ZA`): `/village-desk` returns the login (200/401-from-app). Simulated non-ZA (or document that a VPN exit in another country) → CF 403. Public `/calendar` is unaffected from anywhere.

- [ ] **Step 4: Record** the rule + zone id in the Hermes `our-wellness-deploy` skill + project memory (no secrets).

---

## Task 12: Full browser verification on staging

**Files:** none (verification only).

- [ ] **Step 1:** Using browser automation against `https://staging.our-village.co.za` (basic-auth creds required), log in at `/village-desk` with the seeded admin.
- [ ] **Step 2:** Create June 2026 content matching the screenshot sample (a few events incl. a highlighted public one; "Important dates" + "Hot Topics" bullets, some public, some not; a training note).
- [ ] **Step 3:** Visit `/calendar` (public) for June 2026; screenshot. Confirm ONLY public items render, highlight dot shows, sidebar shows only public bullets, month nav works.
- [ ] **Step 4:** Visit `/calendar/events`; confirm current→oldest ordering of public events.
- [ ] **Step 5:** Confirm a private event is visible in the planner but absent from public pages.
- [ ] **Step 6:** Redeploy (push a noop) and confirm data persists (volume).
- [ ] **Step 7:** Report results + screenshots to the user.

---

## Self-Review notes

- **Spec coverage:** events + sidebar lists (T1,T3,T8,T9) ✓; publish toggle per item (T8,T9, public filter T3/T4) ✓; `/village-desk` Better Auth (T2,T7) ✓; public `/calendar` + `/calendar/events` (T6) ✓; printed-calendar visual style (T5) ✓; Cloudflare ZA gating (T11) ✓; persistence volume (T10) ✓; browser test on staging (T12) ✓; production deferred (not in plan) ✓.
- **Placeholder scan:** Task 3 intentionally documents SQL intent then keeps the working JS-filter query — implementer deletes dead locals (called out). Task 7 has an explicit temporary placeholder swapped in Task 8. No silent TODOs.
- **Type consistency:** `EventRow`/`BlockRow` (client/shared) vs `EventSelect`/`MonthBlockSelect` (DB inferred) are intentionally parallel; components use the shared `*Row` shapes, repo returns DB rows (structurally identical columns). `getMonth`/`listEvents`/`createEvent`/…CRUD names consistent across T3/T4/T8/T9. Colour tokens + section names match Global Constraints.
- **Risk flags for the implementer:** (a) Better Auth adapter import path may be `@better-auth/drizzle-adapter` or `better-auth/adapters/drizzle` depending on installed version — verify (T2 S1). (b) drizzle-kit dialect for libSQL is `turso`; if generate fails, use `dialect: 'sqlite'`. (c) `auth.api.signUpEmail` server-call shape can vary by version — if it rejects, seed via the REST handler instead.
