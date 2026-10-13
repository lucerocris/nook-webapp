import Image from "next/image";

/** A poster's photo, or their initial on the brand tint. Decorative: the
 * name is always printed beside it. */
export default function CupAvatar({
  name,
  url,
  size = 40,
}: {
  name: string;
  url: string | null;
  size?: number;
}) {
  const style = { width: size, height: size };
  if (url) {
    return (
      <span className="relative block shrink-0 overflow-hidden rounded-full bg-subtle" style={style}>
        <Image src={url} alt="" fill sizes={`${size}px`} className="object-cover" />
      </span>
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold text-brand"
      style={{ ...style, fontSize: Math.max(10, Math.round(size * 0.38)) }}
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
