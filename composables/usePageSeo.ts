import type { MaybeRefOrGetter } from 'vue'
import { SITE_SHARE_IMAGE } from '~~/shared/branding'

interface PageSeoOptions {
  title: MaybeRefOrGetter<string>
  description: MaybeRefOrGetter<string>
  path?: MaybeRefOrGetter<string>
  type?: 'website' | 'article' | 'profile'
  noindex?: MaybeRefOrGetter<boolean>
  schema?: MaybeRefOrGetter<Record<string, unknown> | undefined>
}

export const usePageSeo = (options: PageSeoOptions) => {
  const route = useRoute()
  const config = useRuntimeConfig()
  const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')
  const canonicalUrl = computed(() => new URL(toValue(options.path) || route.path, siteUrl + '/').toString())
  const imageUrl = computed(() =>
    new URL(SITE_SHARE_IMAGE.path, siteUrl + '/').toString()
  )
  const robots = computed(() =>
    toValue(options.noindex)
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
  )

  useSeoMeta({
    title: () => toValue(options.title),
    description: () => toValue(options.description),
    robots,
    ogTitle: () => toValue(options.title),
    ogDescription: () => toValue(options.description),
    ogType: options.type || 'website',
    ogUrl: canonicalUrl,
    ogImage: imageUrl,
    ogImageSecureUrl: imageUrl,
    ogImageAlt: SITE_SHARE_IMAGE.alt,
    ogImageWidth: SITE_SHARE_IMAGE.width,
    ogImageHeight: SITE_SHARE_IMAGE.height,
    ogImageType: SITE_SHARE_IMAGE.type,
    ogSiteName: 'Our Village',
    ogLocale: 'en_ZA',
    twitterCard: 'summary_large_image',
    twitterTitle: () => toValue(options.title),
    twitterDescription: () => toValue(options.description),
    twitterImage: imageUrl,
    twitterImageAlt: SITE_SHARE_IMAGE.alt
  })

  useHead(() => ({
    link: [{ key: 'canonical', rel: 'canonical', href: canonicalUrl.value }],
    script: options.schema && toValue(options.schema)
      ? [{
          key: 'page-structured-data',
          type: 'application/ld+json',
          innerHTML: JSON.stringify(toValue(options.schema))
        }]
      : []
  }))
}
