import { clsx } from "clsx";

export function EdgeBadge({ children, tone = "edge" }: { children: React.ReactNode; tone?: "edge" | "warn" | "ink" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide",
        tone === "edge" && "bg-edge/15 text-edge-dim",
        tone === "warn" && "bg-warn/20 text-amber-800",
        tone === "ink" && "bg-ink/10 text-ink"
      )}
    >
      {children}
    </span>
  );
}

export function PrimaryButton({
  children,
  href,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const className =
    "inline-flex items-center justify-center rounded-md bg-edge px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-edge-dim disabled:cursor-not-allowed disabled:opacity-50";
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-md border border-ink/15 bg-white/70 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
