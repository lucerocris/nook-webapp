"use client";

import { useNow } from "./useNow";
import { getOpenStatus, minutesUntilClose, type OperatingHours } from "@/lib/utils/hours";
import { cn } from "@/lib/utils";

function formatLeft(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 || h >= 3 ? `${h} h` : `${h} h ${m} min`;
}

/**
 * Whether you can go now, under the name: "Open · until 10:00 PM", with an
 * amber "Closing soon · 40 min left" added only in the last hour;
 * "Closed · opens 10:00 AM" otherwise. Nothing time-dependent renders until mount (see useNow).
 */
export default function StatusLine({ hours }: { hours: OperatingHours }) {
  const now = useNow();
  if (!now) return <span className="inline-block h-6" aria-hidden>&nbsp;</span>;

  const status = getOpenStatus(hours, now);
  if (!status) return <span className="text-muted">Hours not listed yet</span>;

  if (!status.isOpen) {
    return (
      <span>
        <span className="font-semibold text-closed">Closed</span>
        {status.detail ? <span className="text-body"> · {status.detail}</span> : null}
      </span>
    );
  }

  const left = minutesUntilClose(hours, now);
  const soon = left !== null && left <= 60;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span>
        <span className="font-semibold text-open">Open</span>
        <span className="text-body"> · {status.detail}</span>
      </span>
      {/* Only in the last hour: the time left is news then; before that it
          would just restate "until 10:00 PM". */}
      {left !== null && soon ? (
        <span
          className={cn(
            "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium tabular-nums",
            soon ? "bg-closing-dot/15 text-closing" : "bg-brand-soft text-brand",
          )}
        >
          <span className={cn("size-1.5 rounded-full", soon ? "bg-closing-dot" : "bg-open")} aria-hidden />
          {`Closing soon · ${formatLeft(left)} left`}
        </span>
      ) : null}
    </span>
  );
}
