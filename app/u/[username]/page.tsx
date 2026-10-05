import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LockSimple } from "@phosphor-icons/react/dist/ssr";

import Footer from "@/app/components/Footer";
import JsonLd from "@/app/components/JsonLd";
import StoreBadges from "@/app/components/StoreBadges";
import SectionTabs from "@/app/components/cafe/SectionTabs";
import ProfileGallery from "@/app/components/profile/ProfileGallery";
import ProfileHeader, { countsLine } from "@/app/components/profile/ProfileHeader";
import ProfileReviews from "@/app/components/profile/ProfileReviews";
import TopCafes from "@/app/components/profile/TopCafes";
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

/** "Cris's" / "James'". */
function possessive(name: string): string {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}

/** "Cris" from "Cris Lucero"; the handle when there is no name. */
function firstName(profile: PublicProfile): string {
  return profile.name.trim().split(/\s+/)[0] || profile.username;
}

function describe(profile: PublicProfile): string {
  const top = profile.topCafes.map((c) => c.name);
  const lead =
    top.length > 0
      ? `${possessive(profile.name)} favorite cafes in Cebu: ${top.join(", ")}.`
      : `${profile.name} (@${profile.username}) on Nook, cafes in Cebu.`;
  return `${lead} ${countsLine(profile.counts)}.`.slice(0, 200);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) {
    return { title: { absolute: "Profile not found · Nook" }, robots: { index: false } };
  }

  const title =
    profile.topCafes.length > 0
      ? `${possessive(firstName(profile))} top cafes on Nook`
      : `${profile.name} (@${profile.username}) on Nook`;
  const description = describe(profile);
  const url = `/u/${profile.username}`;
  // The #1 cafe's photo says the most in a link preview; the avatar is next.
  const image = profile.topCafes[0]?.imageUrl ?? profile.avatarUrl;
  const images = image ? [{ url: image, alt: profile.topCafes[0]?.name ?? profile.name }] : undefined;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { type: "profile", title, description, url, siteName: "Nook", images, username: profile.username },
    twitter: { card: images ? "summary_large_image" : "summary", title, description, images },
  };
}

/**
 * A person's public profile, `/u/<username>`: header, Top 3, then Gallery and
 * Reviews as sections under jump links, then the app. Never a score, the
 * ranking itself or lists (nook-supabase docs/PUBLIC_PROFILE.md).
 *
 * The profile is read before anything streams, so an unknown username is a
 * real 404 rather than a 404 page under a 200. The read is cached
 * (`getPublicProfile`), which is what lets it sit outside a Suspense boundary.
 */
export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) notFound();

  const tabs = profile.highlightsPublic
    ? [
        { id: "gallery", label: "Gallery" },
        { id: "reviews", label: "Reviews" },
      ]
    : [];

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
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-8">
          <ProfileHeader profile={profile} />
          <TopCafes cafes={profile.topCafes} />

          {profile.highlightsPublic ? (
            <SectionTabs tabs={tabs} className="top-16 mt-8 lg:mt-10" />
          ) : (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
              <LockSimple size={16} aria-hidden />
              Top cafes and gallery are private
            </p>
          )}

          <div className="[&>section]:scroll-mt-32">
            {profile.highlightsPublic ? (
              <section id="gallery" className="pt-8">
                <h2 className="text-xl font-semibold tracking-[-0.01em] text-ink sm:text-[22px]">Gallery</h2>
                <ProfileGallery photos={profile.photos} />
              </section>
            ) : null}
            <section id="reviews" className={profile.highlightsPublic ? "pt-12" : "mt-6 border-t border-line pt-8"}>
              <h2 className="text-xl font-semibold tracking-[-0.01em] text-ink sm:text-[22px]">
                Reviews <span className="font-normal text-muted tabular-nums">{profile.counts.reviews}</span>
              </h2>
              <ProfileReviews reviews={profile.reviews} name={profile.name} />
            </section>
          </div>

          <section
            aria-labelledby="get-app"
            className="mt-10 flex flex-col gap-5 rounded-[28px] bg-paper px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10"
          >
            <div className="max-w-[44ch]">
              <h2 id="get-app" className="text-lg font-semibold text-ink sm:text-xl">
                Rank your own cafes on Nook
              </h2>
              <p className="mt-1 text-[15px] leading-relaxed text-body">
                Mark where you have been, rank it against the rest, and share your top three.
              </p>
            </div>
            <StoreBadges size="sm" className="shrink-0" />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
