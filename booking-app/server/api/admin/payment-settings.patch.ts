import { requireCurrentAdmin } from "../../core/accounts";
import { database, transaction } from "../../core/database";
import { paymentMode, requirePaymentMode, yocoCheckoutKey } from "../../core/payment-mode";
import { staffDesk } from "../../core/runtime";
import { audit, requireRole, run } from "../../core/store";
import { fail } from "../../core/validation";
import { actor } from "../../utils/access";

export default defineEventHandler(async (event) => {
  if (!staffDesk) fail(404, "Payment settings are available in Village Desk.");
  const admin = await actor(event);
  requireRole(admin, ["admin"]);
  const { mode, expectedMode } = (await readBody(event)) ?? {};
  if (mode !== "test" && mode !== "live") fail(400, "Choose test or live mode.");
  const db = database();
  return transaction(db, () => {
    requireCurrentAdmin(db, admin);
    requirePaymentMode(db, expectedMode);
    if (paymentMode(db) === mode) return { mode };
    if (mode === "live" && !yocoCheckoutKey("live"))
      fail(409, "Configure the Yoco live secret key and webhook before enabling live payments.");
    run(db, "UPDATE payment_setting SET mode=? WHERE id=1", mode);
    audit(db, admin.id, "payment.mode_changed", "payment_settings", mode);
    return { mode };
  });
});
