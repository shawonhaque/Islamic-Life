const KEY_STORAGE = 'islamic-life.gemini-api-key';

const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models';

export type BrowserChatModel = 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.5-flash-lite';

export type BrowserThinkingDepth = 'low' | 'medium' | 'high';

export interface BrowserChatTurn {
  role: 'user' | 'model';
  text: string;
}

export class GeminiKeyMissingError extends Error {
  constructor() {
    super('No Gemini API key saved in this browser.');
    this.name = 'GeminiKeyMissingError';
  }
}

export function getBrowserGeminiKey(): string {
  try {
    return (localStorage.getItem(KEY_STORAGE) || '').trim();
  } catch {
    return '';
  }
}

export function saveBrowserGeminiKey(key: string): void {
  try {
    const clean = key.trim();
    if (clean) {
      localStorage.setItem(KEY_STORAGE, clean);
    } else {
      localStorage.removeItem(KEY_STORAGE);
    }
  } catch {
    // storage disabled; the caller surfaces the failure through hasBrowserGeminiKey
  }
}

export function hasBrowserGeminiKey(): boolean {
  return getBrowserGeminiKey().length > 0;
}

// gemini-2.5-pro cannot disable thinking, so its floor is a small budget
// rather than 0. Flash and Flash Lite accept 0 to skip reasoning entirely.
function thinkingBudgetFor(model: BrowserChatModel, depth: BrowserThinkingDepth): number {
  if (model === 'gemini-2.5-flash-lite') return 0;
  if (depth === 'high') return 24576;
  if (depth === 'medium') return 8192;
  return model === 'gemini-2.5-pro' ? 1024 : 0;
}

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; status?: string; code?: number };
}

async function callGemini(
  model: BrowserChatModel,
  body: Record<string, unknown>
): Promise<string> {
  const key = getBrowserGeminiKey();
  if (!key) throw new GeminiKeyMissingError();

  const res = await fetch(`${API_ROOT}/${model}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let payload: GeminiResponse;
  try {
    payload = (await res.json()) as GeminiResponse;
  } catch {
    throw new Error(
      res.ok
        ? 'Gemini returned an unreadable response.'
        : `Gemini request failed (HTTP ${res.status}).`
    );
  }

  if (!res.ok) {
    throw new Error(describeGeminiError(res.status, payload));
  }

  if (payload.promptFeedback?.blockReason) {
    throw new Error(
      `Gemini declined this request (${payload.promptFeedback.blockReason}). Try rephrasing it.`
    );
  }

  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((p) => p.text || '')
    .join('')
    .trim();

  if (!text) {
    const reason = payload.candidates?.[0]?.finishReason;
    throw new Error(
      reason === 'SAFETY'
        ? 'Gemini blocked this response for safety reasons. Try rephrasing your question.'
        : 'Gemini returned an empty response.'
    );
  }

  return text;
}

function describeGeminiError(status: number, payload: GeminiResponse): string {
  const detail = (payload.error?.message || '').trim();
  if (status === 400 && /API key not valid/i.test(detail)) {
    return 'The saved Gemini API key is not valid. Check it in Settings.';
  }
  if (status === 403) {
    return 'This API key is not allowed from a browser. In Google AI Studio, set the key restriction to "HTTP referrers" and add this site.';
  }
  if (status === 404) {
    return 'This Gemini model is not available for your key. Pick another model in Settings.';
  }
  if (status === 429) {
    return 'Gemini free-tier quota reached. Wait a minute or use a different key.';
  }
  if (status >= 500) {
    return 'Gemini is temporarily unavailable. Please retry in a moment.';
  }
  return detail || `Gemini request failed (HTTP ${status}).`;
}

export async function browserChat(options: {
  model: BrowserChatModel;
  systemInstruction: string;
  history: BrowserChatTurn[];
  message: string;
  thinkingDepth: BrowserThinkingDepth;
}): Promise<string> {
  const contents = [
    ...options.history
      .filter((turn) => turn.text.trim().length > 0)
      .slice(-24)
      .map((turn) => ({ role: turn.role, parts: [{ text: turn.text.trim() }] })),
    { role: 'user', parts: [{ text: options.message }] },
  ];

  return callGemini(options.model, {
    contents,
    systemInstruction: { parts: [{ text: options.systemInstruction }] },
    generationConfig: {
      thinkingConfig: {
        thinkingBudget: thinkingBudgetFor(options.model, options.thinkingDepth),
      },
    },
  });
}

export async function browserTranscribe(options: {
  audioBase64: string;
  mimeType: string;
  languageHint: 'auto' | 'Bengali' | 'English' | 'Arabic';
}): Promise<string> {
  const languageLine =
    options.languageHint === 'auto'
      ? 'Detect the spoken language automatically.'
      : `The audio is mainly in ${options.languageHint}.`;

  return callGemini('gemini-2.5-flash', {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Transcribe this audio accurately. ${languageLine} Return only the transcript, without commentary or headings.`,
          },
          { inlineData: { mimeType: options.mimeType, data: options.audioBase64 } },
        ],
      },
    ],
    generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
  });
}
