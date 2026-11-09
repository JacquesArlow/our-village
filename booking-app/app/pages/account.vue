<script setup lang="ts">
const bookingFetch = useBookingRequest();
definePageMeta({ middleware: "account" });
const { account, refresh: refreshAccount } = useAccount(),
  { money, when, number, message, paidLabel } = useBookingUi(),
  route = useRoute();
const { data, refresh } = await useFetch<any>(useBookingPath("/api/patient/dashboard"));
const form = reactive({
    phone: account.value?.patient?.phone || "",
    consent: false,
  }),
  error = ref(""),
  saved = ref(false),
  busy = ref(false);
async function save() {
  busy.value = true;
  error.value = "";
  try {
    await bookingFetch("/api/account/profile", { method: "POST", body: form });
    await refreshAccount();
    saved.value = true;
    const next = route.query.next;
    if (typeof next === "string" && next.startsWith("/doctors/"))
      await navigateTo(next);
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <section class="wrap section">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Your patient account</p>
        <h1>Hello, {{ account.user.name }}</h1>
      </div>
      <NuxtLink to="/" class="button">Book an appointment</NuxtLink>
    </div>
    <p class="notice">
      Private staging: use test details only. No emails are sent and no real
      payments are enabled.
    </p>
    <div class="dashboard-grid">
      <div>
        <h2>Appointments</h2>
        <AppointmentList
          :records="data?.appointments || []"
          @changed="refresh()"
        />
        <h2 class="spaced">Your invoices</h2>
        <div class="list">
          <NuxtLink
            v-for="invoice in data?.invoices"
            :key="invoice.id"
            :to="'/invoices/' + invoice.id"
            class="list-row"
            ><span
              ><strong>{{ number(invoice.seq) }}</strong
              ><small
                >{{ invoice.description }} ·
                {{ when(invoice.created_at) }}</small
              ><small v-if="invoice.payment_method">{{
                paidLabel(invoice.payment_method)
              }}</small></span
            ><span
              >{{ money(invoice.amount_cents)
              }}<small>{{ invoice.state.replaceAll("_", " ") }}</small></span
            ></NuxtLink
          >
          <p v-if="!data?.invoices.length" class="empty">
            Your invoices will appear here.
          </p>
        </div>
      </div>
      <aside>
        <form class="panel form-panel" @submit.prevent="save">
          <h2>Contact details</h2>
          <p class="hint">
            Save a contact number before making your first test booking. Do not
            enter clinical notes or identity numbers.
          </p>
          <label
            >Phone number<input
              v-model="form.phone"
              type="tel"
              autocomplete="tel"
              required
              maxlength="30" /></label
          ><label class="check"
            ><input v-model="form.consent" type="checkbox" required /><span
              >I agree to the
              <NuxtLink to="/privacy">staging data notice</NuxtLink> and will
              use test details.</span
            ></label
          >
          <p v-if="error" class="notice error" role="alert">{{ error }}</p>
          <p v-if="saved" class="notice success" role="status">
            Contact details saved.
          </p>
          <button class="button secondary" :disabled="busy">
            {{ busy ? "Saving…" : "Save contact details" }}</button
          ><NuxtLink to="/change-password">Change password</NuxtLink>
        </form>
      </aside>
    </div>
  </section>
</template>
