import { actor } from "../../utils/access";
import { auth } from "../../core/auth";
import { database } from "../../core/database";
import { run, audit } from "../../core/store";
import { fail } from "../../core/validation";
export default defineEventHandler(async (event) => {
  const user = await actor(event, true),
    body = await readBody(event);
  if (
    typeof body.currentPassword !== "string" ||
    body.currentPassword.length > 128 ||
    typeof body.newPassword !== "string" ||
    body.newPassword.length < 12 ||
    body.newPassword.length > 128
  )
    fail(
      400,
      "Use a valid current password and a new password of at least 12 characters.",
    );
  const response = await auth.api.changePassword({
    headers: event.headers,
    body: {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
      revokeOtherSessions: true,
    },
    asResponse: true,
  });
  if (!response.ok) return response;
  run(database(), "UPDATE user SET mustChangePassword=0 WHERE id=?", user.id);
  audit(database(), user.id, "account.password_change", user.id);
  return response;
});
