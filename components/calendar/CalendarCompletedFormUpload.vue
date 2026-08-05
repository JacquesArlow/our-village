<script setup lang="ts">
const props = defineProps<{ eventId: string; eventTitle: string }>()
const cfg = useRuntimeConfig().public

const f = reactive({ name: '', email: '', phone: '' })
const file = ref<File | null>(null)
const tsToken = ref('')
const widgetEl = ref<HTMLElement | null>(null)
const widgetId = ref<string | undefined>()
const state = ref<'idle' | 'submitting' | 'done'>('idle')
const err = ref('')

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

function choose(e: Event) {
  const input = e.target as HTMLInputElement
  file.value = input.files?.[0] ?? null
}

function resetTurnstile() {
  const ts = (window as any).turnstile
  if (ts && widgetId.value !== undefined) { ts.reset(widgetId.value); tsToken.value = '' }
}

async function submit() {
  err.value = ''
  if (!f.name.trim()) { err.value = 'Please enter your name.'; return }
  if (!f.email.trim() && !f.phone.trim()) { err.value = 'Please enter a phone number or email.'; return }
  if (!file.value) { err.value = 'Please choose your completed PDF.'; return }
  if (!file.value.name.toLowerCase().endsWith('.pdf') && file.value.type !== 'application/pdf') { err.value = 'Please upload a PDF file.'; return }
  if (!tsToken.value) { err.value = 'Just a moment - the spam check is still loading.'; return }

  const body = new FormData()
  body.set('eventId', props.eventId)
  body.set('name', f.name)
  body.set('email', f.email)
  body.set('phone', f.phone)
  body.set('turnstileToken', tsToken.value)
  body.set('file', file.value)

  state.value = 'submitting'
  try {
    await $fetch('/api/calendar/form-submissions', { method: 'POST', body })
    state.value = 'done'
  } catch (e: any) {
    err.value = e?.data?.statusMessage || e?.data?.message || 'Upload failed - please try again.'
    state.value = 'idle'
    resetTurnstile()
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
        <p class="font-script text-3xl text-secondary">Form received</p>
        <p class="mt-1 text-base-content/60">Thank you, {{ f.name }}. The team will review your completed form.</p>
      </div>
    </template>

    <form v-else class="space-y-4" @submit.prevent="submit">
      <div>
        <p class="font-display text-sm font-bold uppercase tracking-wide text-secondary">Upload completed form</p>
        <p class="text-sm text-base-content/55">for <span class="font-semibold">{{ eventTitle }}</span></p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Name</span>
          <input v-model="f.name" class="w-full rounded-field border border-base-300 bg-base-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Full name" required />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Phone</span>
          <input v-model="f.phone" type="tel" class="w-full rounded-field border border-base-300 bg-base-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="0XX XXX XXXX" />
        </label>
      </div>

      <label class="block">
        <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Email</span>
        <input v-model="f.email" type="email" class="w-full rounded-field border border-base-300 bg-base-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="you@example.com" />
      </label>

      <label class="block">
        <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Completed PDF</span>
        <input type="file" accept="application/pdf,.pdf" class="file-input file-input-bordered w-full" @change="choose" />
      </label>

      <div ref="widgetEl" class="min-h-[1px]"></div>

      <p v-if="err" class="rounded-field bg-error/10 px-3 py-2 text-sm text-error">{{ err }}</p>

      <button class="btn btn-primary w-full sm:w-auto" type="submit" :disabled="state === 'submitting'">
        {{ state === 'submitting' ? 'Uploading...' : 'Upload completed PDF' }}
      </button>
    </form>
  </div>
</template>
