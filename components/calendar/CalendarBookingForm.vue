<script setup lang="ts">
import type { BookingFormVariant } from '~~/shared/calendar'

const props = defineProps<{
  eventId?: string
  eventTitle?: string
  formFileName?: string | null
  bookingFormVariant?: BookingFormVariant | null
  bookingCostLabel?: string | null
}>()
const cfg = useRuntimeConfig().public

const f = reactive({
  name: '',
  surname: '',
  email: '',
  phone: '',
  guests: '',
  babyName: '',
  babySurname: '',
  babyDateOfBirth: '',
  message: ''
})
const isGrowthScreening = computed(() =>
  props.bookingFormVariant === 'growth_screening'
  || (!props.bookingFormVariant && /growth\s*ot|developmental\s+screenings?/i.test(props.eventTitle || ''))
)
const costLabel = computed(() => props.bookingCostLabel?.trim() || 'R375')
const hasEventForm = computed(() => !!props.eventId && !!props.formFileName)
const completedFormFile = ref<File | null>(null)
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

function chooseCompletedForm(e: Event) {
  const input = e.target as HTMLInputElement
  completedFormFile.value = input.files?.[0] ?? null
  err.value = ''
}

function isPdf(file: File) {
  return file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'
}

async function submit() {
  err.value = ''
  if (!f.name.trim()) { err.value = 'Please enter your name.'; return }
  if (!f.email.trim() && !f.phone.trim()) { err.value = 'Please enter a phone number or email so we can reach you.'; return }
  if (hasEventForm.value && !completedFormFile.value) {
    err.value = 'Please download, complete, and upload the event PDF before sending your details.'
    return
  }
  if (hasEventForm.value && completedFormFile.value && !isPdf(completedFormFile.value)) {
    err.value = 'Please upload the completed form as a PDF file.'
    return
  }
  if (!tsToken.value) { err.value = 'Just a moment — the spam check is still loading.'; return }
  state.value = 'submitting'
  try {
    let body: Record<string, string | undefined> | FormData
    const payload = {
      ...f,
      eventId: props.eventId,
      eventTitle: props.eventTitle,
      turnstileToken: tsToken.value
    }
    if (hasEventForm.value && completedFormFile.value) {
      const formData = new FormData()
      Object.entries(payload).forEach(([key, value]) => formData.set(key, value ?? ''))
      formData.set('completedForm', completedFormFile.value)
      body = formData
    } else {
      body = payload
    }
    await $fetch('/api/bookings', {
      method: 'POST',
      body
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

      <div v-if="isGrowthScreening" class="rounded-field border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-base-content/70">
        <span class="font-semibold text-secondary">Cost:</span> {{ costLabel }}
      </div>

      <div v-if="hasEventForm" class="rounded-field border border-primary/20 bg-primary/5 p-4">
        <div>
          <p class="font-display text-sm font-bold uppercase tracking-wide text-secondary">Complete the event form</p>
          <p class="mt-1 text-sm text-base-content/60">
            Download the PDF, complete it, then upload the completed PDF before sending your details.
          </p>
          <p class="mt-1 text-xs text-base-content/45">{{ formFileName }}</p>
        </div>
        <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a :href="`/api/calendar/event-form?id=${eventId}`" class="btn btn-primary btn-sm sm:w-auto">Download form</a>
          <label class="min-w-0 flex-1">
            <span class="sr-only">Upload completed PDF</span>
            <input type="file" accept="application/pdf,.pdf" class="file-input file-input-bordered file-input-sm w-full" @change="chooseCompletedForm" />
          </label>
        </div>
        <p v-if="completedFormFile" class="mt-3 rounded-field bg-success/10 px-3 py-2 text-sm text-success">
          Completed PDF ready to submit: <span class="font-semibold">{{ completedFormFile.name }}</span>
        </p>
        <p v-else class="mt-3 rounded-field bg-warning/10 px-3 py-2 text-sm text-warning-content">
          A completed PDF is required before this registration can be submitted.
        </p>
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

      <div v-if="isGrowthScreening" class="grid gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Baby name</span>
          <input v-model="f.babyName" :class="inputClass" placeholder="Baby first name" />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Baby surname</span>
          <input v-model="f.babySurname" :class="inputClass" placeholder="Baby surname" />
        </label>
        <label class="block sm:col-span-2">
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Baby date of birth</span>
          <input v-model="f.babyDateOfBirth" type="date" :class="inputClass" />
        </label>
      </div>

      <div v-else class="grid gap-3 sm:grid-cols-2">
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
