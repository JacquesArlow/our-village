import { hashPassword } from "better-auth/crypto";
import { actor } from "../../../../utils/access";
import { database, transaction } from "../../../../core/database";
import { requireRole, one, run, audit } from "../../../../core/store";
import { text, fail } from "../../../../core/validation";
export default defineEventHandler(async (event) => {
  const admin = await actor(event),
    db = database(),
    id = getRouterParam(event, "id")!,
    input = await readBody(event);
  requireRole(admin, ["admin"]);
  const target = one(db, "SELECT id,role FROM user WHERE id=?", id);
  if (!target || !["patient", "doctor"].includes(target.role))
    fail(403, "Only doctor and patient temporary passwords can be reset here.");
  const password = text(input.password, "temporary password", 128);
  if (password.length < 12) fail(400, "Use at least 12 characters.");
  const hash = await hashPassword(password);
  transaction(db, () => {
    run(
      db,
      "UPDATE account SET password=? WHERE userId=? AND providerId=?",
      hash,
      id,
      "credential",
    );
    run(db, "UPDATE user SET mustChangePassword=1 WHERE id=?", id);
    run(db, "DELETE FROM session WHERE userId=?", id);
    audit(db, admin.id, "account.temporary_password", id);
  });
  return {
    ok: true,
    message: "Temporary password set; all sessions revoked. No email sent.",
  };
});
