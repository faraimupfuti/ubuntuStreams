import { z } from "zod"
import { grantSubscription } from "@/lib/billing"
import { safeEqual } from "@/lib/server/crypto"
import { config } from "@/lib/server/env"
import { json } from "@/lib/server/http"
import { allow, clientIp } from "@/lib/server/ratelimit"
import { getUserByEmail } from "@/lib/server/store"

export const runtime = "nodejs"

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  planId: z.string().default("standard"),
  days: z.number().int().min(1).max(3650).optional(),
})

// Manual activation until a payment provider is connected, e.g.:
//   curl -X POST https://yoursite/api/admin/grant -H "x-admin-secret: $ADMIN_SECRET" \
//        -H "content-type: application/json" -d '{"email":"user@example.com","planId":"standard","days":30}'
export async function POST(req: Request) {
  if (!allow(`admin:${clientIp(req)}`, 20, 15 * 60_000)) return json({ error: "Too many attempts." }, 429)
  const secret = config.adminSecret
  if (secret.length < 16 || !safeEqual(req.headers.get("x-admin-secret") || "", secret)) {
    return json({ error: "Forbidden" }, 403)
  }
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ error: "Invalid request." }, 400)
  const user = await getUserByEmail(parsed.data.email)
  if (!user) return json({ error: "No such user." }, 404)
  try {
    const u = await grantSubscription(user.id, parsed.data.planId, parsed.data.days)
    return json({ ok: true, subscription: u?.subscription })
  } catch (e: any) {
    return json({ error: e?.message || "Failed" }, 400)
  }
}
