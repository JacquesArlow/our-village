import { team } from '~~/data/team'
import { listEvents } from '~~/server/utils/calendarRepo'

const staticRoutes = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/our-services', changefreq: 'monthly', priority: '0.9' },
  { path: '/our-team', changefreq: 'monthly', priority: '0.9' },
  { path: '/antenatal-classes', changefreq: 'monthly', priority: '0.9' },
  { path: '/antenatal-classes/inperson-antenatal', changefreq: 'monthly', priority: '0.8' },
  { path: '/antenatal-classes/online-antenatal-classes', changefreq: 'monthly', priority: '0.8' },
  { path: '/calendar', changefreq: 'daily', priority: '0.8' },
  { path: '/calendar/events', changefreq: 'daily', priority: '0.8' },
  { path: '/contact-us', changefreq: 'monthly', priority: '0.7' }
]

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, char => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;'
  })[char]!)

export default defineEventHandler(async (event) => {
  const siteUrl = (useRuntimeConfig(event).public.siteUrl as string).replace(/\/$/, '')
  let eventRoutes: { path: string; changefreq: string; priority: string }[] = []

  try {
    const publicEvents = await listEvents({ publicOnly: true })
    eventRoutes = publicEvents.map(item => ({
      path: '/calendar/event/' + encodeURIComponent(item.id),
      changefreq: 'weekly',
      priority: '0.6'
    }))
  } catch {
    // Keep the marketing sitemap available during a temporary database outage.
  }

  const routes = [
    ...staticRoutes,
    ...team.map(member => ({
      path: '/team/' + member.slug,
      changefreq: 'monthly',
      priority: '0.7'
    })),
    ...eventRoutes
  ]

  setResponseHeader(event, 'content-type', 'application/xml; charset=UTF-8')
  setResponseHeader(event, 'cache-control', 'public, max-age=3600, stale-while-revalidate=86400')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routes.map(route => [
      '  <url>',
      '    <loc>' + escapeXml(siteUrl + route.path) + '</loc>',
      '    <changefreq>' + route.changefreq + '</changefreq>',
      '    <priority>' + route.priority + '</priority>',
      '  </url>'
    ].join('\n')),
    '</urlset>'
  ].join('\n')
})
