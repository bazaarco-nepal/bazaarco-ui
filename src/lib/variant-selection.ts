/**
 * Grouped-variant selection rules, shared by the PDP picker and the seller's
 * grouped builder.
 *
 * A variant declares what it stands for in `optionValues` (e.g. {Black: "S"}).
 * Grouped variants carry a single pair, so groups are independent option
 * lists: the buyer picks from one group, or several at once, and each pick
 * resolves its own variant. Legacy cartesian variants (pre-grouped model)
 * declare every group and therefore only resolve when all of them are picked.
 */

export interface SelectableVariant {
  id: string;
  name: string;
  stock?: number | null;
  optionValues?: Record<string, string> | null;
}

/** Variants whose every declared option matches the buyer's picks. */
export function matchSelectedVariants<T extends SelectableVariant>(
  variants: T[],
  picks: Record<string, string>,
): T[] {
  return variants.filter((v) => {
    const pairs = Object.entries(v.optionValues ?? {});
    return pairs.length > 0 && pairs.every(([dim, val]) => picks[dim] === val);
  });
}

/** Tapping the active option unselects it; anything else selects it. */
export function toggleOption(
  picks: Record<string, string>,
  group: string,
  option: string,
): Record<string, string> {
  const next = { ...picks };
  if (next[group] === option) delete next[group];
  else next[group] = option;
  return next;
}

/**
 * Whether a variant stands behind (group = option) given the buyer's other
 * picks. Only the keys the variant itself declares constrain it — grouped
 * variants don't care what's selected in other groups, while legacy cartesian
 * variants still filter across groups.
 */
export function variantBacksOption(
  v: SelectableVariant,
  picks: Record<string, string>,
  group: string,
  option: string,
): boolean {
  if (!v.optionValues || v.optionValues[group] !== option) return false;
  return Object.entries(v.optionValues).every(
    ([dim, val]) => dim === group || !picks[dim] || picks[dim] === val,
  );
}

/**
 * One sellable row per (group, option) — never a cartesian of groups.
 * "Black: S,M,L" + "Red: S,M,XL" yields six rows (Black/S … Red/XL), not the
 * 9-row matrix of nonsense pairings like "S / S".
 */
export function groupedVariantRows(
  groups: Array<{ name: string; options: string[] }>,
): Array<{ name: string; optionValues: Record<string, string> }> {
  return groups
    .filter((g) => g.name.trim())
    .flatMap((g) =>
      g.options
        .filter((o) => o.trim())
        .map((opt) => {
          const group = g.name.trim();
          const option = opt.trim();
          return { name: `${group} / ${option}`, optionValues: { [group]: option } };
        }),
    );
}

/**
 * Full cartesian matrix: one sellable SKU for every combination of options
 * across all dimensions. "Color: Black,Blue" × "Storage: 128GB,256GB" yields the
 * four rows Black/128GB … Blue/256GB, each declaring every dimension in
 * `optionValues`. The buyer's PDP picker resolves such a variant only once every
 * dimension is chosen (see matchSelectedVariants).
 */
export function cartesianVariantRows(
  groups: Array<{ name: string; options: string[] }>,
): Array<{ name: string; optionValues: Record<string, string> }> {
  const valid = groups
    .map((g) => ({
      name: g.name.trim(),
      options: g.options.map((o) => o.trim()).filter(Boolean),
    }))
    .filter((g) => g.name && g.options.length > 0);
  if (valid.length === 0) return [];

  const combinations = valid.reduce<Array<Record<string, string>>>(
    (acc, group) =>
      acc.flatMap((combo) => group.options.map((option) => ({ ...combo, [group.name]: option }))),
    [{}],
  );

  return combinations.map((optionValues) => ({
    name: Object.entries(optionValues)
      .map(([dim, val]) => `${dim}: ${val}`)
      .join(" / "),
    optionValues,
  }));
}
