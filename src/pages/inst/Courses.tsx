import { Music2, Target } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/layout/AdminShell";
import { Avatar, Button, Card, CardHeader, EmptyState, ProgressBar } from "@/components/ui";
import { LessonItem, LevelBadge } from "@/components/domain";
import { InstrumentBadge, InstrumentGlyph } from "@/components/InstrumentIcon";
import { Donut, LEVEL_RAMP } from "@/components/charts";
import { LEVELS, PIECES, instrumentById, levelName } from "@/data/catalog";
import type { InstrumentId } from "@/data/types";
import { progressOf } from "@/lib/selectors";
import { navigate } from "@/lib/router";
import { relativeDay, todayISO, addDays } from "@/lib/date";

export default function InstCourses() {
  const data = useStore((s) => s.data);
  const instId = useStore((s) => s.session.institutionId);
  const inst = data.institutions.find((i) => i.id === instId)!;
  return (
    <>
      <PageHeader title="Kurslar" subtitle={`${inst.name} · ${inst.courseIds.length} aktif kurs`} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {inst.courseIds.map((c) => {
          const ins = instrumentById[c];
          const n = data.students.filter((s) => s.institutionId === instId && s.instrument === c).length;
          return (
            <button
              key={c}
              onClick={() => navigate(`/inst/courses/${c}`)}
              title={`${ins.name} kursu detayı`}
              aria-label={`${ins.name} kursu, ${n} öğrenci`}
              className="group flex cursor-pointer flex-col items-center rounded-3xl border border-line bg-surface px-4 pt-8 pb-6 text-center shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-lift"
            >
              <span className="grid size-24 place-items-center rounded-[28px] transition duration-200 group-hover:scale-105" style={{ background: ins.tint, color: ins.tone }}>
                <InstrumentBadgeIcon id={c} />
              </span>
              <span className="mt-5 text-[16px] font-bold tracking-tight">{ins.name}</span>
              <span className="mt-1 text-xs font-medium text-muted">{n} öğrenci</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function InstrumentBadgeIcon({ id }: { id: InstrumentId }) {
  return <InstrumentGlyph id={id} size={46} strokeWidth={1.5} />;
}

export function CourseDetail({ id }: { id: string }) {
  const data = useStore((s) => s.data);
  const instId = useStore((s) => s.session.institutionId);
  const inst = data.institutions.find((i) => i.id === instId)!;
  if (!inst.courseIds.includes(id as InstrumentId))
    return <EmptyState icon={Music2} title="Bu kurs kurumunuzda bulunmuyor" action={<Button onClick={() => navigate("/inst/courses")}>Kurslara dön</Button>} className="py-24" />;
  const ins = instrumentById[id as InstrumentId];
  const students = data.students.filter((s) => s.institutionId === instId && s.instrument === ins.id);
  const teachers = data.teachers.filter((t) => t.institutionId === instId && t.specialties.includes(ins.id));
  const today = todayISO();
  const lessons = data.lessons
    .filter((l) => l.institutionId === instId && l.instrument === ins.id && l.status !== "cancelled" && l.date >= today && l.date <= addDays(today, 7))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const pieces = PIECES.filter((p) => p.instrument === ins.id);

  return (
    <>
      <PageHeader
        back={{ label: "Kurslar", to: "/inst/courses" }}
        title={
          <span className="flex items-center gap-4">
            <InstrumentBadge id={ins.id} size={56} rounded="rounded-2xl" />
            {ins.name}
          </span>
        }
        subtitle={`${students.length} öğrenci · ${teachers.length} öğretmen · ${pieces.length} repertuvar parçası`}
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Öğrenme hedefleri" icon={Target} />
          <ul className="space-y-2.5 p-5">
            {ins.goals.map((g, i) => (
              <li key={g} className="flex items-center gap-3 text-[13.5px]">
                <span className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold" style={{ background: ins.tint, color: ins.tone }}>
                  {i + 1}
                </span>
                {g}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Seviye dağılımı" />
          <div className="p-5">
            <Donut data={LEVELS.map((l) => ({ name: l.name, value: students.filter((s) => s.level === l.id).length }))} colors={LEVEL_RAMP} size={132} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Öğretmenler" />
          <ul className="space-y-1 p-3">
            {teachers.map((t) => (
              <li key={t.id}>
                <button onClick={() => navigate(`/inst/teachers/${t.id}`)} className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-canvas/70">
                  <Avatar name={t.name} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold">{t.name}</span>
                    <span className="text-xs text-muted">
                      {students.filter((s) => s.teacherId === t.id).length} öğrenci bu kursta
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Kayıtlı öğrenciler" />
          <div className="divide-y divide-line p-2">
            {students.map((s) => (
              <button key={s.id} onClick={() => navigate(`/inst/students/${s.id}`)} className="flex w-full cursor-pointer items-center gap-3 px-3 py-3 text-left hover:bg-canvas/50">
                <Avatar name={s.name} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold">{s.name}</span>
                  <span className="text-xs text-muted">{data.teachers.find((t) => t.id === s.teacherId)?.name}</span>
                </span>
                <LevelBadge level={s.level} />
                <span className="hidden w-28 sm:block">
                  <ProgressBar value={progressOf(s)} />
                </span>
              </button>
            ))}
            {students.length === 0 && <EmptyState icon={Music2} title="Bu kursta henüz öğrenci yok" />}
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="İlgili dersler" subtitle="Önümüzdeki 7 gün" />
            <div className="p-3">
              {lessons.slice(0, 6).map((l) => (
                <div key={l.id} className="flex items-center">
                  <span className="w-16 shrink-0 pl-2 text-[11px] font-semibold text-muted">{relativeDay(l.date)}</span>
                  <div className="min-w-0 flex-1">
                    <LessonItem lesson={l} />
                  </div>
                </div>
              ))}
              {lessons.length === 0 && <EmptyState icon={Music2} title="Planlı ders yok" />}
            </div>
          </Card>
          <Card>
            <CardHeader title="Repertuvar" />
            <ul className="space-y-1 p-3">
              {pieces.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 text-[13px]">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p.title}</span>
                    <span className="text-xs text-muted">{p.composer}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">{levelName(p.level)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
