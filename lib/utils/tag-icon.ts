import {
  BookOpen,
  CalendarCheck,
  Chair,
  Cigarette,
  Clock,
  Coffee,
  CoffeeBean,
  CreditCard,
  Dog,
  DoorOpen,
  Fire,
  GraduationCap,
  Heart,
  HourglassMedium,
  InstagramLogo,
  Laptop,
  Leaf,
  LetterCircleP,
  Moon,
  Money,
  Plug,
  ShoppingBag,
  Snowflake,
  Sparkle,
  Users,
  UsersThree,
  Wallet,
  Wheelchair,
  WifiHigh,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon, IconProps } from "@phosphor-icons/react/dist/lib/types";
import { createElement, forwardRef } from "react";

type Shape = [tag: "path" | "line" | "polyline" | "rect" | "ellipse", attrs: Record<string, string | number>];

/**
 * Nook's own coffee icons (nook-supabase `assets/icons/coffee/*.svg`, the
 * `nook:<file>` values of `tags.icon_name`), drawn as Phosphor regular: 256
 * viewBox, 16-unit round stroke, no fill. They take Phosphor's props so
 * `getTagIcon` can hand either kind out. There is only a regular weight, so
 * `weight` is ignored: a selected chip keeps it and its colours carry the
 * state.
 */
function nookIcon(displayName: string, shapes: Shape[]): Icon {
  const NookIcon = forwardRef<SVGSVGElement, IconProps>(function NookIcon(props, ref) {
    const { alt, color = "currentColor", size = "1em", weight, mirrored, children, ...rest } = props;
    void weight;
    return createElement(
      "svg",
      {
        ref,
        xmlns: "http://www.w3.org/2000/svg",
        width: size,
        height: size,
        viewBox: "0 0 256 256",
        fill: "none",
        stroke: color,
        strokeWidth: 16,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        transform: mirrored ? "scale(-1, 1)" : undefined,
        ...rest,
      },
      alt ? createElement("title", null, alt) : null,
      children,
      ...shapes.map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs })),
    );
  });
  NookIcon.displayName = displayName;
  return NookIcon;
}

export const EspressoIcon = nookIcon("Espresso", [
  ["path", { d: "M64,104H176v16a56,56,0,0,1-112,0Z" }],
  ["path", { d: "M176,112h12a20,20,0,0,1,0,40H166" }],
  ["line", { x1: 40, y1: 200, x2: 216, y2: 200 }],
  ["line", { x1: 104, y1: 40, x2: 104, y2: 72 }],
  ["line", { x1: 136, y1: 40, x2: 136, y2: 72 }],
]);

export const PourOverIcon = nookIcon("PourOver", [
  ["path", { d: "M40,48H216l-48,64H88Z" }],
  ["line", { x1: 128, y1: 136, x2: 128, y2: 140 }],
  ["path", { d: "M72,164H184v12a32,32,0,0,1-32,32H104a32,32,0,0,1-32-32Z" }],
]);

export const ColdBrewIcon = nookIcon("ColdBrew", [
  ["path", { d: "M56,64H200l-22,152H78Z" }],
  ["polyline", { points: "148 64 168 32 196 32" }],
  ["rect", { x: 96, y: 112, width: 44, height: 44, rx: 4 }],
]);

export const PhilippineBeansIcon = nookIcon("PhilippineBeans", [
  ["path", { d: "M208,104c0,72-80,128-80,128S48,176,48,104a80,80,0,0,1,160,0Z" }],
  ["ellipse", { cx: 128, cy: 104, rx: 24, ry: 36, transform: "rotate(45 128 104)" }],
  ["path", { d: "M111,121c4-14,30-20,34-34" }],
]);

export const KapengBarakoIcon = nookIcon("KapengBarako", [
  ["path", { d: "M48,56H184V184a24,24,0,0,1-24,24H72a24,24,0,0,1-24-24Z" }],
  ["line", { x1: 48, y1: 88, x2: 184, y2: 88 }],
  ["path", { d: "M184,104h8a32,32,0,0,1,0,64h-8" }],
  ["ellipse", { cx: 116, cy: 148, rx: 18, ry: 28, transform: "rotate(30 116 148)" }],
]);

export const MatchaIcon = nookIcon("Matcha", [
  ["path", { d: "M32,128H224a96,96,0,0,1-192,0Z" }],
  ["polyline", { points: "108 128 128 88 176 88 188 128" }],
  ["line", { x1: 152, y1: 88, x2: 160, y2: 32 }],
]);

const EXACT_ICON_MAP: Record<string, Icon> = {
  "date spot": Heart,
  "solo work": Laptop,
  "community space": UsersThree,
  "group hangout": Users,
  "family friendly": Users,
  "book cafe": BookOpen,
  "late night": Moon,
  "quick coffee": Coffee,
  "specialty coffee": Coffee,
  "nature cafe": Leaf,
  "special occasion": Sparkle,
  "student friendly": GraduationCap,
  "aesthetic": InstagramLogo,
  "pet friendly": Dog,
  "free wifi": WifiHigh,
  "power outlets": Plug,
  "air conditioned": Snowflake,
  "outdoor seating": Chair,
  "parking available": LetterCircleP,
  "reservations accepted": CalendarCheck,
  "private rooms": DoorOpen,
  "wheelchair accessible": Wheelchair,
  "takeaway available": ShoppingBag,
  "smoking area": Cigarette,
  "open 24 hours": Clock,
  // Coffee (docs/COFFEE_TAGS.md): Phosphor where one fits, Nook's own above.
  espresso: EspressoIcon,
  "pour-over": PourOverIcon,
  "cold brew": ColdBrewIcon,
  "slow bar": HourglassMedium,
  "single origin": CoffeeBean,
  "philippine beans": PhilippineBeansIcon,
  "kapeng barako": KapengBarakoIcon,
  "roasts in-house": Fire,
  matcha: MatchaIcon,
};

function matchSubstring(name: string): Icon | null {
  if (name.includes("wifi")) return WifiHigh;
  if (name.includes("cash")) return Money;
  if (/(card|credit|debit)/.test(name)) return CreditCard;
  if (/(wallet|gcash|maya)/.test(name)) return Wallet;
  return null;
}

export function getTagIcon(name: string): Icon {
  const primary = name.split("/")[0].trim().toLowerCase();

  const exact = EXACT_ICON_MAP[primary];
  if (exact) return exact;

  const substring = matchSubstring(primary);
  if (substring) return substring;

  return Coffee;
}
