import { accountHome } from "~~/shared/accounts";

export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig().public;
  if (!config.bookingLoginRequired) return;
  if (["/login", "/sign-in"].includes(to.path.replace(/\/$/, ""))) return;
  if (to.path.replace(/\/$/, "") === "/sign-up") return navigateTo("/login");

  const { refresh } = useAccount();
  const account = await refresh();
  if (!account)
    return navigateTo({ path: "/login", query: { next: to.fullPath } });
  if (account.user.mustChangePassword && to.path !== "/change-password")
    return navigateTo("/change-password");
  if (config.bookingAudience === "staff" && to.path === "/")
    return navigateTo(accountHome(account.user.role));
  if (
    account.user.role === "receptionist" &&
    !["/reception", "/change-password", "/privacy"].includes(to.path)
  )
    return navigateTo("/reception");
});
