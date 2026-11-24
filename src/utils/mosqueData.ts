export interface Mosque {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  jummahTime?: string;
  phone?: string;
  source: 'osm' | 'seed';
}

export interface MosqueInfoPatch {
  jummahTime?: string;
  phone?: string;
}

const INFO_STORAGE_KEY = 'islamic-life:mosque-info:v1';

const SEED_MOSQUES: Mosque[] = [
  {
    id: 'seed-baitul-mukarram',
    name: 'বাইতুল মোকাররম জাতীয় মসজিদ',
    address: 'পল্টন, ঢাকা ১০০০',
    lat: 23.7296,
    lng: 90.4125,
    jummahTime: '1:00 PM',
    phone: '+880 2-9553145',
    source: 'seed',
  },
  {
    id: 'seed-gulshan-central',
    name: 'গুলশান সেন্ট্রাল মসজিদ',
    address: 'গুলশান-১, ঢাকা ১২১২',
    lat: 23.7806,
    lng: 90.4158,
    jummahTime: '1:30 PM',
    phone: '+880 1711-234567',
    source: 'seed',
  },
  {
    id: 'seed-gazipur-boro',
    name: 'গাজীপুর বড় মসজিদ',
    address: 'জেলা সদর, গাজীপুর ১৭০০',
    lat: 23.9999,
    lng: 90.4203,
    jummahTime: '1:15 PM',
    source: 'seed',
  },
  {
    id: 'seed-gazipur-jame',
    name: 'জামিয়া মসজিদ, টঙ্গী',
    address: 'টঙ্গী বাজার, গাজীপুর ১৭১০',
    lat: 23.8919,
    lng: 90.4028,
    phone: '+880 1912-345678',
    source: 'seed',
  },
  {
    id: 'seed-dhanmondi',
    name: 'ধানমন্ডি ঈদগাহ মসজিদ',
    address: 'ধানমন্ডি-৭, ঢাকা ১২০৯',
    lat: 23.7465,
    lng: 90.376,
    jummahTime: '1:20 PM',
    source: 'seed',
  },
  {
    id: 'seed-uttara-sector7',
    name: 'উত্তরা সেক্টর-৭ মসজিদ',
    address: 'উত্তরা মডেল টাউন, ঢাকা ১২৩০',
    lat: 23.8687,
    lng: 90.3796,
    jummahTime: '1:25 PM',
    phone: '+880 1833-456789',
    source: 'seed',
  },
];

export const SEED_MOSQUES_FOR_TEST = SEED_MOSQUES;

export function readMosqueInfo(): Record<string, MosqueInfoPatch> {
  try {
    const raw = localStorage.getItem(INFO_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, MosqueInfoPatch>) : {};
  } catch {
    return {};
  }
}

