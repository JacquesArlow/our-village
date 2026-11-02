import { actor } from "../../utils/access";
import { database } from "../../core/database";
import { requireRole, run, audit } from "../../core/store";
import { text, integer, fail } from "../../core/validation";
export default defineEventHandler(async (event) => {
  const admin = await actor(event),
    input = await readBody(event);
  requireRole(admin, ["admin"]);
  if (!["not_configured", "no_vat", "vat_inclusive"].includes(input.taxMode))
    fail(400, "Choose a tax configuration.");
  const settings = {
    name: text(input.name, "business name", 150),
    address: text(input.address, "business address", 500),
    registrationNumber: text(
      input.registrationNumber || "",
      "registration number",
      100,
      false,
    ),
    vatNumber: text(input.vatNumber || "", "VAT number", 100, false),
    taxMode: input.taxMode,
    vatRateBps: integer(
      input.vatRateBps ?? 0,
      "VAT rate in basis points",
      0,
      10000,
    ),
  };
  if (settings.taxMode === "vat_inclusive" && !settings.vatNumber)
    fail(400, "Enter the business VAT number.");
  run(
    database(),
    "UPDATE practice_setting SET value=? WHERE id=1",
    JSON.stringify(settings),
  );
  audit(database(), admin.id, "practice.settings", "practice");
  return { ok: true };
});
