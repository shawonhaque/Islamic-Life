import { useEffect, useMemo, useState } from 'react';
import { Globe, Loader2, Navigation, Search, X } from 'lucide-react';
import type { CityLocation, Language } from '../types/islamic';
import {
  PRESET_CITIES,
  formatUtcOffsetLabel,
  getLocationClock,
  getTzOffsetFromIana,
} from '../utils/islamicMath';
import {
  type WorldTimezoneOption,
  getWorldTimezonesCatalog,
  resolveWorldTimezoneToCity,
  searchGlobalCities,
} from '../utils/locationWeather';

interface LocationSelectorModalProps {
  open: boolean;
  lang: Language;
  currentCity: CityLocation;
  liveGpsCity: CityLocation | null;
  use24Hour: boolean;
  detectingLocation: boolean;
  onClose: () => void;
  onSelectCity: (city: CityLocation) => void;
  onUseCurrentLocation: () => Promise<void> | void;
}

export function LocationSelectorModal({
  open,
  lang,
  currentCity,
  liveGpsCity,
  use24Hour,
  detectingLocation,
  onClose,
  onSelectCity,
  onUseCurrentLocation,
}: LocationSelectorModalProps) {
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cities' | 'timezones'>('cities');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [remoteResults, setRemoteResults] = useState<CityLocation[]>([]);
  const [searchingRemote, setSearchingRemote] = useState(false);
  const [resolvingTz, setResolvingTz] = useState<string | null>(null);

  const worldTimezones = useMemo(() => getWorldTimezonesCatalog(), []);

  // Tick local clocks every second while modal is open
  useEffect(() => {
    if (!open) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Live debounced Open-Meteo Global Geocoding API search
  useEffect(() => {
    if (!open || viewMode !== 'cities') return;
    const q = query.trim();
    if (q.length < 2) {
      setRemoteResults([]);
      setSearchingRemote(false);
      return;
    }

    let cancelled = false;
    setSearchingRemote(true);
    const timer = window.setTimeout(async () => {
      const results = await searchGlobalCities(q);
      if (!cancelled) {
        setRemoteResults(results);
        setSearchingRemote(false);
      }
    }, 320);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, query, viewMode]);

  const popularCities = useMemo(() => {
    const list = liveGpsCity
      ? [liveGpsCity, ...PRESET_CITIES.filter((c) => c.id !== liveGpsCity.id)]
      : PRESET_CITIES;
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name_en.toLowerCase().includes(q) ||
        c.name_bn.toLowerCase().includes(q) ||
        c.country_en.toLowerCase().includes(q) ||
        (c.region_en || '').toLowerCase().includes(q)
    );
  }, [liveGpsCity, query]);

  const mergedCityResults = useMemo(() => {
    if (query.trim().length < 2) return popularCities;
    const seen = new Set(
      popularCities.map((c) => `${c.name_en.toLowerCase()}_${c.countryCode || ''}`)
    );
    const uniqueRemote = remoteResults.filter(
      (r) => !seen.has(`${r.name_en.toLowerCase()}_${r.countryCode || ''}`)
    );
    return [...popularCities, ...uniqueRemote];
  }, [popularCities, remoteResults, query]);

  const filteredTimezones = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? worldTimezones.filter(
          (tz) =>
            tz.timeZoneId.toLowerCase().includes(q) ||
            tz.cityLabel.toLowerCase().includes(q) ||
            tz.regionLabel.toLowerCase().includes(q)
        )
      : worldTimezones;
    return matched.slice(0, 80);
  }, [worldTimezones, query]);

  if (!open) return null;

  const handlePickCity = (chosen: CityLocation) => {
    onSelectCity(chosen);
    setQuery('');
    onClose();
  };

  const handlePickTimezone = async (tz: WorldTimezoneOption) => {
    setResolvingTz(tz.timeZoneId);
    try {
      const resolved = await resolveWorldTimezoneToCity(tz);
      onSelectCity(resolved);
      setQuery('');
      onClose();
    } finally {
      setResolvingTz(null);
    }
  };

  const handleGpsClick = async () => {
    await onUseCurrentLocation();
    setQuery('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      data-testid="location-selector-modal"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] bg-[#F7F5EE] text-[#1C1B18] rounded-3xl shadow-2xl border border-[#E5DFCF] overflow-hidden flex flex-col max-h-[86vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header + Search + Current Location Action */}
        <div className="p-5 sm:p-6 pb-4 space-y-3.5 border-b border-[#EAE4D4]">
          <div className="flex items-center justify-between gap-3">
            <h2
              id="location-modal-title"
              className="font-display text-xl font-bold text-[#1C1B18]"
            >
              {lang === 'bn' ? 'অবস্থান (Location)' : 'Location'}
            </h2>

            <button
              type="button"
              onClick={onClose}
              aria-label={lang === 'bn' ? 'বন্ধ করুন' : 'Close location selector'}
              className="w-9 h-9 rounded-full bg-[#ECE7D9] hover:bg-[#E1DAC7] text-[#3E3B34] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Rounded White Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#7D786C] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              autoFocus
              data-testid="location-modal-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'যেকোনো শহর বা টাইমজোন খুঁজুন...'
                  : 'Search any city or town...'
              }
              className="w-full bg-white border border-[#E5DFCF] focus:border-[#8C6218] rounded-2xl pl-11 pr-4 py-3 text-sm text-[#1C1B18] placeholder:text-[#8E897E] focus:outline-none shadow-2xs"
            />
          </div>

          {/* Full-width Use My Current Location Button (#EAE4D3) */}
          <button
            type="button"
            data-testid="location-modal-gps-btn"
            onClick={handleGpsClick}
            disabled={detectingLocation}
            className="w-full bg-[#EAE4D3] hover:bg-[#E1D9C3] text-[#1C1B18] rounded-2xl px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-65"
          >
            {detectingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#8C6218]" />
            ) : (
              <Navigation className="w-4 h-4 text-[#8C6218]" />
            )}
            <span>
              {detectingLocation
                ? lang === 'bn'
                  ? 'বর্তমান অবস্থান নির্ণয় হচ্ছে...'
                  : 'Detecting current location...'
                : lang === 'bn'
                ? 'আমার বর্তমান লোকেশন ব্যবহার করুন (GPS)'
                : 'Use my current location'}
            </span>
          </button>

          {/* Popular Cities vs World Timezones Switch */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <p className="text-xs font-bold text-[#6E6A61]">
              {viewMode === 'cities'
                ? query.trim().length >= 2
                  ? lang === 'bn'
                    ? 'অনুসন্ধানের ফলাফল'
                    : 'Matching cities'
                  : lang === 'bn'
                  ? 'জনপ্রিয় শহরসমূহ'
                  : 'Popular cities'
                : lang === 'bn'
                ? `সকল বিশ্ব টাইমজোন (${worldTimezones.length})`
                : `All world timezones (${worldTimezones.length})`}
            </p>

            <div className="inline-flex bg-[#ECE7D9] p-0.5 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setViewMode('cities')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  viewMode === 'cities'
                    ? 'bg-white text-[#1C1B18] shadow-2xs'
                    : 'text-[#6E6A61] hover:text-[#1C1B18]'
                }`}
              >
                {lang === 'bn' ? 'শহর' : 'Cities'}
              </button>
              <button
                type="button"
                data-testid="location-modal-tz-tab"
                onClick={() => setViewMode('timezones')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 ${
                  viewMode === 'timezones'
                    ? 'bg-white text-[#1C1B18] shadow-2xs'
                    : 'text-[#6E6A61] hover:text-[#1C1B18]'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>{lang === 'bn' ? 'টাইমজোন' : 'Timezones'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-4">
          {viewMode === 'cities' ? (
            <>
              {searchingRemote && (
                <div className="py-3 text-xs text-[#6E6A61] flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8C6218]" />
                  <span>
                    {lang === 'bn' ? 'বিশ্বব্যাপী শহর খুঁজছে...' : 'Searching cities worldwide...'}
                  </span>
                </div>
              )}

              {mergedCityResults.length === 0 && !searchingRemote ? (
                <div className="py-10 text-center text-xs text-[#6E6A61]">
                  {lang === 'bn'
                    ? 'কোনো শহর পাওয়া যায়নি। অন্য নাম লিখে চেষ্টা করুন বা টাইমজোন ট্যাব দেখুন।'
                    : 'No matching cities found. Try another town or switch to Timezones.'}
                </div>
              ) : (
                <div className="divide-y divide-[#E7E2D4]">
                  {mergedCityResults.map((c) => {
                    const itemClock = getLocationClock(nowMs, c.tzOffset, c.timeZoneId);
                    const timeStr = use24Hour
                      ? itemClock.formattedTimeShort24
                      : itemClock.formattedTimeShortNoPad12;
                    const utcStr = formatUtcOffsetLabel(itemClock.effectiveTzOffset);
                    const isSelected = currentCity.id === c.id;
                    const badge =
                      c.countryCode ||
                      (c.isLiveGps ? 'GP' : c.country_en.slice(0, 2).toUpperCase());
                    const subtitle =
                      lang === 'bn'
                        ? c.region_bn || `${c.country_bn}`
                        : c.region_en || `${c.country_en}`;

                    return (
                      <button
                        key={c.id}
                        type="button"
                        data-testid={`location-item-${c.id}`}
                        onClick={() => handlePickCity(c)}
                        className={`w-full py-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer rounded-xl px-2 -mx-2 ${
                          isSelected ? 'bg-[#EFEAD9]' : 'hover:bg-[#EFEAD9]/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-9 h-9 rounded-xl bg-[#EAE4D3] text-[#4C473C] text-xs font-bold flex items-center justify-center shrink-0 tracking-wide">
                            {badge}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#1C1B18] truncate flex items-center gap-1.5">
                              <span className="truncate">
                                {lang === 'bn' ? c.name_bn : c.name_en}
                              </span>
                              {c.isLiveGps && (
                                <span className="text-[11px] font-semibold text-[#087653] shrink-0">
                                  ({lang === 'bn' ? 'লাইভ GPS' : 'Live GPS'})
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-[#736E63] truncate mt-0.5">{subtitle}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 font-mono-tabular text-xs text-[#6E6A61]">
                          <span className="font-semibold text-[#1C1B18]">{timeStr}</span>
                          <span aria-hidden="true"> · </span>
                          <span>{utcStr}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="divide-y divide-[#E7E2D4]">
              {filteredTimezones.map((tz) => {
                const offset = getTzOffsetFromIana(tz.timeZoneId, nowMs);
                const tzClock = getLocationClock(nowMs, offset, tz.timeZoneId);
                const timeStr = use24Hour
                  ? tzClock.formattedTimeShort24
                  : tzClock.formattedTimeShortNoPad12;
                const utcStr = formatUtcOffsetLabel(tzClock.effectiveTzOffset);
                const busy = resolvingTz === tz.timeZoneId;

                return (
                  <button
                    key={tz.timeZoneId}
                    type="button"
                    disabled={busy}
                    onClick={() => void handlePickTimezone(tz)}
                    className="w-full py-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer rounded-xl px-2 -mx-2 hover:bg-[#EFEAD9]/60 disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-xl bg-[#EAE4D3] text-[#4C473C] text-xs font-bold flex items-center justify-center shrink-0">
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : tz.badgeCode}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1C1B18] truncate">{tz.cityLabel}</p>
                        <p className="text-xs text-[#736E63] truncate mt-0.5">{tz.regionLabel}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono-tabular text-xs text-[#6E6A61]">
                      <span className="font-semibold text-[#1C1B18]">{timeStr}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{utcStr}</span>
                    </div>
                  </button>
                );
              })}
              {filteredTimezones.length === 0 && (
                <div className="py-10 text-center text-xs text-[#6E6A61]">
                  {lang === 'bn' ? 'কোনো টাইমজোন পাওয়া যায়নি।' : 'No matching timezones found.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
