export interface SiteConfig {
  name: string
  tagline: string
  phone: string
  phoneHref: string
  whatsapp: string
  email: string
  address: string
  mapsUrl: string
  socials: { facebook: string; instagram: string; youtube: string }
}

const DEFAULT_SITE: SiteConfig = {
  name: 'Our Village',
  tagline: 'Care That Grows With You',
  phone: '+27 65 844 9885',
  phoneHref: 'tel:+276****9885',
  whatsapp: '27798279327',
  email: 'reception@our-village.co.za',
  address: '525 Alsation Drive, Garsfontein, Pretoria',
  mapsUrl: 'https://maps.google.com/?q=525+Alsation+Drive+Garsfontein+Pretoria',
  socials: {
    facebook: 'https://www.facebook.com/profile.php?id=61555393723146',
    instagram: 'https://www.instagram.com/our_village_pretoria/',
    youtube: 'https://www.youtube.com/@BCFTheVillage'
  }
}

export const useSite = (): SiteConfig => {
  const cfg = useRuntimeConfig().public
  return {
    ...DEFAULT_SITE,
    whatsapp: (cfg.whatsappNumber as string) || DEFAULT_SITE.whatsapp
  }
}

/**
 * Build a WhatsApp click-to-chat link with a pre-filled, context-aware message.
 * Replaces the old WooCommerce booking flow.
 */
export const useBooking = () => {
  const { whatsapp } = useSite()
  const cfg = useRuntimeConfig().public
  const bookingLink = (context?: string) => {
    const message = context
      ? `Hi Our Village, I'd like to book an appointment for ${context}.`
      : (cfg.whatsappDefaultText as string) ||
        `Hi Our Village, I'd like to book an appointment.`
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`
  }
  return { bookingLink }
}
