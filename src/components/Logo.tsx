import { cn } from "./ui";

/** Armoni işareti: bir ses dalgası kemeri ve onu taşıyan nota başı */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9.5" fill="#4f3fd0" />
      <path d="M8.5 22c0-5.4 3.3-12.5 7.5-12.5S23.5 16.6 23.5 22" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M12.2 22c0-3.2 1.7-7.4 3.8-7.4s3.8 4.2 3.8 7.4" fill="none" stroke="#a99df8" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="21.2" r="2.3" fill="#7de3c4" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && <span className="text-[19px] font-extrabold tracking-[-0.03em] text-ink">armoni</span>}
    </span>
  );
}
