import { z } from "zod"
import { getBillingProvider, grantSubscription } from "@/lib/billing"
import { getPlan } from "@/lib/plans"
import { getAuth } from "@/lib/server/auth"
import { config } from "@/lib/server/env"
import { json } from "@/lib/server/http"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const auth = await getAuth()
  if (!auth) return json({ error: "Please log in." }, 401)
  const parsed = z.object({ planId: z.string() }).safeParse(await req.json().catch(() => null))
  const plan = parsed.success ? getPlan(parsed.data.planId) : undefined
  if (!plan) return json({ error: "Unknown plan." }, 400)

  const provider = getBillingProvider()
  if (provider) return json(await provider.createCheckout(auth.user, plan.id))

  // Local testing only (never in production): ALLOW_DEMO_ACTIVATION=true grants 7 days for free.
  if (config.demoActivation) {
    await grantSubscription(auth.user.id, plan.id, 7)
    return json({ ok: true, demo: true })
  }
  return json({ error: "Online payments are not enabled yet. Please contact us to activate your subscription." }, 501)
}
