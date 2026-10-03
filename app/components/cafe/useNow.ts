"use client";

import { useEffect, useState } from "react";

/** Current time, but only after mount and refreshed each minute. `new Date()`
 * during render disagrees between the server pass and hydration, so anything
 * time-dependent renders a neutral state until this resolves. */
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}
