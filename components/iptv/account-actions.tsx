"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { Plan } from "@/lib/plans"

export function LogoutButton() {
  const router = useRouter()
  return (
    <Button
      variant="outline"
      className="rounded-full"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" })
        router.push("/")
        router.refresh()
      }}
    >
      Log out
    </Button>
  )
}

export function PlanPicker({ plans }: { plans: Plan[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState("")
  const [msg, setMsg] = useState("")

  async function choose(planId: string) {
    setBusy(planId)
    setMsg("")
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.url) {
        window.location.href = data.url // payment provider's hosted checkout
        return
      }
      if (res.ok) {
        router.refresh()
        return
      }
      setMsg(data.error || "Could not start checkout.")
    } finally {
      setBusy("")
    }
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className={`rounded-2xl border bg-background p-5 ${p.popular ? "border-primary" : "border-border"}`}>
            <div className="font-bold">{p.name}</div>
            <div className="text-2xl font-bold mt-1">
              {p.price}
              <span className="text-sm font-normal text-muted-foreground">{p.period}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">{p.devices} device{p.devices > 1 ? "s" : ""} at a time</div>
            <Button className="w-full rounded-full mt-4" variant={p.popular ? "default" : "outline"} disabled={!!busy} onClick={() => choose(p.id)}>
              {busy === p.id ? "Please wait..." : "Subscribe"}
            </Button>
          </div>
        ))}
      </div>
      {msg && <p role="alert" className="text-sm text-amber-600 dark:text-amber-400 mt-4">{msg}</p>}
    </div>
  )
}
