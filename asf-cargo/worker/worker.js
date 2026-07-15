/**
 * ASF Cargo — Application Relay + Telegram Admin Bot Worker
 *
 * Two jobs, in one Worker (shares the same bot token/KV):
 *   1. Relay: receives the driver application form POST, then DMs it to every
 *      admin's Telegram (via the bot) and emails it via Resend.
 *   2. Bot: handles the Telegram bot's commands/buttons (/start, /whoami,
 *      /addmember, and the inline admin panel — manage admins, pause/resume
 *      notifications, view stats, manage lanes). Admins and lanes are stored
 *      in KV, not static data, so they can be managed live from the bot.
 *
 * Routes:
 *   POST /                 — the application form's relay endpoint (CORS-protected)
 *   GET  /lanes             — public, CORS-protected: current lane list as JSON,
 *                            read by the website at runtime instead of a static import
 *   POST /telegram-webhook — Telegram sends bot updates here (verified via secret token)
 *   GET  /setup-webhook    — one-time: tells Telegram to start sending updates to
 *                            /telegram-webhook (protected by SETUP_SECRET query param)
 *
 * Deploy this on Cloudflare Workers (free tier). See README.md in this folder
 * for the full setup walkthrough.
 */

const ALLOWED_ORIGINS = [
  "https://asfcargollc.com",
  "https://www.asfcargollc.com",
  "https://asf-cargo-website.afzaljon0411.workers.dev",
];

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

    return handleApplicationForm(request, env);
  },
};

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
    headers: { ...headers, "Content-Type": "application/json" },
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

  let data;
  try {
    data = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
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

  const summary = buildSummary(data);

  await logApplication(env);

  const results = await Promise.allSettled([
    sendTelegram(env, summary),
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

function buildSummary(d) {
  const lines = [
    `🚛 NEW DRIVER APPLICATION`,
    ``,
    `Name: ${d.firstName || ""} ${d.lastName || ""}`,
    `Phone: ${d.phone || "-"}`,
    `Email: ${d.email || "-"}`,
    `Position: ${d.position || "-"}`,
    `CDL #: ${d.cdlNumber || "-"} (${d.cdlState || "-"})`,
    `Experience: ${d.experience || "-"}`,
    `Location: ${d.city || "-"}`,
  ];

  if (d.hasCoDriver) {
    lines.push(``, `Co-driver: ${d.hasCoDriver}`);
    if (d.coDriverFirstName || d.coDriverLastName) {
      lines.push(
        `  Name: ${d.coDriverFirstName || ""} ${d.coDriverLastName || ""}`,
        `  Phone: ${d.coDriverPhone || "-"}`,
        `  Email: ${d.coDriverEmail || "-"}`,
        `  Location: ${d.coDriverCity || "-"}`,
        `  CDL #: ${d.coDriverCdlNumber || "-"} (${d.coDriverCdlState || "-"})`,
        `  Experience: ${d.coDriverExperience || "-"}`
      );
    }
  }

  lines.push(``, `Message: ${d.message || "-"}`);
  return lines.join("\n");
}

async function sendTelegram(env, text) {
  const paused = await getPaused(env);
  if (paused) {
    console.log("Notifications paused via /pause — skipping Telegram send.");
    return { skipped: true };
  }

  const admins = await getAdmins(env);
  const chatIds = admins.map((a) => a.id);

  if (chatIds.length === 0) throw new Error("No team members configured — use /addmember in the bot");

  const results = await Promise.allSettled(
    chatIds.map((chat_id) => tgSend(env, chat_id, text))
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
async function handlePendingLaneInput(env, chatId, fromId, text, pending) {
  if (pending.step === "origin" || pending.step === "dest") {
    let coords;
    try {
      coords = await geocodeCity(text);
    } catch (err) {
      console.error("Geocoding error:", err?.message || err);
      await tgSend(env, chatId, "Geocoding failed — try again in a moment.");
      return;
    }
    if (!coords) {
      await tgSend(env, chatId, `Couldn't find "${text}" — try again with the format 'City, ST' (e.g. Memphis, TN).`);
      return;
    }

    if (pending.step === "origin") {
      await setPending(env, fromId, {
        step: "dest",
        originCity: text,
        originState: stateNameFromCityState(text),
        originCoords: coords,
      });
      await tgSend(env, chatId, `✅ Origin: ${text}\n\nNow send the destination as 'City, ST'.`);
      return;
    }

    await setPending(env, fromId, {
      ...pending,
      step: "status",
      destCity: text,
      destState: stateNameFromCityState(text),
      destCoords: coords,
    });
    await tgSend(env, chatId, `✅ Destination: ${text}\n\nWhat's the status?`, {
      inline_keyboard: [
        [{ text: "Daily", callback_data: "lanestatus:Daily" }],
        [{ text: "Weekly", callback_data: "lanestatus:Weekly" }],
        [{ text: "Paused", callback_data: "lanestatus:Paused" }],
      ],
    });
    return;
  }

  if (pending.step === "status") {
    // Free-text status typed instead of tapping one of the buttons.
    await finalizeLane(env, chatId, fromId, { ...pending, status: text });
  }
}

async function finalizeLane(env, chatId, fromId, draft) {
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
  await tgSend(
    env,
    chatId,
    `✅ Added lane #${idx}: ${lane.origin} → ${lane.dest} (${lane.status})\n\n${text}`,
    keyboard
  );
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

function formatAdminLabel(id, profile) {
  if (profile?.username) return `@${profile.username} (${id})`;
  if (profile?.firstName) return `${profile.firstName} (${id})`;
  return `${id}`;
}

async function buildAdminsView(env) {
  const admins = await getAdmins(env);
  const profiles = await Promise.all(admins.map((a) => getUserProfile(env, a.id)));
  const labeled = admins.map((a, i) => ({
    id: a.id,
    role: a.role || "admin",
    label: formatAdminLabel(a.id, profiles[i]),
  }));

  const listText = labeled.length
    ? labeled.map((a) => `• ${a.label} — ${roleTag(a.role)}`).join("\n")
    : "(none)";
  const keyboard = {
    inline_keyboard: [
      // Admins can't be removed from this panel by anyone, Owner included —
      // no remove button shown for them at all (see `admin:remove:` handler
      // for the matching server-side guard).
      ...labeled
        .filter((a) => a.role !== "admin")
        .map((a) => [
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
    text: `🛣 Lane #${lane.idx}\n${lane.origin} → ${lane.dest}\nStatus: ${lane.status}`,
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
  return res;
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

function mainMenuKeyboard(paused) {
  return {
    inline_keyboard: [
      [{ text: "👥 Team", callback_data: "menu:admins" }],
      [{ text: "🛣 Lanes", callback_data: "menu:lanes" }],
      [{ text: "📊 Stats", callback_data: "menu:stats" }],
      [{ text: paused ? "▶️ Resume notifications" : "⏸ Pause notifications", callback_data: "menu:toggle_pause" }],
    ],
  };
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
  if (pending && !text.startsWith("/")) {
    await handlePendingLaneInput(env, chatId, fromId, text, pending);
    return;
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
    await tgSend(env, chatId, "🚛 ASF Cargo Admin Panel", mainMenuKeyboard(paused));
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
    await tgSend(env, chatId, `What role should ${label} have?`, {
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
  if (!hasPanelAccess(requester)) {
    await tgAnswerCallback(env, cq.id, "Not authorized.");
    return;
  }

  if (data === "menu:home") {
    const paused = await getPaused(env);
    await tgEditMessage(env, chatId, messageId, "🚛 ASF Cargo Admin Panel", mainMenuKeyboard(paused));
    await tgAnswerCallback(env, cq.id);
    return;
  }

  if (data === "menu:admins") {
    const { text, keyboard } = await buildAdminsView(env);
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
    await setPending(env, fromId, { step: "origin" });
    await tgAnswerCallback(env, cq.id);
    await tgSend(env, chatId, "Send the origin as 'City, ST' (e.g. Memphis, TN).");
    return;
  }

  if (data.startsWith("lanestatus:")) {
    const status = data.slice("lanestatus:".length);
    const pending = await getPending(env, fromId);
    if (!pending || pending.step !== "status") {
      await tgAnswerCallback(env, cq.id, "That add-lane flow already finished or expired.");
      return;
    }
    await finalizeLane(env, chatId, fromId, { ...pending, status });
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
      `⚠️ Remove lane #${lane.idx}: ${lane.origin} → ${lane.dest}?\nThis can't be undone.`,
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
    lanes = lanes.filter((l) => l.idx !== idx);
    await saveLanes(env, lanes);
    const { text, keyboard } = await buildLanesView(env);
    await tgEditMessage(env, chatId, messageId, text, keyboard);
    await tgAnswerCallback(env, cq.id, `Removed lane #${idx}`);
    return;
  }

  if (data === "menu:toggle_pause") {
    const wasPaused = await getPaused(env);
    await setPaused(env, !wasPaused);
    await tgEditMessage(env, chatId, messageId, "🚛 ASF Cargo Admin Panel", mainMenuKeyboard(!wasPaused));
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

    const { text, keyboard } = await buildAdminsView(env);
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
    const { text, keyboard } = await buildAdminsView(env);
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
  if (url.searchParams.get("secret") !== env.SETUP_SECRET) {
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
