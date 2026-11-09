"use client"

import { useEffect, useRef, useState } from "react"

const SCENES = [
  { ch: "01", name: "World News" },
  { ch: "02", name: "Match Day" },
  { ch: "03", name: "Cinema" },
  { ch: "04", name: "Kids Club" },
  { ch: "05", name: "Music Live" },
  { ch: "06", name: "Wild Planet" },
]

function Art({ i }: { i: number }) {
  switch (i) {
    case 0:
      return (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1b2f6b] to-[#0a1230]">
          <div className="absolute right-[12%] top-[22%] size-24 rounded-full border-4 border-white/20" />
          <div className="absolute bottom-[14%] left-[6%] right-[6%] overflow-hidden rounded bg-white text-[#0f1a3a]">
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold sm:text-sm">
              <span className="rounded bg-[#e8362d] px-1.5 py-0.5 text-white">LIVE</span>
              Headlines from around the world
            </div>
            <div className="overflow-hidden bg-[#0f1a3a] py-1 text-[10px] text-white sm:text-xs">
              <div className="ticker flex w-max gap-10 whitespace-nowrap">
                {[0, 1].map((k) => (
                  <span key={k}>Markets open higher &nbsp;•&nbsp; Weather: clear skies tonight &nbsp;•&nbsp; Summit talks continue &nbsp;•&nbsp; Sport: late goal decides derby &nbsp;•&nbsp;</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    case 1:
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f8a4c] to-[#14683a]">
          <div className="absolute inset-x-[8%] inset-y-[14%] rounded border-2 border-white/60" />
          <div className="absolute left-1/2 top-[14%] bottom-[14%] w-0.5 bg-white/60" />
          <div className="absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60" />
          <div className="bob absolute left-[58%] top-[44%] size-4 rounded-full bg-white" />
        </div>
      )
    case 2:
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-[#3a1d5c] via-[#c9439b] to-[#f7c948]">
          <div className="absolute bottom-[30%] left-1/2 size-28 -translate-x-1/2 rounded-full bg-[#ffe9a8]" />
          <div className="absolute inset-x-0 bottom-0 h-[30%] bg-[#1a0d2e]" />
          <div className="absolute inset-x-0 top-0 h-[12%] bg-black" />
          <div className="absolute inset-x-0 bottom-0 h-[12%] bg-black" />
        </div>
      )
    case 3:
      return (
        <div className="absolute inset-0 bg-gradient-to-br from-[#35b7d8] to-[#f7c948]">
          <div className="bob absolute left-[14%] top-[40%] size-16 rounded-full bg-[#e8362d]" />
          <div className="bob absolute left-[42%] top-[30%] size-20 rounded-2xl bg-white" style={{ animationDelay: ".3s" }} />
          <div className="bob absolute left-[70%] top-[42%] size-14 rotate-12 bg-[#3b5bdb]" style={{ animationDelay: ".6s" }} />
        </div>
      )
    case 4:
      return (
        <div className="absolute inset-0 bg-gradient-to-br from-[#c9439b] to-[#3b1a7a]">
          <div className="eq absolute inset-x-[14%] bottom-[16%] flex h-[55%] items-end gap-2">
            {[0.7, 1, 0.5, 0.9, 0.6, 1, 0.8, 0.45].map((d, k) => (
              <span key={k} className="h-full flex-1 rounded-t bg-white/90" style={{ animationDelay: `${k * 0.12}s`, animationDuration: `${0.7 + d * 0.6}s` }} />
            ))}
          </div>
        </div>
      )
    default:
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-[#9fd8e8] to-[#d9f0d0]">
          <svg viewBox="0 0 400 225" preserveAspectRatio="none" className="absolute inset-0 size-full">
            <polygon points="0,225 0,150 90,70 170,140 250,50 340,140 400,100 400,225" fill="#2e7d5b" />
            <polygon points="0,225 0,185 110,130 210,190 300,120 400,175 400,225" fill="#1f5c43" />
          </svg>
          <div className="absolute right-[14%] top-[14%] size-12 rounded-full bg-[#fff3b0]" />
        </div>
      )
  }
}

export function TvHero() {
  const [i, setI] = useState(0)
  const [tuning, setTuning] = useState(true)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    timer.current = setTimeout(() => setTuning(false), 900)
    return () => clearTimeout(timer.current)
  }, [])

  const tune = (n: number) => {
    clearTimeout(timer.current)
    setTuning(true)
    setI(n)
    timer.current = setTimeout(() => setTuning(false), 320)
  }
  const s = SCENES[i]

  return (
    <div>
      <div className="rounded-[1.75rem] bg-[#0f1a3a] p-3 shadow-[0_30px_60px_-20px_rgba(15,26,58,.55)] sm:p-4">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
          <Art i={i} />
          <div className="absolute left-3 top-3 flex items-baseline gap-2 text-white [text-shadow:0_1px_6px_rgba(0,0,0,.6)] sm:left-4 sm:top-4">
            <span className="font-display text-3xl font-bold tabular-nums sm:text-4xl">{s.ch}</span>
            <span className="text-sm font-medium sm:text-base">{s.name}</span>
          </div>
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white sm:right-4 sm:top-4">
            <span className="size-2 rounded-full bg-[#e8362d]" /> Live
          </div>
          {tuning && <div className="tuning absolute inset-0" aria-hidden />}
        </div>
      </div>
      <div className="mx-auto mt-5 flex max-w-sm items-center justify-between gap-2 rounded-2xl bg-white/70 p-2 ring-1 ring-border" role="group" aria-label="Try a channel">
        {SCENES.map((c, n) => (
          <button
            key={c.ch}
            onClick={() => tune(n)}
            aria-label={`Channel ${c.ch}: ${c.name}`}
            aria-pressed={n === i}
            className={`size-10 rounded-xl font-display text-lg font-bold tabular-nums transition-colors ${n === i ? "bg-[#0f1a3a] text-white" : "text-[#0f1a3a] hover:bg-[#0f1a3a]/10"}`}
          >
            {n + 1}
          </button>
        ))}
      </div>
    </div>
  )
}
