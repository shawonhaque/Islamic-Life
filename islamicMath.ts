import type {
  CityLocation,
  HijriDateInfo,
  LightingPreset,
  PrayerMethodId,
  PrayerTimesResult,
  TerrariumLightingState,
  ZakatInput,
  ZakatResult,
} from '../types/islamic';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

export const KAABA_COORDS = {
  lat: 21.4225,
  lng: 39.8262,
};

export const PRESET_CITIES: CityLocation[] = [
  {
    id: 'dhaka',
    name_bn: 'ঢাকা',
    name_en: 'Dhaka',
    country_bn: 'বাংলাদেশ',
    country_en: 'Bangladesh',
    countryCode: 'BD',
    region_bn: 'ঢাকা বিভাগ, বাংলাদেশ',
    region_en: 'Dhaka Division, Bangladesh',
    timeZoneId: 'Asia/Dhaka',
    lat: 23.8103,
    lng: 90.4125,
    tzOffset: 6,
  },
  {
    id: 'chattogram',
    name_bn: 'চট্টগ্রাম',
    name_en: 'Chattogram',
    country_bn: 'বাংলাদেশ',
    country_en: 'Bangladesh',
    countryCode: 'BD',
    region_bn: 'চট্টগ্রাম বিভাগ, বাংলাদেশ',
    region_en: 'Chattogram Division, Bangladesh',
    timeZoneId: 'Asia/Dhaka',
    lat: 22.3569,
    lng: 91.7832,
    tzOffset: 6,
  },
  {
    id: 'gazipur',
    name_bn: 'গাজীপুর',
    name_en: 'Gazipur',
    country_bn: 'বাংলাদেশ',
    country_en: 'Bangladesh',
    countryCode: 'BD',
    region_bn: 'ঢাকা বিভাগ, বাংলাদেশ',
    region_en: 'Dhaka Division, Bangladesh',
    timeZoneId: 'Asia/Dhaka',
    lat: 23.9999,
    lng: 90.4203,
    tzOffset: 6,
  },
  {
    id: 'khulna',
    name_bn: 'খুলনা',
    name_en: 'Khulna',
    country_bn: 'বাংলাদেশ',
    country_en: 'Bangladesh',
    countryCode: 'BD',
    region_bn: 'খুলনা বিভাগ, বাংলাদেশ',
    region_en: 'Khulna Division, Bangladesh',
    timeZoneId: 'Asia/Dhaka',
    lat: 22.8456,
    lng: 89.5403,
    tzOffset: 6,
  },
  {
    id: 'rangpur',
    name_bn: 'রংপুর',
    name_en: 'Rangpur',
    country_bn: 'বাংলাদেশ',
    country_en: 'Bangladesh',
    countryCode: 'BD',
    region_bn: 'রংপুর বিভাগ, বাংলাদেশ',
    region_en: 'Rangpur Division, Bangladesh',
    timeZoneId: 'Asia/Dhaka',
    lat: 25.7439,
    lng: 89.2752,
    tzOffset: 6,
  },
  {
    id: 'rajshahi',
    name_bn: 'রাজশাহী',
    name_en: 'Rajshahi',
    country_bn: 'বাংলাদেশ',
    country_en: 'Bangladesh',
    countryCode: 'BD',
    region_bn: 'রাজশাহী বিভাগ, বাংলাদেশ',
    region_en: 'Rajshahi Division, Bangladesh',
    timeZoneId: 'Asia/Dhaka',
    lat: 24.3745,
    lng: 88.6042,
    tzOffset: 6,
  },
  {
    id: 'comilla',
    name_bn: 'কুমিল্লা',
    name_en: 'Comilla',
    country_bn: 'বাংলাদেশ',
    country_en: 'Bangladesh',
    countryCode: 'BD',
    region_bn: 'চট্টগ্রাম বিভাগ, বাংলাদেশ',
    region_en: 'Chattogram Division, Bangladesh',
    timeZoneId: 'Asia/Dhaka',
    lat: 23.4607,
    lng: 91.1809,
    tzOffset: 6,
  },
  {
    id: 'sylhet',
    name_bn: 'সিলেট',
    name_en: 'Sylhet',
    country_bn: 'বাংলাদেশ',
    country_en: 'Bangladesh',
    countryCode: 'BD',
    region_bn: 'সিলেট বিভাগ, বাংলাদেশ',
    region_en: 'Sylhet Division, Bangladesh',
    timeZoneId: 'Asia/Dhaka',
    lat: 24.8949,
    lng: 91.8687,
    tzOffset: 6,
  },
  {
    id: 'makkah',
    name_bn: 'মক্কা',
    name_en: 'Makkah',
    country_bn: 'সৌদি আরব',
    country_en: 'Saudi Arabia',
    countryCode: 'SA',
    region_bn: 'মক্কা প্রদেশ, সৌদি আরব',
    region_en: 'Makkah Province, Saudi Arabia',
    timeZoneId: 'Asia/Riyadh',
    lat: 21.4225,
    lng: 39.8262,
    tzOffset: 3,
  },
  {
    id: 'madinah',
    name_bn: 'মদিনা',
    name_en: 'Madinah',
    country_bn: 'সৌদি আরব',
    country_en: 'Saudi Arabia',
    countryCode: 'SA',
    region_bn: 'আল-মদিনা প্রদেশ, সৌদি আরব',
    region_en: 'Al Madinah Province, Saudi Arabia',
    timeZoneId: 'Asia/Riyadh',
    lat: 24.4672,
    lng: 39.6112,
    tzOffset: 3,
  },
  {
    id: 'dubai',
    name_bn: 'দুবাই',
    name_en: 'Dubai',
    country_bn: 'সংযুক্ত আরব আমিরাত',
    country_en: 'United Arab Emirates',
    countryCode: 'AE',
    region_bn: 'দুবাই, সংযুক্ত আরব আমিরাত',
    region_en: 'Dubai, United Arab Emirates',
    timeZoneId: 'Asia/Dubai',
    lat: 25.2048,
    lng: 55.2708,
    tzOffset: 4,
  },
  {
    id: 'london',
    name_bn: 'লন্ডন',
    name_en: 'London',
    country_bn: 'যুক্তরাজ্য',
    country_en: 'United Kingdom',
    countryCode: 'GB',
    region_bn: 'ইংল্যান্ড, যুক্তরাজ্য',
    region_en: 'England, United Kingdom',
    timeZoneId: 'Europe/London',
    lat: 51.5074,
    lng: -0.1278,
    tzOffset: 0,
  },
  {
    id: 'newyork',
    name_bn: 'নিউ ইয়র্ক',
    name_en: 'New York',
    country_bn: 'যুক্তরাষ্ট্র',
    country_en: 'United States',
    countryCode: 'US',
    region_bn: 'নিউ ইয়র্ক, যুক্তরাষ্ট্র',
    region_en: 'New York, United States',
    timeZoneId: 'America/New_York',
    lat: 40.7128,
    lng: -74.006,
    tzOffset: -5,
  },
  {
    id: 'istanbul',
    name_bn: 'ইস্তাম্বুল',
    name_en: 'Istanbul',
    country_bn: 'তুরস্ক',
    country_en: 'Türkiye',
    countryCode: 'TR',
    region_bn: 'ইস্তাম্বুল, তুরস্ক',
    region_en: 'Istanbul, Türkiye',
    timeZoneId: 'Europe/Istanbul',
    lat: 41.0082,
    lng: 28.9784,
    tzOffset: 3,
  },
  {
    id: 'kualalumpur',
    name_bn: 'কুয়ালালামপুর',
    name_en: 'Kuala Lumpur',
    country_bn: 'মালয়েশিয়া',
    country_en: 'Malaysia',
    countryCode: 'MY',
    region_bn: 'মালয়েশিয়া',
    region_en: 'Federal Territory, Malaysia',
    timeZoneId: 'Asia/Kuala_Lumpur',
    lat: 3.139,
    lng: 101.6869,
    tzOffset: 8,
  },
  {
    id: 'riyadh',
    name_bn: 'রিয়াদ',
    name_en: 'Riyadh',
    country_bn: 'সৌদি আরব',
    country_en: 'Saudi Arabia',
    countryCode: 'SA',
    region_bn: 'রিয়াদ প্রদেশ, সৌদি আরব',
    region_en: 'Riyadh Province, Saudi Arabia',
    timeZoneId: 'Asia/Riyadh',
    lat: 24.7136,
    lng: 46.6753,
    tzOffset: 3,
  },
  {
    id: 'cairo',
    name_bn: 'কায়রো',
    name_en: 'Cairo',
    country_bn: 'মিশর',
    country_en: 'Egypt',
    countryCode: 'EG',
    region_bn: 'কায়রো গভর্নরেট, মিশর',
    region_en: 'Cairo Governorate, Egypt',
    timeZoneId: 'Africa/Cairo',
    lat: 30.0444,
    lng: 31.2357,
    tzOffset: 2,
  },
  {
    id: 'toronto',
    name_bn: 'টরন্টো',
    name_en: 'Toronto',
    country_bn: 'কানাডা',
    country_en: 'Canada',
    countryCode: 'CA',
    region_bn: 'অন্টারিও, কানাডা',
    region_en: 'Ontario, Canada',
    timeZoneId: 'America/Toronto',
    lat: 43.6532,
    lng: -79.3832,
    tzOffset: -5,
  },
  {
    id: 'sydney',
    name_bn: 'সিডনি',
    name_en: 'Sydney',
    country_bn: 'অস্ট্রেলিয়া',
    country_en: 'Australia',
    countryCode: 'AU',
    region_bn: 'নিউ সাউথ ওয়েলস, অস্ট্রেলিয়া',
    region_en: 'New South Wales, Australia',
    timeZoneId: 'Australia/Sydney',
    lat: -33.8688,
    lng: 151.2093,
    tzOffset: 10,
  },
  {
    id: 'tokyo',
    name_bn: 'টোকিও',
    name_en: 'Tokyo',
    country_bn: 'জাপান',
    country_en: 'Japan',
    countryCode: 'JP',
    region_bn: 'কান্টো, জাপান',
    region_en: 'Tokyo, Japan',
    timeZoneId: 'Asia/Tokyo',
    lat: 35.6762,
    lng: 139.6503,
    tzOffset: 9,
  },
];

