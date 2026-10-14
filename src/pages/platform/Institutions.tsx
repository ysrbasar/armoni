import { ArrowRight, Building2, CalendarDays, GraduationCap, LogIn, MapPin, UsersRound } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/layout/AdminShell";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, StatCard } from "@/components/ui";
import { ActivityFeed } from "@/components/domain";
import { Donut, LEVEL_RAMP } from "@/components/charts";
import { InstrumentBadge } from "@/components/InstrumentIcon";
import { LEVELS, instrumentById } from "@/data/catalog";
import { navigate } from "@/lib/router";
import { todayISO } from "@/lib/date";

export default function PlatformInstitutions() {
  const data = useStore((s) => s.data);
  return (
    <>
      <PageHeader title="Kurumlar" subtitle={`Platformda ${data.institutions.length} kurum yönetiliyor`} />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data.institutions.map((inst) => {
          const st = data.students.filter((s) => s.institutionId === inst.id);
          const te = data.teachers.filter((t) => t.institutionId === inst.id);
          return (
            <Card key={inst.id} as="button" onClick={() => navigate(`/platform/institutions/${inst.id}`)} className="group cursor-pointer p-6 text-left transition hover:-translate-y-0.5 hover:shadow-lift">
              <div className="flex items-start justify-between">
                <span className="grid size-12 place-items-center rounded-2xl text-lg font-bold text-white" style={{ background: inst.accent }}>
                  {inst.short[0]}
                </span>
                <Badge tone={inst.plan === "Kurumsal" ? "brand" : inst.plan === "Profesyonel" ? "mint" : "neutral"}>{inst.plan}</Badge>
              </div>
              <h3 className="mt-4 text-[17px] font-bold tracking-tight">{inst.name}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
                <MapPin size={14} /> {inst.city} · {inst.branches.length} şube · {inst.founded}'ten beri
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3 border-y border-line py-4">
                {[
                  [st.length, "Öğrenci"],
                  [te.length, "Öğretmen"],
                  [inst.courseIds.length, "Kurs"],
                ].map(([v, l]) => (
                  <div key={l}>
                    <div className="text-xl font-bold tabular-nums">{v}</div>
                    <div className="text-xs text-muted">{l}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {inst.courseIds.map((c) => (
                    <InstrumentBadge key={c} id={c} size={30} rounded="rounded-full ring-2 ring-white" />
                  ))}
                </div>
                <ArrowRight size={18} className="text-faint transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

export function InstitutionDetail({ id }: { id: string }) {
  const data = useStore((s) => s.data);
  const login = useStore((s) => s.login);
  const setInstitution = useStore((s) => s.setInstitution);
  const toast = useStore((s) => s.toast);
  const inst = data.institutions.find((i) => i.id === id);
  if (!inst) return <EmptyState icon={Building2} title="Kurum bulunamadı" action={<Button onClick={() => navigate("/platform/institutions")}>Kurumlara dön</Button>} />;

  const st = data.students.filter((s) => s.institutionId === id);
  const te = data.teachers.filter((t) => t.institutionId === id);
  const todays = data.lessons.filter((l) => l.institutionId === id && l.date === todayISO() && l.status !== "cancelled");
  const levels = LEVELS.map((l) => ({ name: l.name, value: st.filter((s) => s.level === l.id).length }));

  const openAsAdmin = () => {
    setInstitution(id);
    login("inst");
    navigate("/inst");
    toast(`${inst.name} kurum paneli açıldı`, "info");
  };

  return (
    <>
      <PageHeader
        back={{ label: "Kurumlar", to: "/platform/institutions" }}
        title={
          <span className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl text-base font-bold text-white" style={{ background: inst.accent }}>
              {inst.short[0]}
            </span>
            {inst.name}
          </span>
        }
        subtitle={`${inst.city} · ${inst.plan} plan · Yönetici: ${inst.adminName}`}
        actions={
          <Button icon={LogIn} onClick={openAsAdmin}>
            Kurum paneline geç
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Öğrenci" value={st.length} icon={GraduationCap} tone="mint" />
        <StatCard label="Öğretmen" value={te.length} icon={UsersRound} tone="sky" />
        <StatCard label="Şube" value={inst.branches.length} icon={Building2} />
        <StatCard label="Bugünkü ders" value={todays.length} icon={CalendarDays} tone="sun" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Kurslar ve öğretmenler" />
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {inst.courseIds.map((c) => {
              const teachers = te.filter((t) => t.specialties.includes(c));
              return (
                <div key={c} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                  <InstrumentBadge id={c} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold">{instrumentById[c].name}</p>
                    <p className="truncate text-xs text-muted">{teachers.map((t) => t.name).join(", ") || "Öğretmen atanmadı"}</p>
                  </div>
                  <span className="text-right text-xs text-muted">
                    <b className="block text-sm text-ink tabular-nums">{st.filter((s) => s.instrument === c).length}</b>öğrenci
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <CardHeader title="Seviye dağılımı" />
          <div className="p-5">
            <Donut data={levels} colors={LEVEL_RAMP} size={148} />
          </div>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Şubeler" />
          <ul className="space-y-2 p-4">
            {inst.branches.map((b) => (
              <li key={b.id} className="rounded-xl bg-canvas p-3">
                <p className="text-[13.5px] font-semibold">{b.name}</p>
                <p className="text-xs text-muted">{b.address}</p>
                <p className="mt-1 text-xs text-ink-2">
                  {b.rooms} derslik · {st.filter((s) => s.branchId === b.id).length} öğrenci
                </p>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Öğretmen ekibi" />
          <ul className="space-y-1 p-3">
            {te.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                <Avatar name={t.name} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{t.name}</p>
                  <p className="truncate text-xs text-muted">{t.title}</p>
                </div>
                <span className="text-xs text-muted tabular-nums">{data.students.filter((s) => s.teacherId === t.id).length} öğr.</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Kurum aktiviteleri" />
          <div className="p-3">
            <ActivityFeed items={data.activities.filter((a) => a.institutionId === id).slice(0, 6)} />
          </div>
        </Card>
      </div>
    </>
  );
}
