"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import { centerForCity } from "@/shared/lib/nepal-map-centers";

export interface MapPinPickerProps {
  city: string;
  lat?: number | null;
  lng?: number | null;
  onPick: (lat: number, lng: number) => void;
  height?: number;
}

function fixLeafletIcons(L: typeof import("leaflet")) {
  // Webpack/Next breaks default marker asset paths.

  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

export function MapPinPicker({ city, lat, lng, onPick, height = 220 }: MapPinPickerProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onPickRef = useRef(onPick);
  // Starting position is read from refs so the map doesn't re-init on every
  // lat/lng change — "Use my location" streams coords via watchPosition, and
  // tearing the map down on each tick raced invalidateSize() against remove().
  const latRef = useRef(lat);
  const lngRef = useRef(lng);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onPickRef.current = onPick;
    latRef.current = lat;
    lngRef.current = lng;
  }, [onPick, lat, lng]);

  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | null = null;

    async function init() {
      if (!containerRef.current) return;
      setReady(false);
      setError(null);

      try {
        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");
        if (cancelled || !containerRef.current) return;

        fixLeafletIcons(L);

        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
          markerRef.current = null;
        }

        const center = centerForCity(city);
        const startLat = latRef.current;
        const startLng = lngRef.current;
        const start: [number, number] =
          typeof startLat === "number" && typeof startLng === "number"
            ? [startLat, startLng]
            : center;

        map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(start, 14);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        const marker = L.marker(start, { draggable: true }).addTo(map);
        markerRef.current = marker;
        mapRef.current = map;

        const emit = (position: { lat: number; lng: number }) => {
          onPickRef.current(position.lat, position.lng);
        };

        map.on("click", (e) => {
          marker.setLatLng(e.latlng);
          emit(e.latlng);
        });

        marker.on("dragend", () => {
          emit(marker.getLatLng());
        });

        if (typeof startLat !== "number" || typeof startLng !== "number") {
          emit(marker.getLatLng());
        }

        requestAnimationFrame(() => {
          // The map may have been removed (city change / unmount) before this
          // frame runs; invalidateSize() on a torn-down map throws.
          if (cancelled || mapRef.current !== map) return;
          map?.invalidateSize();
        });
        setReady(true);
      } catch {
        if (!cancelled) setError(t("common.mapPin.loadError"));
      }
    }

    void init();

    return () => {
      cancelled = true;
      if (map) {
        map.remove();
      }
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [city]); // re-init only on city change; lat/lng updates flow through the sync effect below

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (typeof lat !== "number" || typeof lng !== "number") return;
    const pos: [number, number] = [lat, lng];
    markerRef.current.setLatLng(pos);
    mapRef.current.setView(pos, Math.max(mapRef.current.getZoom(), 15), { animate: true });
  }, [lat, lng]);

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height,
          borderRadius: "var(--r-md)",
          border: "1px solid var(--line-200)",
          overflow: "hidden",
          background: "var(--line-100)",
          // Trap Leaflet's panes/controls (z-index 200–1000) inside their own
          // stacking context. Without this the container is a plain in-flow box,
          // so those internal layers escape to the page root and paint over the
          // fixed bottom nav (z 100) and the seller drawer + backdrop (z 90/80) —
          // the map bleeding through the menu on mobile. position+z-index:0 keeps
          // the whole map below that chrome; isolation backs it up where a UA
          // ignores z-index:0 on a non-flex/grid child.
          position: "relative",
          zIndex: 0,
          isolation: "isolate",
        }}
        aria-label={t("common.mapPin.ariaLabel")}
      />
      {error && (
        <p style={{ margin: "8px 0 0", fontSize: ".8125rem", color: "var(--danger)" }}>{error}</p>
      )}
      {!error && (
        <p style={{ margin: "8px 0 0", fontSize: ".75rem", color: "var(--ink-500)" }}>
          {ready ? t("common.mapPin.hint") : t("common.mapPin.loading")}
        </p>
      )}
    </div>
  );
}
