export default defineNuxtRouteMiddleware(async (to) => {
  const { account, refresh } = useAccount();
  if (!useRuntimeConfig().public.bookingLoginRequired) await refresh();
  if (!account.value)
    return navigateTo("/sign-in?next=" + encodeURIComponent(to.fullPath));
  const user = account.value.user;
  if (user.mustChangePassword && to.path !== "/change-password")
    return navigateTo("/change-password");
  if (to.path.startsWith("/admin") && user.role !== "admin")
    return navigateTo(user.role === "doctor" ? "/doctor" : "/account");
  if (to.path.startsWith("/doctor") && !["doctor", "admin"].includes(user.role))
    return navigateTo("/account");
  if (to.path === "/account" && user.role !== "patient")
    return navigateTo(user.role === "admin" ? "/admin" : "/doctor");
  if (
    to.path === "/doctor" &&
    user.role === "doctor" &&
    !account.value.doctor?.onboarded
  )
    return navigateTo("/doctor/get-started");
});
