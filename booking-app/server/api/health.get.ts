import { database } from "../core/database";
import { livePreview, staffDesk } from "../core/runtime";
export default defineEventHandler(() => {
  database().prepare("SELECT disabledAt FROM user LIMIT 1").get();
  return {
    ok: true,
    app: "our-village-bookings",
    mode: livePreview ? "live-preview" : "staging",
    audience: livePreview ? (staffDesk ? "staff" : "patient") : "mixed",
  };
});
