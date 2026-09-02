<script setup lang="ts">
import type { EventRow, ColorToken, BookingFormVariant, FormDropdownConfig } from '~~/shared/calendar'
import { COLOR_TOKENS } from '~~/shared/calendar'

const props = defineProps<{ date: string; model?: EventRow | null }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()
const inferredVariant = /growth\s*ot|developmental\s+screenings?/i.test(props.model?.title || '')
  ? 'growth_screening'
  : 'standard'

const f = reactive({
  id: props.model?.id,
  startDate: props.model?.startDate ?? props.date,
  endDate: (props.model?.endDate ?? null) as string | null,
  title: props.model?.title ?? '',
  detail: props.model?.detail ?? '',
  staff: props.model?.staff ?? '',
  formFileName: props.model?.formFileName ?? null,
  formFileSize: props.model?.formFileSize ?? null,
  formUploadedAt: props.model?.formUploadedAt ?? null,
  bookingFormVariant: (props.model?.bookingFormVariant ?? inferredVariant) as BookingFormVariant,
  bookingCostLabel: props.model?.bookingCostLabel ?? (inferredVariant === 'growth_screening' ? 'R375' : ''),
  formDropdown: props.model?.formDropdown
    ? {
        ...props.model.formDropdown,
        options: [...props.model.formDropdown.options]
      }
    : {
        enabled: false,
        label: '',
        selectionMode: 'single',
        options: ['']
      } as FormDropdownConfig,
  color: (props.model?.color ?? 'default') as ColorToken,
  isHighlight: props.model?.isHighlight ?? false,
  isPublic: props.model?.isPublic ?? false
})
const err = ref('')
const saving = ref(false)
const uploadErr = ref('')
const uploading = ref(false)
const selectedPdf = ref<File | null>(null)

const SWATCH: Record<ColorToken, string> = {
  default: 'bg-base-300', sage: 'bg-primary', pink: 'bg-accent', red: 'bg-error', blue: 'bg-info'
}

function addDropdownOption() {
  f.formDropdown.options.push('')
}

function removeDropdownOption(index: number) {
  f.formDropdown.options.splice(index, 1)
  if (!f.formDropdown.options.length) f.formDropdown.options.push('')
}

function cleanDropdown(): FormDropdownConfig | null {
  if (!f.formDropdown.enabled) return null
  const options = f.formDropdown.options.map(option => option.trim()).filter(Boolean)
  return {
    enabled: true,
    label: f.formDropdown.label.trim(),
    selectionMode: f.formDropdown.selectionMode,
    options
  }
}

async function save() {
  if (!f.title.trim()) { err.value = 'A title is required'; return }
  err.value = ''; saving.value = true
  try {
    const body = {
      id: f.id,
      startDate: f.startDate,
      endDate: f.endDate || null,
      title: f.title,
      detail: f.detail || null,
      staff: f.staff || null,
      bookingFormVariant: f.bookingFormVariant,
      bookingCostLabel: f.bookingFormVariant === 'growth_screening' ? (f.bookingCostLabel || 'R375') : null,
      formDropdown: cleanDropdown(),
      color: f.color,
      isHighlight: f.isHighlight,
      isPublic: f.isPublic
    }
    await $fetch('/api/admin/event', { method: f.id ? 'PATCH' : 'POST', body })
    emit('saved')
  } catch (e: any) {
    err.value = e?.data?.message || e?.message || 'Save failed'
  } finally {
    saving.value = false
  }
}

function choosePdf(e: Event) {
  const input = e.target as HTMLInputElement
  selectedPdf.value = input.files?.[0] ?? null
}

async function uploadPdf() {
  uploadErr.value = ''
  if (!f.id) { uploadErr.value = 'Save the event before uploading a form.'; return }
  if (!selectedPdf.value) { uploadErr.value = 'Choose a PDF first.'; return }
  if (!selectedPdf.value.name.toLowerCase().endsWith('.pdf') && selectedPdf.value.type !== 'application/pdf') {
    uploadErr.value = 'Please choose a PDF file.'
    return
  }
  const body = new FormData()
  body.set('eventId', f.id)
  body.set('file', selectedPdf.value)
  uploading.value = true
  try {
    const res = await $fetch<{ fileName: string; fileSize: number }>('/api/admin/event-form', { method: 'POST', body })
    f.formFileName = res.fileName
    f.formFileSize = res.fileSize
    f.formUploadedAt = Date.now()
    selectedPdf.value = null
  } catch (e: any) {
    uploadErr.value = e?.data?.statusMessage || e?.data?.message || 'Upload failed'
  } finally {
    uploading.value = false
  }
}

