import React from "react";

/** Brand green used across the logo and app */
export const BRAND_GREEN = "#1d6f42";

/**
 * Sehat-Sarthi brand logo.
 * A heart with a medical cross on a brand-green circle, with a subtle
 * road/path motif underneath representing "Sarthi" (companion/guide).
 */
export function SehatSarthiLogo({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Sehat-Sarthi logo"
      role="img"
    >
      {/* Circular background */}
      <circle cx="24" cy="24" r="23" fill={BRAND_GREEN} />

      {/* Subtle road/path — "Sarthi" motif */}
      <path
        d="M18 43 L24 11 L30 43"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.25"
      />

      {/* Heart shape — "Sehat" motif */}
      <path
        d="M24 35 C24 35 11 27 11 19.5 C11 15.4 14.1 12 18.5 12 C20.8 12 22.8 13.2 24 15 C25.2 13.2 27.2 12 29.5 12 C33.9 12 37 15.4 37 19.5 C37 27 24 35 24 35Z"
        fill="white"
      />

      {/* Green cross inside heart */}
      <rect x="21.5" y="17.5" width="5" height="11" rx="1.5" fill={BRAND_GREEN} />
      <rect x="18.5" y="20.5" width="11" height="5" rx="1.5" fill={BRAND_GREEN} />
    </svg>
  );
}

/**
 * Wordmark — logo icon + text label side by side.
 * Use in headers and landing pages.
 */
export function SehatSarthiWordmark({
  size = 36,
  label = "Sehat-Sarthi",
  className = "",
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <SehatSarthiLogo size={size} />
      <span
        style={{ fontSize: size * 0.44, fontWeight: 700, color: BRAND_GREEN, letterSpacing: "-0.01em" }}
      >
        {label}
      </span>
    </div>
  );
}
