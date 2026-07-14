# ASF Cargo LLC — Website Project Brief

> **Read this file first.** It's the continuity doc for this project — written so an agent
> (or you, on a new device) can pick up exactly where things left off without re-reading the
> whole conversation history. Keep it current: whenever a decision is made or something ships,
> update the relevant section here, not just in chat.

## Current status (as of 2026-07-14)
- ✅ Site is **live and auto-deploying**: https://asf-cargo-website.afzaljon0411.workers.dev
- ✅ Driver application form → Telegram relay is **working** (multiple test submissions confirmed delivered)
- ✅ GitHub repo pushed and connected to Cloudflare for CI/CD (push to `main` = auto-deploy)
- ✅ Modern visual pass done: scroll-reveal animations, hero load-in, header scroll shadow,
  scroll-progress bar, cropped/enlarged logo for legibility
- ✅ Contact info consolidated into a homepage section (`#contact`), no longer a separate page
- ✅ **Rebuilt as React + TypeScript + Vite** (2026-07-14) — was plain static HTML/CSS/JS, user
  asked to reorganize into folders like a reference repo (`qukssavage/shop`), then chose the full
  framework rewrite over a lighter reorg. See "Architecture" below — **this adds a required
  manual Cloudflare dashboard step (Build command) that is NOT done automatically by pushing.**
- ⏳ **Not done yet:** the Cloudflare Build command dashboard step (see "Architecture"), custom
  domain purchase, CORS lock-down, Resend email, and several content items that require input
  from the client (see "Open items" below)

## What this is
A recruiting/informational website for a trucking company, built to attract CDL-A drivers
(solo and team) and take applications online. React + TypeScript + Vite, built to static assets
and deployed on Cloudflare Workers. Reference sites used for inspiration: summitttrucking.com
and eosolutionsinc.com.

## Architecture
React + TypeScript, built with Vite in **multi-page mode** (two HTML entry points — `index.html`
for the homepage, `apply.html` for the application form — each mounting its own React root via
`src/main.tsx` / `src/apply-main.tsx`). **No `react-router`** — deliberately, since there are only
2 real pages plus one in-page anchor (`#contact`); a router would add a dependency for no benefit.
**No Sass** — plain CSS split by concern under `src/styles/` (`variables.css` → `base.css` →
`animations.css` → `layout.css` → `components.css`, imported once via `src/styles/index.css`),
since the design tokens were already CSS custom properties.

Build output goes to `asf-cargo/dist/` (gitignored, not committed — Cloudflare builds it fresh
on every deploy). **This means the deploy pipeline now requires a build step** where before it
just uploaded raw files:
- `asf-cargo/wrangler.jsonc` → `assets.directory` points at `./dist` (was `./`).
- **Manual step required in the Cloudflare dashboard** (Workers project `asf-cargo-website` →
  Settings): the **Build command** must be set to `npm run build` (previously blank, since there
  was nothing to build). Until this is set, pushes to `main` will deploy stale/broken output or
  fail outright. **Check this is set before assuming a push went live.**
- Path/Root directory (`asf-cargo`) and Deploy command (`npx wrangler deploy`) are unchanged.

**Known accepted trade-off:** the old static site showed full content even if JS failed to load
(only animations depended on JS — progressive enhancement). A React CSR app ships `<div id="root">`
in the HTML, so a JS failure now means a blank page. User explicitly accepted this as normal-for-
React rather than adding prerendering/SSG to avoid it — don't "fix" this without asking first.

`src/data/content.ts` is the single source of truth for business copy (lanes, pay tiers,
equipment, requirements, contact info) — it replaces what used to be hand-duplicated across two
HTML files. Edit content there, not in component files.

## Infrastructure & accounts
This project spans two separate Cloudflare Workers under one Cloudflare account
(`afzaljon0411@gmail.com`) — don't confuse them:

