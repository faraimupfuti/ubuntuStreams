import Link from "next/link"
import { SITE_NAME } from "@/lib/site"

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="relative flex size-8 items-center justify-center rounded-lg bg-[#0f1a3a]">
        <span className="size-3 rounded-full bg-[#e8362d] shadow-[0_0_0_3px_rgba(232,54,45,.3)]" />
      </span>
      <span className="font-display text-xl font-bold">{SITE_NAME}</span>
    </Link>
  )
}

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4 text-sm">{children}</div>
      </div>
    </header>
  )
}
