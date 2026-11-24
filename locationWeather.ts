import type { CityLocation, Language, LiveWeatherInfo } from '../types/islamic';
import { PRESET_CITIES, getTzOffsetFromIana } from './islamicMath';

interface WeatherConditionMeta {
  bn: string;
  en: string;
  kind: LiveWeatherInfo['iconKind'];
}

export function describeWeatherCode(code: number, isDay: boolean): WeatherConditionMeta {
  if (code === 0) {
    return {
      bn: isDay ? 'পরিষ্কার আকাশ' : 'পরিষ্কার রাত',
      en: isDay ? 'Clear Sky' : 'Clear Night',
      kind: isDay ? 'clear-day' : 'clear-night',
    };
  }
  if (code === 1 || code === 2) {
    return {
      bn: 'আংশিক মেঘলা',
      en: 'Partly Cloudy',
      kind: 'partly-cloudy',
    };
  }
  if (code === 3) {
    return {
      bn: 'মেঘলা আকাশ',
      en: 'Overcast',
      kind: 'cloudy',
    };
  }
  if (code === 45 || code === 48) {
    return {
      bn: 'কুয়াশাচ্ছন্ন',
      en: 'Fog & Mist',
      kind: 'fog',
    };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      bn: code >= 63 || code >= 81 ? 'মাঝারি থেকে ভারী বৃষ্টি' : 'হালকা বৃষ্টি',
      en: code >= 63 || code >= 81 ? 'Moderate / Heavy Rain' : 'Light Rain',
      kind: 'rain',
    };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return {
      bn: 'তুষারপাত',
      en: 'Snowfall',
      kind: 'snow',
    };
  }
  if (code >= 95) {
    return {
      bn: 'বজ্রসহ বৃষ্টি',
      en: 'Thunderstorm',
      kind: 'storm',
    };
  }
  return {
    bn: 'স্বাভাবিক আবহাওয়া',
    en: 'Fair Weather',
    kind: isDay ? 'clear-day' : 'clear-night',
  };
}

export async function fetchLiveWeather(
  lat: number,
  lng: number
): Promise<LiveWeatherInfo | null> {
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 7000);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
      lat.toFixed(4)
    )}&longitude=${encodeURIComponent(
      lng.toFixed(4)
    )}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=auto`;

    const res = await fetch(url, { signal: controller.signal });
    window.clearTimeout(timer);
    if (!res.ok) return null;

    const json = (await res.json()) as {
      utc_offset_seconds?: number;
      timezone?: string;
      current?: {
        temperature_2m?: number;
        relative_humidity_2m?: number;
        apparent_temperature?: number;
        is_day?: number;
        weather_code?: number;
        wind_speed_10m?: number;
      };
    };

    const cur = json.current;
    if (!cur || typeof cur.temperature_2m !== 'number') return null;

    const isDay = cur.is_day !== 0;
    const code = typeof cur.weather_code === 'number' ? cur.weather_code : 0;
    const desc = describeWeatherCode(code, isDay);
    const tzOffsetHours =
      typeof json.utc_offset_seconds === 'number'
        ? Math.round((json.utc_offset_seconds / 3600) * 4) / 4
        : undefined;

    return {
      temperatureC: Math.round(cur.temperature_2m),
      feelsLikeC:
        typeof cur.apparent_temperature === 'number'
          ? Math.round(cur.apparent_temperature)
          : Math.round(cur.temperature_2m),
      humidity:
        typeof cur.relative_humidity_2m === 'number'
          ? Math.round(cur.relative_humidity_2m)
          : 60,
      windKmh:
        typeof cur.wind_speed_10m === 'number' ? Math.round(cur.wind_speed_10m) : 8,
      weatherCode: code,
      isDay,
      conditionBn: desc.bn,
      conditionEn: desc.en,
      iconKind: desc.kind,
      timezoneName: json.timezone,
      tzOffsetHours,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function reverseGeocodeCoords(
  lat: number,
  lng: number,
  lang: Language
): Promise<{ city: string; country: string; countryCode?: string; region?: string } | null> {
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
        lat.toFixed(4)
      )}&longitude=${encodeURIComponent(lng.toFixed(4))}&localityLanguage=${
        lang === 'bn' ? 'bn' : 'en'
      }`,
      { signal: controller.signal }
    );
    window.clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
      countryName?: string;
      countryCode?: string;
    };
    const cityName = data.city || data.locality || data.principalSubdivision || '';
    const countryName = data.countryName || '';
    if (!cityName && !countryName) return null;
    const regionParts = [data.principalSubdivision, countryName].filter(Boolean);
    return {
      city: cityName || countryName,
      country: countryName,
      countryCode: data.countryCode ? data.countryCode.toUpperCase() : undefined,
      region: regionParts.join(', ') || undefined,
    };
  } catch {
    return null;
  }
}

