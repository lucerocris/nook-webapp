"use client";

import {
  DAY_KEYS,
  dayLabel,
  formatTimeRange,
  getCurrentDayKey,
  isOpenNow,
  type OperatingHours,
} from "@/lib/utils/hours";
import { cn } from "@/lib/utils";
import { useNow } from "./useNow";

/** Monday-first week list. Consecutive days with the same hours share one
 * row ("Mon – Sat"), so a regular week reads in two lines instead of seven.
 * The row holding today is bold and flagged "Open now" / "Closed now". */
const WEEK = [...DAY_KEYS.slice(1), DAY_KEYS[0]];

const short = (key: (typeof DAY_KEYS)[number]) => dayLabel(key).slice(0, 3);

export default function HoursTable({ hours }: { hours: OperatingHours }) {
  const now = useNow();
  const todayKey = now ? getCurrentDayKey(now) : null;
  const openNow = now ? isOpenNow(hours, now) : null;

  if (Object.keys(hours).length === 0) {
    return <p className="text-sm text-muted">Hours not listed yet.</p>;
  }

  const rows: { days: (typeof DAY_KEYS)[number][]; text: string }[] = [];
  for (const key of WEEK) {
    const day = hours[key];
    const text = !day || day.closed ? "Closed" : formatTimeRange(day);
    const last = rows[rows.length - 1];
    if (last && last.text === text) last.days.push(key);
    else rows.push({ days: [key], text });
  }

  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(({ days, text }) => {
          const isToday = todayKey !== null && days.includes(todayKey);
          const label =
            days.length === 1 ? short(days[0]) : `${short(days[0])} – ${short(days[days.length - 1])}`;
          return (
            <tr key={days[0]} className={cn(isToday ? "font-semibold text-ink" : "text-body")}>
              <th scope="row" className="w-28 py-1.5 pr-4 text-left font-[inherit]">
                {label}
              </th>
              <td className="py-1.5">
                {text}
                {isToday && openNow !== null ? (
                  <span
                    className={cn(
                      "ml-2 text-xs font-semibold",
                      openNow ? "text-open" : "text-closed",
                    )}
                  >
                    {openNow ? "Open now" : "Closed now"}
                  </span>
                ) : null}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
