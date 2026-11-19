import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarCheck2,
  Check,
  ClipboardList,
  Flame,
  GraduationCap,
  Music2,
  Sparkles,
  Trash2,
  TrendingUp,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import type { Activity, ActivityKind, Lesson, Level, Student } from "@/data/types";
import { INSTRUMENTS, LEVELS, PIECES, SKILLS, instrumentById, levelName } from "@/data/catalog";
import { roomsOf, teacherMatch, type Tone } from "@/lib/selectors";
import { addDays, timeAgo, todayISO, fromMinutes, toMinutes } from "@/lib/date";
import { Avatar, Badge, Button, Field, Input, Modal, Select, Textarea, cn } from "./ui";
import { InstrumentBadge } from "./InstrumentIcon";
import { RepeatFields } from "./RepeatFields";
import { defaultUntil, seriesDates, type Repeat } from "@/lib/recurrence";

const LEVEL_TONES: Tone[] = ["neutral", "sky", "brand", "mint", "sun"];
export function LevelBadge({ level }: { level: Level }) {
  return <Badge tone={LEVEL_TONES[level]}>{levelName(level)}</Badge>;
}

const ACT_ICON: Record<ActivityKind, [LucideIcon, string]> = {
  assignment: [ClipboardList, "bg-brand-50 text-brand-600"],
  lesson: [CalendarCheck2, "bg-sky-50 text-sky-600"],
  piece: [Music2, "bg-mint-50 text-mint-600"],
  student: [UserRoundPlus, "bg-sun-50 text-sun-600"],
  teacher: [GraduationCap, "bg-canvas-2 text-ink-2"],
  level: [TrendingUp, "bg-mint-50 text-mint-600"],
  institution: [Building2, "bg-brand-50 text-brand-600"],
  practice: [Flame, "bg-sun-50 text-sun-600"],
};

