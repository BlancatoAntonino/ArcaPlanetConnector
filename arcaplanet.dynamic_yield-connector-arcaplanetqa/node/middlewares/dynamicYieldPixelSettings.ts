const DYID_COOKIE_NAME = '_dyid'
const DYID_SERVER_COOKIE_NAME = '_dyid_server'
const COOKIEBOT_COOKIE_NAME = 'CookieConsent'
const ONE_YEAR_MS = 31556951 * 1000

function decodeCookieValue(cookieValue: string) {
  try {
    return decodeURIComponent(cookieValue)
  } catch {
    return cookieValue
  }
}

function getCookiebotMarketingConsent(cookieConsent?: string) {
  if (!cookieConsent) {
    return undefined
  }

  const decodedCookieConsent = decodeCookieValue(cookieConsent)

  if (
    /(?:^|[,{])\s*['"]?marketing['"]?\s*:\s*true/i.test(decodedCookieConsent)
  ) {
    return true
  }

  if (
    /(?:^|[,{])\s*['"]?marketing['"]?\s*:\s*false/i.test(decodedCookieConsent)
  ) {
    return false
  }

  return undefined
}

function getDynamicYieldCookieDomain(host?: string) {
  const hostname = host?.split(':')[0]?.toLowerCase() ?? ''
  const arcaplanetDomain = hostname.match(/(?:^|\.)arcaplanet\.(it|com)$/)

  if (arcaplanetDomain) {
    return `.arcaplanet.${arcaplanetDomain[1]}`
  }

  return undefined
}

function syncDyidServerCookie(ctx: Context) {
  const cookieDomain = getDynamicYieldCookieDomain(ctx.get('host'))
  const cookieOptions = {
    ...(cookieDomain ? { domain: cookieDomain } : {}),
    httpOnly: false,
    overwrite: true,
    path: '/',
    secure: true,
    sameSite: 'none' as const,
  }
  const consentAccepted = getCookiebotMarketingConsent(
    ctx.cookies.get(COOKIEBOT_COOKIE_NAME)
  )
  const dyid = ctx.cookies.get(DYID_COOKIE_NAME)

  if (consentAccepted === true && dyid) {
    ctx.cookies.set(DYID_SERVER_COOKIE_NAME, dyid, {
      ...cookieOptions,
      expires: new Date(Date.now() + ONE_YEAR_MS),
    })

    return
  }

  if (consentAccepted === false) {
    ctx.cookies.set(DYID_SERVER_COOKIE_NAME, '', {
      ...cookieOptions,
      expires: new Date(0),
    })
  }
}

export async function dynamicYieldPixelSettings(
  ctx: Context,
  next: () => Promise<any>
) {
  const dynamicYieldSectionId =
    ctx.state.adminSettings?.dynamicYield?.dynamicYieldSectionId?.trim() ?? ''

  syncDyidServerCookie(ctx)

  ctx.status = 200
  ctx.body = {
    dynamicYieldSectionId,
  }

  await next()
}
