import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";

// The component relies on the automatic JSX runtime (no `import React`), but the
// vitest transform compiles its JSX to classic `React.createElement`. Expose
// React on the global so the unqualified reference resolves during the test.
(globalThis as unknown as { React: typeof React }).React = React;

// REGRESSION: Leaflet map bleeding over the mobile chrome.
//
// The map container was a plain in-flow box, so Leaflet's own panes/controls
// (z-index 200–1000) escaped to the page root and painted OVER the fixed bottom
// nav (z 100) and the seller drawer + backdrop (z 90/80) — the tiles and pin
// showing through "My products" / "Messages" with the drawer open, and a
// half-cut map strip wedged behind the bottom-nav icons.
//
// The fix gives the container its OWN stacking context (position + z-index:0,
// isolation) so those internal layers can never climb above the chrome. This
// test pins that contract at the component boundary — it's the cheapest way to
// catch someone accidentally stripping the trap later.

vi.mock("leaflet/dist/leaflet.css", () => ({}));

vi.mock("leaflet", () => {
  const marker: Record<string, unknown> = {
    addTo: vi.fn(() => marker),
    on: vi.fn(() => marker),
    setLatLng: vi.fn(),
    getLatLng: vi.fn(() => ({ lat: 27.7, lng: 85.3 })),
  };
  const map: Record<string, unknown> = {
    setView: vi.fn(() => map),
    on: vi.fn(() => map),
    invalidateSize: vi.fn(),
    remove: vi.fn(),
    getZoom: vi.fn(() => 14),
  };
  const L = {
    map: vi.fn(() => map),
    marker: vi.fn(() => marker),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } },
  };
  return { default: L };
});

import { MapPinPicker } from "@/components/ui/map-pin-picker";

describe("MapPinPicker stacking context", () => {
  it("traps Leaflet's z-index inside its own stacking context", async () => {
    const { getByLabelText } = render(
      <MapPinPicker city="Kathmandu" lat={27.7} lng={85.3} onPick={vi.fn()} />,
    );
    const container = getByLabelText("Map — tap to place your delivery pin") as HTMLElement;
    await waitFor(() => expect(container).toBeTruthy());

    // position + z-index:0 establishes the stacking context and keeps the map
    // below the fixed chrome; isolation:isolate is the belt-and-suspenders.
    expect(container.style.position).toBe("relative");
    expect(container.style.zIndex).toBe("0");
    expect(container.style.isolation).toBe("isolate");
    cleanup();
  });
});
