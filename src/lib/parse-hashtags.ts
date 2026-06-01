/** Normalize free-text hashtags into #tag form (max 15). */
export function parseHashtags(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[\s,]+/)) {
    const tag = part
      .trim()
      .replace(/^#+/, "")
      .replace(/[^\w\u0900-\u097F-]/g, "");
    if (!tag) continue;
    const normalized = `#${tag.toLowerCase()}`;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
    if (out.length >= 15) break;
  }
  return out;
}
