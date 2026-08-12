import React from "react";

/**
 * Sehat-Sarthi brand logo.
 * A red cross/heart combined with a road/path motif — "health companion on your journey".
 * Pure SVG, no external deps.
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
    >
      {/* Circular background */}
      <circle cx="24" cy="24" r="23" fill="#1d6f42" />

      {/* White road / path — two converging lines representing the "Sarthi" (companion/guide) */}
      <path d="M18 42 L24 10 L30 42" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.35" />

      {/* Heart shape — representing "Sehat" (health) */}
      <path
        d="M24 34 C24 34 12 26.5 12 19.5 C12 15.9 14.9 13 18.5 13 C20.6 13 22.5 14.1 24 15.8 C25.5 14.1 27.4 13 29.5 13 C33.1 13 36 15.9 36 19.5 C36 26.5 24 34 24 34Z"
        fill="white"
      />

      {/* Green cross inside heart */}
      <rect x="22" y="18" width="4" height="10" rx="1" fill="#1d6f42" />
      <rect x="19" y="21" width="10" height="4" rx="1" fill="#1d6f42" />
    </svg>
  );
}

/** Inline wordmark variant — logo + "Sehat-Sarthi" text side by side */
export function SehatSarthiWordmark({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <SehatSarthiLogo size={size} />
    </div>
  );
}
