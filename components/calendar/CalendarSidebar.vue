<script setup lang="ts">
import type { BlockRow } from '~~/shared/calendar'
import { blocksBySection, colorClass } from '~~/composables/useCalendar'
const props = defineProps<{ blocks: BlockRow[]; editable?: boolean }>()
const grouped = computed(() => blocksBySection(props.blocks))
</script>
<template>
  <aside class="grid gap-8 sm:grid-cols-2">
    <div>
      <h3 class="font-script text-4xl text-secondary">Important dates:</h3>
      <ul class="mt-2 space-y-1 text-sm">
        <li v-for="b in grouped.important_dates" :key="b.id" :class="colorClass(b.color)">{{ b.text }}</li>
      </ul>
    </div>
    <div>
      <div class="inline-block rounded-full bg-primary px-6 py-2 font-display font-bold tracking-[0.2em] text-primary-content">HOT TOPICS:</div>
      <ul class="mt-3 space-y-1 text-sm">
        <li v-for="b in grouped.hot_topics" :key="b.id">{{ b.text }}</li>
      </ul>
      <ul class="mt-3 space-y-1 text-sm font-semibold">
        <li v-for="b in grouped.focus" :key="b.id" :class="colorClass(b.color)">• {{ b.text }}</li>
      </ul>
    </div>
  </aside>
</template>
