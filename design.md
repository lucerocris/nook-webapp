# Design — Nook web app

Direction **Photo shelves** (partwise `frame fresh`, 2026-10-03), chosen from three
listing-app directions researched in Refero. The app is a listing app: its pages are
browsing surfaces of many cafes, so structure follows listing products (Airbnb,
Tripadvisor), not marketing pages. Colors, type, wordmark and voice are shared with
nook-business and the mobile app (`nook-supabase/docs/DESIGN_SYSTEM.md`); page shapes and
rhythm are this app's own. References: `docs/references/frame/` (gitignored).

## Reader and job
Students and remote workers in Cebu, mostly on a phone, several times a week, looking for a
cafe to work, study or hang out in, now or later today. They scan, compare a few, and open one.

## Character
**Easy browse.** Calm, bright and photo-led: good-looking cafes within seconds, with the facts
people check (open now, Wi-Fi, outlets, rating) right under each photo.

## Site map and flow
- Home: search and quick filters, then shelves of cafes → a cafe, or "See all" → map/results.
- Results and map (`/map`): card grid beside a pinned map; on phones the map is a toggle.
- Cafe detail: photos, the facts, hours, tags, menu, reviews; back to where you came from.
- Top bar on every page; the compact search moves into it on inner pages.

## Page skeletons
- **Home:** short hero (one headline line, the pill search, quick filter chips), then stacked
  horizontal shelves: Near you (or the location prompt), Featured, Top rated, Trending, New on
  Nook. Each shelf: title that links to the full list, one short line, arrows on the right, a
  row of photo cards that runs off the right edge. Then the app band, then the footer.
- **Results:** chips on top, card grid left, sticky map right.
- **Cafe detail:** photo gallery, name and the fact line, then sections.

## Rhythm
Airy and repeated. Shelves are separated by whitespace only (40–56px), no dividers or boxes.
The loud moment is the search pill; everything below is quiet repetition of cards. Bands use
the warm surface, never a dark fill. Nothing animates on scroll.

## Emphasis
First look: the search, then the first shelf's photos. Green (`brand`) only on what you can
act on: the search button, primary buttons, links, selected chips, map pins. Photos carry the
color of the page.

## Color (pinned)
Tokens in `app/globals.css` (`@theme`). Canvas white; warm surface `paper` #F7F6F2 for bands
and empty photo slots; text `ink` #101514, `body` #3B3B3B, `muted` #5C605D; hairline `line`;
accent `brand` #3A5A40 (hover `brand-hover`); `brand-soft` #E3EBE4 for selected chips and the
location prompt; `fern` for stars and icons (non-text); status `open` / `closing` / `closed`
as a dot plus text. Light only.

## Type
Poppins 400/500/600 only. Hero headline 600, 32–48px, -0.03em. Shelf titles 600, 20px phone /
22–24px desktop. Cafe names 600 15–16px; meta 400 13–14px muted; chips and buttons 500 13–14px.
Tabular figures for ratings and distances.

## Shape and depth
Photos and cards `radius-card` (16–20px); pills (999px) for the search, chips, buttons and
badges on photos. 1px `line` hairlines. One soft shadow, on the search pill (`shadow-raise`),
plus floating layers (dropdowns, map popups, menus: `shadow-float`). Icons: Phosphor, regular,
fill for active, 16–20px.

## Motion
Quiet: 150–200ms color and opacity on hover; arrows scroll the shelf smoothly; no reveal
animations. Honour reduced motion.

## Voice
Calm, local, practical, lightly warm. Specific over superlative. "cafe" in UI copy. Buttons
name the action: "Use my location", "See all", "Search".

## Constraints
- Lowercase green "nook" wordmark, never restyled.
- Brand colors and Poppins as pinned above (shared with business and mobile).
- Never invent numbers: no made-up user counts, ratings or testimonials.
- Works at 390px; shelves swipe on touch, arrows on desktop.
- No control that does nothing: no save heart until saving works on the web.
- Phosphor icons only.

## Exceptions
None.
