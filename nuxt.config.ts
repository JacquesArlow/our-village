import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss() as any]
  },
  nitro: {
    preset: 'node-server'
  },
  runtimeConfig: {
    public: {
      // Filled by NUXT_PUBLIC_WHATSAPP_NUMBER env var; the placeholder
      // below is the temporary number — swap when Jacques sends the real one.
      whatsappNumber: '27798279327',
      whatsappDefaultText: "Hi Our Village, I'd like to book an appointment.",
      siteUrl: 'https://our-wellness.arlow.co.za',
      // Cloudflare Turnstile site key (PUBLIC — safe to ship). Overridable via
      // NUXT_PUBLIC_TURNSTILE_SITE_KEY. The SECRET key is server-only (env).
      turnstileSiteKey: '0x4AAAAAADtYo8RIuX2zPY2f'
    }
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en', 'data-theme': 'ourvillage' },
      title: 'Our Village — Care That Grows With You',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Our Village is a multidisciplinary family wellness practice in Garsfontein, Pretoria — medical care, therapy, baby clinics, antenatal classes and more, all under one roof.'
        },
        { property: 'og:title', content: 'Our Village — Care That Grows With You' },
        { property: 'og:type', content: 'website' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&family=Source+Sans+3:wght@400;500;600;700&family=Pinyon+Script&display=swap'
        }
      ]
    }
  }
})
