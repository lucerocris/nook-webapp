/**
 * Server-side error capture.
 *
 * The app previously had no error reporting of any kind — data-layer throws,
 * proxy auth failures and route-handler 500s all vanished into stdout with no
 * alerting. `onRequestError` is Next's hook for every server-side error,
 * including those swallowed by an error boundary.
 *
 * This currently emits structured JSON so Vercel's log drains can filter and
 * alert on it. To wire a real reporter (Sentry, Axiom, Highlight), install the
 * SDK, initialise it in `register()`, and forward from `onRequestError` — the
 * shape below already carries everything those SDKs need.
 */
import type { Instrumentation } from "next";

export function register() {
  // Runs once per server process, before any request is handled.
  // e.g. Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 })
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const err = error as Error & { digest?: string };

  console.error(
    JSON.stringify({
      level: "error",
      source: "onRequestError",
      message: err?.message ?? String(error),
      digest: err?.digest,
      stack: err?.stack,
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: context.renderSource,
      revalidateReason: context.revalidateReason,
    }),
  );

  // e.g. Sentry.captureException(error, { extra: { ...request, ...context } })
};
