import { getCatalog } from "@/lib/server/catalog"
import { gate } from "@/lib/server/gate"
import { json } from "@/lib/server/http"
import { proxyUpstream } from "@/lib/server/proxy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Entry point for a channel. The browser only ever knows the opaque channel id - never the real URL.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await gate({ claim: true })
  if (!g.ok) return g.res
  const { id } = await params
  const cat = await getCatalog().catch(() => null)
  if (!cat) return json({ error: "Channel list is temporarily unavailable." }, 503)
  const ch = cat.byId.get(id)
  if (!ch) return json({ error: "Unknown channel." }, 404)
  return proxyUpstream({ url: ch.url, referer: ch.referrer, userAgent: ch.userAgent }, g.auth, req)
}
