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
import { livePreview } from "../../../core/runtime";
export default defineEventHandler(async (event) => {
  const user = await actor(event),
    db = database();
  requireRole(user, ["admin"]);
  if (
    (process.env.APP_MODE !== "staging" && !livePreview) ||
    process.env.ENABLE_STAGING_SIMULATIONS !== "true"
  )
    fail(403, "Staging simulations are disabled.");
  return transaction(db, () => {
    const invoice = invoiceFor(db, user, getRouterParam(event, "id")!);
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
