import { DEFAULT_DEVICES, getPlan } from "@/lib/plans"
import type { User } from "./store"

// Tracks which sessions (browsers/devices) are actively pulling video for each account, so one
// paid account can't be shared with dozens of people. In-memory: use Redis if you run several servers.
const g = globalThis as unknown as { __slots?: Map<string, Map<string, number>> }
const slots = (g.__slots ??= new Map<string, Map<string, number>>())
const ACTIVE_MS = 60_000

export function deviceLimit(user: User): number {
  return getPlan(user.subscription?.plan)?.devices ?? DEFAULT_DEVICES
}

/** Returns false if this session would exceed the account's simultaneous-device limit. */
export function claimSlot(user: User, sid: string): boolean {
  const now = Date.now()
  let m = slots.get(user.id)
  if (!m) slots.set(user.id, (m = new Map()))
  for (const [s, t] of m) if (now - t > ACTIVE_MS) m.delete(s)
  if (!m.has(sid) && m.size >= deviceLimit(user)) return false
  m.set(sid, now)
  return true
}
