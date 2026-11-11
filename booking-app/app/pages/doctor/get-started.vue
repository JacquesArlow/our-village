<script setup lang="ts">
definePageMeta({ middleware: "account" });
const route = useRoute(),
  { account } = useAccount();
const doctorId =
  account.value.user.role === "admin" &&
  typeof route.query.doctorId === "string"
    ? route.query.doctorId
    : undefined;
const step = route.query.section === "hours" ? 3 : 1;
</script>
<template>
  <section class="wrap section">
    <DoctorSetup :doctor-id="doctorId" :initial-step="step" />
  </section>
</template>
