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
