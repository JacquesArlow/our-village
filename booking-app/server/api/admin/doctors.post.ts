import { randomUUID } from "node:crypto";
import { actor } from "../../utils/access";
import { auth } from "../../core/auth";
import { database, transaction } from "../../core/database";
import { requireRole, one, run, audit } from "../../core/store";
import { email, text, fail } from "../../core/validation";
export default defineEventHandler(async (event) => {
  const admin = await actor(event),
    body = await readBody(event),
    db = database();
  requireRole(admin, ["admin"]);
  const name = text(body.name, "doctor name", 100),
    address = email(body.email),
    password = text(body.password, "temporary password", 128);
  if (password.length < 12)
    fail(400, "Use a temporary password of at least 12 characters.");
  if (one(db, "SELECT id FROM user WHERE email=?", address))
    fail(
      409,
      "That account already exists. An existing patient account cannot be promoted here.",
    );
  const result = await auth.api.signUpEmail({
    body: { email: address, name, password },
  });
  const id = randomUUID();
  transaction(db, () => {
    run(
      db,
      "UPDATE user SET role='doctor',mustChangePassword=1 WHERE id=?",
      result.user.id,
    );
    run(
      db,
      "INSERT INTO doctor(id,user_id,name,created_at) VALUES(?,?,?,?)",
      id,
      result.user.id,
      name,
      Date.now(),
    );
    audit(db, admin.id, "doctor.create", id);
  });
  return {
    id,
    email: address,
    message:
      "Doctor account created. No email was sent; share the temporary credentials securely.",
  };
});
