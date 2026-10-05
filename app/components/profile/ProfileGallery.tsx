import Image from "next/image";
import Link from "next/link";

import type { PublicPhoto } from "@/lib/data/profiles";

/** "9 cups · 7 cafes", then a tight square grid; each photo links to its
 * cafe, named in the alt text and on hover. */
export default function ProfileGallery({ photos }: { photos: PublicPhoto[] }) {
  if (photos.length === 0) {
    return <p className="mt-3 text-sm text-muted">No photos yet.</p>;
  }
  const cafes = new Set(photos.map((p) => p.cafeId)).size;
  return (
    <>
      <p className="mt-1 text-sm text-muted tabular-nums">
        {photos.length} {photos.length === 1 ? "cup" : "cups"} · {cafes} {cafes === 1 ? "cafe" : "cafes"}
      </p>
      <ul className="mt-4 grid grid-cols-3 gap-0.5 overflow-hidden rounded-[14px] sm:grid-cols-4 sm:gap-1 sm:rounded-card lg:grid-cols-5">
        {photos.map((photo) => {
          const label = [photo.drinkName, `at ${photo.cafeName}`].filter(Boolean).join(" ");
          return (
            <li key={photo.id} className="relative aspect-square bg-paper">
              <Link
                href={`/cafes/${photo.cafeId}`}
                title={label}
                className="group relative block size-full focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
              >
                <Image
                  src={photo.imageUrl}
                  alt={label}
                  fill
                  sizes="(min-width: 1024px) 200px, (min-width: 640px) 25vw, 33vw"
                  className="object-cover transition-opacity duration-200 group-hover:opacity-90"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
