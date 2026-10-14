import { Check, MessageCircle, Music2, TrendingUp } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Avatar, Card, CardHeader, EmptyState, Stars, cn } from "@/components/ui";
import { SimpleBars } from "@/components/charts";
import { levelName, pieceById, skillById } from "@/data/catalog";
import { piecesOf } from "@/lib/selectors";
import { DAYS_SHORT, dayIndex, fmtDate, todayISO } from "@/lib/date";
import { useChild } from "./Overview";

export default function ParentProgress() {
  const data = useStore((s) => s.data);
  const child = useChild();
  const ti = dayIndex(todayISO());
  const week = child.practiceWeek.map((m, i) => ({ name: DAYS_SHORT[i], value: i > ti ? 0 : m }));
  const total = week.reduce((a, b) => a + b.value, 0);
  const goalDays = child.practiceWeek.filter((m, i) => i <= ti && m >= child.dailyGoal).length;
  const donePieces = piecesOf(data, child.id).filter((p) => p.status === "done");
  const recentSkills = [...child.skillsDone].reverse().slice(0, 8);
  const feedback = data.assignments.filter((a) => a.studentId === child.id && a.feedback);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Gelişim</h1>
        <p className="mt-1 text-sm text-muted">{child.name} · haftalık çalışma, tamamlanan parçalar ve öğretmen geri bildirimleri</p>
      </div>

      <Card>
        <CardHeader title="Haftalık çalışma özeti" subtitle={`Toplam ${total} dakika · ${goalDays} gün günlük hedefe (${child.dailyGoal} dk) ulaştı`} />
        <div className="px-3 pt-4 pb-3">
          <SimpleBars data={week} valueLabel="Çalışma" unit=" dk" height={200} color="#14a38b" />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Tamamlanan parçalar" icon={Music2} />
          <ul className="space-y-1 p-3">
            {donePieces.map((sp) => (
              <li key={sp.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                <span className="grid size-8 place-items-center rounded-full bg-mint-50 text-mint-600">
                  <Check size={15} strokeWidth={2.6} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold">{pieceById[sp.pieceId].title}</p>
                  <p className="text-xs text-muted">{pieceById[sp.pieceId].composer}</p>
                </div>
                {sp.completedAt && <span className="text-xs text-muted">{fmtDate(sp.completedAt)}</span>}
              </li>
            ))}
            {donePieces.length === 0 && <EmptyState icon={Music2} title="Henüz tamamlanan parça yok" />}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Kazanılan teknik beceriler" subtitle={`${child.skillsDone.length} kazanım`} />
          <div className="flex flex-wrap gap-2 p-5">
            {recentSkills.map((id) => (
              <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-mint-50 px-3 py-1.5 text-xs font-semibold text-mint-700">
                <Check size={12} strokeWidth={3} /> {skillById[id]?.title}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Seviye ilerlemesi" icon={TrendingUp} />
          <ol className="relative m-5 ml-8 border-l-2 border-line">
            {[...child.levelHistory].reverse().map((h, i) => (
              <li key={i} className="mb-5 ml-5 last:mb-0">
                <span className={cn("absolute -left-[7px] mt-1 size-3 rounded-full ring-4 ring-white", i === 0 ? "bg-brand-500" : "bg-line-strong")} />
                <p className="text-sm font-semibold">{levelName(h.level)}</p>
                <p className="text-xs text-muted">
                  {fmtDate(h.date)} · {i === 0 ? "Mevcut seviye" : "Öğretmen onayıyla"}
                </p>
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <CardHeader title="Öğretmen geri bildirimleri" icon={MessageCircle} />
          <ul className="space-y-3 p-5">
            {child.evaluations.map((e) => (
              <li key={e.id} className="rounded-2xl bg-canvas p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-semibold text-muted">
                    <Avatar name={data.teachers.find((t) => t.id === e.teacherId)?.name ?? "?"} size={22} /> {fmtDate(e.date)}
                  </span>
                  <Stars value={e.rating} />
                </div>
                <p className="text-[13.5px] text-ink-2">{e.text}</p>
              </li>
            ))}
            {feedback.slice(0, 3).map((a) => (
              <li key={a.id} className="rounded-2xl border border-line p-4">
                <p className="text-xs font-semibold text-muted">Ödev: {a.title}</p>
                <p className="mt-1 text-[13.5px] text-ink-2">“{a.feedback}”</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
