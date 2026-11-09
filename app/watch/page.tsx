import Link from "next/link"
import { redirect } from "next/navigation"
import { SiteHeader } from "@/components/iptv/site-header"
import { Player } from "@/components/iptv/player"
import { getAuth, isActive } from "@/lib/server/auth"

export const dynamic = "force-dynamic"

export default async function WatchPage() {
  const auth = await getAuth()
  if (!auth) redirect("/login")
  if (!isActive(auth.user)) redirect("/account")
  return (
    <div className="theater min-h-[100dvh] bg-background text-foreground">
      <div className="bars h-1.5 w-full" aria-hidden />
      <SiteHeader><Link href="/account" className="text-muted-foreground hover:text-foreground">Account</Link></SiteHeader>
      <main className="container py-6"><Player /></main>
    </div>
  )
}
