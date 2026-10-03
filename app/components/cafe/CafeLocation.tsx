import { NavigationArrow } from "@phosphor-icons/react/dist/ssr";

import CafeLocationMap from "@/app/components/CafeLocationMap";
import type { OperatingHours } from "@/lib/utils/hours";
import HoursTable from "./HoursTable";
import OpenStatus from "./OpenStatus";

/**
 * Hours and location (Saint Laurent's store block): a text column with the
 * address, one status line under it (Nike's "Closed · opens 10 AM"), the
 * week's hours with today marked, and Get directions; the map beside it.
 * Stacks on phones with the map first.
 */
export default function CafeLocation({
  name,
  address,
  lat,
  lng,
  hours,
  mapsUrl,
}: {
  name: string;
  address: string;
  lat: number;
  lng: number;
  hours: OperatingHours;
  mapsUrl: string;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] md:gap-10">
      <div className="order-2 md:order-1">
        <p className="text-[15px] leading-relaxed text-ink">{address}</p>
        <p className="mt-1 text-sm">
          <OpenStatus hours={hours} />
        </p>
        <div className="mt-5 border-t border-line pt-4">
          <HoursTable hours={hours} />
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-semibold text-ink transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <NavigationArrow size={16} aria-hidden />
          Get directions
        </a>
      </div>
      <div className="order-1 h-56 overflow-hidden rounded-[var(--radius-card)] bg-paper md:order-2 md:h-80">
        <CafeLocationMap name={name} address={address} lat={lat} lng={lng} />
      </div>
    </div>
  );
}
