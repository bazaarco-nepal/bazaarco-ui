import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";

(globalThis as unknown as { React: typeof React }).React = React;

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

    expect(container.style.position).toBe("relative");
    expect(container.style.zIndex).toBe("0");
    expect(container.style.isolation).toBe("isolate");
    cleanup();
  });
});
