import { Drum, Guitar, MicVocal, Music, Piano, type LucideProps } from "lucide-react";
import type { InstrumentId } from "@/data/types";
import { instrumentById } from "@/data/catalog";
import { cn } from "./ui";

/** Lucide çizgi diliyle uyumlu özel enstrüman ikonları */
function Violin({ size = 24, strokeWidth = 2, ...rest }: LucideProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d="M12 8C8.6 8 7.6 10.2 8.7 12.2c.5.9.4 1.6-.4 2.6-1.8 2.2-.7 6.7 3.7 6.7s5.5-4.5 3.7-6.7c-.8-1-.9-1.7-.4-2.6C16.4 10.2 15.4 8 12 8Z" />
      <path d="M12 8V3.2" />
      <path d="M12 3.2c0-.9.6-1.4 1.3-1.2.6.2.6.9.1 1.2" />
      <path d="M10.3 15.2v2.4M13.7 15.2v2.4" />
      <path d="M10.6 18.9h2.8" />
    </svg>
  );
}

function Baglama({ size = 24, strokeWidth = 2, ...rest }: LucideProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d="M4.3 19.7c-1.6-1.6-1.2-5.2 1.5-7.9 2.6-2.6 5.9-2.6 7.2-1.3s1.3 4.6-1.3 7.2c-2.7 2.7-6.3 3.1-7.4 2Z" />
      <path d="m12.6 11.4 7.2-7.2" />
      <path d="m18.4 2.6 3 3" />
      <path d="m19.2 5.9 1.2 1.2M16.9 3.6l1.2 1.2" />
      <circle cx="8.2" cy="15.8" r="1.3" />
    </svg>
  );
}

function Flute({ size = 24, strokeWidth = 2, ...rest }: LucideProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d="M2.8 18.4 18.4 2.8a1.4 1.4 0 0 1 2 0l.8.8a1.4 1.4 0 0 1 0 2L5.6 21.2a1.4 1.4 0 0 1-2 0l-.8-.8a1.4 1.4 0 0 1 0-2Z" />
      <circle cx="8.2" cy="15.8" r=".6" fill="currentColor" />
      <circle cx="10.6" cy="13.4" r=".6" fill="currentColor" />
      <circle cx="13" cy="11" r=".6" fill="currentColor" />
      <circle cx="18.2" cy="5.8" r=".9" />
    </svg>
  );
}

const ICONS: Record<InstrumentId, (p: LucideProps) => React.ReactNode> = {
  piano: Piano,
  guitar: Guitar,
  violin: Violin,
  baglama: Baglama,
  drums: Drum,
  voice: MicVocal,
  flute: Flute,
  theory: Music,
};

export function InstrumentGlyph({ id, size = 20, strokeWidth = 1.8, className }: { id: InstrumentId; size?: number; strokeWidth?: number; className?: string }) {
  const Icon = ICONS[id] ?? Music;
  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden />;
}

/** Renk zeminli enstrüman rozeti */
export function InstrumentBadge({ id, size = 40, rounded = "rounded-xl", className }: { id: InstrumentId; size?: number; rounded?: string; className?: string }) {
  const ins = instrumentById[id];
  return (
    <span
      className={cn("grid shrink-0 place-items-center", rounded, className)}
      style={{ width: size, height: size, background: ins.tint, color: ins.tone }}
      title={ins.name}
      aria-label={ins.name}
      role="img"
    >
      <InstrumentGlyph id={id} size={Math.round(size * 0.5)} strokeWidth={size > 56 ? 1.5 : 1.8} />
    </span>
  );
}
