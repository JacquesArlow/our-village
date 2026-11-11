import { randomBytes, randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { hashPassword } from "better-auth/crypto";
import { accountRoles, type AccountRole } from "../../shared/accounts";
import { transaction } from "./database";
import { isTestAddress, livePreview } from "./runtime";
import { audit, many, one, requireRole, run, type Actor } from "./store";
import { email, fail, integer, text } from "./validation";

const pageSize = 30;

export function accountDirectory(
  db: DatabaseSync,
  query: Record<string, unknown>,
  reception = false,
) {
  const search = text(query.q ?? "", "search", 120, false).toLowerCase();
  const page = integer(Number(query.page ?? 1), "page", 1, 100000);
  const role = reception ? "patient" : query.role || "";
  if (role && !accountRoles.includes(role as AccountRole))
    fail(400, "Choose a valid role.");
  const from = `FROM user u LEFT JOIN patient_profile p ON p.user_id=u.id
    WHERE (?='' OR u.role=?)
    AND (?='' OR instr(lower(u.name),?)>0 OR instr(lower(u.email),?)>0 OR instr(COALESCE(p.phone,''),?)>0)
    ${reception && livePreview ? "AND u.email NOT LIKE '%@our-village-preview.test'" : ""}`;
  const args = [role as string, role as string, search, search, search, search];
  const fields = reception
    ? "u.id,u.name,u.email,p.phone"
    : "u.id,u.name,u.email,u.role,u.disabledAt,u.mustChangePassword,p.phone,p.consent_at";
  return {
    users: many(
      db,
      `SELECT ${fields} ${from} ORDER BY u.name,u.id LIMIT ? OFFSET ?`,
      ...args,
      pageSize,
      (page - 1) * pageSize,
    ),
    total: one(db, `SELECT count(*) AS total ${from}`, ...args).total,
    pageSize,
  };
}

function managedEmail(value: unknown) {
  const address = email(value);
  if (livePreview && isTestAddress(address))
    fail(400, "Use a real email address for a live booking account.");
  return address;
}

function availableEmail(db: DatabaseSync, address: string, id = "") {
  if (
    one(db, "SELECT id FROM user WHERE lower(email)=? AND id<>?", address, id)
  )
    fail(409, "That email is already assigned to an account.");
}

export function requireCurrentAdmin(db: DatabaseSync, admin: Actor) {
  requireRole(admin, ["admin"]);
  if (
    !one(
      db,
      "SELECT id FROM user WHERE id=? AND role='admin' AND disabledAt IS NULL AND mustChangePassword=0",
      admin.id,
    )
  )
    fail(403, "Administrator access is required.");
}

function managedUser(db: DatabaseSync, id: string) {
  const user = one(
    db,
    "SELECT id,name,email,role,disabledAt FROM user WHERE id=?",
    id,
  );
  if (!user) fail(404, "Account not found.");
  return user;
}

function temporaryCredential(password?: unknown) {
  const temporaryPassword =
    password === undefined
      ? randomBytes(24).toString("hex")
      : text(password, "temporary password", 128);
  if (temporaryPassword.length < 12) fail(400, "Use at least 12 characters.");
  return temporaryPassword;
}

function credentialPassword(db: DatabaseSync, id: string, hash: string) {
  const result = run(
    db,
    "UPDATE account SET password=?,updatedAt=? WHERE userId=? AND providerId='credential'",
    hash,
    Date.now(),
    id,
  );
  if (result.changes !== 1)
    fail(409, "This account does not have a password login.");
  run(db, "UPDATE user SET mustChangePassword=1 WHERE id=?", id);
  run(db, "DELETE FROM session WHERE userId=?", id);
}

export async function createManagedUser(
  db: DatabaseSync,
  admin: Actor,
  input: Record<string, unknown>,
) {
  requireCurrentAdmin(db, admin);
  const name = text(input.name, "name", 100);
  const address = managedEmail(input.email);
  const role = input.role as AccountRole;
  if (!accountRoles.includes(role)) fail(400, "Choose a valid role.");
  const temporaryPassword = temporaryCredential(input.password);
  const hash = await hashPassword(temporaryPassword);
  return transaction(db, () => {
    requireCurrentAdmin(db, admin);
    availableEmail(db, address);
    const id = randomUUID(),
      now = Date.now();
    run(
      db,
      "INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt,role,mustChangePassword) VALUES(?,?,?,0,?,?,?,1)",
      id,
      name,
      address,
      now,
      now,
      role,
    );
    run(
      db,
      "INSERT INTO account(id,accountId,providerId,userId,password,createdAt,updatedAt) VALUES(?,?,'credential',?,?,?,?)",
      randomUUID(),
      id,
      id,
      hash,
      now,
      now,
    );
    const doctorId = role === "doctor" ? randomUUID() : undefined;
    if (doctorId)
      run(
        db,
        "INSERT INTO doctor(id,user_id,name,created_at) VALUES(?,?,?,?)",
        doctorId,
        id,
        name,
        now,
      );
    audit(db, admin.id, "account.create", id, role);
    return { id, doctorId, email: address, temporaryPassword };
  });
}

export async function editManagedUser(
  db: DatabaseSync,
  admin: Actor,
  id: string,
  input: Record<string, unknown>,
) {
  requireCurrentAdmin(db, admin);
  const user = managedUser(db, id);
  const name = text(input.name, "name", 100);
  const address = managedEmail(input.email);
  const phone =
    input.phone === undefined
      ? undefined
      : text(input.phone, "phone", 30, false);
  const changingEmail = user.email !== address;
  if (changingEmail && admin.id === id)
    fail(400, "Ask another administrator to change your sign-in email.");
  const temporaryPassword = changingEmail ? temporaryCredential() : undefined;
  const hash = temporaryPassword
    ? await hashPassword(temporaryPassword)
    : undefined;
  return transaction(db, () => {
    requireCurrentAdmin(db, admin);
    if (managedUser(db, id).email !== user.email)
      fail(409, "The account changed. Reload it and try again.");
    availableEmail(db, address, id);
    run(
      db,
      "UPDATE user SET name=?,email=?,updatedAt=? WHERE id=?",
      name,
      address,
      Date.now(),
      id,
    );
    if (user.role === "patient" && phone !== undefined)
      run(db, "UPDATE patient_profile SET phone=? WHERE user_id=?", phone, id);
    if (user.role === "doctor" && name !== user.name)
      run(db, "UPDATE doctor SET name=? WHERE user_id=?", name, id);
    if (hash) {
      credentialPassword(db, id, hash);
      run(db, "UPDATE user SET emailVerified=0 WHERE id=?", id);
    }
    audit(db, admin.id, "account.update", id);
    return { ok: true, email: address, temporaryPassword };
  });
}

export function setManagedUserEnabled(
  db: DatabaseSync,
  admin: Actor,
  id: string,
  enabled: unknown,
) {
  if (typeof enabled !== "boolean") fail(400, "Choose a valid account status.");
  return transaction(db, () => {
    requireCurrentAdmin(db, admin);
    const user = managedUser(db, id);
    if (!enabled && admin.id === id)
      fail(400, "You cannot disable your own administrator account.");
    if (enabled) {
      managedEmail(user.email);
      if (
        !one(
          db,
          "SELECT id FROM account WHERE userId=? AND providerId='credential' AND password IS NOT NULL",
          id,
        )
      )
        fail(409, "Set a temporary password before reactivating this account.");
    }
    run(
      db,
      "UPDATE user SET disabledAt=?,updatedAt=? WHERE id=?",
      enabled ? null : Date.now(),
      Date.now(),
      id,
    );
    if (!enabled) run(db, "DELETE FROM session WHERE userId=?", id);
    audit(db, admin.id, enabled ? "account.enable" : "account.disable", id);
    return { ok: true };
  });
}

export async function resetManagedPassword(
  db: DatabaseSync,
  admin: Actor,
  id: string,
  password?: unknown,
) {
  requireCurrentAdmin(db, admin);
  if (admin.id === id)
    fail(400, "Use Change my password for your own account.");
  const user = managedUser(db, id);
  managedEmail(user.email);
  const temporaryPassword = temporaryCredential(password);
  const hash = await hashPassword(temporaryPassword);
  return transaction(db, () => {
    requireCurrentAdmin(db, admin);
    if (managedUser(db, id).email !== user.email)
      fail(409, "The account changed. Reload it and try again.");
    credentialPassword(db, id, hash);
    audit(db, admin.id, "account.temporary_password", id);
    return { ok: true, email: user.email, temporaryPassword };
  });
}
