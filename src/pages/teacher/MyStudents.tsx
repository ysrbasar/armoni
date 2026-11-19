import { useState } from "react";
import { Flag, GraduationCap, Music2, Search } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/layout/AdminShell";
import { Avatar, Card, EmptyState, Input, ProgressRing, Tabs, cn } from "@/components/ui";
import { LevelBadge } from "@/components/domain";
import { InstrumentBadge } from "@/components/InstrumentIcon";
import { LEVELS, instrumentById } from "@/data/catalog";
import { pieceCounts, progressOf, teacherStudents , ageText } from "@/lib/selectors";
import { diffDays, relativeDay, todayISO } from "@/lib/date";
import { navigate } from "@/lib/router";

export default function TeacherStudents() {
  const data = useStore((s) => s.data);
  const tid = useStore((s) => s.session.teacherId);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("all");
  const all = teacherStudents(data, tid);
  const students = all.filter((s) => (level === "all" || s.level === Number(level)) && s.name.toLocaleLowerCase("tr").includes(q.toLocaleLowerCase("tr")));
  return (
    <>
      <PageHeader title="Öğrencilerim" subtitle={`Size atanmış ${all.length} öğrenci`} />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Öğrenci ara" className="pl-9" aria-label="Öğrenci ara" />
        </div>
        <Tabs value={level} onChange={setLevel} tabs={[{ id: "all", label: "Tümü" }, ...LEVELS.filter((l) => all.some((s) => s.level === l.id)).map((l) => ({ id: String(l.id), label: l.name }))]} />
      </div>
      {students.length === 0 ? (
        <Card>
          <EmptyState icon={GraduationCap} title="Eşleşen öğrenci yok" />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {students.map((s) => {
            const pc = pieceCounts(data, s.id);
            const p = progressOf(s);
            const idle = diffDays(todayISO(), s.lastPractice);
            return (
              <Card key={s.id} as="button" onClick={() => navigate(`/teacher/students/${s.id}`)} className="cursor-pointer p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lift">
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} size={46} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold">{s.name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted">
                      <InstrumentBadge id={s.instrument} size={20} rounded="rounded-md" /> {instrumentById[s.instrument].name} · {ageText(s)}
                    </p>
                  </div>
                  <ProgressRing value={p} size={46} stroke={5}>
                    <span className="text-[11px] font-bold">%{p}</span>
                  </ProgressRing>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-canvas p-3 text-center">
                  <div>
                    <LevelBadge level={s.level} />
                    <p className="mt-1 text-[11px] text-muted">Seviye</p>
                  </div>
                  <div>
                    <p className="flex items-center justify-center gap-1 text-sm font-bold tabular-nums">
                      <Music2 size={13} className="text-mint-600" /> {pc.done}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">Tamamlanan parça</p>
                  </div>
                  <div>
                    <p className={cn("text-sm font-bold", idle >= 3 ? "text-sun-700" : "text-ink")}>{relativeDay(s.lastPractice)}</p>
                    <p className="mt-0.5 text-[11px] text-muted">Son çalışma</p>
                  </div>
                </div>
                <p className="mt-3 flex items-center gap-2 text-[13px] text-ink-2">
                  <Flag size={14} className="shrink-0 text-brand-500" />
                  <span className="truncate">
                    <span className="text-muted">Sonraki hedef:</span> {s.nextGoal}
                  </span>
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
