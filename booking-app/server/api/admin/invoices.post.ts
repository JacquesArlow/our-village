import { actor } from "../../utils/access";
import { database, transaction } from "../../core/database";
import { requirePaymentMode } from "../../core/payment-mode";
import { requireRole, one, makeInvoice, audit } from "../../core/store";
import { text, integer, fail } from "../../core/validation";
export default defineEventHandler(async (event) => {
  const admin = await actor(event),
    input = await readBody(event),
    db = database();
  requireRole(admin, ["admin"]);
  const patientId = text(input.patientId, "patient", 100),
    doctorId = input.doctorId ? text(input.doctorId, "doctor", 100) : null;
  if (!one(db, "SELECT id FROM user WHERE id=? AND role='patient'", patientId))
    fail(404, "Patient not found.");
  if (doctorId && !one(db, "SELECT id FROM doctor WHERE id=?", doctorId))
    fail(404, "Doctor not found.");
  return transaction(db, () => {
    requirePaymentMode(db, input.paymentMode ?? "test");
    const invoice = makeInvoice(
      db,
      patientId,
      doctorId,
      text(input.description, "invoice description", 250),
      integer(input.amountCents, "amount in cents", 200, 10000000),
    );
    audit(db, admin.id, "invoice.create", invoice.id);
    return invoice;
  });
});
