/**
 * ASF Cargo — Application Relay Worker
 * Receives the driver application form POST, then:
 *   1. Sends it as a message to your Telegram chat/group
 *   2. Emails it to you via Resend (resend.com — free tier is plenty)
 *
 * Deploy this on Cloudflare Workers (free tier). See README.md in this folder
 * for the 10-minute setup walkthrough.
 */

export default {
  async fetch(request, env) {
    // CORS headers — allows your site to call this Worker from the browser
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // tighten to your real domain once live, e.g. "https://asfcargo.com"
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

    // Basic honeypot / sanity check
    if (!data.firstName || !data.phone) {
      return new Response("Missing required fields", { status: 400, headers: corsHeaders });
    }

    const summary = buildSummary(data);

    const results = await Promise.allSettled([
      sendTelegram(env, summary),
      sendEmail(env, summary, data),
    ]);

    const failed = results.filter(r => r.status === "rejected");
    if (failed.length === results.length) {
      // both failed
      return new Response("Failed to deliver application", { status: 502, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  },
};

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
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
    }),
  });
  if (!res.ok) throw new Error("Telegram send failed: " + (await res.text()));
  return res;
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
