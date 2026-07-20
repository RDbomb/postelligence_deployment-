"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: catches errors thrown by the ROOT layout itself, which
 * `app/error.tsx` cannot handle because it renders inside that layout.
 *
 * Because it replaces the root layout, it must render its own <html>/<body> and
 * cannot assume globals.css loaded. Every brand value below is therefore inlined
 * to mirror the design system: #f6f7f1 ground with teal/coral washes, Inter,
 * -0.04em display tracking, and the pill CTA.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Fatal application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background:
            "linear-gradient(135deg, rgba(43, 114, 100, 0.08), transparent 34%), linear-gradient(315deg, rgba(208, 89, 69, 0.07), transparent 30%), #f6f7f1",
          color: "#1f2528",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div style={{ width: "100%", maxWidth: "34rem", textAlign: "center" }}>
          <p
            style={{
              color: "#d05945",
              fontSize: "0.78rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Application error
          </p>

          <h1
            style={{
              color: "#191f23",
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              margin: "1rem 0 0",
            }}
          >
            Postelligence didn&apos;t start.
          </h1>

          <p
            style={{
              color: "#5a656c",
              fontSize: "1rem",
              lineHeight: 1.65,
              margin: "1.25rem auto 0",
              maxWidth: "28rem",
            }}
          >
            The app failed to load. Reloading usually clears it — if it keeps
            happening, send the reference below to support.
          </p>

          {error.digest && (
            <p
              style={{
                display: "inline-block",
                border: "1px solid rgba(31, 37, 40, 0.1)",
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                borderRadius: "999px",
                padding: "0.375rem 1rem",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "11px",
                color: "#5a656c",
                margin: "1.5rem 0 0",
              }}
            >
              Reference {error.digest}
            </p>
          )}

          <div style={{ marginTop: "2.25rem" }}>
            <button
              onClick={reset}
              style={{
                alignItems: "center",
                background: "#1f2528",
                border: "none",
                borderRadius: "999px",
                color: "#ffffff",
                cursor: "pointer",
                display: "inline-flex",
                fontSize: "0.92rem",
                fontWeight: 600,
                justifyContent: "center",
                minHeight: "3rem",
                padding: "0.75rem 1.5rem",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
