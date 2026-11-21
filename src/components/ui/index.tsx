import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Info, X, AlertCircle, type LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/selectors";
import { useStore } from "@/store/useStore";

export const cn = (...v: ClassValue[]) => twMerge(clsx(v));

/* ---------- Kart ---------- */
export function Card({ className, children, as: As = "div", ...rest }: { className?: string; children: ReactNode; as?: "div" | "section" | "button" } & React.HTMLAttributes<HTMLElement>) {
  return (
    <As className={cn("rounded-2xl border border-line bg-surface shadow-card", className)} {...rest}>
      {children}
    </As>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon, className }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; icon?: LucideIcon; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 pt-5", className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-canvas text-ink-2">
            <Icon size={16} strokeWidth={1.9} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold tracking-tight text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ---------- Butonlar ---------- */
type Variant = "primary" | "secondary" | "ghost" | "soft" | "danger" | "mint";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-[0_1px_0_rgba(255,255,255,.15)_inset,0_1px_2px_rgba(49,40,127,.25)]",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-canvas hover:border-faint/60",
  ghost: "text-ink-2 hover:bg-canvas-2/70",
  soft: "bg-brand-50 text-brand-700 hover:bg-brand-100",
  danger: "bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white",
  mint: "bg-mint-500 text-white hover:bg-mint-600",
};

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg"; icon?: LucideIcon; iconRight?: LucideIcon }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45",
        size === "sm" && "h-8 px-3 text-[13px]",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-5 text-[15px]",
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {Icon && <Icon size={size === "sm" ? 15 : 17} strokeWidth={2} />}
      {children}
      {IconRight && <IconRight size={size === "sm" ? 15 : 17} strokeWidth={2} />}
    </button>
  );
}

export function IconButton({ icon: Icon, label, className, active, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl text-ink-2 transition-colors hover:bg-canvas-2 hover:text-ink disabled:opacity-40",
        active && "bg-brand-50 text-brand-700",
        className,
      )}
      {...rest}
    >
      <Icon size={18} strokeWidth={1.9} />
    </button>
  );
}

/* ---------- Rozet ---------- */
const TONES: Record<Tone, string> = {
  neutral: "bg-canvas-2 text-ink-2",
  brand: "bg-brand-50 text-brand-700",
  mint: "bg-mint-50 text-mint-700",
  sun: "bg-sun-50 text-sun-700",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600",
};
const DOTS: Record<Tone, string> = {
  neutral: "bg-faint",
  brand: "bg-brand-500",
  mint: "bg-mint-500",
  sun: "bg-sun-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
};

export function Badge({ tone = "neutral", children, dot, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", TONES[tone], className)}>
      {dot && <span className={cn("size-1.5 rounded-full", DOTS[tone])} />}
      {children}
    </span>
  );
}

/* ---------- Avatar ---------- */
const AVATAR_COLORS = [
  ["#ece9ff", "#4f3fd0"],
  ["#dff5ee", "#0b6b5b"],
  ["#fdf0d8", "#8a5d0b"],
  ["#fde8ee", "#b23256"],
  ["#e3eefc", "#2672bd"],
  ["#f2e8fa", "#7e3aa0"],
  ["#e2f3f5", "#16707f"],
];

export function Avatar({ name, size = 36, className, ring }: { name: string; size?: number; className?: string; ring?: boolean }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toLocaleUpperCase("tr");
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [bg, fg] = AVATAR_COLORS[h % AVATAR_COLORS.length];
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 place-items-center rounded-full font-bold tracking-tight select-none", ring && "ring-2 ring-white", className)}
      style={{ width: size, height: size, background: bg, color: fg, fontSize: Math.max(10, size * 0.36) }}
    >
      {initials}
    </span>
  );
}

/* ---------- İlerleme ---------- */
const BAR: Record<Tone, string> = {
  neutral: "bg-ink-2",
  brand: "bg-brand-500",
  mint: "bg-mint-500",
  sun: "bg-sun-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
};

export function ProgressBar({ value, tone = "brand", className, height = 6 }: { value: number; tone?: Tone; className?: string; height?: number }) {
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-canvas-2", className)} style={{ height }} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", BAR[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  color = "var(--color-brand-500)",
  track = "var(--color-canvas-2)",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(100, value) / 100)}
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/* ---------- İstatistik kartı ---------- */
const STAT_ICON: Record<Tone, string> = {
  neutral: "bg-canvas text-ink-2",
  brand: "bg-brand-50 text-brand-600",
  mint: "bg-mint-50 text-mint-600",
  sun: "bg-sun-50 text-sun-600",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600",
};

