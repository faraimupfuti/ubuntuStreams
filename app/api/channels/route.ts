import { getCatalog, searchChannels } from "@/lib/server/catalog"
import { gate } from "@/lib/server/gate"
import { json } from "@/lib/server/http"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const g = await gate()
  if (!g.ok) return g.res
  const sp = new URL(req.url).searchParams
  const cat = await getCatalog().catch(() => null)
  if (!cat) return json({ error: "Channel list is temporarily unavailable." }, 503)
  const offset = Math.max(0, parseInt(sp.get("offset") || "0", 10) || 0)
  const limit = Math.min(200, Math.max(1, parseInt(sp.get("limit") || "60", 10) || 60))
  const { total, items } = searchChannels(cat, {
    q: sp.get("q") || undefined,
    group: sp.get("group") || undefined,
    country: sp.get("country") || undefined,
    offset,
    limit,
  })
  return json({ total, items, groups: cat.groups, countries: cat.countries })
}
