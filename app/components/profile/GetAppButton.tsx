"use client";

import { useEffect, useState } from "react";
import { DownloadSimple } from "@phosphor-icons/react";

import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/app-links";
import { cn } from "@/lib/utils";

/** The store for this device: App Store on iPhone and iPad, Play on Android,
 * the download page (both badges and a QR) everywhere else. */
function storeFor(userAgent: string): string {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return APP_STORE_URL;
  if (/Android/i.test(userAgent) && PLAY_STORE_URL) return PLAY_STORE_URL;
  return "/download-app";
}

/**
 * "Get Nook": the page's one primary action. Server-rendered to the download
 * page so it works without JavaScript; on a phone it then points straight at
 * that phone's store.
 */
export default function GetAppButton({
  label = "Get Nook",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const [href, setHref] = useState("/download-app");

  useEffect(() => {
    // Reading the user agent has to wait for the browser; the first paint
    // keeps the server's link so hydration matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHref(storeFor(navigator.userAgent));
  }, []);

  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={cn(
        "flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover active:bg-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        className,
      )}
    >
      <DownloadSimple size={18} weight="bold" aria-hidden />
      {label}
    </a>
  );
}
