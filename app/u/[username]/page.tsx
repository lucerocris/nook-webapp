import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatCircleText, Coffee, GridFour, LockSimple } from "@phosphor-icons/react/dist/ssr";

import Footer from "@/app/components/Footer";
import JsonLd from "@/app/components/JsonLd";
import TrackView from "@/app/components/TrackView";
import SectionTabs from "@/app/components/cafe/SectionTabs";
import ProfileAppBand from "@/app/components/profile/ProfileAppBand";
import ProfileCups from "@/app/components/profile/ProfileCups";
import ProfileGallery from "@/app/components/profile/ProfileGallery";
import ProfileHeader, { countsLine } from "@/app/components/profile/ProfileHeader";
import ProfileReviews from "@/app/components/profile/ProfileReviews";
import type { ProfileCups as Cups } from "@/lib/data/cups-mappers";
import { getProfileCups, getPublicProfile, type PublicProfile } from "@/lib/data/profiles";
import { settle } from "@/lib/utils/settle";
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

function describe(profile: PublicProfile, cups: Cups | null): string {
  const lead = `${profile.name}'s coffee and cafe visits in Cebu on Nook: ${countsLine(profile.counts, cups?.counts.cups ?? null)}.`;
  const full = profile.bio ? `${lead} “${profile.bio.replace(/\s+/g, " ")}”` : lead;
  return full.length > 200 ? `${full.slice(0, 198).trimEnd()}…”` : full;
}

/** Indexed only when there is something to read: a profile with the gallery
 * switched off, or with no photos and no reviews, stays out of search. */
function indexable(profile: PublicProfile, cups: Cups | null): boolean {
  return (
    profile.galleryPublic &&
    (profile.photos.length > 0 || profile.reviews.length > 0 || (cups?.cafes.length ?? 0) > 0)
  );
}

/** Their cups, or null before the Cups RPCs (or if the read fails): the page
 * then keeps Photos and Reviews, and never calls photos "cups". */
function loadCups(username: string): Promise<Cups | null> {
  return settle(() => getProfileCups(username), "profile cups");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const [profile, cups] = await Promise.all([getPublicProfile(username), loadCups(username)]);
  if (!profile) {
    return { title: { absolute: "Profile not found · Nook" }, robots: { index: false } };
  }

  const title = profile.hasName
    ? `${profile.name} (@${profile.username}) · Nook`
    : `@${profile.username} · Nook`;
  const description = describe(profile, cups);
  const url = `/u/${profile.username}`;

  // The link-preview image is opengraph-image.tsx beside this file; Next adds
  // og:image for it, and Twitter falls back to og:image.
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: indexable(profile, cups) ? undefined : { index: false, follow: true },
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
 * profile" lands: the centred header with Get Nook, then Cups (their visits,
 * by cafe) and Photos (the gallery) under jump links, then the app band. A
 * cup is a visit, as on cafe pages (COFFEE_VOICE rule 5); reviews are among
 * the cups. Before the Cups RPCs it is Photos and Reviews. Never their ranking or a score
 * (nook-supabase docs/PUBLIC_PROFILE.md).
 *
 * The profile is read before anything streams, so an unknown username is a
 * real 404 rather than a 404 page under a 200. The read is cached
 * (`getPublicProfile`), which is what lets it sit outside a Suspense boundary.
 */
export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const [profile, cups] = await Promise.all([getPublicProfile(username), loadCups(username)]);
  if (!profile) notFound();

  const first = firstName(profile);

  return (
    <>
      <TrackView
        event="share_link_opened"
        properties={{ link_type: "profile", username: profile.username }}
      />
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
          <ProfileHeader profile={profile} visits={cups ? cups.counts.cups : null} />

          {cups ? (
            <>
              <SectionTabs
                tabs={[
                  { id: "cups", label: "Cups", icon: <Coffee size={24} /> },
                  ...(profile.galleryPublic
                    ? [{ id: "photos", label: "Photos", icon: <GridFour size={24} /> }]
                    : []),
                ]}
                className="top-16 mt-8 lg:top-16 lg:mx-0 lg:mt-10"
                listClassName="justify-center gap-10"
              />
              <div className="[&>section]:scroll-mt-32">
                <section id="cups" aria-labelledby="cups-title" className="pt-6 sm:pt-8">
                  {/* The old #reviews links land on the cups, where reviews now are. */}
                  <span id="reviews" aria-hidden />
                  <SectionHeading id="cups-title">Cups</SectionHeading>
                  <ProfileCups cups={cups} firstName={first} />
                </section>
                {profile.galleryPublic ? (
                  <section id="photos" aria-labelledby="photos-title" className="pt-10 sm:pt-14">
                    <span id="gallery" aria-hidden />
                    <SectionHeading id="photos-title">Photos</SectionHeading>
                    <div className="mt-4">
                      <ProfileGallery photos={profile.photos} firstName={first} />
                    </div>
                  </section>
                ) : (
                  <PrivatePhotos first={first} note="Their rated and written cups are public, above." />
                )}
              </div>
            </>
          ) : profile.galleryPublic ? (
            <>
              <SectionTabs
                tabs={[
                  // Icons like the app's profile tabs: grid for the photos,
                  // a speech bubble for reviews.
                  { id: "photos", label: "Photos", icon: <GridFour size={24} /> },
                  { id: "reviews", label: "Reviews", icon: <ChatCircleText size={24} /> },
                ]}
                className="top-16 mt-8 lg:top-16 lg:mx-0 lg:mt-10"
                listClassName="justify-center gap-10"
              />
              <div className="[&>section]:scroll-mt-32">
                <section id="photos" aria-labelledby="photos-title" className="pt-0.5 sm:pt-4">
                  <span id="gallery" aria-hidden />
                  <h2 id="photos-title" className="sr-only">
                    Photos
                  </h2>
                  <ProfileGallery photos={profile.photos} firstName={first} />
                </section>
                <section id="reviews" aria-labelledby="reviews-title" className="pt-10 sm:pt-14">
                  <SectionHeading id="reviews-title">Reviews</SectionHeading>
                  <ProfileReviews reviews={profile.reviews} firstName={first} />
                </section>
              </div>
            </>
          ) : (
            <>
              <PrivatePhotos first={first} note="Their reviews are public, below." />
              <section id="reviews" aria-labelledby="reviews-title" className="pt-8">
                <SectionHeading id="reviews-title">Reviews</SectionHeading>
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
function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xl font-semibold tracking-[-0.01em] text-ink sm:text-[22px]">
      {children}
    </h2>
  );
}

function PrivatePhotos({ first, note }: { first: string; note: string }) {
  return (
    <div className="mt-8 flex items-center justify-center gap-3 border-y border-line py-5 text-left">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink">
        <LockSimple size={18} aria-hidden />
      </span>
      <span>
        <span className="block text-sm font-semibold text-ink">{first}&apos;s photos are private</span>
        <span className="block text-[13px] text-muted">{note}</span>
      </span>
    </div>
  );
}
