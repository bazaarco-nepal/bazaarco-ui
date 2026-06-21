import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";

// The component relies on the automatic JSX runtime (no `import React`), but the
// vitest transform compiles its JSX to classic `React.createElement`. Expose
// React on the global so that unqualified reference resolves during the test.
(globalThis as unknown as { React: typeof React }).React = React;

// REGRESSION: "Cannot read properties of undefined (reading '_leaflet_pos')".
//
// MapPinPicker used to re-initialize the Leaflet map on every [city, lat, lng]
// change. "Use my location" streams coordinates via watchPosition (plus a
// reverse-geocode follow-up), so each GPS tick tore the map down and rebuilt
// it. Each init scheduled requestAnimationFrame(() => map.invalidateSize());
// when the next tick's cleanup called map.remove() before that frame ran,
// invalidateSize() executed on a removed map whose _mapPane was gone → throw.
//
// The fix: init only depends on [city]; lat/lng updates flow through the marker
// setLatLng / map setView sync effect instead of rebuilding the map. The rAF
// callback also bails if the map was torn down before it fired.
//
// These tests pin that contract: lat/lng changes must NOT create a new map, but
// must move the existing marker/view; a city change MUST re-init.

const created: Array<{
  setView: ReturnType<typeof vi.fn>;
  invalidateSize: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
}> = [];
const markerSetLatLng = vi.fn();

vi.mock("leaflet/dist/leaflet.css", () => ({}));

vi.mock("leaflet", () => {
  const makeMarker = () => {
    const marker: Record<string, unknown> = {};
    marker.addTo = vi.fn(() => marker);
    marker.on = vi.fn(() => marker);
    marker.setLatLng = markerSetLatLng;
    marker.getLatLng = vi.fn(() => ({ lat: 27.7, lng: 85.3 }));
    return marker;
  };
  const makeMap = () => {
    const map: Record<string, unknown> = {};
    map.setView = vi.fn(() => map);
    map.on = vi.fn(() => map);
    map.invalidateSize = vi.fn();
    map.remove = vi.fn();
    map.getZoom = vi.fn(() => 14);
    created.push({
      setView: map.setView as ReturnType<typeof vi.fn>,
      invalidateSize: map.invalidateSize as ReturnType<typeof vi.fn>,
      remove: map.remove as ReturnType<typeof vi.fn>,
    });
    return map;
  };
  const L = {
    map: vi.fn(() => makeMap()),
    marker: vi.fn(() => makeMarker()),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } },
  };
  return { default: L };
});

import { MapPinPicker } from "@/shared/ui/map-pin-picker";

beforeEach(() => {
  created.length = 0;
  markerSetLatLng.mockClear();
});

describe("MapPinPicker re-init contract", () => {
  it("does not rebuild the map when only lat/lng change (the watchPosition stream)", async () => {
    const onPick = vi.fn();
    const { rerender } = render(
      <MapPinPicker city="Kathmandu" lat={27.7} lng={85.3} onPick={onPick} />,
    );
    await waitFor(() => expect(created).toHaveLength(1));

    // Simulate successive GPS fixes arriving as prop updates.
    rerender(<MapPinPicker city="Kathmandu" lat={27.71} lng={85.31} onPick={onPick} />);
    rerender(<MapPinPicker city="Kathmandu" lat={27.72} lng={85.32} onPick={onPick} />);

    // Map must NOT have been recreated, and the original must NOT be removed.
    await waitFor(() => expect(markerSetLatLng).toHaveBeenCalled());
    expect(created).toHaveLength(1);
    expect(created[0]!.remove).not.toHaveBeenCalled();
    expect(created[0]!.setView).toHaveBeenCalled(); // view followed the new pin
    cleanup();
  });

  it("re-initializes the map when the city changes", async () => {
    const onPick = vi.fn();
    const { rerender } = render(
      <MapPinPicker city="Kathmandu" lat={27.7} lng={85.3} onPick={onPick} />,
    );
    await waitFor(() => expect(created).toHaveLength(1));

    rerender(<MapPinPicker city="Pokhara" lat={27.7} lng={85.3} onPick={onPick} />);

    await waitFor(() => expect(created).toHaveLength(2));
    expect(created[0]!.remove).toHaveBeenCalled(); // old map torn down
    cleanup();
  });
});
