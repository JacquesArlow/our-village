/**
 * Verify a Cloudflare Turnstile token server-side. The widget runs in "managed"
 * mode (Cloudflare decides whether to challenge), so most visitors never see a
 * checkbox — but every submission token is still verified here before we accept
 * the booking. Fails closed: no secret or no token => rejected.
 */
export async function verifyTurnstile(token: string | undefined | null, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    console.warn('[turnstile] TURNSTILE_SECRET_KEY not set — rejecting submission')
    return false
  }
  if (!token) return false
  try {
    const body = new URLSearchParams({ secret, response: token })
    if (ip) body.set('remoteip', ip)
    const res = await $fetch<{ success: boolean; 'error-codes'?: string[] }>(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'POST', body }
    )
    if (!res?.success) console.warn('[turnstile] verification failed', res?.['error-codes'])
    return !!res?.success
  } catch (e) {
    console.error('[turnstile] verify request error', e)
    return false
  }
}
