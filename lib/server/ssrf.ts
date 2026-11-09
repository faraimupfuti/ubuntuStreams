import { lookup } from "node:dns/promises"
import net from "node:net"

function privateV4(ip: string): boolean {
  const [a, b, c] = ip.split(".").map(Number)
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 198 && (b === 18 || b === 19))
  )
}

function privateV6(ip: string): boolean {
  const l = ip.toLowerCase()
  if (l === "::" || l === "::1") return true
  const dotted = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(l)
  if (dotted) return privateV4(dotted[1])
  const hex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(l)
  if (hex) {
    const hi = parseInt(hex[1], 16)
    const lo = parseInt(hex[2], 16)
    return privateV4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`)
  }
  const first = parseInt(l.split(":")[0] || "0", 16)
  return (first & 0xfe00) === 0xfc00 || (first & 0xffc0) === 0xfe80 || (first & 0xff00) === 0xff00 || l.startsWith("64:ff9b:")
}

export const isPrivateIp = (ip: string) => (net.isIPv4(ip) ? privateV4(ip) : net.isIPv6(ip) ? privateV6(ip) : true)

/** Refuse anything that is not a plain http(s) URL pointing at a public internet address. */
export async function assertPublicUrl(u: URL): Promise<void> {
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("blocked protocol")
  const host = u.hostname.replace(/^\[|\]$/g, "")
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("blocked address")
    return
  }
  const addrs = await lookup(host, { all: true, verbatim: true })
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error("blocked address")
}

/**
 * fetch() that validates every hop (including redirects) against assertPublicUrl, so a hostile
 * playlist cannot make your server request internal services (cloud metadata, localhost, LAN).
 * Note: DNS is resolved again by the HTTP client when connecting; for stricter guarantees run the
 * app in a network namespace/firewall that blocks private ranges.
 */
export async function safeFetch(
  url: string,
  headers: Record<string, string>,
  signal?: AbortSignal,
  timeoutMs = 15_000,
  maxHops = 5,
): Promise<{ res: Response; finalUrl: string }> {
  let current = new URL(url)
  for (let hop = 0; hop <= maxHops; hop++) {
    await assertPublicUrl(current)
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    const onAbort = () => ctrl.abort()
    if (signal?.aborted) ctrl.abort()
    signal?.addEventListener("abort", onAbort, { once: true })
    let res: Response
    try {
      res = await fetch(current, { headers, redirect: "manual", signal: ctrl.signal, cache: "no-store" })
    } catch (e) {
      signal?.removeEventListener("abort", onAbort)
      throw e
    } finally {
      clearTimeout(timer) // timeout covers connecting + headers only; the body may stream for a long time
    }
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      signal?.removeEventListener("abort", onAbort)
      const loc = res.headers.get("location")
      await res.body?.cancel().catch(() => {})
      if (!loc) throw new Error("bad redirect")
      current = new URL(loc, current)
      continue
    }
    return { res, finalUrl: current.href }
  }
  throw new Error("too many redirects")
}
