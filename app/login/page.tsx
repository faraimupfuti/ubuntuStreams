import { redirect } from "next/navigation"
import { AuthForm } from "@/components/iptv/auth-form"
import { Logo } from "@/components/iptv/site-header"
import { getAuth } from "@/lib/server/auth"

export default async function Page() {
  if (await getAuth()) redirect("/account")
  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col justify-between bg-[#0f1a3a] p-8 text-white max-lg:hidden">
        <div className="[&_span]:text-white"><Logo /></div>
        <p className="font-display max-w-sm text-4xl font-extrabold leading-tight">The world&rsquo;s TV channels, in one tab.</p>
        <div className="bars h-3 w-full rounded-full" aria-hidden />
      </div>
      <div className="flex flex-col items-center justify-center gap-8 p-6">
        <div className="lg:hidden"><Logo /></div>
        <AuthForm mode="login" />
      </div>
    </main>
  )
}
