const g = globalThis as unknown as { __rl?: Map<string, number[]> }
const buckets = (g.__rl ??= new Map<string, number[]>())

/** In-memory sliding-window limiter. Returns false when the caller is over the limit. */
export function allow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
  if (hits.length >= max) {
    buckets.set(key, hits)
    return false
  }
  hits.push(now)
  buckets.set(key, hits)
  if (buckets.size > 20_000) {
    for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k)
  }
  return true
}

/** Behind nginx/Cloudflare make sure the proxy sets X-Forwarded-For and strips client-supplied values. */
export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
}
