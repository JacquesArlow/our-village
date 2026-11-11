import { actor } from "../../utils/access";
import { database } from "../../core/database";
import { run, audit, requireRole } from "../../core/store";
import { text, fail } from "../../core/validation";
export default defineEventHandler(async (event) => {
  const user = await actor(event),
    body = await readBody(event);
  requireRole(user, ["patient"]);
  const phone = text(body.phone, "phone number", 30);
  if (!/^[+\d ()-]{7,30}$/.test(phone) || body.consent !== true)
    fail(400, "Enter a contact number and acknowledge the privacy notice.");
  run(
    database(),
    "INSERT INTO patient_profile(user_id,phone,consent_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET phone=excluded.phone,consent_at=excluded.consent_at",
    user.id,
    phone,
    Date.now(),
  );
  audit(database(), user.id, "patient.profile", user.id);
  return { ok: true };
});
