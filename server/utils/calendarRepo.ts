import { and, eq, lte, desc } from 'drizzle-orm'
import { db } from '~~/server/db/client'
import { event, monthBlock, booking } from '~~/server/db/schema'
import type { EventInsert, MonthBlockInsert, EventSelect, BookingInsert } from '~~/server/db/schema'
import { monthRange } from '~~/shared/calendar'

const now = () => Date.now()
const id = () => crypto.randomUUID()

function toPublicEvent(e: EventSelect) {
  const { staff, createdAt, updatedAt, ...pub } = e
  return pub
}

export async function getMonth(year: number, month: number, opts: { publicOnly?: boolean } = {}) {
  const { start, end } = monthRange(year, month)

  // Coarse SQL filter: startDate <= monthEnd (captures events that started before or during the month).
  // Then JS-filter for overlap: (endDate ?? startDate) >= monthStart.
  const rows = await db.select().from(event).where(lte(event.startDate, end))
  const filtered = rows
    .filter(e => (e.endDate ?? e.startDate) >= start)
    .filter(e => (opts.publicOnly ? e.isPublic : true))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
  const events = opts.publicOnly ? filtered.map(toPublicEvent) : filtered

  const blockRows = await db.select().from(monthBlock)
    .where(and(eq(monthBlock.year, year), eq(monthBlock.month, month)))
  const blocks = blockRows
    .filter(b => (opts.publicOnly ? b.isPublic : true))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return { events, blocks }
}

export async function listEvents(opts: { publicOnly?: boolean } = {}) {
  const rows = await db.select().from(event).orderBy(desc(event.startDate))
  const filtered = opts.publicOnly ? rows.filter(e => e.isPublic) : rows
  return opts.publicOnly ? filtered.map(toPublicEvent) : filtered
}

/** A single event by id, public-projected — only returned if it is published. */
export async function getPublicEvent(eventId: string) {
  const rows = await db.select().from(event).where(eq(event.id, eventId))
  const row = rows[0]
  if (!row || !row.isPublic) return null
  return toPublicEvent(row)
}

export async function createEvent(input: Partial<EventInsert> & { startDate: string; title: string }) {
  const row: EventInsert = {
    id: id(),
    startDate: input.startDate,
    endDate: input.endDate ?? null,
    title: input.title,
    detail: input.detail ?? null,
    staff: input.staff ?? null,
    color: input.color ?? 'default',
    isHighlight: input.isHighlight ?? false,
    isPublic: input.isPublic ?? false,
    createdAt: now(),
    updatedAt: now()
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
    id: id(),
    year: input.year,
    month: input.month,
    section: input.section,
    text: input.text,
    color: input.color ?? 'default',
    sortOrder: input.sortOrder ?? 0,
    isPublic: input.isPublic ?? false,
    createdAt: now(),
    updatedAt: now()
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

export async function createBooking(input: {
  eventId?: string | null; eventTitle?: string | null
  name: string; surname: string; email: string; phone: string; message?: string | null
}) {
  const row: BookingInsert = {
    id: id(),
    eventId: input.eventId ?? null,
    eventTitle: input.eventTitle ?? null,
    name: input.name,
    surname: input.surname,
    email: input.email,
    phone: input.phone,
    message: input.message ?? null,
    createdAt: now()
  }
  await db.insert(booking).values(row)
  return row
}

/** Bookings, newest first. Scoped to one event when eventId is given. */
export async function listBookings(eventId?: string) {
  const rows = await db.select().from(booking).orderBy(desc(booking.createdAt))
  return eventId ? rows.filter(b => b.eventId === eventId) : rows
}
