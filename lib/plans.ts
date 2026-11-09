// Subscription plans. Prices/limits here are PLACEHOLDERS - edit to match your business.
// `devices` = how many devices (browser sessions) can watch at the same time on one account.
// `days`    = how long one purchase/grant lasts.
export type Plan = {
  id: string
  name: string
  price: string
  period: string
  devices: number
  days: number
  description: string
  features: string[]
  popular?: boolean
}

export const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    price: "$5",
    period: "/month",
    devices: 1,
    days: 30,
    description: "For one person watching on one device.",
    features: ["Thousands of live channels", "Browser web player", "1 device at a time"],
  },
  {
    id: "standard",
    name: "Standard",
    price: "$9",
    period: "/month",
    devices: 2,
    days: 30,
    description: "Great for couples and small households.",
    features: ["Thousands of live channels", "Browser web player", "2 devices at a time", "Search by country & category"],
    popular: true,
  },
  {
    id: "family",
    name: "Family",
    price: "$15",
    period: "/month",
    devices: 4,
    days: 30,
    description: "Everyone in the house can watch at once.",
    features: ["Thousands of live channels", "Browser web player", "4 devices at a time", "Search by country & category"],
  },
]

export const DEFAULT_DEVICES = 1
export const getPlan = (id: string | undefined | null) => PLANS.find((p) => p.id === id)
