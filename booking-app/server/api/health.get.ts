import { database } from "../core/database";
import { livePreview } from "../core/runtime";
export default defineEventHandler(() => {
  database().prepare("SELECT 1 FROM doctor LIMIT 1").get();
  return { ok: true, app: "our-village-bookings", mode: livePreview ? "live-preview" : "staging" };
});
