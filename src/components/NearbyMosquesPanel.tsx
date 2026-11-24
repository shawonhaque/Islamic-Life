import { useEffect, useRef, useState } from 'react';
import {
  Building2,
  Clock,
  Globe,
  Layers,
  LocateFixed,
  Map as MapIcon,
  Navigation,
  Phone,
  Search,
} from 'lucide-react';
import type { CityLocation, Language } from '../types/islamic';

interface MapLibreGlobal {
  Map: new (opts: Record<string, unknown>) => MapLibreInstance;
  NavigationControl: new () => unknown;
  Marker: new (opts: { element: HTMLElement }) => MapLibreMarker;
  Popup: new (opts: { offset: number }) => { setHTML: (html: string) => unknown };
}

interface MapLibreInstance {
  remove: () => void;
  addControl: (ctrl: unknown, pos: string) => void;
  on: (event: string, cb: () => void) => void;
  setProjection?: (opts: { type: string }) => void;
  easeTo: (opts: { pitch: number; duration: number }) => void;
  flyTo: (opts: { center: [number, number]; zoom: number; pitch: number; duration: number }) => void;
}

interface MapLibreMarker {
  setLngLat: (coords: [number, number]) => MapLibreMarker;
  setPopup: (popup: unknown) => MapLibreMarker;
  addTo: (map: MapLibreInstance) => MapLibreMarker;
  remove: () => void;
}

function getMapLibre(): MapLibreGlobal | undefined {
  return (window as unknown as { maplibregl?: MapLibreGlobal }).maplibregl;
}

interface Mosque {
  id: number;
  name: string;
  address: string;
  lat: number;
  lon: number;
  distanceKm: number;
  phone?: string;
  jumuahTime?: string;
  verified: boolean;
}

