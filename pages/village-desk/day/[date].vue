<script setup lang="ts">
import type { EventRow, BlockRow, ColorToken } from '~~/shared/calendar'
import { eventsForDay, colorClass } from '~~/composables/useCalendar'
definePageMeta({ middleware: 'admin', layout: false })
const route = useRoute()
const date = route.params.date as string
const [y, m] = date.split('-').map(Number)
const { data, refresh } = await useFetch<{ events: EventRow[]; blocks: BlockRow[] }>('/api/admin/month', { query: { year: y, month: m } })
const dayEvents = computed(() => eventsForDay(data.value?.events ?? [], date))
const editing = ref<EventRow | null>(null)
const adding = ref(false)
const qrFor = ref<string | null>(null)
function toggleQr(e: EventRow) { qrFor.value = qrFor.value === e.id ? null : e.id }
const bookingsFor = ref<string | null>(null)
function toggleBookings(e: EventRow) { bookingsFor.value = bookingsFor.value === e.id ? null : e.id }
const pretty = new Date(date + 'T00:00:00').toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
async function del(e: EventRow) { if (!confirm('Delete this event?')) return; await $fetch('/api/admin/event', { method: 'DELETE', body: { id: e.id } }); refresh() }
function onSaved() { editing.value = null; adding.value = false; refresh() }
function startAdd() { editing.value = null; adding.value = true }
function startEdit(e: EventRow) { adding.value = false; editing.value = e }
useHead({ title: `${pretty} — Village Desk` })
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <header class="border-b border-base-300 bg-base-100/80 backdrop-blur">
      <div class="container-px flex h-16 items-center">
        <NuxtLink to="/village-desk" class="btn btn-ghost btn-sm">‹ Back to planner</NuxtLink>
      </div>
    </header>

    <div class="container-px max-w-2xl py-8">
      <p class="eyebrow">Editing</p>
      <h1 class="font-script text-5xl leading-tight text-secondary">{{ pretty }}</h1>

      <ul class="mt-6 space-y-2">
        <li v-for="e in dayEvents" :key="e.id" class="rounded-box border border-base-300 bg-base-100 p-3">
          <div class="flex items-center gap-3">
            <span class="h-2.5 w-2.5 shrink-0 rounded-full" :class="{ 'bg-primary': e.color==='sage', 'bg-accent': e.color==='pink', 'bg-error': e.color==='red', 'bg-base-300': e.color==='default' }"></span>
            <span class="min-w-0 flex-1">
              <span class="font-semibold" :class="colorClass(e.color)">{{ e.title }}</span>
              <span v-if="!e.isPublic" class="ml-2 rounded-full bg-base-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-base-content/45">private</span>
              <span v-if="e.detail" class="block text-sm text-base-content/60">{{ e.detail }}</span>
            </span>
            <button class="btn btn-ghost btn-xs" :class="bookingsFor === e.id ? 'text-secondary' : ''" @click="toggleBookings(e)">Bookings</button>
            <button class="btn btn-ghost btn-xs" :class="qrFor === e.id ? 'text-secondary' : ''" @click="toggleQr(e)">QR</button>
            <button class="btn btn-ghost btn-xs" @click="startEdit(e)">Edit</button>
            <button class="btn btn-ghost btn-xs text-error" @click="del(e)">Delete</button>
          </div>
          <div v-if="bookingsFor === e.id" class="mt-3">
            <CalendarBookingsTable :event-id="e.id" />
          </div>
          <div v-if="qrFor === e.id" class="mt-3">
            <CalendarEventQr :event="e" />
          </div>
        </li>
        <li v-if="!dayEvents.length && !adding" class="rounded-box border border-dashed border-base-300 px-4 py-6 text-center text-sm text-base-content/45">
          No events on this day yet.
        </li>
      </ul>

      <div class="mt-5">
        <button v-if="!adding && !editing" class="btn btn-primary btn-sm" @click="startAdd">+ Add event</button>
        <CalendarEventEditForm v-if="adding" :date="date" @saved="onSaved" @cancel="adding=false" />
        <CalendarEventEditForm v-if="editing" :key="editing.id" :date="date" :model="editing" @saved="onSaved" @cancel="editing=null" />
      </div>
    </div>
  </div>
</template>
