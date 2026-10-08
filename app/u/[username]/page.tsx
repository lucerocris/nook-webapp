import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LockSimple } from "@phosphor-icons/react/dist/ssr";

import Footer from "@/app/components/Footer";
import JsonLd from "@/app/components/JsonLd";
import SectionTabs from "@/app/components/cafe/SectionTabs";
import ProfileAppBand from "@/app/components/profile/ProfileAppBand";
import ProfileGallery from "@/app/components/profile/ProfileGallery";
import ProfileHeader, { countsLine } from "@/app/components/profile/ProfileHeader";
import ProfileReviews from "@/app/components/profile/ProfileReviews";
import { getPublicProfile, type PublicProfile } from "@/lib/data/profiles";
import { SITE_URL } from "@/lib/env";

type Props = { params: Promise<{ username: string }> };

/**
 * Cache Components needs one param to prerender the route; every other
 * username renders on its first visit. "nook" is a placeholder: unknown, it
 * prerenders the 404.
 */
export async function generateStaticParams() {
  return [{ username: "nook" }];
}

/** "Bea" from "Bea Santos"; the handle when there is no name. */
function firstName(profile: PublicProfile): string {
  return profile.hasName ? profile.name.trim().split(/\s+/)[0] : profile.username;
}

function describe(profile: PublicProfile): string {
  const lead = `${profile.name}'s coffee and cafe reviews in Cebu on Nook: ${countsLine(profile.counts)}.`;
  const full = profile.bio ? `${lead} “${profile.bio.replace(/\s+/g, " ")}”` : lead;
  return full.length > 200 ? `${full.slice(0, 198).trimEnd()}…”` : full;
}

/** Indexed only when there is something to read: a profile with the gallery
 * switched off, or with no photos and no reviews, stays out of search. */
function indexable(profile: PublicProfile): boolean {
  return profile.galleryPublic && (profile.photos.length > 0 || profile.reviews.length > 0);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) {
    return { title: { absolute: "Profile not found · Nook" }, robots: { index: false } };
  }

  const title = profile.hasName
    ? `${profile.name} (@${profile.username}) · Nook`
    : `@${profile.username} · Nook`;
  const description = describe(profile);
  const url = `/u/${profile.username}`;

  // The link-preview image is opengraph-image.tsx beside this file; Next adds
  // og:image for it, and Twitter falls back to og:image.
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: indexable(profile) ? undefined : { index: false, follow: true },
    openGraph: {
      type: "profile",
      title,
      description,
      url,
      siteName: "Nook",
      username: profile.username,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * A person's public profile, `/u/<username>`, where the app's "Share
 * profile" lands: the centred header with Get Nook, then Gallery and Reviews
 * under jump links, then the app band. Never their ranking or a score
 * (nook-supabase docs/PUBLIC_PROFILE.md).
 *
 * The profile is read before anything streams, so an unknown username is a
 * real 404 rather than a 404 page under a 200. The read is cached
 * (`getPublicProfile`), which is what lets it sit outside a Suspense boundary.
 */
export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) notFound();

  const first = firstName(profile);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          url: `${SITE_URL}/u/${profile.username}`,
          mainEntity: {
            "@type": "Person",
            name: profile.name,
            alternateName: `@${profile.username}`,
            ...(profile.bio ? { description: profile.bio } : {}),
            ...(profile.avatarUrl ? { image: profile.avatarUrl } : {}),
          },
        }}
      />
      <main className="flex-1 pt-24 pb-4 sm:pt-28">
        <div className="mx-auto w-full max-w-[960px] px-4 sm:px-8">
          <ProfileHeader profile={profile} />

          {profile.galleryPublic ? (
            <>
              <SectionTabs
                tabs={[
                  { id: "gallery", label: "Gallery", count: profile.photos.length },
                  { id: "reviews", label: "Reviews", count: profile.counts.reviews },
                ]}
                className="top-16 mt-8 lg:top-16 lg:mx-0 lg:mt-10"
                listClassName="justify-center gap-10"
              />
              <div className="[&>section]:scroll-mt-32">
                <section id="gallery" aria-labelledby="gallery-title" className="pt-0.5 sm:pt-4">
                  <h2 id="gallery-title" className="sr-only">
                    Gallery
                  </h2>
                  <ProfileGallery photos={profile.photos} firstName={first} />
                </section>
                <section id="reviews" aria-labelledby="reviews-title" className="pt-10 sm:pt-14">
                  <ReviewsHeading />
                  <ProfileReviews reviews={profile.reviews} firstName={first} />
                </section>
              </div>
            </>
          ) : (
            <>
              <div className="mt-8 flex items-center justify-center gap-3 border-y border-line py-5 text-left">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink">
                  <LockSimple size={18} aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">{first}&apos;s gallery is private</span>
                  <span className="block text-[13px] text-muted">Their reviews are public, below.</span>
                </span>
              </div>
              <section id="reviews" aria-labelledby="reviews-title" className="pt-8">
                <ReviewsHeading />
                <ProfileReviews reviews={profile.reviews} firstName={first} />
              </section>
            </>
          )}

          <ProfileAppBand />
        </div>
      </main>
      <Footer />
    </>
  );
}

/** No count: the header's stat row and the tab already say it. */
function ReviewsHeading() {
  return (
    <h2
      id="reviews-title"
      className="text-xl font-semibold tracking-[-0.01em] text-ink sm:text-[22px]"
    >
      Reviews
    </h2>
  );
}
