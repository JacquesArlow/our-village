<script setup lang="ts">
const site = useSite()
const siteUrl = (useRuntimeConfig().public.siteUrl as string).replace(/\/$/, '')

useHead({
  script: [{
    key: 'site-structured-data',
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'MedicalBusiness',
          '@id': siteUrl + '/#business',
          name: site.name,
          url: siteUrl,
          logo: siteUrl + '/logo.png',
          image: siteUrl + '/services/baby-family-clinic.webp',
          description: 'A multidisciplinary family wellness practice providing medical care, therapy, baby clinics and antenatal classes in Garsfontein, Pretoria.',
          telephone: site.phone,
          email: site.email,
          address: {
            '@type': 'PostalAddress',
            streetAddress: '525 Alsation Drive',
            addressLocality: 'Garsfontein',
            addressRegion: 'Gauteng',
            addressCountry: 'ZA'
          },
          sameAs: Object.values(site.socials)
        },
        {
          '@type': 'WebSite',
          '@id': siteUrl + '/#website',
          url: siteUrl,
          name: site.name,
          inLanguage: 'en-ZA',
          publisher: { '@id': siteUrl + '/#business' }
        }
      ]
    })
  }]
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
