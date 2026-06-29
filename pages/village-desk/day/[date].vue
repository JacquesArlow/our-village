<script setup lang="ts">
import type { EventRow, BlockRow } from '~~/shared/calendar'
import { eventsForDay } from '~~/composables/useCalendar'
definePageMeta({ middleware: 'admin', layout: false })
const route = useRoute()
const date = route.params.date as string
const [y, m] = date.split('-').map(Number)
const { data, refresh } = await useFetch<{ events: EventRow[]; blocks: BlockRow[] }>('/api/admin/month', { query: { year: y, month: m } })
const dayEvents = computed(() => eventsForDay(data.value?.events ?? [], date))
const editing = ref<EventRow | null>(null)
const adding = ref(false)
async function del(e: EventRow) { if (!confirm('Delete this event?')) return; await $fetch('/api/admin/event', { method:'DELETE', body:{ id:e.id } }); refresh() }
function onSaved() { editing.value=null; adding.value=false; refresh() }
useHead({ title: `Edit ${date} — Village Desk` })
</script>
<template>
  <div class="container-px py-8">
    <NuxtLink to="/village-desk" class="btn btn-ghost btn-sm">‹ Back to planner</NuxtLink>
    <h1 class="mt-2 font-script text-4xl text-secondary">{{ date }}</h1>
    <ul class="mt-4 space-y-2">
      <li v-for="e in dayEvents" :key="e.id" class="flex items-center justify-between rounded-box bg-base-100 p-3">
        <span>{{ e.title }} <span v-if="!e.isPublic" class="text-xs text-base-content/40">(private)</span></span>
        <span class="flex gap-2">
          <button class="btn btn-ghost btn-xs" @click="editing = e">Edit</button>
          <button class="btn btn-ghost btn-xs text-error" @click="del(e)">Delete</button>
        </span>
      </li>
    </ul>
    <div class="mt-4">
      <button v-if="!adding && !editing" class="btn btn-primary btn-sm" @click="adding = true">+ Add event</button>
      <EventEditForm v-if="adding" :date="date" @saved="onSaved" @cancel="adding=false" />
      <EventEditForm v-if="editing" :date="date" :model="editing" @saved="onSaved" @cancel="editing=null" />
    </div>
  </div>
</template>
