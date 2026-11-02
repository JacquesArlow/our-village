import { database } from "../core/database";
export default defineEventHandler(() => {
  database().prepare("SELECT 1").get();
  return { ok: true, app: "our-village-bookings", mode: "staging" };
});
