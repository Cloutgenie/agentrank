import { clsx } from "clsx";

export function EdgePill({
  children,
  tone = "lime",
}: {
  children: React.ReactNode;
  tone?: "lime" | "warn" | "mute" | "danger";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        tone === "lime" && "bg-lime text-void",
        tone === "warn" && "bg-warn/20 text-warn",
        tone === "mute" && "bg-line text-mute",
        tone === "danger" && "bg-danger/15 text-danger"
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
  className,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const styles = clsx(
    "inline-flex items-center justify-center rounded-full bg-lime px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-void transition hover:bg-lime-dim disabled:cursor-not-allowed disabled:opacity-40",
    className
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={styles}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={styles}>
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
      className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-mist transition hover:border-lime/40 hover:text-lime disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-full border border-line bg-surface p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={clsx(
            "rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition",
            value === o.id ? "bg-lime text-void" : "text-mute hover:text-mist"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
