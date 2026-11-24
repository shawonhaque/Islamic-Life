/// <reference types="google.maps" />
import { useEffect, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Compass, LocateFixed, MapPin, Maximize2, Satellite } from 'lucide-react';
import type { Language } from '../types/islamic';
import { KAABA_COORDS } from '../utils/islamicMath';

interface QiblaGoogleMapProps {
  lang: Language;
  userLat: number;
  userLng: number;
  locationLabel: string;
  bearing: number;
  cardinalLabel: string;
  distanceKm: number;
  onSelectMapPoint?: (lat: number, lng: number) => void;
}

interface GeodesicLineProps {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  fitNonce: number;
  focusTarget: 'bounds' | 'origin' | 'kaaba';
}

function QiblaGeodesicLine({
  origin,
  destination,
  fitNonce,
  focusTarget,
}: GeodesicLineProps) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const coreLib = useMapsLibrary('core');

  // Draw the interactive geodesic Great Circle polyline between user location and Kaaba
  useEffect(() => {
    if (!map || !mapsLib) return;

    const glowLine = new mapsLib.Polyline({
      path: [origin, destination],
      geodesic: true,
      strokeColor: '#d4a84f',
      strokeOpacity: 0.42,
      strokeWeight: 7,
      zIndex: 1,
    });
    glowLine.setMap(map);

    const arrowSymbol: google.maps.Symbol = {
      path:
        typeof google !== 'undefined' && google.maps?.SymbolPath
          ? google.maps.SymbolPath.FORWARD_CLOSED_ARROW
          : 1,
      scale: 3.4,
      strokeColor: '#d4a84f',
      strokeWeight: 1.5,
      fillColor: '#087653',
      fillOpacity: 1,
    };

    const qiblaLine = new mapsLib.Polyline({
      path: [origin, destination],
      geodesic: true,
      strokeColor: '#087653',
      strokeOpacity: 0.95,
      strokeWeight: 3.2,
      zIndex: 2,
      icons: [
        { icon: arrowSymbol, offset: '28%' },
        { icon: arrowSymbol, offset: '55%' },
        { icon: arrowSymbol, offset: '82%' },
      ],
    });
    qiblaLine.setMap(map);

    return () => {
      qiblaLine.setMap(null);
      glowLine.setMap(null);
    };
  }, [map, mapsLib, origin.lat, origin.lng, destination.lat, destination.lng]);

  // Fit or focus camera when user requests or coordinates change
  useEffect(() => {
    if (!map || !coreLib) return;

    if (focusTarget === 'origin') {
      map.panTo(origin);
      map.setZoom(14);
      return;
    }

    if (focusTarget === 'kaaba') {
      map.panTo(destination);
      map.setZoom(16);
      return;
    }

    const bounds = new coreLib.LatLngBounds();
    bounds.extend(origin);
    bounds.extend(destination);
    map.fitBounds(bounds, { top: 56, bottom: 56, left: 48, right: 48 });
  }, [map, coreLib, origin.lat, origin.lng, destination.lat, destination.lng, fitNonce, focusTarget]);

  return null;
}

