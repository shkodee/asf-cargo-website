# ASF Cargo Website — TODO

> This file only tracks what's still open. For architecture and how things work, see
> `PROJECT_BRIEF.md`. Full history of what shipped, why, and the bugs hit along the way lives in
> `PROJECT_BRIEF.md`'s dedicated sections and git commit messages — don't duplicate that detail
> here, keep this a scannable punch list.

## 🔴 Needs you — content, a decision, or an account action I can't take

- [ ] **Driver testimonials.** None provided yet — won't fabricate quotes.
- [ ] **Benefits detail** (health insurance, home time, bonuses) — not specified yet.
- [ ] **Flip Flatbed from "Coming Soon" to active** once that's actually true.
- [ ] **Resend email secrets** — only if you want applications emailed in addition to Telegram.
- [ ] **Proper 1200×630 Open Graph share image** — link previews currently reuse the circular
      logo (works, but isn't the ideal aspect ratio).
- [ ] **Cloudflare Web Analytics** — needs a beacon token from the dashboard (Analytics & Logs →
      Web Analytics → Add Site); no CLI/API path exists to generate this. Send me the token and
      it's a one-line change.
- [ ] **Google Search Console verification + "Request Indexing"** — needs your Google login, I
      can't do this from here. `robots.txt`/`sitemap.xml` are already in place to help once you do.
- [ ] **Equipment section scroll animation** — blocked on the reference video you're generating
      from the prompt we wrote (see `DESIGN_PROMPTS.md`). Don't start building without it.
- [ ] **`asf-cargo/public/photo_2026-07-15_05-05-11.jpg`** — unexplained file sitting in the repo,
      not referenced anywhere. Delete it or tell me what it's for.
- [ ] **880712904 (owner account)** still can't receive bot DMs — hasn't messaged the actual bot
      yet, so Telegram refuses to let it initiate contact. Have that account message the bot once.

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
