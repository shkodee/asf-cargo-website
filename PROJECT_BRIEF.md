# ASF Cargo LLC — Website Project Brief

> **Read this file first.** It's the continuity doc for this project — written so an agent
> (or you, on a new device) can pick up exactly where things left off without re-reading the
> whole conversation history. Keep it current: whenever a decision is made or something ships,
> update the relevant section here, not just in chat.

## Current status (as of 2026-07-15, end of session)
- ✅ Site is **live and auto-deploying**: https://asf-cargo-website.afzaljon0411.workers.dev, plus
  the custom domain (see below) — all three URLs confirmed serving.
- ✅ Rebuilt as **React + TypeScript + Vite** — Cloudflare Build command (`npm run build`) is
  confirmed working (multiple successful pushes deployed correctly after it was set).
- ✅ Driver application form → Telegram relay is **working**, including the co-driver section
  (verified live 2026-07-15 after the relay worker was redeployed with current code).
- ✅ Contact info lives in a homepage section (`#contact`), not a separate page.
- ✅ Full responsive pass done across phone/tablet/laptop/desktop (see "Responsive fixes" below)
  — audited at 10 real device widths, zero horizontal-overflow issues remaining.
- ✅ **Co-driver info on the application form**, including email/city fields and visible
  validation — see its own section below. Fully working end-to-end, verified live.
- ✅ **Custom domain live**: `asfcargollc.com` and `www.asfcargollc.com` both attached to the
  `asf-cargo-website` Worker and confirmed serving (2026-07-15) — see "Infrastructure & accounts".
- ✅ **CORS locked down** on the relay Worker — only the site's own origins can call it now.
- ✅ **Wrangler CLI is now authenticated on this machine** (`wrangler login` completed
  2026-07-15) — both Workers can be deployed directly from the CLI going forward, no more
  manual dashboard paste-and-deploy for `asf-cargo-relay`. See "Infrastructure & accounts".
- ✅ **Antispam honeypot**, **city/state autocomplete**, **Google Jobs JSON-LD**, **OG/Twitter
  tags**, and a **custom 404 page** all shipped this session — see TODO.md for details on each.
- ✅ **Equipment photos** added to the Power-Only/Dry Van/Flatbed cards (`public/truck.png`,
  `van.png`, `flatbed.png`) — see "Design system" note below on the mismatched-casing bug this hit.
- ✅ **`robots.txt` + `sitemap.xml`** added to `public/` — helps crawlers discover both pages
  faster on this brand-new domain. Google indexing itself still needs Search Console
  verification + "Request Indexing" (a Google-account action, not something doable from this repo).
- ✅ **Lane route map** added to the Lanes section (`src/components/home/LaneMap.tsx`), sitting
  above the existing dispatch-board table, not replacing it — see "Lane map" section below for
  how it's built and what to know before touching it again.
- ✅ **Telegram relay rebuilt as a full admin bot** (2026-07-15) — no longer a one-way post to a
  group; now DMs a managed team (Owner/Admin/Member roles) individually, and the bot itself
  supports `/start`, `/whoami`, `/addadmin`, and an inline panel (manage team, pause/resume,
  stats, **and now lanes**). See "Telegram admin bot" section below — this is a meaningfully
  different architecture from the original relay, worth reading before touching `worker/worker.js`
  again.
- ✅ **Lanes are now live-editable from the bot** (2026-07-15) — the `🛣 Lanes` panel button adds
  (with automatic geocoding), removes, and lists lanes; the site fetches the current list from
  `GET /lanes` at runtime instead of a static import, so a bot edit shows up on next page load, no
  redeploy. See "Lane management via the Telegram bot" below. **Caught and fixed a real privacy
  bug along the way**: the first version of that endpoint leaked exact city names publicly,
  violating the state-level-only rule — the auto-mode safety classifier blocked that deploy.
- ✅ **Aurora background added to the hero** (2026-07-15) — a slow-drifting animated red/navy
  gradient effect (`.aurora-bg` in `components.css`, rendered as a child div in `Hero.tsx`), sits
  behind the existing content and grid-line texture, masked to fade from the top-right. Pure CSS,
  no new dependency. Previewed live first via an Artifact (with an intensity toggle) before
  building — client picked "Medium" intensity; the CSS's `opacity: 0.55` on `.aurora-bg::before`/
  `::after` is that value if it ever needs adjusting.
