"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * A horizontally scrolling row that brings its current link
 * (`aria-current="page"`) into view on load, so a 1★ or Space filter chosen
 * past the right edge of a phone screen is visible as chosen.
 */
export default function ScrollToActive({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const row = ref.current;
    if (!row || row.scrollWidth <= row.clientWidth) return;
    const active = row.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active) return;
    const rowBox = row.getBoundingClientRect();
    const box = active.getBoundingClientRect();
    if (box.left >= rowBox.left && box.right <= rowBox.right) return;
    // Centre it; instant, not smooth: this is the page arriving, not a move.
    row.scrollLeft += box.left - rowBox.left - (rowBox.width - box.width) / 2;
  }, []);

  return (
    <div ref={ref} className={className} {...rest}>
      {children}
    </div>
  );
}
