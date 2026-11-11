import { fail } from "../../../../core/validation";
import { receiveYocoWebhook } from "../../../../utils/yoco-webhook";

export default defineEventHandler((event) => {
  const mode = getRouterParam(event, "mode");
  if (mode !== "test" && mode !== "live") fail(404, "Webhook not found.");
  return receiveYocoWebhook(event, mode);
});
