import { randomUUID, createHash, randomBytes } from "node:crypto";
import type { DatabaseSync, SQLInputValue } from "node:sqlite";
import { transaction } from "./database";
import { fail, text, integer, instant, flag } from "./validation";
import { candidateSlots, localDay, normaliseHours } from "./schedule";
import { paymentMode, requirePaymentMode } from "./payment-mode";
import type { AccountRole } from "../../shared/accounts";
import { addCalendarDays, bookingIntervals, type AvailabilityWeek } from "../../shared/calendar";

export interface Actor {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  mustChangePassword?: boolean;
}
export const one = (
  db: DatabaseSync,
  sql: string,
  ...args: SQLInputValue[]
): any => db.prepare(sql).get(...args);
export const many = (
  db: DatabaseSync,
  sql: string,
  ...args: SQLInputValue[]
): any[] => db.prepare(sql).all(...args);
export const run = (db: DatabaseSync, sql: string, ...args: SQLInputValue[]) =>
  db.prepare(sql).run(...args);
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
const occupiesTime = "(status IN('confirmed','completed','no_show') OR (status='hold' AND hold_until>?))";
export function audit(
  db: DatabaseSync,
  actor: string | null,
  action: string,
  entity: string,
  detail = "",
) {
  run(
    db,
    "INSERT INTO audit(id,actor_id,action,entity_id,detail,created_at) VALUES(?,?,?,?,?,?)",
    randomUUID(),
    actor,
    action,
    entity,
    detail,
    Date.now(),
  );
}
export function requireRole(actor: Actor, roles: Actor["role"][]) {
  if (!roles.includes(actor.role))
    fail(403, "You do not have permission to do that.");
}
export function doctorFor(db: DatabaseSync, actor: Actor, id?: string) {
  requireRole(actor, ["admin", "doctor"]);
  const doctor =
    actor.role === "admin"
      ? one(db, "SELECT * FROM doctor WHERE id=?", id || "")
      : one(db, "SELECT * FROM doctor WHERE user_id=?", actor.id);
  if (!doctor || (id && doctor.id !== id)) fail(404, "Doctor not found.");
  return doctor;
}
export function expireHolds(db: DatabaseSync, now = Date.now()) {
  run(
    db,
    "UPDATE invoice SET state='void' WHERE state='unpaid' AND appointment_id IN(SELECT id FROM appointment WHERE status='hold' AND hold_until<=?)",
    now,
  );
  run(
    db,
    "UPDATE appointment SET status='expired' WHERE status='hold' AND hold_until<=?",
    now,
  );
}
export function publishedDoctors(db: DatabaseSync) {
  return many(
    db,
    `SELECT d.id,d.name,d.title,d.description,d.location
     FROM doctor d JOIN user u ON u.id=d.user_id
     WHERE d.active=1 AND d.onboarded=1 AND u.disabledAt IS NULL
     AND EXISTS (SELECT 1 FROM service s WHERE s.doctor_id=d.id AND s.active=1)
     ORDER BY d.created_at`,
  ).map((doctor) => ({
    ...doctor,
    services: many(
      db,
      "SELECT id,name,duration_minutes,buffer_minutes,amount_cents FROM service WHERE doctor_id=? AND active=1 ORDER BY name",
      doctor.id,
    ),
  }));
}
function bookableCalendar(db: DatabaseSync, serviceId: string) {
  const service = one(
    db,
    "SELECT * FROM service WHERE id=? AND active=1",
    serviceId,
  );
  if (!service) return null;
  const doctor = one(
    db,
    "SELECT d.* FROM doctor d JOIN user u ON u.id=d.user_id WHERE d.id=? AND d.active=1 AND d.onboarded=1 AND u.disabledAt IS NULL",
    service.doctor_id,
  );
  return doctor ? { doctor, service } : null;
}
export function slots(
  db: DatabaseSync,
  serviceId: string,
  day: string,
  now = Date.now(),
  excluding?: string,
) {
  const calendar = bookableCalendar(db, serviceId);
  if (!calendar) return [];
  const { doctor, service } = calendar;
  return candidateSlots(doctor, service, day, now).filter(
    (slot) =>
      !conflict(db, doctor.id, slot.start, slot.busyUntil, now, excluding),
  );
}
export function availabilityWeek(
  db: DatabaseSync,
  serviceId: string,
  from: string,
  now = Date.now(),
): AvailabilityWeek | null {
  const calendar = bookableCalendar(db, serviceId);
  if (!calendar) return null;
  const { doctor, service } = calendar;
  const today = localDay(now);
  const lastDate = addCalendarDays(today, doctor.horizon_days);
  const first = from < today ? today : from;
  if (first > lastDate) return { days: [], lastDate, nextAvailable: null };
  const start = new Date(first + "T00:00:00+02:00").toISOString();
  const end = new Date(addCalendarDays(lastDate, 1) + "T00:00:00+02:00").toISOString();
  const busy = many(
    db,
    `SELECT start_at AS start, busy_until AS end FROM appointment
     WHERE doctor_id=? AND start_at<? AND busy_until>?
     AND ${occupiesTime}
     UNION ALL
     SELECT start_at, end_at FROM time_block WHERE doctor_id=? AND start_at<? AND end_at>?`,
    doctor.id, end, start, now, doctor.id, end, start,
  );
  function openSlots(day: string) {
    const dayStart = new Date(day + "T00:00:00+02:00").toISOString();
    const dayEnd = new Date(addCalendarDays(day, 1) + "T00:00:00+02:00").toISOString();
    const intervals = busy.filter((period) => period.start < dayEnd && period.end > dayStart);
    return candidateSlots(doctor, service, day, now).filter(
      (slot) => !intervals.some((period) => period.start < slot.busyUntil && period.end > slot.start),
    );
  }
  const days: AvailabilityWeek["days"] = [];
  for (let index = 0; index < 7; index++) {
    const day = addCalendarDays(first, index);
    if (day > lastDate) break;
    days.push({ date: day, slots: openSlots(day) });
  }
  let nextAvailable = null;
  if (!days.some((day) => day.slots.length)) {
    for (let day = addCalendarDays(first, 7); day <= lastDate; day = addCalendarDays(day, 1)) {
      if (openSlots(day).length) {
        nextAvailable = day;
        break;
      }
    }
  }
  return { days, lastDate, nextAvailable };
}
export function conflict(
  db: DatabaseSync,
  doctorId: string,
  start: string,
  busyUntil: string,
  now: number,
  excluding = "",
) {
  return (
    !!one(
      db,
      `SELECT id FROM appointment WHERE doctor_id=? AND id<>? AND start_at<? AND busy_until>?
    AND ${occupiesTime} LIMIT 1`,
      doctorId,
      excluding,
      busyUntil,
      start,
      now,
    ) ||
    !!one(
      db,
      "SELECT id FROM time_block WHERE doctor_id=? AND start_at<? AND end_at>? LIMIT 1",
      doctorId,
      busyUntil,
      start,
    )
  );
}
export function saveDoctor(
  db: DatabaseSync,
  actor: Actor,
  doctorId: string,
  input: any,
) {
  const doctor = doctorFor(db, actor, doctorId);
  const name = text(input.name, "doctor name", 100),
    title = text(input.title, "professional title", 150);
  const description = text(
      input.description ?? "",
      "introduction",
      1500,
      false,
    ),
    location = text(input.location, "consultation location", 250);
  const hours = normaliseHours(input.weeklyHours);
  const notice = integer(input.minNoticeHours, "minimum notice", 0, 720),
    horizon = integer(input.horizonDays, "booking horizon", 1, 365),
    cancellation = integer(
      input.cancellationHours,
      "cancellation notice",
      0,
      720,
    );
  const onboarded = flag(input.onboarded);
  const slotInterval = input.slotIntervalMinutes ?? doctor.slot_interval_minutes;
  if (!bookingIntervals.some((interval) => interval === slotInterval))
    fail(400, "Choose a supported appointment start interval.");
  if (
    onboarded &&
    (!hours.length ||
      !one(
        db,
        "SELECT id FROM service WHERE doctor_id=? AND active=1",
        doctor.id,
      ))
  )
    fail(
      400,
      "Add an appointment type and working hours before opening bookings.",
    );
  run(
    db,
    "UPDATE doctor SET name=?,title=?,description=?,location=?,weekly_hours=?,min_notice_hours=?,horizon_days=?,cancellation_hours=?,slot_interval_minutes=?,onboarded=?,active=? WHERE id=?",
    name,
    title,
    description,
    location,
    JSON.stringify(hours),
    notice,
    horizon,
    cancellation,
    slotInterval,
    onboarded,
    flag(input.active),
    doctor.id,
  );
  audit(db, actor.id, "doctor.settings", doctor.id);
  return one(db, "SELECT * FROM doctor WHERE id=?", doctor.id);
}
export function saveService(
  db: DatabaseSync,
  actor: Actor,
  doctorId: string,
  input: any,
) {
  const doctor = doctorFor(db, actor, doctorId);
  const id = input.id ? text(input.id, "appointment type", 100) : randomUUID();
  const existing = one(db, "SELECT * FROM service WHERE id=?", id);
  if (input.id && (!existing || existing.doctor_id !== doctor.id))
    fail(404, "Appointment type not found.");
  const name = text(input.name, "appointment type", 150),
    duration = integer(input.durationMinutes, "duration", 5, 240),
    buffer = integer(input.bufferMinutes, "buffer", 0, 120),
    amount = integer(input.amountCents, "price in cents", 200, 10000000),
    active = flag(input.active);
  run(
    db,
    `INSERT INTO service(id,doctor_id,name,duration_minutes,buffer_minutes,amount_cents,active) VALUES(?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name,duration_minutes=excluded.duration_minutes,buffer_minutes=excluded.buffer_minutes,amount_cents=excluded.amount_cents,active=excluded.active`,
    id,
    doctor.id,
    name,
    duration,
    buffer,
    amount,
    active,
  );
  audit(db, actor.id, "service.save", id);
  return one(db, "SELECT * FROM service WHERE id=?", id);
}
export function makeInvoice(
  db: DatabaseSync,
  patientId: string,
  doctorId: string | null,
  description: string,
  amount: number,
  appointmentId: string | null = null,
) {
  const id = randomUUID();
  const patient = one(db, "SELECT name,email FROM user WHERE id=?", patientId);
  if (!patient) fail(404, "Patient not found.");
  const issuer = JSON.parse(
    one(db, "SELECT value FROM practice_setting WHERE id=1").value,
  );
  const vat =
    issuer.taxMode === "vat_inclusive"
      ? Math.round(
          (amount * (issuer.vatRateBps || 0)) /
            (10000 + (issuer.vatRateBps || 0)),
        )
      : 0;
  const doctor = doctorId
    ? one(db, "SELECT name FROM doctor WHERE id=?", doctorId)
    : null;
  run(
    db,
    "INSERT INTO invoice(id,patient_id,doctor_id,appointment_id,description,amount_cents,created_at,patient_name,patient_email,doctor_name,issuer_json,vat_cents,payment_mode) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
    id,
    patientId,
    doctorId,
    appointmentId,
    description,
    amount,
    Date.now(),
    patient.name,
    patient.email,
    doctor?.name || "",
    JSON.stringify(issuer),
    vat,
    paymentMode(db),
  );
  return one(db, "SELECT * FROM invoice WHERE id=?", id);
}
export function createAppointment(
  db: DatabaseSync,
  actor: Actor,
  input: any,
  now = Date.now(),
) {
  requireRole(actor, ["patient", "admin"]);
  const patientId =
    actor.role === "admin" ? text(input.patientId, "patient", 100) : actor.id;
  const patient = one(
    db,
    "SELECT id FROM user WHERE id=? AND role=? AND disabledAt IS NULL",
    patientId,
    "patient",
  );
  if (!patient) fail(404, "Patient not found.");
  const requestKey = text(input.requestKey, "request reference", 100);
  const start = instant(input.start),
    serviceId = text(input.serviceId, "appointment type", 100);
  return transaction(db, () => {
    expireHolds(db, now);
    const existing = one(
      db,
      "SELECT * FROM appointment WHERE patient_id=? AND request_key=?",
      patientId,
      requestKey,
    );
    if (existing) {
      if (existing.start_at !== start || existing.service_id !== serviceId)
        fail(
          409,
          "This request reference was already used for a different booking.",
        );
      return {
        appointment: existing,
        invoice: one(
          db,
          "SELECT * FROM invoice WHERE appointment_id=?",
          existing.id,
        ),
      };
    }
    requirePaymentMode(db, input.paymentMode ?? "test");
    if (
      !one(db, "SELECT user_id FROM patient_profile WHERE user_id=?", patientId)
    )
      fail(400, "Save a patient contact profile and consent before booking.");
    const slot = slots(db, serviceId, localDay(Date.parse(start)), now).find(
      (slot) => slot.start === start,
    );
    if (!slot)
      fail(
        409,
        "That time is no longer available. Please choose another slot.",
      );
    const service = one(db, "SELECT * FROM service WHERE id=?", serviceId);
    const id = randomUUID(),
      holdUntil = now + 15 * 60000;
    run(
      db,
      `INSERT INTO appointment(id,doctor_id,patient_id,service_id,service_name,start_at,end_at,busy_until,amount_cents,status,hold_until,request_key,created_at)
      VALUES(?,?,?,?,?,?,?,?,?,'hold',?,?,?)`,
      id,
      service.doctor_id,
      patientId,
      serviceId,
      service.name,
      start,
      slot.end,
      slot.busyUntil,
      service.amount_cents,
      holdUntil,
      requestKey,
      now,
    );
    const invoice = makeInvoice(
      db,
      patientId,
      service.doctor_id,
      service.name,
      service.amount_cents,
      id,
    );
    audit(db, actor.id, "appointment.hold", id);
    return {
      appointment: one(db, "SELECT * FROM appointment WHERE id=?", id),
      invoice,
    };
  });
}
export function appointmentFor(db: DatabaseSync, actor: Actor, id: string) {
  requireRole(actor, ["admin", "doctor", "patient"]);
  const row = one(db, "SELECT * FROM appointment WHERE id=?", id);
  if (!row) fail(404, "Appointment not found.");
  if (actor.role === "patient" && row.patient_id !== actor.id)
    fail(404, "Appointment not found.");
  if (
    actor.role === "doctor" &&
    !one(
      db,
      "SELECT id FROM doctor WHERE id=? AND user_id=?",
      row.doctor_id,
      actor.id,
    )
  )
    fail(404, "Appointment not found.");
  return row;
}
export function changeAppointment(
  db: DatabaseSync,
  actor: Actor,
  id: string,
  input: any,
  now = Date.now(),
) {
  return transaction(db, () => {
    expireHolds(db, now);
    const row = appointmentFor(db, actor, id);
    const doctor = one(db, "SELECT * FROM doctor WHERE id=?", row.doctor_id);
    if (
      [
        "cancelled",
        "expired",
        "completed",
        "no_show",
        "payment_review",
      ].includes(row.status)
    )
      fail(409, "This appointment cannot be changed.");
    if (
      actor.role === "patient" &&
      Date.parse(row.start_at) - now < doctor.cancellation_hours * 3600000
    )
      fail(
        409,
        "The online change window has closed. Please contact the practice.",
      );
    if (input.action === "cancel") {
      run(db, "UPDATE appointment SET status='cancelled' WHERE id=?", id);
      run(
        db,
        "UPDATE invoice SET state=CASE WHEN state='paid' THEN 'refund_review' ELSE 'void' END WHERE appointment_id=?",
        id,
      );
    } else if (input.action === "reschedule") {
      const start = instant(input.start);
      const service = one(
        db,
        "SELECT * FROM service WHERE id=?",
        row.service_id,
      );
      if (
        !service?.active ||
        !doctor.active ||
        !doctor.onboarded ||
        !one(
          db,
          "SELECT id FROM user WHERE id=? AND disabledAt IS NULL",
          doctor.user_id,
        )
      )
        fail(409, "Contact the practice to reschedule this appointment.");
      // Existing duration and buffers are snapshots; price edits never change a booked invoice.
      const frozenService = {
        ...service,
        duration_minutes:
          (Date.parse(row.end_at) - Date.parse(row.start_at)) / 60000,
        buffer_minutes:
          (Date.parse(row.busy_until) - Date.parse(row.end_at)) / 60000,
      };
      const slot = candidateSlots(
        doctor,
        frozenService,
        localDay(Date.parse(start)),
        now,
      ).find((slot) => slot.start === start);
      if (!slot || conflict(db, doctor.id, slot.start, slot.busyUntil, now, id))
        fail(409, "That time is not available.");
      run(
        db,
        "UPDATE appointment SET start_at=?,end_at=?,busy_until=? WHERE id=?",
        slot.start,
        slot.end,
        slot.busyUntil,
        id,
      );
    } else if (["completed", "no_show"].includes(input.action)) {
      requireRole(actor, ["doctor", "admin"]);
      if (row.status !== "confirmed" || Date.parse(row.end_at) > now)
        fail(
          409,
          "Only a paid appointment that has ended can be marked complete or no-show.",
        );
      run(db, "UPDATE appointment SET status=? WHERE id=?", input.action, id);
    } else fail(400, "Choose a valid appointment action.");
    audit(db, actor.id, "appointment." + input.action, id);
    return one(db, "SELECT * FROM appointment WHERE id=?", id);
  });
}
export function addBlock(
  db: DatabaseSync,
  actor: Actor,
  doctorId: string,
  input: any,
  now = Date.now(),
) {
  doctorFor(db, actor, doctorId);
  const start = instant(input.start),
    end = instant(input.end);
  if (end <= start || Date.parse(end) - Date.parse(start) > 366 * 86400000)
    fail(400, "Use a valid time-off period.");
  return transaction(db, () => {
    expireHolds(db, now);
    if (
      one(
        db,
        "SELECT id FROM appointment WHERE doctor_id=? AND start_at<? AND busy_until>? AND status IN('confirmed','hold')",
        doctorId,
        end,
        start,
      )
    )
      fail(
        409,
        "Move or cancel the affected appointments before blocking this time.",
      );
    const id = randomUUID();
    run(
      db,
      "INSERT INTO time_block(id,doctor_id,start_at,end_at,label) VALUES(?,?,?,?,?)",
      id,
      doctorId,
      start,
      end,
      text(input.label || "Unavailable", "time-off label", 120),
    );
    audit(db, actor.id, "time_block.create", id);
    return one(db, "SELECT * FROM time_block WHERE id=?", id);
  });
}
export function invoiceFor(db: DatabaseSync, actor: Actor, id: string) {
  requireRole(actor, ["admin", "doctor", "patient"]);
  const row = one(db, "SELECT * FROM invoice WHERE id=?", id);
  if (
    !row ||
    (actor.role === "patient" && row.patient_id !== actor.id) ||
    (actor.role === "doctor" &&
      !one(
        db,
        "SELECT id FROM doctor WHERE id=? AND user_id=?",
        row.doctor_id || "",
        actor.id,
      ))
  )
    fail(404, "Invoice not found.");
  return row;
}
export function assertPayable(
  db: DatabaseSync,
  invoice: any,
  now = Date.now(),
) {
  if (invoice.state !== "unpaid")
    fail(409, "This invoice is not awaiting payment.");
  if (invoice.appointment_id) {
    const appointment = one(
      db,
      "SELECT * FROM appointment WHERE id=?",
      invoice.appointment_id,
    );
    if (
      !appointment ||
      appointment.status !== "hold" ||
      appointment.hold_until <= now
    )
      fail(
        409,
        "The booking hold has expired. Please choose a new appointment or contact the practice.",
      );
  }
}
export function createPaymentLink(
  db: DatabaseSync,
  actor: Actor,
  invoiceId: string,
  base: string,
  now = Date.now(),
) {
  const invoice = invoiceFor(db, actor, invoiceId);
  requirePaymentMode(db, invoice.payment_mode);
  assertPayable(db, invoice, now);
  const token = randomBytes(32).toString("base64url");
  const expires = invoice.appointment_id
    ? one(
        db,
        "SELECT hold_until FROM appointment WHERE id=?",
        invoice.appointment_id,
      ).hold_until
    : now + 48 * 3600000;
  run(
    db,
    "INSERT INTO payment_link(id,invoice_id,token_hash,expires_at,created_at) VALUES(?,?,?,?,?)",
    randomUUID(),
    invoice.id,
    hashToken(token),
    expires,
    now,
  );
  audit(db, actor.id, "payment_link.create", invoice.id);
  return { url: base + "/pay/" + token, expiresAt: expires };
}
export function invoiceFromToken(
  db: DatabaseSync,
  token: string,
  now = Date.now(),
) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) fail(404, "Payment link not found.");
  const link = one(
    db,
    "SELECT * FROM payment_link WHERE token_hash=?",
    hashToken(token),
  );
  if (!link || link.expires_at <= now)
    fail(404, "This payment link is invalid or has expired.");
  return one(db, "SELECT * FROM invoice WHERE id=?", link.invoice_id);
}
export function settleInvoice(
  db: DatabaseSync,
  invoiceId: string,
  paymentId: string,
  method: "yoco_test" | "yoco_live" | "staging_simulation",
  now = Date.now(),
) {
  const invoice = one(db, "SELECT * FROM invoice WHERE id=?", invoiceId);
  if (!invoice) fail(404, "Invoice not found.");
  if (invoice.payment_mode !== (method === "yoco_live" ? "live" : "test"))
    fail(409, "This payment does not match the invoice mode.");
  if (invoice.payment_id) {
    if (invoice.payment_id !== paymentId)
      fail(
        409,
        "This invoice already has a payment. Manual reconciliation is required.",
      );
    return invoice;
  }
  let review = invoice.state !== "unpaid";
  if (invoice.appointment_id) {
    const row = one(
      db,
      "SELECT * FROM appointment WHERE id=?",
      invoice.appointment_id,
    );
    review ||=
      row.status !== "hold" ||
      row.hold_until <= now ||
      conflict(db, row.doctor_id, row.start_at, row.busy_until, now, row.id);
    run(
      db,
      "UPDATE appointment SET status=?,payment_review=? WHERE id=?",
      review ? "payment_review" : "confirmed",
      review ? 1 : 0,
      row.id,
    );
  }
  run(
    db,
    "UPDATE invoice SET state=?,payment_id=?,payment_method=?,paid_at=? WHERE id=?",
    review ? "refund_review" : "paid",
    paymentId,
    method,
    now,
    invoice.id,
  );
  audit(
    db,
    null,
    review ? "payment.review_required" : "payment.received",
    invoice.id,
    method,
  );
  return one(db, "SELECT * FROM invoice WHERE id=?", invoice.id);
}
