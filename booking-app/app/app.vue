<script setup lang="ts">
const logo = useBookingPath("/logo.png");
const bookingFetch = useBookingRequest();
const { account, refresh } = useAccount();
const loginRequired = useRuntimeConfig().public.bookingLoginRequired;
const loginPath = useBookingPath("/login");
const route = useRoute();
const loginPage = computed(() => ["/login", "/sign-in"].includes(route.path.replace(/\/$/, "")));
const showWorkspace = computed(() => !loginRequired || !!account.value);
const { data: config, refresh: refreshConfig } = await useFetch<any>(
  useBookingPath("/api/public/config"),
  { immediate: showWorkspace.value },
);
const { data: doctors, refresh: refreshDoctors } = await useFetch<any[]>(
  useBookingPath("/api/public/doctors"),
  { key: "public-doctors", immediate: showWorkspace.value },
);
useHead({ link: [{ rel: "icon", href: useBookingPath("/favicon.ico") }] });
watch(showWorkspace, async (show) => {
  if (show) await Promise.all([refreshConfig(), refreshDoctors()]);
});
onMounted(() => {
  if (!loginRequired && !account.value) refresh();
});
async function logout() {
  await bookingFetch("/api/auth/sign-out", { method: "POST", body: {} });
  account.value = null;
  if (loginRequired) return navigateTo(loginPath, { external: true, replace: true });
  await navigateTo("/");
}
</script>
<template>
  <div>
    <div v-if="showWorkspace" class="pilot-banner">
      {{ loginRequired ? "Private booking preview" : "Private staging" }} · Test data only · No emails sent ·
      {{ config?.yocoConnected ? "Yoco test mode" : "Yoco not connected" }}
    </div>
    <header v-if="showWorkspace" class="site-header">
      <NuxtLink to="/" class="brand"
        ><img :src="logo" alt="Our Village" width="126" height="68" /><span
          >Appointments<small>Care that grows with you</small></span
        ></NuxtLink
      >
      <nav aria-label="Main navigation">
        <NuxtLink v-if="doctors?.length" to="/#doctors">Find a doctor</NuxtLink>
        <NuxtLink v-if="account?.user.role === 'patient'" to="/account"
          >My appointments</NuxtLink
        >
        <NuxtLink v-if="account?.user.role === 'doctor'" to="/doctor"
          >Doctor workspace</NuxtLink
        >
        <NuxtLink v-if="account?.user.role === 'admin'" to="/admin"
          >Admin console</NuxtLink
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
