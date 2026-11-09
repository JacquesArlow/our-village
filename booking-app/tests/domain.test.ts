import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import {
  openDatabase,
  migrateDomain,
  transaction,
} from "../server/core/database";
import {
  one,
  run,
  slots,
  publishedDoctors,
  createAppointment,
  appointmentFor,
  changeAppointment,
  doctorFor,
  saveDoctor,
  saveService,
  addBlock,
  invoiceFor,
  createPaymentLink,
  invoiceFromToken,
  makeInvoice,
  settleInvoice,
  expireHolds,
} from "../server/core/store";
import {
  normaliseHours,
  candidateSlots,
  localDay,
} from "../server/core/schedule";
import { verifyWebhook, handlePaymentEvent } from "../server/core/payments";
import { instant } from "../server/core/validation";
import { accountDirectory } from "../server/core/accounts";

const now = Date.parse("2026-11-02T06:00:00Z"),
  start = "2026-11-03T07:00:00.000Z";
const admin = {
  id: "admin",
  name: "Admin",
  email: "admin@example.test",
  role: "admin" as const,
};
const doc = {
  id: "doctor-user",
  name: "Doctor",
  email: "doctor@example.test",
  role: "doctor" as const,
};
const otherDoc = {
  id: "other-doctor",
  name: "Other Doctor",
  email: "other@example.test",
  role: "doctor" as const,
};
const patient = {
  id: "patient",
  name: "Patient",
  email: "patient@example.test",
  role: "patient" as const,
};
const otherPatient = {
  id: "other-patient",
  name: "Other Patient",
  email: "other-patient@example.test",
  role: "patient" as const,
};
const receptionist = {
  id: "receptionist",
  name: "Reception",
  email: "reception@example.test",
  role: "receptionist" as const,
};
let db: ReturnType<typeof openDatabase>;
beforeEach(() => {
  db = openDatabase(":memory:");
  db.exec(
    "CREATE TABLE user(id TEXT PRIMARY KEY,name TEXT,email TEXT,role TEXT,disabledAt INTEGER)",
  );
  migrateDomain(db);
  for (const u of [admin, doc, otherDoc, patient, otherPatient, receptionist])
    run(
      db,
      "INSERT INTO user(id,name,email,role) VALUES(?,?,?,?)",
      u.id,
      u.name,
      u.email,
      u.role,
    );
  for (const u of [patient, otherPatient])
    run(
      db,
      "INSERT INTO patient_profile(user_id,phone,consent_at) VALUES(?,?,?)",
      u.id,
      "0000000000",
      now,
    );
  for (const [id, user] of [
    ["natasha", doc],
    ["other", otherDoc],
  ] as const) {
    run(
      db,
      "INSERT INTO doctor(id,user_id,name,title,location,weekly_hours,onboarded,min_notice_hours,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
      id,
      user.id,
      user.name,
      "GP",
      "Our Village",
      JSON.stringify([{ day: 2, start: "09:00", end: "12:00" }]),
      1,
      0,
      now,
    );
    run(
      db,
      "INSERT INTO service(id,doctor_id,name,duration_minutes,buffer_minutes,amount_cents) VALUES(?,?,?,?,?,?)",
      id + "-service",
      id,
      "Consultation",
      30,
      15,
      65000,
    );
  }
});
afterEach(() => db.close());
const book = (who = patient, time = start, key = "request-one") =>
  createAppointment(
    db,
    who,
    {
      serviceId: "natasha-service",
      start: time,
      requestKey: key,
      amountCents: 1,
    },
    now,
  );

