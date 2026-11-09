import { z } from "zod"
import { hashPassword, startSession, verifyPassword } from "@/lib/server/auth"
import { json } from "@/lib/server/http"
import { allow, clientIp } from "@/lib/server/ratelimit"
import { getUserByEmail } from "@/lib/server/store"

export const runtime = "nodejs"

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(1).max(200) })
let dummyHash: Promise<string> | null = null

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ error: "Invalid email or password." }, 400)
  const { email, password } = parsed.data
  if (!allow(`login:${clientIp(req)}:${email}`, 8, 15 * 60_000) || !allow(`login-ip:${clientIp(req)}`, 40, 15 * 60_000)) {
    return json({ error: "Too many attempts. Try again in a few minutes." }, 429)
  }
  const user = await getUserByEmail(email)
  // Always do one hash comparison so response time doesn't reveal whether the email exists.
  const ok = await verifyPassword(password, user?.passwordHash ?? (await (dummyHash ??= hashPassword("dummy-password"))))
  if (!user || !ok) return json({ error: "Invalid email or password." }, 401)
  await startSession(user.id)
  return json({ ok: true })
}