function fixAngle(angle: number): number {
  let a = angle - 360 * Math.floor(angle / 360);
  if (a < 0) a += 360;
  return a;
}

function fixHour(hour: number): number {
  let h = hour - 24 * Math.floor(hour / 24);
  if (h < 0) h += 24;
  return h;
}

function julianDate(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
}

function sunPosition(jd: number): { declination: number; eqTime: number } {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * Math.sin(g * DEG2RAD) + 0.02 * Math.sin(2 * g * DEG2RAD));
  const e = 23.439 - 0.00000036 * D;
  const RA =
    Math.atan2(Math.cos(e * DEG2RAD) * Math.sin(L * DEG2RAD), Math.cos(L * DEG2RAD)) * RAD2DEG / 15;
  const eqTime = q / 15 - fixHour(RA);
  const declination = Math.asin(Math.sin(e * DEG2RAD) * Math.sin(L * DEG2RAD)) * RAD2DEG;
  return { declination, eqTime };
}

function sunAngleTime(
  jd: number,
  lat: number,
  angleDeg: number,
  direction: 'ccw' | 'cw',
  midDay: number
): number {
  const { declination } = sunPosition(jd);
  const top =
    -Math.sin(angleDeg * DEG2RAD) - Math.sin(lat * DEG2RAD) * Math.sin(declination * DEG2RAD);
  const bottom = Math.cos(lat * DEG2RAD) * Math.cos(declination * DEG2RAD);
  const ratio = Math.max(-0.9999, Math.min(0.9999, top / bottom));
  const t = (Math.acos(ratio) * RAD2DEG) / 15;
  return midDay + (direction === 'ccw' ? -t : t);
}

