# ASF Cargo Website — TODO / Bug Backlog

> Working backlog of bugs and features. For architecture/deploy/handoff context, see
> `PROJECT_BRIEF.md` — this file is just the punch list. Check items off (`- [x]`) as they ship,
> and pull items into a git commit message when done rather than leaving this stale.

## 🔴 Do first
*(empty — both items from the last session shipped this session, see below)*

## 🐛 Bugs
- [x] **Apply form: no visible validation on failed submit.** Fixed 2026-07-14 — `firstName`,
      `lastName`, `phone` now get a red border + inline error message on failed submit, clearing
      as soon as the applicant fixes that field. See `ApplicationForm.tsx`'s `validate()`/`errors`
      state and the `.field.invalid`/`.field-error` CSS rules.
- [x] **Co-driver section is missing an email field.** Fixed 2026-07-14 — added `coDriverEmail`
      (optional, mirrors primary `email`). Included in `worker.js`'s Telegram summary.
- [x] **Co-driver section is missing a current city/state field.** Fixed 2026-07-14 — added
      `coDriverCity` (mirrors primary `city`). Included in `worker.js`'s Telegram summary.
- [x] **`worker/worker.js` re-paste to `asf-cargo-relay`.** Fixed 2026-07-15 — redeployed via
      `wrangler deploy` from `asf-cargo/worker/` (new dedicated `wrangler.jsonc` there, see
      PROJECT_BRIEF). Verified end-to-end with a live co-driver test submission that landed in
      Telegram with the full co-driver section. **Note for future deploys:** this same deploy
      briefly wiped the `TELEGRAM_CHAT_ID` variable because it had been stored as a plain
      dashboard "variable" rather than a "secret" — plain vars are fully owned by whatever
      `wrangler deploy` last declared, so any not listed get deleted. It's now stored as a proper
      secret, which isn't affected by this. Always use `wrangler secret put NAME`, never a plain
      var, for anything that must survive a deploy.

## ✅ Infrastructure (shipped 2026-07-15)
- [x] **Attach `asfcargollc.com` to the `asf-cargo-website` Worker.** Done via `wrangler deploy`
      with `custom_domain: true` routes in `asf-cargo/wrangler.jsonc` for both the apex and `www`.
      Both resolve and serve the site; `workers.dev` URL still works too (explicitly pinned with
      `workers_dev: true` so a future deploy can't silently disable it again).
- [x] **CORS lock-down in `worker.js`.** `Access-Control-Allow-Origin: "*"` replaced with an
      allow-list (`asfcargollc.com`, `www.asfcargollc.com`, the `workers.dev` URL) that echoes
      back only when the request's `Origin` matches. Verified: allowed origins get the header,
      arbitrary origins (e.g. `evil.com`) get refused.
- [x] **Honeypot antispam field.** Hidden `website` field in the apply form — real users never
      see it (positioned off-screen, not `display:none`, so it still fools bots that check
      computed style). Client-side pretends success if filled; `worker.js` also checks
      server-side (so a bot posting directly to the relay endpoint, bypassing the page entirely,
      is still caught) and returns a fake `{"ok":true}` without touching Telegram/email.
- [x] **Searchable dropdown for "Current city / state".** Lightweight version per the original
      note — a `<datalist>` of the ~185 largest US cities (`usCitySuggestions` in
      `src/data/content.ts`), wired to both the primary and co-driver city fields. Still free-text,
      just suggests as you type.
- [x] **Google Jobs structured data.** `JobPosting` JSON-LD (two entries: solo driver, team
      driver) added directly to `index.html`'s `<head>` — static, not React-rendered, so it's
      present even before JS runs. Uses only verified facts from this brief (pay, requirements,
      company address as `jobLocation`). **Maintenance note:** `datePosted` is a fixed date
      (2026-07-15); Google eventually deprioritizes stale postings, so bump it periodically (or
      add `validThrough` once there's an actual application deadline).
- [x] **Open Graph / Twitter Card meta tags.** Added to both `index.html` and `apply.html`, using
      the existing `logo.png` as the share image (not ideal og:image aspect ratio — a proper
      1200×630 image would look better if the client ever supplies one, but this is a real
      improvement over no preview at all).
- [x] **Custom 404 page.** Added as a third Vite multi-page entry (`404.html` →
      `src/notfound-main.tsx` → `src/pages/NotFoundPage.tsx`), reusing `SiteLayout` so the
      header/footer match. `wrangler.jsonc`'s existing `not_found_handling: "404-page"` now has
      an actual page to serve. Verified live at `https://asfcargollc.com/<bad-url>`.

## ✅ Infrastructure / features (shipped 2026-07-15, later in session)
- [x] **Equipment photos.** `truck.png`, `van.png`, `flatbed.png` added to `public/`, wired into
      `equipment` in `content.ts` and rendered by `EquipmentCard.tsx`. Hit and fixed a
      case-sensitivity bug (`flatbed.PNG` in code vs `flatbed.png` on disk — Windows' filesystem
      is case-insensitive so this only breaks on a case-sensitive host, i.e. exactly where this
      site is deployed) — see PROJECT_BRIEF's "Design system" section.
- [x] **`robots.txt` + `sitemap.xml`.** Added to `public/`, lists `/` and `/apply.html`. Helps
      crawlers discover pages faster on this brand-new domain; does not by itself get the site
      indexed — that still needs Search Console verification + "Request Indexing" (client/owner
      action, needs the Google account login).
- [x] **Lane route map.** Added `LaneMap.tsx` (MapLibre GL JS) to the Lanes section, above the
      existing dispatch-board table. Dark basemap, red dots per state, red arcs per lane. See
      PROJECT_BRIEF's "Lane map" section for the data-maintenance gotcha (new lane → new state
      needs coordinates added to `stateCoordinates` in `content.ts`) and the headless-Chrome
      screenshot false-negative encountered while testing this (not a real bug, see that section).

## 🎬 In progress / blocked
- [ ] **Equipment section scroll animation.** Concept: truck rolls in from the right and settles
      center; van and flatbed take turns growing from small top-right thumbnails to couple onto
      the truck as the user scrolls, each swap syncing the card copy (Dry Van → Flatbed →
      Power-Only, ending on truck-alone = Power-Only). Full phase-by-phase spec was written and
      also reworded into a video-generation prompt, which the user is running through another AI
      to get a reference clip. **Blocked on that video** — don't start the GSAP ScrollTrigger
      implementation until it's back (the exact timing/positions are meant to come from what the
      video actually shows), unless explicitly told to proceed without it.

