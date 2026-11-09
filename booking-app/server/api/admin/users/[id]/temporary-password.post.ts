import { resetManagedPassword } from "../../../../core/accounts";
import { database } from "../../../../core/database";
import { actor } from "../../../../utils/access";

export default defineEventHandler(async (event) =>
  resetManagedPassword(
    database(),
    await actor(event),
    getRouterParam(event, "id")!,
    (await readBody(event))?.password,
  ),
);
