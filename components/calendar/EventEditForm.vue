<script setup lang="ts">
import type { EventRow } from '~~/shared/calendar'
import { COLOR_TOKENS } from '~~/shared/calendar'
const props = defineProps<{ date: string; model?: EventRow | null }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()
const f = reactive({
  id: props.model?.id, startDate: props.model?.startDate ?? props.date,
  endDate: props.model?.endDate ?? '', title: props.model?.title ?? '',
  detail: props.model?.detail ?? '', staff: props.model?.staff ?? '',
  color: props.model?.color ?? 'default', isHighlight: props.model?.isHighlight ?? false,
  isPublic: props.model?.isPublic ?? false
})
async function save() {
  const body = { ...f, endDate: f.endDate || null }
  if (f.id) await $fetch('/api/admin/event', { method: 'PATCH', body })
  else await $fetch('/api/admin/event', { method: 'POST', body })
  emit('saved')
}
</script>
<template>
  <form class="space-y-3 rounded-box bg-base-100 p-4" @submit.prevent="save">
    <input v-model="f.title" class="input input-bordered w-full" placeholder="Title" required />
    <input v-model="f.detail" class="input input-bordered w-full" placeholder="Detail (optional)" />
    <input v-model="f.staff" class="input input-bordered w-full" placeholder="Staff (optional, internal)" />
    <div class="flex gap-3">
      <label class="text-sm">Start <input v-model="f.startDate" type="date" class="input input-bordered input-sm" /></label>
      <label class="text-sm">End <input v-model="f.endDate" type="date" class="input input-bordered input-sm" /></label>
      <select v-model="f.color" class="select select-bordered select-sm"><option v-for="c in COLOR_TOKENS" :key="c" :value="c">{{ c }}</option></select>
    </div>
    <div class="flex gap-4">
      <label class="flex items-center gap-2 text-sm"><input v-model="f.isHighlight" type="checkbox" class="checkbox checkbox-sm" /> Highlight dot</label>
      <label class="flex items-center gap-2 text-sm"><input v-model="f.isPublic" type="checkbox" class="toggle toggle-primary toggle-sm" /> Show on public site</label>
    </div>
    <div class="flex gap-2">
      <button class="btn btn-primary btn-sm" type="submit">Save</button>
      <button class="btn btn-ghost btn-sm" type="button" @click="$emit('cancel')">Cancel</button>
    </div>
  </form>
</template>
