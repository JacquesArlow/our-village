<script setup lang="ts">
const site = useSite()
usePageSeo({
  title: 'Contact Our Village | Family Wellness Pretoria',
  description: 'Contact Our Village in Garsfontein, Pretoria to book family medical care, therapy, baby clinic services or antenatal classes.'
})

const cards = computed(() => [
  { label: 'Office Address', value: site.address, href: site.mapsUrl, icon: '📍' },
  { label: 'Phone Number', value: site.phone, href: site.phoneHref, icon: '☎' },
  { label: 'Office Email', value: site.email, href: `mailto:${site.email}`, icon: '✉' }
])
</script>

<template>
  <div>
    <section class="bg-base-200">
      <div class="container-px py-16 text-center sm:py-20">
        <p class="eyebrow mb-3">Contact Us</p>
        <h1 class="font-display text-4xl font-bold text-secondary sm:text-5xl">Get in touch with us</h1>
        <p class="mx-auto mt-4 max-w-2xl text-lg text-base-content/70">
          Whether you’re booking your first appointment, have questions about our services, or simply want to connect —
          we’re ready to help.
        </p>
      </div>
    </section>

    <section class="section-y">
      <div class="container-px">
        <div class="grid gap-6 sm:grid-cols-3">
          <a
            v-for="c in cards"
            :key="c.label"
            :href="c.href"
            :target="c.label === 'Office Address' ? '_blank' : undefined"
            rel="noopener"
            class="rounded-3xl border border-base-200 bg-base-100 p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div class="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-2xl">{{ c.icon }}</div>
            <h2 class="font-display text-lg font-bold text-secondary">{{ c.label }}</h2>
            <p class="mt-2 text-base-content/70">{{ c.value }}</p>
          </a>
        </div>

        <div class="mx-auto mt-14 max-w-3xl rounded-3xl bg-base-200 p-7 sm:p-10">
          <h2 class="mb-6 text-center font-display text-2xl font-bold text-secondary">Send us a message</h2>
          <ContactForm />
        </div>
      </div>
    </section>
  </div>
</template>
