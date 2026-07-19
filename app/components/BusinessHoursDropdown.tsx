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

  // `new Date()` evaluated during render ran twice with different values —
  // once on the server, once at hydration — so a cafe closing at 21:00 could
  // render "Open Now" at 20:59:59 and hydrate to "Closed" a second later,
  // mismatching statusText/statusClass and, across midnight, the isToday row.
  // Time-dependent output is therefore withheld until after mount, and then
  // refreshed each minute so a long-lived tab stops showing a frozen badge.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const todayKey = useMemo(() => (now ? getCurrentDayKey(now) : null), [now]);
  const today = todayKey ? (hours[todayKey] ?? null) : null;
  const openNow = useMemo(
    () => (now ? isOpenNow(hours, now) : null),
    [hours, now],
  );
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

  // `null` until mounted — "Hours" is the neutral label that reserves the same
  // line without asserting a status the server had no way to know.
  const statusText =
    openNow === null ? "Hours" : openNow ? "Open Now" : "Closed";
  const statusClass =
    openNow === null
      ? "text-[#6b6b6b]"
      : openNow
        ? "text-[#557f55]"
        : "text-[#b94a48]";
  const subtitle =
    now === null
      ? " "
      : today
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
          <span className="mt-2 block text-xs leading-none text-[#6b6b6b]">
            {subtitle}
          </span>
        </span>
        <CaretDown
          size={20}
          className={`shrink-0 text-[#6b6b6b] transition-transform duration-200 ${
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
                      : "text-[#6b6b6b]"
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
