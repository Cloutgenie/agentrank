/** The Agent Rank Radar mark: a dot orbiting a center point, evoking continuous
 *  24/7 scanning. Fully monochrome — solid badge in the foreground color with
 *  a background-color center dot and orbit ring, so it themes automatically
 *  and needs no manual recolor. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="6" className="fill-foreground" />
      <ellipse
        cx="12"
        cy="12"
        rx="8.5"
        ry="4.2"
        transform="rotate(-25 12 12)"
        className="stroke-background"
        strokeWidth="1.4"
        strokeOpacity="0.6"
      />
      <circle cx="12" cy="12" r="2.6" className="fill-background" />
      <circle cx="18.4" cy="7.6" r="1.9" className="fill-background" />
    </svg>
  );
}
