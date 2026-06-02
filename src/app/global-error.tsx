"use client";

/**
 * Last-resort error boundary. Replaces the root layout when an error escapes
 * even the segment boundaries, so it must render its own <html>/<body>. Uses
 * inline Violet Haze colors since global stylesheets may not have applied.
 */
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="h-full">
      <body
        className="h-full antialiased"
        style={{ backgroundColor: "#0b0a0e", color: "#f6f5fa" }}
      >
        <div
          style={{
            display: "flex",
            height: "100%",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            padding: "0 24px",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>
              Something went wrong
            </p>
            <p
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "#6e6b7a",
                maxWidth: "20rem",
                margin: 0,
              }}
            >
              The app hit an unexpected error. Try again, or refresh the page.
            </p>
          </div>
          <button
            onClick={() => reset()}
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#f6f5fa",
              backgroundColor: "#1b1a1f",
              border: "1px solid #29272f",
              borderRadius: "10px",
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
