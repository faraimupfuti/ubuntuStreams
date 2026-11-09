import type { Auth } from "./auth"
import { seal } from "./crypto"
import { config } from "./env"
import { json } from "./http"
import { rewritePlaylist } from "./m3u"
import { safeFetch } from "./ssrf"

export type Upstream = { url: string; referer?: string; userAgent?: string }
export type SegToken = { u: string; r?: string; a?: string; uid: string; sid: string; ex: number }

const DEFAULT_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
const MAX_PLAYLIST_BYTES = 2_000_000
const PLAYLIST_TYPE = "application/vnd.apple.mpegurl"

/**
 * Fetch an upstream stream resource on behalf of a logged-in subscriber.
 * - HLS playlists are rewritten so every URL becomes /api/seg?t=<encrypted, session-bound token>.
 * - Anything else (segments, keys, raw TS) is streamed straight through.
 */
export async function proxyUpstream(up: Upstream, auth: Auth, req: Request): Promise<Response> {
  const headers: Record<string, string> = { "user-agent": up.userAgent || DEFAULT_UA, accept: "*/*" }
  if (up.referer) headers.referer = up.referer

  let fetched
  try {
    fetched = await safeFetch(up.url, headers, req.signal)
  } catch {
    return json({ error: "Channel unavailable" }, 502)
  }
  const { res, finalUrl } = fetched
  if (!res.ok || !res.body) {
    await res.body?.cancel().catch(() => {})
    return json({ error: "Channel unavailable" }, 502)
  }

  const reader = res.body.getReader()
  const first = await reader.read()
  const head = first.value ? new TextDecoder().decode(first.value.subarray(0, 7)) : ""

  if (head === "#EXTM3U") {
    // It's an HLS playlist: read it fully (bounded), then rewrite.
    const chunks: Uint8Array[] = first.value ? [first.value] : []
    let size = first.value?.length ?? 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > MAX_PLAYLIST_BYTES) {
        await reader.cancel().catch(() => {})
        return json({ error: "Channel unavailable" }, 502)
      }
      chunks.push(value)
    }
    const text = new TextDecoder().decode(Buffer.concat(chunks))
    const now = Date.now()
    const body = rewritePlaylist(text, finalUrl, (abs, kind) => {
      const token: SegToken = {
        u: abs,
        r: up.referer,
        a: up.userAgent,
        uid: auth.user.id,
        sid: auth.sid,
        ex: now + (kind === "playlist" ? config.playlistTtlMs : config.segmentTtlMs),
      }
      return `/api/seg?t=${seal(token)}`
    })
    return new Response(body, {
      headers: { "content-type": PLAYLIST_TYPE, "cache-control": "no-store", "x-content-type-options": "nosniff" },
    })
  }

  // Not a playlist: stream it through untouched (we already consumed the first chunk).
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      if (first.value) c.enqueue(first.value)
      if (first.done) c.close()
    },
    async pull(c) {
      try {
        const { done, value } = await reader.read()
        if (done) c.close()
        else c.enqueue(value)
      } catch (e) {
        c.error(e)
      }
    },
    cancel(reason) {
      return reader.cancel(reason)
    },
  })
  return new Response(stream, {
    headers: {
      "content-type": res.headers.get("content-type") || "application/octet-stream",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  })
}
