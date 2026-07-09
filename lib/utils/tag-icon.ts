import {
  BookOpen,
  CalendarCheck,
  Chair,
  Cigarette,
  Clock,
  Coffee,
  CreditCard,
  Dog,
  DoorOpen,
  GraduationCap,
  Heart,
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
import type { Icon } from "@phosphor-icons/react/dist/lib/types";

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