describe("doctor setup and scheduling", () => {
  it("closes a disabled doctor's directory entry and availability", () => {
    run(db, "UPDATE user SET disabledAt=? WHERE id=?", now, doc.id);
    expect(publishedDoctors(db).map(({ id }) => id)).not.toContain("natasha");
    expect(slots(db, "natasha-service", "2026-11-03", now)).toEqual([]);
  });
  it("uses SAST without depending on the server timezone", () => {
    expect(localDay(Date.parse("2026-11-02T22:30:00Z"))).toBe("2026-11-03");
    const available = slots(db, "natasha-service", "2026-11-03", now);
    expect(available[0]).toEqual({
      start,
      end: "2026-11-03T07:30:00.000Z",
      busyUntil: "2026-11-03T07:45:00.000Z",
    });
    expect(available.at(-1)?.busyUntil).toBe("2026-11-03T10:00:00.000Z");
  });
  it("validates working periods and rejects overlapping hours or invalid dates", () => {
    expect(() =>
      normaliseHours([{ day: 1, start: "12:00", end: "09:00" }]),
    ).toThrow();
    expect(() =>
      normaliseHours([
        { day: 1, start: "09:00", end: "12:00" },
        { day: 1, start: "11:00", end: "13:00" },
      ]),
    ).toThrow();
    expect(() =>
      normaliseHours([{ day: 7, start: "09:00", end: "12:00" }]),
    ).toThrow();
    expect(() => instant("2026-02-31T09:00:00.000Z")).toThrow();
    expect(() => slots(db, "natasha-service", "2026-02-31", now)).toThrow();
  });
  it("does not expose slots until the doctor has published the calendar", () => {
    run(db, "UPDATE doctor SET onboarded=0 WHERE id=?", "natasha");
    expect(slots(db, "natasha-service", "2026-11-03", now)).toEqual([]);
  });
  it("opens the directory for each doctor only after they publish a bookable calendar", () => {
    run(db, "UPDATE doctor SET onboarded=0");
    expect(publishedDoctors(db)).toEqual([]);

    saveDoctor(db, doc, "natasha", {
      name: "Doctor",
      title: "GP",
      location: "Our Village",
      weeklyHours: [{ day: 2, start: "09:00", end: "12:00" }],
      minNoticeHours: 0,
      horizonDays: 60,
      cancellationHours: 24,
      onboarded: true,
      active: true,
    });
    expect(publishedDoctors(db).map(({ id }) => id)).toEqual(["natasha"]);

    run(db, "UPDATE service SET active=0 WHERE doctor_id=?", "natasha");
    expect(publishedDoctors(db)).toEqual([]);
  });
  it("requires an active service and working hours before publishing", () => {
    expect(() =>
      saveDoctor(db, doc, "natasha", {
        name: "Doctor",
        title: "GP",
        location: "Our Village",
        description: "",
        weeklyHours: [],
        minNoticeHours: 0,
        horizonDays: 60,
        cancellationHours: 24,
        onboarded: true,
        active: true,
      }),
    ).toThrow();
  });
  it("isolates doctors even when a doctor changes an ID in the request", () => {
    expect(() => doctorFor(db, doc, "other")).toThrow();
    expect(() => saveService(db, doc, "other", { name: "Hacked" })).toThrow();
    expect(() =>
      saveService(db, doc, "natasha", { id: "other-service", name: "Hacked" }),
    ).toThrow();
    expect(() => doctorFor(db, patient, "natasha")).toThrow();
    expect(doctorFor(db, admin, "other").id).toBe("other");
  });
  it("honours minimum notice, horizon and blocked periods", () => {
    run(db, "UPDATE doctor SET min_notice_hours=48 WHERE id=?", "natasha");
    expect(slots(db, "natasha-service", "2026-11-03", now)).toEqual([]);
    run(
      db,
      "UPDATE doctor SET min_notice_hours=0,horizon_days=1 WHERE id=?",
      "natasha",
    );
    expect(slots(db, "natasha-service", "2026-11-10", now)).toEqual([]);
    addBlock(
      db,
      doc,
      "natasha",
      { start, end: "2026-11-03T08:00:00.000Z", label: "Time off" },
      now,
    );
    expect(slots(db, "natasha-service", "2026-11-03", now)[0].start).toBe(
      "2026-11-03T08:00:00.000Z",
    );
  });
});

describe("reception access", () => {
  it("lists patient contact fields and denies access to booking and billing records", () => {
    expect(
      accountDirectory(db, { q: otherPatient.email, role: "admin" }, true)
        .users,
    ).toEqual([
      {
        id: otherPatient.id,
        name: otherPatient.name,
        email: otherPatient.email,
        phone: "0000000000",
      },
    ]);
    const { appointment, invoice } = book();
    expect(() => appointmentFor(db, receptionist, appointment.id)).toThrow(
      "permission",
    );
    expect(() => invoiceFor(db, receptionist, invoice.id)).toThrow(
      "permission",
    );
  });
});

