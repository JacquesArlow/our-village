import { accountHome } from "~~/shared/accounts";
import { isPublicBookingPage } from "~~/shared/booking-navigation";

export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig().public;
  if (!config.bookingLoginRequired) return;
  const path = to.path.replace(/\/$/, "") || "/";
  const staff = config.bookingAudience === "staff";
  if (["/login", "/sign-in"].includes(path)) return;
  if (["/sign-up", "/register"].includes(path)) {
    if (staff) return navigateTo("/login");
    return;
  }

  const { refresh } = useAccount();
  const account = await refresh();
  if (account?.user.mustChangePassword && path !== "/change-password")
    return navigateTo("/change-password");
  if (!staff && isPublicBookingPage(path)) return;
  if (!account)
    return navigateTo({ path: "/login", query: { next: to.fullPath } });
  if (config.bookingAudience === "staff" && to.path === "/")
    return navigateTo(accountHome(account.user.role));
  if (
    account.user.role === "receptionist" &&
    !["/reception", "/change-password", "/privacy"].includes(to.path)
  )
    return navigateTo("/reception");
});
