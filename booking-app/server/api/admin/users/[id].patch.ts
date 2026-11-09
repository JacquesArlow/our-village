import { editManagedUser, setManagedUserEnabled } from "../../../core/accounts";
import { database } from "../../../core/database";
import { actor } from "../../../utils/access";

export default defineEventHandler(async (event) => {
  const user = await actor(event);
  const input = (await readBody(event)) ?? {};
  const id = getRouterParam(event, "id")!;
  return input.enabled === undefined
    ? editManagedUser(database(), user, id, input)
    : setManagedUserEnabled(database(), user, id, input.enabled);
});
