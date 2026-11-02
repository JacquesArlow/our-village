import { actor } from "../../utils/access";
import { database } from "../../core/database";
import { invoiceFor, one, expireHolds } from "../../core/store";
export default defineEventHandler(async (event) => {
  const db = database(),
    user = await actor(event);
  expireHolds(db);
  const invoice = invoiceFor(db, user, getRouterParam(event, "id")!);
  return {
    invoice,
    practice: JSON.parse(invoice.issuer_json),
    appointment: invoice.appointment_id
      ? one(
          db,
          "SELECT start_at,end_at,status,hold_until,payment_review FROM appointment WHERE id=?",
          invoice.appointment_id,
        )
      : null,
  };
});
