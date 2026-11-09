import { DatabaseSync } from "node:sqlite";
import { mkdirSync, chmodSync } from "node:fs";
import { dirname } from "node:path";

export function openDatabase(path: string) {
  if (path !== ":memory:")
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  db.exec(
    "PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;",
  );
  if (path !== ":memory:") chmodSync(path, 0o600);
  return db;
}

export function migrateDomain(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS doctor (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE REFERENCES user(id), name TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '', location TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1 CHECK(active IN(0,1)), onboarded INTEGER NOT NULL DEFAULT 0 CHECK(onboarded IN(0,1)),
      weekly_hours TEXT NOT NULL DEFAULT '[]', min_notice_hours INTEGER NOT NULL DEFAULT 24,
      horizon_days INTEGER NOT NULL DEFAULT 60, cancellation_hours INTEGER NOT NULL DEFAULT 24,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS service (
      id TEXT PRIMARY KEY, doctor_id TEXT NOT NULL REFERENCES doctor(id), name TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL CHECK(duration_minutes BETWEEN 5 AND 240),
      buffer_minutes INTEGER NOT NULL CHECK(buffer_minutes BETWEEN 0 AND 120),
      amount_cents INTEGER NOT NULL CHECK(amount_cents BETWEEN 200 AND 10000000),
      active INTEGER NOT NULL DEFAULT 1 CHECK(active IN(0,1))
    );
    CREATE TABLE IF NOT EXISTS time_block (
      id TEXT PRIMARY KEY, doctor_id TEXT NOT NULL REFERENCES doctor(id), start_at TEXT NOT NULL, end_at TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT 'Unavailable', CHECK(end_at>start_at)
    );
    CREATE TABLE IF NOT EXISTS patient_profile (
      user_id TEXT PRIMARY KEY REFERENCES user(id), phone TEXT NOT NULL DEFAULT '', consent_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS appointment (
      id TEXT PRIMARY KEY, doctor_id TEXT NOT NULL REFERENCES doctor(id), patient_id TEXT NOT NULL REFERENCES user(id),
      service_id TEXT NOT NULL REFERENCES service(id), service_name TEXT NOT NULL,
      start_at TEXT NOT NULL, end_at TEXT NOT NULL, busy_until TEXT NOT NULL,
      amount_cents INTEGER NOT NULL CHECK(amount_cents>=200),
      status TEXT NOT NULL CHECK(status IN('hold','confirmed','completed','cancelled','expired','payment_review','no_show')),
      hold_until INTEGER, payment_review INTEGER NOT NULL DEFAULT 0,
      request_key TEXT NOT NULL, created_at INTEGER NOT NULL, UNIQUE(patient_id,request_key), CHECK(end_at>start_at)
    );
    CREATE INDEX IF NOT EXISTS appointment_doctor_time ON appointment(doctor_id,start_at,busy_until);
    CREATE INDEX IF NOT EXISTS appointment_patient ON appointment(patient_id);
    CREATE TABLE IF NOT EXISTS invoice (
      seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE, patient_id TEXT NOT NULL REFERENCES user(id),
      doctor_id TEXT REFERENCES doctor(id), appointment_id TEXT UNIQUE REFERENCES appointment(id),
      description TEXT NOT NULL, amount_cents INTEGER NOT NULL CHECK(amount_cents>=200), currency TEXT NOT NULL DEFAULT 'ZAR',
      patient_name TEXT NOT NULL, patient_email TEXT NOT NULL, doctor_name TEXT NOT NULL DEFAULT '',
      issuer_json TEXT NOT NULL, vat_cents INTEGER NOT NULL DEFAULT 0,
      state TEXT NOT NULL DEFAULT 'unpaid' CHECK(state IN('unpaid','paid','void','refund_review')),
      checkout_id TEXT UNIQUE, checkout_url TEXT, payment_id TEXT UNIQUE, payment_method TEXT,
      created_at INTEGER NOT NULL, paid_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS payment_link (
      id TEXT PRIMARY KEY, invoice_id TEXT NOT NULL REFERENCES invoice(id), token_hash TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS payment_event (id TEXT PRIMARY KEY, checkout_id TEXT NOT NULL, received_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS audit (
      id TEXT PRIMARY KEY, actor_id TEXT, action TEXT NOT NULL, entity_id TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS practice_setting (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL);
    INSERT OR IGNORE INTO practice_setting(id,value) VALUES(1,'{"name":"Our Village","address":"525 Alsation Drive, Garsfontein, Pretoria","registrationNumber":"","vatNumber":"","taxMode":"not_configured"}');
    CREATE TABLE IF NOT EXISTS rate_limit (key TEXT PRIMARY KEY, window_at INTEGER NOT NULL, count INTEGER NOT NULL);
  `);
}

export function transaction<T>(db: DatabaseSync, action: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = action();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

let singleton: DatabaseSync | undefined;
export function database() {
  return (singleton ??= openDatabase(
    process.env.BOOKING_DATABASE_PATH || "./.data/bookings.db",
  ));
}
