import { getPlan } from "./plans"
import { getUserById, setSubscription, type User } from "./server/store"

/**
 * PAYMENT PROVIDER ADAPTER - intentionally not implemented yet.
 *
 * When you pick a provider (Paynow, Flutterwave, Paddle, PayPal, ...):
 *  1. implement BillingProvider below and return it from getBillingProvider();
 *  2. call grantSubscription() from your webhook once a payment is CONFIRMED by the provider
 *     (always verify the provider's webhook signature first);
 *  3. the checkout route (app/api/billing/checkout) and webhook route (app/api/billing/webhook)
 *     already call into this file.
 */
export interface BillingProvider {
  /** Start a payment for this user/plan and return the URL to send the customer to. */
  createCheckout(user: User, planId: string): Promise<{ url: string }>
  /** Verify + process a provider webhook (must call grantSubscription on confirmed payment). */
  handleWebhook(req: Request): Promise<Response>
}

export function getBillingProvider(): BillingProvider | null {
  return null // TODO: return your provider implementation
}

/** Give a user access for the plan's duration. If they are already active, the time is added on top. */
export async function grantSubscription(userId: string, planId: string, days?: number) {
  const plan = getPlan(planId)
  if (!plan) throw new Error(`Unknown plan: ${planId}`)
  const user = await getUserById(userId)
  if (!user) throw new Error("Unknown user")
  const start = Math.max(Date.now(), user.subscription?.expiresAt ?? 0)
  return setSubscription(userId, { plan: plan.id, expiresAt: start + (days ?? plan.days) * 86_400_000 })
}
