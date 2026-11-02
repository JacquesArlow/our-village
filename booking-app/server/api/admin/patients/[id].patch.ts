import { actor } from "../../../utils/access";
import { database } from "../../../core/database";
import { requireRole, one, run, audit } from "../../../core/store";
import { text, fail } from "../../../core/validation";
export default defineEventHandler(async (event) => {
  const admin = await actor(event),
    db = database(),
    id = getRouterParam(event, "id")!,
    input = await readBody(event);
  requireRole(admin, ["admin"]);
  if (!one(db, "SELECT id FROM user WHERE id=? AND role='patient'", id))
    fail(404, "Patient not found.");
  const name = text(input.name, "patient name", 100),
    phone = text(input.phone || "", "phone", 30, false);
  run(db, "UPDATE user SET name=? WHERE id=?", name, id);
  run(db, "UPDATE patient_profile SET phone=? WHERE user_id=?", phone, id);
  audit(db, admin.id, "patient.update", id);
  return { ok: true };
});
