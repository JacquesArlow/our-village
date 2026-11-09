<script setup lang="ts">
const logo = useBookingPath("/logo.png");
const bookingFetch = useBookingRequest();
definePageMeta({ middleware: "account" });
const route = useRoute(),
  { account } = useAccount(),
  { money, when, number, message, paidLabel } = useBookingUi();
const {
  data,
  refresh,
  error: loadError,
} = await useFetch<any>(useBookingPath("/api/invoices/" + route.params.id));
const { data: config } = await useFetch<any>(useBookingPath("/api/public/config"));
const error = ref(""),
  link = ref(""),
  busy = ref(false);
async function checkout() {
  busy.value = true;
  error.value = "";
  try {
    const result = await bookingFetch<any>(
      "/api/invoices/" + route.params.id + "/checkout",
      { method: "POST", body: {} },
    );
    window.location.assign(result.redirectUrl);
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
  }
}
async function generateLink() {
  error.value = "";
  try {
    const result = await bookingFetch<any>(
      "/api/invoices/" + route.params.id + "/link",
      { method: "POST", body: {} },
    );
    link.value = result.url;
  } catch (e) {
    error.value = message(e);
  }
}
async function simulate() {
  if (
    !window.confirm(
      "Simulate a successful staging payment? NO MONEY will be charged or received. This is not a Yoco transaction.",
    )
  )
    return;
  busy.value = true;
  error.value = "";
  try {
    await bookingFetch("/api/invoices/" + route.params.id + "/simulate", {
      method: "POST",
      body: {},
    });
    await refresh();
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
  }
}
const printable = () => window.print();
const copy = async () => {
  try {
    await navigator.clipboard.writeText(link.value);
  } catch {
    error.value = "Please select and copy the link manually.";
  }
};
</script>
<template>
  <section class="wrap section invoice-wrap">
    <p v-if="loadError || !data" class="notice error">
      This invoice is not available to your account.
    </p>
    <template v-else
      ><div class="section-heading no-print">
        <div>
          <p class="eyebrow">Your invoice</p>
          <h1>{{ number(data.invoice.seq) }}</h1>
        </div>
        <button class="button secondary" @click="printable">
          Print / Save PDF
        </button>
      </div>
      <article class="panel invoice-document">
        <div class="invoice-header">
          <div>
            <img :src="logo" alt="Our Village" width="130" />
            <h2>{{ data.practice.name }}</h2>
            <p class="pre-line">{{ data.practice.address }}</p>
            <p v-if="data.practice.registrationNumber" class="hint">
              Registration: {{ data.practice.registrationNumber }}
            </p>
            <p v-if="data.practice.vatNumber" class="hint">
              VAT: {{ data.practice.vatNumber }}
            </p>
          </div>
          <div>
            <span class="badge">STAGING — NOT A TAX INVOICE</span>
            <h3>{{ number(data.invoice.seq) }}</h3>
            <p>Created {{ when(data.invoice.created_at) }}</p>
            <strong>{{ data.invoice.state.replaceAll("_", " ") }}</strong>
          </div>
        </div>
        <hr />
        <h3>Bill to</h3>
        <p>
          {{ data.invoice.patient_name }}<br />{{ data.invoice.patient_email }}
        </p>
        <p v-if="data.invoice.doctor_name">
          Doctor: {{ data.invoice.doctor_name }}
        </p>
        <p v-if="data.appointment">
          Appointment: {{ when(data.appointment.start_at) }}
        </p>
        <div class="invoice-line">
          <span>{{ data.invoice.description }}</span
          ><strong>{{ money(data.invoice.amount_cents) }}</strong>
        </div>
        <div v-if="data.invoice.vat_cents" class="invoice-line">
          <span>Included VAT (as configured for this test invoice)</span
          ><span>{{ money(data.invoice.vat_cents) }}</span>
        </div>
        <div class="invoice-line total">
          <span>Total (ZAR)</span
          ><strong>{{ money(data.invoice.amount_cents) }}</strong>
        </div>
        <p v-if="data.invoice.payment_method" class="notice">
          {{ paidLabel(data.invoice.payment_method)
          }}<template v-if="data.invoice.paid_at">
            · Recorded {{ when(data.invoice.paid_at) }}</template
          >
        </p>
        <p v-if="data.invoice.state === 'refund_review'" class="notice error">
          Manual payment / refund review required. No automatic refund has been
          issued.
        </p>
        <p v-if="data.appointment?.status === 'hold'" class="notice">
          This slot is held until {{ when(data.appointment.hold_until) }}.
          Payment must be verified before the slot can be confirmed.
        </p>
        <p class="hint">
          This document is for testing only. It is not a medical-aid claim, a
          clinical record or a production tax invoice. Practice billing details
          must be verified before real invoicing.
        </p>
      </article>
      <div class="panel spaced no-print">
        <p v-if="error" class="notice error" role="alert">{{ error }}</p>
        <template v-if="data.invoice.state === 'unpaid'"
          ><p v-if="!config?.yocoConnected" class="notice">
            Yoco test payments are not connected yet. No card details are
            collected by this app.
          </p>
          <div class="actions">
            <button
              class="button"
              :disabled="busy || !config?.yocoConnected"
              @click="checkout"
            >
              Continue to Yoco test checkout</button
            ><button class="button secondary" @click="generateLink">
              Generate shareable payment link</button
            ><button
              v-if="
                account.user.role === 'admin' &&
                config?.simulatedPaymentsEnabled
              "
              class="button ghost"
              :disabled="busy"
              @click="simulate"
            >
              Simulate test payment (no money)
            </button>
          </div></template
        >
        <div v-if="link" class="spaced">
          <label
            >Payment link — share securely<input
              :value="link"
              readonly
              @focus="($event.target as HTMLInputElement).select()"
          /></label>
          <div class="actions">
            <button class="button small secondary" @click="copy">
              Copy link</button
            ><NuxtLink
              :to="link.replace(/^https?:\/\/[^/]+/, '')"
              class="button small secondary"
              >Open payment page</NuxtLink
            >
          </div>
          <p class="hint">
            Appointment links expire with the 15-minute slot hold. Standalone
            invoice links expire after 48 hours. Staging still requires the
            Nginx review password.
          </p>
        </div>
      </div></template
    >
  </section>
</template>