function asrTime(jd: number, lat: number, factor: 1 | 2, midDay: number): number {
  const { declination } = sunPosition(jd);
  const angle = -Math.atan(1 / (factor + Math.tan(Math.abs(lat - declination) * DEG2RAD))) * RAD2DEG;
  const top =
    -Math.sin(angle * DEG2RAD) - Math.sin(lat * DEG2RAD) * Math.sin(declination * DEG2RAD);
  const bottom = Math.cos(lat * DEG2RAD) * Math.cos(declination * DEG2RAD);
  const ratio = Math.max(-0.9999, Math.min(0.9999, top / bottom));
  const t = (Math.acos(ratio) * RAD2DEG) / 15;
  return midDay + t;
}

export function formatHourToDisplay(hourDecimal: number, use24h = false): string {
  const normalized = fixHour(hourDecimal + 0.5 / 60); // round to nearest minute
  const totalMinutes = Math.floor(normalized * 60);
  const h24 = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  if (use24h) {
    return `${String(h24).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${suffix}`;
}

export function formatHourTo12h(hourDecimal: number): string {
  return formatHourToDisplay(hourDecimal, false);
}

function toMinutes(hourDecimal: number): number {
  const normalized = fixHour(hourDecimal + 0.5 / 60);
  return Math.floor(normalized * 60);
}

export interface LocationClockInfo {
  hours24: number;
  minutes: number;
  seconds: number;
  nowMinutesFloat: number;
  nowMinutes: number;
  formattedTime12: string;
  formattedTime24: string;
  formattedTimeShort: string;
  formattedTimeShortNoPad12: string;
  formattedTimeShort24: string;
  effectiveTzOffset: number;
  dateKey: string;
  localDate: Date;
}

export function formatUtcOffsetLabel(offsetHours: number): string {
  const sign = offsetHours >= 0 ? '+' : '-';
  const abs = Math.abs(offsetHours);
  const whole = Math.floor(abs);
  const mins = Math.round((abs - whole) * 60);
  if (mins === 0) return `UTC${sign}${whole}`;
  return `UTC${sign}${whole}:${String(mins).padStart(2, '0')}`;
}

export function getTzOffsetFromIana(timeZoneId: string, nowMs = Date.now()): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZoneId,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(nowMs));
    const map: Record<string, number> = {};
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = Number(p.value);
    }
    const wallUtc = Date.UTC(
      map.year,
      (map.month || 1) - 1,
      map.day || 1,
      map.hour === 24 ? 0 : map.hour || 0,
      map.minute || 0,
      map.second || 0
    );
    const roundedNow = Math.floor(nowMs / 1000) * 1000;
    const diffHours = (wallUtc - roundedNow) / 3600_000;
    return Math.round(diffHours * 4) / 4;
  } catch {
    return 0;
  }
}