export async function resolveBrowserGeolocation(
  lang: Language
): Promise<CityLocation | null> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lng = Number(pos.coords.longitude.toFixed(4));

        const [geoEn, geoBn, weather] = await Promise.all([
          reverseGeocodeCoords(lat, lng, 'en'),
          reverseGeocodeCoords(lat, lng, 'bn'),
          fetchLiveWeather(lat, lng),
        ]);

        const fallbackOffset =
          Math.round((-new Date().getTimezoneOffset() / 60) * 4) / 4;
        const browserTz =
          typeof Intl !== 'undefined'
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : undefined;
        const timeZoneId = weather?.timezoneName || browserTz;
        const tzOffset =
          weather?.tzOffsetHours ??
          (timeZoneId ? getTzOffsetFromIana(timeZoneId) : fallbackOffset);

        const nameEn = geoEn?.city || (lang === 'bn' ? 'Live Location' : 'Current Location');
        const nameBn = geoBn?.city || geoEn?.city || 'বর্তমান অবস্থান';
        const countryEn = geoEn?.country || 'GPS';
        const countryBn = geoBn?.country || geoEn?.country || 'লাইভ জিপিএস';

        resolve({
          id: 'live-gps',
          name_bn: nameBn,
          name_en: nameEn,
          country_bn: countryBn,
          country_en: countryEn,
          countryCode: geoEn?.countryCode || 'GP',
          region_bn: geoBn?.region || countryBn,
          region_en: geoEn?.region || countryEn,
          timeZoneId,
          lat,
          lng,
          tzOffset,
          isLiveGps: true,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 }
    );
  });
}

export async function resolveApproximateIpLocation(): Promise<CityLocation | null> {
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://get.geojs.io/v1/ip/geo.json', {
      signal: controller.signal,
    });
    window.clearTimeout(timer);
    if (!res.ok) return null;

    const data = (await res.json()) as {
      city?: string;
      region?: string;
      country?: string;
      country_code?: string;
      latitude?: string;
      longitude?: string;
    };
    const lat = Number(data.latitude);
    const lng = Number(data.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const weather = await fetchLiveWeather(lat, lng);
    const fallbackOffset =
      Math.round((-new Date().getTimezoneOffset() / 60) * 4) / 4;
    const cityLabel = data.city || data.region || data.country || 'Current City';
    const countryLabel = data.country || 'Auto';
    const regionLabel = [data.region, countryLabel].filter(Boolean).join(', ');

    return {
      id: 'live-gps',
      name_bn: cityLabel,
      name_en: cityLabel,
      country_bn: countryLabel,
      country_en: countryLabel,
      countryCode: data.country_code ? data.country_code.toUpperCase() : undefined,
      region_bn: regionLabel,
      region_en: regionLabel,
      timeZoneId: weather?.timezoneName,
      lat: Number(lat.toFixed(4)),
      lng: Number(lng.toFixed(4)),
      tzOffset: weather?.tzOffsetHours ?? fallbackOffset,
      isLiveGps: true,
    };
  } catch {
    return null;
  }
}

