<script setup lang="ts">
import type { BlockRow, BlockSection } from '~~/shared/calendar'
import { COLOR_TOKENS, BLOCK_SECTION_LABELS } from '~~/shared/calendar'
const props = defineProps<{ year: number; month: number; section: BlockSection; items: BlockRow[] }>()
const emit = defineEmits<{ changed: [] }>()
const newText = ref('')
async function add() {
  if (!newText.value.trim()) return
  await $fetch('/api/admin/block', { method: 'POST', body: {
    year: props.year, month: props.month, section: props.section,
    text: newText.value, sortOrder: props.items.length, isPublic: false
  }})
  newText.value = ''; emit('changed')
}
async function patch(b: BlockRow, p: Partial<BlockRow>) {
  await $fetch('/api/admin/block', { method: 'PATCH', body: { id: b.id, ...p } }); emit('changed')
}
async function remove(b: BlockRow) {
  await $fetch('/api/admin/block', { method: 'DELETE', body: { id: b.id } }); emit('changed')
}
</script>
<template>
  <div class="rounded-box bg-base-100 p-4">
    <h4 class="font-display font-bold text-secondary">{{ BLOCK_SECTION_LABELS[section] }}</h4>
    <ul class="mt-2 space-y-2">
      <li v-for="b in items" :key="b.id" class="flex items-center gap-2">
        <input class="input input-bordered input-sm flex-1" :value="b.text" @change="patch(b, { text: ($event.target as HTMLInputElement).value })" />
        <select class="select select-bordered select-sm" :value="b.color" @change="patch(b, { color: ($event.target as HTMLSelectElement).value as any })">
          <option v-for="c in COLOR_TOKENS" :key="c" :value="c">{{ c }}</option>
        </select>
        <label class="flex items-center gap-1 text-xs">
          <input type="checkbox" class="toggle toggle-primary toggle-sm" :checked="b.isPublic" @change="patch(b, { isPublic: ($event.target as HTMLInputElement).checked })" />
          public
        </label>
        <button class="btn btn-ghost btn-xs text-error" @click="remove(b)">✕</button>
      </li>
    </ul>
    <div class="mt-2 flex gap-2">
      <input v-model="newText" class="input input-bordered input-sm flex-1" placeholder="Add item…" @keyup.enter="add" />
      <button class="btn btn-primary btn-sm" @click="add">Add</button>
    </div>
  </div>
</template>
