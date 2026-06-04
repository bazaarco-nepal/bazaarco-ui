"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import { centerForCity } from "@/lib/nepal-map-centers";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onPickRef = useRef(onPick);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

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
        const start: [number, number] =
          typeof lat === "number" && typeof lng === "number" ? [lat, lng] : center;

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

        if (typeof lat !== "number" || typeof lng !== "number") {
          emit(marker.getLatLng());
        }

        requestAnimationFrame(() => {
          map?.invalidateSize();
        });
        setReady(true);
      } catch {
        if (!cancelled) setError("Map could not load. Check your connection and try again.");
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
  }, [city, lat, lng]); // re-init when the requested starting point changes

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
        }}
        aria-label="Map — tap to place your delivery pin"
      />
      {error && (
        <p style={{ margin: "8px 0 0", fontSize: ".8125rem", color: "var(--danger)" }}>{error}</p>
      )}
      {!error && (
        <p style={{ margin: "8px 0 0", fontSize: ".75rem", color: "var(--ink-500)" }}>
          {ready ? "Tap the map or drag the pin to mark your exact spot." : "Loading map…"}
        </p>
      )}
    </div>
  );
}