export function getLocationClock(
  nowMs: number,
  tzOffsetHours: number,
  timeZoneId?: string
): LocationClockInfo {
  let year: number;
  let month: number;
  let day: number;
  let hours24: number;
  let minutes: number;
  let seconds: number;
  let effectiveTzOffset = tzOffsetHours;

  if (timeZoneId) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timeZoneId,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(new Date(nowMs));
      const map: Record<string, number> = {};
      for (const p of parts) {
        if (p.type !== 'literal') map[p.type] = Number(p.value);
      }
      year = map.year;
      month = (map.month || 1) - 1;
      day = map.day || 1;
      hours24 = map.hour === 24 ? 0 : map.hour || 0;
      minutes = map.minute || 0;
      seconds = map.second || 0;
      const wallUtc = Date.UTC(year, month, day, hours24, minutes, seconds);
      const roundedNow = Math.floor(nowMs / 1000) * 1000;
      effectiveTzOffset = Math.round(((wallUtc - roundedNow) / 3600_000) * 4) / 4;
    } catch {
      const shifted = new Date(nowMs + tzOffsetHours * 3600_000);
      year = shifted.getUTCFullYear();
      month = shifted.getUTCMonth();
      day = shifted.getUTCDate();
      hours24 = shifted.getUTCHours();
      minutes = shifted.getUTCMinutes();
      seconds = shifted.getUTCSeconds();
    }
  } else {
    const shifted = new Date(nowMs + tzOffsetHours * 3600_000);
    year = shifted.getUTCFullYear();
    month = shifted.getUTCMonth();
    day = shifted.getUTCDate();
    hours24 = shifted.getUTCHours();
    minutes = shifted.getUTCMinutes();
    seconds = shifted.getUTCSeconds();
  }

  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const h12Num = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const hStr = String(h12Num).padStart(2, '0');
  const h24Str = String(hours24).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');

  return {
    hours24,
    minutes,
    seconds,
    nowMinutesFloat: hours24 * 60 + minutes + seconds / 60,
    nowMinutes: hours24 * 60 + minutes,
    formattedTime12: `${hStr}:${mStr}:${sStr} ${suffix}`,
    formattedTime24: `${h24Str}:${mStr}:${sStr}`,
    formattedTimeShort: `${hStr}:${mStr} ${suffix}`,
    formattedTimeShortNoPad12: `${h12Num}:${mStr} ${suffix}`,
    formattedTimeShort24: `${h24Str}:${mStr}`,
    effectiveTzOffset,
    dateKey: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    localDate: new Date(year, month, day, hours24, minutes, seconds),
  };
}

export const PRAYER_METHOD_META: Record<
  PrayerMethodId,
  { fajrAngle: number; ishaAngle?: number; ishaOffsetMin?: number; labelEn: string; labelBn: string }
> = {
  karachi: {
    fajrAngle: 18,
    ishaAngle: 18,
    labelEn: 'University of Islamic Sciences, Karachi',
    labelBn: 'করাচি বিশ্ববিদ্যালয় পদ্ধতি (১৮° / ১৮°)',
  },
  mwl: {
    fajrAngle: 18,
    ishaAngle: 17,
    labelEn: 'Muslim World League (MWL)',
    labelBn: 'মুসলিম ওয়ার্ল্ড লিগ (১৮° / ১৭°)',
  },
  isna: {
    fajrAngle: 15,
    ishaAngle: 15,
    labelEn: 'Islamic Society of North America (ISNA)',
    labelBn: 'ইসলামিক সোসাইটি অব নর্থ আমেরিকা (১৫° / ১৫°)',
  },
  'umm-al-qura': {
    fajrAngle: 18.5,
    ishaOffsetMin: 90,
    labelEn: 'Umm al-Qura University, Makkah',
    labelBn: 'উম্মুল কুরা বিশ্ববিদ্যালয়, মক্কা (১৮.৫° / +৯০মি.)',
  },
  egyptian: {
    fajrAngle: 19.5,
    ishaAngle: 17.5,
    labelEn: 'Egyptian General Authority of Survey',
    labelBn: 'মিশরীয় জরিপ কর্তৃপক্ষ (১৯.৫° / ১৭.৫°)',
  },
  tehran: {
    fajrAngle: 17.7,
    ishaAngle: 14,
    labelEn: 'Institute of Geophysics, University of Tehran',
    labelBn: 'তেহরান বিশ্ববিদ্যালয় পদ্ধতি (১৭.৭° / ১৪°)',
  },
};

