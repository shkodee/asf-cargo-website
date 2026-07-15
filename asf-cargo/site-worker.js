/**
 * Wraps the static asset server (see wrangler.jsonc's `assets` binding) to
 * force HTTPS and add HSTS.
 *
 * Without this, both custom domains served plain, unencrypted HTTP as a real
 * 200 response instead of redirecting to HTTPS — Cloudflare's zone-level
 * "Always Use HTTPS" setting wasn't covering this Worker route. That's what
 * browsers were flagging with a "not secure" warning even though the HTTPS
 * side of the site had a perfectly valid certificate.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.protocol === "http:") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
