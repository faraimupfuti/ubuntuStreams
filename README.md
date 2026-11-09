# IPTV streaming site (built on the SaaSify template)

> **New here? Start with [INSTALL.md](INSTALL.md)** for step-by-step local setup.

Landing page + accounts + subscriptions + channel browser + browser web player, with protected stream links.
**Not included yet: the payment provider** (see `lib/billing.ts`).

## Run it

```bash
npm install
cp .env.example .env.local      # then set SESSION_SECRET (openssl rand -base64 48) and ADMIN_SECRET
npm run dev                     # http://localhost:3000
```

Production: `npm run build && npm start` on a VPS behind HTTPS (nginx/Caddy/Cloudflare). Set `SESSION_SECRET`.
Do **not** host on Vercel/Netlify serverless: video is proxied through the server and the user file is stored on disk.

## What's where

| Path | Purpose |
|---|---|
| `lib/site.ts`, `lib/plans.ts` | Brand name and plans/prices/device limits (placeholders - edit!) |
| `app/page.tsx` | Landing page |
| `app/login`, `app/signup`, `app/account`, `app/watch` | Auth, account/plans, web player page |
| `components/iptv/player.tsx` | Channel list, search/filters, hls.js player |
| `app/api/channels` | Channel list for subscribers (no stream URLs) |
| `app/api/stream/[id]` | Channel entry point: returns a rewritten playlist |
| `app/api/seg` | Serves rewritten playlist/segment/key URLs from encrypted tokens |
| `lib/server/*` | Crypto, user store, catalog (M3U parser), proxy, SSRF guard, rate limit, device limit |
| `lib/billing.ts` | **Payment adapter stub** - implement for your provider |
| `app/api/admin/grant` | Manually activate a subscription (until payments exist) |

## How the link protection works

1. The browser only receives opaque channel ids. The real URLs from the playlist stay on the server.
2. `/api/stream/<id>` fetches the upstream playlist and rewrites every URL in it to `/api/seg?t=<token>`.
3. Each token is **AES-256-GCM encrypted** (the upstream URL is unreadable), **expires**, and is **bound to the
   logged-in session** that received it. A copied link does nothing for anyone else or later.
4. Every request re-checks login + active subscription.
5. **Device limit:** each plan allows N simultaneous sessions; extra sessions get HTTP 429.
6. Upstream fetching blocks private/internal addresses (SSRF guard), including across redirects.

Limits: a subscriber can still screen-record or capture the video their player receives - no web player can prevent that.
What this prevents is extracting the permanent source URL and reusing/sharing it.

## Activate a subscription manually

```bash
curl -X POST http://localhost:3000/api/admin/grant \
  -H "x-admin-secret: $ADMIN_SECRET" -H "content-type: application/json" \
  -d '{"email":"user@example.com","planId":"standard","days":30}'
```

For local testing you can set `ALLOW_DEMO_ACTIVATION=true` so the "Subscribe" button grants 7 free days (ignored in production).

## Adding payments later

Implement `BillingProvider` in `lib/billing.ts`, return it from `getBillingProvider()`, and call `grantSubscription()`
from the verified webhook. The pricing buttons, checkout route and webhook route are already wired to it.

## Known limitations / next steps

- Users are stored in `data/users.json` (fine to start; back it up; swap `lib/server/store.ts` for a real DB to scale).
  Rate limits and device tracking are in-memory (single server process).
- Many iptv-org streams are geo-blocked or offline; expect some channels not to play.
- iPhone Safari uses native HLS; confirm cookies reach `/api/seg` there during testing.
- Make sure your license/rights cover the channels you resell; this software does not verify that.
