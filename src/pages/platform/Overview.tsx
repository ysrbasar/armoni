import { useMemo, useState } from "react";
import { ArrowUpRight, BookOpen, Building2, GraduationCap, UsersRound } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/layout/AdminShell";
import { Card, CardHeader, StatCard, Tabs, Button } from "@/components/ui";
import { ActivityFeed } from "@/components/domain";
import { CATEGORICAL, SimpleBars } from "@/components/charts";
import { INSTRUMENTS } from "@/data/catalog";
import { InstrumentBadge } from "@/components/InstrumentIcon";
import { navigate } from "@/lib/router";
import { todayISO, weekStart, addDays } from "@/lib/date";

export default function PlatformOverview() {
  const data = useStore((s) => s.data);
  const [filter, setFilter] = useState("all");
  const scope = (instId: string) => filter === "all" || filter === instId;

  const students = data.students.filter((s) => scope(s.institutionId));
  const teachers = data.teachers.filter((t) => scope(t.institutionId));
  const insts = data.institutions.filter((i) => scope(i.id));
  const activeCourses = insts.reduce((a, i) => a + i.courseIds.length, 0);

  const ws = weekStart(todayISO());
  const we = addDays(ws, 6);
  const courseStats = useMemo(
    () =>
      INSTRUMENTS.map((ins) => ({
        ins,
        students: students.filter((s) => s.instrument === ins.id).length,
        lessons: data.lessons.filter((l) => l.instrument === ins.id && scope(l.institutionId) && l.date >= ws && l.date <= we && l.status !== "cancelled").length,
      }))
        .filter((c) => c.students > 0)
        .sort((a, b) => b.lessons - a.lessons || b.students - a.students),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [students, data.lessons, filter],
  );

  const distribution = data.institutions.map((i) => ({
    name: i.short,
    value: data.students.filter((s) => s.institutionId === i.id).length,
  }));

  return (
    <>
      <PageHeader
        title="Kontrol merkezi"
        subtitle="Platformdaki tüm kurumların anlık görünümü"
        actions={
          <Tabs
            value={filter}
            onChange={setFilter}
            tabs={[{ id: "all", label: "Tüm kurumlar" }, ...data.institutions.map((i) => ({ id: i.id, label: i.short }))]}
          />
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Kurum" value={insts.length} icon={Building2} hint={`${insts.reduce((a, i) => a + i.branches.length, 0)} şube`} onClick={() => navigate("/platform/institutions")} />
        <StatCard label="Öğrenci" value={students.length} icon={GraduationCap} tone="mint" hint="Aktif kayıtlı" onClick={() => navigate("/platform/users")} />
        <StatCard label="Öğretmen" value={teachers.length} icon={UsersRound} tone="sky" hint={`Öğretmen başına ${(students.length / Math.max(teachers.length, 1)).toFixed(1)} öğrenci`} />
        <StatCard label="Aktif kurs" value={activeCourses} icon={BookOpen} tone="sun" hint={`${courseStats.length} farklı branş`} onClick={() => navigate("/platform/categories")} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Branşlara göre öğrenci" subtitle={filter === "all" ? "Tüm kurumlar" : data.institutions.find((i) => i.id === filter)?.name} />
          <div className="px-3 pt-4 pb-3">
            <SimpleBars
              data={courseStats.map((c) => ({ name: c.ins.short, value: c.students }))}
              valueLabel="Öğrenci"
              height={260}
              colors={courseStats.map((c) => c.ins.tone)}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Kurumlara göre dağılım" subtitle="Öğrenci sayısı" />
          <div className="space-y-4 p-5">
            {distribution.map((d, i) => {
              const inst = data.institutions[i];
              const max = Math.max(...distribution.map((x) => x.value));
              return (
                <button key={d.name} onClick={() => navigate(`/platform/institutions/${inst.id}`)} className="block w-full cursor-pointer text-left">
                  <div className="mb-1.5 flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="size-2.5 rounded-[3px]" style={{ background: CATEGORICAL[i] }} />
                      {inst.name}
                    </span>
                    <span className="font-semibold tabular-nums">{d.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-canvas-2">
                    <div className="h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, background: CATEGORICAL[i] }} />
                  </div>
                  <p className="mt-1 text-[11.5px] text-muted">
                    {data.teachers.filter((t) => t.institutionId === inst.id).length} öğretmen · {inst.city} · {inst.plan}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="En aktif kurslar" subtitle="Bu haftaki ders sayısına göre" />
          <ul className="space-y-1 p-3">
            {courseStats.slice(0, 6).map((c, i) => (
              <li key={c.ins.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                <span className="w-4 text-xs font-semibold text-faint tabular-nums">{i + 1}</span>
                <InstrumentBadge id={c.ins.id} size={34} />
                <span className="flex-1 text-[13.5px] font-semibold">{c.ins.name}</span>
                <span className="text-right text-xs text-muted">
                  <b className="text-[13px] text-ink tabular-nums">{c.lessons}</b> ders
                  <br />
                  {c.students} öğrenci
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Son aktiviteler" action={<Button size="sm" variant="ghost" iconRight={ArrowUpRight} onClick={() => navigate("/platform/activity")}>Tümü</Button>} />
          <div className="p-3">
            <ActivityFeed items={data.activities.filter((a) => scope(a.institutionId)).slice(0, 6)} showInstitution />
          </div>
        </Card>
        <Card>
          <CardHeader title="Kurumlar" subtitle="Hızlı geçiş" />
          <ul className="space-y-2 p-4">
            {data.institutions.map((inst) => (
              <li key={inst.id}>
                <button
                  onClick={() => navigate(`/platform/institutions/${inst.id}`)}
                  className="group flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-line p-3 text-left transition hover:border-line-strong hover:bg-canvas/50"
                >
                  <span className="grid size-10 place-items-center rounded-xl text-sm font-bold text-white" style={{ background: inst.accent }}>
                    {inst.short[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold">{inst.name}</span>
                    <span className="block text-xs text-muted">
                      {inst.city} · {inst.courseIds.length} kurs · {inst.plan}
                    </span>
                  </span>
                  <ArrowUpRight size={16} className="text-faint transition group-hover:text-brand-600" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