export function calculatePrayerTimes(
  date: Date,
  lat: number,
  lng: number,
  tzOffset: number,
  asrMethod: 'hanafi' | 'standard' = 'hanafi',
  method: PrayerMethodId = 'karachi',
  use24h = false
): PrayerTimesResult {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const methodCfg = PRAYER_METHOD_META[method] ?? PRAYER_METHOD_META.karachi;
  const jd = julianDate(year, month, day) - lng / (15 * 24);
  const { eqTime } = sunPosition(jd + 0.5);
  const midDay = fixHour(12 - eqTime);

  const fajrSolar = sunAngleTime(jd + 0.25, lat, methodCfg.fajrAngle, 'ccw', midDay);
  const sunriseSolar = sunAngleTime(jd + 0.25, lat, 0.833, 'ccw', midDay);
  const dhuhrSolar = midDay + 2 / 60; // +2 min safety margin after zenith
  const asrSolar = asrTime(jd + 0.65, lat, asrMethod === 'hanafi' ? 2 : 1, midDay);
  const maghribSolar = sunAngleTime(jd + 0.75, lat, 0.833, 'cw', midDay);
  const ishaSolar =
    typeof methodCfg.ishaOffsetMin === 'number'
      ? maghribSolar + methodCfg.ishaOffsetMin / 60
      : sunAngleTime(jd + 0.8, lat, methodCfg.ishaAngle ?? 18, 'cw', midDay);

  const offsetAdjust = tzOffset - lng / 15;

  const fajrLocal = fajrSolar + offsetAdjust;
  const sunriseLocal = sunriseSolar + offsetAdjust;
  const dhuhrLocal = dhuhrSolar + offsetAdjust;
  const asrLocal = asrSolar + offsetAdjust;
  const maghribLocal = maghribSolar + offsetAdjust;
  const ishaLocal = ishaSolar + offsetAdjust;
  const sehriEndLocal = fajrLocal - 4 / 60; // Ihtiyat 4 min before Fajr

  return {
    fajr: formatHourToDisplay(fajrLocal, use24h),
    sunrise: formatHourToDisplay(sunriseLocal, use24h),
    dhuhr: formatHourToDisplay(dhuhrLocal, use24h),
    asr: formatHourToDisplay(asrLocal, use24h),
    maghrib: formatHourToDisplay(maghribLocal, use24h),
    isha: formatHourToDisplay(ishaLocal, use24h),
    sehriEnd: formatHourToDisplay(sehriEndLocal, use24h),
    iftar: formatHourToDisplay(maghribLocal, use24h),
    minutesMap: {
      fajr: toMinutes(fajrLocal),
      sunrise: toMinutes(sunriseLocal),
      dhuhr: toMinutes(dhuhrLocal),
      asr: toMinutes(asrLocal),
      maghrib: toMinutes(maghribLocal),
      isha: toMinutes(ishaLocal),
    },
  };
}

export function getNextPrayerInfo(
  times: PrayerTimesResult,
  nowMinutes: number
): { id: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'; remainingMinutes: number; time: string } {
  const schedule: Array<{ id: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'; min: number; time: string }> = [
    { id: 'fajr', min: times.minutesMap.fajr, time: times.fajr },
    { id: 'dhuhr', min: times.minutesMap.dhuhr, time: times.dhuhr },
    { id: 'asr', min: times.minutesMap.asr, time: times.asr },
    { id: 'maghrib', min: times.minutesMap.maghrib, time: times.maghrib },
    { id: 'isha', min: times.minutesMap.isha, time: times.isha },
  ];

  for (const item of schedule) {
    if (item.min > nowMinutes) {
      return { id: item.id, remainingMinutes: item.min - nowMinutes, time: item.time };
    }
  }
  // Wrap to tomorrow's Fajr
  return {
    id: 'fajr',
    remainingMinutes: 24 * 60 - nowMinutes + times.minutesMap.fajr,
    time: times.fajr,
  };
}

export function calculateQiblaBearing(lat: number, lng: number): number {
  const phi1 = lat * DEG2RAD;
  const phi2 = KAABA_COORDS.lat * DEG2RAD;
  const deltaLambda = (KAABA_COORDS.lng - lng) * DEG2RAD;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const bearing = Math.atan2(y, x) * RAD2DEG;
  return Number(fixAngle(bearing).toFixed(1));
}

export function calculateDistanceToKaabaKm(lat: number, lng: number): number {
  const R = 6371; // Earth radius km
  const dLat = (KAABA_COORDS.lat - lat) * DEG2RAD;
  const dLng = (KAABA_COORDS.lng - lng) * DEG2RAD;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat * DEG2RAD) *
      Math.cos(KAABA_COORDS.lat * DEG2RAD) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function getCardinalDirection(deg: number): { en: string; bn: string } {
  const dirs = [
    { en: 'N', bn: 'উত্তর' },
    { en: 'NE', bn: 'উত্তর-পূর্ব' },
    { en: 'E', bn: 'পূর্ব' },
    { en: 'SE', bn: 'দক্ষিণ-পূর্ব' },
    { en: 'S', bn: 'দক্ষিণ' },
    { en: 'SW', bn: 'দক্ষিণ-পশ্চিম' },
    { en: 'W', bn: 'পশ্চিম' },
    { en: 'NW', bn: 'উত্তর-পশ্চিম' },
  ];
  const idx = Math.round(fixAngle(deg) / 45) % 8;
  return dirs[idx];
}

export function calculateZakat(input: ZakatInput): ZakatResult {
  const sanitize = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);
  const totalAssets =
    sanitize(input.cash) +
    sanitize(input.bankSavings) +
    sanitize(input.goldValue) +
    sanitize(input.silverValue) +
    sanitize(input.investments) +
    sanitize(input.businessInventory) +
    sanitize(input.receivables);

  const totalDebts = sanitize(input.debts);
  const netZakatableWealth = Math.max(0, totalAssets - totalDebts);
  const nisabThreshold =
    input.nisabStandard === 'gold'
      ? sanitize(input.goldNisabValue)
      : sanitize(input.silverNisabValue);

  const isEligible = netZakatableWealth >= nisabThreshold && nisabThreshold > 0;
  const zakatDue = isEligible ? Math.round(netZakatableWealth * 0.025 * 100) / 100 : 0;

  return {
    totalAssets,
    totalDebts,
    netZakatableWealth,
    nisabThreshold,
    isEligible,
    zakatDue,
  };
}

