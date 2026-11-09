# Installing on your local machine

## 1. Install Node.js
Download the **LTS** version (20 or newer) from https://nodejs.org and install it.
Check it worked by opening a terminal (Command Prompt/PowerShell on Windows, Terminal on Mac) and running:

```bash
node -v
```
It should print `v20` or higher.

## 2. Open a terminal in this folder
```bash
cd path/to/SaaSify-main
```
On Windows you can open this folder in File Explorer, click the address bar, type `cmd` and press Enter.

## 3. Install the dependencies
```bash
npm install
```
This needs an internet connection and takes a minute or two.

## 4. Create your settings file
Copy `.env.example` to a new file named `.env.local`.

Mac/Linux:
```bash
cp .env.example .env.local
```
Windows:
```bash
copy .env.example .env.local
```

Open `.env.local` in a text editor and fill in these three lines:

```
SESSION_SECRET=any-long-random-text-at-least-32-characters-long
ADMIN_SECRET=another-long-random-text
ALLOW_DEMO_ACTIVATION=true
```

- `SESSION_SECRET` protects logins and stream links (32+ characters).
- `ADMIN_SECRET` protects the manual "grant subscription" endpoint (16+ characters).
- `ALLOW_DEMO_ACTIVATION=true` lets the Subscribe button give 7 free days, for testing on your own machine only. It is ignored in production.

## 5. Start the site
```bash
npm run dev
```
Open **http://localhost:3000** in your browser.

## 6. Try the web player
1. Click **Start watching** and create an account.
2. On the account page, choose a plan and click **Subscribe** (grants 7 free days).
3. Click **Watch live TV** (this is the `/watch` page).

The first time the channel list opens it downloads the full iptv-org playlist, so allow a few seconds.

## Troubleshooting
- **`npm install` fails:** check `node -v` shows 20 or higher.
- **Error mentioning `SESSION_SECRET`:** `.env.local` is missing or the secret is under 32 characters. Fix it, then stop and restart `npm run dev`.
- **Fonts or channel list never load:** both are fetched online, so check your internet connection.
- **A channel won't play:** try several others. Many iptv-org streams are offline or blocked outside their home country.
- **Port 3000 already in use:** run `npm run dev -- -p 3001` and open http://localhost:3001.

## Next steps
See `README.md` for how the link protection works, how to activate subscribers manually, how to add a payment provider,
and what to do before putting the site on a real server.
