import type { ApplicationPayload } from '../types';

// Cloudflare Worker relay — see worker/README.md for setup. Field names here are a contract
// with worker/worker.js; don't rename without updating that file too.
const APPLICATION_ENDPOINT = 'https://asf-cargo-relay.afzaljon0411.workers.dev';

// multipart/form-data, not JSON, so the optional CDL file can ride along in the
// same request. Don't set a Content-Type header manually here — the browser
// needs to add its own boundary parameter, which it only does when it sets the
// header itself.
export async function submitApplication(payload: ApplicationPayload, cdlFile: File | null): Promise<Response> {
  const body = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    body.append(key, value);
  }
  if (cdlFile) {
    body.append('cdlFile', cdlFile);
  }
  const res = await fetch(APPLICATION_ENDPOINT, { method: 'POST', body });
  if (!res.ok) throw new Error('Request failed');
  return res;
}
