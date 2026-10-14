import { useState } from "react";
import { CalendarCheck2, Check, CheckCircle2, Save, ShieldAlert } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/layout/AdminShell";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Field, Input, Tabs, Textarea, cn } from "@/components/ui";
import { LessonItem } from "@/components/domain";
import { InstrumentBadge } from "@/components/InstrumentIcon";
import { instrumentById, levelName, pieceById } from "@/data/catalog";
import { attendanceOf, piecesOf, skillsFor } from "@/lib/selectors";
import { addDays, fmtDateLong, relativeDay, todayISO } from "@/lib/date";
import { navigate } from "@/lib/router";
import type { Attendance } from "@/data/types";

type Tab = "today" | "upcoming" | "past";

export default function TeacherLessons() {
  const data = useStore((s) => s.data);
  const tid = useStore((s) => s.session.teacherId);
  const [tab, setTab] = useState<Tab>("today");
  const today = todayISO();
  const mine = data.lessons.filter((l) => l.teacherId === tid);
  const groups: Record<Tab, typeof mine> = {
    today: mine.filter((l) => l.date === today),
    upcoming: mine.filter((l) => l.date > today && l.date <= addDays(today, 14)),
    past: mine.filter((l) => l.date < today),
  };
  const list = [...groups[tab]].sort((a, b) => (tab === "past" ? (b.date + b.start).localeCompare(a.date + a.start) : (a.date + a.start).localeCompare(b.date + b.start)));
  const byDay = list.reduce<Record<string, typeof list>>((acc, l) => ((acc[l.date] ??= []).push(l), acc), {});

  return (
    <>
      <PageHeader title="Derslerim" subtitle="Dersleri işleyin, not ekleyin ve tamamlandı olarak işaretleyin" />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "today", label: "Bugün", count: groups.today.length },
          { id: "upcoming", label: "Yaklaşan", count: groups.upcoming.length },
          { id: "past", label: "Geçmiş", count: groups.past.length },
        ]}
      />
      {list.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarCheck2} title="Bu listede ders yok" />
        </Card>
      ) : (
        <div className="space-y-5">
          {Object.entries(byDay).map(([date, items]) => (
            <Card key={date}>
              <CardHeader title={relativeDay(date)} subtitle={fmtDateLong(date)} />
              <div className="p-3">
                {items.map((l) => (
                  <LessonItem key={l.id} lesson={l} onClick={() => navigate(`/teacher/lessons/${l.id}`)} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

const ATTENDANCE: { id: Attendance; label: string }[] = [
  { id: "present", label: "Katıldı" },
  { id: "late", label: "Geç kaldı" },
  { id: "absent", label: "Gelmedi" },
];

export function LessonDetail({ id }: { id: string }) {
  const data = useStore((s) => s.data);
  const tid = useStore((s) => s.session.teacherId);
  const updateLesson = useStore((s) => s.updateLesson);
  const completeLesson = useStore((s) => s.completeLesson);
  const lesson = data.lessons.find((l) => l.id === id);
  const [form, setForm] = useState(() => ({
    topic: lesson?.topic ?? "",
    pieceIds: lesson?.pieceIds ?? [],
    gains: lesson?.gains ?? [],
    notes: lesson?.notes ?? "",
    attendance: lesson?.attendance ?? ("present" as Attendance),
    nextGoal: lesson?.nextGoal ?? "",
  }));
  if (!lesson || lesson.teacherId !== tid)
    return <EmptyState icon={ShieldAlert} title="Bu ders size ait değil" action={<Button onClick={() => navigate("/teacher/lessons")}>Derslerime dön</Button>} className="py-24" />;

  const st = data.students.find((s) => s.id === lesson.studentId)!;
  const pieces = piecesOf(data, st.id);
  const skills = skillsFor(st).filter((k) => k.stage === st.level || k.stage === st.level - 1);
  const toggle = (key: "pieceIds" | "gains", v: string) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(v) ? f[key].filter((x) => x !== v) : [...f[key], v] }));
  const done = lesson.status === "completed";

  return (
    <>
      <PageHeader
        back={{ label: "Derslerim", to: "/teacher/lessons" }}
        title={
          <span className="flex items-center gap-3">
            <InstrumentBadge id={lesson.instrument} size={44} />
            {st.name}
          </span>
        }
        subtitle={`${fmtDateLong(lesson.date)} · ${lesson.start} · ${lesson.duration} dk · ${lesson.room}`}
        actions={
          <>
            {done && (
              <Badge tone="mint">
                <CheckCircle2 size={13} /> Tamamlandı
              </Badge>
            )}
            <Button variant="secondary" icon={Save} onClick={() => updateLesson(lesson.id, form)}>
              Kaydet
            </Button>
            {!done && (
              <Button variant="mint" icon={Check} onClick={() => completeLesson(lesson.id, form)}>
                Dersi tamamla
              </Button>
            )}
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-5">
            <Field label="Ders konusu">
              <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
            </Field>
            <p className="mt-5 mb-2 text-[13px] font-semibold text-ink-2">İşlenen parçalar</p>
            <div className="flex flex-wrap gap-2">
              {pieces.map((sp) => {
                const on = form.pieceIds.includes(sp.pieceId);
                return (
                  <button
                    key={sp.id}
                    onClick={() => toggle("pieceIds", sp.pieceId)}
                    aria-pressed={on}
                    className={cn("inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border px-3 text-[13px] font-semibold transition", on ? "border-brand-300 bg-brand-50 text-brand-700" : "border-line text-ink-2 hover:border-line-strong")}
                  >
                    {on && <Check size={14} strokeWidth={2.6} />}
                    {pieceById[sp.pieceId].title}
                  </button>
                );
              })}
              {pieces.length === 0 && <p className="text-xs text-muted">Öğrenciye atanmış parça yok.</p>}
            </div>
            <p className="mt-5 mb-2 text-[13px] font-semibold text-ink-2">Teknik kazanımlar</p>
            <div className="flex flex-wrap gap-2">
              {skills.map((k) => {
                const on = form.gains.includes(k.title);
                return (
                  <button
                    key={k.id}
                    onClick={() => toggle("gains", k.title)}
                    aria-pressed={on}
                    className={cn("inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border px-3 text-[13px] font-semibold transition", on ? "border-mint-500 bg-mint-50 text-mint-700" : "border-line text-ink-2 hover:border-line-strong")}
                  >
                    {on && <Check size={14} strokeWidth={2.6} />}
                    {k.title}
                  </button>
                );
              })}
            </div>
          </Card>
          <Card className="p-5">
            <Field label="Öğretmen notları" hint="Notlar veli ekranında ders özeti olarak görünür">
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Derste neler yapıldı, nelere dikkat edilmeli?" className="min-h-32" />
            </Field>
            <Field label="Bir sonraki ders hedefi" className="mt-4">
              <Input value={form.nextGoal} onChange={(e) => setForm({ ...form, nextGoal: e.target.value })} placeholder="Örn. İkinci bölüm, eller birlikte" />
            </Field>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-5">
            <p className="mb-2 text-[13px] font-semibold text-ink-2">Devam durumu</p>
            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-canvas-2/80 p-1">
              {ATTENDANCE.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setForm({ ...form, attendance: a.id })}
                  className={cn(
                    "h-9 cursor-pointer rounded-lg text-[12.5px] font-semibold transition",
                    form.attendance === a.id ? (a.id === "absent" ? "bg-rose-500 text-white" : a.id === "late" ? "bg-sun-500 text-white" : "bg-mint-500 text-white") : "text-muted hover:text-ink",
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <button onClick={() => navigate(`/teacher/students/${st.id}`)} className="flex w-full cursor-pointer items-center gap-3 text-left">
              <Avatar name={st.name} size={44} />
              <div>
                <p className="text-sm font-semibold">{st.name}</p>
                <p className="text-xs text-muted">
                  {instrumentById[st.instrument].name} · {levelName(st.level)}
                </p>
              </div>
            </button>
            <div className="mt-4 space-y-2 border-t border-line pt-4 text-[13px]">
              <p className="flex justify-between">
                <span className="text-muted">Devam oranı</span>
                <b>%{attendanceOf(data, st.id).rate}</b>
              </p>
              <p className="flex justify-between">
                <span className="text-muted">Çalışma serisi</span>
                <b>{st.streak} gün</b>
              </p>
              <p className="flex justify-between gap-4">
                <span className="shrink-0 text-muted">Mevcut hedef</span>
                <b className="text-right">{st.nextGoal}</b>
              </p>
            </div>
          </Card>
          <Card className="p-5">
            <p className="mb-2 text-[13px] font-semibold text-ink-2">Önceki dersler</p>
            {data.lessons
              .filter((l) => l.studentId === st.id && l.status === "completed" && l.id !== lesson.id)
              .slice(-2)
              .reverse()
              .map((l) => (
                <div key={l.id} className="mb-3 rounded-xl bg-canvas p-3 last:mb-0">
                  <p className="text-xs font-semibold text-muted">{relativeDay(l.date)}</p>
                  <p className="mt-1 text-[13px] text-ink-2">{l.notes || "Not eklenmedi."}</p>
                </div>
              ))}
          </Card>
        </div>
      </div>
    </>
  );
}
