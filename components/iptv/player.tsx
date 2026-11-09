"use client"

import type Hls from "hls.js"
import { Loader2, Search, Tv } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Channel = { id: string; name: string; logo?: string; group?: string; country?: string }
type ListResp = { total: number; items: Channel[]; groups: string[]; countries: string[] }
const PAGE = 60

const selectClass =
  "h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"

export function Player() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const playToken = useRef(0)

  const [q, setQ] = useState("")
  const [dq, setDq] = useState("")
  const [group, setGroup] = useState("")
  const [country, setCountry] = useState("")
  const [items, setItems] = useState<Channel[]>([])
  const [total, setTotal] = useState(0)
  const [groups, setGroups] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState("")

  const [current, setCurrent] = useState<Channel | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "error">("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const t = setTimeout(() => setDq(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const fetchPage = useCallback(
    async (offset: number, signal?: AbortSignal) => {
      setListLoading(true)
      setListError("")
      try {
        const sp = new URLSearchParams({ offset: String(offset), limit: String(PAGE) })
        if (dq) sp.set("q", dq)
        if (group) sp.set("group", group)
        if (country) sp.set("country", country)
        const res = await fetch(`/api/channels?${sp}`, { signal })
        if (res.status === 401 || res.status === 402) {
          setListError(res.status === 401 ? "Your session expired. Please log in again." : "An active subscription is required.")
          return
        }
        if (!res.ok) {
          setListError("Could not load channels. Please try again.")
          return
        }
        const data: ListResp = await res.json()
        setItems((prev) => (offset === 0 ? data.items : [...prev, ...data.items]))
        setTotal(data.total)
        setGroups(data.groups)
        setCountries(data.countries)
      } catch (e: any) {
        if (e?.name !== "AbortError") setListError("Network error while loading channels.")
      } finally {
        setListLoading(false)
      }
    },
    [dq, group, country],
  )

  useEffect(() => {
    const ctrl = new AbortController()
    fetchPage(0, ctrl.signal)
    return () => ctrl.abort()
  }, [fetchPage])

  const stop = useCallback(() => {
    hlsRef.current?.destroy()
    hlsRef.current = null
  }, [])
  useEffect(() => stop, [stop])

  async function play(ch: Channel) {
    const video = videoRef.current
    if (!video) return
    const token = ++playToken.current
    stop()
    setCurrent(ch)
    setStatus("loading")
    setMessage("")
    const src = `/api/stream/${encodeURIComponent(ch.id)}`
    const fail = (m: string) => {
      if (token !== playToken.current) return
      setStatus("error")
      setMessage(m)
    }

    const { default: HlsLib } = await import("hls.js")
    if (token !== playToken.current) return

    if (HlsLib.isSupported()) {
      const hls = new HlsLib({ maxBufferLength: 30, manifestLoadingMaxRetry: 1, levelLoadingMaxRetry: 2 })
      hlsRef.current = hls
      let recovered = false
      hls.on(HlsLib.Events.ERROR, (_e, data) => {
        if (!data.fatal) return
        const code = data.response?.code
        if (code === 429) return fail("Too many devices are watching on this account. Close another player and try again.")
        if (code === 401) return fail("Your session expired. Please log in again.")
        if (code === 402) return fail("Your subscription has ended.")
        if (data.type === HlsLib.ErrorTypes.MEDIA_ERROR && !recovered) {
          recovered = true
          hls.recoverMediaError()
          return
        }
        fail("This channel is not available right now. Try another one.")
      })
      hls.on(HlsLib.Events.MANIFEST_PARSED, () => video.play().catch(() => {}))
      hls.loadSource(src)
      hls.attachMedia(video)
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src // Safari / iOS native HLS
      video.play().catch(() => {})
    } else {
      fail("Your browser cannot play live streams.")
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black ring-1 ring-border shadow-2xl">
          <video
            ref={videoRef}
            className="h-full w-full"
            controls
            playsInline
            controlsList="nodownload noremoteplayback"
            onContextMenu={(e) => e.preventDefault()}
            onPlaying={() => setStatus("playing")}
          />
          {status !== "playing" && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white/80">
              {status === "loading" ? <Loader2 className="size-8 animate-spin" /> : <Tv className="size-10" />}
              <p className="text-sm">
                {status === "idle" && "Pick a channel to start watching."}
                {status === "loading" && "Loading channel..."}
                {status === "error" && message}
              </p>
            </div>
          )}
        </div>
        <h2 className="font-display mt-4 text-2xl font-bold">{current?.name ?? "No channel selected"}</h2>
        {current && (
          <p className="text-sm text-muted-foreground">
            {[current.group, current.country?.toUpperCase()].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <div className="flex min-h-0 flex-col rounded-2xl border border-border bg-card">
        <div className="space-y-2 border-b border-border/40 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search channels" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className={selectClass} value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country">
              <option value="">All countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
            <select className={selectClass} value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Category">
              <option value="">All categories</option>
              {groups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted-foreground">{total.toLocaleString()} channels</p>
        </div>

        <ul className="max-h-[60vh] flex-1 overflow-y-auto p-2 lg:max-h-[520px]">
          {items.map((ch) => (
            <li key={ch.id}>
              <button
                onClick={() => play(ch)}
                className={`flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm transition-colors hover:bg-muted ${current?.id === ch.id ? "bg-muted" : ""}`}
              >
                <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                  {ch.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ch.logo}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="size-full object-contain"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <Tv className="size-4 text-muted-foreground" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{ch.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[ch.group, ch.country?.toUpperCase()].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {!listLoading && !listError && items.length === 0 && (
            <li className="p-4 text-center text-sm text-muted-foreground">No channels match your search.</li>
          )}
          {listError && (
            <li className="p-4 text-center text-sm text-red-500">
              {listError}{" "}
              <Link href="/login" className="underline">Log in</Link>
            </li>
          )}
          {listLoading && (
            <li className="flex justify-center p-4"><Loader2 className="size-5 animate-spin text-muted-foreground" /></li>
          )}
          {!listLoading && items.length < total && (
            <li className="p-2">
              <Button variant="outline" className="w-full" onClick={() => fetchPage(items.length)}>Load more</Button>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
