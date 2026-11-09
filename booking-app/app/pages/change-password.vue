<script setup lang="ts">
const bookingFetch = useBookingRequest();
definePageMeta({ middleware: "account" });
const form = reactive({ currentPassword: "", newPassword: "" }),
  busy = ref(false),
  error = ref("");
const { refresh } = useAccount(),
  { message } = useBookingUi();
async function submit() {
  busy.value = true;
  error.value = "";
  try {
    await bookingFetch("/api/account/password", { method: "POST", body: form });
    const a = await refresh();
    await navigateTo(
      a?.user.role === "admin"
        ? "/admin"
        : a?.user.role === "doctor"
          ? "/doctor"
          : "/account",
    );
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <section class="wrap section narrow">
    <form class="panel form-panel" @submit.prevent="submit">
      <p class="eyebrow">Protect your workspace</p>
      <h1>Choose your own password</h1>
      <p>
        Replace your temporary password before continuing. This does not change
        the separate Nginx review password.
      </p>
      <label
        >Temporary / current password<input
          v-model="form.currentPassword"
          type="password"
          autocomplete="current-password"
          required /></label
      ><label
        >New password<input
          v-model="form.newPassword"
          type="password"
          autocomplete="new-password"
          minlength="12"
          maxlength="128"
          required
      /></label>
      <p v-if="error" class="notice error" role="alert">{{ error }}</p>
      <button class="button" :disabled="busy">
        {{ busy ? "Saving…" : "Save password & continue" }}
      </button>
    </form>
  </section>
</template>
