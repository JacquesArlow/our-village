import { database } from "../../core/database";
import { many } from "../../core/store";
export default defineEventHandler(() => {
  const db = database();
  return many(
    db,
    "SELECT id,name,title,description,location,onboarded FROM doctor WHERE active=1 ORDER BY created_at",
  ).map((doctor) => ({
    ...doctor,
    services: doctor.onboarded
      ? many(
          db,
          "SELECT id,name,duration_minutes,buffer_minutes,amount_cents FROM service WHERE doctor_id=? AND active=1 ORDER BY name",
          doctor.id,
        )
      : [],
  }));
});
