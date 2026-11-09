export default defineNuxtConfig({
  compatibilityDate: "2026-10-01",
  devtools: { enabled: false },
  css: ["~/assets/app.css"],
  nitro: { preset: "node-server" },
  runtimeConfig: { public: { bookingLoginRequired: false } },
  app: {
    head: {
      title: "Our Village Appointments",
      htmlAttrs: { lang: "en-ZA" },
      meta: [
        { name: "robots", content: "noindex, nofollow, noarchive" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
    },
  },
  routeRules: {
    "/**": {
      headers: {
        "x-robots-tag": "noindex, nofollow, noarchive",
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "referrer-policy": "same-origin",
      },
    },
  },
});
