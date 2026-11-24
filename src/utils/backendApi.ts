/**
 * The project ships two ways to run: `npm run dev` starts server.ts with
 * /api/* endpoints, while GitHub Pages serves only static files. Callers need
 * to know which one they are on before firing requests, otherwise every page
 * load logs a 404 and the browser retries the same missing endpoint.
 *
 * The probe runs once per session and its result is cached.
 */

let probePromise: Promise<boolean> | null = null;

async function detect(): Promise<boolean> {
  try {
    const res = await fetch('/api/health', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    const contentType = res.headers.get('content-type') ?? '';
    // A static host answers unknown paths with the SPA shell (text/html), so
    // the content type is what distinguishes a real endpoint from a 404 page.
    return res.ok && contentType.includes('application/json');
  } catch {
    return false;
  }
}

/** Resolves true when the express backend is serving this deployment. */
export function hasBackendApi(): Promise<boolean> {
  // The static bundle is built without a backend, so the answer is known up
  // front and no request is needed.
  if (!__HAS_BACKEND__) return Promise.resolve(false);
  if (!probePromise) probePromise = detect();
  return probePromise;
}
