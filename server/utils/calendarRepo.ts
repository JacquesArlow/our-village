import { and, eq, lte, desc } from 'drizzle-orm'
import { db } from '~~/server/db/client'
import { event, monthBlock, booking, formSubmission } from '~~/server/db/schema'
import type { EventInsert, MonthBlockInsert, EventSelect, BookingInsert, FormSubmissionInsert } from '~~/server/db/schema'
import { monthRange } from '~~/shared/calendar'

const now = () => Date.now()
const id = () => crypto.randomUUID()

function toPublicEvent(e: EventSelect) {
  const { staff, formFilePath, createdAt, updatedAt, ...pub } = e
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

export async function getEvent(eventId: string) {
  const rows = await db.select().from(event).where(eq(event.id, eventId))
  return rows[0] ?? null
}

export async function createEvent(input: Partial<EventInsert> & { startDate: string; title: string }) {
  const row: EventInsert = {
    id: id(),
    startDate: input.startDate,
    endDate: input.endDate ?? null,
    title: input.title,
    detail: input.detail ?? null,
    staff: input.staff ?? null,
    formFileName: input.formFileName ?? null,
    formFilePath: input.formFilePath ?? null,
    formFileMime: input.formFileMime ?? null,
    formFileSize: input.formFileSize ?? null,
    formUploadedAt: input.formUploadedAt ?? null,
    bookingFormVariant: input.bookingFormVariant ?? null,
    bookingCostLabel: input.bookingCostLabel ?? null,
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

export async function setEventFormFile(eventId: string, file: {
  fileName: string; filePath: string; fileMime: string; fileSize: number
}) {
  await updateEvent(eventId, {
    formFileName: file.fileName,
    formFilePath: file.filePath,
    formFileMime: file.fileMime,
    formFileSize: file.fileSize,
    formUploadedAt: now()
  })
}

export async function clearEventFormFile(eventId: string) {
  await updateEvent(eventId, {
    formFileName: null,
    formFilePath: null,
    formFileMime: null,
    formFileSize: null,
    formUploadedAt: null
  })
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
  name: string; surname: string; email: string; phone: string
  guests?: number | null
  babyName?: string | null; babySurname?: string | null; babyDateOfBirth?: string | null
  message?: string | null
}) {
  const row: BookingInsert = {
    id: id(),
    eventId: input.eventId ?? null,
    eventTitle: input.eventTitle ?? null,
    name: input.name,
    surname: input.surname,
    email: input.email,
    phone: input.phone,
    guests: input.guests ?? null,
    babyName: input.babyName ?? null,
    babySurname: input.babySurname ?? null,
    babyDateOfBirth: input.babyDateOfBirth ?? null,
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

export async function createFormSubmission(input: {
  eventId: string; eventTitle?: string | null
  name: string; email?: string | null; phone?: string | null
  fileName: string; filePath: string; fileMime: string; fileSize: number
}) {
  const row: FormSubmissionInsert = {
    id: id(),
    eventId: input.eventId,
    eventTitle: input.eventTitle ?? null,
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    fileName: input.fileName,
    filePath: input.filePath,
    fileMime: input.fileMime,
    fileSize: input.fileSize,
    createdAt: now()
  }
  await db.insert(formSubmission).values(row)
  return row
}

export async function listFormSubmissions(eventId?: string) {
  const rows = await db.select().from(formSubmission).orderBy(desc(formSubmission.createdAt))
  return (eventId ? rows.filter(r => r.eventId === eventId) : rows).map(({ filePath, ...row }) => row)
}

export async function getFormSubmission(submissionId: string) {
  const rows = await db.select().from(formSubmission).where(eq(formSubmission.id, submissionId))
  return rows[0] ?? null
}
