import React from "react";
import { it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

// The store directory (/stores) lists every seller, searchable by shop name or
// city, sortable, with zero-review stores hiding their star row. These tests pin
// that behaviour and the "no match" state.

vi.mock("next/navigation", () => {
  const router = { push: vi.fn(), replace: vi.fn() };
  return {
    useRouter: () => router,
    usePathname: () => "/stores",
    useSearchParams: () => new URLSearchParams(""),
  };
});

const SELLERS = [
  {
    id: "s1",
    name: "Himalayan Threads",
    rating: 4.8,
    reviews: 120,
    city: "Kathmandu",
    tint: "red",
    avatar: "",
  },
  {
    id: "s2",
    name: "Pokhara Crafts",
    rating: 4.2,
    reviews: 40,
    city: "Pokhara",
    tint: "blue",
    avatar: "",
  },
  {
    id: "s3",
    name: "Everest Gadgets",
    rating: 4.9,
    reviews: 300,
    city: "Kathmandu",
    tint: "green",
    avatar: "",
  },
  // A brand-new store with no reviews — must NOT show empty stars.
  {
    id: "s4",
    name: "Bhimsen Naturals",
    rating: 0,
    reviews: 0,
    city: "Lalitpur",
    tint: "gold",
    avatar: "",
  },
];

const useSellersMock = vi.fn(() => ({
  data: SELLERS,
  isLoading: false,
  isError: false,
  error: null,
}));

vi.mock("@/hooks/use-catalog", () => ({
  useSellers: () => useSellersMock(),
}));

import { BazaarCtx } from "@/components/common";
import { Stores } from "@/features/stores/stores";

const openStore = vi.fn();

function Harness() {
  const value = { openStore } as unknown as React.ContextType<typeof BazaarCtx>;
  return (
    <BazaarCtx.Provider value={value}>
      <Stores />
    </BazaarCtx.Provider>
  );
}

beforeEach(() => {
  openStore.mockClear();
  useSellersMock.mockReturnValue({ data: SELLERS, isLoading: false, isError: false, error: null });
});

function searchBox() {
  return screen.getByLabelText("Search stores") as HTMLInputElement;
}

const NAME_RE = /Himalayan Threads|Pokhara Crafts|Everest Gadgets|Bhimsen Naturals/;

it("lists every seller by default, best-rated first", () => {
  render(<Harness />);
  expect(screen.getByText("4 stores")).toBeInTheDocument();
  const cards = screen.getAllByText(NAME_RE);
  // Highest rating (Everest 4.9) should render before the others.
  expect(cards[0]).toHaveTextContent("Everest Gadgets");
});

it("hides the star row for a zero-review store and shows 'No reviews yet'", () => {
  render(<Harness />);
  // Exactly one store (Bhimsen) has no reviews.
  expect(screen.getAllByText("No reviews yet")).toHaveLength(1);
  // The reviewed stores still surface their score.
  expect(screen.getByText("4.9")).toBeInTheDocument();
});

it("sorts by name A–Z when chosen", () => {
  render(<Harness />);
  fireEvent.change(screen.getByLabelText("Sort stores"), { target: { value: "az" } });
  const cards = screen.getAllByText(NAME_RE);
  expect(cards[0]).toHaveTextContent("Bhimsen Naturals");
  expect(cards[cards.length - 1]).toHaveTextContent("Pokhara Crafts");
});

it("filters by shop name", () => {
  render(<Harness />);
  fireEvent.change(searchBox(), { target: { value: "pokhara crafts" } });
  expect(screen.getByText("1 store")).toBeInTheDocument();
  expect(screen.getByText("Pokhara Crafts")).toBeInTheDocument();
  expect(screen.queryByText("Everest Gadgets")).not.toBeInTheDocument();
});

it("filters by city (case-insensitive), matching multiple stores", () => {
  render(<Harness />);
  fireEvent.change(searchBox(), { target: { value: "KATHMANDU" } });
  expect(screen.getByText("2 stores")).toBeInTheDocument();
  expect(screen.getByText("Himalayan Threads")).toBeInTheDocument();
  expect(screen.getByText("Everest Gadgets")).toBeInTheDocument();
  expect(screen.queryByText("Pokhara Crafts")).not.toBeInTheDocument();
});

it("shows an empty state when nothing matches", () => {
  render(<Harness />);
  fireEvent.change(searchBox(), { target: { value: "zzz no such store" } });
  expect(screen.getByText("No stores match your search")).toBeInTheDocument();
});

it("clicking a store opens that store by id", () => {
  render(<Harness />);
  const card = screen.getByText("Pokhara Crafts").closest("a") as HTMLAnchorElement;
  expect(card).toHaveAttribute("href", "/store/s2");
  fireEvent.click(within(card).getByText("Pokhara Crafts"));
  expect(openStore).toHaveBeenCalledWith("s2");
});

it("gives every card a store-specific accessible name", () => {
  render(<Harness />);
  // Each card is one link with an aria-label tied to its store, so screen
  // readers announce which shop they're about to visit.
  expect(screen.getByLabelText("Visit Pokhara Crafts store")).toHaveAttribute("href", "/store/s2");
  expect(screen.getByLabelText("Visit Bhimsen Naturals store")).toBeInTheDocument();
});

it("renders one identical CTA on every card, regardless of review state", () => {
  render(<Harness />);
  // Same single "Visit store" affordance on the reviewed and the zero-review
  // stores alike — no card is emphasised over another.
  const ctas = screen.getAllByText("Visit store");
  expect(ctas).toHaveLength(SELLERS.length);
  ctas.forEach((cta) => expect(cta).toHaveClass("bz-store-card__cta"));
});
