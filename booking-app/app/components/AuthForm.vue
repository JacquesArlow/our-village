<script setup lang="ts">
const bookingFetch = useBookingRequest();
const props = defineProps<{ signup?: boolean }>();
const loginRequired = useRuntimeConfig().public.bookingLoginRequired;
const form = reactive({ name: "", email: "", password: "", consent: false }),
  busy = ref(false),
  error = ref("");
const { refresh } = useAccount(),
  { message } = useBookingUi(),
  route = useRoute();
async function submit() {
  if (props.signup && !form.consent) {
    error.value = "Please accept the staging data notice.";
    return;
  }
  busy.value = true;
  error.value = "";
  try {
    await bookingFetch(
      props.signup ? "/api/auth/sign-up/email" : "/api/auth/sign-in/email",
      {
        method: "POST",
        body: { name: form.name, email: form.email, password: form.password },
      },
    );
    const account = await refresh();
    if (!account)
      throw new Error("Sign-in could not be completed. Please try again.");
    const next =
      typeof route.query.next === "string" &&
      /^\/(doctors\/|account(?:\?|$))/.test(route.query.next)
        ? route.query.next
        : "/account";
    const previewNext =
      typeof route.query.next === "string" &&
      /^\/(?:$|(?:account|admin|doctor|doctors|invoices|pay|payment-return)(?:[/?#]|$))/.test(route.query.next) &&
      !route.query.next.includes("\\")
        ? route.query.next
        : null;
    await navigateTo(
      account.user.mustChangePassword
        ? "/change-password"
        : loginRequired && previewNext
          ? previewNext
          : account.user.role === "admin"
            ? "/admin"
            : account.user.role === "doctor"
              ? "/doctor"
              : next,
    );
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <form class="panel form-panel" method="post" @submit.prevent="submit">
    <p class="eyebrow">Our Village appointments</p>
    <h1>{{ signup ? "Your village starts here" : "Welcome back" }}</h1>
    <p class="muted">
      {{
        signup
          ? "Create a patient account to manage appointments and invoices."
          : loginRequired
            ? "Sign in with your test account to open the private booking preview."
            : "Sign in to your patient, doctor or admin workspace."
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
        >I understand this is private staging and will use test information
        only. <NuxtLink to="/privacy">Read the data notice</NuxtLink>.</span
      ></label
    >
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <button class="button" :disabled="busy">
      {{
        busy ? "Please wait…" : signup ? "Create patient account" : "Sign in"
      }}
    </button>
    <p v-if="!loginRequired">
      <NuxtLink :to="signup ? '/sign-in' : '/sign-up'">{{
        signup
          ? "Already registered? Sign in"
          : "New here? Create a patient account"
      }}</NuxtLink>
    </p>
    <p class="hint">
      No emails, verification messages or password-reset emails are sent in this
      preview. Ask the testing administrator if you lose access.
    </p>
  </form>
</template>