async function removePdf() {
  if (!f.id || !confirm('Remove the attached form from this event?')) return
  uploadErr.value = ''
  try {
    await $fetch('/api/admin/event-form', { method: 'DELETE', body: { eventId: f.id } })
    f.formFileName = null
    f.formFileSize = null
    f.formUploadedAt = null
  } catch (e: any) {
    uploadErr.value = e?.data?.statusMessage || e?.data?.message || 'Could not remove form'
  }
}

const fmtBytes = (bytes: number | null) => bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : ''
</script>

<template>
  <form class="space-y-5 rounded-box border border-base-300 bg-base-100 p-5 shadow-sm" @submit.prevent="save">
    <p class="font-display text-sm font-bold uppercase tracking-wide text-secondary">
      {{ f.id ? 'Edit event' : 'New event' }}
    </p>

    <label class="block">
      <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Title</span>
      <input v-model="f.title" class="w-full rounded-field border border-base-300 bg-base-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. World Vitiligo Day" required />
    </label>

    <label class="block">
      <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Detail <span class="font-normal normal-case text-base-content/40">— optional second line</span></span>
      <input v-model="f.detail" class="w-full rounded-field border border-base-300 bg-base-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Antenatal class — online" />
    </label>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Date</span>
        <CalendarDatePicker v-model="f.startDate" placeholder="Pick a date" />
      </div>
      <div>
        <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">End <span class="font-normal normal-case text-base-content/40">— for a range</span></span>
        <CalendarDatePicker v-model="f.endDate" placeholder="Same day" clearable />
      </div>
    </div>

    <div>
      <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Colour</span>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="c in COLOR_TOKENS" :key="c" type="button" @click="f.color = c"
          class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs capitalize transition"
          :class="f.color === c ? 'border-primary bg-primary/10 font-semibold text-secondary' : 'border-base-300 text-base-content/60 hover:border-base-content/30'"
        >
          <span class="h-3 w-3 rounded-full ring-1 ring-black/5" :class="SWATCH[c]"></span>{{ c }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <label class="flex cursor-pointer items-center justify-between rounded-field border border-base-300 px-3 py-2.5">
        <span class="text-sm">
          <span class="font-semibold text-base-content/80">Highlight</span>
          <span class="block text-xs text-base-content/45">Sage dot on the day</span>
        </span>
        <input v-model="f.isHighlight" type="checkbox" class="toggle toggle-primary toggle-sm" />
      </label>
      <label class="flex cursor-pointer items-center justify-between rounded-field border px-3 py-2.5 transition"
        :class="f.isPublic ? 'border-primary bg-primary/5' : 'border-base-300'">
        <span class="text-sm">
          <span class="font-semibold" :class="f.isPublic ? 'text-secondary' : 'text-base-content/80'">{{ f.isPublic ? 'Public' : 'Private' }}</span>
          <span class="block text-xs text-base-content/45">{{ f.isPublic ? 'Shown on the website' : 'Hidden from visitors' }}</span>
        </span>
        <input v-model="f.isPublic" type="checkbox" class="toggle toggle-primary toggle-sm" />
      </label>
    </div>

    <label class="block">
      <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Staff <span class="font-normal normal-case text-base-content/40">— internal only, never shown publicly</span></span>
      <input v-model="f.staff" class="w-full rounded-field border border-base-300 bg-base-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Megan" />
    </label>

    <div class="rounded-field border border-base-300 p-4">
      <div class="mb-3">
        <p class="font-display text-sm font-bold uppercase tracking-wide text-secondary">Registration form</p>
        <p class="text-xs text-base-content/45">Choose which fields visitors see when they send their details for this event.</p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Form type</span>
          <select v-model="f.bookingFormVariant" class="select select-bordered select-sm w-full">
            <option value="standard">Standard - guests</option>
            <option value="growth_screening">Growth screening - baby details</option>
          </select>
        </label>
        <label v-if="f.bookingFormVariant === 'growth_screening'" class="block">
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Cost label</span>
          <input v-model="f.bookingCostLabel" class="w-full rounded-field border border-base-300 bg-base-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="R375" />
        </label>
      </div>

      <div class="mt-4 space-y-3 border-t border-base-200 pt-4">
        <label class="flex cursor-pointer items-center justify-between gap-4 rounded-field border border-base-300 px-3 py-2.5">
          <span class="text-sm">
            <span class="font-semibold text-base-content/80">Dropdown question</span>
            <span class="block text-xs text-base-content/45">Add a single or multi-select field to this registration form</span>
          </span>
          <input v-model="f.formDropdown.enabled" type="checkbox" class="toggle toggle-primary toggle-sm" />
        </label>

        <div v-if="f.formDropdown.enabled" class="space-y-3">
          <label class="block">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Question label</span>
            <input v-model="f.formDropdown.label" class="w-full rounded-field border border-base-300 bg-base-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Which sessions are you interested in?" />
          </label>

          <div>
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Selection type</span>
            <div class="grid grid-cols-2 gap-2">
              <label
                class="flex cursor-pointer items-center gap-2 rounded-field border px-3 py-2 text-sm transition"
                :class="f.formDropdown.selectionMode === 'single' ? 'border-primary bg-primary/5 text-secondary' : 'border-base-300 text-base-content/70'"
              >
                <input v-model="f.formDropdown.selectionMode" type="radio" value="single" class="radio radio-primary radio-xs" />
                Single select
              </label>
              <label
                class="flex cursor-pointer items-center gap-2 rounded-field border px-3 py-2 text-sm transition"
                :class="f.formDropdown.selectionMode === 'multiple' ? 'border-primary bg-primary/5 text-secondary' : 'border-base-300 text-base-content/70'"
              >
                <input v-model="f.formDropdown.selectionMode" type="radio" value="multiple" class="radio radio-primary radio-xs" />
                Multi select
              </label>
            </div>
          </div>

          <div>
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55">Options</span>
            <div class="space-y-2">
              <div v-for="(_option, index) in f.formDropdown.options" :key="index" class="flex gap-2">
                <input v-model="f.formDropdown.options[index]" class="min-w-0 flex-1 rounded-field border border-base-300 bg-base-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" :placeholder="`Option ${index + 1}`" />
                <button class="btn btn-ghost btn-sm px-2 text-error" type="button" aria-label="Remove option" @click="removeDropdownOption(index)">Remove</button>
              </div>
            </div>
            <button class="btn btn-ghost btn-sm mt-2" type="button" @click="addDropdownOption">Add option</button>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-field border border-base-300 p-4">
      <div class="mb-3">
        <p class="font-display text-sm font-bold uppercase tracking-wide text-secondary">Event PDF form</p>
        <p class="text-xs text-base-content/45">Visitors can download this form and upload a completed PDF on the event page.</p>
      </div>

      <div v-if="f.formFileName" class="mb-3 rounded-field bg-base-200 px-3 py-2 text-sm">
        <p class="font-semibold text-base-content/80">{{ f.formFileName }}</p>
        <p class="text-xs text-base-content/45">{{ fmtBytes(f.formFileSize) }}</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <a v-if="f.id" :href="`/api/admin/event-form?id=${f.id}`" class="btn btn-ghost btn-xs">Download</a>
          <button type="button" class="btn btn-ghost btn-xs text-error" @click="removePdf">Remove</button>
        </div>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row">
        <input type="file" accept="application/pdf,.pdf" class="file-input file-input-bordered file-input-sm min-w-0 flex-1" :disabled="!f.id || uploading" @change="choosePdf" />
        <button type="button" class="btn btn-primary btn-sm" :disabled="!f.id || !selectedPdf || uploading" @click="uploadPdf">
          {{ uploading ? 'Uploading...' : f.formFileName ? 'Replace PDF' : 'Upload PDF' }}
        </button>
      </div>
      <p v-if="!f.id" class="mt-2 text-xs text-base-content/45">Save the event first, then upload its PDF.</p>
      <p v-if="uploadErr" class="mt-2 rounded-field bg-error/10 px-3 py-2 text-sm text-error">{{ uploadErr }}</p>
    </div>

    <!-- QR code: available once the event exists (needs an id) -->
    <div v-if="f.id" class="border-t border-base-200 pt-4">
      <CalendarEventQr :event="{ id: f.id, title: f.title, isPublic: f.isPublic }" />
    </div>
    <p v-else class="rounded-field border border-dashed border-base-300 px-3 py-2 text-xs text-base-content/45">
      Save the event to generate its shareable link &amp; QR code.
    </p>

    <p v-if="err" class="rounded-field bg-error/10 px-3 py-2 text-sm text-error">{{ err }}</p>

    <div class="flex gap-2 pt-1">
      <button class="btn btn-primary btn-sm flex-1" type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save event' }}</button>
      <button class="btn btn-ghost btn-sm" type="button" @click="emit('cancel')">Cancel</button>
    </div>
  </form>
</template>
