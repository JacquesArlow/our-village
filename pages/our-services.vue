<script setup lang="ts">
import { serviceCategories } from '~/data/services'
import { team } from '~/data/team'

useHead({ title: 'Our Services — Our Village' })

const therapistsFor = (category: string) =>
  team.filter((m) => m.category === category && m.bookable)
</script>

<template>
  <div>
    <section class="bg-base-200">
      <div class="container-px py-16 text-center sm:py-20">
        <p class="eyebrow mb-3">Our Services</p>
        <h1 class="font-display text-4xl font-bold text-secondary sm:text-5xl">Care for Every Chapter of Life</h1>
        <p class="mx-auto mt-4 max-w-2xl text-lg text-base-content/70">
          We support families through every milestone — from newborn care to lifelong wellness. Explore the services
          we offer and the professionals who provide them.
        </p>
      </div>
    </section>

    <section class="section-y">
      <div class="container-px space-y-20">
        <div v-for="(c, i) in serviceCategories" :key="c.key" :id="c.key" class="scroll-mt-24">
          <div class="grid items-start gap-10 lg:grid-cols-2" :class="i % 2 ? 'lg:[&>*:first-child]:order-2' : ''">
            <div class="overflow-hidden rounded-[2rem] shadow-md">
              <img :src="c.image" :alt="c.title" class="aspect-[4/3] w-full object-cover" />
            </div>
            <div>
              <h2 class="font-display text-3xl font-bold text-secondary">{{ c.title }}</h2>
              <p class="mt-4 leading-relaxed text-base-content/75">{{ c.intro }}</p>

              <ul class="mt-6 space-y-4">
                <li v-for="s in c.services" :key="s.name" class="flex gap-3">
                  <span class="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                    <svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-current stroke-[3]"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </span>
                  <span>
                    <span class="font-semibold text-secondary">{{ s.name }}</span>
                    <span class="block text-sm text-base-content/70">{{ s.description }}</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <!-- practitioners -->
          <div v-if="therapistsFor(c.category).length" class="mt-10">
            <h3 class="mb-5 text-sm font-bold uppercase tracking-[0.18em] text-primary">Meet the team</h3>
            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <TeamCard v-for="m in therapistsFor(c.category)" :key="m.slug" :member="m" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section-y bg-base-200">
      <div class="container-px text-center">
        <SectionHeading title="Not sure where to start?" subtitle="Send us a message and we’ll help you find the right professional for your family." />
        <div class="mt-8"><WhatsAppButton size="lg" label="Chat to us on WhatsApp" /></div>
      </div>
    </section>
  </div>
</template>
