import { actor } from "../../../utils/access";
import { database } from "../../../core/database";
import { doctorFor, one, run, audit } from "../../../core/store";
import { fail } from "../../../core/validation";
export default defineEventHandler(async (event) => {
  const user = await actor(event),
    db = database(),
    id = getRouterParam(event, "id")!;
  const block = one(db, "SELECT * FROM time_block WHERE id=?", id);
  if (!block) fail(404, "Time off not found.");
  doctorFor(db, user, block.doctor_id);
  run(db, "DELETE FROM time_block WHERE id=?", id);
  audit(db, user.id, "time_block.delete", id);
  return { ok: true };
});
