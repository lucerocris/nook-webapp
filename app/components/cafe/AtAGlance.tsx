import { createElement } from "react";
import {
  CalendarBlank,
  Laptop,
  Plug,
  UsersThree,
  Wallet,
  WifiHigh,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

import type { Tag } from "@/lib/data/cafes-mappers";
import { DAY_KEYS, type OperatingHours } from "@/lib/utils/hours";
import { cn } from "@/lib/utils";

type Fact = { label: string; value: string; icon: Icon };

const SHORT: Record<string, string> = { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" };

/** "Closed Sundays" / "Closed Sun, Mon" / "Open daily", or null when hours are unknown. */
function closedDays(hours: OperatingHours): string | null {
  if (Object.keys(hours).length === 0) return null;
  const closed = DAY_KEYS.filter((d) => !hours[d] || hours[d]?.closed);
  if (closed.length === 0) return "Open daily";
  if (closed.length === 1) return `Closed ${closed[0][0].toUpperCase()}${closed[0].slice(1)}s`;
  return `Closed ${closed.map((d) => SHORT[d]).join(", ")}`;
}

/**
 * The page's signature: the questions people choose a cafe by, answered from
 * Nook's own data (tags and hours), which map apps don't carry. Only facts
 * this cafe actually has get a cell; anything not yet listed is named once,
 * in one quiet line, so the row never fills with blanks or implies a lack.
 */
export default function AtAGlance({ tags, hours }: { tags: Tag[]; hours: OperatingHours }) {
  const has = (name: string) => tags.some((t) => t.name === name);
  const payment = tags.filter((t) => t.category === "payment").map((t) => t.name);
  const days = closedDays(hours);

  const facts: Fact[] = [];
  const unknown: string[] = [];
  if (has("Free WiFi")) facts.push({ label: "Wi-Fi", value: "Free", icon: WifiHigh });
  else unknown.push("Wi-Fi");
  if (has("Power Outlets")) facts.push({ label: "Outlets", value: "Yes", icon: Plug });
  else unknown.push("outlets");
  // Values are the cafe's own tag names, not "Yes": the reader should not
  // have to decode what "good for it" means. At most two names per cell, then
  // "+N", so a cell stays within two lines on a phone and the rows stay even.
  const named = (names: string[]) => {
    const found = names.filter(has);
    if (found.length <= 2) return found.join(", ");
    return `${found.slice(0, 2).join(", ")} +${found.length - 2}`;
  };
  const work = named(["Solo Work / Study", "Student Friendly"]);
  if (work) facts.push({ label: "Work or study", value: work, icon: Laptop });
  const groups = named(["Group Hangout", "Family Friendly", "Community Space"]);
  if (groups) facts.push({ label: "Groups", value: groups, icon: UsersThree });
  if (days) facts.push({ label: "Days", value: days, icon: CalendarBlank });
  if (payment.length) facts.push({ label: "Pay with", value: payment.join(", "), icon: Wallet });

  if (facts.length === 0) return null;

  return (
    <div>
      <dl
        aria-label="At a glance"
        className="grid grid-cols-2 overflow-hidden rounded-2xl border border-line"
      >
        {facts.map((fact, i) => (
          <div
            key={fact.label}
            className={cn(
              "border-line px-3.5 py-3",
              i % 2 === 0 ? "border-r" : "",
              i < facts.length - (facts.length % 2 === 0 ? 2 : 1) ? "border-b" : "",
              i === facts.length - 1 && facts.length % 2 === 1 ? "col-span-2 border-r-0" : "",
            )}
          >
            <dt className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
              {createElement(fact.icon, { size: 15, className: "text-fern", "aria-hidden": true })}
              {fact.label}
            </dt>
            <dd className="mt-1 text-[14px] font-semibold leading-snug text-ink">{fact.value}</dd>
          </div>
        ))}
      </dl>
      {unknown.length > 0 ? (
        <p className="mt-3 text-sm text-body">
          Not listed yet: {unknown.join(" and ")}.
        </p>
      ) : null}
    </div>
  );
}
