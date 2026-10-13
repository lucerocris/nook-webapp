/**
 * Titles and snippets as search results show them: no stray spaces from
 * the data ("Talamban , Cebu City", "Café  — Luz"), and a description cut
 * at a word near 155 characters with an ellipsis, never mid-word (UX review
 * 6.6). Pure, so `node --test` loads it.
 */

/** Collapse runs of whitespace and drop spaces before punctuation. */
export function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim();
}

/** Up to `max` characters, cut at the last word boundary, with "…". */
export function snippet(value: string, max = 155): string {
  const text = cleanText(value);
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  const base = space > max * 0.6 ? cut.slice(0, space) : cut;
  return `${base.replace(/[\s,.;:—–-]+$/, "")}…`;
}
