# ASF Cargo LLC — Website Project Brief

> **Read this file first.** It's the continuity doc for this project — written so an agent
> (or you, on a new device) can pick up exactly where things left off without re-reading the
> whole conversation history. Keep it current: whenever a decision is made or something ships,
> update the relevant section here, not just in chat.

## Current status (as of 2026-07-14, end of session)
- ✅ Site is **live and auto-deploying**: https://asf-cargo-website.afzaljon0411.workers.dev
- ✅ Rebuilt as **React + TypeScript + Vite** — Cloudflare Build command (`npm run build`) is
  confirmed working (multiple successful pushes deployed correctly after it was set).
- ✅ Driver application form → Telegram relay is **working** (many test submissions confirmed
  delivered, including through the React rebuild).
- ✅ Contact info lives in a homepage section (`#contact`), not a separate page.
- ✅ Full responsive pass done across phone/tablet/laptop/desktop (see "Responsive fixes" below)
  — audited at 10 real device widths, zero horizontal-overflow issues remaining.
- ✅ **New feature: co-driver info on the application form** — see its own section below.
  **⚠️ Needs a manual step to fully work — see "Open items."**
- ⏳ **Not done yet:** custom domain purchase, CORS lock-down (blocked on the domain), Resend
  email, manual worker.js redeploy for co-driver Telegram output, and content items that need
  client input (see "Open items" below).

## What this is
A recruiting/informational website for a trucking company, built to attract CDL-A drivers
(solo and team) and take applications online. React + TypeScript + Vite, built to static assets
and deployed on Cloudflare Workers. Reference sites used for inspiration: summitttrucking.com
and eosolutionsinc.com.

## Architecture
React + TypeScript, built with Vite in **multi-page mode** (two HTML entry points — `index.html`
for the homepage, `apply.html` for the application form — each mounting its own React root via
`src/main.tsx` / `src/apply-main.tsx`). **No `react-router`** — deliberately, since there are only
2 real pages plus in-page anchors (`#lanes`, `#equipment`, `#requirements`, `#contact`); a router
would add a dependency for no benefit. **No Sass** — plain CSS split by concern under `src/styles/`
(`variables.css` → `base.css` → `animations.css` → `layout.css` → `components.css`, imported once
via `src/styles/index.css`), since the design tokens were already CSS custom properties.

Build output goes to `asf-cargo/dist/` (gitignored, not committed — Cloudflare builds it fresh
on every deploy):
- `asf-cargo/wrangler.jsonc` → `assets.directory` points at `./dist`.
- Cloudflare dashboard (Workers project `asf-cargo-website` → Settings → Build): **Build command
  is set to `npm run build` and confirmed working.** Path/Root directory (`asf-cargo`) and Deploy
  command (`npx wrangler deploy`) are the defaults, unchanged.

**Known accepted trade-off:** the old static site showed full content even if JS failed to load
(only animations depended on JS — progressive enhancement). A React CSR app ships `<div id="root">`
in the HTML, so a JS failure now means a blank page. User explicitly accepted this as normal-for-
React rather than adding prerendering/SSG to avoid it — don't "fix" this without asking first.

`src/data/content.ts` is the single source of truth for business copy (lanes, pay tiers,
equipment, requirements, contact info, phone numbers). Edit content there, not in component files.

## Infrastructure & accounts
This project spans two separate Cloudflare Workers under one Cloudflare account
(`afzaljon0411@gmail.com`) — don't confuse them:

