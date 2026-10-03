"use client";

import Link from "next/link";

import { useId, useState } from "react";
import {
  CaretDown,
  Clock,
  FacebookLogo,
  Globe,
  InstagramLogo,
  MapPin,
  TiktokLogo,
  type Icon,
} from "@phosphor-icons/react";

import type { OperatingHours } from "@/lib/utils/hours";
import type { SocialKind, SocialLink } from "@/lib/utils/social";
import { cn } from "@/lib/utils";
import HoursTable from "./HoursTable";
import OpenStatus from "./OpenStatus";

const SOCIAL_ICON: Record<SocialKind, Icon> = {
  instagram: InstagramLogo,
  facebook: FacebookLogo,
  tiktok: TiktokLogo,
  website: Globe,
};

/**
 * Sticky side card on desktop (Fresha's order, minus its button: Get
 * directions lives under the title): icon-led rows for the open status (expands into the
 * week's hours) and the address; then the cafe's own links as icon-and-text
 * rows (ClassPass); then what only the app does, with a way to get it, so the
 * card ends on something useful instead of empty space. Share lives in the
 * title block, so it is not repeated here.
 * References: docs/references/cafe-details/.
 */
export default function CafeInfoPanel({
  name,
  hours,
  address,
  mapsUrl,
  links,
}: {
  name: string;
  hours: OperatingHours;
  address: string;
  mapsUrl: string;
  links: SocialLink[];
}) {
  const [hoursOpen, setHoursOpen] = useState(false);
  const hoursId = useId();
  const hasHours = Object.keys(hours).length > 0;

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-white p-5">

      <ul className="text-sm text-body">
        <li className="border-b border-line pb-2">
          {hasHours ? (
            <button
              type="button"
              onClick={() => setHoursOpen((v) => !v)}
              aria-expanded={hoursOpen}
              aria-controls={hoursId}
              className="flex min-h-11 w-full items-center gap-3 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-brand"
            >
              <Clock size={18} className="shrink-0 text-fern" aria-hidden />
              <OpenStatus hours={hours} className="min-w-0 flex-1" />
              <CaretDown
                size={14}
                aria-hidden
                className={cn("shrink-0 text-muted transition-transform duration-200", hoursOpen && "rotate-180")}
              />
              <span className="sr-only">{hoursOpen ? "Hide" : "Show"} opening hours</span>
            </button>
          ) : (
            <p className="flex min-h-11 items-center gap-3">
              <Clock size={18} className="shrink-0 text-fern" aria-hidden />
              <span className="text-muted">Hours not listed yet</span>
            </p>
          )}
          {hoursOpen ? (
            <div id={hoursId} className="pb-1 pl-[30px] pt-1">
              <HoursTable hours={hours} />
            </div>
          ) : null}
        </li>
        <li className="flex gap-3 py-3">
          <MapPin size={18} className="mt-0.5 shrink-0 text-fern" aria-hidden />
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 break-words underline-offset-4 hover:text-ink hover:underline"
          >
            {address}
          </a>
        </li>
        {links.map((link) => {
          const LinkIcon = SOCIAL_ICON[link.kind];
          return (
            <li key={link.kind} className="border-t border-line">
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center gap-3 underline-offset-4 hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-brand"
              >
                <LinkIcon size={18} className="shrink-0 text-fern" aria-hidden />
                {link.label}
              </a>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-2xl bg-paper p-4">
        <p className="text-sm font-semibold text-ink">In the Nook app</p>
        <p className="mt-1 text-sm leading-relaxed text-body">
          Save {name}, mark it as been or want to try, and write a review.
        </p>
        <Link
          href="/download-app"
          className="mt-3 inline-flex h-10 items-center rounded-full border border-brand bg-white px-4 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Get the app
        </Link>
      </div>
    </div>
  );
}
