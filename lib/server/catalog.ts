import { config } from "./env"
import { isPlayable, parseChannels, type Channel } from "./m3u"

export type PublicChannel = { id: string; name: string; logo?: string; group?: string; country?: string }
type Catalog = {
  at: number
  byId: Map<string, Channel>
  list: PublicChannel[]
  groups: string[]
  countries: string[]
}

const g = globalThis as unknown as { __catalog?: { cat: Catalog | null; inflight: Promise<Catalog> | null } }
const state = (g.__catalog ??= { cat: null, inflight: null })

async function build(): Promise<Catalog> {
  const res = await fetch(config.playlistUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
    headers: { "user-agent": "Mozilla/5.0 (compatible; StreamCatalog/1.0)" },
  })
  if (!res.ok) throw new Error(`playlist fetch failed: ${res.status}`)
  const channels = parseChannels(await res.text()).filter((c) => isPlayable(c.url))
  const groups = new Set<string>()
  const countries = new Set<string>()
  for (const c of channels) {
    if (c.group) groups.add(c.group)
    if (c.country) countries.add(c.country)
  }
  return {
    at: Date.now(),
    byId: new Map(channels.map((c) => [c.id, c])),
    // Deliberately omits `url`, `referrer` and `userAgent`: upstream addresses never leave the server.
    list: channels.map(({ id, name, logo, group, country }) => ({ id, name, logo, group, country })),
    groups: [...groups].sort(),
    countries: [...countries].sort(),
  }
}

export async function getCatalog(): Promise<Catalog> {
  if (state.cat && Date.now() - state.cat.at < config.catalogTtlMs) return state.cat
  if (!state.inflight) {
    state.inflight = build()
      .then((c) => (state.cat = c))
      .finally(() => {
        state.inflight = null
      })
  }
  try {
    return await state.inflight
  } catch (e) {
    if (state.cat) return state.cat // serve stale data if the refresh fails
    throw e
  }
}

export function searchChannels(
  cat: Catalog,
  o: { q?: string; group?: string; country?: string; offset: number; limit: number },
) {
  const q = o.q?.trim().toLowerCase()
  const matches = cat.list.filter(
    (c) =>
      (!q || c.name.toLowerCase().includes(q)) &&
      (!o.group || c.group === o.group) &&
      (!o.country || c.country === o.country),
  )
  return { total: matches.length, items: matches.slice(o.offset, o.offset + o.limit) }
}
