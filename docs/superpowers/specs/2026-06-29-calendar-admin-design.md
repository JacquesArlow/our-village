# Our Village — Calendar + Admin (`/village-desk`) Design

_Date: 2026-06-29_

## 1. Purpose

Add a content calendar to the Our Village site:

- A **public calendar page** where visitors see selected events in the printed
  "Our Village" calendar style (see reference screenshots: monthly grid + script
  month title + "Important dates" / "Hot Topics" sidebar).
- An **admin section** at `/village-desk` (login-protected) where staff manage the
  full planning calendar — including internal-only items (staff training,
  workshops, focus topics).
- Every event and every sidebar bullet has a **"Show on public site" toggle**.
  The public side renders **only** items marked public. Nothing is public by
  default.
- The admin path is gated at the edge by **Cloudflare** to block all non-South
  African requests (defence-in-depth on top of the application login).

## 2. Stack & constraints

- **Nuxt 3.14**, Nitro `node-server` preset (server API routes available).
- **Tailwind v4 + daisyUI v5**, existing `ourvillage` theme (sage `#a9b791`,
  muted green `#6a7971`, cream `#f4f5ee`, soft-pink accent `#ffbae2`, charcoal).
- **Drizzle ORM** + **SQLite** via the **libSQL driver** (`@libsql/client`,
  `file:` URL). libSQL is chosen over `better-sqlite3` to avoid native-build
  pain on `node:22-alpine` in Docker. (If a hard blocker emerges, fall back to
  Postgres — not expected.)
- **Better Auth** for authentication (Drizzle adapter, same SQLite DB).
- Runs as the `ourvillage-web` / `ourvillage-web-staging` Docker container on the
  `cloud` host; container is rebuilt on every deploy, so the DB **must** live on
  a persistent Docker volume.

## 3. Data model (Approach A — structured events + structured sidebar lists)

Chosen over (B) freeform rich-text blocks [loses per-event toggle + per-day
editing] and (C) events-only with auto-derived sidebar [loses control over
sidebar wording; decided against — sidebar is hand-curated].

### 3.1 Application tables (Drizzle / SQLite)

**`event`**
| column | type | notes |
|---|---|---|
| `id` | text (uuid) | PK |
| `startDate` | text (`YYYY-MM-DD`) | required; the day the event sits on |
| `endDate` | text (`YYYY-MM-DD`) | nullable; set for multi-day ranges (e.g. "World Heart Rhythm Week") |
| `title` | text | required (e.g. "World Vitiligo Day") |
| `detail` | text | nullable (e.g. "MONIQUE 1000", extra line) |
| `staff` | text | nullable (associated staff name, internal) |
| `color` | text | nullable; named token: `sage` \| `pink` \| `red` \| `default` |
| `isHighlight` | integer (bool) | the sage circle/fill on the day cell |
| `isPublic` | integer (bool) | default `false`; gates public visibility |
| `createdAt` / `updatedAt` | integer (epoch ms) | |

**`month_block`** — per-month sidebar / banner content, as editable bullet lists.
| column | type | notes |
|---|---|---|
| `id` | text (uuid) | PK |
| `year` | integer | e.g. 2026 |
| `month` | integer | 1–12 |
| `section` | text | one of `important_dates` \| `hot_topics` \| `focus` \| `training` |
| `text` | text | the bullet/line text |
| `color` | text | nullable; `sage` \| `pink` \| `red` \| `default` |
| `sortOrder` | integer | ordering within the section |
| `isPublic` | integer (bool) | default `false` |
| `createdAt` / `updatedAt` | integer | |

Section meanings:
- `important_dates` → the "Important dates:" sidebar list (hand-curated).
- `hot_topics` → the `#Hashtag` lines under "HOT TOPICS:".
- `focus` → the colour-coded bullet list (e.g. "Monique - 1000 days").
- `training` → the top-of-calendar red-dot "TRAINING: ..." note.

### 3.2 Better Auth tables

`user`, `session`, `account`, `verification` — created via Better Auth's Drizzle
schema in the same SQLite DB. Email + password provider. One initial admin user
is seeded on first boot (credentials set via env; password changed on first
login).

## 4. Routes & components

### 4.1 Public

- **`/calendar`** — printed-calendar view for a month. Script month title + tree
  logo, `SUN`–`SAT` grid, day cells showing event titles + sage highlight dots,
  and the "Important dates" / "Hot Topics" sidebar. Renders **only `isPublic`**
  events and `month_block` items. Month navigation (`‹ June 2026 ›`); defaults to
  current month.
- **`/calendar/events`** — combined chronological **list** of public events,
  **current month → oldest** (agenda/archive style). Reachable via an
  "All events" link/toggle on `/calendar`.
- Added to the main site nav (`AppHeader`).

Public data is read through `GET /api/calendar/*`, which returns only public rows.

### 4.2 Admin (`/village-desk`, login required)

- **`/village-desk`** — login screen (Better Auth) → on success, the **month
  planner**: same grid as public but shows **all** events with a visible publish
  toggle (eye icon) + colour/highlight controls. Prev/next month + jump-to-month.
- **`/village-desk/day/[date]`** (e.g. `/village-desk/day/2026-06-25`) — **day
  edit page**: add / edit / delete events for that date — `title`, `detail`,
  `staff`, date-range (`endDate`), `color`, `isHighlight`, and the
  **Show-on-public** toggle.
