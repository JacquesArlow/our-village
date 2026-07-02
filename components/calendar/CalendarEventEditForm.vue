<script setup lang="ts">
import type { EventRow, ColorToken } from '~~/shared/calendar'
import { COLOR_TOKENS } from '~~/shared/calendar'

const props = defineProps<{ date: string; model?: EventRow | null }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const f = reactive({
  id: props.model?.id,
  startDate: props.model?.startDate ?? props.date,
  endDate: (props.model?.endDate ?? null) as string | null,
  title: props.model?.title ?? '',
  detail: props.model?.detail ?? '',
  staff: props.model?.staff ?? '',
  color: (props.model?.color ?? 'default') as ColorToken,
  isHighlight: props.model?.isHighlight ?? false,
  isPublic: props.model?.isPublic ?? false
})
const err = ref('')
const saving = ref(false)

const SWATCH: Record<ColorToken, string> = {
  default: 'bg-base-300', sage: 'bg-primary', pink: 'bg-accent', red: 'bg-error', blue: 'bg-info'
}

async function save() {
  if (!f.title.trim()) { err.value = 'A title is required'; return }
  err.value = ''; saving.value = true
  try {
    const body = { ...f, endDate: f.endDate || null, staff: f.staff || null, detail: f.detail || null }
    await $fetch('/api/admin/event', { method: f.id ? 'PATCH' : 'POST', body })
    emit('saved')
  } catch (e: any) {
    err.value = e?.data?.message || e?.message || 'Save failed'
  } finally {
    saving.value = false
  }
}
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
