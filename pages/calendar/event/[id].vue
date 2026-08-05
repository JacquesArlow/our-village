<script setup lang="ts">
import type { EventRow } from '~~/shared/calendar'
import { colorClass } from '~~/composables/useCalendar'

const route = useRoute()
const id = route.params.id as string
const { data: event, error } = await useFetch<EventRow>('/api/calendar/event', { query: { id } })

const fmtFull = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const fmtShort = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })

useHead(() => ({ title: event.value ? `${event.value.title} — Our Village` : 'Event — Our Village' }))
</script>

<template>
  <section class="container-px section-y">
    <div class="mx-auto max-w-2xl">
      <NuxtLink to="/calendar" class="btn btn-ghost btn-sm">‹ Back to calendar</NuxtLink>

      <!-- Not found / unpublished -->
      <div v-if="error || !event" class="mt-6 rounded-box border border-dashed border-base-300 px-6 py-16 text-center">
        <p class="font-script text-4xl text-secondary">Event not found</p>
        <p class="mt-2 text-base-content/55">This event may have been removed or isn’t published yet.</p>
        <NuxtLink to="/calendar" class="btn btn-primary btn-sm mt-6">View the calendar</NuxtLink>
      </div>

      <!-- Event -->
      <article v-else class="mt-6 overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm">
        <div class="flex items-center gap-4 border-b border-base-200 bg-base-200/40 px-6 py-5">
          <div class="grid h-16 w-16 shrink-0 place-items-center rounded-box bg-base-100 text-center shadow-sm">
            <span class="text-[10px] font-semibold uppercase tracking-wide text-base-content/45">
              {{ new Date(event.startDate + 'T00:00:00').toLocaleDateString('en-ZA', { month: 'short' }) }}
            </span>
            <span class="font-display text-2xl font-bold leading-none text-secondary">{{ +event.startDate.slice(8, 10) }}</span>
          </div>
          <div class="min-w-0">
            <p class="eyebrow">Our Village event</p>
            <h1 class="font-display text-2xl font-bold leading-tight" :class="colorClass(event.color)">{{ event.title }}</h1>
          </div>
        </div>

        <div class="space-y-4 px-6 py-6">
          <p class="flex items-center gap-2 text-base-content/75">
            <svg viewBox="0 0 24 24" class="h-4 w-4 text-primary" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4" stroke-linecap="round"/></svg>
            <span>
              {{ fmtFull(event.startDate) }}
              <template v-if="event.endDate && event.endDate !== event.startDate"> — {{ fmtShort(event.endDate) }}</template>
            </span>
          </p>
          <p v-if="event.detail" class="text-base-content/70">{{ event.detail }}</p>

          <div class="flex flex-wrap gap-3 pt-2">
            <WhatsAppButton :context="`the ${event.title} event`" label="Chat on WhatsApp" size="sm" />
            <NuxtLink to="/calendar/events" class="btn btn-ghost btn-sm">See all events ›</NuxtLink>
          </div>

          <div v-if="event.formFileName" class="rounded-box border border-primary/20 bg-primary/5 p-4">
            <p class="font-display text-sm font-bold uppercase tracking-wide text-secondary">Event form</p>
            <p class="mt-1 text-sm text-base-content/60">{{ event.formFileName }}</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <a :href="`/api/calendar/event-form?id=${event.id}`" class="btn btn-primary btn-sm">Download form</a>
            </div>
            <p class="mt-3 text-xs text-base-content/50">Upload the completed PDF in the registration form below.</p>
          </div>
        </div>
      </article>

      <!-- Booking / register-interest form -->
      <div v-if="event" class="mt-6">
        <CalendarBookingForm
          :event-id="event.id"
          :event-title="event.title"
          :form-file-name="event.formFileName"
          :booking-form-variant="event.bookingFormVariant"
          :booking-cost-label="event.bookingCostLabel"
        />
      </div>
    </div>
  </section>
</template>
