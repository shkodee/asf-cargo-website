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
**Resolved 2026-07-22:** the "team bios are DRAFT text" item above is no longer something I need
to track — the About page roster (name/role/experience/bio/photo, all 5 people) is now editable
by you directly from the Telegram bot's **📸 Website Roster** panel, anytime, no redeploy or my
involvement needed. See "Shipped" below.

**Dropped 2026-07-15 (not needed / resolved):** driver testimonials, benefits detail, Resend
email, proper OG image, and the equipment scroll animation are all off the table — not pursuing
any of these. The stray `photo_2026-07-15_05-05-11.jpg` file has been deleted. The owner account
(`880712904`) has messaged the bot and can now receive DMs. **Flatbed activation was revisited
2026-07-16** — no longer dropped, see "Shipped" below.

## ✅ Shipped 2026-07-15/16, live and verified

- [x] **Hero logo replaced with a looping truck video** (2026-07-22) — homepage hero now plays
      `hero-truck.mp4` instead of the static badge; seamless crossfade loop, opening white-flash
      trimmed, cropped to hide a known wheel-rotation defect in the generated clip. See
      `PROJECT_BRIEF.md` → "Hero truck video".
- [x] **About page team roster is bot-editable** (2026-07-22) — add/edit/remove team members
      (name, role, experience, bio, photo) from Telegram's **📸 Website Roster** panel, no redeploy.
      Seeded with the existing 5 people so nothing was lost. See `PROJECT_BRIEF.md` → "Team roster
      via the Telegram bot".
- [x] **New About page** (2026-07-16) — `about.html`, a third page with company story, animated
      stat counters, a highlight grid, and a "Meet the Team" marquee built from a real
      client-supplied roster (5 people, photos in `public/team/`). Nav updated (desktop + mobile)
      with an "About" link. Verified via a real scripted Playwright pass at desktop and mobile
      widths, zero console errors. See `PROJECT_BRIEF.md` → "About page" for full detail. Team
      bios are draft text — see the item above.
- [x] **About page fixes** (2026-07-16, client feedback on the shipped page) — footer nav was
      missing the About link (desktop header/mobile menu had it, footer didn't); the "Nationwide
      Lane Network" highlight card and the "8+ Daily Lanes" stat were reading a stale hardcoded
      count instead of the same live lane data the homepage uses; added the homepage's aurora
      background effect to this page's hero too. All three fixed and re-verified.
- [x] **Truck highlight image redone** (2026-07-16) — bigger (280px → ~460px), no more white
      border/box, drive-in-then-float animation (previewed via Artifact first, client picked the
      "Drive-in" style over "Float only"). See `PROJECT_BRIEF.md` → "About page" for the CSS
      approach.
- [x] **CDL photo/document upload on the apply form — confirmed working end-to-end** (client
      tested live, 2026-07-16). File field (JPEG/PNG/WEBP/PDF, 8MB cap, validated client + server
      side) uploads to a **private** R2 bucket (`asf-cargo-cdl-docs`, never a public URL). The
      team's Telegram notification now **auto-sends the photo/document right after the text**,
      no tap needed — a "📎 Resend CDL Document" button stays as a manual fallback if the
      auto-send ever fails for someone.
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
      response.
- [x] **Reefer, RGN, Step Deck added as new equipment types** (2026-07-16) — client supplied the
      photos, confirmed all active (no "coming soon" tag).
- [x] **Flatbed flipped from "Coming Soon" to active** (2026-07-16, client instruction).
- [x] **Dispatch board's lane list now scrolls past 6 rows** (2026-07-16) — stays usable as more
      lanes get added, instead of the table growing indefinitely.
- [x] **Logo updated** (2026-07-16, client-supplied file).

## 🔒 Security posture (reference, not a to-do)

Client's concern was data in transit and at rest, not access control. Current state:
- **In transit:** HTTPS everywhere — the site, the relay Worker, and Telegram Bot API calls.
- **At rest:** application text itself is never stored — it flows straight through to Telegram
  (and email, once Resend is set up), same as before. **One deliberate exception (2026-07-15):**
  an optional CDL photo/document does persist, in a **private** R2 bucket with no public URL —
  it's auto-sent to the team via Telegram at submission time, with a "Resend CDL Document"
  button as a fallback, both gated to registered team members only. Everything else (bot token,
  team list) is Cloudflare's own encrypted Worker secrets/KV, as before.
- **Out of scope here:** who has access to the Telegram team or the eventual email inbox — that's
  membership management via the bot's own commands and the email provider's side.
- **Full audit done 2026-07-15** (see `PROJECT_BRIEF.md` → "Security hardening pass"): fixed
  HTML-injection into Telegram messages, added rate limiting to both public endpoints, moved
  `SETUP_SECRET` off a URL query param. All three deployed and verified live. CORS, secret
  handling, and dependency audit were already clean.
