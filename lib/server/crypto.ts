import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  hkdfSync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto"
import { sessionSecret } from "./env"

const keyCache = new Map<string, Buffer>()
function derive(label: string): Buffer {
  const secret = sessionSecret()
  const ck = `${label}|${secret}`
  let k = keyCache.get(ck)
  if (!k) {
    k = Buffer.from(hkdfSync("sha256", secret, "iptv-app-v1", label, 32))
    keyCache.set(ck, k)
  }
  return k
}

/** Tamper-proof (but readable) token - used for the session cookie. */
export function sign(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const mac = createHmac("sha256", derive("cookie-sign")).update(body).digest("base64url")
  return `${body}.${mac}`
}

export function unsign<T>(token: string | undefined | null): T | null {
  if (!token) return null
  const i = token.indexOf(".")
  if (i < 1) return null
  const body = token.slice(0, i)
  const given = Buffer.from(token.slice(i + 1), "base64url")
  const expected = createHmac("sha256", derive("cookie-sign")).update(body).digest()
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T
  } catch {
    return null
  }
}

/** Encrypted + authenticated token (AES-256-GCM). Contents are unreadable to the client. */
export function seal(payload: object): string {
  const iv = randomBytes(12)
  const c = createCipheriv("aes-256-gcm", derive("stream-seal"), iv)
  const ct = Buffer.concat([c.update(JSON.stringify(payload), "utf8"), c.final()])
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString("base64url")
}

export function open<T>(token: string): T | null {
  try {
    const raw = Buffer.from(token, "base64url")
    if (raw.length < 29) return null
    const d = createDecipheriv("aes-256-gcm", derive("stream-seal"), raw.subarray(0, 12))
    d.setAuthTag(raw.subarray(12, 28))
    const pt = Buffer.concat([d.update(raw.subarray(28)), d.final()])
    return JSON.parse(pt.toString("utf8")) as T
  } catch {
    return null
  }
}

export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest()
  const hb = createHash("sha256").update(b).digest()
  return timingSafeEqual(ha, hb)
}

export const randomId = (bytes = 16) => randomBytes(bytes).toString("base64url")
export const channelIdFor = (url: string) => createHash("sha256").update(url).digest("hex").slice(0, 16)
