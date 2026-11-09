<script setup lang="ts">
const bookingFetch = useBookingRequest();
definePageMeta({ middleware: "account" });
const { money, number, when, today, clock, message, paidLabel } =
  useBookingUi();
const { data, refresh } = await useFetch<any>(
  useBookingPath("/api/admin/overview"),
);
const tab = ref("Users"),
  error = ref(""),
  notice = ref(""),
  busy = ref(false);
const billing = reactive({
  patientId: "",
  doctorId: "",
  description: "",
  price: "",
});
const booking = reactive({
  patientId: "",
  doctorId: "",
  serviceId: "",
  date: today(),
  start: "",
});
const slotOptions = ref<any[]>([]);
const practice = reactive({
  ...data.value?.practice,
  vatPercent: (data.value?.practice.vatRateBps || 0) / 100,
});
const availableTypes = computed(() =>
  (data.value?.services || []).filter(
    (s: any) => s.doctor_id === booking.doctorId && s.active,
  ),
);
const configuredDoctors = computed(() =>
  (data.value?.doctors || []).filter((doctor: any) => doctor.onboarded),
);
const bookableDoctors = computed(() =>
  configuredDoctors.value.filter(
    (doctor: any) =>
      doctor.active &&
      !doctor.disabledAt &&
      data.value.services.some(
        (service: any) => service.doctor_id === doctor.id && service.active,
      ),
  ),
);
watch(
  () => booking.doctorId,
  () => {
    booking.serviceId = "";
    booking.start = "";
    slotOptions.value = [];
  },
);
watch([() => booking.serviceId, () => booking.date], async () => {
  booking.start = "";
  if (!booking.serviceId) {
    slotOptions.value = [];
    return;
  }
  try {
    slotOptions.value = await bookingFetch<any[]>("/api/public/slots", {
      query: { serviceId: booking.serviceId, date: booking.date },
    });
  } catch (e) {
    error.value = message(e);
  }
});
async function perform(
  path: string,
  body: any,
  success: string,
  method: "POST" | "PATCH" = "POST",
) {
  busy.value = true;
  error.value = "";
  notice.value = "";
  try {
    const result = await bookingFetch<any>(path, { method, body });
    notice.value = success;
    await refresh();
    return result;
  } catch (e) {
    error.value = message(e);
    return null;
  } finally {
    busy.value = false;
  }
}
async function invoice() {
  const result = await perform(
    "/api/admin/invoices",
    { ...billing, amountCents: Math.round(Number(billing.price) * 100) },
    "Invoice created.",
  );
  if (result) await navigateTo("/invoices/" + result.id);
}
async function makeBooking() {
  const result = await perform(
    "/api/appointments",
    { ...booking, requestKey: crypto.randomUUID() },
    "Appointment reserved for 15 minutes.",
  );
  if (result) await navigateTo("/invoices/" + result.invoice.id);
}
</script>
<template>
  <section class="wrap section">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Practice administration</p>
        <h1>A connected view of your village</h1>
      </div>
      <NuxtLink to="/" class="button secondary">Booking view</NuxtLink>
    </div>
    <div class="stats">
      <div>
        <strong>{{ data?.doctors.length || 0 }}</strong
        ><span>Doctors</span>
      </div>
      <div>
        <strong>{{ data?.patients.length || 0 }}</strong
        ><span>Patient accounts</span>
      </div>
      <div>
        <strong>{{ data?.invoices.length || 0 }}</strong
        ><span>Recent invoices</span>
      </div>
      <div>
        <strong>{{
          data?.invoices.filter((i: any) => i.state === "refund_review")
            .length || 0
        }}</strong
        ><span>Payment reviews</span>
      </div>
    </div>
    <div class="tabs" role="group" aria-label="Admin sections">
      <button
        v-for="label in [
          'Doctors',
          'Users',
          'Bookings',
          'Invoices',
          'Practice',
          'Activity',
        ]"
        :key="label"
        :class="tab === label ? 'selected' : ''"
        :aria-pressed="tab === label"
        @click="tab = label"
      >
        {{ label }}
      </button>
    </div>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="notice" class="notice success" role="status">{{ notice }}</p>
    <div v-if="tab === 'Doctors'">
      <section class="panel">
        <h2>Your doctors</h2>
        <article
          v-for="doctor in data?.doctors"
          :key="doctor.id"
          class="directory-row"
        >
          <div>
            <h3>{{ doctor.name }}</h3>
            <p>{{ doctor.email }}</p>
            <span class="badge">{{
              doctor.disabledAt
                ? "Account disabled"
                : !doctor.active
                  ? "Hidden"
                  : doctor.onboarded
                    ? "Calendar open"
                    : "Setup required"
            }}</span>
          </div>
          <div class="actions">
            <NuxtLink
              v-if="doctor.onboarded"
              :to="'/doctor?doctorId=' + doctor.id"
              class="button small secondary"
              >View calendar</NuxtLink
            ><NuxtLink
              :to="'/doctor/get-started?doctorId=' + doctor.id"
              class="button small secondary"
              >Configure</NuxtLink
            >
          </div>
        </article>
      </section>
    </div>
    <UserManagement v-if="tab === 'Users'" @changed="refresh()" />
    <div v-if="tab === 'Bookings' && !configuredDoctors.length" class="empty">
      Doctor calendars will appear here after onboarding is complete.
    </div>
    <div v-else-if="tab === 'Bookings'" class="dashboard-grid">
      <form
        v-if="bookableDoctors.length"
        class="panel form-panel"
        @submit.prevent="makeBooking"
      >
        <h2>Book on behalf of a patient</h2>
        <p class="hint">
          The patient must first register and save their contact profile. A slot
          is reserved for 15 minutes until payment is confirmed.
        </p>
        <label
          >Patient<select v-model="booking.patientId" required>
            <option value="">Choose patient</option>
            <option
              v-for="patient in data?.patients"
              :key="patient.id"
              :value="patient.id"
            >
              {{ patient.name }} · {{ patient.email }}
            </option>
          </select></label
        ><label
          >Doctor<select v-model="booking.doctorId" required>
            <option value="">Choose doctor</option>
            <option
              v-for="doctor in bookableDoctors"
              :key="doctor.id"
              :value="doctor.id"
            >
              {{ doctor.name }}
            </option>
          </select></label
        ><label
          >Appointment type<select v-model="booking.serviceId" required>
            <option value="">Choose type</option>
            <option v-for="s in availableTypes" :key="s.id" :value="s.id">
              {{ s.name }} · {{ money(s.amount_cents) }}
            </option>
          </select></label
        ><label
          >Date<input
            v-model="booking.date"
            type="date"
            :min="today()"
            required /></label
        ><label
          >Available time<select v-model="booking.start" required>
            <option value="">Choose time</option>
            <option
              v-for="slot in slotOptions"
              :key="slot.start"
              :value="slot.start"
            >
              {{ clock(slot.start) }} SAST
            </option>
          </select></label
        ><button class="button" :disabled="busy || !booking.start">
          Reserve appointment
        </button>
      </form>
      <section class="panel">
        <h2>Doctor calendars</h2>
        <p>
          View each doctor’s bookings, reschedule visits and manage time off.
        </p>
        <NuxtLink
          v-for="doctor in configuredDoctors"
          :key="doctor.id"
          :to="'/doctor?doctorId=' + doctor.id"
          class="list-row"
          ><strong>{{ doctor.name }}</strong
          ><span>Open calendar →</span></NuxtLink
        >
      </section>
    </div>
    <div v-if="tab === 'Invoices'" class="dashboard-grid">
      <section class="panel">
        <h2>Invoices &amp; payment links</h2>
        <p class="hint">
          Recent 200 invoices. Open an invoice to generate its payment link,
          print it, or review payment status.
        </p>
        <NuxtLink
          v-for="i in data?.invoices"
          :key="i.id"
          :to="'/invoices/' + i.id"
          class="list-row"
          ><span
            ><strong>{{ number(i.seq) }}</strong
            ><small
              >{{ i.patient_name }} ·
              {{ i.doctor_name || "Practice invoice" }}</small
            ><small v-if="i.payment_method">{{
              paidLabel(i.payment_method)
            }}</small></span
          ><span
            >{{ money(i.amount_cents)
            }}<small>{{ i.state.replaceAll("_", " ") }}</small></span
          ></NuxtLink
        >
        <p v-if="!data?.invoices.length" class="empty">No invoices yet.</p>
      </section>
      <form class="panel form-panel" @submit.prevent="invoice">
        <h2>Create an invoice / payment link</h2>
        <label
          >Patient<select v-model="billing.patientId" required>
            <option value="">Choose patient</option>
            <option v-for="p in data?.patients" :key="p.id" :value="p.id">
              {{ p.name }} · {{ p.email }}
            </option>
          </select></label
        ><label
          >Doctor (optional)<select v-model="billing.doctorId">
            <option value="">Practice invoice</option>
            <option v-for="d in data?.doctors" :key="d.id" :value="d.id">
              {{ d.name }}
            </option>
          </select></label
        ><label
          >Description<input
            v-model="billing.description"
            required
            maxlength="250" /></label
        ><label
          >Total in ZAR<input
            v-model="billing.price"
            type="number"
            min="2"
            max="100000"
            step="0.01"
            required /></label
        ><button class="button" :disabled="busy">Create staging invoice</button>
      </form>
    </div>
    <form
      v-if="tab === 'Practice'"
      class="panel form-panel"
      @submit.prevent="
        perform(
          '/api/admin/practice',
          {
            ...practice,
            vatRateBps: Math.round(Number(practice.vatPercent) * 100),
          },
          'Practice settings saved.',
        )
      "
    >
      <h2>Practice billing details</h2>
      <p class="notice">
        These are test invoice settings, not legal or tax advice. Invoices
        remain watermarked as staging documents. Verify all details with the
        practice before a public launch.
      </p>
      <label
        >Business / legal name<input
          v-model="practice.name"
          required
          maxlength="150" /></label
      ><label
        >Billing address<textarea
          v-model="practice.address"
          required
          maxlength="500"
        ></textarea></label
      ><label
        >Registration number<input
          v-model="practice.registrationNumber"
          maxlength="100" /></label
      ><label
        >Tax configuration<select v-model="practice.taxMode">
          <option value="not_configured">
            Not configured — review required
          </option>
          <option value="no_vat">No VAT charged (practice to confirm)</option>
          <option value="vat_inclusive">
            Prices include VAT (practice to confirm)
          </option>
        </select></label
      ><template v-if="practice.taxMode === 'vat_inclusive'"
        ><label
          >VAT number<input
            v-model="practice.vatNumber"
            required
            maxlength="100" /></label
        ><label
          >Included VAT rate (%)<input
            v-model.number="practice.vatPercent"
            type="number"
            min="0"
            max="100"
            step="0.01"
            required /></label></template
      ><button class="button" :disabled="busy">Save billing settings</button>
      <p class="hint">
        New invoices snapshot these details. Existing issued test invoices are
        not silently changed.
      </p>
    </form>
    <section v-if="tab === 'Activity'" class="panel">
      <h2>Recent activity</h2>
      <p class="hint">
        Recent 100 audit events. Passwords, card data and clinical details are
        not recorded in the activity log.
      </p>
      <div v-for="(a, index) in data?.audit" :key="index" class="list-row">
        <span
          ><strong>{{ a.action }}</strong
          ><small
            >{{ a.actor || "Payment system" }} · {{ a.entity_id
            }}<template v-if="a.detail"> · {{ a.detail }}</template></small
          ></span
        ><small>{{ when(a.created_at) }}</small>
      </div>
    </section>
  </section>
</template>
