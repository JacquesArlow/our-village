<script setup lang="ts">
const site = useSite()
const cfg = useRuntimeConfig().public

const form = reactive({ firstName: '', lastName: '', email: '', subject: '', message: '' })
const tsToken = ref('')
const widgetEl = ref<HTMLElement | null>(null)
const widgetId = ref<string | undefined>()
const state = ref<'idle' | 'sending' | 'done'>('idle')
const err = ref('')

const inputClass =
  'w-full rounded-field border border-base-300 bg-base-100 px-3.5 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-base-content/55'

// Managed Turnstile (explicit render — reliable in the SPA).
useHead({ script: [{ src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', async: true, defer: true }] })
function renderWidget(): boolean {
  const ts = (window as any).turnstile
  if (!ts || !widgetEl.value || widgetId.value !== undefined) return widgetId.value !== undefined
  widgetId.value = ts.render(widgetEl.value, {
    sitekey: cfg.turnstileSiteKey, theme: 'light',
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

function buildLines() {
  return [
    `Name: ${form.firstName} ${form.lastName}`.trim(),
    form.email ? `Email: ${form.email}` : '',
    form.subject ? `Subject: ${form.subject}` : '',
    '',
    form.message
  ].filter(Boolean)
}

// Button 1 — WhatsApp chat (no backend).
function sendWhatsApp() {
  const text = ['Hi Our Village,', '', ...buildLines()].join('\n')
  window.open(`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
}

// Button 2 — submit the form; emailed to reception via Brevo.
async function sendMessage() {
  err.value = ''
  if (!form.firstName.trim() || !form.email.trim() || !form.message.trim()) {
    err.value = 'Please complete your name, email and message.'; return
  }
  if (!tsToken.value) { err.value = 'Just a moment — the spam check is still loading.'; return }
  state.value = 'sending'
  try {
    await $fetch('/api/contact', { method: 'POST', body: { ...form, turnstileToken: tsToken.value } })
    state.value = 'done'
  } catch (e: any) {
    err.value = e?.data?.statusMessage || e?.data?.message || 'Something went wrong — please try WhatsApp.'
    state.value = 'idle'
    const ts = (window as any).turnstile
    if (ts && widgetId.value !== undefined) { ts.reset(widgetId.value); tsToken.value = '' }
  }
}
</script>

<template>
  <div v-if="state === 'done'" class="rounded-box border border-base-300 bg-base-100 p-8 text-center shadow-sm">
    <div class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary">
      <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <p class="font-script text-3xl text-secondary">Thank you, {{ form.firstName }}!</p>
    <p class="mt-1 text-base-content/60">Your message is on its way to our reception team — we’ll be in touch soon.</p>
  </div>

  <form v-else class="space-y-4" @submit.prevent="sendMessage">
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="block">
        <span :class="labelClass">First name</span>
        <input v-model="form.firstName" type="text" required :class="inputClass" placeholder="Your first name" />
      </label>
      <label class="block">
        <span :class="labelClass">Last name</span>
        <input v-model="form.lastName" type="text" :class="inputClass" placeholder="Your last name" />
      </label>
    </div>

    <label class="block">
      <span :class="labelClass">Email</span>
      <input v-model="form.email" type="email" required :class="inputClass" placeholder="you@example.com" />
    </label>

    <label class="block">
      <span :class="labelClass">Subject</span>
      <input v-model="form.subject" type="text" :class="inputClass" placeholder="What can we help with?" />
    </label>

    <label class="block">
      <span :class="labelClass">Your message</span>
      <textarea v-model="form.message" rows="5" required :class="inputClass" placeholder="Tell us a little about what you need…"></textarea>
    </label>

    <!-- managed Turnstile (usually invisible) -->
    <div ref="widgetEl" class="min-h-[1px]"></div>

    <p v-if="err" class="rounded-field bg-error/10 px-3 py-2 text-sm text-error">{{ err }}</p>

    <div class="flex flex-col gap-3 pt-1 sm:flex-row">
      <button type="submit" class="btn btn-primary flex-1 gap-2 rounded-full font-semibold normal-case" :disabled="state === 'sending'">
        <svg viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        {{ state === 'sending' ? 'Sending…' : 'Send message' }}
      </button>
      <button type="button" class="btn btn-outline btn-primary flex-1 gap-2 rounded-full font-semibold normal-case" @click="sendWhatsApp">
        <svg viewBox="0 0 24 24" class="h-5 w-5 fill-current" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
        Send via WhatsApp
      </button>
    </div>
    <p class="text-xs text-base-content/55">
      “Send message” emails our reception team directly; “Send via WhatsApp” opens a chat. Prefer your own mail app?
      <a :href="`mailto:${site.email}`" class="font-semibold text-primary hover:underline">{{ site.email }}</a>
    </p>
  </form>
</template>
