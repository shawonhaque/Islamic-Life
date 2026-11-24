import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import type { Mosque } from '../utils/mosqueData';

interface MosqueMapProps {
  center: { lat: number; lng: number };
  userPosition: { lat: number; lng: number } | null;
  mosques: Mosque[];
  focusId: string | null;
  focusToken: number;
  onBoundsChanged: () => void;
  onSelect: (id: string) => void;
  onReady: (api: MosqueMapApi) => void;
}

export interface MosqueMapApi {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  openPopup: (id: string) => void;
  recenter: () => void;
  getCenter: () => { lat: number; lng: number };
}

const CLUSTER_STYLE = `
.mosque-cluster {
  background: #8B6F47;
  color: #fff;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  border: 3px solid rgba(255,255,255,0.85);
  box-shadow: 0 2px 8px rgba(24,48,39,0.35);
}
.mosque-cluster span { line-height: 1; }
.user-dot {
  width: 14px; height: 14px; border-radius: 9999px;
  background: #2563eb; border: 2px solid #fff;
  box-shadow: 0 0 0 0 rgba(37,99,235,0.6);
  animation: userPulse 2s infinite;
}
@keyframes userPulse {
  0%   { box-shadow: 0 0 0 0 rgba(37,99,235,0.55); }
  70%  { box-shadow: 0 0 0 14px rgba(37,99,235,0); }
  100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
}
.mosque-pin { color: #8B6F47; }
`;

function pinIcon(active: boolean): L.DivIcon {
  const size = active ? 34 : 28;
  return L.divIcon({
    className: '',
    html: `<svg class="mosque-pin" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>
    </svg>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

export function MosqueMap({
  center,
  userPosition,
  mosques,
  focusId,
  focusToken,
  onBoundsChanged,
  onSelect,
  onReady,
}: MosqueMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const skipNextMoveRef = useRef(false);
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const style = document.createElement('style');
    style.textContent = CLUSTER_STYLE;
    document.head.appendChild(style);

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const clusters = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 60,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count < 10 ? 36 : count < 100 ? 44 : 52;
        return L.divIcon({
          html: `<div class="mosque-cluster" style="width:${size}px;height:${size}px"><span>${count}</span></div>`,
          className: '',
          iconSize: [size, size],
        });
      },
    });
    clusterRef.current = clusters;
    map.addLayer(clusters);

    const notifyBounds = () => {
      if (skipNextMoveRef.current) {
        skipNextMoveRef.current = false;
        return;
      }
      onBoundsChanged();
    };
    map.on('moveend', notifyBounds);

    onReady({
      flyTo: (lat, lng, zoom = 16) => {
        skipNextMoveRef.current = true;
        map.flyTo([lat, lng], zoom, { duration: 0.8 });
      },
      openPopup: (id) => {
        const marker = markersRef.current.get(id);
        if (marker && clusterRef.current) {
          clusterRef.current.zoomToShowLayer(marker, () => marker.openPopup());
        }
      },
      recenter: () => {
        if (userPosition) {
          skipNextMoveRef.current = true;
          map.flyTo([userPosition.lat, userPosition.lng], 14, { duration: 0.8 });
        }
      },
      getCenter: () => {
        const c = map.getCenter();
        return { lat: c.lat, lng: c.lng };
      },
    });

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      style.remove();
    };
    // The map is created once; later prop changes are handled by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center.lat, center.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    if (!userPosition) return;
    userMarkerRef.current = L.marker([userPosition.lat, userPosition.lng], {
      icon: L.divIcon({ className: '', html: '<div class="user-dot"></div>', iconSize: [14, 14] }),
      interactive: false,
      zIndexOffset: 1000,
    }).addTo(map);
  }, [userPosition]);

  useEffect(() => {
    const clusters = clusterRef.current;
    const map = mapRef.current;
    if (!clusters || !map) return;
    clusters.clearLayers();
    markersRef.current.clear();

    mosques.forEach((m) => {
      const marker = L.marker([m.lat, m.lng], { icon: pinIcon(false) });
      marker.bindPopup(
        `<strong>${escapeHtml(m.name)}</strong><br/><span style="color:#5a7066">${escapeHtml(m.address)}</span>${
          m.jummahTime ? `<br/>Jumu'ah: ${escapeHtml(m.jummahTime)}` : ''
        }`,
      );
      marker.on('click', () => onSelect(m.id));
      markersRef.current.set(m.id, marker);
      clusters.addLayer(marker);
    });

    // A phone-sized viewport at the default zoom only covers a few kilometres,
    // so markers placed across a city would sit off-screen with nothing visible.
    // Fit the group once, but never fight the user after they start panning.
    if (mosques.length > 0 && !hasFittedRef.current) {
      const bounds = L.latLngBounds(mosques.map((m) => [m.lat, m.lng] as [number, number]));
      skipNextMoveRef.current = true;
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      hasFittedRef.current = true;
    }
  }, [mosques, onSelect]);

  // Highlighting is applied by swapping the icon only. Rebuilding the markers on
  // every selection would tear down the popup that the click just opened.
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      marker.setIcon(pinIcon(id === focusId));
    });
  }, [focusId, mosques]);

  useEffect(() => {
    const clusters = clusterRef.current;
    const map = mapRef.current;
    if (!clusters || !map || !focusId) return;
    const marker = markersRef.current.get(focusId);
    if (!marker) return;

    skipNextMoveRef.current = true;
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 16), { duration: 0.6 });

    // flyTo animates, so wait for the view to settle before asking the cluster
    // layer to reveal the marker; opening during the animation silently no-ops.
    const timer = setTimeout(() => {
      if (clusters.getVisibleParent(marker) === marker) marker.openPopup();
      else clusters.zoomToShowLayer(marker, () => marker.openPopup());
    }, 700);
    return () => clearTimeout(timer);
    // focusToken makes a repeated click on the same card fly again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusToken]);

  return <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" />;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}
