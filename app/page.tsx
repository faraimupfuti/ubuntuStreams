import { Check } from "lucide-react"
import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/iptv/site-header"
import { TvHero } from "@/components/iptv/tv-hero"
import { PLANS } from "@/lib/plans"
import { SITE_NAME } from "@/lib/site"

const steps = [
  { t: "Create your account", d: "Email and a password. It takes under a minute." },
  { t: "Choose a plan", d: "Pick how many devices should be able to watch at once." },
  { t: "Press play", d: "Search or browse by country and category, then click a channel." },
]

const points = [
  ["Channels from many countries", "News, sport, movies, kids and music, searchable by name, country and category."],
  ["Nothing to install", "Works in the browser on your phone, tablet, laptop or smart TV."],
  ["Private by design", "Your streams are tied to your own login, so links can't be copied and passed around."],
  ["The list keeps itself current", "New channels appear automatically; you never update anything."],
]

const faqs = [
  ["Do I need an app or a box?", "No. Log in and watch from any modern web browser."],
  ["How many devices can watch at once?", "Your plan decides: 1, 2 or 4. If you go over the limit, the extra device is asked to wait."],
  ["A channel won't play. Why?", "Broadcasters sometimes restrict a channel to one country or take it offline. Try another channel or come back later."],
  ["How do I pay?", "Create an account, choose a plan and complete the payment. Your subscription starts as soon as it's confirmed."],
  ["Can I share my account?", "Accounts are personal. Streams are tied to your session and the device limit applies."],
]

export default function LandingPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header>
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden gap-8 text-sm font-medium md:flex">
            <Link href="#how" className="hover:text-primary">How it works</Link>
            <Link href="#pricing" className="hover:text-primary">Plans</Link>
            <Link href="#faq" className="hover:text-primary">Questions</Link>
          </nav>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/login" className="hover:text-primary">Log in</Link>
            <Button asChild className="rounded-full"><Link href="/signup">Start watching</Link></Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <h1 className="font-display max-w-xl text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">
              The world&rsquo;s TV channels, in one tab.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
              Log in, pick a channel and watch live news, sport, movies and music from around the world. Nothing to install.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="h-12 rounded-full px-8 text-base"><Link href="/signup">Create your account</Link></Button>
              <Link href="#pricing" className="text-sm font-semibold underline underline-offset-4 hover:text-primary">See plans and prices</Link>
            </div>
          </div>
          <TvHero />
        </section>

        <div className="bars h-3 w-full" aria-hidden />

        <section id="how" className="container py-20 md:py-28">
          <h2 className="font-display max-w-lg text-3xl font-bold sm:text-4xl">Watching in three steps</h2>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
            {steps.map((s, n) => (
              <li key={s.t} className="bg-card p-7">
                <span className="font-display text-5xl font-extrabold text-primary">{n + 1}</span>
                <h3 className="font-display mt-4 text-xl font-bold">{s.t}</h3>
                <p className="mt-2 text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="container grid gap-10 pb-20 md:pb-28 lg:grid-cols-[1fr_1.4fr]">
          <h2 className="font-display max-w-sm text-3xl font-bold sm:text-4xl">Made for easy evenings</h2>
          <dl className="divide-y divide-border border-y border-border">
            {points.map(([t, d]) => (
              <div key={t} className="grid gap-1 py-5 sm:grid-cols-[14rem_1fr] sm:gap-8">
                <dt className="font-display text-lg font-bold">{t}</dt>
                <dd className="text-muted-foreground">{d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="pricing" className="bg-[#0f1a3a] py-20 text-white md:py-28">
          <div className="container">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Pick a plan for your household</h2>
            <p className="mt-3 max-w-md text-white/70">Every plan includes all channels. The difference is how many screens can watch at once.</p>
            <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
              {PLANS.map((p) => (
                <div key={p.id} className={`flex flex-col rounded-2xl p-7 ${p.popular ? "bg-white text-[#0f1a3a] lg:-my-4 lg:py-11" : "bg-white/[0.06] ring-1 ring-white/15"}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-2xl font-bold">{p.name}</h3>
                    {p.popular && <span className="rounded-full bg-[#e8362d] px-3 py-1 text-xs font-semibold text-white">Most chosen</span>}
                  </div>
                  <p className={`mt-1 ${p.popular ? "text-[#0f1a3a]/65" : "text-white/65"}`}>{p.description}</p>
                  <div className="mt-6 flex items-baseline">
                    <span className="font-display text-5xl font-extrabold">{p.price}</span>
                    <span className={`ml-1 ${p.popular ? "text-[#0f1a3a]/65" : "text-white/65"}`}>{p.period}</span>
                  </div>
                  <ul className="my-7 flex-grow space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-[#3dbe7a]" />{f}</li>
                    ))}
                  </ul>
                  <Button asChild className={`w-full rounded-full ${p.popular ? "" : "bg-white text-[#0f1a3a] hover:bg-white/90"}`}>
                    <Link href="/signup">Choose {p.name}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="container grid gap-10 py-20 md:py-28 lg:grid-cols-[1fr_1.4fr]">
          <h2 className="font-display max-w-sm text-3xl font-bold sm:text-4xl">Questions people ask</h2>
          <Accordion type="single" collapsible>
            {faqs.map(([q, a], n) => (
              <AccordionItem key={n} value={`i${n}`} className="border-border">
                <AccordionTrigger className="text-left font-display text-lg font-semibold">{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <footer>
        <div className="bars h-3 w-full" aria-hidden />
        <div className="container flex flex-col items-center justify-between gap-3 py-8 text-sm text-muted-foreground sm:flex-row">
          <span>&copy; {new Date().getFullYear()} {SITE_NAME}</span>
          <div className="flex gap-5"><Link href="/login" className="hover:text-foreground">Log in</Link><Link href="/signup" className="hover:text-foreground">Sign up</Link></div>
        </div>
      </footer>
    </div>
  )
}
