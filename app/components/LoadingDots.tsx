/** Three bouncing dots ("typing indicator" style) shown while fetching.
 * Dots inherit the current text color (`bg-current`), so set the color on a
 * parent. Negative animation delays stagger the bounce. */
const DOT_DELAYS = ["-0.32s", "-0.16s", "0s"];

export default function LoadingDots({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={["inline-flex items-center gap-1", className]
        .filter(Boolean)
        .join(" ")}
    >
      {DOT_DELAYS.map((delay) => (
        <span
          key={delay}
          aria-hidden="true"
          className="nook-loading-dot h-1.5 w-1.5 rounded-full bg-current"
          style={{ animationDelay: delay }}
        />
      ))}
    </span>
  );
}
