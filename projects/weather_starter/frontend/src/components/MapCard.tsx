import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { useStore } from '../state/store';
import type { Location } from '../types';
import { formatTemperature } from './format';
import { CloseIcon, ExpandIcon, LocationIcon } from './icons';

const SINGAPORE_CENTER: [number, number] = [1.3521, 103.8198];
const DEFAULT_ZOOM = 11;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pinIcon(location: Location, isSelected: boolean): L.DivIcon {
  const temp = formatTemperature(location.weather?.temperature_c);
  const place =
    location.weather?.area || `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;
  const detail = location.weather?.condition || place;
  const label = escapeHtml(`${temp} · ${detail}`);
  const dotColour = isSelected ? '#0a84ff' : '#334155';

  const html = `
    <div style="position:absolute;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
      <div style="white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis;padding:2px 8px;border-radius:9999px;background:rgba(255,255,255,0.95);color:#1c2733;font:600 12px/1.25 system-ui,-apple-system,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,0.35);">${label}</div>
      <div style="width:0;height:0;margin-top:-1px;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid rgba(255,255,255,0.95);"></div>
      <div style="width:11px;height:11px;border-radius:9999px;background:${dotColour};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.45);"></div>
    </div>`;

  return L.divIcon({ html, className: '', iconSize: [0, 0], iconAnchor: [0, 0] });
}

function FitToLocations({ locations }: { locations: Location[] }) {
  const map = useMap();
  const key = useMemo(
    () =>
      locations
        .map((location) => `${location.id}:${location.latitude},${location.longitude}`)
        .join('|'),
    [locations],
  );

  useEffect(() => {
    if (locations.length === 0) {
      map.setView(SINGAPORE_CENTER, DEFAULT_ZOOM, { animate: true });
      return;
    }
    if (locations.length === 1) {
      map.setView([locations[0].latitude, locations[0].longitude], 12, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(
      locations.map((l) => [l.latitude, l.longitude] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13, animate: true });
    // key intentionally drives refit only when location coordinates change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);

  return null;
}

function LocationsMap({ className }: { className?: string }) {
  const { locations, selectedId, select } = useStore();

  return (
    <MapContainer
      center={SINGAPORE_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className={className}
      style={{ background: '#1b2735' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToLocations locations={locations} />
      {locations.map((location) => (
        <Marker
          key={location.id}
          position={[location.latitude, location.longitude]}
          icon={pinIcon(location, location.id === selectedId)}
          eventHandlers={{ click: () => select(location.id) }}
        />
      ))}
    </MapContainer>
  );
}

export function MapCard() {
  const { locations } = useStore();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  return (
    <section className="rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
          <LocationIcon className="h-3 w-3" />
          <span>Map</span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Expand map"
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 text-xs font-medium text-white/85 hover:bg-white/[0.14]"
        >
          <ExpandIcon className="h-3.5 w-3.5" />
          <span>Expand</span>
        </button>
      </div>

      {locations.length === 0 ? (
        <div className="flex h-56 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white/55">
          Add a location to see it on the map.
        </div>
      ) : (
        <LocationsMap className="h-64 w-full overflow-hidden rounded-xl" />
      )}

      {expanded &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex flex-col bg-slate-950/80 backdrop-blur-sm">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                <LocationIcon className="h-4 w-4" />
                <span>Map</span>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Close map"
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.1] px-3 py-1.5 text-xs font-medium text-white/85 hover:bg-white/[0.18]"
              >
                <CloseIcon className="h-3.5 w-3.5" />
                <span>Close</span>
              </button>
            </div>
            <div className="flex-1 px-5 pb-5">
              <LocationsMap className="h-full w-full overflow-hidden rounded-2xl" />
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}
