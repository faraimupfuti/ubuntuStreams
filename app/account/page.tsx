import Link from "next/link"
import { redirect } from "next/navigation"
import { LogoutButton, PlanPicker } from "@/components/iptv/account-actions"
import { Button } from "@/components/ui/button"
import { PLANS, getPlan } from "@/lib/plans"
import { getAuth, isActive } from "@/lib/server/auth"
import { SiteHeader } from "@/components/iptv/site-header"

export default async function AccountPage() {
  const auth = await getAuth()
  if (!auth) redirect("/login")
  const { user } = auth
  const active = isActive(user)
  const plan = getPlan(user.subscription?.plan)

  return (
    <div className="min-h-[100dvh]">
    <SiteHeader><LogoutButton /></SiteHeader>
    <main className="container max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Your account</h1>
      <p className="mt-1 text-muted-foreground">{user.email}</p>

      <section className="mt-8 rounded-2xl border border-border bg-card p-7">
        <h2 className="font-display text-xl font-bold">Subscription</h2>
        {active ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{plan?.name ?? "Active"}</span> plan, active until{" "}
              {new Date(user.subscription!.expiresAt).toLocaleDateString(undefined, { dateStyle: "long" })}.
              {plan && ` Up to ${plan.devices} device${plan.devices > 1 ? "s" : ""} at a time.`}
            </p>
            <Button asChild className="mt-4 rounded-full">
              <Link href="/watch">Watch live TV</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="mt-2 mb-6 text-sm text-muted-foreground">
              {user.subscription ? "Your subscription has expired." : "You don't have an active subscription yet."} Choose a plan to start watching.
            </p>
            <PlanPicker plans={PLANS} />
          </>
        )}
      </section>
    </main>
    </div>
  )
}