describe("appointments and invoice snapshots", () => {
  it("reserves a slot atomically and includes the buffer in overlap checks", () => {
    const result = book();
    expect(result.invoice.amount_cents).toBe(65000);
    expect(result.appointment.status).toBe("hold");
    expect(() => book(otherPatient, start, "another")).toThrow();
    expect(() =>
      book(otherPatient, "2026-11-03T07:30:00.000Z", "overlap"),
    ).toThrow();
    expect(
      book(otherPatient, "2026-11-03T07:45:00.000Z", "next").appointment.id,
    ).toBeTruthy();
  });
  it("is idempotent for retries but rejects a mismatching request reference", () => {
    const first = book(),
      retry = book();
    expect(retry.appointment.id).toBe(first.appointment.id);
    expect(one(db, "SELECT count(*) n FROM invoice").n).toBe(1);
    expect(() => book(patient, "2026-11-03T08:00:00.000Z")).toThrow();
  });
  it("uses server prices and freezes billing data when prices or profiles change", () => {
    const result = book();
    run(
      db,
      "UPDATE service SET amount_cents=80000 WHERE id=?",
      "natasha-service",
    );
    run(db, "UPDATE user SET name=? WHERE id=?", "Changed name", patient.id);
    run(
      db,
      "UPDATE practice_setting SET value=? WHERE id=1",
      JSON.stringify({ name: "Changed issuer" }),
    );
    const invoice = invoiceFor(db, patient, result.invoice.id);
    expect(invoice.amount_cents).toBe(65000);
    expect(invoice.patient_name).toBe("Patient");
    expect(JSON.parse(invoice.issuer_json).name).toBe("Our Village");
  });
  it("protects patient invoices, appointment changes and doctor records against IDOR", () => {
    const result = book();
    expect(() => invoiceFor(db, otherPatient, result.invoice.id)).toThrow();
    expect(() => invoiceFor(db, otherDoc, result.invoice.id)).toThrow();
    expect(() =>
      changeAppointment(
        db,
        otherPatient,
        result.appointment.id,
        { action: "cancel" },
        now,
      ),
    ).toThrow();
    expect(() =>
      changeAppointment(
        db,
        otherDoc,
        result.appointment.id,
        { action: "cancel" },
        now,
      ),
    ).toThrow();
  });
  it("expires holds and frees the slot without confirming unpaid bookings", () => {
    const result = book();
    expireHolds(db, now + 16 * 60000);
    expect(
      one(
        db,
        "SELECT status FROM appointment WHERE id=?",
        result.appointment.id,
      ).status,
    ).toBe("expired");
    expect(
      one(db, "SELECT state FROM invoice WHERE id=?", result.invoice.id).state,
    ).toBe("void");
    expect(
      slots(db, "natasha-service", "2026-11-03", now + 16 * 60000)[0].start,
    ).toBe(start);
  });
  it("prevents blocking existing bookings and allows a doctor to cancel only their own", () => {
    const result = book();
    expect(() =>
      addBlock(
        db,
        doc,
        "natasha",
        { start, end: "2026-11-03T08:00:00.000Z" },
        now,
      ),
    ).toThrow();
    changeAppointment(
      db,
      doc,
      result.appointment.id,
      { action: "cancel" },
      now,
    );
    expect(
      one(db, "SELECT state FROM invoice WHERE id=?", result.invoice.id).state,
    ).toBe("void");
  });
  it("reschedules without repricing the existing invoice or duration", () => {
    const result = book();
    run(
      db,
      "UPDATE service SET amount_cents=90000,duration_minutes=60 WHERE id=?",
      "natasha-service",
    );
    const changed = changeAppointment(
      db,
      doc,
      result.appointment.id,
      { action: "reschedule", start: "2026-11-03T08:00:00.000Z" },
      now,
    );
    expect(changed.end_at).toBe("2026-11-03T08:30:00.000Z");
    expect(
      one(db, "SELECT amount_cents FROM invoice WHERE id=?", result.invoice.id)
        .amount_cents,
    ).toBe(65000);
  });
  it("rolls back the entire reservation if invoice creation fails", () => {
    db.exec(
      "CREATE TRIGGER reject_invoice BEFORE INSERT ON invoice BEGIN SELECT RAISE(ABORT,'test failure'); END",
    );
    expect(() => book()).toThrow();
    expect(one(db, "SELECT count(*) n FROM appointment").n).toBe(0);
  });
});

