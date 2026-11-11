<script setup lang="ts">
definePageMeta({ middleware: "account" });
const bookingFetch = useBookingRequest();
const { message } = useBookingUi();
const { data, error: loadError, refresh } = await useFetch<{
  mode: "test" | "live";
  testReady: boolean;
  liveReady: boolean;
  simulatedPaymentsEnabled: boolean;
}>(useBookingPath("/api/admin/payment-settings"));
const mode = ref(data.value?.mode ?? "test");
const busy = ref(false);
const error = ref("");
const notice = ref("");
watch(data, (settings) => {
  if (settings) mode.value = settings.mode;
});

async function save() {
  if (!data.value || mode.value === data.value.mode) return;
  if (
    mode.value === "live" &&
    !window.confirm("Enable real Yoco payments for new invoices?")
  ) return;
  busy.value = true;
  error.value = "";
  notice.value = "";
  try {
    await bookingFetch("/api/admin/payment-settings", {
      method: "PATCH",
      body: { mode: mode.value, expectedMode: data.value.mode },
    });
    await refresh();
    notice.value = "Payment mode saved.";
  } catch (e) {
    error.value = message(e);
    await refresh();
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <section class="wrap section narrow">
    <NuxtLink to="/admin" class="back-link">← Admin console</NuxtLink>
    <h1>Payment settings</h1>
    <p v-if="loadError || !data" class="notice error" role="alert">
      Payment settings are unavailable.
    </p>
    <form v-else class="panel form-panel" @submit.prevent="save">
      <p class="badge">
        {{ data.mode === "live" ? "Live mode active" : "Test mode active" }}
      </p>
      <div>
        <label for="payment-mode">Payment mode</label>
        <select id="payment-mode" v-model="mode" :disabled="busy">
          <option value="test">Test mode</option>
          <option value="live" :disabled="!data.liveReady">Live mode</option>
        </select>
      </div>
      <p v-if="data.testReady" class="hint">
        Yoco test checkout is connected. Test payments use no real money.
      </p>
      <p v-else class="hint">
        Yoco test checkout is awaiting a test key and webhook. Admin simulations
        are available in test mode.
      </p>
      <p v-if="!data.liveReady" class="notice">
        Live mode requires the Yoco live secret key and webhook signing secret.
      </p>
      <p v-else class="hint">Live mode charges real money for new live invoices.</p>
      <p class="hint">
        Each invoice keeps its original mode. A checkout already open on Yoco
        can still complete after a switch.
      </p>
      <p v-if="error" class="notice error" role="alert">{{ error }}</p>
      <p v-if="notice" class="notice success" role="status">{{ notice }}</p>
      <button
        class="button"
        :disabled="busy || mode === data.mode || (mode === 'live' && !data.liveReady)"
      >
        {{ busy ? "Saving…" : "Save payment mode" }}
      </button>
    </form>
  </section>
</template>
