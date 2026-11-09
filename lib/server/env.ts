const DEV_SECRET = "dev-only-insecure-secret-change-me-0123456789abcdef"

export function sessionSecret(): string {
  const s = process.env.SESSION_SECRET
  if (s && s.length >= 32) return s
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set to a random string of 32+ characters in production.")
  }
  return DEV_SECRET
}

const num = (v: string | undefined, d: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : d
}

export const config = {
  get playlistUrl() {
    return process.env.PLAYLIST_URL || "https://iptv-org.github.io/iptv/index.m3u"
  },
  get catalogTtlMs() {
    return num(process.env.CATALOG_TTL_MINUTES, 60) * 60_000
  },
  // Lifetime of a rewritten *segment/key* URL. Live playlists are re-fetched every few seconds,
  // so segment URLs are re-minted constantly and can be short-lived.
  get segmentTtlMs() {
    return num(process.env.SEGMENT_TTL_SECONDS, 1800) * 1000
  },
  // Lifetime of a rewritten *variant playlist* URL (players keep re-fetching the same URL).
  get playlistTtlMs() {
    return num(process.env.PLAYLIST_TTL_HOURS, 12) * 3_600_000
  },
  get cookieSecure() {
    if (process.env.COOKIE_SECURE) return process.env.COOKIE_SECURE === "true"
    return process.env.NODE_ENV === "production"
  },
  get adminSecret() {
    return process.env.ADMIN_SECRET || ""
  },
  get demoActivation() {
    return process.env.ALLOW_DEMO_ACTIVATION === "true" && process.env.NODE_ENV !== "production"
  },
}
