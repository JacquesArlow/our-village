import { actor } from "../../utils/access";
import { database } from "../../core/database";
import { many, one, requireRole, expireHolds } from "../../core/store";
export default defineEventHandler(async (event) => {
  const user = await actor(event),
    db = database();
  requireRole(user, ["admin"]);
  expireHolds(db);
  return {
    doctors: many(
      db,
      "SELECT d.*,u.email,u.disabledAt FROM doctor d JOIN user u ON u.id=d.user_id ORDER BY d.created_at",
    ),
    services: many(db, "SELECT * FROM service ORDER BY name"),
    patients: many(
      db,
      "SELECT u.id,u.name,u.email,p.phone FROM user u LEFT JOIN patient_profile p ON p.user_id=u.id WHERE u.role='patient' AND u.disabledAt IS NULL ORDER BY u.name LIMIT 500",
    ),
    invoices: many(db, "SELECT * FROM invoice ORDER BY seq DESC LIMIT 200"),
    audit: many(
      db,
      "SELECT a.action,a.entity_id,a.detail,a.created_at,u.name AS actor FROM audit a LEFT JOIN user u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 100",
    ),
    practice: JSON.parse(
      one(db, "SELECT value FROM practice_setting WHERE id=1").value,
    ),
  };
});
