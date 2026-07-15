# ASF Cargo Website — TODO

> This file only tracks what's still open. For architecture and how things work, see
> `PROJECT_BRIEF.md`. Full history of what shipped, why, and the bugs hit along the way lives in
> `PROJECT_BRIEF.md`'s dedicated sections and git commit messages — don't duplicate that detail
> here, keep this a scannable punch list.

## 🔴 Needs you — content, a decision, or an account action I can't take

- [ ] **Cloudflare Web Analytics** — needs a beacon token from the dashboard (Analytics & Logs →
      Web Analytics → Add Site); no CLI/API path exists to generate this. Send me the token and
      it's a one-line change.
- [ ] **Google Search Console verification + "Request Indexing"** — needs your Google login, I
      can't do this from here. `robots.txt`/`sitemap.xml` are already in place to help once you do.

**Dropped 2026-07-15 (not needed / resolved):** driver testimonials, benefits detail, Resend
email, proper OG image, and the equipment scroll animation are all off the table — not pursuing
any of these. The stray `photo_2026-07-15_05-05-11.jpg` file has been deleted. The owner account
(`880712904`) has messaged the bot and can now receive DMs. **Flatbed activation was revisited
2026-07-16** — no longer dropped, see "Shipped" below.

## ✅ Shipped 2026-07-15, live now — please test

- [x] **CDL photo/document upload on the apply form.** Live end-to-end: form has a file field
      (JPEG/PNG/WEBP/PDF, 8MB cap, validated client + server side), uploads to a **private** R2
      bucket (`asf-cargo-cdl-docs`, never a public URL), and the team's Telegram notification
      gets a "📎 View CDL Document" button that has the bot fetch and re-send the file on
      demand — gated to registered team members only. R2 is enabled on the account and the relay
      Worker is redeployed with the binding — **please submit a real test application with a CDL
      file attached and confirm the team gets the notification + can open the document.**
- [x] **Form validation tightened**: phone auto-formats to `(555) 555-5555` and only accepts
      digits, rejected if not exactly 10; email format validated (primary + co-driver) if filled
      in; city fields (primary + co-driver) now must match an entry from the existing
      autocomplete list, not free text.
- [x] **Site now redirects HTTP → HTTPS + sends HSTS.** Root cause of the browser "not secure"
      warning: both custom domains were serving real page content over plain HTTP with a `200`
      instead of redirecting. Confirmed live: `http://asfcargollc.com/` now `301`s to HTTPS.
- [x] **`GET /lanes` now sends `Cache-Control: no-store`** — defensive fix for any staleness in
      the lanes/map display after a bot edit. Investigated "lane update" being reported broken:
      the underlying mechanism (bot → KV → live fetch) is confirmed working — a lane added via
      the bot during this session (`California → Georgia`) showed up correctly in the live API
      response. If the site still doesn't reflect a lane change after this, get specifics (what
      you did, what you expected vs. saw) so it's not guesswork next time.
- [x] **Reefer, RGN, Step Deck added as new equipment types** (2026-07-16) — client supplied the
      photos, confirmed all active (no "coming soon" tag).
- [x] **Flatbed flipped from "Coming Soon" to active** (2026-07-16, client instruction).

## 🔒 Security posture (reference, not a to-do)

Client's concern was data in transit and at rest, not access control. Current state:
- **In transit:** HTTPS everywhere — the site, the relay Worker, and Telegram Bot API calls.
- **At rest:** application text itself is never stored — it flows straight through to Telegram
  (and email, once Resend is set up), same as before. **One deliberate exception (2026-07-15):**
  an optional CDL photo/document does persist, in a **private** R2 bucket with no public URL —
  the only way to view one is via the bot's "View CDL Document" button, gated to registered team
  members. Everything else (bot token, team list) is Cloudflare's own encrypted Worker
  secrets/KV, as before.
- **Out of scope here:** who has access to the Telegram team or the eventual email inbox — that's
  membership management via the bot's own commands and the email provider's side.
- **Full audit done 2026-07-15** (see `PROJECT_BRIEF.md` → "Security hardening pass"): fixed
  HTML-injection into Telegram messages, added rate limiting to both public endpoints, moved
  `SETUP_SECRET` off a URL query param. All three deployed and verified live. CORS, secret
  handling, and dependency audit were already clean.
