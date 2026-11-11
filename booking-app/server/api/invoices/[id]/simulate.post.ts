import { randomUUID } from "node:crypto";
import { actor } from "../../../utils/access";
import { database, transaction } from "../../../core/database";
import {
  invoiceFor,
  assertPayable,
  settleInvoice,
  requireRole,
  audit,
} from "../../../core/store";
import { fail } from "../../../core/validation";
import { paymentOptions } from "../../../core/payment-mode";
export default defineEventHandler(async (event) => {
  const user = await actor(event),
    db = database();
  requireRole(user, ["admin"]);
  return transaction(db, () => {
    if (!paymentOptions(db).simulatedPaymentsEnabled)
      fail(403, "Payment simulations are available only in test mode.");
    const invoice = invoiceFor(db, user, getRouterParam(event, "id")!);
    if (invoice.payment_mode !== "test" || invoice.checkout_id)
      fail(409, "Only test invoices without an open Yoco checkout can be simulated.");
    assertPayable(db, invoice);
    const result = settleInvoice(
      db,
      invoice.id,
      "sim_" + randomUUID(),
      "staging_simulation",
    );
    audit(db, user.id, "payment.simulated", invoice.id, "NO MONEY RECEIVED");
    return result;
  });
});
