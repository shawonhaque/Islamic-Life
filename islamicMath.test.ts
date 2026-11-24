import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistanceToKaabaKm,
  calculatePrayerTimes,
  calculateQiblaBearing,
  calculateZakat,
  computeForbiddenPrayerTimes,
  getHijriMonthLength,
  getLocationClock,
  getNextPrayerInfo,
  getTerrariumLightingForHour,
  getUpcomingIslamicEvents,
  gregorianToHijri,
} from './islamicMath';
import { getAyahPronunciation } from './arabicTransliteration';

test('Qibla bearing and distance for Dhaka and London are accurate', () => {
  const dhakaBearing = calculateQiblaBearing(23.8103, 90.4125);
  assert.ok(dhakaBearing > 275 && dhakaBearing < 280, `Expected Dhaka Qibla ~277.6°, got ${dhakaBearing}`);

  const londonBearing = calculateQiblaBearing(51.5074, -0.1278);
  assert.ok(londonBearing > 117 && londonBearing < 121, `Expected London Qibla ~119°, got ${londonBearing}`);

  const dhakaDistance = calculateDistanceToKaabaKm(23.8103, 90.4125);
  assert.ok(dhakaDistance > 5000 && dhakaDistance < 5300, `Expected ~5170km, got ${dhakaDistance}`);
});

test('Prayer times calculation returns ordered realistic times for Dhaka', () => {
  const date = new Date(2026, 2, 20); // Equinox
  const times = calculatePrayerTimes(date, 23.8103, 90.4125, 6, 'hanafi');

  assert.ok(times.minutesMap.fajr < times.minutesMap.sunrise);
  assert.ok(times.minutesMap.sunrise < times.minutesMap.dhuhr);
  assert.ok(times.minutesMap.dhuhr < times.minutesMap.asr);
  assert.ok(times.minutesMap.asr < times.minutesMap.maghrib);
  assert.ok(times.minutesMap.maghrib < times.minutesMap.isha);

  const nextAfterFajr = getNextPrayerInfo(times, times.minutesMap.fajr + 10);
  assert.equal(nextAfterFajr.id, 'dhuhr');
});

test('Forbidden prayer times and upcoming Islamic dates compute cleanly', () => {
  const date = new Date(2026, 10, 24);
  const times = calculatePrayerTimes(date, 23.8103, 90.4125, 6, 'hanafi');
  const forbidden = computeForbiddenPrayerTimes(times, times.minutesMap.sunrise + 5);

  assert.equal(forbidden.length, 3);
  assert.equal(forbidden[0].id, 'sunrise');
  assert.equal(forbidden[0].endMinutes - forbidden[0].startMinutes, 15);
  assert.equal(forbidden[0].isActiveNow, true);
  assert.equal(forbidden[1].id, 'zawal');
  assert.equal(forbidden[2].id, 'sunset');
  assert.equal(forbidden[2].endMinutes - forbidden[2].startMinutes, 15);

  const upcoming = getUpcomingIslamicEvents(date, 2);
  assert.equal(upcoming.length, 2);
  assert.ok(upcoming[0].daysRemaining >= 0);
  assert.ok(upcoming[1].daysRemaining >= upcoming[0].daysRemaining);
});

test('Location clock computes wall-clock time accurately for any UTC offset', () => {
  const fixedUtcMs = Date.UTC(2026, 4, 15, 12, 30, 45); // 12:30:45 UTC
  const dhakaClock = getLocationClock(fixedUtcMs, 6);
  assert.equal(dhakaClock.hours24, 18);
  assert.equal(dhakaClock.minutes, 30);
  assert.equal(dhakaClock.formattedTime12, '06:30:45 PM');
  assert.equal(dhakaClock.dateKey, '2026-05-15');

  const nyClock = getLocationClock(fixedUtcMs, -5);
  assert.equal(nyClock.hours24, 7);
  assert.equal(nyClock.formattedTime12, '07:30:45 AM');
});

test('Arabic to Bangla transliteration uses clean Bangla spellings without broken vowel collisions', () => {
  const fatihah7 = getAyahPronunciation('غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', 1, 7);
  assert.ok(fatihah7.bn.includes('ওয়ালাদ দা-ল্লীন'));
  assert.ok(!fatihah7.bn.includes('দোয়া'));

  const ikhlas3 = getAyahPronunciation('لَمْ يَلِدْ وَلَمْ يُولَدْ', 112, 3);
  assert.ok(ikhlas3.bn.includes('ইয়ূলাদ'));
  assert.ok(!ikhlas3.bn.includes('ইঊলাদ'));

  const auto = getAyahPronunciation('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ');
  assert.ok(!/[ওইআ]া|ইু|আু|আি/.test(auto.bn), `Unexpected invalid Bangla sequence in ${auto.bn}`);
  assert.ok(auto.bn.includes('লিল্লা') || auto.bn.includes('আল্লা'));
});

