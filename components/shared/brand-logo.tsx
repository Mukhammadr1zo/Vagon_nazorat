// =====================================================
// VAGON NAZORAT — Custom brand logo (SVG)
// Vagon + temir yo'l relslari ikonografiyasi
// =====================================================

import { cn } from '@/lib/utils';

export function BrandLogo({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-label="Vagon Nazorat"
    >
      <defs>
        <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--brand-blue)" />
          <stop
            offset="100%"
            stopColor="color-mix(in oklab, var(--brand-blue) 70%, var(--brand-red))"
          />
        </linearGradient>
        <linearGradient id="logoWagon" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* Yumaloq fon */}
      <rect width="48" height="48" rx="11" fill="url(#logoBg)" />

      {/* Relslar (gorizontal chiziq) */}
      <line
        x1="6"
        y1="36"
        x2="42"
        y2="36"
        stroke="#fff"
        strokeOpacity="0.4"
        strokeWidth="1"
      />
      <line
        x1="6"
        y1="38.5"
        x2="42"
        y2="38.5"
        stroke="#fff"
        strokeOpacity="0.4"
        strokeWidth="1"
      />

      {/* Shpallar (relslar orasidagi vertikal chiziqlar) */}
      {[10, 17, 24, 31, 38].map((x, i) => (
        <line
          key={i}
          x1={x}
          y1="36"
          x2={x}
          y2="38.5"
          stroke="#fff"
          strokeOpacity="0.3"
          strokeWidth="0.6"
        />
      ))}

      {/* Vagon korpusi */}
      <rect
        x="10"
        y="14"
        width="28"
        height="18"
        rx="2"
        fill="url(#logoWagon)"
      />

      {/* Vagon derazasi */}
      <rect
        x="13"
        y="17"
        width="6"
        height="6"
        rx="0.8"
        fill="var(--brand-blue)"
        fillOpacity="0.6"
      />
      <rect
        x="21"
        y="17"
        width="6"
        height="6"
        rx="0.8"
        fill="var(--brand-blue)"
        fillOpacity="0.6"
      />
      <rect
        x="29"
        y="17"
        width="6"
        height="6"
        rx="0.8"
        fill="var(--brand-blue)"
        fillOpacity="0.6"
      />

      {/* Pastki chiziq (chassis) */}
      <rect x="10" y="28" width="28" height="2" fill="var(--brand-blue)" fillOpacity="0.4" />

      {/* G'ildiraklar */}
      <circle cx="16" cy="33" r="2.5" fill="var(--brand-blue)" />
      <circle cx="16" cy="33" r="1" fill="#fff" />
      <circle cx="32" cy="33" r="2.5" fill="var(--brand-blue)" />
      <circle cx="32" cy="33" r="1" fill="#fff" />

      {/* Yuqori signal (chiroq) — Signal Red */}
      <circle cx="35.5" cy="11" r="1.8" fill="var(--brand-red)" />
      <circle cx="35.5" cy="11" r="3" fill="var(--brand-red)" fillOpacity="0.25" />
    </svg>
  );
}

// Faqat ikonkacha (sidebar collapsed yoki favicon uchun)
export function BrandIcon({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <rect width="32" height="32" rx="8" fill="var(--brand-blue)" />
      <rect x="6" y="9" width="20" height="12" rx="1.5" fill="#fff" />
      <rect x="8" y="11" width="4" height="4" rx="0.5" fill="var(--brand-blue)" fillOpacity="0.6" />
      <rect x="14" y="11" width="4" height="4" rx="0.5" fill="var(--brand-blue)" fillOpacity="0.6" />
      <rect x="20" y="11" width="4" height="4" rx="0.5" fill="var(--brand-blue)" fillOpacity="0.6" />
      <circle cx="11" cy="22" r="2" fill="var(--brand-blue)" />
      <circle cx="11" cy="22" r="0.8" fill="#fff" />
      <circle cx="21" cy="22" r="2" fill="var(--brand-blue)" />
      <circle cx="21" cy="22" r="0.8" fill="#fff" />
      <circle cx="24" cy="7.5" r="1.4" fill="var(--brand-red)" />
    </svg>
  );
}
