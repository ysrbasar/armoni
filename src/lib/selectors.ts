import { SKILLS, instrumentById } from "@/data/catalog";
import type { Assignment, AssignmentStatus, DemoData, Lesson, Level, Payment, PieceStatus, Student } from "@/data/types";
import { toMinutes, todayISO } from "./date";

export const skillsFor = (s: Student) => SKILLS.filter((k) => k.instrument === s.instrument);

/** Eğitim ilerlemesi: enstrüman kazanımlarının tamamlanma oranı */
export const progressOf = (s: Student) => {
  const total = skillsFor(s).length;
  return Math.round((s.skillsDone.length / total) * 100);
};

export const skillState = (s: Student, skillId: string, stage: Level): "done" | "active" | "locked" => {
  if (s.skillsDone.includes(skillId)) return "done";
  if (stage <= s.level) return "active";
  return "locked";
};

export const stageComplete = (s: Student) =>
  skillsFor(s)
    .filter((k) => k.stage === s.level)
    .every((k) => s.skillsDone.includes(k.id));

export const piecesOf = (d: DemoData, studentId: string) => d.studentPieces.filter((p) => p.studentId === studentId);

export const pieceCounts = (d: DemoData, studentId: string) => {
  const list = piecesOf(d, studentId);
  return {
    total: list.length,
    done: list.filter((p) => p.status === "done").length,
    open: list.filter((p) => p.status !== "done").length,
  };
};

export const assignmentsOf = (d: DemoData, studentId: string) =>
  d.assignments.filter((a) => a.studentId === studentId).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

export const isOpen = (a: Assignment) => a.status !== "done";

export const instStudents = (d: DemoData, instId: string) => d.students.filter((s) => s.institutionId === instId);
export const instTeachers = (d: DemoData, instId: string) => d.teachers.filter((t) => t.institutionId === instId);
export const teacherStudents = (d: DemoData, teacherId: string) => d.students.filter((s) => s.teacherId === teacherId);

export const lessonEnd = (l: Lesson) => toMinutes(l.start) + l.duration;

/** Aynı öğretmen veya aynı derslikte zaman çakışması olan dersler */
export const conflictIds = (lessons: Lesson[]) => {
  const ids = new Set<string>();
  const active = lessons.filter((l) => l.status !== "cancelled");
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      if (a.date !== b.date || a.institutionId !== b.institutionId) continue;
      if (a.teacherId !== b.teacherId && a.room !== b.room) continue;
      if (toMinutes(a.start) < lessonEnd(b) && toMinutes(b.start) < lessonEnd(a)) {
        ids.add(a.id);
        ids.add(b.id);
      }
    }
  }
  return ids;
};

export const nextLessonOf = (d: DemoData, studentId: string) => {
  const today = todayISO();
  return d.lessons
    .filter((l) => l.studentId === studentId && l.status === "scheduled" && l.date >= today)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0];
};

export const ASSIGNMENT_STATUS: Record<AssignmentStatus, { label: string; parent: string; tone: Tone }> = {
  assigned: { label: "Verildi", parent: "Verildi", tone: "neutral" },
  in_progress: { label: "Çalışılıyor", parent: "Çalışılıyor", tone: "brand" },
  submitted: { label: "Onay bekliyor", parent: "Öğretmen onayı bekliyor", tone: "sun" },
  done: { label: "Tamamlandı", parent: "Tamamlandı", tone: "mint" },
};

export const PIECE_STATUS: Record<PieceStatus, { label: string; tone: Tone }> = {
  learning: { label: "Öğreniliyor", tone: "brand" },
  practice: { label: "Pratik gerekiyor", tone: "sun" },
  review: { label: "Değerlendirmede", tone: "sky" },
  done: { label: "Tamamlandı", tone: "mint" },
};

export type Tone = "neutral" | "brand" | "mint" | "sun" | "rose" | "sky";

export const teacherMatch = (d: DemoData, student: Pick<Student, "instrument" | "level" | "institutionId">, teacherId: string) => {
  const t = d.teachers.find((x) => x.id === teacherId)!;
  const load = d.students.filter((s) => s.teacherId === t.id).length;
  const branch = t.specialties.includes(student.instrument);
  const levelOk = t.levels.includes(student.level);
  const primary = t.specialties[0] === student.instrument;
  const free = Math.max(t.capacity - load, 0);
  const score = (branch ? 50 : 0) + (levelOk ? 25 : 0) + (primary ? 5 : 0) + Math.min(free, 5) * 4;
  return { teacher: t, load, branch, levelOk, free, score };
};

export const instrumentName = (id: keyof typeof instrumentById) => instrumentById[id].name;

/** Devam: tamamlanan derslerdeki katılım kayıtlarından hesaplanır */
export const attendanceOf = (d: DemoData, studentId: string) => {
  const done = d.lessons.filter((l) => l.studentId === studentId && l.status === "completed" && l.attendance);
  const present = done.filter((l) => l.attendance === "present").length;
  const late = done.filter((l) => l.attendance === "late").length;
  const absent = done.filter((l) => l.attendance === "absent").length;
  const total = done.length;
  return { present, late, absent, total, rate: total ? Math.round(((present + late) / total) * 100) : 100 };
};

/** Öğretmen devamı: yapılan dersler / (yapılan + öğretmen kaynaklı iptal) */
export const teacherAttendanceOf = (d: DemoData, teacherId: string) => {
  const today = todayISO();
  const past = d.lessons.filter((l) => l.teacherId === teacherId && l.date < today);
  const held = past.filter((l) => l.status === "completed").length;
  const cancelled = past.filter((l) => l.status === "cancelled").length;
  const absences = d.teacherAbsences.filter((a) => a.teacherId === teacherId);
  return { held, cancelled, absences, rate: held + cancelled ? Math.round((held / (held + cancelled)) * 100) : 100 };
};

export type PaymentState = "paid" | "pending" | "overdue";
export const paymentState = (p: Payment): PaymentState => (p.paidAt ? "paid" : p.dueDate < todayISO() ? "overdue" : "pending");
export const PAYMENT_STATE: Record<PaymentState, { label: string; tone: Tone }> = {
  paid: { label: "Ödendi", tone: "mint" },
  pending: { label: "Bekliyor", tone: "sun" },
  overdue: { label: "Gecikmiş", tone: "rose" },
};
export const tl = (n: number) => `₺${n.toLocaleString("tr-TR")}`;