export function ActivityFeed({ items, showInstitution }: { items: Activity[]; showInstitution?: boolean }) {
  const institutions = useStore((s) => s.data.institutions);
  return (
    <ul className="relative space-y-1">
      {items.map((a) => {
        const [Icon, cls] = ACT_ICON[a.kind];
        const inst = institutions.find((i) => i.id === a.institutionId);
        return (
          <li key={a.id} className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition hover:bg-canvas/70">
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", cls)}>
              <Icon size={15} strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] leading-snug text-ink">{a.text}</p>
              <p className="mt-0.5 text-[11.5px] text-muted">
                {timeAgo(a.at)}
                {showInstitution && inst && <> · {inst.short}</>}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function LessonItem({ lesson, onClick, show = "student", conflict }: { lesson: Lesson; onClick?: () => void; show?: "student" | "teacher" | "both"; conflict?: boolean }) {
  const data = useStore((s) => s.data);
  const st = data.students.find((s) => s.id === lesson.studentId);
  const te = data.teachers.find((t) => t.id === lesson.teacherId);
  const end = fromMinutes(toMinutes(lesson.start) + lesson.duration);
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn("flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition", onClick && "cursor-pointer hover:bg-canvas/70")}
    >
      <div className="w-12 shrink-0 text-center">
        <div className="text-[13px] font-bold tabular-nums">{lesson.start}</div>
        <div className="text-[11px] text-muted tabular-nums">{end}</div>
      </div>
      <span className="h-9 w-[3px] shrink-0 rounded-full" style={{ background: instrumentById[lesson.instrument].tone }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold text-ink">
          {show === "teacher" ? te?.name : st?.name}
          {show === "both" && <span className="font-normal text-muted"> · {te?.name}</span>}
        </p>
        <p className="truncate text-xs text-muted">
          {instrumentById[lesson.instrument].name} · {lesson.room} · {lesson.topic}
        </p>
      </div>
      {conflict && (
        <span title="Zaman çakışması" className="text-rose-500">
          <AlertTriangle size={16} />
        </span>
      )}
      {lesson.status === "completed" && <Badge tone="mint">Tamamlandı</Badge>}
      {lesson.status === "cancelled" && <Badge tone="rose">İptal</Badge>}
    </button>
  );
}

/* ---------- Öğrenci ekle / düzenle ---------- */
export function StudentFormModal({ open, onClose, student, institutionId }: { open: boolean; onClose: () => void; student?: Student; institutionId: string }) {
  const data = useStore((s) => s.data);
  const addStudent = useStore((s) => s.addStudent);
  const updateStudent = useStore((s) => s.updateStudent);
  const inst = data.institutions.find((i) => i.id === institutionId)!;
  const [form, setForm] = useState(() => ({
    name: student?.name ?? "",
    age: student?.age ? String(student.age) : "",
    instrument: student?.instrument ?? inst.courseIds[0],
    level: String(student?.level ?? 0),
    branchId: student?.branchId ?? inst.branches[0].id,
    teacherId: student?.teacherId ?? "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const teachers = data.teachers.filter((t) => t.institutionId === institutionId);
  const addLessonSeries = useStore((s) => s.addLessonSeries);
  // Yeni öğrencide ders programı: ilk ders + tekrar
  const [plan, setPlan] = useState(() => ({ on: true, date: addDays(todayISO(), 1), start: "16:00", duration: "45", room: "" }));
  const [repeat, setRepeat] = useState<Repeat>("weekly");
  const [until, setUntil] = useState(() => defaultUntil(addDays(todayISO(), 1)));
  const rooms = roomsOf(inst);
  // Aktarılan öğrencilerde yaş yerine doğum tarihi var ya da yaş bilinmiyor; düzenlerken zorunlu değil
  const ageOptional = !!student && (!!student.birthDate || !student.age);
  const ranked = useMemo(
    () =>
      teachers
        .map((t) => teacherMatch(data, { instrument: form.instrument, level: Number(form.level) as Level, institutionId }, t.id))
        .filter((m) => m.branch)
        .sort((a, b) => b.score - a.score),
    [teachers, data, form.instrument, form.level, institutionId],
  );
  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const submit = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().split(" ").filter(Boolean).length < 2) e.name = "Ad ve soyad girin";
    const age = Number(form.age);
    if (!(ageOptional && !form.age) && (!age || age < 4 || age > 90)) e.age = "4–90 arasında bir yaş girin";
    const teacherId = form.teacherId || ranked[0]?.teacher.id;
    if (!teacherId) e.teacherId = "Bu branşta öğretmen yok";
    if (!student && plan.on) {
      const m = toMinutes(plan.start || "00:00");
      if (!plan.date) e.plan = "İlk ders tarihini seçin";
      else if (!plan.start || m < 8 * 60 || m > 21 * 60) e.plan = "Ders saati 08:00–21:00 arası olmalı";
    }
    setErrors(e);
    if (Object.keys(e).length) return;
    const payload = {
      name: form.name.trim(),
      age,
      instrument: form.instrument,
      level: Number(form.level) as Level,
      branchId: form.branchId,
      teacherId: teacherId!,
      institutionId,
    };
    if (student) updateStudent(student.id, { ...payload, age: age || student.age });
    else {
      const id = addStudent(payload);
      if (plan.on) {
        const t = teachers.find((x) => x.id === teacherId);
        addLessonSeries(
          { institutionId, studentId: id, teacherId: teacherId!, instrument: form.instrument, date: plan.date, start: plan.start, duration: Number(plan.duration), room: plan.room || t?.room || rooms[0], topic: "Bireysel ders" },
          seriesDates(plan.date, repeat, until),
        );
      }
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={student ? "Öğrenciyi düzenle" : "Yeni öğrenci"}
      subtitle={inst.name}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button onClick={submit}>{student ? "Kaydet" : "Öğrenciyi ekle"}</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ad soyad" error={errors.name} className="sm:col-span-2">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Örn. Ada Yıldız" invalid={!!errors.name} autoFocus />
        </Field>
        <Field label="Yaş" error={errors.age}>
          <Input type="number" inputMode="numeric" value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="12" invalid={!!errors.age} />
        </Field>
        <Field label="Şube">
          <Select value={form.branchId} onChange={(e) => set("branchId", e.target.value)}>
            {inst.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Kurs / enstrüman">
          <Select value={form.instrument} onChange={(e) => setForm((f) => ({ ...f, instrument: e.target.value as Student["instrument"], teacherId: "" }))}>
            {inst.courseIds.map((c) => (
              <option key={c} value={c}>
                {instrumentById[c].name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Başlangıç seviyesi">
          <Select value={form.level} onChange={(e) => set("level", e.target.value)}>
            {LEVELS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-[13px] font-semibold text-ink-2">Öğretmen</p>
          {errors.teacherId && <p className="mb-2 text-xs font-medium text-rose-600">{errors.teacherId}</p>}
          <div className="space-y-2">
            {ranked.map((m, i) => (
              <MatchRow key={m.teacher.id} m={m} recommended={i === 0} selected={(form.teacherId || ranked[0]?.teacher.id) === m.teacher.id} onSelect={() => set("teacherId", m.teacher.id)} />
            ))}
          </div>
        </div>
        {!student && (
          <div className="sm:col-span-2">
            <label className="mb-2 flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-ink-2">
              <input type="checkbox" checked={plan.on} onChange={(e) => setPlan((x) => ({ ...x, on: e.target.checked }))} className="size-4" />
              Ders programını şimdi oluştur
            </label>
            {errors.plan && <p className="mb-2 text-xs font-medium text-rose-600">{errors.plan}</p>}
            {plan.on && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="İlk ders">
                    <Input type="date" value={plan.date} min={todayISO()} onChange={(e) => { const d = e.target.value; setPlan((x) => ({ ...x, date: d })); if (until <= d) setUntil(defaultUntil(d)); }} />
                  </Field>
                  <Field label="Saat">
                    <Input type="time" step={900} value={plan.start} onChange={(e) => setPlan((x) => ({ ...x, start: e.target.value }))} />
                  </Field>
                  <Field label="Süre">
                    <Select value={plan.duration} onChange={(e) => setPlan((x) => ({ ...x, duration: e.target.value }))}>
                      {[30, 45, 60, 90].map((d) => (
                        <option key={d} value={d}>{d} dk</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Derslik">
                    <Select value={plan.room} onChange={(e) => setPlan((x) => ({ ...x, room: e.target.value }))}>
                      <option value="">Öğretmeninki</option>
                      {rooms.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <RepeatFields date={plan.date} repeat={repeat} until={until} onRepeat={setRepeat} onUntil={setUntil} />
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function MatchRow({ m, recommended, selected, onSelect, current }: { m: ReturnType<typeof teacherMatch>; recommended: boolean; selected: boolean; onSelect: () => void; current?: boolean }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex w-full cursor-pointer items-center gap-3 rounded-2xl border p-3 text-left transition",
        selected ? "border-brand-400 bg-brand-50/50 ring-4 ring-brand-100" : "border-line hover:border-line-strong",
      )}
    >
      <Avatar name={m.teacher.name} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{m.teacher.name}</span>
          {recommended && (
            <Badge tone="brand">
              <Sparkles size={11} /> Önerilen
            </Badge>
          )}
          {current && <Badge tone="neutral">Mevcut öğretmen</Badge>}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-muted">
          <span className={m.branch ? "text-mint-700" : "text-rose-600"}>{m.branch ? "✓ Branş uyumlu" : "✕ Branş dışı"}</span>
          <span className={m.levelOk ? "text-mint-700" : "text-sun-700"}>{m.levelOk ? "✓ Seviyeye uygun" : "! Seviye dışı"}</span>
          <span>
            Yük: <b className="text-ink-2">{m.load}</b>/{m.teacher.capacity}
          </span>
          <span className="flex items-center gap-1">
            {m.teacher.specialties.map((s) => instrumentById[s].short).join(", ")}
          </span>
        </div>
      </div>
      <div className="hidden w-20 sm:block">
        <div className="h-1.5 overflow-hidden rounded-full bg-canvas-2">
          <div className={cn("h-full rounded-full", m.load / m.teacher.capacity > 0.85 ? "bg-sun-500" : "bg-mint-500")} style={{ width: `${Math.min(100, (m.load / m.teacher.capacity) * 100)}%` }} />
        </div>
        <p className="mt-1 text-right text-[10.5px] text-muted">{m.free} boş kontenjan</p>
      </div>
      <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border", selected ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong")}>
        {selected && <Check size={12} strokeWidth={3} />}
      </span>
    </button>
  );
}

/* ---------- Öğretmen atama ---------- */
export function AssignTeacherModal({ open, onClose, student }: { open: boolean; onClose: () => void; student: Student }) {
  const data = useStore((s) => s.data);
  const assign = useStore((s) => s.assignTeacher);
  const [showAll, setShowAll] = useState(false);
  const ranked = data.teachers
    .filter((t) => t.institutionId === student.institutionId)
    .map((t) => teacherMatch(data, student, t.id))
    .sort((a, b) => b.score - a.score);
  const visible = showAll ? ranked : ranked.filter((m) => m.branch);
  const best = ranked.find((m) => m.branch && m.teacher.id !== student.teacherId) ?? ranked[0];
  const [selected, setSelected] = useState(student.teacherId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Öğretmen ata"
      subtitle={
        <span className="inline-flex items-center gap-2">
          {student.name} · {instrumentById[student.instrument].name} · {levelName(student.level)}
        </span>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            disabled={selected === student.teacherId}
            onClick={() => {
              assign(student.id, selected);
              onClose();
            }}
          >
            Atamayı kaydet
          </Button>
        </>
      }
    >
      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-canvas p-3">
        <InstrumentBadge id={student.instrument} size={40} />
        <p className="text-[13px] text-ink-2">
          Öneri; <b>branş uyumu</b>, <b>öğretilebilen seviyeler</b> ve <b>mevcut öğrenci yükü</b> birlikte değerlendirilerek yapılır. Önerilen eşleşme:{" "}
          <b className="text-brand-700">{best.teacher.name}</b>
        </p>
      </div>
      <div className="space-y-2">
        {visible.map((m) => (
          <MatchRow
            key={m.teacher.id}
            m={m}
            recommended={m.teacher.id === best.teacher.id}
            current={m.teacher.id === student.teacherId}
            selected={selected === m.teacher.id}
            onSelect={() => setSelected(m.teacher.id)}
          />
        ))}
      </div>
      <button onClick={() => setShowAll((v) => !v)} className="mt-3 cursor-pointer text-[13px] font-semibold text-brand-700 hover:underline">
        {showAll ? "Yalnızca branş uyumlu öğretmenler" : "Tüm kurum öğretmenlerini göster"}
      </button>
    </Modal>
  );
}

/* ---------- Ders ekle / düzenle ---------- */
export function LessonFormModal({ open, onClose, lesson, institutionId, defaults }: { open: boolean; onClose: () => void; lesson?: Lesson; institutionId: string; defaults?: { date?: string; start?: string; teacherId?: string; room?: string } }) {
  const data = useStore((s) => s.data);
  const addLesson = useStore((s) => s.addLesson);
  const updateLesson = useStore((s) => s.updateLesson);
  const students = data.students.filter((s) => s.institutionId === institutionId);
  const teachers = data.teachers.filter((t) => t.institutionId === institutionId);
  const [form, setForm] = useState(() => ({
    studentId: lesson?.studentId ?? "",
    teacherId: lesson?.teacherId ?? defaults?.teacherId ?? "",
    date: lesson?.date ?? defaults?.date ?? todayISO(),
    start: lesson?.start ?? defaults?.start ?? "16:00",
    duration: String(lesson?.duration ?? 45),
    room: lesson?.room ?? defaults?.room ?? teachers.find((t) => t.id === (defaults?.teacherId ?? ""))?.room ?? roomsOf(data.institutions.find((i) => i.id === institutionId))[0],
    topic: lesson?.topic ?? "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const addLessonSeries = useStore((s) => s.addLessonSeries);
  const updateLessonSeries = useStore((s) => s.updateLessonSeries);
  const deleteLessons = useStore((s) => s.deleteLessons);
  const [repeat, setRepeat] = useState<Repeat>("once");
  const [until, setUntil] = useState(() => defaultUntil(form.date));
  // Düzenlenen ders bir serideyse: bu ve sonraki dersler
  const following = lesson?.seriesId ? data.lessons.filter((x) => x.seriesId === lesson.seriesId && x.date >= lesson.date && x.status === "scheduled") : [];
  const [applyAll, setApplyAll] = useState(false);
  const dayDiff = (a: string, b: string) => Math.round((new Date(a + "T12:00:00").getTime() - new Date(b + "T12:00:00").getTime()) / 86400000);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!form.studentId) e.studentId = "Öğrenci seçin";
    if (!form.teacherId) e.teacherId = "Öğretmen seçin";
    if (!form.date) e.date = "Tarih seçin";
    const m = toMinutes(form.start || "00:00");
    if (!form.start || m < 8 * 60 || m > 21 * 60) e.start = "08:00–21:00 arası";
    setErrors(e);
    if (Object.keys(e).length) return;
    const st = students.find((s) => s.id === form.studentId)!;
    const payload = {
      institutionId,
      studentId: form.studentId,
      teacherId: form.teacherId,
      instrument: st.instrument,
      date: form.date,
      start: form.start,
      duration: Number(form.duration),
      room: form.room,
      topic: form.topic.trim() || "Bireysel ders",
    };
    if (lesson) {
      if (applyAll && following.length > 1) updateLessonSeries(lesson.id, payload, dayDiff(form.date, lesson.date));
      else updateLesson(lesson.id, payload);
    } else {
      const dates = seriesDates(form.date, repeat, until);
      if (dates.length > 1) addLessonSeries(payload, dates);
      else addLesson(payload);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lesson ? "Dersi düzenle" : "Yeni ders"}
      subtitle="Çakışmalar takvimde otomatik işaretlenir"
      footer={
        <>
          {lesson && (
            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => {
                const many = following.length > 1 && confirm(`Bu ders bir serinin parçası. Bu dersle birlikte sonraki ${following.length - 1} ders de silinsin mi?

Tamam: hepsini sil · İptal: yalnızca bu dersi sil`);
                if (!many && !confirm("Bu ders kalıcı olarak silinsin mi?")) return;
                deleteLessons(many ? following.map((x) => x.id) : [lesson.id]);
                onClose();
              }}
            >
              Sil
            </Button>
          )}
          {lesson && lesson.status !== "cancelled" && (
            <Button
              variant="secondary"
              className="mr-auto"
              onClick={() => {
                updateLesson(lesson.id, { status: "cancelled" });
                onClose();
              }}
            >
              Dersi iptal et
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button onClick={submit}>{lesson ? "Kaydet" : "Dersi ekle"}</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Öğrenci" error={errors.studentId}>
          <Select
            value={form.studentId}
            invalid={!!errors.studentId}
            onChange={(e) => {
              const s = students.find((x) => x.id === e.target.value);
              setForm((f) => ({ ...f, studentId: e.target.value, teacherId: s?.teacherId ?? f.teacherId }));
            }}
          >
            <option value="">Seçin…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {instrumentById[s.instrument].short}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Öğretmen" error={errors.teacherId}>
          <Select
            value={form.teacherId}
            invalid={!!errors.teacherId}
            onChange={(e) => {
              const v = e.target.value;
              // Öğretmenin varsayılan dersliği otomatik gelir
              setForm((f) => ({ ...f, teacherId: v, room: teachers.find((t) => t.id === v)?.room ?? f.room }));
            }}
          >
            <option value="">Seçin…</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tarih" error={errors.date}>
          <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} min={addDays(todayISO(), -30)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Başlangıç" error={errors.start}>
            <Input type="time" step={900} value={form.start} onChange={(e) => set("start", e.target.value)} invalid={!!errors.start} />
          </Field>
          <Field label="Süre">
            <Select value={form.duration} onChange={(e) => set("duration", e.target.value)}>
              {[30, 45, 60, 90].map((d) => (
                <option key={d} value={d}>
                  {d} dk
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Derslik">
          <Select value={form.room} onChange={(e) => set("room", e.target.value)}>
            {Array.from(new Set([...roomsOf(data.institutions.find((i) => i.id === institutionId)), form.room])).map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </Field>
        <Field label="Ders konusu">
          <Input value={form.topic} onChange={(e) => set("topic", e.target.value)} placeholder="Örn. Parça çalışması" />
        </Field>
        {!lesson && (
          <RepeatFields
            className="sm:col-span-2"
            date={form.date}
            repeat={repeat}
            until={until}
            onRepeat={(r) => {
              setRepeat(r);
              if (until <= form.date) setUntil(defaultUntil(form.date));
            }}
            onUntil={setUntil}
          />
        )}
        {lesson && following.length > 1 && (
          <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-line bg-canvas/50 p-3 text-[13px] sm:col-span-2">
            <input type="checkbox" checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-brand-600)]" />
            <span>
              <b>Serideki sonraki derslere de uygula</b>
              <span className="block text-muted">Bu ders ve sonraki {following.length - 1} planlı derste saat, süre, derslik, öğretmen ve konu değişir; tarih değiştiyse hepsi aynı gün kadar kayar.</span>
            </span>
          </label>
        )}
      </div>
    </Modal>
  );
}

/* ---------- Ödev oluştur ---------- */
export function AssignmentFormModal({ open, onClose, teacherId, studentId }: { open: boolean; onClose: () => void; teacherId: string; studentId?: string }) {
  const data = useStore((s) => s.data);
  const addAssignment = useStore((s) => s.addAssignment);
  const myStudents = data.students.filter((s) => s.teacherId === teacherId);
  const [form, setForm] = useState({
    studentId: studentId ?? "",
    title: "",
    description: "",
    target: "",
    dueDate: addDays(todayISO(), 7),
    tempo: "",
    reps: "",
    minutes: "20",
    requiresApproval: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => setErrors((e) => (Object.values(e).some(Boolean) ? {} : e)), [form]);
  const student = myStudents.find((s) => s.id === form.studentId);
  const pieces = student ? PIECES.filter((p) => p.instrument === student.instrument) : [];
  const skills = student ? SKILLS.filter((k) => k.instrument === student.instrument && k.stage <= student.level + 1) : [];

  const submit = () => {
    const e: Record<string, string> = {};
    if (!form.studentId) e.studentId = "Öğrenci seçin";
    if (form.title.trim().length < 4) e.title = "En az 4 karakterlik bir başlık yazın";
    if (!form.dueDate || form.dueDate < todayISO()) e.dueDate = "Bugün veya sonrası olmalı";
    if (form.tempo && (Number(form.tempo) < 30 || Number(form.tempo) > 240)) e.tempo = "30–240 BPM";
    setErrors(e);
    if (Object.keys(e).length) return;
    const [kind, id] = form.target.split(":");
    addAssignment({
      studentId: form.studentId,
      teacherId,
      title: form.title.trim(),
      description: form.description.trim() || "Ayrıntılar derste konuşuldu.",
      pieceId: kind === "p" ? id : undefined,
      skillId: kind === "k" ? id : undefined,
      dueDate: form.dueDate,
      tempo: form.tempo ? Number(form.tempo) : undefined,
      reps: form.reps ? Number(form.reps) : undefined,
      minutes: form.minutes ? Number(form.minutes) : undefined,
      requiresApproval: form.requiresApproval,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yeni ödev"
      subtitle="Ödev öğrenci ve veli ekranlarında anında görünür"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button onClick={submit}>Ödevi gönder</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Öğrenci" error={errors.studentId} className="sm:col-span-2">
          <Select value={form.studentId} invalid={!!errors.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value, target: "" }))}>
            <option value="">Seçin…</option>
            {myStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {instrumentById[s.instrument].short} · {levelName(s.level)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Ödev başlığı" error={errors.title} className="sm:col-span-2">
          <Input value={form.title} invalid={!!errors.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Örn. İlk 16 ölçü, eller ayrı" />
        </Field>
        <Field label="Açıklama" className="sm:col-span-2">
          <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Neye dikkat etmeli, nasıl çalışmalı?" />
        </Field>
        <Field label="İlgili parça veya kazanım" className="sm:col-span-2" hint={!student ? "Önce öğrenci seçin" : undefined}>
          <Select value={form.target} disabled={!student} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}>
            <option value="">Seçilmedi</option>
            {pieces.length > 0 && (
              <optgroup label="Parçalar">
                {pieces.map((p) => (
                  <option key={p.id} value={`p:${p.id}`}>
                    {p.title} — {p.composer}
                  </option>
                ))}
              </optgroup>
            )}
            {skills.length > 0 && (
              <optgroup label="Teknik kazanımlar">
                {skills.map((k) => (
                  <option key={k.id} value={`k:${k.id}`}>
                    {levelName(k.stage)} · {k.title}
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
        </Field>
        <Field label="Son tarih" error={errors.dueDate}>
          <Input type="date" value={form.dueDate} min={todayISO()} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
        </Field>
        <Field label="Günlük süre (dk)">
          <Input type="number" value={form.minutes} onChange={(e) => setForm((f) => ({ ...f, minutes: e.target.value }))} />
        </Field>
        <Field label="Hedef tempo (BPM)" error={errors.tempo}>
          <Input type="number" value={form.tempo} invalid={!!errors.tempo} onChange={(e) => setForm((f) => ({ ...f, tempo: e.target.value }))} placeholder="Örn. 80" />
        </Field>
        <Field label="Tekrar sayısı">
          <Input type="number" value={form.reps} onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))} placeholder="Örn. 5" />
        </Field>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-canvas p-3 sm:col-span-2">
          <input type="checkbox" checked={form.requiresApproval} onChange={(e) => setForm((f) => ({ ...f, requiresApproval: e.target.checked }))} className="size-4 accent-brand-600" />
          <span className="text-[13px]">
            <b className="font-semibold">Öğretmen onayı gerekli</b>
            <span className="block text-xs text-muted">Öğrenci tamamladığında ödev önce onayınıza düşer.</span>
          </span>
        </label>
      </div>
    </Modal>
  );
}

export const instrumentOptions = INSTRUMENTS;
