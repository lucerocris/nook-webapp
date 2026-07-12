"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CaretDown } from "@phosphor-icons/react";

import {
  DAY_KEYS,
  dayLabel,
  formatTimeRange,
  getCurrentDayKey,
  isOpenNow,
  type OperatingHours,
} from "@/lib/utils/hours";

type Props = {
  hours: OperatingHours;
};

const PANEL_ID = "business-hours-panel";

export default function BusinessHoursDropdown({ hours }: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const now = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => getCurrentDayKey(now), [now]);
  const today = hours[todayKey] ?? null;
  const openNow = useMemo(() => isOpenNow(hours, now), [hours, now]);
  const todayRange = useMemo(() => formatTimeRange(today), [today]);

  const weekRows = useMemo(
    () =>
      DAY_KEYS.map((key) => {
        const day = hours[key] ?? null;
        return {
          key,
          label: dayLabel(key),
          isToday: key === todayKey,
          isClosed: !day || day.closed,
          range: day && !day.closed ? formatTimeRange(day) : "",
        };
      }),
    [hours, todayKey],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const statusText = openNow ? "Open Now" : "Closed";
  const statusClass = openNow ? "text-[#557f55]" : "text-[#b94a48]";
  const subtitle = today
    ? today.closed
      ? "Closed today"
      : todayRange
    : "Hours not available";

  return (
    <div className="mt-6 border-t border-[#e5e5e5] pt-6">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-left"
      >
        <span>
          <span className={`block text-sm font-semibold leading-none ${statusClass}`}>
            {statusText}
          </span>
          <span className="mt-2 block text-xs leading-none text-[#858585]">
            {subtitle}
          </span>
        </span>
        <CaretDown
          size={20}
          className={`shrink-0 text-[#858585] transition-transform duration-200 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      <div
        id={PANEL_ID}
        aria-hidden={!open}
        className={`grid overflow-hidden transition-all duration-200 ease-out ${
          open ? "mt-4 max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="divide-y divide-[#f0f0f0]">
          {weekRows.map((row) => (
            <li
              key={row.key}
              className={`flex items-center justify-between py-2 text-xs ${
                row.isToday
                  ? "font-semibold text-[#b94a48]"
                  : "text-[#101514]"
              }`}
            >
              <span>{row.label}</span>
              <span
                className={
                  row.isClosed
                    ? row.isToday
                      ? "text-[#b94a48]"
                      : "text-[#858585]"
                    : row.isToday
                      ? "text-[#b94a48]"
                      : "text-[#101514]"
                }
              >
                {row.isClosed ? "Closed" : row.range}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
