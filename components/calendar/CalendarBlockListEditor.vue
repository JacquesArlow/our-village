<script setup lang="ts">
import type { BlockRow, BlockSection, ColorToken } from '~~/shared/calendar'
import { COLOR_TOKENS, BLOCK_SECTION_LABELS } from '~~/shared/calendar'

const props = defineProps<{ year: number; month: number; section: BlockSection; items: BlockRow[] }>()
const emit = defineEmits<{ changed: [] }>()
const newText = ref('')
const busy = ref(false)

const HINT: Record<BlockSection, string> = {
  important_dates: 'e.g. 25 — World Vitiligo Day',
  hot_topics: 'e.g. # Men’s Health Month',
  focus: 'e.g. Monique — 1000 days',
  training: 'e.g. Training: Megan, Dr Wian'
}
const SWATCH: Record<ColorToken, string> = {
  default: 'bg-base-300', sage: 'bg-primary', pink: 'bg-accent', red: 'bg-error'
}

async function add() {
  if (!newText.value.trim() || busy.value) return
  busy.value = true
  try {
    await $fetch('/api/admin/block', { method: 'POST', body: {
      year: props.year, month: props.month, section: props.section,
      text: newText.value.trim(), sortOrder: props.items.length, isPublic: false
    }})
    newText.value = ''; emit('changed')
  } finally { busy.value = false }
}
async function patch(b: BlockRow, p: Partial<BlockRow>) {
  await $fetch('/api/admin/block', { method: 'PATCH', body: { id: b.id, ...p } }); emit('changed')
}
async function remove(b: BlockRow) {
  await $fetch('/api/admin/block', { method: 'DELETE', body: { id: b.id } }); emit('changed')
}
</script>

<template>
  <div class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
    <div class="mb-3 flex items-center gap-2">
      <span class="h-2.5 w-2.5 rounded-full bg-primary"></span>
      <h4 class="font-display text-sm font-bold uppercase tracking-wide text-secondary">{{ BLOCK_SECTION_LABELS[section] }}</h4>
      <span class="ml-auto rounded-full bg-base-200 px-2 py-0.5 text-xs text-base-content/50">{{ items.length }}</span>
    </div>

    <ul class="space-y-2.5">
      <li v-for="b in items" :key="b.id" class="rounded-field border border-base-200 bg-base-100 p-2">
        <input
          class="w-full rounded-field border border-transparent bg-base-200/50 px-2.5 py-1.5 text-sm focus:border-primary focus:bg-base-100 focus:outline-none"
          :value="b.text"
          @change="patch(b, { text: ($event.target as HTMLInputElement).value })"
        />
        <div class="mt-2 flex items-center gap-2">
          <!-- colour swatches -->
          <div class="flex gap-1">
            <button
              v-for="c in COLOR_TOKENS" :key="c" type="button" :title="c"
              @click="patch(b, { color: c })"
              class="h-4 w-4 rounded-full ring-1 ring-black/10 transition"
              :class="[SWATCH[c], b.color === c ? 'outline outline-2 outline-offset-1 outline-primary' : 'opacity-60 hover:opacity-100']"
            ></button>
          </div>
          <label class="ml-auto flex cursor-pointer items-center gap-1.5 text-xs"
            :class="b.isPublic ? 'text-secondary' : 'text-base-content/45'">
            <input type="checkbox" class="toggle toggle-primary toggle-xs" :checked="b.isPublic"
              @change="patch(b, { isPublic: ($event.target as HTMLInputElement).checked })" />
            {{ b.isPublic ? 'Public' : 'Private' }}
          </label>
          <button class="grid h-6 w-6 place-items-center rounded-field text-base-content/40 transition hover:bg-error/10 hover:text-error" @click="remove(b)" aria-label="Delete">✕</button>
        </div>
      </li>
      <li v-if="!items.length" class="rounded-field border border-dashed border-base-300 px-3 py-2 text-xs text-base-content/40">
        Nothing yet — add the first item below.
      </li>
    </ul>

    <div class="mt-3 flex gap-2">
      <input v-model="newText" class="flex-1 rounded-field border border-base-300 bg-base-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" :placeholder="HINT[section]" @keyup.enter="add" />
      <button class="btn btn-primary btn-sm" :disabled="busy || !newText.trim()" @click="add">Add</button>
    </div>
  </div>
</template>