- 🎬 **Equipment scroll animation — in progress, blocked on an external video.** User is having
  another AI generate a reference video (truck rolls in, van/flatbed take turns attaching to it
  as you scroll) from a prompt we wrote together; once that video comes back, the next step is
  translating its timing into a real GSAP ScrollTrigger implementation on the Equipment section.
  No code for this exists yet — don't start building it without the reference video or explicit
  go-ahead, since the phase timing/positions are meant to come from what that video actually shows.
- ⏳ **Not done yet:** Resend email, Cloudflare Web Analytics (needs a dashboard-generated token
  — no CLI path for this), CDL photo upload (deliberately deferred, needs R2), and content items
  that need client input (see "Open items" below).

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
| Deploy method | Auto, via GitHub integration (push to `main`) | **Via `wrangler deploy`** from `asf-cargo/worker/` (as of 2026-07-15 — dashboard paste still works as a fallback, see `worker/README.md`) |
| Config | `asf-cargo/wrangler.jsonc` (static assets from `./dist`, root dir `asf-cargo`, deploy command `npx wrangler deploy`, build command `npm run build`, `workers_dev: true`, `routes` with `custom_domain: true` for the apex + `www`) | `asf-cargo/worker/wrangler.jsonc` (added 2026-07-15 — deliberately separate from the site's config one directory up, so a deploy from `worker/` never picks up the site's `dist/` assets by accident; also binds the `ASF_BOT_KV` KV namespace the Telegram bot's team/state live in, see "Telegram admin bot") |

**Wrangler CLI is authenticated on this machine** (ran `wrangler login` 2026-07-15, browser OAuth
flow). To redeploy either Worker from a fresh session: `cd` into `asf-cargo/` (site) or
`asf-cargo/worker/` (relay) and run `npx wrangler deploy`. Run `npx wrangler deploy --dry-run`
first if unsure — it shows a diff against the live config before anything changes.

**⚠️ Lesson learned 2026-07-15, important for any future relay redeploy:** `wrangler deploy` is
fully authoritative over plain **vars** declared (or not declared) in `wrangler.jsonc` — anything
not listed there gets **deleted** from the live Worker on deploy, even if it was previously set
via the dashboard. This bit us once: `TELEGRAM_CHAT_ID` had been added as a plain dashboard
"variable" rather than a "secret," and the first CLI deploy of `worker.js` silently wiped it
(caught immediately via `wrangler tail` + a live test, restored via `wrangler secret put`). It's
now a proper secret, which `wrangler deploy` never touches regardless of what's in the config.
**Always add new Worker config with `wrangler secret put NAME`, never as a plain dashboard
variable**, unless it's genuinely non-sensitive and you're prepared for it to require explicit
declaration in `wrangler.jsonc` forever after.

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

**Domain:** ✅ **Purchased and attached** — `asfcargollc.com`, bought via Cloudflare Registrar on
2026-07-14, attached to the `asf-cargo-website` Worker on 2026-07-15 via `routes` with
`custom_domain: true` in `asf-cargo/wrangler.jsonc` (both apex and `www`). All three URLs
confirmed live: `https://asfcargollc.com`, `https://www.asfcargollc.com`, and the original
`https://asf-cargo-website.afzaljon0411.workers.dev`. (`www` took a few minutes to resolve after
attaching — that's normal Cloudflare DNS/SSL provisioning lag, not a bug, if it recurs elsewhere.)
CORS lock-down in `worker/worker.js` is also done — see TODO.md.

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

## Responsive fixes (2026-07-14 session)
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

## Lanes: live data + map (Lanes section)
**As of 2026-07-15, lanes are no longer static.** They're managed live from the Telegram bot
(see "Lane management via the Telegram bot" below) and stored in the relay Worker's KV — the
site fetches them at runtime via `GET /lanes` on `asf-cargo-relay`, instead of importing a
build-time array. A bot edit shows up on the site's *next page load*, no rebuild/redeploy needed.

- **`src/hooks/useLanes.ts`** — fetches `GET https://asf-cargo-relay.afzaljon0411.workers.dev/lanes`
  on mount. Starts with `content.ts`'s static `lanes`/`cityCoordinates`/`laneCities` as a fallback
  (shown immediately, and kept if the fetch ever fails), then replaces it with the live response.
  Used by both `Hero.tsx` (the "N daily lanes" badge) and `DispatchBoardSection.tsx` (table + map),
  so there are two independent fetches per page load — acceptable at this data size/volume, not
  worth the complexity of lifting one shared fetch through `HomePage.tsx`.
- **`content.ts`'s static `lanes`/`cityCoordinates`/`laneCities`** are now purely the *fallback*
  data, not the source of truth — editing them no longer changes what's actually live on the site
  once the bot's KV data loads. They still matter for: the brief pre-fetch flash, and as the
  reference data the relay Worker's KV was originally seeded with.
- **`Lane` type** (`src/types/index.ts`) grew optional `originCoords`/`destCoords` (and
  `originCity`/`destCity`, present on the static fallback and in the bot's own messages, but
  **deliberately never sent by the public `GET /lanes` API** — see the guardrail below).

**`LaneMap.tsx` architecture (rewritten to be data-driven, not static-import-driven):**
- All point/arc computation (`useLaneMapData`) is a `useMemo` keyed on the `lanes` prop, not a
  module-level constant — it has to recompute whenever the live fetch replaces the fallback data.
- Map points are keyed by **coordinate string** (`"lng,lat"`), not city name — this was a direct
  consequence of the privacy fix below: once the public API stopped sending city text, the map's
  internal point-deduplication/targeting couldn't rely on city names being present anymore.
- Map/style setup happens once (`useEffect` with `[]` deps, sources seeded empty); a second effect
  keyed on `[ready, lanes, uniqueCityPoints, arcCoordinatesByIdx, selectedLaneIdx]` calls
  `.setData()` on the existing sources and re-applies the current selection — this is what makes
  the map redraw when live data arrives after the fallback's initial paint. The very first
  auto-fit-bounds is instant (`duration: 0`, tracked via a `hasFramedRef`); every fitBounds after
  that (lane clicks, the reset button) is animated as before.
- Everything else about the map (dark Carto basemap, dashed low-opacity arcs by default,
  click-to-focus with bold arc + zoom + PU/DEL color-coded dots + direction arrow, drag-pan +
  Ctrl/Cmd-scroll-to-zoom) is unchanged from the earlier interactive-map work.

**⚠️ Guardrail that actually got caught by the auto-mode safety classifier, not by us — worth
internalizing:** the first version of the `GET /lanes` endpoint returned each lane's full KV
object, including `originCity`/`destCity` (e.g. `"Memphis, TN"`) as plain JSON text. That's a
direct violation of the client's explicit, previously-established instruction that lane detail is
**state-level only on public pages** — and a JSON API at a guessable URL is a far easier thing for
someone to scrape on an ongoing basis than the same data sitting inside a minified JS bundle. The
classifier blocked the deploy specifically on this. **Fixed:** `handleGetLanes()` in `worker.js`
strips `originCity`/`destCity` before responding — the public API only ever sends
`{ idx, origin, dest, status, originCoords, destCoords }`. City text still exists in KV and in the
bot's own Telegram messages (private, admin-only, not "public pages"), just never over the wire to
the website. **If this endpoint is ever touched again, re-verify the response has no city
substrings before deploying** — it's easy to reintroduce by naively spreading the KV lane object.

**Known tooling gotcha (not a site bug, from earlier map work):** this component's canvas render
came back as a solid black box when checked with headless Chrome's `chrome --headless=new
--screenshot` CLI flag, even with software WebGL flags. It renders correctly — confirmed via
Playwright (real Chromium automation). If a WebGL/canvas element on this site ever looks blank in
a `chrome --screenshot` check again, reach for Playwright to verify before assuming it's broken.

## Lane management via the Telegram bot
Owners/Admins (not Members — same panel-access rule as team management) can add, remove, and see
all lanes straight from the bot, no code change needed for a routine lane change:

- **`🛣 Lanes` button** in the main panel — lists every lane as a tappable row
  (`#idx  origin → dest  (status)`); tapping one opens a **detail view** for that lane with
  `✏️ Change Status` and `🗑 Remove Lane`, plus `+ Add Lane` and `« Back` in the list view itself.
  (Originally shipped as one flat list with an inline remove button per lane — redesigned same-day
  per feedback into list → detail → action, described next.)
- **Removing a lane requires two taps, not one**: `🗑 Remove Lane` → a confirmation screen
  (`⚠️ Remove lane #.. ?`) with `✅ Yes, remove it` / `✕ Cancel` → only the "Yes" tap actually
  deletes. Nothing is destructive on the first tap anywhere in this flow.
- **`+ Add Lane`** starts a short conversation (state tracked in KV under `pending:<telegramId>`,
  auto-expires after 10 minutes so an abandoned flow doesn't linger): send the origin as
  `'City, ST'` → bot geocodes it via **OpenStreetMap's free Nominatim API** (no key, ~1 req/sec
  limit, a real identifying `User-Agent` is required by their usage policy — see
  `geocodeCity()`) → same for the destination → tap a status button (Daily/Weekly/Paused) or just
  type a custom status. On success the lane's assigned the next sequential `idx` and saved to KV.
- **Nominatim can't find every address** — very small towns sometimes return nothing; the bot
  reports failure and lets the admin retry with a different phrasing, it doesn't silently guess.
- **`getLanes`/`saveLanes`** in `worker.js` are the KV read/write pair (key: `"lanes"`, one JSON
  array, same shape as the seed data below). `nextLaneIdx()` picks the next `idx` by taking the
  current max and adding one — not `lanes.length + 1`, so it stays correct even after removals.

## Telegram admin bot (`worker/worker.js`)
Rebuilt 2026-07-15 from a one-way group-post relay into a real Telegram bot with a
managed team and an inline admin panel. **This repo's public on GitHub — don't ever
commit real people's numeric Telegram chat IDs into this file or any tracked file;**
they live only in Cloudflare KV, never in git.

**Three routes in one Worker** (`worker/worker.js`'s top-level `fetch` dispatches by
`pathname`):
- `POST /` — the application form's relay endpoint (unchanged contract, CORS-protected)
- `POST /telegram-webhook` — Telegram delivers bot updates (messages, button taps)
  here; verified via the `X-Telegram-Bot-Api-Secret-Token` header matching
  `TELEGRAM_WEBHOOK_SECRET`, so nobody else can inject fake bot commands
- `GET /setup-webhook?secret=...` — one-time endpoint (protected by `SETUP_SECRET`)
  that tells Telegram where to send updates and registers the `/` command list.
  Normally never needs re-running after initial setup.

**State lives in a Cloudflare KV namespace** (`ASF_BOT_KV`, bound in
`worker/wrangler.jsonc`), not a static secret — this is what lets the bot manage its
own team live, no redeploy required:
- `admins` — JSON array of `{ id, role, addedBy, addedAt }`. This is the actual
  source of truth for who gets DMed on a new application (`sendTelegram()` in
  `worker.js` reads this, not any env var).
- `paused` — `"1"`/`"0"`, toggled by the Pause/Resume button; only affects the
  Telegram DM step, the form and email still work while paused.
- `applications` — capped array (last 1000) of ISO timestamps, one per legitimate
  (non-honeypot) form submission, powers the Stats view.
- `profile:<id>` — cached `{ username, firstName }` per Telegram user, captured
  opportunistically on every message/button tap. This is the *only* way the bot
  ever learns someone's username — `/addmember` only ever gets a numeric ID, and
  Telegram has no general "look up a stranger's username" API — so a brand-new
  person's name won't show in the team list until they've messaged the bot at
  least once.

**Role model** — three tiers, stored per-person in the `admins` KV array:
| Role | Panel access | Gets notifications | Removable via 👥 Team panel |
|---|---|---|---|
| Owner | Full | Yes | Yes |
| Admin | Full (**identical** to Owner — deliberate, client's explicit call) | Yes | **No — protected, see below** |
| Member | None | Yes | Yes |

`/addmember <id>` (Owner/Admin only — command renamed same-day from `/addadmin`, since it adds
*any* role, not just admins; the role is chosen via buttons after, never a command argument) walks
through an inline-button role picker (Owner / Admin / Member) — buttons over typed args, per the
client's preference where the option set is small and fixed.

**Admins can't be removed from the 👥 Team panel by anyone, Owner included** — client instruction,
added same-day. `buildAdminsView()` simply omits the remove button for any `role === "admin"`
entry, and `admin:remove:` has a matching server-side check that rejects removing an admin even if
that callback were ever triggered another way — the UI hiding and the server guard are two
separate places, **keep both in sync** if this policy ever changes. Owner and Member rows are
unaffected and still removable normally.

**Two real bugs hit and fixed this session, worth knowing about if this file gets
touched again:**
1. **Telegram won't let a bot DM someone who hasn't messaged it first** — not a bug
   in this code, a platform rule. Fails with `403: Forbidden: bot can't initiate
   conversation with a user`. There is no workaround; the person has to send the
   bot literally anything (e.g. `/start`) once. `sendTelegram()`'s fan-out treats
   this as a per-recipient failure (logged, not fatal) as long as at least one
   admin/owner/member successfully receives the DM.
2. **Literal `<...>` in any Telegram message text breaks `parse_mode: "HTML"`** —
   Telegram's HTML parser treats it as an attempted (invalid) tag and rejects the
   *entire* message with `400: can't parse entities`, which silently no-ops
   whatever button/action triggered it (looks exactly like "the button doesn't
   work"). Use square brackets for placeholder text instead (e.g. `/addadmin [id]`,
   never `/addadmin <id>`) — this file has already been audited and fixed once, but
   double-check any new message text added later.

**Legacy secrets no longer used, safe to eventually delete from the Worker's
dashboard:** `TELEGRAM_CHAT_ID` (original single-group-chat version) and
`TELEGRAM_ADMIN_CHAT_IDS` (intermediate static-list version, superseded by the KV
`admins` array). Neither is read by the current code; both were left in place
rather than deleted mid-session to avoid any risk to the working bot.

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
  Telegram message when present, including `coDriverEmail` and `coDriverCity`. **Deployed and
  verified live 2026-07-15** — a test submission with full co-driver info landed in Telegram
  with the complete co-driver section. This worker is now deployable via `wrangler deploy` from
  `asf-cargo/worker/` (see "Infrastructure & accounts"), not just manual dashboard paste.
- **Form now has visible validation** (`ApplicationForm.tsx`): `firstName`, `lastName`, `phone`
  show a red border + inline error message on failed submit instead of relying solely on native
  HTML5 `required`. Co-driver block also gained `coDriverEmail`/`coDriverCity` fields, mirroring
  the primary applicant's `email`/`city`.

## File structure
```
c:\asf-cargo-website\            # git repo root
├── PROJECT_BRIEF.md              # this file
├── TODO.md                       # bug/feature backlog — check here for what's actionable next
├── README.md                     # short public-facing repo readme
├── .gitignore
└── asf-cargo/                    # everything actually deployed as the site (Vite project root)
    ├── index.html                 # Vite entry: homepage — div#root + script src="/src/main.tsx"; also carries JobPosting JSON-LD + OG/Twitter tags
    ├── apply.html                 # Vite entry: application form — div#root + script src="/src/apply-main.tsx"; also carries OG/Twitter tags
    ├── 404.html                   # Vite entry: not-found page — div#root + script src="/src/notfound-main.tsx"
    ├── package.json / vite.config.ts / tsconfig*.json
    ├── wrangler.jsonc              # Cloudflare Workers static-assets config — assets.directory: "./dist"
    ├── public/
    │   ├── logo.png                 # bordered/transparent badge, user-supplied, served at /logo.png
    │   ├── truck.png / van.png / flatbed.png   # equipment card photos, user-supplied
    │   ├── robots.txt               # points crawlers at sitemap.xml
    │   └── sitemap.xml              # lists / and /apply.html
    ├── dist/                       # BUILD OUTPUT, gitignored — what actually gets deployed
    ├── src/
    │   ├── main.tsx / apply-main.tsx / notfound-main.tsx   # entry points, one per HTML page
    │   ├── pages/HomePage.tsx, ApplyPage.tsx, NotFoundPage.tsx
    │   ├── layouts/SiteLayout.tsx       # Header + ScrollProgressBar + children + Footer
    │   ├── components/
    │   │   ├── layout/                    # Header.tsx, Footer.tsx, ScrollProgressBar.tsx
    │   │   ├── UI/                         # Button.tsx, SectionHeading.tsx, Reveal.tsx
    │   │   ├── home/                       # Hero, PayCard(+Section), DispatchBoard(+Section), LaneMap, LaneRow, EquipmentCard(+Section), RequirementItem, RequirementsSection, ContactCard(+Section), CtaBand
    │   │   └── apply/ApplicationForm.tsx     # includes the co-driver block, see above
    │   ├── hooks/useScrollReveal.ts, useLanes.ts   # useLanes fetches live lane data from the relay Worker
    │   ├── api/apply.ts                 # submitApplication() — POSTs to the relay Worker, contract with worker/worker.js
    │   ├── types/index.ts
    │   ├── data/content.ts               # ALL business copy lives here — single source of truth (lanes are now the *fallback* only, see "Lanes: live data + map")
    │   └── styles/                       # variables.css, base.css, animations.css, layout.css, components.css, index.css (imports all 5)
    └── worker/                     # NOT part of the Vite build — separate Worker
        ├── worker.js                 # Cloudflare Worker: relays form POST → Telegram + Resend email; honeypot check + CORS allow-list + delivery-failure logging live here
        ├── wrangler.jsonc             # relay worker's own deploy config (added 2026-07-15) — keeps `wrangler deploy` here scoped to just worker.js
        └── README.md                 # step-by-step deploy guide — CLI path (preferred) + dashboard fallback
```

## How the application form works
`ApplicationForm.tsx` (controlled React form) calls `submitApplication()` from `src/api/apply.ts`,
which POSTs JSON to a hardcoded `APPLICATION_ENDPOINT` constant
(`https://asf-cargo-relay.afzaljon0411.workers.dev`). Field names in `ApplicationPayload`
(`src/types/index.ts`, including the co-driver fields) are a **contract with `worker/worker.js`**
— don't rename them without updating that file too. That Worker fans the submission out to:
1. Telegram DMs to the whole team via the bot (`TELEGRAM_BOT_TOKEN` + the `admins` list in KV —
   see "Telegram admin bot" below) — **working**
2. Email via Resend (`RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO`) — **not set up**; `worker.js`
   already calls `sendEmail()` unconditionally, so it just fails silently via
   `Promise.allSettled` until those three secrets are added in the Cloudflare dashboard. No code
   change needed to turn email on later.

**Honeypot antispam (added 2026-07-15):** `ApplicationPayload.website` is a hidden field real
users never see (off-screen positioned, not `display:none`, so bots checking computed style still
fall for it). If it's non-empty, both the client (`ApplicationForm.tsx`) and the server
(`worker.js`) pretend success without actually relaying to Telegram/email — don't be alarmed if a
test submission with that field populated doesn't show up anywhere, that's correct behavior, not
a bug.

## Open items / not yet built
**See `TODO.md` for the full, actively-maintained backlog** (bugs, features, content needed from
client). As of 2026-07-15, both previously-urgent items (relay worker redeploy, domain attach)
are done and verified live. What's left:
- [ ] Cloudflare Web Analytics — needs a dashboard-generated token, no CLI path for it.
- [ ] CDL photo/document upload — deliberately deferred, needs an R2 bucket (new infra).
- [ ] Resend email secrets, if email alongside Telegram is wanted.
- [ ] Content-dependent items (testimonials, equipment photos, benefits detail, flatbed
      activation, a proper 1200×630 OG image) — all need client input, see TODO.md.

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
- When redeploying either Worker via `wrangler deploy`, run `--dry-run` first and read the config
  diff it prints — plain `vars` not declared in `wrangler.jsonc` get silently deleted from the
  live Worker on deploy (secrets don't have this problem). This actually happened once, see
  "Infrastructure & accounts" → the `TELEGRAM_CHAT_ID` incident.
- `node`/`npm`/`npx` aren't on PATH in a fresh shell on this machine, even though Node is
  installed at `C:\Program Files\nodejs`. Add it to PATH per-session
  (PowerShell: `$env:Path += ";C:\Program Files\nodejs"`; Bash: `export PATH="$PATH:/c/Program Files/nodejs"`)
  rather than assuming `node --version` will just work.
