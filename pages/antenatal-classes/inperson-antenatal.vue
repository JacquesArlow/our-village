<script setup lang="ts">
const site = useSite()
usePageSeo({
  title: 'In-Person Antenatal Classes Pretoria | Our Village',
  description: 'Join practical, expert-led antenatal classes for couples in Pretoria and feel informed, confident and supported for birth and early parenthood.',
  image: '/antenatal/hands-on.webp'
})

const reasons = [
  { img: '/antenatal/real-connection.webp', t: 'Real-life connection', d: 'Meet other parents-to-be and build a supportive community.' },
  { img: '/antenatal/expert-led.webp', t: 'Expert-led', d: 'Learn directly from experienced midwives and practitioners.' },
  { img: '/antenatal/hands-on.webp', t: 'Hands-on learning', d: 'Practise the skills you’ll use with your newborn.' },
  { img: '/antenatal/holistic.webp', t: 'Holistic approach', d: 'Pregnancy, labour, delivery, newborn care, breastfeeding and emotional wellbeing.' }
]
</script>

<template>
  <div>
    <section class="bg-base-200">
      <div class="container-px py-16 text-center sm:py-20">
        <p class="eyebrow mb-3">In-Person Antenatal Classes</p>
        <h1 class="font-display text-4xl font-bold text-secondary sm:text-5xl">The power of connection</h1>
        <p class="mx-auto mt-4 max-w-2xl text-lg text-base-content/70">
          Experience learning, real-time support and genuine connection. We run classes throughout the year as
          full-day or evening-over-weeks options — spaces are limited, so book early.
        </p>
      </div>
    </section>

    <section class="section-y">
      <div class="container-px mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
        <div class="rounded-2xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h3 class="text-sm font-bold uppercase tracking-wide text-primary">Who should attend?</h3>
          <p class="mt-2 text-base-content/75">Expecting parents — whether it’s your first baby or you’re looking for a refresher.</p>
        </div>
        <div class="rounded-2xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h3 class="text-sm font-bold uppercase tracking-wide text-primary">Where?</h3>
          <p class="mt-2 text-base-content/75">{{ site.address }}</p>
        </div>
        <div class="rounded-2xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h3 class="text-sm font-bold uppercase tracking-wide text-primary">Cost</h3>
          <p class="mt-2 font-display text-2xl font-bold text-secondary">R1 800 <span class="text-sm font-normal text-base-content/60">once-off per couple</span></p>
        </div>
      </div>
    </section>

    <section class="section-y bg-base-200">
      <div class="container-px">
        <SectionHeading title="Why choose in-person classes?" />
        <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="r in reasons" :key="r.t" class="rounded-3xl bg-base-100 p-7 text-center shadow-sm">
            <img :src="r.img" :alt="r.t" class="mx-auto mb-4 h-20 w-20 object-contain" />
            <h3 class="font-display text-lg font-bold text-secondary">{{ r.t }}</h3>
            <p class="mt-2 text-sm text-base-content/70">{{ r.d }}</p>
          </div>
        </div>
        <div class="mt-12 text-center"><WhatsAppButton size="lg" context="an in-person antenatal class (R1 800 per couple)" label="Book now" /></div>
      </div>
    </section>
  </div>
</template>
