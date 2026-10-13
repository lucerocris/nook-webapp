const dayFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "Asia/Manila",
});

/** The visit's day, "Oct 9, 2026": a bare date is that day (read at noon
 * Manila time so no time zone moves it), a timestamp is its day in the
 * Philippines. Same output on the server and in the browser. */
export function visitDay(visitedAt: string): string {
  if (!visitedAt) return "";
  const at = /^\d{4}-\d{2}-\d{2}$/.test(visitedAt)
    ? new Date(`${visitedAt}T12:00:00+08:00`)
    : new Date(visitedAt);
  return Number.isNaN(at.getTime()) ? "" : dayFormat.format(at);
}
