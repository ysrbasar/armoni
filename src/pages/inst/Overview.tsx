import { useState } from "react";
import { ArrowUpRight, BookOpen, CalendarClock, ClipboardCheck, GraduationCap, Plus, UsersRound } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/layout/AdminShell";
import { Avatar, Button, Card, CardHeader, EmptyState, StatCard } from "@/components/ui";
import { ActivityFeed, LessonItem, StudentFormModal } from "@/components/domain";
import { Donut, LEVEL_RAMP } from "@/components/charts";
import { LEVELS } from "@/data/catalog";
import { conflictIds, instStudents, instTeachers } from "@/lib/selectors";
import { navigate } from "@/lib/router";
import { fmtDateLong, relativeDay, todayISO } from "@/lib/date";

export default function InstOverview() {
  const data = useStore((s) => s.data);
  const instId = useStore((s) => s.session.institutionId);
  const inst = data.institutions.find((i) => i.id === instId)!;
  const [adding, setAdding] = useState(false);
  const students = instStudents(data, instId);
  const teachers = instTeachers(data, instId);
  const today = todayISO();
  const lessons = data.lessons.filter((l) => l.institutionId === instId && l.status !== "cancelled");
  const todays = lessons.filter((l) => l.date === today).sort((a, b) => a.start.localeCompare(b.start));
  const upcoming = lessons.filter((l) => l.date > today && l.status === "scheduled").sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 5);
  const conflicts = conflictIds(todays);
  const ids = new Set(students.map((s) => s.id));
  const asg = data.assignments.filter((a) => ids.has(a.studentId));
  const doneRate = Math.round((asg.filter((a) => a.status === "done").length / Math.max(asg.length, 1)) * 100);
  const levels = LEVELS.map((l) => ({ name: l.name, value: students.filter((s) => s.level === l.id).length }));

  return (
    <>
      <PageHeader
        title={`Günaydın, ${inst.adminName.split(" ")[0]}`}
        subtitle={`${inst.name} · ${fmtDateLong(today)}`}
        actions={
          <>
            <Button variant="secondary" icon={CalendarClock} onClick={() => navigate("/inst/calendar")}>
              Takvim
            </Button>
            <Button icon={Plus} onClick={() => setAdding(true)}>
              Öğrenci ekle
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Aktif öğrenci" value={students.length} icon={GraduationCap} tone="mint" onClick={() => navigate("/inst/students")} hint={`${inst.branches.length} şubede`} />
        <StatCard label="Öğretmen" value={teachers.length} icon={UsersRound} tone="sky" onClick={() => navigate("/inst/teachers")} hint={`Ort. ${(students.length / Math.max(1, teachers.length)).toFixed(1)} öğrenci`} />
        <StatCard label="Aktif kurs" value={inst.courseIds.length} icon={BookOpen} tone="brand" onClick={() => navigate("/inst/courses")} hint="Branş" />
        <StatCard label="Bugünkü ders" value={todays.length} icon={CalendarClock} tone="sun" onClick={() => navigate("/inst/calendar")} hint={conflicts.size ? `${conflicts.size / 2} çakışma var` : "Çakışma yok"} />
        <StatCard label="Ödev tamamlama" value={`%${doneRate}`} icon={ClipboardCheck} tone="mint" className="col-span-2 md:col-span-1" hint={`${asg.length} ödevden ${asg.filter((a) => a.status === "done").length} tamamlandı`} onClick={() => navigate("/inst/reports")} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Bugünkü dersler" subtitle={`${todays.length} ders`} action={<Button size="sm" variant="ghost" iconRight={ArrowUpRight} onClick={() => navigate("/inst/calendar")}>Takvim</Button>} />
          <div className="grid gap-x-4 p-3 md:grid-cols-2">
            {todays.length ? todays.map((l) => <LessonItem key={l.id} lesson={l} show="both" conflict={conflicts.has(l.id)} onClick={() => navigate("/inst/calendar")} />) : <EmptyState icon={CalendarClock} title="Bugün ders yok" className="md:col-span-2" />}
          </div>
        </Card>
        <Card>
          <CardHeader title="Seviye dağılımı" subtitle="Tüm öğrenciler" />
          <div className="p-5">
            <Donut data={levels} colors={LEVEL_RAMP} size={140} />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Öğretmen yükü" subtitle="Atanmış öğrenci / kapasite" />
          <ul className="space-y-3.5 p-5">
            {teachers.map((t) => {
              const n = students.filter((s) => s.teacherId === t.id).length;
              const ratio = n / t.capacity;
              return (
                <li key={t.id}>
                  <button onClick={() => navigate(`/inst/teachers/${t.id}`)} className="flex w-full cursor-pointer items-center gap-3 text-left">
                    <Avatar name={t.name} size={30} />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex justify-between text-[13px]">
                        <span className="truncate font-semibold">{t.name}</span>
                        <span className="text-muted tabular-nums">
                          {n}/{t.capacity}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-canvas-2">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, ratio * 100)}%`, background: ratio >= 0.85 ? "var(--color-sun-500)" : "var(--color-brand-500)" }} />
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Yaklaşan dersler" />
          <div className="p-3">
            {upcoming.map((l, i) => (
              <div key={l.id}>
                {upcoming[i - 1]?.date !== l.date && <p className="px-2 pt-2 text-[11px] font-semibold tracking-wide text-faint uppercase">{relativeDay(l.date)}</p>}
                <LessonItem lesson={l} show="both" />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Son aktiviteler" />
          <div className="p-3">
            <ActivityFeed items={data.activities.filter((a) => a.institutionId === instId).slice(0, 7)} />
          </div>
        </Card>
      </div>
      {adding && <StudentFormModal open onClose={() => setAdding(false)} institutionId={instId} />}
    </>
  );
}
