export async function safeReadJson<T = unknown>(
  res: Response,
  fallbackError = 'Unexpected server response.'
): Promise<T> {
  const raw = await res.text();
  const trimmed = raw.trim();

  if (!trimmed) {
    if (!res.ok) {
      throw new Error(`${fallbackError} (HTTP ${res.status})`);
    }
    return {} as T;
  }

  const looksLikeHtml =
    trimmed.startsWith('<!') ||
    trimmed.toLowerCase().startsWith('<html') ||
    trimmed.startsWith('<');

  if (looksLikeHtml) {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error(
        `Server is temporarily unavailable (HTTP ${res.status}). Please retry in a moment.`
      );
    }
    throw new Error(
      `${fallbackError} The endpoint returned an HTML page instead of JSON (HTTP ${res.status}).`
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(`${fallbackError} Invalid JSON response (HTTP ${res.status}).`);
  }

  if (!res.ok) {
    const errObj = parsed as { error?: string; message?: string };
    throw new Error(errObj?.error || errObj?.message || `${fallbackError} (HTTP ${res.status})`);
  }

  return parsed as T;
}

export const API_UNAVAILABLE_MESSAGE_BN =
  'এই সুবিধাটি এআই সার্ভারে চলে, যা এই স্ট্যাটিক ডিপ্লয়মেন্টে চালু নেই। বাকি সব বিভাগ (কুরআন, নামাজ, হাদিস, জ্ঞানকোষ) সম্পূর্ণ কাজ করে।';

export const SERVER_ONLY_MEDIA_MESSAGE_BN =
  'মিউজিক ও ভিডিও জেনারেশন শুধু এআই সার্ভারে চলে, ব্রাউজার থেকে চালানো যায় না। চ্যাট ও অডিও ট্রান্সক্রিপশন আপনার নিজের key দিয়ে এখানেই কাজ করে।';

/** True when the request never reached a real API because the deploy is static. */
export function isServerOnlyFailure(err: unknown): boolean {
  return (
    err instanceof ApiUnavailableError ||
    (err instanceof Error && /HTML page instead of JSON|not running on this deployment/i.test(err.message))
  );
}

export class ApiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiUnavailableError';
  }
}

/**
 * Calls a JSON API endpoint that only exists when the express server is
 * running. On the static deploy those paths answer with the SPA shell and
 * HTTP 200, which used to surface as "the endpoint returned an HTML page
 * instead of JSON". Detecting that here lets callers fall back to bundled
 * data or show a clear "server-only feature" message.
 */
export async function postJson<T = unknown>(
  url: string,
  body: unknown,
  fallbackError = 'Request failed.'
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new ApiUnavailableError(
      'This feature needs the AI server, which is not running on this deployment.'
    );
  }

  return safeReadJson<T>(res, fallbackError);
}
