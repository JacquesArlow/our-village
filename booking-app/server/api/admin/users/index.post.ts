import { createManagedUser } from "../../../core/accounts";
import { database } from "../../../core/database";
import { actor } from "../../../utils/access";

export default defineEventHandler(async (event) =>
  createManagedUser(
    database(),
    await actor(event),
    (await readBody(event)) ?? {},
  ),
);
