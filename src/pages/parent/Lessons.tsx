import { CalendarClock, Check, Clock3, MapPin, NotebookText } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Badge, Card, CardHeader, EmptyState } from "@/components/ui";
import { InstrumentBadge } from "@/components/InstrumentIcon";
import { pieceById } from "@/data/catalog";
import { fmtDateLong, relativeDay, todayISO } from "@/lib/date";
import { useChild } from "./Overview";

const ATT = { present: ["Katıldı", "mint"], late: ["Geç kaldı", "sun"], absent: ["Katılmadı", "rose"] } as const;

export default function ParentLessons() {
  const data = useStore((s) => s.data);
  const child = useChild();
  const today = todayISO();
  const teacher = data.teachers.find((t) => t.id === child.teacherId)!;
  const lessons = data.lessons.filter((l) => l.studentId === child.id && l.status !== "cancelled");
  const upcoming = lessons.filter((l) => l.status === "scheduled" && l.date >= today).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const past = lessons.filter((l) => l.status === "completed").sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Dersler</h1>
        <p className="mt-1 text-sm text-muted">
          {child.name} · Öğretmen: {teacher.name}
        </p>
      </div>
      <Card>
        <CardHeader title="Yaklaşan dersler" icon={CalendarClock} />
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {upcoming.map((l) => (
            <div key={l.id} className="flex items-center gap-4 rounded-2xl border border-line p-4">
              <InstrumentBadge id={l.instrument} size={44} rounded="rounded-2xl" />
              <div>
                <p className="text-[15px] font-bold">{relativeDay(l.date)}</p>
                <p className="flex items-center gap-3 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={12} /> {l.start} · {l.duration} dk
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} /> {l.room}
                  </span>
                </p>
              </div>
            </div>
          ))}
          {upcoming.length === 0 && <EmptyState icon={CalendarClock} title="Planlı ders yok" className="sm:col-span-2" />}
        </div>
      </Card>
      <Card>
        <CardHeader title="Geçmiş ders özetleri" icon={NotebookText} />
        <div className="divide-y divide-line">
          {past.map((l) => {
            const [label, tone] = ATT[l.attendance ?? "present"];
            return (
              <div key={l.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[14px] font-semibold">{fmtDateLong(l.date)}</p>
                  <Badge tone={tone}>{label}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">{l.topic}</p>
                {l.notes && <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">{l.notes}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {l.pieceIds.map((p) => (
                    <span key={p} className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold">
                      {pieceById[p].title}
                    </span>
                  ))}
                  {l.gains.map((g) => (
                    <span key={g} className="inline-flex items-center gap-1 rounded-full bg-mint-50 px-2.5 py-1 text-xs font-semibold text-mint-700">
                      <Check size={11} strokeWidth={3} /> {g}
                    </span>
                  ))}
                </div>
                {l.nextGoal && <p className="mt-3 text-xs text-muted">Sonraki ders hedefi: <b className="text-ink-2">{l.nextGoal}</b></p>}
              </div>
            );
          })}
          {past.length === 0 && <EmptyState icon={NotebookText} title="Henüz tamamlanan ders yok" />}
        </div>
      </Card>
    </div>
  );
}