| | **Site** | **Form relay** |
|---|---|---|
| Purpose | Serves the React build | Receives form POST, forwards to Telegram/email |
| Cloudflare Worker name | `asf-cargo-website` | `asf-cargo-relay` |
| URL | https://asf-cargo-website.afzaljon0411.workers.dev | https://asf-cargo-relay.afzaljon0411.workers.dev |
| Deploy method | Auto, via GitHub integration (push to `main`) | **Manual** (pasted into Cloudflare's inline code editor — not GitHub-connected) |
| Config | `asf-cargo/wrangler.jsonc` (static assets from `./dist`, root dir `asf-cargo`, deploy command `npx wrangler deploy`, build command `npm run build`) | No wrangler config — deployed via Cloudflare dashboard's inline editor |

**GitHub repo:** https://github.com/shkodee/asf-cargo-website (public, owner `shkodee`).
Local repo root is `c:\asf-cargo-website` (one level above `asf-cargo/`, so it also contains this
brief and `.gitignore`). Git identity on the machine that set this up: `Afzaljon` /
`afzaljon0411@email.com`. Push auth uses Windows Git Credential Manager — on a **new device**,
the first `git push` will prompt a fresh GitHub browser login. **User has successfully pushed
directly themselves** (not just through an agent) — e.g. the "Replased logo" commits.

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
- **Office phone:** +1 (412) 588-1575
- **Dispatch phone:** +1 (412) 588-1683
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
- Hero copy describes freight as running "across the U.S." with East Coast ↔ Midwest as an
  example of the round-trip pattern — deliberately not implying that's the *only* route, and
  never naming specific states/cities beyond the lane board (see Guardrails).

## Design system
- **Palette:** Navy `#0c1c34` / `#142c50` / `#1d3a68` (primary), Red `#c41230` / `#8c0d22` (accent), Cream `#f3efe6` (light bg), Steel `#5b6774`, Ink `#0a1220` (dark bg), Chrome `#aeb8c2`
- **Type:** Display = Bebas Neue (poster/signage feel matching the badge logo), Body = Inter, Utility/mono = IBM Plex Mono (used for the "dispatch board" and data-like labels)
- **Signature element:** the "Live Lanes" dispatch board on the homepage — lanes styled like a manifest/dispatch terminal (dark background, monospace, pulsing "active" dot). This is the one distinctive visual idea; keep future additions consistent with it rather than introducing a second unrelated gimmick.
- **Logo:** `public/logo.png` — circular badge, American flag + Kenworth-style truck + "ASF CARGO" wordmark, with a bold black rounded outline (flat-emblem style) and a genuinely transparent background (500×500 RGBA). **User replaced the logo file themselves** (pushed directly via git, commits "Replased logo") after an AI background-removal attempt on the old asset badly mangled it (stripped the wordmark and most of the flag circle) — that attempt was reverted; the current file is the user's own asset, not AI-generated. Displays cleanly on navy backgrounds (header/hero/footer) with no visible box, because unlike the old cropped-but-opaque version, this one has real alpha transparency.
- **Motion:** scroll-reveal fade-up on section headings/cards/lane rows (`.reveal`/`.in-view` classes, driven by the `useScrollReveal` hook in `src/hooks/useScrollReveal.ts`, wrapped for convenience by `src/components/UI/Reveal.tsx`), hero content fades in on load (`.hero-anim`, pure CSS), header gains a shadow after scrolling, thin scroll-progress bar at the very top of the viewport. Hero logo shadow uses `filter: drop-shadow(...)` (shape-aware, follows alpha) rather than `box-shadow` (rectangular) — matters now that the logo has real transparency. All motion respects `prefers-reduced-motion`.

## Responsive fixes (this session)
Audited all pages at 10 real device widths (320/375/390/428 phones, 768/820 tablet portrait,
1024 tablet landscape, 1280/1440/1920 laptop/desktop) — found and fixed real bugs, not
hypothetical ones:
- **Nav breakpoint raised 900px → 1120px.** The full desktop nav (bigger 72px logo, 5 links,
  phone, button) didn't actually fit until ~1120px; at 1024px (common tablet-landscape/small-
  laptop width) "Contact" and the phone number were colliding and wrapping.
- **Header "Apply Now" button hidden below 420px** (persistent header button collided with
  brand text at the smallest phone widths); an equivalent link was added inside the mobile menu
  so it's still reachable.
- **Mobile menu redesigned** from a full-viewport `position:fixed; inset:0` overlay (covered the
  entire screen regardless of content) to a compact dropdown anchored to the header's bottom edge
  (`position:absolute` against `header.site`'s sticky containing block, `max-height:80vh` +
  scroll). Apply Now moved to the top of that menu and centered properly.
- **`.btn` text-align/justify-content: center added** — any button whose label wraps to two
  lines (e.g. a cramped header button) was left-aligning the wrapped text since `.btn` never set
  this explicitly.
- **Anchor-link scroll fixed**: clicking Lanes/Equipment/Requirements/Contact in the nav used to
  land the section flush against the sticky header, hiding the eyebrow label behind it. Fixed
  with `scroll-padding-top` on `html` (in `base.css`).

