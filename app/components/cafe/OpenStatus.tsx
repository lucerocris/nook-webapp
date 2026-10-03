"use client";

import { getOpenStatus, type OperatingHours } from "@/lib/utils/hours";
import { cn } from "@/lib/utils";
import { useNow } from "./useNow";

/** "Open · until 10 PM" / "Closed · opens 7 AM" / "Hours not listed". */
export default function OpenStatus({
  hours,
  className,
  detail = true,
}: {
  hours: OperatingHours;
  className?: string;
  detail?: boolean;
}) {
  const now = useNow();
  if (!now) return <span className={cn("text-muted", className)}>&nbsp;</span>;
  const status = getOpenStatus(hours, now);
  if (!status) {
    return <span className={cn("text-muted", className)}>Hours not listed</span>;
  }
  return (
    <span className={className}>
      <span className={cn("font-semibold", status.isOpen ? "text-open" : "text-closed")}>
        {status.isOpen ? "Open" : "Closed"}
      </span>
      {detail && status.detail ? (
        <span className="text-body"> · {status.detail}</span>
      ) : null}
    </span>
  );
}