| | **Site** | **Form relay** |
|---|---|---|
| Purpose | Serves the static HTML/CSS/JS | Receives form POST, forwards to Telegram/email |
| Cloudflare Worker name | `asf-cargo-website` | `asf-cargo-relay` |
| URL | https://asf-cargo-website.afzaljon0411.workers.dev | https://asf-cargo-relay.afzaljon0411.workers.dev |
| Deploy method | Auto, via GitHub integration (push to `main`) | Manual (pasted into Cloudflare's inline code editor — not GitHub-connected) |
| Config | `asf-cargo/wrangler.jsonc` (static assets, root dir `asf-cargo`, deploy command `npx wrangler deploy`) | No wrangler config — deployed via Cloudflare dashboard's inline editor |

**GitHub repo:** https://github.com/shkodee/asf-cargo-website (public, owner `shkodee`).
Local repo root is `c:\asf-cargo-website` (one level above `asf-cargo/`, so it also contains this
brief and `.gitignore`). Git identity on the machine that set this up: `Afzaljon` /
`afzaljon0411@email.com`. Push auth uses Windows Git Credential Manager — on a **new device**,
the first `git push` will prompt a fresh GitHub browser login.

**Telegram:** bot created via @BotFather, added to a group called "ASF Cargo Applications".
`TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set as **Secrets** on the `asf-cargo-relay`
Worker (Cloudflare dashboard → that Worker → Settings → Variables and Secrets) — not stored in
any file in this repo, and not recoverable from here if lost (would need BotFather again).

**Domain:** none yet. `asfcargo.com` is taken (registered elsewhere, Squarespace Domains).
`asfcargollc.com` was confirmed available and is the intended pick — not purchased yet. Plan is
to buy via Cloudflare Registrar (at-cost pricing, same dashboard, auto-configures DNS) so it can
be attached to the `asf-cargo-website` Worker via that Worker's **Domains** tab once bought.

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
- **Logo:** `public/logo.png` — circular badge, American flag + Kenworth-style truck + "ASF CARGO" wordmark. Cropped tight to the badge (827×726, was 1024×1024 with a lot of transparent vignette padding) so it reads clearly at header size. Original uncropped version was not kept in the repo — regenerate from source art if a different crop is ever needed.
- **Motion:** scroll-reveal fade-up on section headings/cards/lane rows (`.reveal`/`.in-view` classes, driven by the `useScrollReveal` hook in `src/hooks/useScrollReveal.ts`, wrapped for convenience by `src/components/UI/Reveal.tsx`), hero content fades in on load (`.hero-anim`, pure CSS), header gains a shadow after scrolling (state in `Header.tsx`), thin scroll-progress bar at the very top of the viewport (`ScrollProgressBar.tsx`). All motion respects `prefers-reduced-motion` and (animation aside) degrades gracefully — see the CSR trade-off note above for the one exception (JS failing entirely).

## File structure
```
c:\asf-cargo-website\            # git repo root
├── PROJECT_BRIEF.md              # this file
├── README.md                     # short public-facing repo readme
├── .gitignore
└── asf-cargo/                    # everything actually deployed as the site (Vite project root)
    ├── index.html                 # Vite entry: homepage — div#root + script src="/src/main.tsx"
    ├── apply.html                 # Vite entry: application form — div#root + script src="/src/apply-main.tsx"
    ├── package.json / vite.config.ts / tsconfig*.json
    ├── wrangler.jsonc              # Cloudflare Workers static-assets config — assets.directory: "./dist"
    ├── public/
    │   └── logo.png                 # served at stable root URL /logo.png
    ├── dist/                       # BUILD OUTPUT, gitignored — what actually gets deployed
    ├── src/
    │   ├── main.tsx / apply-main.tsx   # entry points, one per HTML page
    │   ├── pages/HomePage.tsx, ApplyPage.tsx
    │   ├── layouts/SiteLayout.tsx       # Header + ScrollProgressBar + children + Footer
    │   ├── components/
    │   │   ├── layout/                    # Header.tsx, Footer.tsx, ScrollProgressBar.tsx
    │   │   ├── UI/                         # Button.tsx, SectionHeading.tsx, Reveal.tsx
    │   │   ├── home/                       # Hero, PayCard(+Section), DispatchBoard(+Section), LaneRow, EquipmentCard(+Section), RequirementItem, RequirementsSection, ContactCard(+Section), CtaBand
    │   │   └── apply/ApplicationForm.tsx
    │   ├── hooks/useScrollReveal.ts
    │   ├── api/apply.ts                 # submitApplication() — POSTs to the relay Worker, contract with worker/worker.js
    │   ├── types/index.ts
    │   ├── data/content.ts               # ALL business copy lives here — single source of truth
    │   └── styles/                       # variables.css, base.css, animations.css, layout.css, components.css, index.css (imports all 5)
    └── worker/                     # NOT part of the Vite build — separate Worker, deployed manually
        ├── worker.js                 # Cloudflare Worker: relays form POST → Telegram + Resend email
        └── README.md                 # step-by-step deploy guide for the worker
```

Contact info lives in a `#contact` section at the bottom of the homepage (not a separate page —
`contact.html` was deleted before the rewrite and never came back).

