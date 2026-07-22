/**
 * ASF Cargo — Application Relay + Telegram Admin Bot Worker
 *
 * Two jobs, in one Worker (shares the same bot token/KV):
 *   1. Relay: receives the driver application form POST, then DMs it to every
 *      admin's Telegram (via the bot) and emails it via Resend.
 *   2. Bot: handles the Telegram bot's commands/buttons (/start, /whoami,
 *      /addmember, and the inline admin panel — manage admins, pause/resume
 *      notifications, view stats, manage lanes, manage the About page's team
 *      roster). Admins, lanes, and the roster are stored in KV (roster photos
 *      in R2), not static data, so they can be managed live from the bot.
 *
 * Routes:
 *   POST /                 — the application form's relay endpoint (CORS-protected)
 *   GET  /lanes             — public, CORS-protected: current lane list as JSON,
 *                            read by the website at runtime instead of a static import
 *   GET  /roster            — public: About page team roster as JSON (name/role/
 *                            experience/bio/photoUrl), same live-data pattern as /lanes
 *   GET  /roster-photo/:id  — public: streams a roster member's photo from R2
 *   POST /telegram-webhook — Telegram sends bot updates here (verified via secret token)
 *   GET  /setup-webhook    — one-time: tells Telegram to start sending updates to
 *                            /telegram-webhook (protected by an X-Setup-Secret header)
 *
 * Deploy this on Cloudflare Workers (free tier). See README.md in this folder
 * for the full setup walkthrough.
 */

const ALLOWED_ORIGINS = [
  "https://asfcargollc.com",
  "https://www.asfcargollc.com",
  "https://asf-cargo-website.afzaljon0411.workers.dev",
];

// CDL photo/document upload — deliberately conservative: small size cap
// (these are phone photos of a license, not scans), and only the file types
// a driver could plausibly submit. Enforced both client-side (ApplicationForm.tsx)
// and here, since the client check is trivially bypassable.
const CDL_MAX_BYTES = 8 * 1024 * 1024;
const CDL_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/telegram-webhook" && request.method === "POST") {
      return handleTelegramWebhook(request, env);
    }

    if (url.pathname === "/setup-webhook" && request.method === "GET") {
      return handleSetupWebhook(request, url, env);
    }

    if (url.pathname === "/lanes" && request.method === "GET") {
      return handleGetLanes(request, env);
    }

    if (url.pathname === "/roster" && request.method === "GET") {
      return handleGetRoster(request, env);
    }

    if (url.pathname.startsWith("/roster-photo/") && request.method === "GET") {
      return handleGetRosterPhoto(request, env, url.pathname.slice("/roster-photo/".length));
    }

    return handleApplicationForm(request, env);
  },
};