export function QiblaGoogleMap({
  lang,
  userLat,
  userLng,
  locationLabel,
  bearing,
  cardinalLabel,
  distanceKm,
  onSelectMapPoint,
}: QiblaGoogleMapProps) {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() ?? '';
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('hybrid');
  const [fitNonce, setFitNonce] = useState<number>(1);
  const [focusTarget, setFocusTarget] = useState<'bounds' | 'origin' | 'kaaba'>('bounds');
  const [activeInfo, setActiveInfo] = useState<'origin' | 'kaaba' | null>(null);

  const [originMarkerRef, originMarker] = useAdvancedMarkerRef();
  const [kaabaMarkerRef, kaabaMarker] = useAdvancedMarkerRef();

  const originPos = { lat: userLat, lng: userLng };
  const midpoint = {
    lat: (userLat + KAABA_COORDS.lat) / 2,
    lng: (userLng + KAABA_COORDS.lng) / 2,
  };

  const handleFitBounds = () => {
    setFocusTarget('bounds');
    setFitNonce((n) => n + 1);
  };

  const handleFocusOrigin = () => {
    setFocusTarget('origin');
    setFitNonce((n) => n + 1);
    setActiveInfo('origin');
  };

  const handleFocusKaaba = () => {
    setFocusTarget('kaaba');
    setFitNonce((n) => n + 1);
    setActiveInfo('kaaba');
  };

  return (
    <section
      data-testid="qibla-google-map-section"
      className="bg-white rounded-2xl border border-[#dce7e0] p-5 sm:p-6 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#183027] flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#087653]" />
            <span>
              {lang === 'bn'
                ? 'ইন্টারঅ্যাক্টিভ গুগল ম্যাপ কিবলা লাইন'
                : 'Interactive Google Maps Qibla Line'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[#5a7066] mt-0.5">
            {lang === 'bn'
              ? 'আপনার অবস্থান থেকে মক্কার পবিত্র কাবা শরীফ পর্যন্ত সরাসরি গ্রেট-সার্কেল কিবলা রেখা। ম্যাপের যেকোনো স্থানে ক্লিক করেও দিক দেখতে পারেন।'
              : 'Live Great-Circle geodesic line from your coordinates directly to the Holy Kaaba in Makkah. Click anywhere on the map to preview Qibla from that spot.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleFitBounds}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
              focusTarget === 'bounds'
                ? 'bg-[#eef5f0] border-[#087653]/40 text-[#087653]'
                : 'bg-white border-[#dce7e0] text-[#5a7066] hover:border-[#087653]'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'সম্পূর্ণ কিবলা পথ' : 'Fit Qibla Path'}</span>
          </button>

          <button
            type="button"
            onClick={handleFocusOrigin}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
              focusTarget === 'origin'
                ? 'bg-[#eef5f0] border-[#087653]/40 text-[#087653]'
                : 'bg-white border-[#dce7e0] text-[#5a7066] hover:border-[#087653]'
            }`}
          >
            <LocateFixed className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'আমার অবস্থান' : 'My Location'}</span>
          </button>

          <button
            type="button"
            onClick={handleFocusKaaba}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
              focusTarget === 'kaaba'
                ? 'bg-[#f6efe0] border-[#b58328]/50 text-[#8f6319]'
                : 'bg-white border-[#dce7e0] text-[#5a7066] hover:border-[#b58328]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'মক্কা · কাবা' : 'Makkah · Kaaba'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMapType((prev) => (prev === 'hybrid' ? 'roadmap' : 'hybrid'))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-[#183027] hover:border-[#087653] font-medium transition-colors cursor-pointer"
          >
            <Satellite className="w-3.5 h-3.5 text-[#087653]" />
            <span>
              {mapType === 'hybrid'
                ? lang === 'bn'
                  ? 'রোডম্যাপ ভিউ'
                  : 'Roadmap View'
                : lang === 'bn'
                ? 'স্যাটেলাইট ভিউ'
                : 'Satellite View'}
            </span>
          </button>
        </div>
      </div>

      {/* Live Telemetry Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-xl bg-[#f7faf8] border border-[#dce7e0] px-3.5 py-2.5 flex items-center justify-between">
          <span className="text-[#5a7066]">{lang === 'bn' ? 'বর্তমান স্থান' : 'Origin Point'}</span>
          <span className="font-mono-tabular font-semibold text-[#183027]">
            {userLat.toFixed(4)}°, {userLng.toFixed(4)}°
          </span>
        </div>
        <div className="rounded-xl bg-[#eef5f0]/75 border border-[#087653]/25 px-3.5 py-2.5 flex items-center justify-between">
          <span className="text-[#064b37]">{lang === 'bn' ? 'কিবলা কোণ' : 'Qibla Azimuth'}</span>
          <span className="font-mono-tabular font-bold text-[#087653]">
            {bearing}° ({cardinalLabel})
          </span>
        </div>
        <div className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] px-3.5 py-2.5 flex items-center justify-between">
          <span className="text-[#6e7268]">
            {lang === 'bn' ? 'কাবা পর্যন্ত দূরত্ব' : 'Great-Circle Distance'}
          </span>
          <span className="font-mono-tabular font-bold text-[#8f6319]">
            {distanceKm.toLocaleString()} km
          </span>
        </div>
      </div>

      {/* Explicit Height Container so <Map> never collapses */}
      {apiKey ? (
        <div className="w-full h-[380px] sm:h-[440px] rounded-xl overflow-hidden border border-[#dce7e0] relative bg-[#e9f0ec]">
          <APIProvider apiKey={apiKey} language={lang === 'bn' ? 'bn' : 'en'}>
            <GoogleMap
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              defaultCenter={midpoint}
              defaultZoom={3}
              mapTypeId={mapType}
              gestureHandling="greedy"
              streetViewControl={false}
              style={{ width: '100%', height: '100%' }}
              onClick={(event) => {
                const clicked = event.detail.latLng;
                if (clicked && onSelectMapPoint) {
                  onSelectMapPoint(
                    Number(clicked.lat.toFixed(4)),
                    Number(clicked.lng.toFixed(4))
                  );
                }
              }}
            >
              <QiblaGeodesicLine
                origin={originPos}
                destination={KAABA_COORDS}
                fitNonce={fitNonce}
                focusTarget={focusTarget}
              />

              {/* User Origin Advanced Marker */}
              <AdvancedMarker
                ref={originMarkerRef}
                position={originPos}
                title={locationLabel}
                onClick={() => setActiveInfo('origin')}
              >
                <Pin background="#087653" borderColor="#064b37" glyphColor="#ffffff" />
              </AdvancedMarker>

              {/* Holy Kaaba Advanced Marker */}
              <AdvancedMarker
                ref={kaabaMarkerRef}
                position={KAABA_COORDS}
                title={lang === 'bn' ? 'পবিত্র কাবা শরীফ, মক্কা' : 'Holy Kaaba, Makkah'}
                onClick={() => setActiveInfo('kaaba')}
              >
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-lg bg-[#141715] border-2 border-[#d4a84f] shadow-lg flex flex-col items-center justify-center relative">
                    <span className="w-full h-1.5 bg-[#d4a84f] mt-1" />
                    <span className="text-[9px] font-bold text-[#f6d37b] mt-0.5 leading-none">
                      الكعبة
                    </span>
                  </div>
                  <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#d4a84f]" />
                </div>
              </AdvancedMarker>

              {activeInfo === 'origin' && originMarker && (
                <InfoWindow anchor={originMarker} onCloseClick={() => setActiveInfo(null)}>
                  <div className="p-1 text-xs text-[#183027] space-y-1 max-w-[200px]">
                    <p className="font-bold">{locationLabel}</p>
                    <p className="font-mono-tabular text-[#5a7066]">
                      {userLat.toFixed(4)}, {userLng.toFixed(4)}
                    </p>
                    <p className="font-semibold text-[#087653]">
                      {lang === 'bn'
                        ? `কিবলা: ${bearing}° (${cardinalLabel})`
                        : `Qibla: ${bearing}° (${cardinalLabel})`}
                    </p>
                  </div>
                </InfoWindow>
              )}

              {activeInfo === 'kaaba' && kaabaMarker && (
                <InfoWindow anchor={kaabaMarker} onCloseClick={() => setActiveInfo(null)}>
                  <div className="p-1 text-xs text-[#183027] space-y-1 max-w-[210px]">
                    <p className="font-bold">
                      {lang === 'bn' ? 'পবিত্র কাবা শরীফ · মক্কা' : 'Holy Kaaba · Makkah'}
                    </p>
                    <p className="font-mono-tabular text-[#5a7066]">21.4225° N, 39.8262° E</p>
                    <p className="font-semibold text-[#8f6319]">
                      {lang === 'bn'
                        ? `দূরত্ব: ${distanceKm.toLocaleString()} কিমি`
                        : `Distance: ${distanceKm.toLocaleString()} km`}
                    </p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </APIProvider>
        </div>
      ) : (
        <div className="w-full h-[260px] rounded-xl border border-dashed border-[#dce7e0] bg-[#faf7f0] flex flex-col items-center justify-center p-6 text-center space-y-2">
          <MapPin className="w-8 h-8 text-[#b58328]" />
          <p className="text-sm font-semibold text-[#183027]">
            {lang === 'bn'
              ? 'গুগল ম্যাপস কী কনফিগার করা হয়নি'
              : 'Google Maps API Key Not Configured'}
          </p>
          <p className="text-xs text-[#5a7066] max-w-md">
            {lang === 'bn'
              ? 'কিবলা লাইন ম্যাপ দেখতে অ্যাপ সেটিংস থেকে Google Maps চালু করুন।'
              : 'Enable Google Maps in project settings to display the interactive Kaaba geodesic map.'}
          </p>
        </div>
      )}
    </section>
  );
}
