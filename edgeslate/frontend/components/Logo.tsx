import Link from "next/link";

/** Sharp slate / lime slash mark */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#0A0A0A" />
      <path d="M14 46 L34 14 H42 L22 46 Z" fill="#C8FF00" />
      <path d="M28 46 L48 14 H52 L32 46 Z" fill="#C8FF00" opacity="0.4" />
      <rect x="12" y="50" width="40" height="4" rx="1" fill="#C8FF00" />
    </svg>
  );
}

export function Logo({
  size = "md",
  href = "/",
}: {
  size?: "sm" | "md" | "lg";
  href?: string | null;
}) {
  const mark = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-12 w-12" : "h-9 w-9";
  const text = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-2xl";

  const inner = (
    <span className="inline-flex items-center gap-2.5">
      <span className="overflow-hidden rounded-[10px] ring-1 ring-lime/30">
        <LogoMark className={mark} />
      </span>
      <span className={`font-display uppercase tracking-tight text-mist ${text}`}>
        Edge<span className="text-lime">Slate</span>
      </span>
    </span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} className="inline-flex items-center" aria-label="EdgeSlate home">
      {inner}
    </Link>
  );
}
