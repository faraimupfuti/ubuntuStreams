import { getBillingProvider } from "@/lib/billing"
import { json } from "@/lib/server/http"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const provider = getBillingProvider()
  if (!provider) return json({ error: "Not configured." }, 501)
  return provider.handleWebhook(req)
}
