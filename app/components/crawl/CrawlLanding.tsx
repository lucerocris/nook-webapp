import { LockSimple } from "@phosphor-icons/react/dist/ssr";

import Footer from "@/app/components/Footer";
import CrawlHeader, { stopsLabel } from "@/app/components/crawl/CrawlHeader";
import CrawlJoinCode from "@/app/components/crawl/CrawlJoinCode";
import CrawlRouteMap, { type RoutePoint } from "@/app/components/crawl/CrawlRouteMap";
import CrawlStopList from "@/app/components/crawl/CrawlStopList";
import ProfileAppBand from "@/app/components/profile/ProfileAppBand";
import type { CrewInvite, PublicCrawl } from "@/lib/data/crawls";

/**
 * Where a shared crawl link lands, `/c/<code>` and `/c/<code>?crew=<invite>`
 * (nook-supabase docs/COMMUNITY_CRAWLS.md §5). Phone: header, map, the
 * stops, the code panel. Desktop: the same left column with the map sticky
 * on the right. With only a crew invite readable (a private or archived
 * crawl) there is no route to show, just the invite.
 */
export default function CrawlLanding({
  crawl,
  invite,
}: {
  crawl: PublicCrawl | null;
  invite: CrewInvite | null;
}) {
  const points: RoutePoint[] = (crawl?.stops ?? []).flatMap((s) =>
    s.lat !== null && s.lng !== null ? [{ order: s.order, name: s.name, lat: s.lat, lng: s.lng }] : [],
  );
  const title = crawl?.title ?? invite?.title ?? "";
  const crewFull = invite ? invite.crewSize >= invite.crewLimit : false;

  // A full crew cannot take another member, but a readable crawl can still
  // be run with your own crew: then the crawl code is the useful one.
  const join =
    invite && !(crewFull && crawl)
      ? {
          code: invite.inviteCode,
          kind: "crew" as const,
          note: crewFull
            ? "This crew is full, so the app will not let you join it."
            : `Joins ${invite.starter ? `@${invite.starter.username}'s` : "this"} crew. Up to ${invite.crewLimit} people.`,
        }
      : crawl
        ? {
            code: crawl.shareCode,
            kind: "crawl" as const,
            note: "Opens the crawl. Start a run there and invite your own crew.",
          }
        : null;

  return (
    <>
      <main className="flex-1 pt-24 pb-4 sm:pt-28">
        <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
          {crawl ? (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-x-14 lg:gap-y-10">
              <div className="lg:col-start-1 lg:row-start-1">
                <CrawlHeader crawl={crawl} invite={invite} />
              </div>

              {points.length > 0 ? (
                <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
                  <div className="aspect-[4/3] overflow-hidden rounded-[20px] bg-paper lg:sticky lg:top-24 lg:aspect-auto lg:h-[min(640px,calc(100dvh-8rem))]">
                    <CrawlRouteMap points={points} title={title} />
                  </div>
                </div>
              ) : null}

              <div className="min-w-0 lg:col-start-1 lg:row-start-2">
                <section aria-labelledby="stops-title">
                  <h2
                    id="stops-title"
                    className="text-xl font-semibold tracking-[-0.01em] text-ink sm:text-[22px]"
                  >
                    The route
                  </h2>
                  <p className="mt-1 mb-4 text-sm text-muted">
                    {stopsLabel(crawl.stops.length)} in this order. Tap one to see the cafe.
                  </p>
                  <CrawlStopList stops={crawl.stops} />
                </section>
                {join ? (
                  <div className="mt-10">
                    <CrawlJoinCode {...join} />
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-[560px]">
              <CrawlHeader crawl={null} invite={invite} />
              <div className="mt-8 flex items-center gap-3 border-y border-line py-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink">
                  <LockSimple size={18} aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">The route is in the app</span>
                  <span className="block text-[13px] text-muted">
                    This crawl isn&apos;t public, so its stops show once you join.
                  </span>
                </span>
              </div>
              {join ? (
                <div className="mt-8">
                  <CrawlJoinCode {...join} />
                </div>
              ) : null}
            </div>
          )}

          <ProfileAppBand
            heading="Do cafe crawls with your crew"
            body="Pick three to six cafes, start a run with up to eight friends and stamp each stop when you get there. Free for iPhone and Android."
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