export const HIJRI_MONTHS = [
  { en: 'Muharram', bn: 'মহররম', ar: 'محرم' },
  { en: 'Safar', bn: 'সফর', ar: 'صفر' },
  { en: "Rabi' al-Awwal", bn: 'রবিউল আউয়াল', ar: 'ربيع الأول' },
  { en: "Rabi' al-Thani", bn: 'রবিউস সানি', ar: 'ربيع الثاني' },
  { en: 'Jumada al-Awwal', bn: 'জুমাদাল উলা', ar: 'جمادى الأولى' },
  { en: 'Jumada al-Thani', bn: 'জুমাদাস সানি', ar: 'جمادى الآخرة' },
  { en: 'Rajab', bn: 'রজব', ar: 'رجب' },
  { en: "Sha'ban", bn: 'শাবান', ar: 'شعبان' },
  { en: 'Ramadan', bn: 'রমজান', ar: 'رمضان' },
  { en: 'Shawwal', bn: 'শাওয়াল', ar: 'شوال' },
  { en: "Dhu al-Qi'dah", bn: 'জিলকদ', ar: 'ذو القعدة' },
  { en: 'Dhu al-Hijjah', bn: 'জিলহজ', ar: 'ذو الحجة' },
];

export function gregorianToHijri(date: Date): HijriDateInfo {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const m = month > 2 ? month : month + 12;
  const y = month > 2 ? year : year - 1;
  const jd =
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    (2 - Math.floor(y / 100) + Math.floor(Math.floor(y / 100) / 4)) -
    1524;

  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;

  const hMonth = Math.floor((24 * l3) / 709);
  const hDay = l3 - Math.floor((709 * hMonth) / 24);
  const hYear = 30 * n + j - 30;

  const meta = HIJRI_MONTHS[Math.max(0, Math.min(11, hMonth - 1))];

  return {
    year: hYear,
    month: hMonth,
    day: hDay,
    monthNameEn: meta.en,
    monthNameBn: meta.bn,
    monthNameAr: meta.ar,
  };
}

export function getHijriMonthLength(hijriYear: number, hijriMonth: number): number {
  // Tabular Islamic calendar: odd months have 30 days, even have 29; month 12 has 30 in leap years
  if (hijriMonth % 2 === 1) return 30;
  if (hijriMonth === 12) {
    const leapCycle = (11 * hijriYear + 14) % 30;
    return leapCycle < 11 ? 30 : 29;
  }
  return 29;
}

export const LIGHTING_PRESET_HOURS: Record<LightingPreset, number> = {
  fajr: 5.25,
  dhuhr: 12.5,
  asr: 16.0,
  maghrib: 18.25,
  isha: 21.5,
};

