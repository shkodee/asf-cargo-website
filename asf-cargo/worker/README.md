# Connecting the application form to Telegram + Email

Your website is static HTML — it can't securely hold secret API keys by itself.
So `worker.js` runs as a small, free relay: your form sends the application to it,
and it forwards the details to Telegram and email. This takes about 10–15 minutes,
one time.

## 1. Create your Telegram bot (2 min)
1. In Telegram, message **@BotFather**.
2. Send `/newbot`, give it a name (e.g. "ASF Cargo Applications").
3. BotFather gives you a **token** like `123456789:AAExampleTokenHere`. Save it.
4. Add the bot to the Telegram group/channel where you want applications to land.
5. To find your **chat ID**: send any message in that group, then visit
   `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser — look for `"chat":{"id": ...}`.

## 2. Create a Resend account for email (3 min) — optional, skip if Telegram-only is fine
1. Sign up free at https://resend.com
2. Verify a sending domain (or use their test domain to start).
3. Grab your **API key**.

## 3. Deploy the Worker (5–8 min)
1. Sign up free at https://dash.cloudflare.com (Workers is free).
2. Click **Workers & Pages → Create → Create Worker**.
3. Name it, e.g. `asf-cargo-relay`, then click **Deploy** (deploys a blank starter).
4. Click **Edit code**, delete the sample code, and paste in the contents of `worker.js` from this folder.
5. Click **Save and Deploy**.
6. Go to **Settings → Variables and Secrets** on the Worker, and add these (mark as "Secret"):
   - `TELEGRAM_BOT_TOKEN` — from step 1
   - `TELEGRAM_CHAT_ID` — from step 1
   - `RESEND_API_KEY` — from step 2 (skip if not using email)
   - `EMAIL_FROM` — e.g. `applications@yourdomain.com` (skip if not using email)
   - `EMAIL_TO` — the inbox you want applications sent to (skip if not using email)
7. Note the Worker's URL — it looks like `https://asf-cargo-relay.yourname.workers.dev`.

   > If you're skipping email, delete the `sendEmail(...)` line from the
   > `Promise.allSettled([...])` call in `worker.js` before deploying, so it doesn't
   > error out trying to use empty variables.

## 4. Connect it to your website (1 min)
Open `assets/script.js` in your site files and replace:
```js
const APPLICATION_ENDPOINT = "PASTE_YOUR_WORKER_URL_HERE";
```
with your real Worker URL, e.g.:
```js
const APPLICATION_ENDPOINT = "https://asf-cargo-relay.yourname.workers.dev";
```

## 5. Test it
Open `apply.html`, submit a test application, and check your Telegram group (and email inbox).

## 6. Lock it down (recommended, 1 min)
In `worker.js`, change:
```js
"Access-Control-Allow-Origin": "*",
```
to your real live domain once the site is deployed, e.g.:
```js
"Access-Control-Allow-Origin": "https://asfcargo.com",
```
This stops other websites from using your relay to spam your Telegram/email.

---

**Need help with any of these steps?** Just tell me which step you're on and paste any
error message — I'll walk you through it.
