export const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type DayKey = (typeof DAY_KEYS)[number];

export type DayHours = {
  open: string;
  close: string;
  closed: boolean;
};

export type OperatingHours = Partial<Record<DayKey, DayHours>>;

const DAY_LABELS: Record<DayKey, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

export function dayLabel(key: DayKey): string {
  return DAY_LABELS[key];
}

function isDayKey(value: string): value is DayKey {
  return (DAY_KEYS as readonly string[]).includes(value);
}

function parseHHMM(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 24 || minutes < 0 || minutes > 59) return null;
  if (hours === 24 && minutes !== 0) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function parseDayHours(value: unknown): DayHours | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as { open?: unknown; close?: unknown; closed?: unknown };
  const open = parseHHMM(obj.open);
  const close = parseHHMM(obj.close);
  if (!open || !close) return null;
  const closed = obj.closed === true;
  return { open, close, closed };
}

export function parseOperatingHours(value: unknown): OperatingHours {
  if (!value || typeof value !== "object") return {};
  const result: OperatingHours = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!isDayKey(key)) continue;
    const parsed = parseDayHours(raw);
    if (parsed) result[key] = parsed;
  }
  return result;
}

export function format12Hour(hhmm: string | null | undefined): string {
  if (!hhmm) return "";
  const [hStr, mStr] = hhmm.split(":");
  const hours = Number(hStr);
  const minutes = Number(mStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return "";
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function formatTimeRange(hours: DayHours | null | undefined): string {
  if (!hours || hours.closed) return "";
  const open = format12Hour(hours.open);
  const close = format12Hour(hours.close);
  if (!open || !close) return "";
  return `${open} - ${close}`;
}

export function getCurrentDayKey(now: Date = new Date()): DayKey {
  const label = now
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();
  return isDayKey(label) ? label : "sunday";
}

function toMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(":");
  return Number(hStr) * 60 + Number(mStr);
}

export function isOpenNow(
  hours: OperatingHours,
  now: Date = new Date(),
): boolean {
  const key = getCurrentDayKey(now);
  const today = hours[key];
  if (!today || today.closed) return false;
  const current = now.getHours() * 60 + now.getMinutes();
  const open = toMinutes(today.open);
  const close = toMinutes(today.close);
  if (open === close) return false;
  if (close > open) {
    return current >= open && current < close;
  }
  return current >= open || current < close;
}
