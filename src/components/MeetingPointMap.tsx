import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

type LatLng = { lat: number; lng: number };

export function parseMeetingPointFromFormFields(latRaw: string, lngRaw: string): LatLng | null {
  const latS = String(latRaw ?? '')
    .trim()
    .replace(',', '.');
  const lngS = String(lngRaw ?? '')
    .trim()
    .replace(',', '.');
  if (!latS || !lngS) return null;
  const lat = Number(latS);
  const lng = Number(lngS);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function safeLatLngOrNull(input: LatLng | null | undefined): LatLng | null {
  if (!input) return null;
  return parseMeetingPointFromFormFields(String(input.lat), String(input.lng));
}

type TileReady = 'loading' | 'ok' | 'failed';

type TileProvider = {
  url: string;
  subdomains?: string | string[];
  attribution: string;
  maxZoom?: number;
  maxNativeZoom?: number;
};

function buildTileProviders(): TileProvider[] {
  const dev: TileProvider[] =
    import.meta.env.DEV
      ? [
          {
            url: `${typeof window !== 'undefined' ? window.location.origin : ''}/map-tiles/osm/{z}/{x}/{y}.png`,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> (proxy local)',
            maxZoom: 19,
            maxNativeZoom: 19,
          },
        ]
      : [];

  const rest: TileProvider[] = [
    {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      subdomains: 'abcd',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20,
      maxNativeZoom: 20,
    },
    {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      maxNativeZoom: 19,
    },
    {
      url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; Wikimedia maps',
      maxZoom: 19,
      maxNativeZoom: 19,
    },
    {
      url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
      maxZoom: 17,
      maxNativeZoom: 17,
    },
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, GIS Community',
      maxZoom: 19,
      maxNativeZoom: 19,
    },
    {
      url: 'https://tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap &copy; <a href="https://github.com/cyclosm/cyclosm-cartocss-style">CyclOSM</a>',
      maxZoom: 20,
      maxNativeZoom: 20,
    },
  ];

  return [...dev, ...rest];
}

const TILE_PROVIDERS = buildTileProviders();

/** Marcador embebido (sin PNG del paquete leaflet). */
function createMeetingPointIcon(): L.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 48" width="36" height="48"><path fill="#15803d" stroke="#14532d" stroke-width="1" d="M18 2C10.82 2 5 7.48 5 14.2c0 8.9 11.2 22.5 12.35 23.86a1.5 1.5 0 002.3 0C20.8 36.7 31 23.1 31 14.2 31 7.48 25.18 2 18 2z"/><circle cx="18" cy="14" r="5" fill="#fff"/></svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -44],
  });
}

const meetingPointIcon = createMeetingPointIcon();

function Recenter({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    const lat = Number(center.lat);
    const lng = Number(center.lng);
    const z = Number(zoom);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(z)) return;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
    const zClamped = Math.min(Math.max(Math.round(z), 1), 22);

    let cancelled = false;
    const apply = () => {
      if (cancelled) return;
      try {
        map.setView([lat, lng], zClamped, { animate: false });
      } catch {
        // Mapa desmontado, contenedor no listo o Leaflet en transición (p. ej. Strict Mode / modal).
      }
    };

    const id = requestAnimationFrame(apply);
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [map, center.lat, center.lng, zoom]);
  return null;
}

