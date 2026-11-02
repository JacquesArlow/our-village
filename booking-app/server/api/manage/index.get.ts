import { actor } from "../../utils/access";
import { database } from "../../core/database";
import { doctorFor, many, expireHolds } from "../../core/store";
import { date } from "../../core/validation";
import { localDay } from "../../core/schedule";
export default defineEventHandler(async (event) => {
  const user = await actor(event),
    q = getQuery(event),
    db = database();
  const doctor = doctorFor(
    db,
    user,
    typeof q.doctorId === "string" ? q.doctorId : undefined,
  );
  const day = date(q.date || localDay()),
    start = new Date(day + "T00:00:00+02:00").toISOString(),
    end = new Date(Date.parse(start) + 7 * 86400000).toISOString();
  expireHolds(db);
  return {
    doctor,
    services: many(
      db,
      "SELECT * FROM service WHERE doctor_id=? ORDER BY active DESC,name",
      doctor.id,
    ),
    blocks: many(
      db,
      "SELECT * FROM time_block WHERE doctor_id=? AND end_at>? ORDER BY start_at LIMIT 200",
      doctor.id,
      start,
    ),
    appointments: many(
      db,
      `SELECT a.*,u.name AS patient_name,u.email AS patient_email,p.phone,i.id AS invoice_id,i.seq AS invoice_seq,i.state AS invoice_state,i.payment_method FROM appointment a JOIN user u ON u.id=a.patient_id LEFT JOIN patient_profile p ON p.user_id=a.patient_id LEFT JOIN invoice i ON i.appointment_id=a.id WHERE a.doctor_id=? AND a.start_at>=? AND a.start_at<? ORDER BY a.start_at`,
      doctor.id,
      start,
      end,
    ),
  };
});
