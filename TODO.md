# ASF Cargo Website — TODO / Bug Backlog

> Working backlog of bugs and features. For architecture/deploy/handoff context, see
> `PROJECT_BRIEF.md` — this file is just the punch list. Check items off (`- [x]`) as they ship,
> and pull items into a git commit message when done rather than leaving this stale.

## 🔴 Do first
- [ ] **Re-paste `worker/worker.js` into Cloudflare's inline editor for `asf-cargo-relay`.**
      Confirmed broken by a live test (2026-07-14): a Team Driver submission with full co-driver
      info produced a Telegram message with *no* co-driver section at all — proves the deployed
      Worker still has the old `buildSummary()`. Code is already correct in the repo; this is a
      manual paste-and-deploy step in the Cloudflare dashboard, not a code fix. See
      `PROJECT_BRIEF.md` → "Co-driver feature" for the exact steps.

## 🐛 Bugs
- [ ] **Apply form: no visible validation on failed submit.** Required fields (first/last name,
      phone) don't turn red or show an error when the user hits Submit with them empty — currently
      relies entirely on native HTML5 `required` behavior, which is inconsistent/easy to miss.
      Add visible red border + message on invalid fields.
- [ ] **Co-driver section is missing an email field.** Primary applicant has one, co-driver
      section doesn't — add `coDriverEmail` (mirror the primary `email` field: optional, not
      required).
- [ ] **Co-driver section is missing a current city/state field.** Primary applicant has one
      (`city`), co-driver section doesn't — add `coDriverCity` (mirror the primary field).

## 🆕 Features to build (no client input needed)
- [ ] **Antispam protection on the application form.** Currently nothing stops bot submissions
      besides the relay Worker's basic "firstName + phone present" check. Add a honeypot field
      (hidden input bots fill in but humans never see/touch) at minimum; consider a submission
      rate-limit in the Worker if spam becomes a real problem.
- [ ] **CDL photo / document upload on the form.** Already flagged as a "someday" idea before
      this session — needs file storage (Cloudflare R2 is the natural fit) and changes to both
      `ApplicationForm.tsx` (file input, multipart or base64 upload) and `worker/worker.js`
      (accept + store + forward the file, probably as a link in the Telegram message rather than
      inlining the image).
- [ ] **Searchable/typeable dropdown for "Current city / state".** Currently a plain free-text
      input — replace with a combobox (type-to-filter, e.g. a simple `<datalist>` for a lightweight
      version, or a proper autocomplete component if a full US city/state dataset is wanted).
      Applies to both the primary applicant's city field and the new `coDriverCity` field above.
- [ ] **"Security of all information" — needs scoping.** Too vague as stated to act on directly;
      next conversation should nail down what's actually being asked (data encryption in transit —
      already HTTPS everywhere; data at rest — currently nothing is stored anywhere, submissions
      just relay through to Telegram/email and aren't persisted; access control on the Telegram
      group/email inbox — outside this codebase's control). Ask the user what specifically
      prompted this before doing anything.
- [ ] **Google Jobs structured data** (`JobPosting` JSON-LD schema on the homepage/apply page).
      Highest-ROI SEO item — lets driver postings surface directly in Google Search / Google for
      Jobs, free organic applicant traffic. No client content needed.
- [ ] **Open Graph / Twitter Card meta tags.** Shared links (Facebook, Telegram, Twitter/X)
      currently show no preview image/title. Quick, no client content needed.
- [ ] **Cloudflare Web Analytics.** Free, privacy-friendly, one script tag. Would show the real
      conversion funnel: homepage → apply page → actual submission.
- [ ] **Custom 404 page** matching the site design. `wrangler.jsonc` already references a
      `"404-page"` handler but no actual 404 page exists yet — bad URLs currently hit some
      Cloudflare default instead.

## 📋 Needs content/decisions from the client (tracked here + in PROJECT_BRIEF.md)
- [ ] Driver testimonials — none provided, don't fabricate
- [ ] Equipment photos — real truck photos to replace text-only cards
- [ ] Benefits detail (health insurance, home time, bonuses) — not specified yet
- [ ] Flatbed section — flip from "Coming Soon" to active once confirmed
- [ ] Custom domain purchase (`asfcargollc.com`) — see PROJECT_BRIEF.md
- [ ] CORS lock-down in `worker.js` — blocked on the domain above
- [ ] Resend email secrets — if email notifications alongside Telegram are wanted
