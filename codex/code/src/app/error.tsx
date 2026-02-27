"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Route-level error boundary captured:", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="app-shell">
      <section className="surface p-6">
        <h1 className="text-2xl font-extrabold">Something went wrong</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          The request could not be completed. Try again.
        </p>
        <button className="btn btn-primary mt-4" onClick={reset} type="button">
          Retry
        </button>
      </section>
    </main>
  );
}
