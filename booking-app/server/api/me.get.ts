import { actor } from "../utils/access";
import { database } from "../core/database";
import { one } from "../core/store";
export default defineEventHandler(async (event) => {
  const user = await actor(event, true);
  return {
    user,
    patient:
      one(
        database(),
        "SELECT phone,consent_at FROM patient_profile WHERE user_id=?",
        user.id,
      ) ?? null,
    doctor:
      user.role === "doctor"
        ? one(
            database(),
            "SELECT id,onboarded FROM doctor WHERE user_id=?",
            user.id,
          )
        : null,
  };
});
