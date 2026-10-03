"use client";

import Image from "next/image";
import { Check } from "@phosphor-icons/react";

import type { CafeSummary } from "@/lib/data/cafes-mappers";
import { formatDistance } from "@/lib/utils/format";
import { getTagIcon } from "@/lib/utils/tag-icon";

type TagRowProps = {
  kind: "tag";
  name: string;
  selected?: boolean;
  onClick?: () => void;
  as: "button" | "a";
  href?: string;
};

type CafeRowProps = {
  kind: "cafe";
  cafe: CafeSummary;
  onClick?: () => void;
  as: "button" | "a";
  href?: string;
};

type Props = TagRowProps | CafeRowProps;

const ICON_BG = "bg-brand-soft";
const ICON_FG = "text-brand";

function TagAvatar({ name }: { name: string }) {
  const Icon = getTagIcon(name);
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ICON_BG} ${ICON_FG}`}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line react-hooks/static-components -- getTagIcon returns a stable module-level reference */}
      <Icon size={18} weight="regular" />
    </span>
  );
}

function CafeAvatar({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  if (!src) {
    return (
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-subtle text-sm font-semibold text-muted"
        aria-hidden="true"
      >
        {alt.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-subtle">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="40px"
        className="object-cover"
      />
    </span>
  );
}

export default function SearchResultRow(props: Props) {
  const { onClick, as, href } = props;
  const className =
    "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-subtle";

  let content: React.ReactNode;
  if (props.kind === "tag") {
    content = (
      <>
        <TagAvatar name={props.name} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
          {props.name}
        </span>
        <span
          aria-hidden="true"
          className={[
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
            props.selected
              ? "border-brand bg-brand text-white"
              : "border-line-strong bg-white text-transparent",
          ].join(" ")}
        >
          <Check size={13} weight="bold" />
        </span>
      </>
    );
  } else {
    const { cafe } = props;
    const area = cafe.neighborhood ?? cafe.city;
    const distance = formatDistance(cafe.distanceMeters);
    content = (
      <>
        <CafeAvatar src={cafe.coverImage} alt={cafe.name} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">
            {cafe.name}
          </span>
          <span className="block truncate text-xs text-muted">
            {[cafe.address, area].filter(Boolean).join(" · ")}
          </span>
        </span>
        {distance ? (
          <span className="shrink-0 text-xs text-muted">{distance}</span>
        ) : null}
      </>
    );
  }

  if (as === "a") {
    return (
      <a href={href} onClick={onClick} className={className}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
