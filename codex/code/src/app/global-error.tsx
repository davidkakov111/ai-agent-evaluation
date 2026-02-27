"use client";

interface GlobalErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="antialiased">
        <main className="app-shell">
          <section className="surface p-6">
            <h1 className="text-2xl font-extrabold">Application error</h1>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              A fatal error occurred. Please retry or reload the page.
            </p>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">
              Reference: {error.digest ?? "unavailable"}
            </p>
            <button className="btn btn-primary mt-4" onClick={reset} type="button">
              Retry
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