## Co-driver feature (application form)
When **Team Driver** is selected as Position, a consolidated block appears (Position, "Do you
have a co-driver?", and — if "I already have one" — co-driver info fields) positioned right
before the "Anything we should know?" message field. This went through several rounds of
placement feedback before landing here — **don't move it again without being asked**, this is
the confirmed final layout.

- New `ApplicationPayload` fields (`src/types/index.ts`): `hasCoDriver`, `coDriverFirstName`,
  `coDriverLastName`, `coDriverPhone`, `coDriverCdlNumber`, `coDriverCdlState`,
  `coDriverExperience`.
- `coDriverOptions` in `src/data/content.ts`: `['I already have a co-driver', 'I need to be
  paired with a co-driver']`.
- Fields auto-clear (`ApplicationForm.tsx`'s `updatePosition`/`updateHasCoDriver`) when the
  applicant switches away from Team Driver or toggles the co-driver answer, so stale hidden data
  never gets submitted.
- **`worker/worker.js`'s `buildSummary()` was updated** to include co-driver details in the
  Telegram message when present. **This file is deployed manually, not via GitHub** — the update
  was pushed to the repo but the user was told to re-paste the file into Cloudflare's inline
  editor for `asf-cargo-relay` and **had not yet confirmed doing so** as of end of session. Check
  this before assuming co-driver info actually reaches Telegram — if a co-driver test submission
  doesn't show co-driver details in Telegram, this is why.

## File structure
```
c:\asf-cargo-website\            # git repo root
├── PROJECT_BRIEF.md              # this file
├── TODO.md                       # bug/feature backlog — check here for what's actionable next
├── README.md                     # short public-facing repo readme
├── .gitignore
└── asf-cargo/                    # everything actually deployed as the site (Vite project root)
    ├── index.html                 # Vite entry: homepage — div#root + script src="/src/main.tsx"
    ├── apply.html                 # Vite entry: application form — div#root + script src="/src/apply-main.tsx"
    ├── package.json / vite.config.ts / tsconfig*.json
    ├── wrangler.jsonc              # Cloudflare Workers static-assets config — assets.directory: "./dist"
    ├── public/
    │   └── logo.png                 # bordered/transparent badge, user-supplied, served at /logo.png
    ├── dist/                       # BUILD OUTPUT, gitignored — what actually gets deployed
    ├── src/
    │   ├── main.tsx / apply-main.tsx   # entry points, one per HTML page
    │   ├── pages/HomePage.tsx, ApplyPage.tsx
    │   ├── layouts/SiteLayout.tsx       # Header + ScrollProgressBar + children + Footer
    │   ├── components/
    │   │   ├── layout/                    # Header.tsx, Footer.tsx, ScrollProgressBar.tsx
    │   │   ├── UI/                         # Button.tsx, SectionHeading.tsx, Reveal.tsx
    │   │   ├── home/                       # Hero, PayCard(+Section), DispatchBoard(+Section), LaneRow, EquipmentCard(+Section), RequirementItem, RequirementsSection, ContactCard(+Section), CtaBand
    │   │   └── apply/ApplicationForm.tsx     # includes the co-driver block, see above
    │   ├── hooks/useScrollReveal.ts
    │   ├── api/apply.ts                 # submitApplication() — POSTs to the relay Worker, contract with worker/worker.js
    │   ├── types/index.ts
    │   ├── data/content.ts               # ALL business copy lives here — single source of truth
    │   └── styles/                       # variables.css, base.css, animations.css, layout.css, components.css, index.css (imports all 5)
    └── worker/                     # NOT part of the Vite build — separate Worker, deployed manually
        ├── worker.js                 # Cloudflare Worker: relays form POST → Telegram + Resend email
        └── README.md                 # step-by-step deploy guide for the worker
```

## How the application form works
`ApplicationForm.tsx` (controlled React form) calls `submitApplication()` from `src/api/apply.ts`,
which POSTs JSON to a hardcoded `APPLICATION_ENDPOINT` constant
(`https://asf-cargo-relay.afzaljon0411.workers.dev`). Field names in `ApplicationPayload`
(`src/types/index.ts`, including the co-driver fields) are a **contract with `worker/worker.js`**
— don't rename them without updating that file too. That Worker fans the submission out to:
1. A Telegram chat via Bot API (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) — **working**
2. Email via Resend (`RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO`) — **not set up**; `worker.js`
   already calls `sendEmail()` unconditionally, so it just fails silently via
   `Promise.allSettled` until those three secrets are added in the Cloudflare dashboard. No code
   change needed to turn email on later.

## Open items / not yet built
**See `TODO.md` for the full, actively-maintained backlog** (bugs, features, content needed from
client). The single most urgent item, confirmed by a live test on 2026-07-14 (a co-driver
submission produced a Telegram message with no co-driver section at all):
- [ ] **Re-paste `worker/worker.js` into Cloudflare's inline editor for `asf-cargo-relay`** —
      code is already correct in the repo, just not deployed to the manually-managed Worker yet.

## Guardrails for future work
- Don't invent statistics, benefits, awards, or testimonials that weren't provided by the client.
- Keep lane detail state-level only on public pages (client's explicit instruction — full
  city-to-city detail is not for public display).
- Keep the visual language consistent with the design tokens above rather than introducing new
  color/type choices per page.
- When testing UI changes locally, use a real browser check (e.g. Playwright screenshot) at
  multiple widths, not just a visual code read or a single viewport — this project has hit real
  bugs (illegible logo, reveal animations not firing, nav collisions at specific tablet widths)
  that only showed up when actually rendered at the right size.
- Before pushing to `main`: it auto-deploys the live site immediately, no staging step. Verify
  locally first (`npm run build && npm run preview` inside `asf-cargo/`, not just `npm run dev`).
- Business copy lives in `src/data/content.ts` — edit there, not scattered across components.
- The co-driver block's placement in the apply form went through 4 rounds of user feedback before
  settling — treat its current position as deliberate, not a first draft.
- Before attempting any AI-based image editing on the logo again: it went badly once already
  (background remover stripped the wordmark). Get explicit confirmation before running automated
  tools on brand assets, and always preview the result before replacing the live file.
