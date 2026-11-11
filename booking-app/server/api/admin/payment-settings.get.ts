import { database } from "../../core/database";
import { paymentOptions, yocoCheckoutKey } from "../../core/payment-mode";
import { staffDesk } from "../../core/runtime";
import { requireRole } from "../../core/store";
import { fail } from "../../core/validation";
import { actor } from "../../utils/access";

export default defineEventHandler(async (event) => {
  if (!staffDesk) fail(404, "Payment settings are available in Village Desk.");
  requireRole(await actor(event), ["admin"]);
  return {
    ...paymentOptions(database()),
    testReady: !!yocoCheckoutKey("test"),
    liveReady: !!yocoCheckoutKey("live"),
  };
});
