"use client";

export default function GlobalError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="screen stack-md">
      <section className="panel stack-sm">
        <h1>Something went wrong</h1>
        <p className="muted">
          An unexpected error occurred. You can retry or refresh the page.
        </p>
        <p className="muted">Reference: {props.error.digest ?? "no-digest"}</p>
        <button className="button" type="button" onClick={props.reset}>
          Try again
        </button>
      </section>
    </div>
  );
}