## 🆕 Features to build (no client input needed)
- [ ] **Cloudflare Web Analytics.** Needs a beacon token that only exists after enabling it in
      the dashboard (Analytics & Logs → Web Analytics → Add Site) — there's no CLI/API path to
      generate this via `wrangler`, confirmed 2026-07-15. Once you have the token, it's a single
      `<script>` tag drop into both `index.html` and `apply.html`'s `<head>` — tell me the token
      and I'll wire it in.
- [ ] **CDL photo / document upload on the form.** Deliberately skipped this session — bigger
      scope than the rest of the backlog, needs a Cloudflare R2 bucket (new infra) plus changes to
      both `ApplicationForm.tsx` (file input, multipart or base64 upload) and `worker/worker.js`
      (accept + store + forward the file, probably as a link in the Telegram message rather than
      inlining the image). Revisit as its own task when there's time to set up R2.

## 🔒 Security posture (scoped 2026-07-15, not a to-do — documenting the answer)
Original item was too vague to act on; client confirmed the concern was **data in transit and at
rest**, not access control. Current state:
- **In transit:** HTTPS everywhere — the site (`asfcargollc.com`), the relay Worker
  (`asf-cargo-relay...workers.dev`), and the Telegram Bot API calls are all TLS. Nothing is sent
  in the clear.
- **At rest:** nothing is stored anywhere in this codebase's infrastructure. Application
  submissions flow straight through the relay Worker to Telegram (and email, once Resend is set
  up) and are never written to a database, file, or log that this project controls. Cloudflare
  Worker secrets (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) are encrypted at rest by Cloudflare
  and never appear in the git repo.
- **Out of scope for this codebase:** who has access to the Telegram group or the eventual email
  inbox — that's account/membership management on Telegram's and the email provider's side, not
  something the website code controls.
- This session also reduced attack surface directly: CORS lock-down (arbitrary sites can no
  longer call the relay) and the honeypot (cuts down automated junk submissions reaching Telegram
  at all).

## 📋 Needs content/decisions from the client (tracked here + in PROJECT_BRIEF.md)
- [ ] Driver testimonials — none provided, don't fabricate
- [ ] Equipment photos — real truck photos to replace text-only cards
- [ ] Benefits detail (health insurance, home time, bonuses) — not specified yet
- [ ] Flatbed section — flip from "Coming Soon" to active once confirmed
- [x] Custom domain purchase (`asfcargollc.com`) — bought via Cloudflare Registrar 2026-07-14
- [x] Attach `asfcargollc.com` to the `asf-cargo-website` Worker — done 2026-07-15
- [x] CORS lock-down in `worker.js` — done 2026-07-15
- [ ] Resend email secrets — if email notifications alongside Telegram are wanted
- [ ] Proper 1200×630 Open Graph share image — currently reusing the circular logo, works but
      isn't the ideal aspect ratio for link previews
