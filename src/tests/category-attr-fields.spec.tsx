import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// The "Product details" section on Add Product was redesigned around progressive
// disclosure: optional attributes start as tappable suggestion chips, not empty
// input rows. Tapping a chip reveals an inline row; removing the row sends it
// back to the chips and clears its value. Required fields are always rows.
// Custom details are a peer chip (dashed) that opens a label+value editor.
//
// These tests pin that behaviour so a future tweak to the form can't silently
// regress sellers back into the wall-of-empty-inputs it replaced.

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

import { CategoryAttrFields } from "@/features/seller/seller";

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

const chip = (name: RegExp | string) => screen.getByRole("button", { name });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CategoryAttrFields — progressive disclosure", () => {
  it("shows required fields as rows but optional fields only as suggestion chips", () => {
    setup();
    // Required field is always an editable row.
    expect(screen.getByLabelText("Made in")).toBeTruthy();
    // Optional fields are NOT input rows yet — they're suggestion chips.
    expect(screen.queryByLabelText("Material")).toBeNull();
    expect(chip("Material")).toBeTruthy();
    expect(chip("Colour")).toBeTruthy();
    expect(chip(/Custom detail/)).toBeTruthy();
  });

  it("reveals an editable row when a suggestion chip is tapped, and drops the chip", () => {
    setup();
    fireEvent.click(chip("Material"));
    // The row now exists...
    expect(screen.getByLabelText("Material")).toBeTruthy();
    // ...and the chip is gone from the suggestion row.
    expect(screen.queryByRole("button", { name: "Material" })).toBeNull();
  });

  it("removing an opened optional row returns it to chips and clears its value", () => {
    const { onChange } = setup({ material: "Cotton" });
    // A filled optional field renders as a row from the start.
    const input = screen.getByLabelText("Material") as HTMLInputElement;
    expect(input.value).toBe("Cotton");
    fireEvent.click(screen.getByRole("button", { name: "Remove Material" }));
    // Value is cleared via onChange (cleanMetadata drops it)...
    expect(onChange).toHaveBeenCalledWith(
      expect.not.objectContaining({ material: expect.anything() }),
    );
    // ...and it's offered again as a chip.
    expect(chip("Material")).toBeTruthy();
  });

  it("writes the typed value back through onChange", () => {
    const { onChange } = setup();
    fireEvent.click(chip("Material"));
    fireEvent.change(screen.getByLabelText("Material"), { target: { value: "Wool" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ material: "Wool" }));
  });

  it("renders a toggle field as a switch and flips it through onChange", () => {
    const { onChange } = setup();
    fireEvent.click(chip("Fully handmade"));
    const sw = screen.getByRole("switch", { name: "Fully handmade" });
    expect(sw.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ handmade: true }));
  });

  it("opens a label+value editor from the Custom detail chip and saves a custom key", () => {
    const { onChange } = setup();
    fireEvent.click(chip(/Custom detail/));
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

  it("keeps the section optional — surfaces the keep-scrolling reassurance", () => {
    setup();
    expect(screen.getByText(/keep scrolling/i)).toBeTruthy();
    expect(screen.getByText(/Optional/i)).toBeTruthy();
  });
});
