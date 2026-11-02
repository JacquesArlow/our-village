<script setup lang="ts">
definePageMeta({ middleware: "account" });
const route = useRoute(),
  { account } = useAccount();
const doctorId =
  account.value.user.role === "admin" &&
  typeof route.query.doctorId === "string"
    ? route.query.doctorId
    : undefined;
</script>
<template>
  <section class="wrap section">
    <p class="eyebrow">Doctor workspace</p>
    <h1>Let’s set up your calendar</h1>
    <p class="lede">
      Your appointment types, your fees and your time. Set things up once, then
      keep them up to date here.
    </p>
    <DoctorSetup :doctor-id="doctorId" />
  </section>
</template>
