/**
 * Renders a JSON-LD structured-data script tag.
 *
 * `<` is escaped to `<` so a stray `</script>` inside any string value
 * (e.g. a product name) can't break out of the script element — a standard
 * JSON-LD XSS hardening step.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
