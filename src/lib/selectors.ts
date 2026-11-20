import { SKILLS, instrumentById } from "@/data/catalog";
import type { Assignment, AssignmentStatus, DemoData, Lesson, Level, Payment, PieceStatus, Student } from "@/data/types";
import { toMinutes, todayISO } from "./date";

export const skillsFor = (s: Student) => SKILLS.filter((k) => k.instrument === s.instrument);

/** Eğitim ilerlemesi: enstrüman kazanımlarının tamamlanma oranı */
export const progressOf = (s: Student) => {
  // Yalnızca etkin programdaki kazanımlar sayılır; program yoksa ilerleme 0
  const skills = skillsFor(s);
  if (!skills.length) return 0;
  return Math.round((skills.filter((k) => s.skillsDone.includes(k.id)).length / skills.length) * 100);
};

/** "Deniz Kaya" → "Deniz K."; tek kelimelik adı olduğu gibi bırakır */
export const shortName = (name: string) => {
  const [first, second] = name.trim().split(/s+/);
  return second ? `${first} ${second[0]}.` : first;
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

/** Kurumun derslikleri: tanımlı değilse varsayılan liste */
/** TC kimlik no algoritma denetimi (11 hane, ilk hane 0 değil, 10. ve 11. hane kontrol basamakları) */
export function validTc(tc: string) {
  if (!/^[1-9]\d{10}$/.test(tc)) return false;
  const d = tc.split("").map(Number);
  const d10 = ((d[0] + d[2] + d[4] + d[6] + d[8]) * 7 - (d[1] + d[3] + d[5] + d[7])) % 10;
  const d11 = d.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
  return (d10 + 10) % 10 === d[9] && d11 === d[10];
}

/** Türkiye telefonunu "0532 123 45 67" biçimine getirir; geçersizse boş döner */
export function formatPhone(raw: string) {
  let n = raw.replace(/\D/g, "");
  if (n.startsWith("90") && n.length === 12) n = n.slice(2);
  if (n.length === 10) n = "0" + n;
  if (!/^0[2-5]\d{9}$/.test(n)) return "";
  return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7, 9)} ${n.slice(9)}`;
}

export const DEFAULT_ROOMS = ["Derslik 1", "Derslik 2", "Derslik 3", "Derslik 4", "Derslik 5", "Derslik 6"];
export const roomsOf = (inst?: { rooms?: string[] }) => (inst?.rooms?.length ? inst.rooms : DEFAULT_ROOMS);

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

/** Doğum tarihi varsa ondan hesaplanan, yoksa kayıtlı yaş; bilinmiyorsa açıkça söyler */
export function ageText(s: { age: number; birthDate?: string }) {
  if (s.birthDate) {
    const b = new Date(s.birthDate);
    if (!Number.isNaN(b.getTime())) {
      const n = new Date();
      const age = n.getFullYear() - b.getFullYear() - (n < new Date(n.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0);
      return `${age} yaş`;
    }
  }
  return s.age > 0 ? `${s.age} yaş` : "yaş bilinmiyor";
}
