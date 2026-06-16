import { describe, it, expect } from "vitest";

import {
  cartesianVariantRows,
  groupedVariantRows,
  matchSelectedVariants,
  toggleOption,
  variantBacksOption,
  type SelectableVariant,
} from "@/lib/variant-selection";

// The motivating catalogue: Black comes in S/M/L, Red in S/M/XL. Grouped
// variants carry a single {group: option} pair each.
const blackS: SelectableVariant = {
  id: "b-s",
  name: "Black / S",
  stock: 5,
  optionValues: { Black: "S" },
};
const blackM: SelectableVariant = {
  id: "b-m",
  name: "Black / M",
  stock: 5,
  optionValues: { Black: "M" },
};
const blackL: SelectableVariant = {
  id: "b-l",
  name: "Black / L",
  stock: 0,
  optionValues: { Black: "L" },
};
const redS: SelectableVariant = {
  id: "r-s",
  name: "Red / S",
  stock: 5,
  optionValues: { Red: "S" },
};
const redM: SelectableVariant = {
  id: "r-m",
  name: "Red / M",
  stock: 5,
  optionValues: { Red: "M" },
};
const redXl: SelectableVariant = {
  id: "r-xl",
  name: "Red / XL",
  stock: 5,
  optionValues: { Red: "XL" },
};
const grouped: SelectableVariant[] = [blackS, blackM, blackL, redS, redM, redXl];

// Pre-grouped (cartesian) data still in the wild: every variant declares
// every group.
const legacySS: SelectableVariant = {
  id: "ss",
  name: "S / S",
  stock: 5,
  optionValues: { Black: "S", Red: "S" },
};
const legacySM: SelectableVariant = {
  id: "sm",
  name: "S / M",
  stock: 5,
  optionValues: { Black: "S", Red: "M" },
};
const legacyMS: SelectableVariant = {
  id: "ms",
  name: "M / S",
  stock: 0,
  optionValues: { Black: "M", Red: "S" },
};
const legacy: SelectableVariant[] = [legacySS, legacySM, legacyMS];

describe("matchSelectedVariants", () => {
  it("selects nothing until the buyer picks", () => {
    expect(matchSelectedVariants(grouped, {})).toEqual([]);
  });

  it("a pick in one group selects that group's variant only — no other group is forced", () => {
    const sel = matchSelectedVariants(grouped, { Black: "S" });
    expect(sel.map((v) => v.id)).toEqual(["b-s"]);
  });

  it("picks in two groups select one variant per group", () => {
    const sel = matchSelectedVariants(grouped, { Black: "S", Red: "M" });
    expect(sel.map((v) => v.id)).toEqual(["b-s", "r-m"]);
  });

  it("ignores variants without optionValues", () => {
    const flat: SelectableVariant[] = [{ id: "x", name: "Large", optionValues: null }];
    expect(matchSelectedVariants(flat, { Black: "S" })).toEqual([]);
  });

  it("legacy cartesian variants resolve only when every group is picked", () => {
    expect(matchSelectedVariants(legacy, { Black: "S" })).toEqual([]);
    const sel = matchSelectedVariants(legacy, { Black: "S", Red: "M" });
    expect(sel.map((v) => v.id)).toEqual(["sm"]);
  });
});

describe("toggleOption", () => {
  it("selects an option", () => {
    expect(toggleOption({}, "Black", "S")).toEqual({ Black: "S" });
  });

  it("re-tapping the active option unselects it", () => {
    expect(toggleOption({ Black: "S" }, "Black", "S")).toEqual({});
  });

  it("switches within a group and leaves other groups alone", () => {
    expect(toggleOption({ Black: "S", Red: "M" }, "Black", "L")).toEqual({
      Black: "L",
      Red: "M",
    });
  });

  it("never mutates the previous picks", () => {
    const prev = { Black: "S" };
    toggleOption(prev, "Black", "S");
    expect(prev).toEqual({ Black: "S" });
  });
});

describe("variantBacksOption", () => {
  it("grouped variants ignore what's selected in other groups", () => {
    // Black/S is picked; Red XL must stay available.
    expect(variantBacksOption(redXl, { Black: "S" }, "Red", "XL")).toBe(true);
  });

  it("legacy cartesian variants still filter across groups", () => {
    // Black=M picked: only rows with Black=M can back Red options.
    expect(variantBacksOption(legacySS, { Black: "M" }, "Red", "S")).toBe(false);
    expect(variantBacksOption(legacyMS, { Black: "M" }, "Red", "S")).toBe(true);
  });

  it("requires the variant to carry the probed option", () => {
    expect(variantBacksOption(blackS, {}, "Black", "M")).toBe(false);
  });
});

describe("groupedVariantRows", () => {
  it("builds one row per (group, option), never the cartesian of groups", () => {
    const rows = groupedVariantRows([
      { name: "Black", options: ["S", "M", "L"] },
      { name: "Red", options: ["S", "M", "XL"] },
    ]);
    expect(rows).toHaveLength(6); // not 9
    expect(rows.map((r) => r.name)).toEqual([
      "Black / S",
      "Black / M",
      "Black / L",
      "Red / S",
      "Red / M",
      "Red / XL",
    ]);
    expect(rows.map((r) => r.optionValues)).toEqual([
      { Black: "S" },
      { Black: "M" },
      { Black: "L" },
      { Red: "S" },
      { Red: "M" },
      { Red: "XL" },
    ]);
  });

  it("skips unnamed groups and blank options, trimming the rest", () => {
    const rows = groupedVariantRows([
      { name: "  ", options: ["S"] },
      { name: " Black ", options: [" S ", "", "M"] },
    ]);
    expect(rows.map((r) => r.name)).toEqual(["Black / S", "Black / M"]);
    expect(rows.map((r) => r.optionValues)).toEqual([{ Black: "S" }, { Black: "M" }]);
  });
});

describe("cartesianVariantRows", () => {
  it("builds one SKU per combination across all dimensions", () => {
    const rows = cartesianVariantRows([
      { name: "Color", options: ["Black", "Blue"] },
      { name: "Storage", options: ["128GB", "256GB"] },
    ]);
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => r.name)).toEqual([
      "Color: Black / Storage: 128GB",
      "Color: Black / Storage: 256GB",
      "Color: Blue / Storage: 128GB",
      "Color: Blue / Storage: 256GB",
    ]);
    expect(rows[0]?.optionValues).toEqual({ Color: "Black", Storage: "128GB" });
    expect(rows[3]?.optionValues).toEqual({ Color: "Blue", Storage: "256GB" });
  });

  it("trims, drops empty dimensions, and returns [] when nothing is valid", () => {
    expect(cartesianVariantRows([{ name: " Color ", options: [" Red ", ""] }])).toEqual([
      { name: "Color: Red", optionValues: { Color: "Red" } },
    ]);
    expect(cartesianVariantRows([{ name: "", options: ["X"] }])).toEqual([]);
  });
});
