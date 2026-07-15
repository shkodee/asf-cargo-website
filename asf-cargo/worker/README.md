# Connecting the application form to Telegram + Email

Your website is static HTML — it can't securely hold secret API keys by itself.
So `worker.js` runs as a small, free relay + bot:
1. It receives the driver application form POST and DMs a summary to every
   admin/owner/member on the team (via the bot), plus emails it via Resend.
2. It's also the Telegram bot itself — `/start`, `/whoami`, `/addmember`, and an
   inline admin panel (manage the team, pause/resume notifications, view stats)
   all run through this same Worker.

## 1. Create your Telegram bot (2 min)
1. In Telegram, message **@BotFather**.
2. Send `/newbot`, give it a name (e.g. "ASF Cargo Applications").
3. BotFather gives you a **token** like `123456789:AAExampleTokenHere`. Save it.
4. Applications go straight to each team member's DMs, not a group — **everyone
   must open a chat with the bot and send it any message (e.g. `/start`) at least
   once** before the bot is allowed to message them (a Telegram platform rule, not
   something this code can work around).

## 2. Create a Resend account for email (3 min) — optional, skip if Telegram-only is fine
1. Sign up free at https://resend.com
2. Verify a sending domain (or use their test domain to start).
3. Grab your **API key**.

## 3. Create the KV namespace (1 min)
The bot's team list, pause state, and stats live in a Cloudflare KV namespace
(not a static secret — this lets the bot manage its own team live, via `/addmember`
and the panel, with no redeploy needed):
```
npx wrangler kv namespace create ASF_BOT_KV
```
This prints a binding block — add it to `wrangler.jsonc` in this folder:
```jsonc
"kv_namespaces": [
  { "binding": "ASF_BOT_KV", "id": "<the id it printed>" }
]
```

## 3b. Enable R2 + create the CDL-doc bucket (2 min) — needed for the CDL upload feature
R2 has to be turned on for the Cloudflare account once, from the dashboard (Workers &
Pages → R2 → **Enable R2** — no CLI/API path for this first-time enablement). After that:
```
npx wrangler r2 bucket create asf-cargo-cdl-docs
```
This bucket is **private** — CDL photos never get a public URL. A team member views one by
tapping "📎 View CDL Document" on the Telegram notification, which has the bot fetch the file
from R2 and re-send it as a Telegram attachment (see `viewdoc:` in `worker.js`).

## 4. Deploy the Worker (5–8 min)

**Preferred: via CLI, from this folder** (`asf-cargo/worker/` — it has its own
`wrangler.jsonc`, deliberately separate from the site's config one level up so a deploy
here never picks up the site's `dist/` assets):
```
npx wrangler login      # one-time browser auth
npx wrangler deploy     # ships worker.js as-is
```
`wrangler deploy` never touches secrets that already exist — but any **plain env var**
(`vars` in `wrangler.jsonc`, not a secret) *is* fully controlled by this file and will be
**deleted** on deploy if it's not listed here. Always add new secrets with
`wrangler secret put NAME`, never as a plain var, so this can't happen again.

Add these secrets (`wrangler secret put NAME`, paste the value when prompted):
- `TELEGRAM_BOT_TOKEN` — from step 1
- `TELEGRAM_WEBHOOK_SECRET` — any random string you generate yourself (e.g.
  `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`) —
  verifies incoming webhook calls are really from Telegram
- `SETUP_SECRET` — another random string, protects the one-time webhook-registration
  endpoint below from anyone else triggering it
- `RESEND_API_KEY` — from step 2 (skip if not using email)
- `EMAIL_FROM` — e.g. `applications@yourdomain.com` (skip if not using email)
- `EMAIL_TO` — the inbox you want applications sent to (skip if not using email)

Note the Worker's URL — it looks like `https://asf-cargo-relay.yourname.workers.dev`.

## 5. Register the webhook + bot commands (1 min, one-time)
`SETUP_SECRET` is checked via an `X-Setup-Secret` header, not a URL query param
(query strings end up in logs/browser history/Referer headers by default — a
header doesn't), so this needs a `curl` call rather than just visiting a URL:
```
curl -H "X-Setup-Secret: YOUR_SETUP_SECRET" https://asf-cargo-relay.yourname.workers.dev/setup-webhook
```
This tells Telegram to start sending bot updates to `/telegram-webhook`, and
registers the `/` command list in Telegram's UI. You'll see a small JSON success
response. Re-run this any time after redeploying if the webhook ever needs
re-registering (it doesn't, normally — this is truly one-time).

## 6. Bootstrap the first owner (1 min)
KV starts empty, so nobody can use `/addmember` yet. Seed the first person by hand:
```
npx wrangler kv key put --remote --namespace-id <your KV id> "admins" \
  '[{"id":"<your numeric telegram id>","role":"owner","addedBy":"system","addedAt":"2026-01-01T00:00:00.000Z"}]'
```
(Get your numeric ID by messaging the bot — it'll reply with it if you're not
registered yet.) After that, everyone else can be added straight from the bot
itself with `/addmember <id>` — no more manual KV edits needed.

## 7. Connect it to your website
This is already wired up in `src/api/apply.ts` via `APPLICATION_ENDPOINT` — update
that constant if the Worker's URL ever changes.

## 8. Test it
Open `apply.html`, submit a test application, and check the team's Telegram DMs
(and email inbox, if configured).

## 9. Lock it down (already done, documented here for reference)
`worker.js`'s `ALLOWED_ORIGINS` list restricts which sites can call the relay via
CORS — update it if the site's domain ever changes.

---

## Bot commands & roles

| Role | Panel access | Gets notifications | Removable via 👥 Team | Non-admin viewer sees |
|---|---|---|---|---|
| 👑 Owner | Full | Yes | Yes | Username/name only |
| 🛠 Admin | Full (identical to Owner) | Yes | **No — protected, even from Owner** | — (not listed at all) |
| 👤 Member | None | Yes | Yes | Username/name only |

*(last column: what a non-admin viewer sees of that row — Admin viewers always see the full
`@username (numeric id)` for everyone listed)*

- `/start` or `/menu` — open the admin panel (Owner/Admin) or see your registration
  status (Member / unregistered)
- `/whoami` — show your Telegram ID and current role
- `/addmember <id>` — (Owner/Admin only) add someone by numeric ID, then pick their
  role (Owner/Admin/Member) via buttons. They must have messaged the bot at least
  once already, or they won't receive the notification (though they'll still be
  added — it'll just silently fail to greet them until they do message it).
- **👥 Team** button — view Owner/Member rows with a one-tap remove button. Admins
  never appear in this list at all (not just non-removable — fully hidden, Owner
  included). Only an Admin viewer sees everyone's numeric Telegram ID; an Owner
  viewer sees just usernames/names, never the raw ID.
- **🛣 Lanes** button — (Owner/Admin only) tap any lane to open it, then
  **✏️ Change Status** (Daily/Weekly/Paused) or **🗑 Remove Lane** (asks for
  confirmation first — not a single accidental tap away). **+ Add Lane** walks
  through origin → destination → status; cities are geocoded automatically via
  OpenStreetMap (free, no key). The website reads this list live via
  `GET /lanes` — a lane you add here shows up on the site on next page load,
  no redeploy needed.
- **📊 Stats** button — applications received today / this week / all-time
- **⏸ Pause / ▶️ Resume** button — temporarily stop Telegram notifications
  (the form still works and still emails, if configured — this only affects
  the Telegram DM step)

---

**Need help with any of these steps?** Just tell me which step you're on and paste any
error message — I'll walk you through it.
