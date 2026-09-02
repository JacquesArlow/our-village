<script setup lang="ts">
import { team, teamBySlug } from '~/data/team'

const route = useRoute()
const member = computed(() => teamBySlug(route.params.slug as string))

if (!member.value) {
  throw createError({ statusCode: 404, statusMessage: 'Team member not found', fatal: true })
}

const siteUrl = (useRuntimeConfig().public.siteUrl as string).replace(/\/$/, '')
const seoTitle = computed(() => member.value!.name + ', ' + member.value!.role + ' | Our Village')
const seoDescription = computed(() =>
  member.value!.name + ' is a ' + member.value!.role + ' at Our Village in Pretoria. ' + member.value!.tagline
)
const personSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: member.value!.name,
  jobTitle: member.value!.role,
  description: member.value!.bio,
  image: member.value!.photo ? siteUrl + member.value!.photo : siteUrl + '/logo.png',
  url: siteUrl + '/team/' + member.value!.slug,
  worksFor: { '@id': siteUrl + '/#business' }
}))

usePageSeo({
  title: seoTitle,
  description: seoDescription,
  image: computed(() => member.value!.photo || '/logo.png'),
  type: 'profile',
  schema: personSchema
})

const related = computed(() =>
  team.filter((m) => m.category === member.value!.category && m.slug !== member.value!.slug).slice(0, 4)
)

const initials = computed(() =>
  member.value!.name.replace(/^(Dr\.?|Sr)\s+/i, '').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
)
</script>

<template>
  <div v-if="member">
    <section class="bg-base-200">
      <div class="container-px py-6">
        <NuxtLink to="/our-team" class="text-sm font-semibold text-secondary/70 hover:text-primary">← Back to the team</NuxtLink>
      </div>
      <div class="container-px grid items-center gap-10 pb-16 lg:grid-cols-[2fr_3fr]">
        <div class="overflow-hidden rounded-[2rem] border-8 border-base-100 shadow-xl">
          <img v-if="member.photo" :src="member.photo" :alt="member.name" class="aspect-[4/5] w-full object-cover object-top" />
          <div v-else class="grid aspect-[4/5] w-full place-items-center bg-primary/15">
            <span class="font-display text-7xl font-bold text-primary/60">{{ initials }}</span>
          </div>
        </div>
        <div>
          <span v-if="member.owner" class="mb-3 inline-block rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-content">Co-Owner</span>
          <h1 class="font-display text-4xl font-bold text-secondary sm:text-5xl">{{ member.name }}</h1>
          <p class="mt-2 text-lg font-semibold text-primary">{{ member.role }}</p>
          <p class="mt-6 text-lg leading-relaxed text-base-content/80">{{ member.bio }}</p>
          <div class="mt-8 flex flex-wrap gap-3">
            <WhatsAppButton v-if="member.bookable" size="lg" :context="member.bookable" />
            <NuxtLink to="/contact-us" class="btn btn-lg rounded-full border-secondary/30 bg-base-100 font-semibold normal-case text-secondary">Contact the practice</NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <section v-if="related.length" class="section-y">
      <div class="container-px">
        <h2 class="mb-8 font-display text-2xl font-bold text-secondary">More from {{ member.category }}</h2>
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <TeamCard v-for="m in related" :key="m.slug" :member="m" />
        </div>
      </div>
    </section>
  </div>
</template>
