<script setup lang="ts">
import type { EventRow } from '~~/shared/calendar'
import { eventDateLabel, eventTimeLabel, eventDirections, eventShareLink, isPastEvent, southAfricaToday } from '~~/shared/eventPresentation'

const route = useRoute()
const id = route.params.id as string
const { data: event, error } = await useFetch<EventRow>('/api/calendar/event', { query: { id } })
const today = useState('public-calendar-today', () => southAfricaToday())
const past = computed(() => event.value ? isPastEvent(event.value, today.value) : false)
const directions = computed(() => eventDirections(event.value?.publicDetails))
const siteUrl = useRuntimeConfig().public.siteUrl as string
const shareLink = computed(() => event.value ? eventShareLink(event.value, siteUrl) : '')
const eventDescription = computed(() => event.value?.detail || 'Find dates, details and booking information for Our Village events in Pretoria.')
if (import.meta.server && !event.value) {
  const requestEvent = useRequestEvent()
  const status = (error.value as { statusCode?: number } | null)?.statusCode || 404
  if (requestEvent) setResponseStatus(requestEvent, status)
}
usePageSeo({
  title: computed(() => event.value ? event.value.title + ' | Our Village Event' : 'Event Not Found | Our Village'),
  description: eventDescription,
  image: computed(() => event.value?.publicDetails?.posterUrl || '/services/baby-family-clinic.webp'),
  type: 'article',
  noindex: computed(() => !!error.value || !event.value)
})
</script>

<template>
  <section class="container-px section-y">
    <div class="mx-auto max-w-4xl">
      <NuxtLink to="/calendar" class="btn btn-ghost min-h-11">‹ All events</NuxtLink>
      <div v-if="error || !event" class="mt-6 rounded-box border border-dashed border-base-300 px-6 py-16 text-center">
        <h1 class="font-display text-3xl font-bold text-secondary">Event not found</h1>
        <p class="mt-3 text-base-content/65">This event may have been removed or isn't published yet.</p>
        <NuxtLink to="/calendar" class="btn btn-primary mt-6">View events</NuxtLink>
      </div>
      <template v-else>
        <article class="mt-6 min-w-0 overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm">
          <header class="border-b border-base-200 bg-base-200/40 p-5 sm:p-8">
            <p class="eyebrow">{{ past ? 'Past Our Village event' : 'Our Village event' }}</p>
            <h1 class="mt-3 break-words font-display text-2xl font-bold leading-tight text-secondary sm:text-4xl">{{ event.title }}</h1>
          </header>
          <div class="grid min-w-0 gap-8 p-5 sm:p-8" :class="event.publicDetails?.posterUrl ? 'md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]' : ''">
            <div class="min-w-0">
              <dl class="space-y-5 text-base-content/80">
                <div><dt class="text-xs font-semibold uppercase tracking-wide text-base-content/55">When</dt><dd class="mt-1 font-semibold text-secondary">{{ eventDateLabel(event) }}</dd></div>
                <div v-if="eventTimeLabel(event.publicDetails)"><dt class="text-xs font-semibold uppercase tracking-wide text-base-content/55">Time</dt><dd class="mt-1">{{ eventTimeLabel(event.publicDetails) }} <span class="text-sm text-base-content/60">(South African time)</span></dd></div>
                <div v-if="event.publicDetails?.venue || event.publicDetails?.address"><dt class="text-xs font-semibold uppercase tracking-wide text-base-content/55">Where</dt><dd class="mt-1 break-words"><span v-if="event.publicDetails.venue" class="block font-semibold text-secondary">{{ event.publicDetails.venue }}</span>{{ event.publicDetails.address }}</dd></div>
                <div v-if="event.bookingCostLabel"><dt class="text-xs font-semibold uppercase tracking-wide text-base-content/55">Cost</dt><dd class="mt-1 font-semibold text-secondary">{{ event.bookingCostLabel }}</dd></div>
                <div v-if="event.publicDetails?.presenter"><dt class="text-xs font-semibold uppercase tracking-wide text-base-content/55">Presented by</dt><dd class="mt-1">{{ event.publicDetails.presenter }}</dd></div>
              </dl>
              <p v-if="event.detail" class="mt-6 whitespace-pre-line break-words leading-relaxed text-base-content/75">{{ event.detail }}</p>
              <a v-if="!past" href="#registration" class="btn btn-primary mt-6 min-h-12 w-full sm:w-auto">Book your spot <span aria-hidden="true">↓</span></a>
              <p v-else class="mt-6 rounded-field bg-base-200 p-4 text-base-content/70">This event has ended. <NuxtLink to="/calendar" class="font-semibold text-secondary underline">Find upcoming events</NuxtLink>.</p>
            </div>
            <figure v-if="event.publicDetails?.posterUrl" class="hidden min-w-0 self-start md:block">
              <a :href="event.publicDetails.posterUrl" target="_blank" rel="noopener" :aria-label="'Open the poster for ' + event.title"><img :src="event.publicDetails.posterUrl" :alt="event.title + ' event poster'" class="h-auto w-full rounded-field" /></a>
              <figcaption class="mt-2 text-center text-sm text-base-content/55">Select the poster to view it full size.</figcaption>
            </figure>
            <details v-if="event.publicDetails?.posterUrl" class="min-w-0 rounded-field border border-base-300 p-4 md:hidden">
              <summary class="cursor-pointer font-semibold text-secondary">View event poster</summary>
              <a :href="event.publicDetails.posterUrl" target="_blank" rel="noopener"><img :src="event.publicDetails.posterUrl" :alt="event.title + ' event poster'" loading="lazy" class="mt-4 h-auto w-full rounded-field" /></a>
            </details>
          </div>
          <div class="flex flex-wrap gap-3 border-t border-base-200 px-5 py-5 sm:px-8" aria-label="Event shortcuts">
            <a :href="`/api/calendar/event.ics?id=${event.id}`" class="btn btn-outline min-h-11">Add to calendar</a>
            <a v-if="directions" :href="directions" target="_blank" rel="noopener" class="btn btn-ghost min-h-11">Directions ↗</a>
            <a :href="shareLink" target="_blank" rel="noopener" class="btn btn-ghost min-h-11">Share on WhatsApp ↗</a>
            <WhatsAppButton :context="`the ${event.title} event`" label="Ask a question" size="sm" class="min-h-11" />
          </div>
        </article>
        <section v-if="!past" id="registration" class="mt-8 scroll-mt-6" aria-label="Event registration">
          <CalendarBookingForm :event-id="event.id" :event-title="event.title" :form-file-name="event.formFileName" :booking-form-variant="event.bookingFormVariant" :booking-cost-label="event.bookingCostLabel" :form-dropdown="event.formDropdown" />
        </section>
      </template>
    </div>
  </section>
</template>