## How the application form works
`ApplicationForm.tsx` (controlled React form) calls `submitApplication()` from `src/api/apply.ts`,
which POSTs JSON to a hardcoded `APPLICATION_ENDPOINT` constant
(`https://asf-cargo-relay.afzaljon0411.workers.dev`). Field names in `ApplicationPayload`
(`src/types/index.ts`) are a **contract with `worker/worker.js`** — don't rename them without
updating that file too. That Worker fans the submission out to:
1. A Telegram chat via Bot API (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) — **working**
2. Email via Resend (`RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO`) — **not set up**; `worker.js`
   already calls `sendEmail()` unconditionally, so it just fails silently via
   `Promise.allSettled` until those three secrets are added in the Cloudflare dashboard. No code
   change needed to turn email on later.

## Open items / not yet built
- [ ] **Set the Cloudflare Build command to `npm run build`** on the `asf-cargo-website` Workers
      project (Settings → Build) — required after the React/Vite rewrite, was blank before because
      there was nothing to build. Was flagged to the user right after the rewrite; confirm it's
      actually been done before trusting that a `main` push is live.
- [ ] Buy `asfcargollc.com` (via Cloudflare Registrar, ~$9–10/yr) and attach it to the
      `asf-cargo-website` Worker's Domains tab
- [ ] Lock down CORS in `worker/worker.js` (`Access-Control-Allow-Origin: "*"` → the real domain)
      once the domain above is live — currently anyone can call the relay from any site
- [ ] Add Resend email secrets (see above) if email notifications are wanted alongside Telegram
- [ ] Driver testimonials — none provided yet, don't fabricate; add once client sends real ones
- [ ] Equipment photos — currently text-only equipment cards, no truck photos yet
- [ ] Flatbed section — currently marked "Coming Soon"; flip to active once client confirms
- [ ] Benefits detail (health insurance, home time, bonuses) — not specified yet, currently
      omitted rather than guessed at
- [ ] Resume/CDL photo upload on the application form — not built, was floated as a future idea

## Guardrails for future work
- Don't invent statistics, benefits, awards, or testimonials that weren't provided by the client.
- Keep lane detail state-level only on public pages (client's explicit instruction — full
  city-to-city detail is not for public display).
- Keep the visual language consistent with the design tokens above rather than introducing new
  color/type choices per page.
- When testing UI changes locally, use a real browser check (e.g. Playwright screenshot), not
  just a visual code read — this project has hit real bugs (illegible logo, reveal animations
  not firing) that only showed up when actually rendered.
- Before pushing to `main`: it auto-deploys the live site immediately, no staging step. Verify
  locally first (`npm run build && npm run preview` inside `asf-cargo/`, not just `npm run dev`).
- Business copy lives in `src/data/content.ts` — edit there, not scattered across components.
