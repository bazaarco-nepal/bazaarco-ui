import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// The "Specifications" section on Add Product uses progressive disclosure via a
// search-to-add box: optional attributes aren't empty input rows — they're
// suggestions you reveal by focusing/typing in the search field, then tap to add
// as an inline row. Removing the row sends it back to the suggestions and clears
// its value. Required fields are always rows. "Custom detail" sits at the bottom
// of the results and opens a label+value editor.
//
// These tests pin that behaviour so a future tweak to the form can't silently
// regress sellers back into the wall-of-empty-inputs (or the chip cloud) it replaced.

// Keep i18n's real bootstrap but echo keys so any t() calls stay stable.
vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>();
  return { ...actual, useTranslation: () => ({ t: (key: string) => key }) };
});

// seller.tsx pulls in SPA-link helpers that reach for the Next router.
vi.mock("next/navigation", () => {
  const router = { push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() };
  return {
    useRouter: () => router,
    usePathname: () => "/seller",
    useSearchParams: () => new URLSearchParams(""),
  };
});

// Feed the component a fixed category so the suggestion set is deterministic.
const HANDMADE = {
  id: "handmade",
  en: "Handmade",
  tint: "saffron",
  img: "",
  fields: [
    { k: "madeIn", en: "Made in", t: "text", req: true },
    { k: "material", en: "Material", t: "text" },
    { k: "color", en: "Colour", t: "select", o: ["Red", "Blue"] },
    { k: "handmade", en: "Fully handmade", t: "toggle" },
  ],
};

vi.mock("@/hooks/use-catalog", () => ({
  useCategories: () => ({ data: [HANDMADE] }),
  useProduct: () => ({ data: undefined }),
}));

import { CategoryAttrFields } from "@/features/seller";

// CategoryAttrFields is controlled, so a static `values` prop wouldn't update
// after onChange — but the real Add Product form holds the values in state and
// feeds them back. This host mirrors that so removing/adding rows behaves
// realistically, while still spying on every payload the component emits.
function setup(initial: Record<string, unknown> = {}) {
  const onChange = vi.fn();
  function Host() {
    const [values, setValues] = React.useState(initial);
    return (
      <CategoryAttrFields
        category="handmade"
        values={values}
        onChange={(next) => {
          onChange(next);
          setValues(next);
        }}
      />
    );
  }
  const utils = render(<Host />);
  return { onChange, ...utils };
}

// Reveal the suggestion list by focusing the search box, then a result row.
const openSearch = () => fireEvent.focusIn(screen.getByLabelText("Search a detail to add"));
const result = (name: RegExp | string) => screen.getByRole("button", { name });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CategoryAttrFields — search-to-add disclosure", () => {
  it("shows required fields as rows but optional fields only as searchable suggestions", () => {
    setup();
    // Required field is always an editable row.
    expect(screen.getByLabelText("Made in")).toBeTruthy();
    // Optional fields are neither rows nor visible suggestions until you search.
    expect(screen.queryByLabelText("Material")).toBeNull();
    expect(screen.queryByRole("button", { name: "Material" })).toBeNull();
    // Focusing the search box surfaces them as tappable results.
    openSearch();
    expect(result("Material")).toBeTruthy();
    expect(result("Colour")).toBeTruthy();
    expect(result(/Custom detail/)).toBeTruthy();
  });

  it("reveals an editable row when a suggestion is tapped, and drops it from results", () => {
    setup();
    openSearch();
    fireEvent.click(result("Material"));
    // The row now exists...
    expect(screen.getByLabelText("Material")).toBeTruthy();
    // ...and it's gone from the suggestion results (only the row textbox remains).
    expect(screen.queryByRole("button", { name: "Material" })).toBeNull();
  });

  it("removing an opened optional row returns it to suggestions and clears its value", () => {
    const { onChange } = setup({ material: "Cotton" });
    // A filled optional field renders as a row from the start.
    const input = screen.getByLabelText("Material") as HTMLInputElement;
    expect(input.value).toBe("Cotton");
    fireEvent.click(screen.getByRole("button", { name: "Remove Material" }));
    // Value is cleared via onChange (cleanMetadata drops it)...
    expect(onChange).toHaveBeenCalledWith(
      expect.not.objectContaining({ material: expect.anything() }),
    );
    // ...and it's offered again as a search result.
    openSearch();
    expect(result("Material")).toBeTruthy();
  });

  it("writes the typed value back through onChange", () => {
    const { onChange } = setup();
    openSearch();
    fireEvent.click(result("Material"));
    fireEvent.change(screen.getByLabelText("Material"), { target: { value: "Wool" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ material: "Wool" }));
  });

  it("renders a toggle field as a switch and flips it through onChange", () => {
    const { onChange } = setup();
    openSearch();
    fireEvent.click(result("Fully handmade"));
    const sw = screen.getByRole("switch", { name: "Fully handmade" });
    expect(sw.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ handmade: true }));
  });

  it("opens a label+value editor from the Custom detail result and saves a custom key", () => {
    const { onChange } = setup();
    openSearch();
    fireEvent.click(result(/Custom detail/));
    fireEvent.change(screen.getByLabelText("Custom detail name"), {
      target: { value: "Fabric origin" },
    });
    fireEvent.change(screen.getByLabelText("Custom detail value"), {
      target: { value: "Nepal" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    // Key is derived from the label (camelCase), value preserved.
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ fabricOrigin: "Nepal" }));
  });

  it("keeps the section optional — surfaces the buyer-trust reassurance", () => {
    setup();
    expect(screen.getByText(/More detail builds buyer trust/i)).toBeTruthy();
  });
});
