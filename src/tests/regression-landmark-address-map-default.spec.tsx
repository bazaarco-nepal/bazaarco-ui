import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// The component relies on the automatic JSX runtime (no `import React`), but the
// vitest transform compiles its JSX to classic `React.createElement`. Expose
// React on the global so that unqualified reference resolves during the test.
(globalThis as unknown as { React: typeof React }).React = React;

// Redesign contract for the delivery-address form (LandmarkAddress) shared by
// the checkout, navbar Deliver-to modal, profile addresses, and seller store /
// onboarding forms. The mockup ships the map VISIBLE by default with a quiet
// "Hide map / Show map" toggle, and a prominent "Use my location" button — no
// more "Drop a pin" opener. These tests pin that so the map default and the
// toggle wording don't silently regress.

// Stub the Leaflet picker so the test doesn't touch the map/network.
vi.mock("@/shared/ui/map-pin-picker", () => ({
  MapPinPicker: () => <div data-testid="map-pin-picker" />,
}));

import { LandmarkAddress } from "@/shared/ui/kit";

const baseValue = { city: "Kathmandu", area: "", landmark: "", lat: null, lng: null };

describe("LandmarkAddress map redesign", () => {
  it("shows the map by default when a city is set", () => {
    render(<LandmarkAddress value={baseValue} onChange={() => {}} />);

    expect(screen.getByTestId("map-pin-picker")).toBeInTheDocument();
    // The control is a hide toggle (map already open), not a "Drop a pin" opener.
    expect(screen.getByText("Hide map")).toBeInTheDocument();
    expect(screen.queryByText("Drop a pin")).not.toBeInTheDocument();
    expect(screen.getByText("Use my location")).toBeInTheDocument();
  });

  it("hides the map and flips the toggle label when 'Hide map' is tapped", () => {
    render(<LandmarkAddress value={baseValue} onChange={() => {}} />);

    fireEvent.click(screen.getByText("Hide map"));

    expect(screen.queryByTestId("map-pin-picker")).not.toBeInTheDocument();
    expect(screen.getByText("Show map")).toBeInTheDocument();
  });

  it("falls back to a placeholder (not the map) until a city is chosen", () => {
    render(<LandmarkAddress value={{ ...baseValue, city: "" }} onChange={() => {}} />);

    expect(screen.queryByTestId("map-pin-picker")).not.toBeInTheDocument();
    expect(screen.getByText("Select a city to load the map.")).toBeInTheDocument();
  });
});