- **Sidebar editors** (per month, on the planner) — add / reorder (sortOrder) /
  delete bullet items for `important_dates`, `hot_topics`, `focus`, and the
  `training` note; each item has its own publish toggle and optional colour.
- Editing UX: explicit Save on the day-edit form; inline toggle/reorder for
  sidebar bullets. (Autosave-on-blur is a nice-to-have, not required for v1.)

Admin data CRUD goes through `/api/admin/*` (see §5).

### 4.3 Component breakdown

- `CalendarGrid.vue` — month grid renderer; props: `events`, `blocks`, `editable`.
  Used by both public and admin (admin passes `editable` to show toggles).
- `CalendarDayCell.vue` — single day cell (number, event lines, highlight).
- `CalendarSidebar.vue` — "Important dates" + "Hot Topics" + focus list render;
  `editable` variant exposes add/reorder/delete.
- `EventEditForm.vue` — the day-edit form.
- `useCalendar.ts` composable — fetch helpers for public + admin endpoints.

## 5. API & authorisation

- **Better Auth** mounted at **`/api/auth/[...all]`** (catch-all Nitro handler).
  Secure, `httpOnly`, `sameSite` session cookie. `BETTER_AUTH_SECRET` +
  `BETTER_AUTH_URL` via env.
- **Public, unauthenticated:**
  - `GET /api/calendar/month?year=&month=` → public events + blocks for a month.
  - `GET /api/calendar/events` → public events, current→oldest.
- **Admin, session-guarded** (a server util `requireAdmin(event)` validates the
  Better Auth session; 401 otherwise):
  - `GET /api/admin/month?year=&month=` → all events + blocks.
  - `POST/PATCH/DELETE /api/admin/event` → event CRUD.
  - `POST/PATCH/DELETE /api/admin/block` → month_block CRUD.
- Authorisation is enforced **server-side on every admin endpoint**, so the data
  is protected regardless of the URL path or Cloudflare. CF + path obscurity are
  additional layers, not the only gate.

## 6. Cloudflare edge gating

- Add a **WAF custom rule** on the **`our-village.co.za` zone** (which lives on
  the **`cfat_our_village`** Cloudflare account — a *different* account from
  `arlow.co.za`; do not mix tokens) blocking non-ZA traffic to the admin
  surface:

  ```
  description: ZA-only: Our Village admin (/village-desk)
  expression: (http.host contains "our-village.co.za"
               and ip.geoip.country ne "ZA"
               and (starts_with(http.request.uri.path, "/village-desk")
                    or starts_with(http.request.uri.path, "/api/admin")
                    or starts_with(http.request.uri.path, "/api/auth")))
  action: block
  ```

  Mirrors the existing ZA-only house-style rules. Applied to the production zone;
  on staging the whole site already sits behind nginx basic-auth, so the rule is
  added there too for parity if staging shares the zone (it does:
  `staging.our-village.co.za`).

## 7. Persistence & deployment

- `docker-compose.yml`: add a **named volume** mounted at `/data`; DB at
  `file:/data/ourvillage.db`. Env: `DATABASE_URL`, `BETTER_AUTH_SECRET`,
  `BETTER_AUTH_URL`, plus initial-admin seed vars.
- **Drizzle migrations** run on container start (entrypoint or Nitro plugin) so
  the schema is applied before serving. The volume persists across the
  rebuild-on-deploy, so data and the seeded admin survive deploys.
- New runtime deps: `drizzle-orm`, `@libsql/client`, `better-auth`; dev dep:
  `drizzle-kit`.
- Ships on the **`staging`** branch first (auto-deploys to
  `https://staging.our-village.co.za`, container `ourvillage-web-staging` :8093)
  and is verified in-browser before any production wiring.

## 8. Visual system (match the screenshots)

- **Script display font** for month titles and "Important dates:" / "Hot Topics:"
  headings — an elegant Google script (start with **Pinyon Script**; tune
  against the screenshots when testing visually). Loaded via the existing Google
  Fonts `<link>` in `nuxt.config.ts`.
- **`SUN`–`SAT`** header in bold, wide letter-spacing (Montserrat), uppercase.
- Day cells: thin sage grid lines, day number top-left, small event lines;
  **sage `#a9b791` highlight circles/fills** for `isHighlight` events.
- **"HOT TOPICS:"** rounded sage pill; colour-coded bullets (sage / pink / red
  per `color`).
- Tree logo top-right of the calendar header.
- All on the existing `ourvillage` daisyUI theme; responsive (grid scrolls
  horizontally on small screens rather than breaking the layout).

## 9. Out of scope (v1)

- Per-user roles/permissions beyond plain admin accounts (all admin users are
  equal; additional admins can be added later via Better Auth).
- Rich-text/WYSIWYG inside events (plain text + optional detail line only).
- Image uploads per event.
- Production deploy wiring (done later, on request) — feature is verified on
  staging.
- Recurring-event rules (a "week" is modelled as a simple start/end range, not a
  recurrence engine).

## 10. Success criteria

1. Admin can log in at `/village-desk`, add/edit/delete events on a day-edit
   page, edit the four sidebar sections as bullet lists, and toggle each
   item public/private.
2. `/calendar` renders the selected month in the screenshot style showing only
   public items; `/calendar/events` lists public events current→oldest.
3. Data survives a container rebuild/redeploy (persistent volume).
4. Non-ZA requests to `/village-desk*` / `/api/admin*` / `/api/auth*` are blocked
   at Cloudflare; admin APIs reject unauthenticated requests server-side.
5. Verified working in-browser on `https://staging.our-village.co.za`.
