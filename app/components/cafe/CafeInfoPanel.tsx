"use client";

import { useId, useState } from "react";
import {
  CaretDown,
  Clock,
  FacebookLogo,
  Globe,
  InstagramLogo,
  MapPin,
  NavigationArrow,
  TiktokLogo,
  type Icon,
} from "@phosphor-icons/react";

import ShareButton from "@/app/components/ShareButton";
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
 * Sticky side card on desktop (Nextdoor's info card): icon-led rows for the
 * open status, which expands into the week's hours, and the address; then
 * Get directions as the one filled button; then round, captioned buttons for
 * Share and whichever of the cafe's own links exist (Google Maps' row).
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
        <li className="border-b border-line pb-3">
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
        <li className="flex gap-3 pt-3">
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
      </ul>

      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Get directions to ${name} in Google Maps`}
        className="mt-5 flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <NavigationArrow size={18} weight="fill" aria-hidden />
        Get directions
      </a>

      <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-3">
        <li className="flex w-14 flex-col items-center gap-1.5">
          <ShareButton title={name} text={`${name} on Nook — cafes in Cebu`} className="size-11" />
          <span className="text-xs text-body">Share</span>
        </li>
        {links.map((link) => {
          const LinkIcon = SOCIAL_ICON[link.kind];
          return (
            <li key={link.kind} className="w-14">
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col items-center gap-1.5 focus-visible:outline-none"
              >
                <span className="flex size-11 items-center justify-center rounded-full border border-line text-ink transition-colors group-hover:bg-paper group-focus-visible:outline-2 group-focus-visible:outline-brand">
                  <LinkIcon size={18} aria-hidden />
                </span>
                <span className="text-xs text-body">{link.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
