/** The AgentRank Radar mark: a dot orbiting a center point, evoking continuous
 *  24/7 scanning. Center is the brand (violet); the orbiting dot is the radar
 *  signal (teal). Bridges the old violet-only brand into the new palette. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="6" className="fill-primary" />
      <ellipse
        cx="12"
        cy="12"
        rx="8.5"
        ry="4.2"
        transform="rotate(-25 12 12)"
        stroke="hsl(var(--teal))"
        strokeWidth="1.4"
        strokeOpacity="0.85"
      />
      <circle cx="12" cy="12" r="2.6" className="fill-primary-foreground" />
      <circle cx="18.4" cy="7.6" r="1.9" fill="hsl(var(--teal))" />
    </svg>
  );
}
