import type React from "react"
import "@/styles/globals.css"
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google"
import type { Metadata } from "next"
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site"

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700", "800"] })
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body" })

export const metadata: Metadata = {
  title: `${SITE_NAME} - Live TV streaming`,
  description: SITE_TAGLINE,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  )
}
