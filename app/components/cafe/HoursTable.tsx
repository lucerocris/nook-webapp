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

/** Monday-first week list. Today's row is bold and flagged "Open now" /
 * "Closed now" beside its hours. */
const WEEK = [...DAY_KEYS.slice(1), DAY_KEYS[0]];

export default function HoursTable({ hours }: { hours: OperatingHours }) {
  const now = useNow();
  const todayKey = now ? getCurrentDayKey(now) : null;
  const openNow = now ? isOpenNow(hours, now) : null;

  if (Object.keys(hours).length === 0) {
    return <p className="text-sm text-muted">Hours not listed yet.</p>;
  }

  return (
    <table className="w-full text-sm">
      <tbody>
        {WEEK.map((key) => {
          const day = hours[key];
          const isToday = key === todayKey;
          return (
            <tr key={key} className={cn(isToday ? "font-semibold text-ink" : "text-body")}>
              <th scope="row" className="w-16 py-1.5 pr-4 text-left font-[inherit]">
                {dayLabel(key).slice(0, 3)}
              </th>
              <td className="py-1.5">
                {!day || day.closed ? "Closed" : formatTimeRange(day)}
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
