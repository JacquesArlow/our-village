import { actor } from "../../../utils/access";
import { database } from "../../../core/database";
import { appointmentFor, one, conflict } from "../../../core/store";
import { candidateSlots } from "../../../core/schedule";
import { date } from "../../../core/validation";
export default defineEventHandler(async (event) => {
  const db = database(),
    row = appointmentFor(db, await actor(event), getRouterParam(event, "id")!),
    day = date(getQuery(event).date);
  const doctor = one(
    db,
    "SELECT d.* FROM doctor d JOIN user u ON u.id=d.user_id WHERE d.id=? AND u.disabledAt IS NULL",
    row.doctor_id,
  );
  if (!doctor?.active || !doctor.onboarded) return [];
  const frozen = {
    duration_minutes:
      (Date.parse(row.end_at) - Date.parse(row.start_at)) / 60000,
    buffer_minutes:
      (Date.parse(row.busy_until) - Date.parse(row.end_at)) / 60000,
  };
  const now = Date.now();
  return candidateSlots(doctor, frozen, day, now).filter(
    (slot) => !conflict(db, doctor.id, slot.start, slot.busyUntil, now, row.id),
  );
});
