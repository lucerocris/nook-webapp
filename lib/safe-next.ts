/** A relative path, or "/".
 *
 * The previous string check — startsWith("/") and !startsWith("//") — was
 * defeated by a backslash: "/\evil.com" passes both, and browsers normalize
 * "\" to "/" in special-scheme URLs, so it resolves to https://evil.com.
 * Parsing against an opaque base and rejecting anything that escapes the
 * origin removes the whole class rather than patching one character.
 *
 * Lives here rather than in `app/(auth)/actions.ts` because that file is
 * "use server", where every export must be an async server action — the
 * signup-confirmation route handler needs this guard too.
 */
export function safeNext(
  next: FormDataEntryValue | string | null | undefined,
): string {
  if (typeof next !== "string" || !next) return "/";
  const base = "https://nook.invalid";
  let url: URL;
  try {
    url = new URL(next, base);
  } catch {
    return "/";
  }
  if (url.origin !== base) return "/";
  return `${url.pathname}${url.search}${url.hash}`;
}
