import { useState } from "react";
import { AlertTriangle, CalendarX2, Clock3, Plus, Trash2, TrendingUp, UserCheck } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Field, IconButton, Input, Modal, ProgressBar, Select, StatCard, Textarea, cn } from "@/components/ui";
import { InstrumentBadge } from "@/components/InstrumentIcon";
import { instrumentById } from "@/data/catalog";
import { attendanceOf, instStudents, instTeachers, teacherAttendanceOf, type Tone } from "@/lib/selectors";
import { addDays, fmtDate, fmtDateLong, relativeDay, todayISO } from "@/lib/date";
import type { Attendance, TeacherAbsenceType } from "@/data/types";

const ATT: Record<Attendance, { label: string; tone: Tone }> = {
  present: { label: "Katıldı", tone: "mint" },
  late: { label: "Geç kaldı", tone: "sun" },
  absent: { label: "Gelmedi", tone: "rose" },
};

const rateTone = (r: number): Tone => (r >= 90 ? "mint" : r >= 80 ? "sun" : "rose");

/* ---------- Öğrenci devamsızlığı ---------- */
export function StudentAttendance() {
  const data = useStore((s) => s.data);
  const instId = useStore((s) => s.session.institutionId);
  const inst = data.institutions.find((i) => i.id === instId)!;
  const [course, setCourse] = useState("all");
  const [teacher, setTeacher] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const students = instStudents(data, instId).filter((s) => (course === "all" || s.instrument === course) && (teacher === "all" || s.teacherId === teacher));
  const rows = students.map((s) => ({ s, a: attendanceOf(data, s.id) })).sort((x, y) => x.a.rate - y.a.rate);
  const total = rows.reduce((acc, r) => ({ p: acc.p + r.a.present + r.a.late, t: acc.t + r.a.total }), { p: 0, t: 0 });
  const monthStart = todayISO().slice(0, 8) + "01";
  const monthAbs = data.lessons.filter((l) => students.some((s) => s.id === l.studentId) && l.attendance === "absent" && l.date >= monthStart).length;
  const risky = rows.filter((r) => r.a.rate < 80);
  const lastAbsence = (sid: string) =>
    data.lessons
      .filter((l) => l.studentId === sid && l.attendance === "absent")
      .map((l) => l.date)
      .sort()
      .pop();

  return (
    <>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Ortalama devam" value={`%${total.t ? Math.round((total.p / total.t) * 100) : 100}`} icon={UserCheck} tone="mint" hint="Son 8 hafta" />
        <StatCard label="Bu ay devamsızlık" value={monthAbs} icon={CalendarX2} tone="rose" hint="Gelmedi kaydı" />
        <StatCard label="Geç kalma" value={rows.reduce((a, r) => a + r.a.late, 0)} icon={Clock3} tone="sun" hint="Son 8 hafta" />
        <StatCard label="Takip gereken" value={risky.length} icon={AlertTriangle} tone="brand" hint="Devamı %80'in altında" />
      </div>
      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-wrap gap-2 p-4">
          <Select value={course} onChange={(e) => setCourse(e.target.value)} className="h-9 w-full sm:w-44" aria-label="Kurs filtresi">
            <option value="all">Tüm kurslar</option>
            {inst.courseIds.map((c) => (
              <option key={c} value={c}>
                {instrumentById[c].name}
              </option>
            ))}
          </Select>
          <Select value={teacher} onChange={(e) => setTeacher(e.target.value)} className="h-9 w-full sm:w-52" aria-label="Öğretmen filtresi">
            <option value="all">Tüm öğretmenler</option>
            {instTeachers(data, instId).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
          <p className="ml-auto self-center text-xs text-muted">Devamı en düşük öğrenciler üstte</p>
        </div>
        <div className="divide-y divide-line border-t border-line">
          {rows.length === 0 && <EmptyState icon={UserCheck} title="Bu filtrede öğrenci yok" />}
          {rows.map(({ s, a }) => {
            const last = lastAbsence(s.id);
            return (
              <button key={s.id} onClick={() => setOpen(s.id)} className="flex w-full cursor-pointer flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-canvas/60 sm:flex-nowrap">
                <Avatar name={s.name} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 truncate text-[13.5px] font-semibold">
                    {s.name} <InstrumentBadge id={s.instrument} size={20} rounded="rounded-md" />
                  </span>
                  <span className="block truncate text-xs text-muted">{last ? `Son devamsızlık: ${relativeDay(last)}` : "Devamsızlığı yok"}</span>
                </span>
                <span className="flex gap-1.5 text-[11px] font-semibold tabular-nums">
                  <span className="rounded-md bg-mint-50 px-1.5 py-0.5 text-mint-700" title="Katıldı">{a.present}</span>
                  <span className="rounded-md bg-sun-50 px-1.5 py-0.5 text-sun-700" title="Geç kaldı">{a.late}</span>
                  <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-rose-600" title="Gelmedi">{a.absent}</span>
                </span>
                <span className="flex w-full items-center gap-2 sm:w-40">
                  <ProgressBar value={a.rate} tone={rateTone(a.rate)} />
                  <span className="w-10 text-right text-xs font-bold tabular-nums">%{a.rate}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Card>
      {open && <StudentAttendanceModal studentId={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function StudentAttendanceModal({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const data = useStore((s) => s.data);
  const setAtt = useStore((s) => s.setLessonAttendance);
  const s = data.students.find((x) => x.id === studentId)!;
  const a = attendanceOf(data, studentId);
  const lessons = data.lessons
    .filter((l) => l.studentId === studentId && l.status === "completed")
    .sort((x, y) => y.date.localeCompare(x.date))
    .slice(0, 10);
  return (
    <Modal open onClose={onClose} title={`${s.name} · devam kaydı`} subtitle={`%${a.rate} devam · ${a.absent} devamsızlık · ${a.late} geç kalma`}>
      <ul className="space-y-2">
        {lessons.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2">
            <span className="text-[13px]">
              <b className="font-semibold">{fmtDateLong(l.date)}</b>
              <span className="text-muted"> · {l.start}</span>
            </span>
            <span className="flex gap-1 rounded-lg bg-canvas-2/80 p-0.5">
              {(Object.keys(ATT) as Attendance[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setAtt(l.id, k)}
                  className={cn(
                    "h-7 cursor-pointer rounded-md px-2 text-[11.5px] font-semibold transition",
                    l.attendance === k ? (k === "absent" ? "bg-rose-500 text-white" : k === "late" ? "bg-sun-500 text-white" : "bg-mint-500 text-white") : "text-muted hover:text-ink",
                  )}
                >
                  {ATT[k].label}
                </button>
              ))}
            </span>
          </li>
        ))}
        {lessons.length === 0 && <EmptyState icon={CalendarX2} title="Henüz tamamlanan ders yok" />}
      </ul>
    </Modal>
  );
}

/* ---------- Öğretmen devamsızlığı ---------- */
const ABS_TYPE: Record<TeacherAbsenceType, { label: string; tone: Tone }> = {
  izin: { label: "İzinli", tone: "sky" },
  rapor: { label: "Raporlu", tone: "sun" },
  gelmedi: { label: "Gelmedi", tone: "rose" },
};

export function TeacherAttendance() {
  const data = useStore((s) => s.data);
  const instId = useStore((s) => s.session.institutionId);
  const remove = useStore((s) => s.removeTeacherAbsence);
  const [adding, setAdding] = useState<string | null>(null);
  const teachers = instTeachers(data, instId);
  const stats = teachers.map((t) => ({ t, a: teacherAttendanceOf(data, t.id) }));
  const records = data.teacherAbsences.filter((a) => a.institutionId === instId).sort((x, y) => y.date.localeCompare(x.date));
  const held = stats.reduce((x, s) => x + s.a.held, 0);
  const cancelled = stats.reduce((x, s) => x + s.a.cancelled, 0);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Ders gerçekleşme" value={`%${held + cancelled ? Math.round((held / (held + cancelled)) * 100) : 100}`} icon={TrendingUp} tone="mint" hint="Son 8 hafta" />
        <StatCard label="Devamsızlık kaydı" value={records.length} icon={CalendarX2} tone="rose" hint="İzin, rapor, gelmedi" />
        <StatCard label="İptal edilen ders" value={cancelled} icon={AlertTriangle} tone="sun" hint="Öğretmen kaynaklı" />
        <StatCard label="Tam devamlı" value={stats.filter((s) => s.a.absences.length === 0).length} icon={UserCheck} tone="brand" hint={`${teachers.length} öğretmenden`} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="Öğretmen bazında" subtitle="Yapılan / iptal edilen dersler" />
          <div className="divide-y divide-line p-2">
            {stats.map(({ t, a }) => (
              <div key={t.id} className="flex flex-wrap items-center gap-3 px-3 py-3 sm:flex-nowrap">
                <Avatar name={t.name} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold">{t.name}</span>
                  <span className="text-xs text-muted">
                    {a.held} ders yapıldı · {a.cancelled} iptal · {a.absences.length} devamsızlık
                  </span>
                </span>
                <span className="flex w-full items-center gap-2 sm:w-36">
                  <ProgressBar value={a.rate} tone={rateTone(a.rate)} />
                  <span className="w-10 text-right text-xs font-bold tabular-nums">%{a.rate}</span>
                </span>
                <Button size="sm" variant="secondary" icon={Plus} onClick={() => setAdding(t.id)}>
                  Kayıt
                </Button>
              </div>
            ))}
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Devamsızlık kayıtları" action={<Button size="sm" icon={Plus} onClick={() => setAdding(teachers[0]?.id ?? null)}>Ekle</Button>} />
          <ul className="space-y-1 p-3">
            {records.length === 0 && <EmptyState icon={UserCheck} title="Kayıt yok" />}
            {records.map((r) => {
              const t = data.teachers.find((x) => x.id === r.teacherId);
              return (
                <li key={r.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                  <Badge tone={ABS_TYPE[r.type].tone}>{ABS_TYPE[r.type].label}</Badge>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{t?.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {fmtDate(r.date)} · {r.note}
                    </span>
                  </span>
                  <IconButton icon={Trash2} label="Kaydı sil" onClick={() => remove(r.id)} />
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
      {adding && <AbsenceModal teacherId={adding} onClose={() => setAdding(null)} />}
    </>
  );
}

function AbsenceModal({ teacherId, onClose }: { teacherId: string; onClose: () => void }) {
  const data = useStore((s) => s.data);
  const instId = useStore((s) => s.session.institutionId);
  const add = useStore((s) => s.addTeacherAbsence);
  const [form, setForm] = useState({ teacherId, date: addDays(todayISO(), 1), type: "izin" as TeacherAbsenceType, note: "" });
  const affected = data.lessons.filter((l) => l.teacherId === form.teacherId && l.date === form.date && l.status !== "cancelled");
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Öğretmen devamsızlığı"
      subtitle="O günkü dersler otomatik olarak iptal edilir"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            disabled={!form.date}
            onClick={() => {
              add({ ...form, institutionId: instId, note: form.note.trim() || ABS_TYPE[form.type].label });
              onClose();
            }}
          >
            Kaydet
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Öğretmen">
          <Select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
            {instTeachers(data, instId).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tarih">
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </Field>
        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-ink-2">Tür</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(ABS_TYPE) as TeacherAbsenceType[]).map((k) => (
              <button
                key={k}
                onClick={() => setForm({ ...form, type: k })}
                className={cn("h-10 cursor-pointer rounded-xl border text-[13px] font-semibold", form.type === k ? "border-brand-400 bg-brand-50 text-brand-700" : "border-line text-ink-2")}
              >
                {ABS_TYPE[k].label}
              </button>
            ))}
          </div>
        </div>
        <Field label="Not">
          <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Örn. Seminer katılımı" className="min-h-16" />
        </Field>
        <p className={cn("rounded-xl p-3 text-[13px]", affected.length ? "bg-sun-50 text-sun-700" : "bg-canvas text-muted")}>
          {affected.length ? `Bu tarihte ${affected.length} ders iptal edilecek.` : "Bu tarihte planlı ders yok."}
        </p>
      </div>
    </Modal>
  );
}
