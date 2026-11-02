import { actor } from "../../utils/access";
import { database } from "../../core/database";
import { many, expireHolds, requireRole } from "../../core/store";
export default defineEventHandler(async (event) => {
  const user = await actor(event),
    db = database();
  requireRole(user, ["patient"]);
  expireHolds(db);
  return {
    appointments: many(
      db,
      `SELECT a.*,d.name AS doctor_name,i.id AS invoice_id,i.seq AS invoice_seq,i.state AS invoice_state,i.payment_method FROM appointment a JOIN doctor d ON d.id=a.doctor_id LEFT JOIN invoice i ON i.appointment_id=a.id WHERE a.patient_id=? ORDER BY a.start_at DESC LIMIT 200`,
      user.id,
    ),
    invoices: many(
      db,
      "SELECT id,seq,description,amount_cents,currency,state,created_at,paid_at,payment_method FROM invoice WHERE patient_id=? ORDER BY seq DESC LIMIT 200",
      user.id,
    ),
  };
});