test('Zakat calculator checks Nisab eligibility and computes 2.5%', () => {
  const eligible = calculateZakat({
    cash: 200000,
    bankSavings: 300000,
    goldValue: 0,
    silverValue: 0,
    investments: 0,
    businessInventory: 0,
    receivables: 0,
    debts: 100000,
    nisabStandard: 'silver',
    goldNisabValue: 950000,
    silverNisabValue: 105000,
  });

  assert.equal(eligible.totalAssets, 500000);
  assert.equal(eligible.netZakatableWealth, 400000);
  assert.equal(eligible.isEligible, true);
  assert.equal(eligible.zakatDue, 10000);

  const belowNisab = calculateZakat({
    cash: 50000,
    bankSavings: 0,
    goldValue: 0,
    silverValue: 0,
    investments: 0,
    businessInventory: 0,
    receivables: 0,
    debts: 0,
    nisabStandard: 'silver',
    goldNisabValue: 950000,
    silverNisabValue: 105000,
  });

  assert.equal(belowNisab.isEligible, false);
  assert.equal(belowNisab.zakatDue, 0);
});

test('Hijri date conversion and month lengths are valid', () => {
  const hijri = gregorianToHijri(new Date(2026, 2, 20));
  assert.ok(hijri.year >= 1447 && hijri.year <= 1448);
  assert.ok(hijri.month >= 1 && hijri.month <= 12);
  assert.ok(hijri.day >= 1 && hijri.day <= 30);

  assert.equal(getHijriMonthLength(1447, 1), 30);
  assert.equal(getHijriMonthLength(1447, 2), 29);
});

test('Terrarium lighting transitions smoothly between noon and night', () => {
  const noon = getTerrariumLightingForHour(12.5);
  const night = getTerrariumLightingForHour(21.5);

  assert.equal(noon.isNight, false);
  assert.equal(noon.starOpacity, 0);
  assert.ok(noon.sunIntensity > night.sunIntensity);

  assert.equal(night.isNight, true);
  assert.ok(night.starOpacity > 0.8);
  assert.ok(night.lanternIntensity > noon.lanternIntensity);
});

test('Prayer calculation methods (Umm al-Qura, ISNA, Karachi) and 24h format work accurately', () => {
  const date = new Date(2026, 2, 20);
  const karachi = calculatePrayerTimes(date, 23.8103, 90.4125, 6, 'hanafi', 'karachi', false);
  const isna = calculatePrayerTimes(date, 23.8103, 90.4125, 6, 'hanafi', 'isna', false);
  const ummAlQura = calculatePrayerTimes(date, 21.4225, 39.8262, 3, 'standard', 'umm-al-qura', true);

  // ISNA (15 deg) yields a later Fajr and earlier Isha than Karachi (18 deg)
  assert.ok(isna.minutesMap.fajr > karachi.minutesMap.fajr);
  assert.ok(isna.minutesMap.isha < karachi.minutesMap.isha);

  // Umm al-Qura sets Isha exactly 90 minutes after Maghrib
  assert.equal(ummAlQura.minutesMap.isha - ummAlQura.minutesMap.maghrib, 90);

  // 24h display has HH:MM without AM/PM
  assert.match(ummAlQura.maghrib, /^\d{2}:\d{2}$/);
  assert.ok(!ummAlQura.fajr.includes('AM') && !ummAlQura.maghrib.includes('PM'));
});

test('IANA timeZoneId-aware getLocationClock computes DST-accurate time and offsets', () => {
  // July 15 2026 12:00:00 UTC -> Asia/Dhaka is 18:00 (UTC+6), America/New_York is 08:00 EDT (UTC-4)
  const summerUtc = Date.UTC(2026, 6, 15, 12, 0, 0);
  const dhaka = getLocationClock(summerUtc, 6, 'Asia/Dhaka');
  const ny = getLocationClock(summerUtc, -5, 'America/New_York');

  assert.equal(dhaka.hours24, 18);
  assert.equal(dhaka.effectiveTzOffset, 6);
  assert.equal(dhaka.formattedTimeShortNoPad12, '6:00 PM');

  assert.equal(ny.hours24, 8);
  assert.equal(ny.effectiveTzOffset, -4);
  assert.equal(ny.formattedTimeShortNoPad12, '8:00 AM');
});


