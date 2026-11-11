<script setup lang="ts">
import { accountHome } from "~~/shared/accounts";
import { bookingReturnPath, isDoctorCalendar } from "~~/shared/booking-navigation";

const bookingFetch = useBookingRequest();
const props = defineProps<{ signup?: boolean }>();
const config = useRuntimeConfig().public;
const staff = config.bookingAudience === "staff";
const form = reactive({ name: "", email: "", password: "", consent: false }),
  busy = ref(false),
  error = ref("");
const { refresh } = useAccount(),
  { message } = useBookingUi(),
  route = useRoute();
const next = computed(() => bookingReturnPath(route.query.next, staff));

type Turnstile = {
  render: (target: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
const widget = ref<HTMLElement | null>(null);
const challenge = ref("");
let widgetId: string | undefined;
let widgetTimer: ReturnType<typeof setInterval> | undefined;
const turnstile = () =>
  (window as Window & { turnstile?: Turnstile }).turnstile;
if (staff) {
  useHead({
    script: [
      {
        src: "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
        async: true,
        defer: true,
      },
    ],
  });
  onMounted(() => {
    widgetTimer = setInterval(() => {
      const api = turnstile();
      if (!api || !widget.value) return;
      clearInterval(widgetTimer);
      widgetId = api.render(widget.value, {
        sitekey: config.turnstileSiteKey,
        callback: (token: string) => {
          challenge.value = token;
        },
        "error-callback": () => {
          challenge.value = "";
        },
        "expired-callback": () => {
          challenge.value = "";
        },
      });
    }, 150);
  });
  onBeforeUnmount(() => {
    clearInterval(widgetTimer);
    if (widgetId !== undefined) turnstile()?.remove(widgetId);
  });
}

async function submit() {
  if (staff && !challenge.value) {
    error.value = "Complete the security check to sign in.";
    return;
  }
  if (props.signup && !form.consent) {
    error.value = "Please acknowledge the privacy notice.";
    return;
  }
  busy.value = true;
  error.value = "";
  try {
    await bookingFetch(
      props.signup ? "/api/auth/sign-up/email" : "/api/auth/sign-in/email",
      {
        method: "POST",
        headers: staff ? { "x-captcha-response": challenge.value } : undefined,
        body: { name: form.name, email: form.email, password: form.password },
      },
    );
    const account = await refresh();
    if (!account)
      throw new Error("Sign-in could not be completed. Please try again.");
    if (account.user.mustChangePassword) {
      await navigateTo("/change-password");
      return;
    }
    const patient = account.user.role === "patient";
    const destination = bookingReturnPath(next.value, !patient);
    if (patient && !account.patient && destination && isDoctorCalendar(destination.split(/[?#]/)[0]!)) {
      await navigateTo({ path: "/account", query: { next: destination } });
      return;
    }
    await navigateTo(destination || accountHome(account.user.role));
  } catch (e) {
    error.value = message(e);
    if (staff && widgetId !== undefined) {
      challenge.value = "";
      turnstile()?.reset(widgetId);
    }
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <form class="panel form-panel" method="post" @submit.prevent="submit">
    <p class="eyebrow">Our Village appointments</p>
    <h1>
      {{
        staff
          ? "Village Desk"
          : signup
            ? "Create a patient account"
            : "Patient sign-in"
      }}
    </h1>
    <p class="muted">
      {{
        signup
          ? "Create a patient account to manage appointments and invoices."
          : staff
            ? "Sign in to your staff workspace."
            : "Sign in to book or manage an appointment."
      }}
    </p>
    <label v-if="signup"
      >Full name<input
        v-model="form.name"
        name="name"
        autocomplete="name"
        required
        maxlength="100" /></label
    ><label
      >Email address<input
        v-model="form.email"
        name="email"
        type="email"
        autocomplete="username"
        required
        maxlength="254" /></label
    ><label
      >Password<input
        v-model="form.password"
        name="password"
        type="password"
        :autocomplete="signup ? 'new-password' : 'current-password'"
        :minlength="signup ? 12 : undefined"
        maxlength="128"
        required
    /></label>
    <p v-if="signup" class="hint">
      At least 12 characters. Please don’t reuse a password from another
      account.
    </p>
    <label v-if="signup" class="check"
      ><input v-model="form.consent" type="checkbox" required /><span
        >I have read the <NuxtLink to="/privacy">privacy notice</NuxtLink>.</span
      ></label
    >
    <div v-if="staff" ref="widget"></div>
    <p v-if="staff && !challenge" class="hint">
      Complete the security check to sign in.
    </p>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <button class="button" :disabled="busy || (staff && !challenge)">
      {{
        busy ? "Please wait…" : signup ? "Create patient account" : "Sign in"
      }}
    </button>
    <p v-if="!staff">
      <NuxtLink :to="{ path: signup ? '/sign-in' : '/sign-up', query: { next } }">{{
        signup
          ? "Already registered? Sign in"
          : "New here? Register as a patient"
      }}</NuxtLink>
    </p>
    <NuxtLink v-if="!staff" :to="next && isDoctorCalendar(next.split(/[?#]/)[0]!) ? next : '/'">
      Browse doctor calendars
    </NuxtLink>
  </form>
</template>
