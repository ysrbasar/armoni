import { Repeat as RepeatIcon } from "lucide-react";
import { Field, Input, cn } from "@/components/ui";
import { MAX_SERIES, REPEATS, repeatText, seriesDates, type Repeat } from "@/lib/recurrence";

const short = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

/** Periyot seçimi: tek seferlik / haftada bir / iki haftada bir / ayda bir + bitiş tarihi ve önizleme */
export function RepeatFields({ date, repeat, until, onRepeat, onUntil, className }: { date: string; repeat: Repeat; until: string; onRepeat: (r: Repeat) => void; onUntil: (d: string) => void; className?: string }) {
  const dates = seriesDates(date, repeat, until);
  return (
    <div className={cn("rounded-2xl border border-line bg-canvas/50 p-4", className)}>
      <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-ink-2">
        <RepeatIcon size={15} /> Tekrar
      </p>
      <div className="flex flex-wrap gap-1.5">
        {REPEATS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onRepeat(r.id)}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1.5 text-[13px] font-semibold transition",
              repeat === r.id ? "border-brand-400 bg-brand-600 text-white" : "border-line bg-surface text-ink-2 hover:border-line-strong",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
      {repeat !== "once" && (
        <div className="mt-3 grid gap-3 sm:grid-cols-[180px_1fr] sm:items-end">
          <Field label="Bitiş tarihi">
            <Input type="date" value={until} min={date} onChange={(e) => onUntil(e.target.value)} />
          </Field>
          <div className="text-[12.5px] leading-snug">
            <p className="font-semibold text-brand-700">
              {repeatText(date, repeat)} · {dates.length} ders
            </p>
            <p className="text-muted">
              {dates.slice(0, 5).map(short).join(", ")}
              {dates.length > 5 && ` … ${short(dates[dates.length - 1])}`}
            </p>
            {dates.length >= MAX_SERIES && <p className="text-sun-700">Tek seferde en fazla {MAX_SERIES} ders oluşturulur.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
