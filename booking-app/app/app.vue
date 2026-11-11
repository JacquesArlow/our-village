<script setup lang="ts">
const logo = useBookingPath("/logo.png");
const bookingFetch = useBookingRequest();
const { account, refresh } = useAccount();
const configPublic = useRuntimeConfig().public;
const loginRequired = configPublic.bookingLoginRequired;
const staff = configPublic.bookingAudience === "staff";
const loginPath = useBookingPath("/login");
const route = useRoute();
const loginPage = computed(() =>
  ["/login", "/sign-in"].includes(route.path.replace(/\/$/, "")),
);
const showWorkspace = computed(() => !loginRequired || !!account.value);
const showDoctorDirectory = computed(
  () =>
    !staff &&
    showWorkspace.value &&
    account.value?.user.role !== "receptionist",
);
const { data: doctors, refresh: refreshDoctors } = await useFetch<any[]>(
  useBookingPath("/api/public/doctors"),
  { key: "public-doctors", immediate: showDoctorDirectory.value },
);
useHead({ link: [{ rel: "icon", href: useBookingPath("/favicon.ico") }] });
watch(showDoctorDirectory, async (show) => {
  if (show) await refreshDoctors();
});
onMounted(() => {
  if (!loginRequired && !account.value) refresh();
});
async function logout() {
  await bookingFetch("/api/auth/sign-out", { method: "POST", body: {} });
  account.value = null;
  if (loginRequired)
    return navigateTo(loginPath, { external: true, replace: true });
  await navigateTo("/");
}
</script>
<template>
  <div>
    <header v-if="showWorkspace" class="site-header">
      <NuxtLink
        :to="account?.user.role === 'receptionist' ? '/reception' : '/'"
        class="brand"
        ><img :src="logo" alt="Our Village" width="126" height="68" /><span
          >{{ staff ? "Village Desk" : "Appointments"
          }}<small>Care that grows with you</small></span
        ></NuxtLink
      >
      <nav aria-label="Main navigation">
        <NuxtLink v-if="showDoctorDirectory && doctors?.length" to="/#doctors"
          >Find a doctor</NuxtLink
        >
        <NuxtLink v-if="account?.user.role === 'patient'" to="/account"
          >My appointments</NuxtLink
        >
        <NuxtLink v-if="account?.user.role === 'doctor'" to="/doctor"
          >Doctor workspace</NuxtLink
        >
        <NuxtLink v-if="account?.user.role === 'admin'" to="/admin"
          >Admin console</NuxtLink
        >
        <a
          v-if="staff && account?.user.role === 'admin'"
          href="/village-desk/events"
          >Events calendar</a
        >
        <NuxtLink v-if="account?.user.role === 'receptionist'" to="/reception"
          >Patient directory</NuxtLink
        >
        <button v-if="account" class="button small ghost" @click="logout">
          Sign out
        </button>
        <NuxtLink v-else to="/sign-in" class="button small">Sign in</NuxtLink>
      </nav>
    </header>
    <main id="main"><NuxtPage v-if="showWorkspace || loginPage" /></main>
    <footer v-if="showWorkspace" class="site-footer">
      <span>Our Village · Pretoria</span
      ><NuxtLink to="/privacy">Staging privacy &amp; safety notice</NuxtLink
      ><span>All times are South African time (SAST).</span>
    </footer>
  </div>
</template>
