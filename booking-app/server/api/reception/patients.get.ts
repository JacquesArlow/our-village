import { accountDirectory } from "../../core/accounts";
import { database } from "../../core/database";
import { requireRole } from "../../core/store";
import { actor } from "../../utils/access";

export default defineEventHandler(async (event) => {
  requireRole(await actor(event), ["receptionist", "admin"]);
  return accountDirectory(database(), getQuery(event), true);
});
