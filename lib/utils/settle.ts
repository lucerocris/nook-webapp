/**
 * Runs a section's fetch so that its failure stays in that section: a
 * rejection is logged and comes back as `null` instead of throwing through
 * the page. Pure (no server-only, no path aliases) so `node --test` loads it.
 */
export async function settle<T>(
  load: () => Promise<T>,
  label: string,
  log: (message: string, error: unknown) => void = console.error,
): Promise<T | null> {
  try {
    return await load();
  } catch (error) {
    log(`[${label}] failed to load`, error);
    return null;
  }
}
