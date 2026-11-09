import { channelIdFor } from "./crypto"

export type Channel = {
  id: string
  name: string
  url: string
  logo?: string
  group?: string
  country?: string
  referrer?: string
  userAgent?: string
}

/** Parse an extended M3U playlist (as published by iptv-org) into channels. */
export function parseChannels(text: string): Channel[] {
  const out: Channel[] = []
  const seen = new Set<string>()
  let cur: Partial<Channel> | null = null

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith("#EXTINF:")) {
      const attrs: Record<string, string> = {}
      for (const m of line.matchAll(/([\w-]+)="([^"]*)"/g)) attrs[m[1].toLowerCase()] = m[2]
      const name = line.slice(line.lastIndexOf(",") + 1).trim() || attrs["tvg-name"] || "Unnamed"
      const group = (attrs["group-title"] || "").split(";")[0].trim()
      const cm = /\.([a-z]{2})(?:@|$)/i.exec(attrs["tvg-id"] || "")
      cur = {
        name,
        logo: attrs["tvg-logo"] || undefined,
        group: group && group.toLowerCase() !== "undefined" ? group : undefined,
        country: cm ? cm[1].toLowerCase() : undefined,
      }
    } else if (line.startsWith("#EXTVLCOPT:") && cur) {
      const eq = line.indexOf("=")
      const key = line.slice("#EXTVLCOPT:".length, eq).toLowerCase()
      const val = line.slice(eq + 1).trim()
      if (key === "http-referrer" || key === "http-referer") cur.referrer = val
      if (key === "http-user-agent") cur.userAgent = val
    } else if (!line.startsWith("#") && cur) {
      if (/^https?:\/\//i.test(line)) {
        const id = channelIdFor(line)
        if (!seen.has(id)) {
          seen.add(id)
          out.push({ ...(cur as Channel), id, url: line })
        }
      }
      cur = null
    }
  }
  return out
}

/** Things hls.js cannot play - keep them out of the catalog. */
export const isPlayable = (url: string) => !/\.mpd(\?|$)/i.test(url) && !/(youtube\.com|youtu\.be)\//i.test(url)

export type RewriteKind = "playlist" | "segment"

function resolve(u: string, base: string): string | null {
  try {
    const abs = new URL(u, base)
    return abs.protocol === "http:" || abs.protocol === "https:" ? abs.href : null
  } catch {
    return null
  }
}

const PLAYLIST_TAGS = new Set(["#EXT-X-MEDIA", "#EXT-X-I-FRAME-STREAM-INF", "#EXT-X-RENDITION-REPORT"])

/**
 * Rewrite every URL in an HLS playlist through `rewrite`, so the player never sees an upstream address.
 * Handles bare URL lines and URI="..." attributes (keys, init segments, alternate renditions, ...).
 */
export function rewritePlaylist(text: string, base: string, rewrite: (abs: string, kind: RewriteKind) => string): string {
  const out: string[] = []
  let nextIsVariant = false
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) {
      out.push("")
      continue
    }
    if (line.startsWith("#")) {
      if (line.startsWith("#EXT-X-STREAM-INF")) nextIsVariant = true
      if (line.includes('URI="')) {
        const tag = line.slice(0, line.indexOf(":") === -1 ? line.length : line.indexOf(":"))
        const kind: RewriteKind = PLAYLIST_TAGS.has(tag) ? "playlist" : "segment"
        out.push(
          line.replace(/URI="([^"]*)"/g, (m, u: string) => {
            const abs = resolve(u, base)
            return abs ? `URI="${rewrite(abs, kind)}"` : m
          }),
        )
      } else out.push(line)
      continue
    }
    const abs = resolve(line, base)
    if (abs) out.push(rewrite(abs, nextIsVariant ? "playlist" : "segment"))
    nextIsVariant = false
  }
  return out.join("\n")
}
