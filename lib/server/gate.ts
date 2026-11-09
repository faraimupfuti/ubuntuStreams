import { getAuth, isActive, type Auth } from "./auth"
import { claimSlot } from "./concurrency"
import { json } from "./http"

type Gate = { ok: true; auth: Auth } | { ok: false; res: Response }

/** Login + active subscription (+ optional device-limit check) for API routes. */
export async function gate(opts: { claim?: boolean } = {}): Promise<Gate> {
  const auth = await getAuth()
  if (!auth) return { ok: false, res: json({ error: "Please log in." }, 401) }
  if (!isActive(auth.user)) return { ok: false, res: json({ error: "An active subscription is required." }, 402) }
  if (opts.claim && !claimSlot(auth.user, auth.sid)) {
    return { ok: false, res: json({ error: "Too many devices are watching on this account." }, 429) }
  }
  return { ok: true, auth }
}