function ClickToSet({ enabled, onPick }: { enabled: boolean; onPick: (pos: LatLng) => void }) {
  useMapEvents({
    click: (e) => {
      if (!enabled) return;
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function MapInvalidateSize() {
  const map = useMap();

  useEffect(() => {
    const run = () => {
      try {
        map.invalidateSize({ animate: false });
      } catch {
        /* mapa ya destruido */
      }
    };

    run();
    const raf = requestAnimationFrame(run);
    const t1 = window.setTimeout(run, 120);
    const t2 = window.setTimeout(run, 320);

    const el = map.getContainer();
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(run);
      ro.observe(el);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro?.disconnect();
    };
  }, [map]);

  return null;
}

/** Capa raster con Leaflet directo; cambia de proveedor si las teselas no cargan. */
function AdaptiveRasterTiles({
  onTileReadyChange,
}: {
  onTileReadyChange: (status: TileReady, providerIndex: number) => void;
}) {
  const map = useMap();
  const [providerIndex, setProviderIndex] = useState(0);

  const cbRef = useRef(onTileReadyChange);
  cbRef.current = onTileReadyChange;

  useEffect(() => {
    const spec = TILE_PROVIDERS[providerIndex];
    if (!spec) {
      cbRef.current('failed', TILE_PROVIDERS.length - 1);
      return;
    }

    cbRef.current('loading', providerIndex);

    const layer = L.tileLayer(spec.url, {
      attribution: spec.attribution,
      subdomains: spec.subdomains as L.TileLayerOptions['subdomains'],
      maxZoom: spec.maxZoom ?? 19,
      maxNativeZoom: spec.maxNativeZoom ?? spec.maxZoom ?? 19,
    });

    layer.addTo(map);

    let loads = 0;
    let advanced = false;

    const advance = () => {
      if (advanced) return;
      advanced = true;
      if (providerIndex < TILE_PROVIDERS.length - 1) {
        setProviderIndex((i) => i + 1);
      } else {
        cbRef.current('failed', providerIndex);
      }
    };

    const onLoad = () => {
      loads += 1;
      if (loads >= 1) {
        advanced = true;
        cbRef.current('ok', providerIndex);
      }
    };

    let errStreak = 0;
    const onErr = () => {
      errStreak += 1;
      if (errStreak >= 18 && loads === 0) advance();
    };

    layer.on('tileload', onLoad);
    layer.on('tileerror', onErr);

    const t = window.setTimeout(() => {
      if (loads === 0) advance();
    }, 6500);

    return () => {
      window.clearTimeout(t);
      layer.off('tileload', onLoad);
      layer.off('tileerror', onErr);
      map.removeLayer(layer);
    };
  }, [map, providerIndex]);

  return null;
}

export function MeetingPointMap({
  value,
  onChange,
  interactive = false,
  heightClassName = 'h-64',
  /** Para enlazar a Google Maps si no hay coordenadas aún. */
  mapsSearchQuery,
}: {
  value: LatLng | null;
  onChange?: (next: LatLng) => void;
  interactive?: boolean;
  heightClassName?: string;
  mapsSearchQuery?: string | null;
}) {
  const defaultCenter = useMemo<LatLng>(() => ({ lat: 6.244203, lng: -75.581211 }), []);
  const pin = safeLatLngOrNull(value);
  const center = pin ?? defaultCenter;
  const zoom = pin ? 16 : 13;

  const [tileReady, setTileReady] = useState<TileReady>('loading');
  const [tileProviderIdx, setTileProviderIdx] = useState(0);

  const onTileReadyChange = useCallback((status: TileReady, idx: number) => {
    setTileReady(status);
    setTileProviderIdx(idx);
  }, []);

  const googleMapsHref = useMemo(() => {
    if (pin && Number.isFinite(pin.lat) && Number.isFinite(pin.lng)) {
      return `https://www.google.com/maps?q=${pin.lat},${pin.lng}&z=17&hl=es`;
    }
    const q = (mapsSearchQuery || '').trim();
    if (q) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}&hl=es`;
    }
    return `https://www.google.com/maps?q=${center.lat},${center.lng}&z=13&hl=es`;
  }, [pin, mapsSearchQuery, center.lat, center.lng]);

  return (
    <div className={`relative w-full overflow-hidden rounded-xl border border-green-200 bg-white ${heightClassName}`}>
      {tileReady === 'loading' ? (
        <div className="pointer-events-none absolute inset-x-0 top-2 z-[500] flex justify-center px-2">
          <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-gray-800 shadow-md ring-1 ring-gray-200">
            Cargando calles… {tileProviderIdx + 1}/{TILE_PROVIDERS.length}
          </span>
        </div>
      ) : null}

      {tileReady === 'failed' ? (
        <div className="pointer-events-none absolute bottom-2 left-2 right-2 z-[500] rounded-lg border border-amber-200 bg-amber-50/95 px-2 py-2 text-center text-[11px] leading-snug text-amber-950 shadow-md sm:text-xs">
          No cargaron mapas desde internet (firewall, empresa u operador). Puedes{' '}
          <a
            className="pointer-events-auto font-semibold text-green-800 underline decoration-green-700 underline-offset-2"
            href={googleMapsHref}
            target="_blank"
            rel="noreferrer"
          >
            abrir Google Maps
          </a>{' '}
          y copiar latitud y longitud en los campos de abajo. El mapa vacío sigue aceptando clics (coordenadas aproximadas).
        </div>
      ) : null}

      <MapContainer center={center} zoom={zoom} className="h-full w-full" scrollWheelZoom>
        <AdaptiveRasterTiles onTileReadyChange={onTileReadyChange} />
        <MapInvalidateSize />
        <Recenter center={center} zoom={zoom} />
        {interactive && onChange ? <ClickToSet enabled={interactive} onPick={onChange} /> : null}
        {pin ? <Marker position={pin} icon={meetingPointIcon} /> : null}
      </MapContainer>
    </div>
  );
}