export function StatCard({ label, value, icon: Icon, hint, tone = "brand", onClick, className }: { label: string; value: ReactNode; icon: LucideIcon; hint?: ReactNode; tone?: Tone; onClick?: () => void; className?: string }) {
  return (
    <Card
      as={onClick ? "button" : "div"}
      onClick={onClick}
      className={cn("flex flex-col gap-3 p-4 text-left sm:gap-4 sm:p-5", onClick && "cursor-pointer transition hover:border-line-strong hover:shadow-lift active:scale-[0.98]", className)}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[12.5px] leading-snug font-medium text-muted sm:text-[13px]">{label}</span>
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl sm:size-9", STAT_ICON[tone])}>
          <Icon size={17} strokeWidth={1.9} />
        </span>
      </div>
      <div>
        <div className="text-[22px] leading-none font-bold tracking-tight text-ink tabular-nums sm:text-[28px]">{value}</div>
        {hint && <div className="mt-1.5 text-[11.5px] leading-snug text-muted sm:mt-2 sm:text-xs">{hint}</div>}
      </div>
    </Card>
  );
}

/* ---------- Boş durum ---------- */
export function EmptyState({ icon: Icon, title, text, action, className }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-10 text-center", className)}>
      <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-canvas text-faint">
        <Icon size={22} strokeWidth={1.7} />
      </span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {text && <p className="mt-1 max-w-xs text-[13px] text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="animate-fade-in absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          "animate-pop-in relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface shadow-pop sm:rounded-3xl",
          size === "sm" && "sm:max-w-md",
          size === "md" && "sm:max-w-xl",
          size === "lg" && "sm:max-w-3xl",
        )}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line-strong sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
          </div>
          <IconButton icon={X} label="Kapat" onClick={onClose} className="-mt-1 -mr-2" />
        </div>
        <div className={cn("scrollbar-thin flex-1 overflow-y-auto px-5 py-5 sm:px-6", !footer && "pb-[max(20px,env(safe-area-inset-bottom))]")}>{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-canvas/50 px-5 pt-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ---------- Form alanları ---------- */
export function Field({ label, error, children, hint, className }: { label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span> : hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-line-strong bg-surface px-3.5 text-base text-ink sm:text-sm placeholder:text-faint transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none";

export function Input({ className, invalid, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={cn(inputCls, "h-10", invalid && "border-rose-500", className)} {...rest} />;
}

export function Textarea({ className, invalid, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea className={cn(inputCls, "min-h-24 py-2.5", invalid && "border-rose-500", className)} {...rest} />;
}

export function Select({ className, invalid, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      className={cn(
        inputCls,
        "h-10 cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b7086%22 stroke-width=%222%22 stroke-linecap=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9 [background-color:var(--color-surface)]",
        invalid && "border-rose-500",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

/* ---------- Sekmeler ---------- */
export function Tabs<T extends string>({ tabs, value, onChange, className, size = "md" }: { tabs: { id: T; label: string; count?: number; icon?: LucideIcon }[]; value: T; onChange: (v: T) => void; className?: string; size?: "sm" | "md" }) {
  return (
    <div className={cn("no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-canvas-2/80 p-1", className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg font-semibold whitespace-nowrap transition",
            size === "md" ? "h-8 px-3 text-[13px]" : "h-7 px-2.5 text-xs",
            value === t.id ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink",
          )}
        >
          {t.icon && <t.icon size={14} strokeWidth={2} />}
          {t.label}
          {t.count !== undefined && <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", value === t.id ? "bg-brand-50 text-brand-700" : "bg-surface/70")}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Açılır menü ---------- */
export function Menu({ trigger, children, align = "right", width = 240 }: { trigger: (open: boolean) => ReactNode; children: (close: () => void) => ReactNode; align?: "left" | "right"; width?: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger(open)}</div>
      {open && (
        <div
          className={cn("animate-pop-in absolute top-full z-40 mt-2 rounded-2xl border border-line bg-surface p-1.5 shadow-pop", align === "right" ? "right-0" : "left-0")}
          style={{ width }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ icon: Icon, children, onClick, active, tone }: { icon?: LucideIcon; children: ReactNode; onClick: () => void; active?: boolean; tone?: "danger" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition",
        tone === "danger" ? "text-rose-600 hover:bg-rose-50" : "text-ink-2 hover:bg-canvas",
        active && "bg-brand-50 text-brand-700",
      )}
    >
      {Icon && <Icon size={16} strokeWidth={1.9} />}
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

/* ---------- Bildirimler ---------- */
export function Toaster() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:pr-6">
      {toasts.map((t) => {
        const Icon = t.tone === "success" ? CheckCircle2 : t.tone === "error" ? AlertCircle : Info;
        return (
          <div key={t.id} className="animate-slide-up pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl bg-ink py-3 pr-3 pl-4 text-sm text-white shadow-pop">
            <Icon size={18} className={t.tone === "success" ? "text-mint-100" : t.tone === "error" ? "text-rose-50" : "text-brand-200"} />
            <span className="flex-1">{t.text}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Kapat" className="cursor-pointer rounded-lg p-1 text-white/60 hover:text-white">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Bölüm başlığı ---------- */
export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="text-[15px] font-semibold tracking-tight text-ink">{children}</h2>
      {action}
    </div>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cn("size-1.5 rounded-full", i <= value ? "bg-sun-500" : "bg-line-strong")} />
      ))}
    </span>
  );
}
