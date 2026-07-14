import type { ApplicationPayload } from '../types';

// Cloudflare Worker relay — see worker/README.md for setup. Field names here are a contract
// with worker/worker.js; don't rename without updating that file too.
const APPLICATION_ENDPOINT = 'https://asf-cargo-relay.afzaljon0411.workers.dev';

export async function submitApplication(payload: ApplicationPayload): Promise<Response> {
  const res = await fetch(APPLICATION_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Request failed');
  return res;
}
