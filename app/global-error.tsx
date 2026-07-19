"use client";

import { useEffect } from "react";

/** Last-resort boundary: catches failures in the root layout itself, so it must
 * render its own <html>/<body> — nothing above it survives. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/global-error]", error.digest, error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          padding: "1.5rem",
          textAlign: "center",
          background: "#ffffff",
          color: "#101514",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#3A5A40",
          }}
        >
          nook
        </p>
        <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 600 }}>
          Something went wrong
        </h1>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#3b3b3b" }}>
          The app failed to load. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "0.75rem",
            border: 0,
            borderRadius: "9999px",
            background: "#3A5A40",
            color: "#ffffff",
            padding: "0.75rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