interface NearbyMosquesPanelProps {
  lang: Language;
  city: CityLocation;
  onDetectGps?: () => void;
  onOpenLocationModal?: () => void;
}

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getMapStyle(mode: 'liberty' | 'positron' | 'earth') {
  if (mode === 'liberty') return 'https://tiles.openfreemap.org/styles/liberty';
  if (mode === 'positron') return 'https://tiles.openfreemap.org/styles/positron';
  return {
    version: 8,
    sources: {
      satellite: {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: 'OpenFreeMap © OpenMapTiles · Data from OpenStreetMap · Imagery © Esri',
      },
    },
    layers: [
      {
        id: 'satellite-layer',
        type: 'raster',
        source: 'satellite',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };
}

export function NearbyMosquesPanel({
  lang,
  city,
  onDetectGps,
  onOpenLocationModal,
}: NearbyMosquesPanelProps) {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loadingMosques, setLoadingMosques] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'jumuah' | 'phone'>('all');
  const [selectedMosqueId, setSelectedMosqueId] = useState<number | null>(null);
  const [mapStyleMode, setMapStyleMode] = useState<'liberty' | 'positron' | 'earth'>('liberty');
  const [is3DBuildings, setIs3DBuildings] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(() => Boolean(getMapLibre()));

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapLibreInstance | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);

  // Dynamically load MapLibre GL JS via CDN when tab is opened
  useEffect(() => {
    if (getMapLibre()) {
      setMapLoaded(true);
      return;
    }

    if (!document.getElementById('maplibre-gl-css')) {
      const link = document.createElement('link');
      link.id = 'maplibre-gl-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
      document.head.appendChild(link);
    }

    const existingScript = document.getElementById('maplibre-gl-js') as HTMLScriptElement | null;
    if (existingScript) {
      const onLoad = () => setMapLoaded(true);
      existingScript.addEventListener('load', onLoad);
      return () => existingScript.removeEventListener('load', onLoad);
    }

    const script = document.createElement('script');
    script.id = 'maplibre-gl-js';
    script.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
    script.async = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Fetch Live Nearby Mosques from OpenStreetMap Overpass API
  useEffect(() => {
    let cancelled = false;
    const fetchMosques = async () => {
      setLoadingMosques(true);
      try {
        const radius = 3500;
        const query = `
          [out:json][timeout:25];
          (
            node["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${city.lat},${city.lng});
            way["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${city.lat},${city.lng});
          );
          out center;
        `;
        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: query,
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          elements?: Array<{
            id: number;
            lat?: number;
            lon?: number;
            center?: { lat: number; lon: number };
            tags?: Record<string, string>;
          }>;
        };
        if (cancelled) return;

        const parsed: Mosque[] = (data.elements || [])
          .map((el): Mosque | null => {
            const mLat = el.lat ?? el.center?.lat;
            const mLon = el.lon ?? el.center?.lon;
            if (typeof mLat !== 'number' || typeof mLon !== 'number') return null;

            const tags = el.tags || {};
            const name =
              tags['name:en'] || tags.name || tags['name:bn'] || 'Local Jame Masjid';
            const street =
              tags['addr:full'] ||
              [tags['addr:housenumber'], tags['addr:street'], tags['addr:suburb']]
                .filter(Boolean)
                .join(', ') ||
              city.name_en;
            const phone = tags.phone || tags['contact:phone'] || undefined;
            const jumuahTime = tags['service_times:jumuah'] || tags['jumuah'] || undefined;
            const dist = calculateDistanceKm(city.lat, city.lng, mLat, mLon);

            return {
              id: el.id,
              name,
              address: street,
              lat: mLat,
              lon: mLon,
              distanceKm: Number(dist.toFixed(1)),
              phone,
              jumuahTime,
              verified: Boolean(tags.name && (tags['addr:street'] || phone)),
            };
          })
          .filter((item): item is Mosque => Boolean(item))
          .sort((a, b) => a.distanceKm - b.distanceKm);

        setMosques(parsed);
      } catch {
        // Keep previous results cleanly
      } finally {
        if (!cancelled) setLoadingMosques(false);
      }
    };

    void fetchMosques();
    return () => {
      cancelled = true;
    };
  }, [city.lat, city.lng, city.name_en]);

  // Initialize & Update MapLibre GL JS Map
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current) return;
    const maplibregl = getMapLibre();
    if (!maplibregl) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getMapStyle(mapStyleMode),
      center: [city.lng, city.lat],
      zoom: 15,
      pitch: is3DBuildings ? 50 : 0,
      bearing: -15,
      antialias: true,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('style.load', () => {
      if (map.setProjection) {
        map.setProjection({ type: 'globe' });
      }
    });

    const userEl = document.createElement('div');
    userEl.innerHTML = `
      <div style="width:18px;height:18px;background:#2563EB;border:3px solid #FFFFFF;border-radius:50%;box-shadow:0 0 12px rgba(37,99,235,0.7);"></div>
    `;
    new maplibregl.Marker({ element: userEl })
      .setLngLat([city.lng, city.lat])
      .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(`<b>${city.name_en}</b>`))
      .addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded, mapStyleMode, city.lat, city.lng, city.name_en, is3DBuildings]);

  // Toggle 3D Pitch smoothly
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.easeTo({
        pitch: is3DBuildings ? 50 : 0,
        duration: 600,
      });
    }
  }, [is3DBuildings]);

  // Plot Gold Mosque Pins on MapLibre
  useEffect(() => {
    const map = mapInstanceRef.current;
    const maplibregl = getMapLibre();
    if (!map || !maplibregl) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    mosques.forEach((m) => {
      const el = document.createElement('div');
      const isSelected = m.id === selectedMosqueId;
      el.style.cursor = 'pointer';
      el.innerHTML = `
        <div style="
          width: ${isSelected ? '34px' : '28px'};
          height: ${isSelected ? '34px' : '28px'};
          background: ${isSelected ? '#8C6218' : '#FFFFFF'};
          border: 2.5px solid #8C6218;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          font-size: 14px;
          transition: all 0.2s;
        ">
          🕌
        </div>
      `;

      const popupHtml = `
        <div style="font-family:sans-serif;padding:4px;max-width:210px;">
          <div style="font-weight:700;font-size:13px;color:#1C1B18;">${m.name}</div>
          <div style="font-size:11px;color:#6E6A63;margin-top:2px;">${m.address}</div>
          <div style="font-size:11px;font-weight:600;color:#8C6218;margin-top:4px;">${m.distanceKm} km away</div>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lon}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:6px;font-size:11px;color:#2563EB;text-decoration:underline;">Get Directions →</a>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([m.lon, m.lat])
        .setPopup(new maplibregl.Popup({ offset: 18 }).setHTML(popupHtml))
        .addTo(map);

      el.addEventListener('click', () => {
        setSelectedMosqueId(m.id);
      });

      markersRef.current.push(marker);
    });
  }, [mosques, selectedMosqueId, mapStyleMode]);

  const handleSelectMosqueOnMap = (mosque: Mosque) => {
    setSelectedMosqueId(mosque.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [mosque.lon, mosque.lat],
        zoom: 17,
        pitch: is3DBuildings ? 55 : 0,
        duration: 1200,
      });
    }
  };

  const filteredMosques = mosques.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.address.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'phone') return Boolean(m.phone);
    if (filterType === 'jumuah') return Boolean(m.jumuahTime);
    return true;
  });

  return (
    <div
      data-testid="nearby-mosques-panel"
      className="bg-white rounded-2xl border border-[#E6E2D8] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]"
    >
      {/* Left Sidebar */}
      <aside className="lg:col-span-5 bg-[#F7F5F0] border-b lg:border-b-0 lg:border-r border-[#E6E2D8] flex flex-col max-h-[420px] lg:max-h-[680px]">
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-[#1C1B18]">
                {lang === 'bn' ? 'নিকটস্থ মসজিদ' : 'Mosques'}
              </h2>
              <p className="text-xs text-[#6E6A63] mt-0.5">
                {lang === 'bn' ? `${city.name_bn}-এর আশেপাশে` : `Near ${city.name_en}`} ·{' '}
                {filteredMosques.length} {lang === 'bn' ? 'টি মসজিদ' : 'mosques'}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {onOpenLocationModal && (
                <button
                  type="button"
                  onClick={onOpenLocationModal}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E6E2D8] text-xs font-semibold text-[#1C1B18] hover:border-[#8C6218] cursor-pointer"
                >
                  {lang === 'bn' ? 'শহর বদল' : 'City'}
                </button>
              )}
              {onDetectGps && (
                <button
                  type="button"
                  onClick={onDetectGps}
                  aria-label={lang === 'bn' ? 'লাইভ GPS' : 'Detect GPS'}
                  className="p-1.5 rounded-lg bg-white border border-[#E6E2D8] text-[#8C6218] hover:border-[#8C6218] cursor-pointer"
                >
                  <LocateFixed className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="relative mt-3.5">
            <Search className="w-4 h-4 text-[#8C877E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'মসজিদের নাম বা এলাকার রাস্তা দিয়ে খুঁজুন'
                  : 'Search mosques by name or street'
              }
              className="w-full bg-white border border-[#E6E2D8] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#1C1B18] placeholder-[#8C877E] focus:outline-none focus:border-[#8C6218]"
            />
          </div>

          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
                filterType === 'all'
                  ? 'bg-[#8C6218] text-white'
                  : 'bg-white border border-[#E6E2D8] text-[#4A463F]'
              }`}
            >
              {lang === 'bn' ? 'সবগুলো' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('jumuah')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition flex items-center gap-1 ${
                filterType === 'jumuah'
                  ? 'bg-[#8C6218] text-white'
                  : 'bg-white border border-[#E6E2D8] text-[#4A463F]'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{lang === 'bn' ? 'জুমার সময়' : "Has Jumu'ah time"}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('phone')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition flex items-center gap-1 ${
                filterType === 'phone'
                  ? 'bg-[#8C6218] text-white'
                  : 'bg-white border border-[#E6E2D8] text-[#4A463F]'
              }`}
            >
              <Phone className="w-3 h-3" />
              <span>{lang === 'bn' ? 'ফোন নম্বর' : 'Has phone'}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
          {loadingMosques ? (
            <div className="text-center py-10 text-xs text-[#6E6A63]">
              {lang === 'bn'
                ? 'OpenStreetMap থেকে নিকটস্থ মসজিদ খোঁজা হচ্ছে...'
                : 'Finding nearby mosques from OpenStreetMap...'}
            </div>
          ) : filteredMosques.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#6E6A63]">
              {lang === 'bn'
                ? 'কোনো মসজিদ পাওয়া যায়নি।'
                : 'No mosques found matching your filter.'}
            </div>
          ) : (
            filteredMosques.map((mosque) => (
              <div
                key={mosque.id}
                onClick={() => handleSelectMosqueOnMap(mosque)}
                className={`bg-white rounded-xl p-4 border transition cursor-pointer ${
                  selectedMosqueId === mosque.id
                    ? 'border-[#8C6218] shadow-sm'
                    : 'border-[#E6E2D8] hover:border-[#C9C2B4]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-[#1C1B18] leading-snug">
                      {mosque.name}
                    </h3>
                    <p className="text-xs text-[#6E6A63] mt-0.5">{mosque.address}</p>
                  </div>
                  <span className="bg-[#F3EDE2] text-[#8C6218] text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 font-mono-tabular">
                    {mosque.distanceKm} km
                  </span>
                </div>

                <p className="text-[11px] text-[#8C877E] mt-2">
                  Jumu&apos;ah{' '}
                  <span className="italic">{mosque.jumuahTime || 'Not added yet'}</span>
                </p>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#F3EFE6]">
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${mosque.lat},${mosque.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 bg-[#F7F5F0] hover:bg-[#EFECE4] text-[#3D3A35] text-[11px] font-semibold px-2.5 py-1.5 rounded-lg"
                    >
                      <Navigation className="w-3 h-3 text-[#8C6218]" />
                      <span>{lang === 'bn' ? 'দিকনির্দেশ' : 'Directions'}</span>
                    </a>

                    {mosque.phone && (
                      <a
                        href={`tel:${mosque.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 bg-[#F7F5F0] hover:bg-[#EFECE4] text-[#3D3A35] text-[11px] font-semibold px-2.5 py-1.5 rounded-lg"
                      >
                        <Phone className="w-3 h-3 text-[#8C6218]" />
                        <span>{lang === 'bn' ? 'কল' : 'Call'}</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectMosqueOnMap(mosque);
                      }}
                      className="inline-flex items-center gap-1 bg-[#F7F5F0] hover:bg-[#EFECE4] text-[#3D3A35] text-[11px] font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer"
                    >
                      <MapIcon className="w-3 h-3 text-[#8C6218]" />
                      <span>{lang === 'bn' ? 'ম্যাপ' : 'Map'}</span>
                    </button>
                  </div>

                  {!mosque.verified && (
                    <span className="text-[10px] text-[#9E998F]">Unconfirmed listing</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Right Map Container */}
      <section className="lg:col-span-7 relative min-h-[420px] lg:min-h-[680px] bg-[#EAE6DD]">
        <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-xs p-1.5 rounded-xl border border-[#E6E2D8] shadow-sm">
          <button
            type="button"
            onClick={() => setMapStyleMode('liberty')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
              mapStyleMode === 'liberty'
                ? 'bg-[#8C6218] text-white'
                : 'text-[#4A463F] hover:bg-[#F7F5F0]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>OpenFreeMap</span>
          </button>

          <button
            type="button"
            onClick={() => setMapStyleMode('positron')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
              mapStyleMode === 'positron'
                ? 'bg-[#8C6218] text-white'
                : 'text-[#4A463F] hover:bg-[#F7F5F0]'
            }`}
          >
            <span>Light Map</span>
          </button>

          <button
            type="button"
            onClick={() => setMapStyleMode('earth')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
              mapStyleMode === 'earth'
                ? 'bg-[#8C6218] text-white'
                : 'text-[#4A463F] hover:bg-[#F7F5F0]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Earth Satellite</span>
          </button>

          <button
            type="button"
            onClick={() => setIs3DBuildings(!is3DBuildings)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition ${
              is3DBuildings
                ? 'border-[#8C6218] text-[#8C6218] bg-[#F3EDE2]'
                : 'border-[#E6E2D8] text-[#6E6A63]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>3D View</span>
          </button>
        </div>

        <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />

        <div className="absolute bottom-2 left-2 z-10 bg-white/90 px-2.5 py-1 rounded-md text-[10px] text-[#4A463F] border border-[#E6E2D8]">
          OpenFreeMap © OpenMapTiles · Data from OpenStreetMap
        </div>
      </section>
    </div>
  );
}
