export default defineNuxtRouteMiddleware(async () => {
  try {
    await useRequestFetch()('/api/admin/desk-access')
  } catch (error: any) {
    if ([401, 403].includes(error.statusCode || error.status))
      return navigateTo('/village-desk/', { external: true, replace: true })
    throw createError({ statusCode: 503, statusMessage: 'Village Desk sign-in is temporarily unavailable' })
  }
})
