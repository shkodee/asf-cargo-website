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

**Dropped 2026-07-15 (not needed / resolved):** driver testimonials, benefits detail, Flatbed
activation, Resend email, proper OG image, and the equipment scroll animation are all off the
table — not pursuing any of these. The stray `photo_2026-07-15_05-05-11.jpg` file has been
deleted. The owner account (`880712904`) has messaged the bot and can now receive DMs.

## 🆕 Could build any time, no input needed from you

- [ ] **CDL photo/document upload on the apply form.** Bigger task — needs a Cloudflare R2 bucket
      (new infra) plus changes to `ApplicationForm.tsx` and `worker/worker.js`.

## 🔒 Security posture (reference, not a to-do)

Client's concern was data in transit and at rest, not access control. Current state:
- **In transit:** HTTPS everywhere — the site, the relay Worker, and Telegram Bot API calls.
- **At rest:** nothing application-related is stored in this project's infrastructure beyond
  Cloudflare's own encrypted Worker secrets/KV (bot token, team list). Submissions flow straight
  through to Telegram (and email, once Resend is set up) — never written to a database or log this
  project controls.
- **Out of scope here:** who has access to the Telegram team or the eventual email inbox — that's
  membership management via the bot's own commands and the email provider's side.
- **Full audit done 2026-07-15** (see `PROJECT_BRIEF.md` → "Security hardening pass"): fixed
  HTML-injection into Telegram messages, added rate limiting to both public endpoints, moved
  `SETUP_SECRET` off a URL query param. All three deployed and verified live. CORS, secret
  handling, and dependency audit were already clean.
