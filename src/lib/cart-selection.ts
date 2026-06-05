// Cart line selection — which lines the shopper wants to check out now.
//
// `null` is the "everything selected" sentinel: a fresh cart, or one that has
// never been touched, selects all lines. This keeps the common case (buy the
// whole cart) free of bookkeeping and survives the cart loading after the page
// mounts. The moment the shopper toggles anything, the selection materializes
// into an explicit id list.
//
// All helpers are pure so the Cart UI and the cart-selection tests share one
// source of truth, and the backend partial-checkout filter mirrors it exactly.

export type CartSelection = string[] | null;

interface LineLike {
  id: string;
}

/** Is a single line in the current selection? */
export function isLineSelected(id: string, selection: CartSelection): boolean {
  return selection === null || selection.includes(id);
}

/** The lines that will be priced and ordered. */
export function selectedLines<T extends LineLike>(cart: T[], selection: CartSelection): T[] {
  if (selection === null) return cart;
  return cart.filter((line) => selection.includes(line.id));
}

/** Explicit ids of the selected lines (resolves the `null` sentinel). */
export function effectiveSelectedIds(cart: LineLike[], selection: CartSelection): string[] {
  return selectedLines(cart, selection).map((line) => line.id);
}

/** Are all (and at least one) cart lines selected? Empty cart ⇒ false. */
export function allSelected(cart: LineLike[], selection: CartSelection): boolean {
  if (cart.length === 0) return false;
  return selectedLines(cart, selection).length === cart.length;
}

/** Toggle one line, returning a materialized explicit selection. */
export function toggleLine(cart: LineLike[], selection: CartSelection, id: string): string[] {
  const base = selection === null ? cart.map((line) => line.id) : selection;
  return base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
}

/** Select-all toggle: all-selected ⇒ clear; otherwise select everything. */
export function toggleAll(cart: LineLike[], selection: CartSelection): CartSelection {
  return allSelected(cart, selection) ? [] : null;
}

/**
 * Drop ids that are no longer in the cart (e.g. an item was removed). Returns
 * the same reference when nothing changed so it's safe in a store updater /
 * effect without spurious re-renders. The `null` sentinel passes through.
 */
export function pruneSelection(cart: LineLike[], selection: CartSelection): CartSelection {
  if (selection === null) return null;
  const ids = new Set(cart.map((line) => line.id));
  const pruned = selection.filter((id) => ids.has(id));
  return pruned.length === selection.length ? selection : pruned;
}

/** Add a freshly-added line to an already-materialized selection. */
export function selectLine(selection: CartSelection, id: string): CartSelection {
  if (selection === null) return null;
  return selection.includes(id) ? selection : [...selection, id];
}
