<script setup lang="ts">
const bookingFetch = useBookingRequest();
const route = useRoute(),
  { money, number, message, paidLabel } = useBookingUi();
const { data, error: loadError } = await useFetch<any>(
  useBookingPath("/api/pay/" + route.params.token),
);
const { data: config } = await useFetch<any>(useBookingPath("/api/public/config"));
const liveInvoice = computed(() => data.value?.paymentMode === "live");
const activeMode = computed(() => config.value?.mode === data.value?.paymentMode);
const busy = ref(false),
  error = ref("");
async function pay() {
  busy.value = true;
  error.value = "";
  try {
    const result = await bookingFetch<any>(
      "/api/pay/" + route.params.token + "/checkout",
      { method: "POST", body: {} },
    );
    window.location.assign(result.redirectUrl);
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <section class="wrap section narrow">
    <div v-if="loadError || !data" class="panel empty">
      <h1>Payment link unavailable</h1>
      <p>
        This link may have expired. Please ask the practice for an updated
        invoice or booking.
      </p>
    </div>
    <div v-else class="panel form-panel">
      <p class="eyebrow">{{ liveInvoice ? "Our Village" : "Our Village · test payment" }}</p>
      <h1>Appointment payment</h1>
      <p>{{ number(data.seq, data.paymentMode) }}</p>
      <p class="payment-amount">{{ money(data.amountCents) }}</p>
      <span class="badge">{{ data.state.replaceAll("_", " ") }}</span>
      <p v-if="data.paymentMethod" class="notice">
        {{ paidLabel(data.paymentMethod) }}
      </p>
      <p v-if="data.state === 'unpaid' && !activeMode" class="notice">
        This {{ liveInvoice ? "live" : "test" }} invoice is outside the active payment mode.
      </p>
      <p v-else-if="data.state === 'unpaid' && !config?.yocoConnected" class="notice">
        Yoco {{ liveInvoice ? "live" : "test" }} checkout is unavailable.
      </p>
      <p v-if="error" class="notice error" role="alert">{{ error }}</p>
      <button
        v-if="data.state === 'unpaid'"
        class="button"
        :disabled="busy || !activeMode || !config?.yocoConnected"
        @click="pay"
      >
        {{ busy ? "Opening checkout…" : liveInvoice ? "Pay with Yoco" : "Continue to Yoco test checkout" }}
      </button>
      <p class="hint">
        The hosted Yoco page handles card information. This shared page
        intentionally does not reveal the patient’s name, contact details or
        appointment information.
      </p>
    </div>
  </section>
</template>
