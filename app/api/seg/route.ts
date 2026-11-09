import { open } from "@/lib/server/crypto"
import { gate } from "@/lib/server/gate"
import { json } from "@/lib/server/http"
import { proxyUpstream, type SegToken } from "@/lib/server/proxy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Serves playlist/segment/key URLs minted by proxyUpstream. A token is encrypted, expires, and only
// works for the same logged-in session that received it - so a copied URL is useless elsewhere.
export async function GET(req: Request) {
  const g = await gate({ claim: true })
  if (!g.ok) return g.res
  const t = new URL(req.url).searchParams.get("t")
  const tok = t ? open<SegToken>(t) : null
  if (!tok || tok.ex < Date.now() || tok.uid !== g.auth.user.id || tok.sid !== g.auth.sid) {
    return json({ error: "Link expired." }, 403)
  }
  return proxyUpstream({ url: tok.u, referer: tok.r, userAgent: tok.a }, g.auth, req)
}
