import { Armchair, Coffee, Cookie, TeaBag } from "@phosphor-icons/react/dist/ssr";

import type { CupKind } from "@/lib/data/cups-mappers";

export const CUP_KIND_LABEL: Record<CupKind, string> = {
  coffee: "Coffee",
  drink: "Drink",
  food: "Food",
  space: "Space",
};

/** Coffee, another drink (tea, matcha), food, or the cafe itself. */
export default function CupKindIcon({
  kind,
  size = 14,
  className,
}: {
  kind: CupKind;
  size?: number;
  className?: string;
}) {
  const Icon = { coffee: Coffee, drink: TeaBag, food: Cookie, space: Armchair }[kind];
  return <Icon size={size} className={className} aria-hidden />;
}