describe("payment links and verification", () => {
  const secret = "whsec_" + Buffer.alloc(32, 1).toString("base64");
  function signed(raw: string, timestamp = Math.floor(now / 1000).toString()) {
    const signature = createHmac("sha256", Buffer.alloc(32, 1))
      .update("msg_test." + timestamp + "." + raw)
      .digest("base64");
    return {
      "webhook-id": "msg_test",
      "webhook-timestamp": timestamp,
      "webhook-signature": "v1," + signature,
    };
  }
  it("verifies raw-body signatures, timestamp tolerance and multiple signature versions", () => {
    const raw = '{"type":"payment.succeeded"}',
      headers = signed(raw);
    expect(() => verifyWebhook(raw, headers, secret, now)).not.toThrow();
    expect(() =>
      verifyWebhook(
        raw,
        {
          ...headers,
          "webhook-signature": "v2,ignored " + headers["webhook-signature"],
        },
        secret,
        now,
      ),
    ).not.toThrow();
    expect(() => verifyWebhook(raw + " ", headers, secret, now)).toThrow();
    expect(() =>
      verifyWebhook(
        raw,
        signed(raw, String(Math.floor(now / 1000) - 181)),
        secret,
        now,
      ),
    ).toThrow();
    expect(() => verifyWebhook(raw, {}, secret, now)).toThrow();
    expect(() =>
      verifyWebhook(
        raw,
        { ...headers, "webhook-signature": "v1,short" },
        secret,
        now,
      ),
    ).toThrow();
  });
  it("correlates signed payment events with checkout, currency, amount and mode and deduplicates retries", () => {
    const result = book();
    run(
      db,
      "UPDATE invoice SET checkout_id=? WHERE id=?",
      "checkout_test",
      result.invoice.id,
    );
    const event = {
      id: "event_1",
      type: "payment.succeeded",
      payload: {
        id: "payment_1",
        mode: "test",
        status: "succeeded",
        currency: "ZAR",
        amount: 65000,
        metadata: { checkoutId: "checkout_test" },
      },
    };
    expect(() =>
      handlePaymentEvent(
        db,
        { ...event, payload: { ...event.payload, amount: 1 } },
        now,
      ),
    ).toThrow();
    expect(() =>
      handlePaymentEvent(
        db,
        { ...event, payload: { ...event.payload, mode: "live" } },
        now,
      ),
    ).toThrow();
    expect(() =>
      handlePaymentEvent(
        db,
        { ...event, payload: { ...event.payload, currency: "USD" } },
        now,
      ),
    ).toThrow();
    expect(handlePaymentEvent(db, event, now).processed).toBe(true);
    expect(handlePaymentEvent(db, event, now).duplicate).toBe(true);
    expect(
      one(
        db,
        "SELECT status FROM appointment WHERE id=?",
        result.appointment.id,
      ).status,
    ).toBe("confirmed");
    expect(
      one(
        db,
        "SELECT payment_method FROM invoice WHERE id=?",
        result.invoice.id,
      ).payment_method,
    ).toBe("yoco_test");
    expect(one(db, "SELECT count(*) n FROM payment_event").n).toBe(1);
  });
  it("records late payments for review without stealing a newly reserved slot", () => {
    const first = book();
    expireHolds(db, now + 16 * 60000);
    const second = createAppointment(
      db,
      otherPatient,
      { serviceId: "natasha-service", start, requestKey: "new-owner" },
      now + 16 * 60000,
    );
    transaction(db, () =>
      settleInvoice(
        db,
        first.invoice.id,
        "late-payment",
        "yoco_test",
        now + 17 * 60000,
      ),
    );
    expect(
      one(db, "SELECT status FROM appointment WHERE id=?", first.appointment.id)
        .status,
    ).toBe("payment_review");
    expect(
      one(
        db,
        "SELECT status FROM appointment WHERE id=?",
        second.appointment.id,
      ).status,
    ).toBe("hold");
    expect(
      one(db, "SELECT state FROM invoice WHERE id=?", first.invoice.id).state,
    ).toBe("refund_review");
  });
  it("keeps shared links hashed, scoped and expiring and rejects unauthorised generation", () => {
    const result = book(),
      link = createPaymentLink(
        db,
        patient,
        result.invoice.id,
        "https://staging.example.test",
        now,
      ),
      token = link.url.split("/").at(-1)!;
    expect(invoiceFromToken(db, token, now).id).toBe(result.invoice.id);
    expect(one(db, "SELECT token_hash FROM payment_link").token_hash).not.toBe(
      token,
    );
    expect(() =>
      createPaymentLink(
        db,
        otherPatient,
        result.invoice.id,
        "https://staging.example.test",
        now,
      ),
    ).toThrow();
    expect(() => invoiceFromToken(db, token, now + 16 * 60000)).toThrow();
    expect(() => invoiceFromToken(db, "invalid", now)).toThrow();
  });
  it("flags paid cancellations for review instead of pretending to refund", () => {
    const result = book();
    transaction(db, () =>
      settleInvoice(
        db,
        result.invoice.id,
        "test-paid",
        "staging_simulation",
        now,
      ),
    );
    changeAppointment(
      db,
      doc,
      result.appointment.id,
      { action: "cancel" },
      now,
    );
    expect(
      one(
        db,
        "SELECT state,payment_method FROM invoice WHERE id=?",
        result.invoice.id,
      ),
    ).toMatchObject({
      state: "refund_review",
      payment_method: "staging_simulation",
    });
  });
});