function lerpNumber(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpHex(hexA: number, hexB: number, t: number): number {
  const r1 = (hexA >> 16) & 0xff;
  const g1 = (hexA >> 8) & 0xff;
  const b1 = hexA & 0xff;
  const r2 = (hexB >> 16) & 0xff;
  const g2 = (hexB >> 8) & 0xff;
  const b2 = hexB & 0xff;

  const r = Math.round(lerpNumber(r1, r2, t));
  const g = Math.round(lerpNumber(g1, g2, t));
  const b = Math.round(lerpNumber(b1, b2, t));
  return (r << 16) | (g << 8) | b;
}

interface LightingKeyframe {
  hour: number;
  sunElevation: number;
  sunAzimuth: number;
  sunColorHex: number;
  sunIntensity: number;
  hemiSkyHex: number;
  hemiGroundHex: number;
  hemiIntensity: number;
  bgHex: number;
  fogHex: number;
  starOpacity: number;
  lanternIntensity: number;
}

const LIGHTING_KEYFRAMES: LightingKeyframe[] = [
  {
    hour: 0,
    sunElevation: 0.45,
    sunAzimuth: -2.2,
    sunColorHex: 0x8ea9d8,
    sunIntensity: 0.75,
    hemiSkyHex: 0x1e2d4f,
    hemiGroundHex: 0x0b1218,
    hemiIntensity: 0.5,
    bgHex: 0x0c1623,
    fogHex: 0x0c1623,
    starOpacity: 0.95,
    lanternIntensity: 3.2,
  },
  {
    hour: 5.25, // Fajr Dawn
    sunElevation: 0.22,
    sunAzimuth: -1.4,
    sunColorHex: 0xffb37a,
    sunIntensity: 1.55,
    hemiSkyHex: 0x7a93c7,
    hemiGroundHex: 0x24302a,
    hemiIntensity: 0.85,
    bgHex: 0x223447,
    fogHex: 0x2b3e4f,
    starOpacity: 0.35,
    lanternIntensity: 1.8,
  },
  {
    hour: 12.5, // Dhuhr Noon
    sunElevation: 1.15,
    sunAzimuth: 0.2,
    sunColorHex: 0xfff5e0,
    sunIntensity: 2.65,
    hemiSkyHex: 0xd9eef7,
    hemiGroundHex: 0x3b4d38,
    hemiIntensity: 1.15,
    bgHex: 0xdcece5,
    fogHex: 0xdcece5,
    starOpacity: 0,
    lanternIntensity: 0.0,
  },
  {
    hour: 16.0, // Asr Golden Hour
    sunElevation: 0.55,
    sunAzimuth: 1.1,
    sunColorHex: 0xffd28d,
    sunIntensity: 2.35,
    hemiSkyHex: 0xcfe4ee,
    hemiGroundHex: 0x3e422e,
    hemiIntensity: 1.0,
    bgHex: 0xd7e3d8,
    fogHex: 0xd7e3d8,
    starOpacity: 0,
    lanternIntensity: 0.35,
  },
  {
    hour: 18.25, // Maghrib Dusk
    sunElevation: 0.14,
    sunAzimuth: 1.8,
    sunColorHex: 0xff7b4d,
    sunIntensity: 1.65,
    hemiSkyHex: 0x625a8f,
    hemiGroundHex: 0x1e211f,
    hemiIntensity: 0.78,
    bgHex: 0x222036,
    fogHex: 0x28233b,
    starOpacity: 0.55,
    lanternIntensity: 2.6,
  },
  {
    hour: 21.5, // Isha Night
    sunElevation: 0.5,
    sunAzimuth: 2.4,
    sunColorHex: 0x9ab4e2,
    sunIntensity: 0.8,
    hemiSkyHex: 0x1d2b4c,
    hemiGroundHex: 0x0a1117,
    hemiIntensity: 0.52,
    bgHex: 0x0b1420,
    fogHex: 0x0b1420,
    starOpacity: 0.95,
    lanternIntensity: 3.4,
  },
  {
    hour: 24,
    sunElevation: 0.45,
    sunAzimuth: 2.8,
    sunColorHex: 0x8ea9d8,
    sunIntensity: 0.75,
    hemiSkyHex: 0x1e2d4f,
    hemiGroundHex: 0x0b1218,
    hemiIntensity: 0.5,
    bgHex: 0x0c1623,
    fogHex: 0x0c1623,
    starOpacity: 0.95,
    lanternIntensity: 3.2,
  },
];

export function getTerrariumLightingForHour(hourInput: number): TerrariumLightingState {
  const hour = fixHour(hourInput);
  let prev = LIGHTING_KEYFRAMES[0];
  let next = LIGHTING_KEYFRAMES[LIGHTING_KEYFRAMES.length - 1];

  for (let i = 0; i < LIGHTING_KEYFRAMES.length - 1; i++) {
    if (hour >= LIGHTING_KEYFRAMES[i].hour && hour <= LIGHTING_KEYFRAMES[i + 1].hour) {
      prev = LIGHTING_KEYFRAMES[i];
      next = LIGHTING_KEYFRAMES[i + 1];
      break;
    }
  }

  const span = Math.max(0.0001, next.hour - prev.hour);
  const t = Math.max(0, Math.min(1, (hour - prev.hour) / span));

  return {
    sunElevation: lerpNumber(prev.sunElevation, next.sunElevation, t),
    sunAzimuth: lerpNumber(prev.sunAzimuth, next.sunAzimuth, t),
    sunColorHex: lerpHex(prev.sunColorHex, next.sunColorHex, t),
    sunIntensity: lerpNumber(prev.sunIntensity, next.sunIntensity, t),
    hemiSkyHex: lerpHex(prev.hemiSkyHex, next.hemiSkyHex, t),
    hemiGroundHex: lerpHex(prev.hemiGroundHex, next.hemiGroundHex, t),
    hemiIntensity: lerpNumber(prev.hemiIntensity, next.hemiIntensity, t),
    bgHex: lerpHex(prev.bgHex, next.bgHex, t),
    fogHex: lerpHex(prev.fogHex, next.fogHex, t),
    starOpacity: lerpNumber(prev.starOpacity, next.starOpacity, t),
    lanternIntensity: lerpNumber(prev.lanternIntensity, next.lanternIntensity, t),
    isNight: hour < 5.1 || hour > 18.4,
  };
}

export interface ForbiddenPrayerWindow {
  id: 'sunrise' | 'zawal' | 'sunset';
  labelBn: string;
  labelEn: string;
  startMinutes: number;
  endMinutes: number;
  rangeText: string;
  isActiveNow: boolean;
  isNextUpcoming: boolean;
}

export function formatMinutesTo12h(totalMinutesInput: number): string {
  const normalized = ((Math.round(totalMinutesInput) % 1440) + 1440) % 1440;
  const h24 = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mins).padStart(2, '0')} ${suffix}`;
}

export function computeForbiddenPrayerTimes(
  prayerTimes: PrayerTimesResult,
  nowMinutes?: number
): ForbiddenPrayerWindow[] {
  const sunriseStart = prayerTimes.minutesMap.sunrise;
  const sunriseEnd = sunriseStart + 15;

  // Dhuhr includes a +2 min post-zenith safety margin, so true solar noon is ~2m earlier
  const zawalStart = prayerTimes.minutesMap.dhuhr - 8;
  const zawalEnd = prayerTimes.minutesMap.dhuhr - 2;

  const sunsetStart = prayerTimes.minutesMap.maghrib - 15;
  const sunsetEnd = prayerTimes.minutesMap.maghrib;

  const base: Array<Omit<ForbiddenPrayerWindow, 'isActiveNow' | 'isNextUpcoming'>> = [
    {
      id: 'sunrise',
      labelBn: 'সূর্যোদয়ের সময়',
      labelEn: 'Sunrise',
      startMinutes: sunriseStart,
      endMinutes: sunriseEnd,
      rangeText: `${formatMinutesTo12h(sunriseStart)} – ${formatMinutesTo12h(sunriseEnd)}`,
    },
    {
      id: 'zawal',
      labelBn: 'যাওয়াল (ঠিক দুপুর)',
      labelEn: 'Zawal (midday)',
      startMinutes: zawalStart,
      endMinutes: zawalEnd,
      rangeText: `${formatMinutesTo12h(zawalStart)} – ${formatMinutesTo12h(zawalEnd)}`,
    },
    {
      id: 'sunset',
      labelBn: 'সূর্যাস্তের সময়',
      labelEn: 'Sunset',
      startMinutes: sunsetStart,
      endMinutes: sunsetEnd,
      rangeText: `${formatMinutesTo12h(sunsetStart)} – ${formatMinutesTo12h(sunsetEnd)}`,
    },
  ];

  const firstUpcomingIdx =
    typeof nowMinutes === 'number'
      ? base.findIndex((w) => nowMinutes <= w.endMinutes)
      : -1;

  return base.map((w, idx) => ({
    ...w,
    isActiveNow:
      typeof nowMinutes === 'number' &&
      nowMinutes >= w.startMinutes &&
      nowMinutes <= w.endMinutes,
    isNextUpcoming: idx === (firstUpcomingIdx === -1 ? 0 : firstUpcomingIdx),
  }));
}

export interface UpcomingIslamicEvent {
  id: string;
  titleEn: string;
  titleBn: string;
  hijriMonth: number;
  hijriDay: number;
  daysRemaining: number;
  gregorianDate: Date;
}

const ISLAMIC_ANNUAL_EVENTS: Array<{
  id: string;
  titleEn: string;
  titleBn: string;
  hijriMonth: number;
  hijriDay: number;
}> = [
  { id: 'muharram-1', titleEn: 'Islamic New Year', titleBn: 'হিজরি নববর্ষ', hijriMonth: 1, hijriDay: 1 },
  { id: 'ashura', titleEn: 'Day of Ashura', titleBn: 'পবিত্র আশুরা', hijriMonth: 1, hijriDay: 10 },
  { id: 'mawlid', titleEn: 'Rabi al-Awwal 12', titleBn: '১২ রবিউল আউয়াল', hijriMonth: 3, hijriDay: 12 },
  { id: 'isra-miraj', titleEn: "Isra' and Mi'raj", titleBn: 'শবে মেরাজ', hijriMonth: 7, hijriDay: 27 },
  { id: 'mid-shaban', titleEn: "Mid-Sha'ban", titleBn: 'শবে বরাত (নিসফে শাবান)', hijriMonth: 8, hijriDay: 15 },
  { id: 'ramadan-1', titleEn: 'Ramadan Begins', titleBn: 'রমজান শুরু', hijriMonth: 9, hijriDay: 1 },
  { id: 'laylatul-qadr', titleEn: 'Laylatul Qadr (27 Ramadan)', titleBn: 'লাইলাতুল কদর (২৭ রমজান)', hijriMonth: 9, hijriDay: 27 },
  { id: 'eid-fitr', titleEn: 'Eid al-Fitr', titleBn: 'ঈদুল ফিতর', hijriMonth: 10, hijriDay: 1 },
  { id: 'arafah', titleEn: 'Day of Arafah', titleBn: 'আরাফাতের দিন', hijriMonth: 12, hijriDay: 9 },
  { id: 'eid-adha', titleEn: 'Eid al-Adha', titleBn: 'ঈদুল আযহা', hijriMonth: 12, hijriDay: 10 },
];

export function getUpcomingIslamicEvents(localDate: Date, limit = 3): UpcomingIslamicEvent[] {
  const start = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
  const found: UpcomingIslamicEvent[] = [];
  const seen = new Set<string>();

  for (let offset = 0; offset <= 360; offset += 1) {
    const candidate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
    const hijri = gregorianToHijri(candidate);
    for (const ev of ISLAMIC_ANNUAL_EVENTS) {
      if (!seen.has(ev.id) && hijri.month === ev.hijriMonth && hijri.day === ev.hijriDay) {
        seen.add(ev.id);
        found.push({
          ...ev,
          daysRemaining: offset,
          gregorianDate: candidate,
        });
        if (found.length >= limit) return found;
      }
    }
  }

  return found;
}
