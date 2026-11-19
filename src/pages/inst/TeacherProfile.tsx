import { useState } from "react";
import { Award, BriefcaseBusiness, GraduationCap, Mail, Pencil, Phone, ShieldAlert, UserRoundCog, UsersRound } from "lucide-react";
import { EditTeacherModal } from "@/components/EditTeacherModal";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/layout/AdminShell";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, IconButton, ProgressBar, Tabs } from "@/components/ui";
import { AssignTeacherModal, LessonItem, LevelBadge } from "@/components/domain";
import { InstrumentBadge } from "@/components/InstrumentIcon";
import { Donut, LEVEL_RAMP } from "@/components/charts";
import { LEVELS, instrumentById } from "@/data/catalog";
import { progressOf , ageText } from "@/lib/selectors";
import { navigate } from "@/lib/router";
import { relativeDay, todayISO } from "@/lib/date";
import type { Student } from "@/data/types";

export default function TeacherProfile({ id }: { id: string }) {
  const data = useStore((s) => s.data);
  const instId = useStore((s) => s.session.institutionId);
  const [level, setLevel] = useState<string>("all");
  const [assigning, setAssigning] = useState<Student | null>(null);
  const [editing, setEditing] = useState(false);
  const t = data.teachers.find((x) => x.id === id);
  if (!t || t.institutionId !== instId)
    return <EmptyState icon={ShieldAlert} title="Öğretmen bu kuruma ait değil" action={<Button onClick={() => navigate("/inst/teachers")}>Öğretmenlere dön</Button>} className="py-24" />;

  const students = data.students.filter((s) => s.teacherId === t.id);
  const shown = level === "all" ? students : students.filter((s) => s.level === Number(level));
  const upcoming = data.lessons
    .filter((l) => l.teacherId === t.id && l.status === "scheduled" && l.date >= todayISO())
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    .slice(0, 6);
  const courses = Array.from(new Set(students.map((s) => s.instrument)));

  return (
    <>
      <PageHeader
        back={{ label: "Öğretmenler", to: "/inst/teachers" }}
        title={t.name}
        subtitle={t.title}
        actions={
          <Button icon={Pencil} onClick={() => setEditing(true)}>
            Bilgileri düzenle
          </Button>
        }
      />
      <EditTeacherModal teacher={t} open={editing} onClose={() => setEditing(false)} />

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar name={t.name} size={88} />
              <p className="mt-4 text-lg font-bold">{t.name}</p>
              <p className="text-[13px] text-muted">{t.title}</p>
              {t.email && (
                <a href={`mailto:${t.email}`} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline">
                  <Mail size={13} /> {t.email}
                </a>
              )}
              {t.phone && (
                <a href={`tel:${t.phone.replace(/s/g, "")}`} className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline">
                  <Phone size={13} /> {t.phone}
                </a>
              )}
            </div>
            {t.bio ? (
              <p className="mt-5 text-[13px] leading-relaxed text-ink-2">{t.bio}</p>
            ) : (
              <button type="button" onClick={() => setEditing(true)} className="mt-5 w-full cursor-pointer rounded-xl border border-dashed border-line-strong p-3 text-[13px] text-muted hover:text-ink">
                {t.phone || t.email ? "Özgeçmiş henüz girilmedi." : "Telefon, e-posta ve özgeçmiş henüz girilmedi."} Eklemek için tıklayın.
              </button>
            )}
            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-5 text-center">
              <div>
                <p className="text-xl font-bold tabular-nums">{students.length}</p>
                <p className="text-[11px] text-muted">Öğrenci</p>
              </div>
              <div>
                <p className="text-xl font-bold tabular-nums">{t.experienceYears}</p>
                <p className="text-[11px] text-muted">Yıl deneyim</p>
              </div>
              <div>
                <p className="text-xl font-bold tabular-nums">{t.capacity - students.length}</p>
                <p className="text-[11px] text-muted">Boş kontenjan</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Uzmanlık" icon={Award} />
            <div className="space-y-4 p-5">
              <div className="flex flex-wrap gap-2">
                {t.specialties.map((s) => (
                  <span key={s} className="inline-flex items-center gap-2 rounded-xl border border-line py-1 pr-3 pl-1 text-[13px] font-semibold">
                    <InstrumentBadge id={s} size={28} rounded="rounded-lg" /> {instrumentById[s].name}
                  </span>
                ))}
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-muted">Öğretebildiği seviyeler</p>
                <div className="flex flex-wrap gap-1.5">
                  {LEVELS.map((l) => (
                    <span key={l.id} className={t.levels.includes(l.id) ? "" : "opacity-35"}>
                      <LevelBadge level={l.id} />
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-muted">Verdiği kurslar</p>
                <p className="text-[13px]">{(courses.length ? courses : t.specialties).map((c) => instrumentById[c].name).join(" · ")}</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Eğitim ve sertifikalar" icon={GraduationCap} />
            <ul className="space-y-3 p-5">
              {t.education.map((e) => (
                <li key={e.school}>
                  <p className="text-[13.5px] font-semibold">{e.school}</p>
                  <p className="text-xs text-muted">
                    {e.degree} · Mezuniyet {e.year}
                  </p>
                </li>
              ))}
              <li className="border-t border-line pt-3">
                <div className="flex flex-wrap gap-1.5">
                  {t.certificates.map((c) => (
                    <Badge key={c} tone="brand">
                      {c}
                    </Badge>
                  ))}
                </div>
              </li>
            </ul>
          </Card>

          <Card>
            <CardHeader title="Mesleki deneyim" icon={BriefcaseBusiness} />
            <ol className="relative m-5 ml-7 border-l-2 border-line">
              {t.experience.map((e, i) => (
                <li key={i} className="mb-4 ml-5 last:mb-0">
                  <span className="absolute -left-[6px] mt-1.5 size-2.5 rounded-full bg-brand-400 ring-4 ring-white" />
                  <p className="text-[13.5px] font-semibold">{e.role}</p>
                  <p className="text-xs text-muted">
                    {e.place} · {e.years}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Öğrencilerin seviye dağılımı" />
              <div className="p-5">
                <Donut data={LEVELS.map((l) => ({ name: l.name, value: students.filter((s) => s.level === l.id).length }))} colors={LEVEL_RAMP} size={132} />
              </div>
            </Card>
            <Card>
              <CardHeader title="Yaklaşan dersler" />
              <div className="p-3">
                {upcoming.map((l) => (
                  <div key={l.id} className="flex items-center">
                    <span className="w-20 shrink-0 pl-2 text-[11px] font-semibold text-muted">{relativeDay(l.date)}</span>
                    <div className="min-w-0 flex-1">
                      <LessonItem lesson={l} />
                    </div>
                  </div>
                ))}
                {upcoming.length === 0 && <EmptyState icon={UsersRound} title="Planlı ders yok" />}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Atanmış öğrenciler" subtitle={`${shown.length} öğrenci`} />
            <div className="px-5 pt-3">
              <Tabs
                size="sm"
                value={level}
                onChange={setLevel}
                tabs={[{ id: "all", label: "Tümü" }, ...LEVELS.map((l) => ({ id: String(l.id), label: l.name, count: students.filter((s) => s.level === l.id).length }))]}
              />
            </div>
            <div className="divide-y divide-line p-2">
              {shown.length === 0 && <EmptyState icon={UsersRound} title="Bu seviyede öğrenci yok" />}
              {shown.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-3 py-3">
                  <button onClick={() => navigate(`/inst/students/${s.id}`)} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left">
                    <Avatar name={s.name} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold">{s.name}</span>
                      <span className="text-xs text-muted">
                        {instrumentById[s.instrument].name} · {ageText(s)}
                      </span>
                    </span>
                  </button>
                  <LevelBadge level={s.level} />
                  <div className="hidden w-28 sm:block">
                    <ProgressBar value={progressOf(s)} />
                  </div>
                  <IconButton icon={UserRoundCog} label="Öğretmeni değiştir" onClick={() => setAssigning(s)} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      {assigning && <AssignTeacherModal open onClose={() => setAssigning(null)} student={assigning} />}
    </>
  );
}
