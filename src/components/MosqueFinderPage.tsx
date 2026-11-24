import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Navigation, MapPin, Phone, Clock, Plus, Loader2, LocateFixed } from 'lucide-react';
import { MosqueMap, type MosqueMapApi } from './MosqueMap';
import {
  applyLocalInfo,
  fetchMosquesNear,
  googleDirectionsUrl,
  haversineKm,
  readMosqueInfo,
  saveMosqueInfo,
  SEED_MOSQUES_FOR_TEST,
  type Mosque,
  type MosqueInfoPatch,
} from '../utils/mosqueData';

interface MosqueFinderPageProps {
  lang: 'bn' | 'en';
}

type FilterId = 'all' | 'jummah' | 'phone';

const DEFAULT_CENTER = { lat: 23.9999, lng: 90.4203 };
const SEARCH_RADIUS_M = 5000;

export function MosqueFinderPage({ lang }: MosqueFinderPageProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [osmMosques, setOsmMosques] = useState<Mosque[]>([]);
  const [info, setInfo] = useState<Record<string, MosqueInfoPatch>>(() => readMosqueInfo());
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [focusToken, setFocusToken] = useState(0);
  const [boundsDirty, setBoundsDirty] = useState(false);
  const [editing, setEditing] = useState<Mosque | null>(null);
  const [formJummah, setFormJummah] = useState('');
  const [formPhone, setFormPhone] = useState('');

  const mapApiRef = useRef<MosqueMapApi | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const load = useCallback(async (lat: number, lng: number) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const found = await fetchMosquesNear(lat, lng, SEARCH_RADIUS_M, controller.signal);
      setOsmMosques(found);
      setBoundsDirty(false);
      if (found.length === 0) {
        setError(
          lang === 'bn'
            ? 'এই এলাকায় OpenStreetMap-এ মসজিদ পাওয়া যায়নি — নিচে সংরক্ষিত তালিকা দেখানো হচ্ছে।'
            : 'No mosques returned by OpenStreetMap here — showing the saved list instead.',
        );
      }
    } catch {
      if (!controller.signal.aborted) {
        setError(
          lang === 'bn'
            ? 'OpenStreetMap-এ সংযোগ ব্যর্থ হয়েছে — সংরক্ষিত তালিকা দেখানো হচ্ছে।'
            : 'Could not reach OpenStreetMap — showing the saved list instead.',
        );
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    let settled = false;
    const fallback = () => {
      if (settled) return;
      settled = true;
      setCenter(DEFAULT_CENTER);
      void load(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
    };

    if (!('geolocation' in navigator)) {
      fallback();
      return;
    }

    const timer = setTimeout(fallback, 8000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPosition(next);
        setCenter(next);
        void load(next.lat, next.lng);
      },
      () => {
        clearTimeout(timer);
        fallback();
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 60_000 },
    );

    return () => {
      clearTimeout(timer);
      requestRef.current?.abort();
    };
    // Runs once on mount: geolocation is a one-shot bootstrap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allMosques = useMemo(() => {
    const merged = [...SEED_MOSQUES_FOR_TEST, ...osmMosques].map((m) => applyLocalInfo(m, info));
    const withDistance = merged.map((m) => ({
      mosque: m,
      km: haversineKm(center.lat, center.lng, m.lat, m.lng),
    }));
    return withDistance.sort((a, b) => a.km - b.km);
  }, [osmMosques, info, center]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return allMosques.filter(({ mosque }) => {
      if (filter === 'jummah' && !mosque.jummahTime) return false;
      if (filter === 'phone' && !mosque.phone) return false;
      if (!term) return true;
      return (
        mosque.name.toLowerCase().includes(term) ||
        mosque.address.toLowerCase().includes(term)
      );
    });
  }, [allMosques, query, filter]);

  const visibleMosques = useMemo(() => visible.map((v) => v.mosque), [visible]);

  const handleSelect = useCallback((id: string) => {
    setFocusId(id);
  }, []);

  const handleShowOnMap = (m: Mosque) => {
    setFocusId(m.id);
    setFocusToken((t) => t + 1);
  };

  const handleSaveInfo = () => {
    if (!editing) return;
    setInfo(saveMosqueInfo(editing.id, { jummahTime: formJummah, phone: formPhone }));
    setEditing(null);
  };

  const locationLabel = userPosition
    ? lang === 'bn'
      ? 'আপনার বর্তমান অবস্থান'
      : 'Near current location'
    : lang === 'bn'
      ? 'ডিফল্ট অবস্থান (গাজীপুর)'
      : 'Default location (Gazipur)';

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-9.5rem)] min-h-[540px]">
      {/* Sidebar */}
      <aside className="lg:w-[35%] lg:shrink-0 lg:grow-0 flex flex-col bg-white rounded-2xl border border-[#dce7e0] overflow-hidden order-2 lg:order-1">
        <div className="p-4 sm:p-5 border-b border-[#eef5f0] space-y-3">
          <div>
            <h1 className="text-xl font-bold text-[#183027]">
              {lang === 'bn' ? 'মসজিদ' : 'Mosques'}
            </h1>
            <p className="text-xs sm:text-sm text-[#5a7066] mt-0.5">
              {locationLabel} • {visible.length} {lang === 'bn' ? 'টি মসজিদ' : 'mosques'}
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#5a7066] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              data-testid="mosque-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                lang === 'bn' ? 'নাম বা রাস্তা দিয়ে খুঁজুন' : 'Search mosques by name or street'
              }
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#dce7e0] bg-[#f7faf8] text-sm text-[#183027] placeholder:text-[#8a9a91] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={lang === 'bn' ? 'সার্চ মুছুন' : 'Clear search'}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#5a7066] hover:bg-[#f2ece1] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {([
              ['all', lang === 'bn' ? 'সব' : 'All'],
              ['jummah', lang === 'bn' ? 'জুমার সময় আছে' : "Has Jumu'ah time"],
              ['phone', lang === 'bn' ? 'ফোন আছে' : 'Has phone'],
            ] as [FilterId, string][]).map(([id, label]) => (
              <button
                key={id}
                type="button"
                data-testid={`mosque-filter-${id}`}
                onClick={() => setFilter(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filter === id
                    ? 'bg-[#8B6F47] text-white'
                    : 'bg-[#f2ece1] text-[#6b5a44] hover:text-[#183027]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3" data-testid="mosque-list">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-[#5a7066] px-2 py-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              {lang === 'bn' ? 'মসজিদ খোঁজা হচ্ছে…' : 'Loading mosques…'}
            </div>
          )}

          {error && !loading && (
            <p className="text-xs text-[#8a6d3b] bg-[#fdf8ee] border border-[#f0e2c8] rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {!loading && visible.length === 0 && (
            <p className="text-sm text-[#5a7066] text-center py-8">
              {lang === 'bn' ? 'কোনো মসজিদ পাওয়া যায়নি।' : 'No mosques matched.'}
            </p>
          )}

          {visible.map(({ mosque, km }) => (
            <article
              key={mosque.id}
              data-testid={`mosque-card-${mosque.id}`}
              className={`rounded-xl border bg-white p-3.5 transition-colors ${
                focusId === mosque.id ? 'border-[#8B6F47] ring-1 ring-[#8B6F47]/30' : 'border-[#ebe6da]'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-[#183027] leading-snug truncate">
                    {mosque.name}
                  </h3>
                  <p className="text-xs text-[#5a7066] mt-0.5 line-clamp-2">{mosque.address}</p>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-md bg-[#f2ece1] text-[10px] font-semibold text-[#6b5a44]">
                  {km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`}
                </span>
              </div>

              <div className="mt-2.5 space-y-1">
                <p className="text-xs text-[#5a7066] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#8B6F47]" />
                  {mosque.jummahTime
                    ? `${lang === 'bn' ? 'জুমা' : "Jumu'ah"}: ${mosque.jummahTime}`
                    : lang === 'bn'
                      ? 'জুমা: এখনো যোগ করা হয়নি'
                      : "Jumu'ah: Not added yet"}
                </p>
                {mosque.phone && (
                  <p className="text-xs text-[#5a7066] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#8B6F47]" />
                    {mosque.phone}
                  </p>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={googleDirectionsUrl(mosque)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#8B6F47] text-white text-xs font-semibold hover:bg-[#775c39] transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  {lang === 'bn' ? 'দিকনির্দেশ' : 'Directions'}
                </a>
                <button
                  type="button"
                  onClick={() => handleShowOnMap(mosque)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#dce7e0] text-[#183027] text-xs font-semibold hover:bg-[#f7faf8] transition-colors cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {lang === 'bn' ? 'ম্যাপ' : 'Map'}
                </button>
                {(!mosque.jummahTime || !mosque.phone) && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(mosque);
                      setFormJummah(mosque.jummahTime ?? '');
                      setFormPhone(mosque.phone ?? '');
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#8B6F47] text-xs font-semibold hover:bg-[#f2ece1] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {lang === 'bn' ? 'তথ্য যোগ' : 'Add Info'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </aside>

      {/* Map */}
      <div className="relative flex-1 min-w-0 min-h-[320px] rounded-2xl overflow-hidden border border-[#dce7e0] order-1 lg:order-2">
        <MosqueMap
          center={center}
          userPosition={userPosition}
          mosques={visibleMosques}
          focusId={focusId}
          focusToken={focusToken}
          onBoundsChanged={() => setBoundsDirty(true)}
          onSelect={handleSelect}
          onReady={(api) => {
            mapApiRef.current = api;
          }}
        />

        {boundsDirty && (
          <button
            type="button"
            data-testid="mosque-search-area"
            onClick={() => {
              const next = mapApiRef.current?.getCenter();
              if (!next) return;
              setCenter(next);
              void load(next.lat, next.lng);
            }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] px-4 py-2 rounded-full bg-white text-[#183027] text-sm font-semibold shadow-md border border-[#dce7e0] hover:bg-[#f7faf8] cursor-pointer"
          >
            {lang === 'bn' ? 'এই এলাকায় খুঁজুন' : 'Search this area'}
          </button>
        )}

        <button
          type="button"
          data-testid="mosque-my-location"
          onClick={() => mapApiRef.current?.recenter()}
          aria-label={lang === 'bn' ? 'আমার অবস্থান' : 'My location'}
          className="absolute bottom-6 right-4 z-[500] w-11 h-11 rounded-full bg-white text-[#8B6F47] shadow-md border border-[#dce7e0] flex items-center justify-center hover:bg-[#f7faf8] cursor-pointer"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-[1000] bg-[#183027]/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mosque-info-title"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 space-y-3">
            <h2 id="mosque-info-title" className="text-base font-bold text-[#183027]">
              {lang === 'bn' ? 'তথ্য যোগ করুন' : 'Add info'}
            </h2>
            <p className="text-xs text-[#5a7066]">{editing.name}</p>

            <label className="block">
              <span className="text-xs font-semibold text-[#183027]">
                {lang === 'bn' ? 'জুমার সময়' : "Jumu'ah time"}
              </span>
              <input
                type="text"
                data-testid="mosque-form-jummah"
                value={formJummah}
                onChange={(e) => setFormJummah(e.target.value)}
                placeholder="1:30 PM"
                className="mt-1 w-full px-3 py-2 rounded-xl border border-[#dce7e0] bg-[#f7faf8] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-[#183027]">
                {lang === 'bn' ? 'ফোন নম্বর' : 'Phone number'}
              </span>
              <input
                type="tel"
                data-testid="mosque-form-phone"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+880 …"
                className="mt-1 w-full px-3 py-2 rounded-xl border border-[#dce7e0] bg-[#f7faf8] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
              />
            </label>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveInfo}
                data-testid="mosque-form-save"
                className="flex-1 px-3 py-2 rounded-xl bg-[#8B6F47] text-white text-sm font-semibold hover:bg-[#775c39] cursor-pointer"
              >
                {lang === 'bn' ? 'সংরক্ষণ' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-3 py-2 rounded-xl border border-[#dce7e0] text-sm font-semibold text-[#183027] hover:bg-[#f7faf8] cursor-pointer"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
