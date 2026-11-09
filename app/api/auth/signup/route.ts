import { z } from "zod"
import { hashPassword, startSession } from "@/lib/server/auth"
import { json } from "@/lib/server/http"
import { allow, clientIp } from "@/lib/server/ratelimit"
import { createUser } from "@/lib/server/store"

export const runtime = "nodejs"

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(200),
})

export async function POST(req: Request) {
  if (!allow(`signup:${clientIp(req)}`, 10, 3_600_000)) return json({ error: "Too many attempts. Try again later." }, 429)
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ error: "Enter a valid email and a password of at least 8 characters." }, 400)
  const user = await createUser(parsed.data.email, await hashPassword(parsed.data.password))
  if (!user) return json({ error: "An account with this email already exists." }, 409)
  await startSession(user.id)
  return json({ ok: true })
}
