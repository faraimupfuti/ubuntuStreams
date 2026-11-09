"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const isLogin = mode === "login"

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        return
      }
      router.push("/account")
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="w-full max-w-sm rounded-2xl border-border bg-card shadow-none">
      <CardContent className="p-6">
        <h1 className="font-display text-3xl font-bold mb-1">{isLogin ? "Welcome back" : "Create your account"}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {isLogin ? "Log in to watch live TV." : "Sign up, then pick a plan to start watching."}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              minLength={isLogin ? 1 : 8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {!isLogin && <p className="text-xs text-muted-foreground">At least 8 characters.</p>}
          </div>
          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full rounded-full" disabled={busy}>
            {busy ? "Please wait..." : isLogin ? "Log in" : "Sign up"}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground mt-6 text-center">
          {isLogin ? "New here? " : "Already have an account? "}
          <Link href={isLogin ? "/signup" : "/login"} className="text-primary hover:underline">
            {isLogin ? "Create an account" : "Log in"}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
