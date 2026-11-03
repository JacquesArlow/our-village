<script setup lang="ts">
const { account, refresh } = useAccount();
const { data: config } = await useFetch<any>("/api/public/config");
const { data: doctors } = await useFetch<any[]>("/api/public/doctors", {
  key: "public-doctors",
});
onMounted(() => {
  if (!account.value) refresh();
});
async function logout() {
  await $fetch("/api/auth/sign-out", { method: "POST", body: {} });
  account.value = null;
  await navigateTo("/");
}
</script>
<template>
  <div>
    <div class="pilot-banner">
      Private staging · Test data only · No emails sent ·
      {{ config?.yocoConnected ? "Yoco test mode" : "Yoco not connected" }}
    </div>
    <header class="site-header">
      <NuxtLink to="/" class="brand"
        ><img src="/logo.png" alt="Our Village" width="126" height="68" /><span
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
    <main id="main"><NuxtPage /></main>
    <footer class="site-footer">
      <span>Our Village · Pretoria</span
      ><NuxtLink to="/privacy">Staging privacy &amp; safety notice</NuxtLink
      ><span>All times are South African time (SAST).</span>
    </footer>
  </div>
</template>