export async function searchGlobalCities(query: string): Promise<CityLocation[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 6000);
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      q
    )}&count=12&language=en&format=json`;
    const res = await fetch(url, { signal: controller.signal });
    window.clearTimeout(timer);
    if (!res.ok) return [];

    const json = (await res.json()) as {
      results?: Array<{
        id: number;
        name: string;
        latitude: number;
        longitude: number;
        country?: string;
        country_code?: string;
        admin1?: string;
        timezone?: string;
      }>;
    };

    const results = json.results || [];
    return results.map((r) => {
      const tzId = r.timezone || undefined;
      const offset = tzId ? getTzOffsetFromIana(tzId) : Math.round(r.longitude / 15);
      const country = r.country || r.country_code || 'World';
      const region = [r.admin1, country].filter(Boolean).join(', ');
      return {
        id: `om_${r.id}`,
        name_bn: r.name,
        name_en: r.name,
        country_bn: country,
        country_en: country,
        countryCode: r.country_code ? r.country_code.toUpperCase() : 'GL',
        region_bn: region,
        region_en: region,
        timeZoneId: tzId,
        lat: Number(r.latitude.toFixed(4)),
        lng: Number(r.longitude.toFixed(4)),
        tzOffset: offset,
      };
    });
  } catch {
    return [];
  }
}

export interface WorldTimezoneOption {
  timeZoneId: string;
  cityLabel: string;
  regionLabel: string;
  badgeCode: string;
}

const REGION_BADGE_MAP: Record<string, string> = {
  Africa: 'AF',
  America: 'AM',
  Antarctica: 'AQ',
  Arctic: 'AR',
  Asia: 'AS',
  Atlantic: 'AT',
  Australia: 'AU',
  Europe: 'EU',
  Indian: 'IN',
  Pacific: 'PA',
};

export function getWorldTimezonesCatalog(): WorldTimezoneOption[] {
  let zones: string[] = [];
  try {
    const intlAny = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
    if (typeof intlAny.supportedValuesOf === 'function') {
      zones = intlAny.supportedValuesOf('timeZone');
    }
  } catch {
    zones = [];
  }

  if (zones.length === 0) {
    zones = [
      'Asia/Dhaka',
      'Asia/Riyadh',
      'Asia/Dubai',
      'Asia/Karachi',
      'Asia/Kolkata',
      'Asia/Kuala_Lumpur',
      'Asia/Jakarta',
      'Asia/Tokyo',
      'Asia/Singapore',
      'Europe/London',
      'Europe/Istanbul',
      'Europe/Paris',
      'Europe/Berlin',
      'Africa/Cairo',
      'America/New_York',
      'America/Chicago',
      'America/Los_Angeles',
      'America/Toronto',
      'Australia/Sydney',
    ];
  }

  return zones.map((tz) => {
    const parts = tz.split('/');
    const rawCity = parts[parts.length - 1] || tz;
    const cityLabel = rawCity.replace(/_/g, ' ');
    const continent = parts[0] || 'World';
    const subRegion = parts.length > 2 ? `${parts[1].replace(/_/g, ' ')}, ${continent}` : continent;
    return {
      timeZoneId: tz,
      cityLabel,
      regionLabel: `${subRegion} · ${tz}`,
      badgeCode: REGION_BADGE_MAP[continent] || 'TZ',
    };
  });
}

export async function resolveWorldTimezoneToCity(
  tzOption: WorldTimezoneOption
): Promise<CityLocation> {
  const tzOffset = getTzOffsetFromIana(tzOption.timeZoneId);
  const presetMatch = PRESET_CITIES.find(
    (c) =>
      c.timeZoneId === tzOption.timeZoneId &&
      c.name_en.toLowerCase() === tzOption.cityLabel.toLowerCase()
  );
  if (presetMatch) {
    return { ...presetMatch, tzOffset };
  }

  // Try Open-Meteo geocoding by city name so astronomical sunrise/sunset coordinates are exact
  const matches = await searchGlobalCities(tzOption.cityLabel);
  const exactTzMatch =
    matches.find((m) => m.timeZoneId === tzOption.timeZoneId) ?? matches[0];
  if (exactTzMatch) {
    return {
      ...exactTzMatch,
      timeZoneId: tzOption.timeZoneId,
      tzOffset,
    };
  }

  // Representative approximate longitude/latitude fallback from UTC offset when geocoder unavailable
  return {
    id: `tz_${tzOption.timeZoneId.replace(/[^a-zA-Z0-9]/g, '_')}`,
    name_bn: tzOption.cityLabel,
    name_en: tzOption.cityLabel,
    country_bn: tzOption.regionLabel.split(' · ')[0] || 'World',
    country_en: tzOption.regionLabel.split(' · ')[0] || 'World',
    countryCode: tzOption.badgeCode,
    region_bn: tzOption.timeZoneId,
    region_en: tzOption.timeZoneId,
    timeZoneId: tzOption.timeZoneId,
    lat: 23.8103,
    lng: Number((tzOffset * 15).toFixed(4)),
    tzOffset,
  };
}

