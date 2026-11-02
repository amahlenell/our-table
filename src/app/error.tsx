"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="empty-state" role="alert">
      <h1>Something needs a moment.</h1>
      <p>We couldn’t open this part of your kitchen. Please try again.</p>
      <button className="btn btn-primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
