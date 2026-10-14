import { Flame, Lock, Music2, Sparkles, Target } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Card, ProgressBar, cn } from "@/components/ui";
import { achievementsOf } from "@/lib/achievements";
import { DAYS_SHORT, dayIndex, todayISO } from "@/lib/date";

export default function Achievements() {
  const data = useStore((s) => s.data);
  const sid = useStore((s) => s.session.studentId);
  const s = data.students.find((x) => x.id === sid)!;
  const list = achievementsOf(data, s);
  const earned = list.filter((a) => a.earned).length;
  const donePieces = data.studentPieces.filter((p) => p.studentId === s.id && p.status === "done").length;
  const ti = dayIndex(todayISO());
  const weekTotal = s.practiceWeek.reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-semibold text-muted">Kendi temponda ilerle</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.03em]">Başarılar</h1>
        <p className="mt-1 text-sm text-muted">Sıralama yok, yarış yok — yalnızca senin gelişimin.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Sparkles, label: "Rozet", value: `${earned}/${list.length}`, cls: "bg-brand-50 text-brand-600" },
          { icon: Flame, label: "Çalışma serisi", value: `${s.streak} gün`, cls: "bg-sun-50 text-sun-600" },
          { icon: Music2, label: "Tamamlanan parça", value: donePieces, cls: "bg-mint-50 text-mint-600" },
          { icon: Target, label: "Kazanım", value: s.skillsDone.length, cls: "bg-rose-50 text-rose-600" },
        ].map((x) => (
          <Card key={x.label} className="flex items-center gap-4 p-5">
            <span className={cn("grid size-12 place-items-center rounded-2xl", x.cls)}>
              <x.icon size={22} />
            </span>
            <div>
              <p className="text-2xl font-bold tabular-nums">{x.value}</p>
              <p className="text-xs text-muted">{x.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Bu haftanın çalışma serisi</p>
          <p className="text-xs text-muted">Toplam {weekTotal} dk · hedef günde {s.dailyGoal} dk</p>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {s.practiceWeek.map((m, i) => {
            const hit = m >= s.dailyGoal;
            return (
              <div key={i} className="text-center">
                <div
                  className={cn(
                    "mx-auto grid aspect-square w-full max-w-16 place-items-center rounded-2xl",
                    i > ti ? "border-2 border-dashed border-line" : hit ? "bg-sun-500 text-white" : m > 0 ? "bg-sun-100 text-sun-700" : "bg-canvas-2 text-faint",
                  )}
                >
                  {i <= ti && (hit ? <Flame size={20} /> : <span className="text-xs font-bold">{m}</span>)}
                </div>
                <p className={cn("mt-1.5 text-[11px] font-semibold", i === ti ? "text-ink" : "text-muted")}>{DAYS_SHORT[i]}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <h2 className="mt-8 mb-4 text-lg font-bold tracking-tight">Rozetler</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((a) => (
          <Card key={a.id} className={cn("flex items-center gap-4 p-5", !a.earned && "bg-canvas/50")}>
            <span className="relative grid size-16 shrink-0 place-items-center rounded-full" style={a.earned ? { background: a.tint, color: a.tone } : { background: "var(--color-canvas-2)", color: "var(--color-faint)" }}>
              <a.icon size={26} strokeWidth={1.7} />
              {!a.earned && (
                <span className="absolute -right-0.5 -bottom-0.5 grid size-6 place-items-center rounded-full bg-surface text-faint shadow-card">
                  <Lock size={11} />
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-[14.5px] font-bold", !a.earned && "text-ink-2")}>{a.title}</p>
              <p className="text-xs text-muted">{a.text}</p>
              {!a.earned && (
                <div className="mt-2 flex items-center gap-2">
                  <ProgressBar value={(a.current / a.target) * 100} height={5} />
                  <span className="text-[11px] font-semibold text-muted tabular-nums">
                    {a.current}/{a.target}
                  </span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