// Telegram messages are sent with parse_mode: "HTML" — any value that ends up
// in message *text* (not inline-keyboard button labels, which Telegram never
// HTML-parses) must have &/</> escaped first. Otherwise a stray "<" from a
// form field or a Telegram display name either breaks delivery outright (the
// whole message gets rejected) or renders as real formatting/links.
function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Best-effort request throttling for the two public endpoints (KV writes
// aren't atomic, so a race can let a couple extra requests through — fine at
// this bot's traffic volume, the goal is blunting abuse/scraping, not exact
// counting). Keyed by client IP + a namespace so the form and the lanes feed
// don't share a budget.
async function checkRateLimit(env, key, limit, windowSeconds) {
  const kvKey = `ratelimit:${key}`;
  const raw = await env.ASF_BOT_KV.get(kvKey);
  const count = raw ? parseInt(raw, 10) : 0;
  if (count >= limit) return false;
  await env.ASF_BOT_KV.put(kvKey, String(count + 1), { expirationTtl: windowSeconds });
  return true;
}

function corsHeadersFor(request) {
  const origin = request.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function handleGetLanes(request, env) {
  const headers = corsHeadersFor(request);

  // Sized for useLanes() firing twice per page load (Hero + dispatch board),
  // with plenty of headroom for normal browsing — this is just an abuse/
  // scraping brake, not a tight budget.
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const allowed = await checkRateLimit(env, `lanes:${ip}`, 60, 60);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const lanes = await getLanes(env);
  // Public response is state-level + coordinates only — never the real city
  // names. City text (`originCity`/`destCity`) exists in KV for the bot's
  // own admin-only messages, but must never appear on a public page/API,
  // per the client's explicit instruction (see PROJECT_BRIEF.md).
  const publicLanes = lanes.map((l) => ({
    idx: l.idx,
    origin: l.origin,
    dest: l.dest,
    status: l.status,
    originCoords: l.originCoords,
    destCoords: l.destCoords,
  }));
  return new Response(JSON.stringify({ lanes: publicLanes }), {
    status: 200,
    headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

// Public roster feed for the About page's "Meet the Team" section — same
// live-data pattern as /lanes above. Photos are genuinely public marketing
// content (same sensitivity as the old static public/team/*.jpg files), so
// unlike the CDL bucket there's no auth gate on the photo route, just a
// rate-limit as an abuse brake.
async function handleGetRoster(request, env) {
  const headers = corsHeadersFor(request);

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const allowed = await checkRateLimit(env, `roster:${ip}`, 60, 60);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const roster = await getRoster(env);
  const origin = new URL(request.url).origin;
  const members = roster.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    experience: m.experience || undefined,
    bio: m.bio || undefined,
    // ?v=<upload timestamp> cache-busts the URL itself whenever the photo is
    // actually replaced — see handleGetRosterPhoto for why this matters more
    // than it looks (the id-based URL never changes on its own).
    photoUrl: m.hasPhoto
      ? `${origin}/roster-photo/${m.id}?v=${encodeURIComponent(m.photoUpdatedAt || "0")}`
      : undefined,
  }));
  return new Response(JSON.stringify({ members }), {
    status: 200,
    headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function handleGetRosterPhoto(request, env, id) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const allowed = await checkRateLimit(env, `rosterphoto:${ip}`, 120, 60);
  if (!allowed) return new Response("Too many requests", { status: 429 });

  const roster = await getRoster(env);
  const member = roster.find((m) => m.id === id);
  if (!member || !member.hasPhoto) return new Response("Not found", { status: 404 });

  const object = await env.ROSTER_BUCKET.get(`roster/${id}`);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body, {
    status: 200,
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "image/jpeg",
      // Long + immutable is only safe because the URL is now versioned via
      // ?v=<photoUpdatedAt> (see handleGetRoster) — a "Replace Photo" changes
      // that query param, so the browser/CDN naturally fetch fresh bytes
      // instead of serving the stale cached image at the old URL forever.
      // Previously this was a bare id-keyed URL with a 1hr public cache, so
      // a replaced photo silently kept serving the old image until the cache
      // expired — that was the actual bug behind "photo isn't changing".
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

// ============================================================
// Application form relay (unchanged behavior, just moved into
// its own function so routing above can dispatch to it)
// ============================================================

async function handleApplicationForm(request, env) {
  const origin = request.headers.get("Origin");
  const corsHeaders = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const allowed = await checkRateLimit(env, `apply:${ip}`, 5, 3600);
  if (!allowed) {
    return new Response("Too many requests — try again later.", { status: 429, headers: corsHeaders });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return new Response("Invalid form data", { status: 400, headers: corsHeaders });
  }

  const data = {};
  for (const [key, value] of form.entries()) {
    if (key === "cdlFile") continue;
    data[key] = value;
  }

  // Honeypot: bots fill this hidden field, real users never see it. Pretend success
  // instead of erroring, so scripts don't learn to retry without it.
  if (data.website) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!data.firstName || !data.phone) {
    return new Response("Missing required fields", { status: 400, headers: corsHeaders });
  }

  let cdlDocId = null;
  const cdlFile = form.get("cdlFile");
  if (cdlFile && typeof cdlFile === "object" && cdlFile.size > 0) {
    if (cdlFile.size > CDL_MAX_BYTES) {
      return new Response("CDL file is too large (8MB max).", { status: 400, headers: corsHeaders });
    }
    if (!CDL_ALLOWED_TYPES.includes(cdlFile.type)) {
      return new Response("CDL file must be a JPEG/PNG/WEBP image or a PDF.", { status: 400, headers: corsHeaders });
    }
    try {
      cdlDocId = await uploadCdlFile(env, cdlFile, data);
    } catch (err) {
      console.error("CDL upload failed:", err?.message || err);
      return new Response("Failed to upload CDL file — try again.", { status: 502, headers: corsHeaders });
    }
  }

  const summary = buildSummary(data, cdlDocId);

  await logApplication(env);

  const results = await Promise.allSettled([
    sendTelegram(env, summary, cdlDocId),
    sendEmail(env, summary, data),
  ]);

  const failed = results.filter(r => r.status === "rejected");
  for (const f of failed) {
    console.error("Delivery failed:", f.reason?.message || f.reason);
  }
  if (failed.length === results.length) {
    // both failed
    return new Response("Failed to deliver application", { status: 502, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildSummary(d, cdlDocId) {
  const e = escapeHtml;
  const lines = [
    `🚛 NEW DRIVER APPLICATION`,
    ``,
    `Name: ${e(d.firstName)} ${e(d.lastName)}`,
    `Phone: ${e(d.phone) || "-"}`,
    `Email: ${e(d.email) || "-"}`,
    `Position: ${e(d.position) || "-"}`,
    `CDL #: ${e(d.cdlNumber) || "-"} (${e(d.cdlState) || "-"})`,
    `Experience: ${e(d.experience) || "-"}`,
    `Location: ${e(d.city) || "-"}`,
  ];

  if (cdlDocId) {
    lines.push(``, `📎 CDL photo/document attached below.`);
  }

  if (d.hasCoDriver) {
    lines.push(``, `Co-driver: ${e(d.hasCoDriver)}`);
    if (d.coDriverFirstName || d.coDriverLastName) {
      lines.push(
        `  Name: ${e(d.coDriverFirstName)} ${e(d.coDriverLastName)}`,
        `  Phone: ${e(d.coDriverPhone) || "-"}`,
        `  Email: ${e(d.coDriverEmail) || "-"}`,
        `  Location: ${e(d.coDriverCity) || "-"}`,
        `  CDL #: ${e(d.coDriverCdlNumber) || "-"} (${e(d.coDriverCdlState) || "-"})`,
        `  Experience: ${e(d.coDriverExperience) || "-"}`
      );
    }
  }

  lines.push(``, `Message: ${e(d.message) || "-"}`);
  return lines.join("\n");
}

async function sendTelegram(env, text, cdlDocId) {
  const paused = await getPaused(env);
  if (paused) {
    console.log("Notifications paused via /pause — skipping Telegram send.");
    return { skipped: true };
  }

  const admins = await getAdmins(env);
  const chatIds = admins.map((a) => a.id);

  if (chatIds.length === 0) throw new Error("No team members configured — use /addmember in the bot");

  // The CDL doc auto-sends right after the text below — this button stays as a
  // manual resend/fallback (e.g. if the auto-send failed for one recipient),
  // not the primary way to see it anymore.
  const keyboard = cdlDocId
    ? { inline_keyboard: [[{ text: "📎 Resend CDL Document", callback_data: `viewdoc:${cdlDocId}` }]] }
    : undefined;

  // Fetch the file once and hand the same bytes to every recipient, rather
  // than re-reading from R2 per chat.
  let cdlAttachment = null;
  if (cdlDocId) {
    const doc = await getCdlDoc(env, cdlDocId);
    const object = doc ? await env.CDL_BUCKET.get(doc.r2Key) : null;
    if (doc && object) {
      cdlAttachment = { bytes: await object.arrayBuffer(), filename: doc.filename, contentType: doc.contentType };
    } else {
      console.error("CDL doc missing at send time:", cdlDocId);
    }
  }

  const results = await Promise.allSettled(
    chatIds.map(async (chat_id) => {
      await tgSend(env, chat_id, text, keyboard);
      // A failed document send shouldn't count against "was this application
      // delivered" — the team still got the full text notification either
      // way, and can always tap "Resend CDL Document" to retry.
      if (cdlAttachment) {
        try {
          await tgSendDocument(env, chat_id, cdlAttachment.bytes, cdlAttachment.filename, cdlAttachment.contentType);
        } catch (err) {
          console.error(`CDL auto-send to ${chat_id} failed:`, err?.message || err);
        }
      }
    })
  );

  const failures = results.filter((r) => r.status === "rejected");
  for (const f of failures) {
    console.error("Telegram DM failed:", f.reason?.message || f.reason);
  }
  // Only treat this as a total failure if every admin missed it — one successful
  // DM is enough for the application to count as delivered via Telegram.
  if (failures.length === results.length) {
    throw new Error("Telegram delivery failed for all admin recipients");
  }
  return results;
}

async function sendEmail(env, summaryText, data) {
  // Uses Resend (https://resend.com) — free tier: 3,000 emails/month.
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,       // e.g. "ASF Cargo Applications <applications@yourdomain.com>"
      to: env.EMAIL_TO,           // e.g. "you@yourdomain.com"
      subject: `New driver application — ${data.firstName} ${data.lastName}`,
      text: summaryText,
    }),
  });
  if (!res.ok) throw new Error("Email send failed: " + (await res.text()));
  return res;
}

// ============================================================
// CDL photo/document uploads — stored in a private R2 bucket, never a
// public URL. The Telegram message only ever gets a short opaque ID; a team
// member has to tap "View CDL Document" and have the bot fetch it from R2
// and re-send it as a Telegram attachment, gated the same way any other
// bot interaction is (must be a registered team member — see viewdoc:
// handling in handleCallbackQuery). This keeps a driver's license photo
// from ever sitting behind a guessable/public link.
// ============================================================

function randomId(bytes = 8) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function uploadCdlFile(env, file, data) {
  const docId = randomId();
  const r2Key = `cdl/${docId}`;
  await env.CDL_BUCKET.put(r2Key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });
  await env.ASF_BOT_KV.put(
    `clddoc:${docId}`,
    JSON.stringify({
      r2Key,
      contentType: file.type,
      filename: `CDL_${(data.lastName || "applicant").replace(/[^a-z0-9]/gi, "_")}${fileExtensionFor(file.type)}`,
      uploadedAt: new Date().toISOString(),
    })
  );
  return docId;
}

async function getCdlDoc(env, docId) {
  const raw = await env.ASF_BOT_KV.get(`clddoc:${docId}`);
  return raw ? JSON.parse(raw) : null;
}

function fileExtensionFor(contentType) {
  if (contentType === "image/jpeg") return ".jpg";
  if (contentType === "image/png") return ".png";
  if (contentType === "image/webp") return ".webp";
  if (contentType === "application/pdf") return ".pdf";
  return "";
}

// ============================================================
// KV-backed state: admins, pause flag, application stats
// ============================================================

async function getAdmins(env) {
  const raw = await env.ASF_BOT_KV.get("admins");
  return raw ? JSON.parse(raw) : [];
}

async function saveAdmins(env, admins) {
  await env.ASF_BOT_KV.put("admins", JSON.stringify(admins));
}

async function getPaused(env) {
  return (await env.ASF_BOT_KV.get("paused")) === "1";
}

async function setPaused(env, value) {
  await env.ASF_BOT_KV.put("paused", value ? "1" : "0");
}

async function logApplication(env) {
  const raw = await env.ASF_BOT_KV.get("applications");
  const list = raw ? JSON.parse(raw) : [];
  list.push(new Date().toISOString());
  await env.ASF_BOT_KV.put("applications", JSON.stringify(list.slice(-1000)));
}

async function getStats(env) {
  const raw = await env.ASF_BOT_KV.get("applications");
  const list = raw ? JSON.parse(raw) : [];
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const today = list.filter((t) => now - new Date(t).getTime() < day).length;
  const week = list.filter((t) => now - new Date(t).getTime() < 7 * day).length;
  return { today, week, total: list.length };
}

// ============================================================
// KV-backed state: lanes (the live source for the site's Lanes
// section — the website fetches GET /lanes at runtime instead of
// importing a static array, so bot edits show up immediately)
// ============================================================

async function getLanes(env) {
  const raw = await env.ASF_BOT_KV.get("lanes");
  return raw ? JSON.parse(raw) : [];
}

async function saveLanes(env, lanes) {
  await env.ASF_BOT_KV.put("lanes", JSON.stringify(lanes));
}

function nextLaneIdx(lanes) {
  const max = lanes.reduce((m, l) => Math.max(m, parseInt(l.idx, 10) || 0), 0);
  return String(max + 1).padStart(2, "0");
}

// Geocodes "City, ST" via OpenStreetMap's free Nominatim API — no API key
// needed, but their usage policy requires a real identifying User-Agent and
// caps at ~1 request/sec, which is nowhere near an issue at this bot's volume
// (an admin adding a lane, at most a few times a month).
async function geocodeCity(cityState) {
  const query = encodeURIComponent(`${cityState}, USA`);
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=us`,
    { headers: { "User-Agent": "ASFCargoBot/1.0 (https://asfcargollc.com)" } }
  );
  if (!res.ok) throw new Error(`Geocoding request failed: ${res.status}`);
  const results = await res.json();
  if (!results.length) return null;
  const { lat, lon } = results[0];
  return [parseFloat(lon), parseFloat(lat)];
}

// Best-effort "State" extraction from a "City, ST" string, for the lane's
// public-facing state-level text (dispatch board + map labels never show
// the city, only the state — see PROJECT_BRIEF's public-page privacy rule).
const STATE_NAMES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

function stateNameFromCityState(cityState) {
  const abbr = cityState.split(",").pop().trim().toUpperCase();
  return STATE_NAMES[abbr] || abbr;
}

// ============================================================
// KV-backed state + R2-backed photos: the About page's "Meet the Team"
// roster. Same live-data relationship to the site as lanes — the About page
// fetches GET /roster at runtime instead of importing content.ts's static
// teamMembers array, which now exists only as a fallback (see useTeamRoster.ts).
// Deliberately a separate R2 bucket from CDL_BUCKET: these photos are public
// marketing content, CDL docs must stay private — keeping them in different
// buckets makes that invariant trivial to reason about.
// ============================================================

async function getRoster(env) {
  const raw = await env.ASF_BOT_KV.get("roster");
  return raw ? JSON.parse(raw) : [];
}

async function saveRoster(env, roster) {
  await env.ASF_BOT_KV.put("roster", JSON.stringify(roster));
}

async function uploadRosterPhoto(env, id, bytes, contentType) {
  await env.ROSTER_BUCKET.put(`roster/${id}`, bytes, { httpMetadata: { contentType } });
}

async function deleteRosterPhoto(env, id) {
  await env.ROSTER_BUCKET.delete(`roster/${id}`);
}

// ============================================================
// KV-backed state: pending multi-step bot conversations (e.g. the
// add-lane flow, which needs two free-text replies in a row). Telegram
// webhook calls are stateless per-request, so "what step is this admin
// on" has to be persisted somewhere between messages.
// ============================================================

async function getPending(env, id) {
  const raw = await env.ASF_BOT_KV.get(`pending:${id}`);
  return raw ? JSON.parse(raw) : null;
}

async function setPending(env, id, state) {
  // Auto-expires after 10 minutes so an abandoned flow doesn't linger and
  // confuse a later, unrelated message from the same admin.
  await env.ASF_BOT_KV.put(`pending:${id}`, JSON.stringify(state), { expirationTtl: 600 });
}

async function clearPending(env, id) {
  await env.ASF_BOT_KV.delete(`pending:${id}`);
}

// Walks an admin through the two free-text replies the add-lane flow needs
// (origin, then destination) — each gets geocoded immediately so a bad city
// name is caught right away instead of failing silently later.
// Every step here is responding to something the admin *typed*, so it uses
// tgAdvanceMessage (delete the old bot prompt, send a fresh one) rather than
// editing in place — an edited message keeps its original position in the
// chat, which would leave it stranded above the admin's own new message
// instead of appearing after it.
async function handlePendingLaneInput(env, chatId, fromId, text, pending) {
  const anchor = pending.anchorMessageId;

  if (pending.step === "origin" || pending.step === "dest") {
    let coords;
    try {
      coords = await geocodeCity(text);
    } catch (err) {
      console.error("Geocoding error:", err?.message || err);
      const next = await tgAdvanceMessage(env, chatId, anchor, "Geocoding failed — try again in a moment.", cancelKeyboard("lane:cancelflow"));
      await setPending(env, fromId, { ...pending, anchorMessageId: next });
      return;
    }
    if (!coords) {
      const next = await tgAdvanceMessage(
        env, chatId, anchor,
        `Couldn't find "${escapeHtml(text)}" — try again with the format 'City, ST' (e.g. Memphis, TN).`,
        cancelKeyboard("lane:cancelflow")
      );
      await setPending(env, fromId, { ...pending, anchorMessageId: next });
      return;
    }

    if (pending.step === "origin") {
      const next = await tgAdvanceMessage(env, chatId, anchor, `✅ Origin: ${escapeHtml(text)}\n\nNow send the destination as 'City, ST'.`, cancelKeyboard("lane:cancelflow"));
      await setPending(env, fromId, {
        step: "dest",
        anchorMessageId: next,
        originCity: text,
        originState: stateNameFromCityState(text),
        originCoords: coords,
      });
      return;
    }

    const next = await tgAdvanceMessage(env, chatId, anchor, `✅ Destination: ${escapeHtml(text)}\n\nWhat's the status?`, {
      inline_keyboard: [
        [{ text: "Daily", callback_data: "lanestatus:Daily" }],
        [{ text: "Weekly", callback_data: "lanestatus:Weekly" }],
        [{ text: "Paused", callback_data: "lanestatus:Paused" }],
        [{ text: "✕ Cancel", callback_data: "lane:cancelflow" }],
      ],
    });
    await setPending(env, fromId, {
      ...pending,
      step: "status",
      anchorMessageId: next,
      destCity: text,
      destState: stateNameFromCityState(text),
      destCoords: coords,
    });
    return;
  }

  if (pending.step === "status") {
    // Free-text status typed instead of tapping one of the buttons.
    await finalizeLane(env, chatId, fromId, { ...pending, status: text }, anchor, true);
  }
}

// `viaTypedReply` picks tgAdvanceMessage (delete+resend) vs tgEditMessage:
// this is called both from a button tap (lanestatus:, safe to edit in place)
// and from the free-text status fallback above (needs the resend treatment).
async function finalizeLane(env, chatId, fromId, draft, anchorMessageId, viaTypedReply = false) {
  const lanes = await getLanes(env);
  const idx = nextLaneIdx(lanes);
  const lane = {
    idx,
    origin: draft.originState,
    dest: draft.destState,
    status: draft.status,
    originCity: draft.originCity,
    originCoords: draft.originCoords,
    destCity: draft.destCity,
    destCoords: draft.destCoords,
  };
  lanes.push(lane);
  await saveLanes(env, lanes);
  await clearPending(env, fromId);

  const { text, keyboard } = await buildLanesView(env);
  const confirmText = `✅ Added lane #${idx}: ${escapeHtml(lane.origin)} → ${escapeHtml(lane.dest)} (${escapeHtml(lane.status)})\n\n${text}`;
  if (viaTypedReply) {
    await tgAdvanceMessage(env, chatId, anchorMessageId, confirmText, keyboard);
  } else {
    await tgEditMessage(env, chatId, anchorMessageId, confirmText, keyboard);
  }

  await notifyTeamOfLaneChange(env, "added", lane, fromId);
}

// Tells everyone else with panel access who added/removed a lane and what it
// was — username/name only, never the raw numeric ID (same "don't casually
// expose IDs" rule as the Team view). The actor themselves is excluded since
// they already got their own confirmation message above/in the caller.
async function notifyTeamOfLaneChange(env, action, lane, actorId) {
  const actorProfile = await getUserProfile(env, actorId);
  const actorLabel = formatAdminLabel(actorId, actorProfile, false);
  const text = `🛣 Lane ${action} by ${escapeHtml(actorLabel)}\n${escapeHtml(lane.origin)} → ${escapeHtml(lane.dest)} (${escapeHtml(lane.status)})`;

  const admins = await getAdmins(env);
  const recipients = admins.filter((a) => hasPanelAccess(a) && String(a.id) !== String(actorId));
  const results = await Promise.allSettled(recipients.map((a) => tgSend(env, a.id, text)));
  results.forEach((r) => {
    if (r.status === "rejected") console.error("Lane-change notify failed:", r.reason?.message || r.reason);
  });
}

// Walks an admin through the free-text steps of adding a new roster member
// (name -> role -> experience -> bio, experience/bio skippable via button or
// typing "skip"), and applies a single-field edit for an existing member.
// Every branch here is responding to something the admin *typed*, so it uses
// tgAdvanceMessage (delete old prompt, send a fresh one) instead of editing
// in place — see tgAdvanceMessage's comment for why that matters.
// The one step this can't handle is "photo" — that's routed separately in
// handleMessage to handleRosterPhotoMessage, since it needs an actual
// Telegram photo message, not text.
async function handlePendingRosterInput(env, chatId, fromId, text, pending) {
  const anchor = pending.anchorMessageId;

  if (pending.type === "roster_add") {
    if (pending.step === "name") {
      const next = await tgAdvanceMessage(env, chatId, anchor, `✅ Name: ${escapeHtml(text)}\n\nWhat's their role/title? (e.g. "Driver Recruiter")`, cancelKeyboard("roster:cancelflow"));
      await setPending(env, fromId, { type: "roster_add", step: "role", anchorMessageId: next, name: text });
      return;
    }
    if (pending.step === "role") {
      const next = await tgAdvanceMessage(env, chatId, anchor, `✅ Role: ${escapeHtml(text)}\n\nExperience line? (e.g. "5+ yrs experience")`, {
        inline_keyboard: [
          [{ text: "⏭ Skip", callback_data: "rosteradd:skip:experience" }],
          [{ text: "✕ Cancel", callback_data: "roster:cancelflow" }],
        ],
      });
      await setPending(env, fromId, { ...pending, step: "experience", anchorMessageId: next, role: text });
      return;
    }
    if (pending.step === "experience") {
      const next = await tgAdvanceMessage(env, chatId, anchor, `✅ Experience: ${escapeHtml(text)}\n\nShort bio line?`, {
        inline_keyboard: [
          [{ text: "⏭ Skip", callback_data: "rosteradd:skip:bio" }],
          [{ text: "✕ Cancel", callback_data: "roster:cancelflow" }],
        ],
      });
      await setPending(env, fromId, { ...pending, step: "bio", anchorMessageId: next, experience: text });
      return;
    }
    if (pending.step === "bio") {
      const next = await tgAdvanceMessage(env, chatId, anchor, `✅ Bio: ${escapeHtml(text)}\n\nNow send their photo (as a Telegram photo, not a file).`, cancelKeyboard("roster:cancelflow"));
      await setPending(env, fromId, { ...pending, step: "photo", anchorMessageId: next, bio: text });
      return;
    }
    if (pending.step === "photo") {
      const next = await tgAdvanceMessage(env, chatId, anchor, "Please send an actual photo (attach an image) — a photo is required.", cancelKeyboard("roster:cancelflow"));
      await setPending(env, fromId, { ...pending, anchorMessageId: next });
      return;
    }
  }

  if (pending.type === "roster_edit") {
    if (pending.field === "photo") {
      if (text.trim().toLowerCase() === "cancel") {
        await clearPending(env, fromId);
        const view = await buildRosterDetailView(env, pending.memberId);
        await tgAdvanceMessage(env, chatId, anchor, `Cancelled — photo unchanged.\n\n${view.text}`, view.keyboard);
        return;
      }
      const next = await tgAdvanceMessage(env, chatId, anchor, "Please send an actual photo, or type 'cancel' to keep the current one.", cancelKeyboard(`roster:view:${pending.memberId}`));
      await setPending(env, fromId, { ...pending, anchorMessageId: next });
      return;
    }

    const roster = await getRoster(env);
    const member = roster.find((m) => m.id === pending.memberId);
    if (!member) {
      await clearPending(env, fromId);
      await tgAdvanceMessage(env, chatId, anchor, "That member no longer exists.");
      return;
    }
    member[pending.field] = text;
    await saveRoster(env, roster);
    await clearPending(env, fromId);
    const view = await buildRosterDetailView(env, pending.memberId);
    await tgAdvanceMessage(env, chatId, anchor, `✅ Updated ${pending.field}.\n\n${view.text}`, view.keyboard);
  }
}

// Handles an incoming Telegram photo message during a roster add/edit flow —
// downloads the largest available size (Telegram lists photo sizes
// smallest-to-largest) and stores it in ROSTER_BUCKET. Same
// delete-old/send-new treatment as the rest of these flows, since a photo
// message is "typed input" just like text.
async function handleRosterPhotoMessage(env, chatId, fromId, message, pending) {
  const anchor = pending.anchorMessageId;
  const sizes = message.photo || [];
  if (!sizes.length) return;
  const best = sizes[sizes.length - 1];

  let downloaded;
  try {
    downloaded = await tgDownloadFile(env, best.file_id);
  } catch (err) {
    console.error("Roster photo download failed:", err?.message || err);
    const next = await tgAdvanceMessage(env, chatId, anchor, "Couldn't download that photo — try sending it again.", cancelKeyboard("roster:cancelflow"));
    await setPending(env, fromId, { ...pending, anchorMessageId: next });
    return;
  }

  if (pending.type === "roster_add") {
    const roster = await getRoster(env);
    const id = randomId();
    await uploadRosterPhoto(env, id, downloaded.bytes, downloaded.contentType);
    const member = {
      id,
      name: pending.name,
      role: pending.role,
      experience: pending.experience || "",
      bio: pending.bio || "",
      hasPhoto: true,
      photoUpdatedAt: new Date().toISOString(),
    };
    roster.push(member);
    await saveRoster(env, roster);
    await clearPending(env, fromId);
    const { text, keyboard } = await buildRosterView(env);
    await tgAdvanceMessage(env, chatId, anchor, `✅ Added ${escapeHtml(member.name)} to the website roster.\n\n${text}`, keyboard);
    return;
  }

  if (pending.type === "roster_edit" && pending.field === "photo") {
    const roster = await getRoster(env);
    const member = roster.find((m) => m.id === pending.memberId);
    if (!member) {
      await clearPending(env, fromId);
      await tgAdvanceMessage(env, chatId, anchor, "That member no longer exists.");
      return;
    }
    await uploadRosterPhoto(env, pending.memberId, downloaded.bytes, downloaded.contentType);
    member.hasPhoto = true;
    member.photoUpdatedAt = new Date().toISOString();
    await saveRoster(env, roster);
    await clearPending(env, fromId);
    const view = await buildRosterDetailView(env, pending.memberId);
    await tgAdvanceMessage(env, chatId, anchor, `✅ Photo updated.\n\n${view.text}`, view.keyboard);
  }
}

// Cache each Telegram user's username/name whenever they interact with the
// bot, so the admin list can show "@username" instead of a bare numeric ID —
// /addmember only ever supplies an ID, Telegram never hands us a profile for
// it directly, so this is the only way to know who an ID actually belongs to.
async function upsertUserProfile(env, user) {
  if (!user || !user.id) return;
  await env.ASF_BOT_KV.put(
    `profile:${user.id}`,
    JSON.stringify({ username: user.username || null, firstName: user.first_name || null })
  );
}

async function getUserProfile(env, id) {
  const raw = await env.ASF_BOT_KV.get(`profile:${id}`);
  return raw ? JSON.parse(raw) : null;
}

function formatAdminLabel(id, profile, showId = true) {
  if (profile?.username) return showId ? `@${profile.username} (${id})` : `@${profile.username}`;
  if (profile?.firstName) return showId ? `${profile.firstName} (${id})` : profile.firstName;
  return showId ? `${id}` : "(unnamed)";
}

// `viewerRole` controls what the requesting person sees: Admins get full
// info (username/name + numeric ID); everyone else with panel access
// (Owner) sees only username/name, never the raw ID — client instruction.
async function buildAdminsView(env, viewerRole) {
  const allAdmins = await getAdmins(env);
  // Admins are fully hidden from this panel — not listed, not removable, by
  // anyone (Owner included). Only Owner/Member entries ever appear here.
  const admins = allAdmins.filter((a) => (a.role || "admin") !== "admin");
  const showId = viewerRole === "admin";

  const profiles = await Promise.all(admins.map((a) => getUserProfile(env, a.id)));
  const labeled = admins.map((a, i) => ({
    id: a.id,
    role: a.role || "admin",
    label: formatAdminLabel(a.id, profiles[i], showId),
  }));

  const listText = labeled.length
    ? labeled.map((a) => `• ${escapeHtml(a.label)} — ${roleTag(a.role)}`).join("\n")
    : "(none)";
  const keyboard = {
    inline_keyboard: [
      ...labeled.map((a) => [
        { text: `✕ Remove ${a.label} (${roleTag(a.role)})`, callback_data: `admin:remove:${a.id}` },
      ]),
      [{ text: "« Back", callback_data: "menu:home" }],
    ],
  };

  return { text: `👥 Current team:\n${listText}\n\nTo add someone: /addmember [id]`, keyboard };
}

async function buildLanesView(env) {
  const lanes = await getLanes(env);
  const keyboard = {
    inline_keyboard: [
      ...lanes.map((l) => [
        { text: `#${l.idx}  ${l.origin} → ${l.dest}  (${l.status})`, callback_data: `lane:view:${l.idx}` },
      ]),
      [{ text: "+ Add Lane", callback_data: "lane:add" }],
      [{ text: "« Back", callback_data: "menu:home" }],
    ],
  };
  return {
    text: lanes.length ? "🛣 Current lanes — tap one to edit or remove it:" : "🛣 No lanes yet.",
    keyboard,
  };
}

async function buildRosterView(env) {
  const roster = await getRoster(env);
  const keyboard = {
    inline_keyboard: [
      ...roster.map((m) => [
        { text: `${m.name} — ${m.role}`, callback_data: `roster:view:${m.id}` },
      ]),
      [{ text: "+ Add Member", callback_data: "roster:add" }],
      [{ text: "« Back", callback_data: "menu:home" }],
    ],
  };
  return {
    text: roster.length ? "📸 Website team roster — tap someone to edit or remove them:" : "📸 No team members yet.",
    keyboard,
  };
}

async function buildRosterDetailView(env, id) {
  const roster = await getRoster(env);
  const member = roster.find((m) => m.id === id);
  if (!member) return null;

  const lines = [`📸 ${escapeHtml(member.name)}`, `Role: ${escapeHtml(member.role)}`];
  if (member.experience) lines.push(`Experience: ${escapeHtml(member.experience)}`);
  if (member.bio) lines.push(`Bio: ${escapeHtml(member.bio)}`);
  lines.push(`Photo: ${member.hasPhoto ? "✅ set" : "❌ none"}`);

  return {
    text: lines.join("\n"),
    keyboard: {
      inline_keyboard: [
        [{ text: "✏️ Edit Name", callback_data: `roster:edit:${id}:name` }],
        [{ text: "✏️ Edit Role", callback_data: `roster:edit:${id}:role` }],
        [{ text: "✏️ Edit Experience", callback_data: `roster:edit:${id}:experience` }],
        [{ text: "✏️ Edit Bio", callback_data: `roster:edit:${id}:bio` }],
        [{ text: "🖼 Replace Photo", callback_data: `roster:edit:${id}:photo` }],
        [{ text: "🗑 Remove", callback_data: `roster:confirmremove:${id}` }],
        [{ text: "« Back to Roster", callback_data: "menu:roster" }],
      ],
    },
  };
}

function cancelKeyboard(callbackData) {
  return { inline_keyboard: [[{ text: "✕ Cancel", callback_data: callbackData }]] };
}

function laneStatusKeyboard(idx, callbackPrefix) {
  return {
    inline_keyboard: [
      [{ text: "Daily", callback_data: `${callbackPrefix}:${idx}:Daily` }],
      [{ text: "Weekly", callback_data: `${callbackPrefix}:${idx}:Weekly` }],
      [{ text: "Paused", callback_data: `${callbackPrefix}:${idx}:Paused` }],
      [{ text: "« Cancel", callback_data: `lane:view:${idx}` }],
    ],
  };
}

async function buildLaneDetailView(env, idx) {
  const lanes = await getLanes(env);
  const lane = lanes.find((l) => l.idx === idx);
  if (!lane) return null;
  return {
    text: `🛣 Lane #${lane.idx}\n${escapeHtml(lane.origin)} → ${escapeHtml(lane.dest)}\nStatus: ${escapeHtml(lane.status)}`,
    keyboard: {
      inline_keyboard: [
        [{ text: "✏️ Change Status", callback_data: `lane:changestatus:${idx}` }],
        [{ text: "🗑 Remove Lane", callback_data: `lane:confirmremove:${idx}` }],
        [{ text: "« Back to Lanes", callback_data: "menu:lanes" }],
      ],
    },
  };
}

// ============================================================
// Telegram Bot API helpers
// ============================================================

function tgApi(env, method) {
  return `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`;
}

async function tgSend(env, chatId, text, replyMarkup) {
  const body = { chat_id: chatId, text, parse_mode: "HTML" };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const res = await fetch(tgApi(env, "sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Telegram DM to ${chatId} failed: ${await res.text()}`);
  // Parsed body (not the raw fetch Response) — callers in the lane/roster
  // conversation flows need result.message_id to track the new anchor.
  return res.json();
}

async function tgEditMessage(env, chatId, messageId, text, replyMarkup) {
  const body = { chat_id: chatId, message_id: messageId, text, parse_mode: "HTML" };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const res = await fetch(tgApi(env, "editMessageText"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.error("tgEditMessage failed:", await res.text());
  return res;
}

async function tgDeleteMessage(env, chatId, messageId) {
  if (!messageId) return;
  try {
    const res = await fetch(tgApi(env, "deleteMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
    });
    if (!res.ok) console.error("tgDeleteMessage failed:", await res.text());
  } catch (err) {
    console.error("tgDeleteMessage error:", err?.message || err);
  }
}

// Deletes the previous step's bot message and sends a fresh one, returning
// its message_id so the caller can carry it forward as the new anchor.
// Editing in place (tgEditMessage) keeps a message at its *original*
// position in the chat — fine for responding to a button tap, but wrong
// after the admin types a reply: the edited prompt stays stuck above their
// new message instead of appearing after it, so it looks like it vanished
// off the bottom of the screen. Used everywhere a lane/roster conversation
// step is responding to typed text or a photo, never to a button tap.
async function tgAdvanceMessage(env, chatId, previousMessageId, text, replyMarkup) {
  await tgDeleteMessage(env, chatId, previousMessageId);
  const result = await tgSend(env, chatId, text, replyMarkup);
  return result?.result?.message_id;
}

async function tgSendDocument(env, chatId, bytes, filename, contentType) {
  const body = new FormData();
  body.append("chat_id", String(chatId));
  body.append("document", new Blob([bytes], { type: contentType }), filename);
  const res = await fetch(tgApi(env, "sendDocument"), { method: "POST", body });
  if (!res.ok) throw new Error(`Telegram sendDocument to ${chatId} failed: ${await res.text()}`);
  return res;
}

// Downloads a photo the admin sent to the bot (roster add/edit flows) —
// Telegram only gives you a file_id in the webhook payload; getting the
// actual bytes is a two-step dance: resolve file_id -> file_path via getFile,
// then fetch that path from Telegram's separate file-serving host.
async function tgDownloadFile(env, fileId) {
  const res = await fetch(`${tgApi(env, "getFile")}?file_id=${encodeURIComponent(fileId)}`);
  if (!res.ok) throw new Error(`getFile failed: ${await res.text()}`);
  const data = await res.json();
  const filePath = data.result?.file_path;
  if (!filePath) throw new Error("getFile returned no file_path");

  const fileRes = await fetch(`https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${filePath}`);
  if (!fileRes.ok) throw new Error(`File download failed: ${fileRes.status}`);
  const contentType = fileRes.headers.get("content-type") || "image/jpeg";
  return { bytes: await fileRes.arrayBuffer(), contentType };
}

async function tgAnswerCallback(env, callbackQueryId, text) {
  await fetch(tgApi(env, "answerCallbackQuery"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: false }),
  });
}

// ============================================================
// Bot menu / keyboards
// ============================================================

// The website roster button/actions are deliberately Admin-only — NOT Owner,
// unlike every other panel feature (lanes, stats, pause, notification team),
// where Owner and Admin are treated as identical. Client's explicit call for
// this one feature specifically; don't "fix" this to match the usual pattern.
function mainMenuKeyboard(paused, role) {
  const rows = [
    [{ text: "👥 Team", callback_data: "menu:admins" }],
    [{ text: "🛣 Lanes", callback_data: "menu:lanes" }],
  ];
  if (role === "admin") {
    rows.push([{ text: "📸 Website Roster", callback_data: "menu:roster" }]);
  }
  rows.push(
    [{ text: "📊 Stats", callback_data: "menu:stats" }],
    [{ text: paused ? "▶️ Resume notifications" : "⏸ Pause notifications", callback_data: "menu:toggle_pause" }]
  );
  return { inline_keyboard: rows };
}

function roleTag(role) {
  if (role === "owner") return "👑 Owner";
  if (role === "admin") return "🛠 Admin";
  return "👤 Member";
}

async function getPerson(env, id) {
  const admins = await getAdmins(env);
  return admins.find((a) => String(a.id) === String(id)) || null;
}

// Owner/Admin get identical, full panel access — Member is notify-only.
// Entries with no role set (pre-dates the role system) default to admin.
function hasPanelAccess(person) {
  if (!person) return false;
  const role = person.role || "admin";
  return role === "owner" || role === "admin";
}

// Stricter than hasPanelAccess — website roster management is Admin-only, not
// Owner, per explicit client instruction (see mainMenuKeyboard above).
function hasRosterAccess(person) {
  if (!person) return false;
  return (person.role || "admin") === "admin";
}

// ============================================================
// Telegram webhook: incoming messages + button taps
// ============================================================

async function handleTelegramWebhook(request, env) {
  const secretHeader = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (secretHeader !== env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  let update;
  try {
    update = await request.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  try {
    if (update.message) {
      await handleMessage(env, update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(env, update.callback_query);
    }
  } catch (err) {
    console.error("Webhook handling error:", err?.message || err);
  }

  // Always 200 — Telegram retries aggressively on non-200, we don't want that.
  return new Response("OK", { status: 200 });
}

async function handleMessage(env, message) {
  const chatId = message.chat.id;
  const fromId = message.from.id;
  const text = (message.text || "").trim();

  await upsertUserProfile(env, message.from);

  const pending = await getPending(env, fromId);
  if (pending) {
    const awaitingPhoto =
      (pending.type === "roster_add" && pending.step === "photo") ||
      (pending.type === "roster_edit" && pending.field === "photo");
    if (awaitingPhoto && message.photo) {
      await handleRosterPhotoMessage(env, chatId, fromId, message, pending);
      return;
    }
    if (!text.startsWith("/")) {
      if (pending.type === "roster_add" || pending.type === "roster_edit") {
        await handlePendingRosterInput(env, chatId, fromId, text, pending);
      } else {
        await handlePendingLaneInput(env, chatId, fromId, text, pending);
      }
      return;
    }
  }

  if (text === "/start" || text === "/menu") {
    const person = await getPerson(env, fromId);
    if (!person) {
      await tgSend(
        env,
        chatId,
        `Hi! Your Telegram ID is:\n<code>${fromId}</code>\n\nAsk an owner/admin to run <code>/addmember ${fromId}</code> to give you access.`
      );
      return;
    }
    if (!hasPanelAccess(person)) {
      await tgSend(
        env,
        chatId,
        `You're registered as ${roleTag(person.role)}. You'll receive new driver application alerts here, but don't have access to the admin panel.`
      );
      return;
    }
    const paused = await getPaused(env);
    await tgSend(env, chatId, "🚛 ASF Cargo Admin Panel", mainMenuKeyboard(paused, person.role || "admin"));
    return;
  }

  if (text === "/whoami") {
    const person = await getPerson(env, fromId);
    await tgSend(env, chatId, `Your ID: <code>${fromId}</code>\nRole: ${person ? roleTag(person.role) : "Not registered"}`);
    return;
  }

  if (text.startsWith("/addmember")) {
    const requester = await getPerson(env, fromId);
    if (!hasPanelAccess(requester)) {
      await tgSend(env, chatId, "You're not authorized to do that.");
      return;
    }
    const newId = text.split(/\s+/)[1];
    if (!newId || !/^\d+$/.test(newId)) {
      await tgSend(env, chatId, "Usage: /addmember [numeric id]\n(they get their ID by sending /start to this bot)");
      return;
    }
    const admins = await getAdmins(env);
    if (admins.some((a) => String(a.id) === newId)) {
      await tgSend(env, chatId, "That ID is already on the team — remove them first via 👥 Team if you want to change their role.");
      return;
    }
    const profile = await getUserProfile(env, newId);
    const label = formatAdminLabel(newId, profile);
    await tgSend(env, chatId, `What role should ${escapeHtml(label)} have?`, {
      inline_keyboard: [
        [{ text: "👑 Owner", callback_data: `addrole:${newId}:owner` }],
        [{ text: "🛠 Admin", callback_data: `addrole:${newId}:admin` }],
        [{ text: "👤 Member (notifications only)", callback_data: `addrole:${newId}:member` }],
        [{ text: "Cancel", callback_data: "menu:home" }],
      ],
    });
    return;
  }

  // Unrecognized text — ignore silently rather than spamming replies to every message.
}

async function handleCallbackQuery(env, cq) {
  const fromId = cq.from.id;
  const chatId = cq.message.chat.id;
  const messageId = cq.message.message_id;
  const data = cq.data || "";

  await upsertUserProfile(env, cq.from);

  const requester = await getPerson(env, fromId);

  // Any registered team member can view an attached CDL doc — not gated to
  // panel access, since Members already receive the full application text
  // (including this same button) via their notification DM.
  if (data.startsWith("viewdoc:")) {
    if (!requester) {
      await tgAnswerCallback(env, cq.id, "Not authorized.");
      return;
    }
    const docId = data.slice("viewdoc:".length);
    const doc = await getCdlDoc(env, docId);
    if (!doc) {
      await tgAnswerCallback(env, cq.id, "That file is no longer available.");
      return;
    }
    const object = await env.CDL_BUCKET.get(doc.r2Key);
    if (!object) {
      await tgAnswerCallback(env, cq.id, "That file is no longer available.");
      return;
    }
    await tgAnswerCallback(env, cq.id, "Sending document…");
    try {
      const bytes = await object.arrayBuffer();
      await tgSendDocument(env, chatId, bytes, doc.filename, doc.contentType);
    } catch (err) {
      console.error("Failed to send CDL document:", err?.message || err);
      await tgSend(env, chatId, "Couldn't send that file — try again in a moment.");
    }
    return;
  }

  if (!hasPanelAccess(requester)) {
    await tgAnswerCallback(env, cq.id, "Not authorized.");
    return;
  }

  // Navigating anywhere else in the panel abandons any in-progress add/edit
  // conversation — without this, a stale `pending` state could survive a
  // "Back" tap and misinterpret the admin's next unrelated message as flow
  // input for up to its 10-minute TTL. Only the two callbacks that *continue*
  // an existing flow are exempt.
  const continuesPendingFlow = data.startsWith("lanestatus:") || data.startsWith("rosteradd:skip:");
  if (!continuesPendingFlow) {
    await clearPending(env, fromId);
  }

  if (data === "menu:home") {
    const paused = await getPaused(env);
    await tgEditMessage(env, chatId, messageId, "🚛 ASF Cargo Admin Panel", mainMenuKeyboard(paused, requester.role || "admin"));
    await tgAnswerCallback(env, cq.id);
    return;
  }

  if (data === "menu:admins") {
    const { text, keyboard } = await buildAdminsView(env, requester.role || "admin");
    await tgEditMessage(env, chatId, messageId, text, keyboard);
    await tgAnswerCallback(env, cq.id);
    return;
  }

  if (data === "menu:stats") {
    const stats = await getStats(env);
    await tgEditMessage(
      env,
      chatId,
      messageId,
      `📊 Applications received\nToday: ${stats.today}\nThis week: ${stats.week}\nAll-time: ${stats.total}`,
      { inline_keyboard: [[{ text: "« Back", callback_data: "menu:home" }]] }
    );
    await tgAnswerCallback(env, cq.id);
    return;
  }

  if (data === "menu:lanes") {
    const { text, keyboard } = await buildLanesView(env);
    await tgEditMessage(env, chatId, messageId, text, keyboard);
    await tgAnswerCallback(env, cq.id);
    return;
  }

  if (data === "lane:add") {
    await setPending(env, fromId, { step: "origin", anchorMessageId: messageId });
    await tgAnswerCallback(env, cq.id);
    await tgEditMessage(env, chatId, messageId, "Send the origin as 'City, ST' (e.g. Memphis, TN).", cancelKeyboard("lane:cancelflow"));
    return;
  }

  if (data === "lane:cancelflow") {
    const { text, keyboard } = await buildLanesView(env);
    await tgEditMessage(env, chatId, messageId, text, keyboard);
    await tgAnswerCallback(env, cq.id, "Cancelled.");
    return;
  }

  if (data.startsWith("lanestatus:")) {
    const status = data.slice("lanestatus:".length);
    const pending = await getPending(env, fromId);
    if (!pending || pending.step !== "status") {
      await tgAnswerCallback(env, cq.id, "That add-lane flow already finished or expired.");
      return;
    }
    await finalizeLane(env, chatId, fromId, { ...pending, status }, pending.anchorMessageId || messageId);
    await tgAnswerCallback(env, cq.id, "Added!");
    return;
  }

  if (data.startsWith("lane:view:")) {
    const idx = data.slice("lane:view:".length);
    const view = await buildLaneDetailView(env, idx);
    if (!view) {
      await tgAnswerCallback(env, cq.id, "That lane no longer exists.");
      return;
    }
    await tgEditMessage(env, chatId, messageId, view.text, view.keyboard);
    await tgAnswerCallback(env, cq.id);
    return;
  }

  if (data.startsWith("lane:changestatus:")) {
    const idx = data.slice("lane:changestatus:".length);
    await tgEditMessage(env, chatId, messageId, "Pick the new status:", laneStatusKeyboard(idx, "lane:setstatus"));
    await tgAnswerCallback(env, cq.id);
    return;
  }

  if (data.startsWith("lane:setstatus:")) {
    const [, , idx, status] = data.split(":");
    const lanes = await getLanes(env);
    const lane = lanes.find((l) => l.idx === idx);
    if (!lane) {
      await tgAnswerCallback(env, cq.id, "That lane no longer exists.");
      return;
    }
    lane.status = status;
    await saveLanes(env, lanes);
    const view = await buildLaneDetailView(env, idx);
    await tgEditMessage(env, chatId, messageId, view.text, view.keyboard);
    await tgAnswerCallback(env, cq.id, "Status updated.");
    return;
  }

  if (data.startsWith("lane:confirmremove:")) {
    const idx = data.slice("lane:confirmremove:".length);
    const lanes = await getLanes(env);
    const lane = lanes.find((l) => l.idx === idx);
    if (!lane) {
      await tgAnswerCallback(env, cq.id, "That lane no longer exists.");
      return;
    }
    await tgEditMessage(
      env,
      chatId,
      messageId,
      `⚠️ Remove lane #${lane.idx}: ${escapeHtml(lane.origin)} → ${escapeHtml(lane.dest)}?\nThis can't be undone.`,
      {
        inline_keyboard: [
          [{ text: "✅ Yes, remove it", callback_data: `lane:doremove:${idx}` }],
          [{ text: "✕ Cancel", callback_data: `lane:view:${idx}` }],
        ],
      }
    );
    await tgAnswerCallback(env, cq.id);
    return;
  }

  if (data.startsWith("lane:doremove:")) {
    const idx = data.slice("lane:doremove:".length);
    let lanes = await getLanes(env);
    const removedLane = lanes.find((l) => l.idx === idx);
    lanes = lanes.filter((l) => l.idx !== idx);
    await saveLanes(env, lanes);
    const { text, keyboard } = await buildLanesView(env);
    await tgEditMessage(env, chatId, messageId, text, keyboard);
    await tgAnswerCallback(env, cq.id, `Removed lane #${idx}`);
    if (removedLane) await notifyTeamOfLaneChange(env, "removed", removedLane, fromId);
    return;
  }

  // Server-side guard, not just a hidden button — website roster management is
  // Admin-only, not Owner (see mainMenuKeyboard/hasRosterAccess above).
  const isRosterAction =
    data === "menu:roster" ||
    data === "roster:add" ||
    data.startsWith("rosteradd:skip:") ||
    data.startsWith("roster:view:") ||
    data.startsWith("roster:edit:") ||
    data.startsWith("roster:confirmremove:") ||
    data.startsWith("roster:doremove:");
  if (isRosterAction && !hasRosterAccess(requester)) {
    await tgAnswerCallback(env, cq.id, "Only Admin can manage the website roster.");
    return;
  }

  if (data === "menu:roster") {
    const { text, keyboard } = await buildRosterView(env);
    await tgEditMessage(env, chatId, messageId, text, keyboard);
    await tgAnswerCallback(env, cq.id);
    return;
  }

  if (data === "roster:add") {
    await setPending(env, fromId, { type: "roster_add", step: "name", anchorMessageId: messageId });
    await tgAnswerCallback(env, cq.id);
    await tgEditMessage(env, chatId, messageId, "What's their name?", cancelKeyboard("roster:cancelflow"));
    return;
  }

  if (data === "roster:cancelflow") {
    const { text, keyboard } = await buildRosterView(env);
    await tgEditMessage(env, chatId, messageId, text, keyboard);
    await tgAnswerCallback(env, cq.id, "Cancelled.");
    return;
  }

  if (data.startsWith("rosteradd:skip:")) {
    const field = data.slice("rosteradd:skip:".length);
    const pending = await getPending(env, fromId);
    if (!pending || pending.type !== "roster_add" || pending.step !== field) {
      await tgAnswerCallback(env, cq.id, "That step already finished or expired.");
      return;
    }
    const anchor = pending.anchorMessageId || messageId;
    if (field === "experience") {
      await setPending(env, fromId, { ...pending, step: "bio", experience: "" });
      await tgAnswerCallback(env, cq.id, "Skipped.");
      await tgEditMessage(env, chatId, anchor, "Short bio line?", {
        inline_keyboard: [
          [{ text: "⏭ Skip", callback_data: "rosteradd:skip:bio" }],
          [{ text: "✕ Cancel", callback_data: "roster:cancelflow" }],
        ],
      });
      return;
    }
    if (field === "bio") {
      await setPending(env, fromId, { ...pending, step: "photo", bio: "" });
      await tgAnswerCallback(env, cq.id, "Skipped.");
      await tgEditMessage(env, chatId, anchor, "Now send their photo (as a Telegram photo, not a file).", cancelKeyboard("roster:cancelflow"));
      return;
    }
    await tgAnswerCallback(env, cq.id);
    return;
  }

  if (data.startsWith("roster:view:")) {
    const id = data.slice("roster:view:".length);
    const view = await buildRosterDetailView(env, id);
    if (!view) {
      await tgAnswerCallback(env, cq.id, "That member no longer exists.");
      return;
    }
    await tgEditMessage(env, chatId, messageId, view.text, view.keyboard);
    await tgAnswerCallback(env, cq.id);
    return;
  }

  if (data.startsWith("roster:edit:")) {
    const [, , id, field] = data.split(":");
    if (!["name", "role", "experience", "bio", "photo"].includes(field)) {
      await tgAnswerCallback(env, cq.id, "Invalid field.");
      return;
    }
    await setPending(env, fromId, { type: "roster_edit", memberId: id, field, anchorMessageId: messageId });
    await tgAnswerCallback(env, cq.id);
    const prompt = field === "photo"
      ? "Send the new photo (as a Telegram photo), or type 'cancel' to keep the current one."
      : `Send the new ${field}.`;
    await tgEditMessage(env, chatId, messageId, prompt, cancelKeyboard(`roster:view:${id}`));
    return;
  }

  if (data.startsWith("roster:confirmremove:")) {
    const id = data.slice("roster:confirmremove:".length);
    const roster = await getRoster(env);
    const member = roster.find((m) => m.id === id);
    if (!member) {
      await tgAnswerCallback(env, cq.id, "That member no longer exists.");
      return;
    }
    await tgEditMessage(
      env,
      chatId,
      messageId,
      `⚠️ Remove ${escapeHtml(member.name)} from the website roster?\nThis can't be undone.`,
      {
        inline_keyboard: [
          [{ text: "✅ Yes, remove it", callback_data: `roster:doremove:${id}` }],
          [{ text: "✕ Cancel", callback_data: `roster:view:${id}` }],
        ],
      }
    );
    await tgAnswerCallback(env, cq.id);
    return;
  }

  if (data.startsWith("roster:doremove:")) {
    const id = data.slice("roster:doremove:".length);
    let roster = await getRoster(env);
    const removed = roster.find((m) => m.id === id);
    roster = roster.filter((m) => m.id !== id);
    await saveRoster(env, roster);
    if (removed?.hasPhoto) {
      try {
        await deleteRosterPhoto(env, id);
      } catch (err) {
        console.error("Roster photo delete failed:", err?.message || err);
      }
    }
    const { text, keyboard } = await buildRosterView(env);
    await tgEditMessage(env, chatId, messageId, text, keyboard);
    await tgAnswerCallback(env, cq.id, removed ? `Removed ${removed.name}` : "Removed");
    return;
  }

  if (data === "menu:toggle_pause") {
    const wasPaused = await getPaused(env);
    await setPaused(env, !wasPaused);
    await tgEditMessage(env, chatId, messageId, "🚛 ASF Cargo Admin Panel", mainMenuKeyboard(!wasPaused, requester.role || "admin"));
    await tgAnswerCallback(env, cq.id, wasPaused ? "Notifications resumed" : "Notifications paused");
    return;
  }

  if (data.startsWith("addrole:")) {
    const [, targetId, role] = data.split(":");
    if (!["owner", "admin", "member"].includes(role)) {
      await tgAnswerCallback(env, cq.id, "Invalid role.");
      return;
    }
    const admins = await getAdmins(env);
    if (admins.some((a) => String(a.id) === targetId)) {
      await tgAnswerCallback(env, cq.id, "Already on the team.");
      return;
    }
    admins.push({ id: targetId, role, addedBy: String(fromId), addedAt: new Date().toISOString() });
    await saveAdmins(env, admins);

    const { text, keyboard } = await buildAdminsView(env, requester.role || "admin");
    await tgEditMessage(env, chatId, messageId, `✅ Added as ${roleTag(role)}.\n\n${text}`, keyboard);
    await tgAnswerCallback(env, cq.id, "Added!");

    // Best-effort: greet them (only works if they've already messaged the bot).
    try {
      const greeting = hasPanelAccess({ role })
        ? `You've been added as ASF Cargo ${roleTag(role)}. You'll now receive driver application notifications here. Send /menu to see the admin panel.`
        : "You've been added to ASF Cargo's notification list. You'll receive new driver application alerts here.";
      await tgSend(env, targetId, greeting);
    } catch (err) {
      console.error("Could not greet new team member (they may not have messaged the bot yet):", err?.message || err);
    }
    return;
  }

  if (data.startsWith("admin:remove:")) {
    const targetId = data.slice("admin:remove:".length);
    let admins = await getAdmins(env);
    const target = admins.find((a) => String(a.id) === targetId);
    // Server-side guard matching the UI: Admins can't be removed by anyone,
    // Owner included, even if this callback were ever triggered outside the
    // normal button (the button itself is already hidden for admin rows).
    if (target && (target.role || "admin") === "admin") {
      await tgAnswerCallback(env, cq.id, "Admins can't be removed here.");
      return;
    }
    admins = admins.filter((a) => String(a.id) !== targetId);
    await saveAdmins(env, admins);
    const { text, keyboard } = await buildAdminsView(env, requester.role || "admin");
    await tgEditMessage(env, chatId, messageId, text, keyboard);
    await tgAnswerCallback(env, cq.id, `Removed ${targetId}`);
    return;
  }

  await tgAnswerCallback(env, cq.id);
}

// ============================================================
// One-time setup: register the webhook with Telegram
// ============================================================

async function handleSetupWebhook(request, url, env) {
  // Header instead of a URL query param — query strings routinely end up in
  // server access logs, browser history, and Referer headers; a header
  // doesn't get logged by any of those by default.
  if (request.headers.get("X-Setup-Secret") !== env.SETUP_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const webhookUrl = `${url.origin}/telegram-webhook`;
  const res = await fetch(tgApi(env, "setWebhook"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: env.TELEGRAM_WEBHOOK_SECRET,
      allowed_updates: ["message", "callback_query"],
    }),
  });
  const result = await res.json();

  const commandsRes = await fetch(tgApi(env, "setMyCommands"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commands: [
        { command: "start", description: "Open the admin panel (or get your ID)" },
        { command: "menu", description: "Open the admin panel" },
        { command: "whoami", description: "Show your Telegram ID and role" },
        { command: "addmember", description: "Add someone by numeric ID — role chosen next" },
      ],
    }),
  });
  const commandsResult = await commandsRes.json();

  return new Response(JSON.stringify({ webhook: result, commands: commandsResult }, null, 2), {
    status: res.ok && commandsRes.ok ? 200 : 500,
    headers: { "Content-Type": "application/json" },
  });
}
