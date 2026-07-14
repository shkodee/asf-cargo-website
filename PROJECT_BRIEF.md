# ASF Cargo LLC — Website Project Brief

## What this is
A recruiting/informational website for a trucking company, built to attract CDL-A drivers
(solo and team) and take applications online. Static HTML/CSS/JS — no backend framework,
no build step. Reference sites used for inspiration: summitttrucking.com and eosolutionsinc.com.

**Live at:** https://asf-cargo-website.afzaljon0411.workers.dev (Cloudflare Workers static assets,
auto-deploys from the `main` branch of https://github.com/shkodee/asf-cargo-website on every push).
No custom domain attached yet.

## Company facts (use exactly as given — do not invent numbers/claims)
- **Name:** ASF Cargo LLC
- **Address:** 5850 Cameron Run Terrace, Alexandria, VA 22303
- **Office phone:** (412) 588-1575
- **Dispatch phone:** (412) 588-1683
- **MC#:** 1578558
- **DOT#:** 4125298
- **Freight types:** Power-only, Dry Van (active). Flatbed — coming soon, not yet active.
- **Pay:**
  - Solo drivers: $0.65–$0.75/mile (starting rate for experienced drivers)
  - Team drivers: up to $1.00/mile, split per truck
- **Requirements:** Valid CDL-A. No experience required — company trains. Clean driving record.
- **Lanes (8 daily, shown by state only on the public site — never show full city/address detail beyond state-level on public pages):**
  1. Tennessee → New Jersey
  2. Tennessee → Pennsylvania
  3. Tennessee → Pennsylvania
  4. Georgia → Pennsylvania
  5. New York → Illinois
  6. Pennsylvania → Tennessee
  7. New Jersey → Tennessee
  8. Maryland → Tennessee
  - More lanes being added, expected within 1–2 months.

## Design system
- **Palette:** Navy `#0c1c34` / `#142c50` / `#1d3a68` (primary), Red `#c41230` / `#8c0d22` (accent), Cream `#f3efe6` (light bg), Steel `#5b6774`, Ink `#0a1220` (dark bg), Chrome `#aeb8c2`
- **Type:** Display = Bebas Neue (poster/signage feel matching the badge logo), Body = Inter, Utility/mono = IBM Plex Mono (used for the "dispatch board" and data-like labels)
- **Signature element:** the "Live Lanes" dispatch board on the homepage — lanes styled like a manifest/dispatch terminal (dark background, monospace, pulsing "active" dot). This is the one distinctive visual idea; keep future additions consistent with it rather than introducing a second unrelated gimmick.
- **Logo:** `assets/logo.png` — circular badge, American flag + Kenworth-style truck + "ASF CARGO" wordmark. Site palette was derived from it.

## File structure
```
asf-cargo/
├── index.html          # homepage: hero, pay cards, lanes board, equipment, requirements, contact, CTA
├── apply.html           # driver application form
├── wrangler.jsonc        # Cloudflare Workers static-assets deploy config
├── assets/
│   ├── style.css         # all design tokens + component styles
│   ├── script.js         # nav toggle, footer year, form submit logic, scroll animations
│   └── logo.png
└── worker/
    ├── worker.js          # Cloudflare Worker: relays form POST → Telegram + Resend email
    └── README.md          # step-by-step deploy guide for the worker
```

Contact info lives in a `#contact` section at the bottom of the homepage (not a separate page).

## How the application form works
`apply.html` POSTs JSON to a URL defined in `assets/script.js` as `APPLICATION_ENDPOINT`.
That URL is meant to be a deployed Cloudflare Worker (`worker/worker.js`) which fans the
submission out to:
1. A Telegram chat via Bot API (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`)
2. Email via Resend (`RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO`) — optional, can be removed
   from the worker if Telegram-only is preferred (user confirmed Telegram-only is acceptable
   for now, but wants email added "if possible")

**Status: DEPLOYED and confirmed working (2026-07-14).** `APPLICATION_ENDPOINT` in `script.js`
points to `https://asf-cargo-relay.afzaljon0411.workers.dev` (Cloudflare Worker, Cloudflare
account afzaljon0411@gmail.com). `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set as
Worker secrets; a test submission was confirmed delivered to the Telegram group. Email via
Resend was intentionally skipped for now (see below) — `worker.js` was deployed unmodified,
so `sendEmail()` just fails silently via `Promise.allSettled` until Resend env vars are added.

## Open items / not yet built
- [ ] Add Resend email (`RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO` as Worker secrets) — no code
      change needed, `worker.js` already calls `sendEmail()`, it's just inactive until these
      three secrets are set in the Cloudflare dashboard
- [ ] Buy a domain — `asfcargo.com` was taken; `asfcargollc.com` was confirmed available and is
      the pick, not yet purchased
- [ ] Driver testimonials — none provided yet, don't fabricate; add once client sends real ones
- [ ] Equipment photos — currently text-only equipment cards, no truck photos yet
- [ ] Flatbed section — currently marked "Coming Soon"; flip to active once client confirms
- [ ] Benefits detail (health insurance, home time, bonuses) — not specified yet, currently
      omitted rather than guessed at
- [ ] Domain + hosting — not chosen yet
- [ ] Resume/CDL photo upload on the application form — not built, was floated as a future idea
- [ ] CORS lock-down in `worker.js` — currently `Access-Control-Allow-Origin: "*"`, should be
      restricted to the real domain once live

## Guardrails for future work
- Don't invent statistics, benefits, awards, or testimonials that weren't provided by the client.
- Keep lane detail state-level only on public pages (client's explicit instruction — full
  city-to-city detail is not for public display).
- Keep the visual language consistent with the design tokens above rather than introducing new
  color/type choices per page.
