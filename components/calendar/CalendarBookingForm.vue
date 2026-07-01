<script setup lang="ts">
const props = defineProps<{ eventId?: string; eventTitle?: string }>()
const cfg = useRuntimeConfig().public

const f = reactive({ name: '', surname: '', email: '', phone: '', guests: '', message: '' })
const tsToken = ref('')
const widgetEl = ref<HTMLElement | null>(null)
const widgetId = ref<string | undefined>()
const state = ref<'idle' | 'submitting' | 'done'>('idle')
const err = ref('')

// Load the Turnstile script once (explicit render — we control when it mounts,
// which is reliable across SPA navigation). Managed mode is set in Cloudflare,
// so most visitors never see a checkbox.
useHead({
  script: [{ src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', async: true, defer: true }]
})

function renderWidget(): boolean {
  const ts = (window as any).turnstile
  if (!ts || !widgetEl.value || widgetId.value !== undefined) return !!widgetId.value
  widgetId.value = ts.render(widgetEl.value, {
    sitekey: cfg.turnstileSiteKey,
    theme: 'light',
    callback: (t: string) => { tsToken.value = t },
    'error-callback': () => { tsToken.value = '' },
    'expired-callback': () => { tsToken.value = '' }
  })
  return true
}

onMounted(() => {
  if (renderWidget()) return
  const iv = setInterval(() => { if (renderWidget()) clearInterval(iv) }, 200)
  setTimeout(() => clearInterval(iv), 10000)
})

const inputClass =
  'w-full rounded-field border border-base-300 bg-base-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

async function submit() {
  err.value = ''
  if (!f.name.trim()) { err.value = 'Please enter your name.'; return }
  if (!f.email.trim() && !f.phone.trim()) { err.value = 'Please enter a phone number or email so we can reach you.'; return }
  if (!tsToken.value) { err.value = 'Just a moment — the spam check is still loading.'; return }
  state.value = 'submitting'
  try {
    await $fetch('/api/bookings', {
      method: 'POST',
      body: { ...f, eventId: props.eventId, eventTitle: props.eventTitle, turnstileToken: tsToken.value }
    })
    state.value = 'done'
  } catch (e: any) {
    err.value = e?.data?.statusMessage || e?.data?.message || 'Something went wrong — please try again.'
    state.value = 'idle'
    const ts = (window as any).turnstile
    if (ts && widgetId.value !== undefined) { ts.reset(widgetId.value); tsToken.value = '' }
  }
}
</script>

<template>
  <div class="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
    <template v-if="state === 'done'">
      <div class="py-6 text-center">
        <div class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary">
          <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <p class="font-script text-3xl text-secondary">Thank you, {{ f.name }}!</p>
        <p class="mt-1 text-base-content/60">We’ve received your details and the team will be in touch soon.</p>
      </div>
    </template>

    <form v-else class="space-y-4" @submit.prevent="submit">
      <div>
        <p class="font-display text-sm font-bold uppercase tracking-wide text-secondary">Register your interest</p>
        <p v-if="eventTitle" class="text-sm text-base-content/55">for <span class="font-semibold">{{ eventTitle }}</span></p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Name</span>
          <input v-model="f.name" :class="inputClass" placeholder="First name" required />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Surname</span>
          <input v-model="f.surname" :class="inputClass" placeholder="Last name" />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Phone</span>
          <input v-model="f.phone" type="tel" :class="inputClass" placeholder="0XX XXX XXXX" />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Email</span>
          <input v-model="f.email" type="email" :class="inputClass" placeholder="you@example.com" />
        </label>
      </div>
      <p class="-mt-1 text-xs text-base-content/45">Please give us a phone number or an email so we can confirm with you.</p>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Number of guests</span>
          <input v-model="f.guests" type="number" min="1" :class="inputClass" placeholder="e.g. 2" />
        </label>
      </div>

      <label class="block">
        <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Message <span class="font-normal normal-case text-base-content/40">— optional</span></span>
        <textarea v-model="f.message" rows="3" :class="inputClass" placeholder="Anything you’d like us to know?"></textarea>
      </label>

      <!-- Turnstile (managed) renders here; usually invisible -->
      <div ref="widgetEl" class="min-h-[1px]"></div>

      <p v-if="err" class="rounded-field bg-error/10 px-3 py-2 text-sm text-error">{{ err }}</p>

      <button class="btn btn-primary w-full sm:w-auto" type="submit" :disabled="state === 'submitting'">
        {{ state === 'submitting' ? 'Sending…' : 'Send my details' }}
      </button>
    </form>
  </div>
</template>