export function saveMosqueInfo(id: string, patch: MosqueInfoPatch): Record<string, MosqueInfoPatch> {
  const all = readMosqueInfo();
  all[id] = { ...all[id], ...patch };
  try {
    localStorage.setItem(INFO_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Storage can be full or blocked; the in-memory value still applies this session.
  }
  return all;
}

export function applyLocalInfo(mosque: Mosque, info: Record<string, MosqueInfoPatch>): Mosque {
  const patch = info[mosque.id];
  if (!patch) return mosque;
  return {
    ...mosque,
    jummahTime: patch.jummahTime?.trim() || mosque.jummahTime,
    phone: patch.phone?.trim() || mosque.phone,
  };
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface LatLngBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

// Only planet-wide mirrors belong here. Regional extracts (overpass.osm.ch is
// Switzerland-only) answer 200 with an empty set for the rest of the world,
// which reads as "no mosques here" and is worse than no answer at all.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

// Public Overpass instances are load balanced and drift between "fast" and
// "502 at capacity" from minute to minute, so the mirrors are raced instead of
// tried in turn: whichever answers first wins and the rest are aborted.
const OVERPASS_TIMEOUT_MS = 25_000;
const MAX_ELEMENTS = 1500;

// Overpass rejects or times out on continent-sized bounding boxes. Roughly a
// 1-degree span is a large metro area and still answers in seconds.
export const MAX_BOUNDS_SPAN_DEG = 1.2;

export function boundsTooLarge(b: LatLngBounds): boolean {
  return b.north - b.south > MAX_BOUNDS_SPAN_DEG || b.east - b.west > MAX_BOUNDS_SPAN_DEG;
}

export function boundsContains(b: LatLngBounds, lat: number, lng: number): boolean {
  return lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east;
}

// `religion=muslim` alone misses a lot of the world: many mosques are mapped
// only as `building=mosque`. Query both so coverage holds outside Bangladesh.
function buildOverpassQuery(b: LatLngBounds): string {
  const bbox = `${b.south},${b.west},${b.north},${b.east}`;
  return `[out:json][timeout:25];
(
  node["amenity"="place_of_worship"]["religion"="muslim"](${bbox});
  way["amenity"="place_of_worship"]["religion"="muslim"](${bbox});
  node["building"="mosque"](${bbox});
  way["building"="mosque"](${bbox});
);
out center ${MAX_ELEMENTS};`;
}

function toMosque(el: OverpassElement): Mosque | null {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  const tags = el.tags ?? {};
  // Unnamed mosque buildings are common in OSM and still worth showing, so fall
  // back to a generic label instead of dropping them.
  const name = tags.name || tags['name:bn'] || tags['name:en'] || 'মসজিদ';

  const street = [tags['addr:street'], tags['addr:suburb'], tags['addr:city']]
    .filter(Boolean)
    .join(', ');

  return {
    id: `osm-${el.type}-${el.id}`,
    name,
    address: street || (tags['addr:full'] ?? '') || 'ঠিকানা নেই',
    lat,
    lng,
    phone: tags.phone ?? tags['contact:phone'],
    source: 'osm',
  };
}

async function queryEndpoint(
  endpoint: string,
  body: string,
  signal: AbortSignal,
): Promise<Mosque[]> {
  const attempt = new AbortController();
  const timer = setTimeout(() => attempt.abort(), OVERPASS_TIMEOUT_MS);
  const relay = () => attempt.abort();
  signal.addEventListener('abort', relay);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: attempt.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: { elements?: OverpassElement[] } = await res.json();
    return (json.elements ?? []).map(toMosque).filter((m): m is Mosque => m !== null);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', relay);
  }
}

export interface BoundsResult {
  mosques: Mosque[];
  // True when at least one mirror answered, even if it had nothing to report.
  reached: boolean;
}

export async function fetchMosquesInBounds(
  bounds: LatLngBounds,
  signal?: AbortSignal,
): Promise<BoundsResult> {
  const body = `data=${encodeURIComponent(buildOverpassQuery(bounds))}`;
  const racers = new AbortController();
  const relay = () => racers.abort();
  signal?.addEventListener('abort', relay);

  try {
    return await new Promise<BoundsResult>((resolve, reject) => {
      let pending = OVERPASS_ENDPOINTS.length;
      let done = false;
      // A mirror that answers "nothing here" is still an answer, but an empty
      // reply is often a partial outage, so wait for a richer one first.
      let emptyAnswer = false;

      const finish = (result: BoundsResult) => {
        if (done) return;
        done = true;
        racers.abort();
        resolve(result);
      };

      OVERPASS_ENDPOINTS.forEach((endpoint) => {
        queryEndpoint(endpoint, body, racers.signal).then(
          (mosques) => {
            if (mosques.length > 0) return finish({ mosques, reached: true });
            emptyAnswer = true;
            if (--pending === 0) finish({ mosques: [], reached: true });
          },
          () => {
            if (--pending > 0) return;
            if (signal?.aborted) reject(new DOMException('Aborted', 'AbortError'));
            else finish({ mosques: [], reached: emptyAnswer });
          },
        );
      });
    });
  } finally {
    signal?.removeEventListener('abort', relay);
  }
}

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function googleDirectionsUrl(m: Mosque): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`;
}
