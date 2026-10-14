import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSeed } from "@/data/seed";
import type {
  Attendance,
  Payment,
  PaymentMethod,
  TeacherAbsence,
  Activity,
  ActivityKind,
  Assignment,
  AssignmentStatus,
  DemoData,
  Lesson,
  Level,
  PieceStatus,
  Role,
  Student,
} from "@/data/types";
import { dayIndex, todayISO } from "@/lib/date";
import { pieceById, skillById, levelName } from "@/data/catalog";

export interface Session {
  role: Role | null;
  institutionId: string;
  teacherId: string;
  studentId: string;
  parentId: string;
  childId: string;
}

export interface Toast {
  id: number;
  text: string;
  tone: "success" | "info" | "error";
}

export type NewStudent = Pick<Student, "name" | "age" | "instrument" | "teacherId" | "level" | "branchId" | "institutionId">;
export type NewLesson = Omit<Lesson, "id" | "status" | "gains" | "notes" | "attendance" | "nextGoal" | "pieceIds"> & { pieceIds?: string[] };
export type NewAssignment = Omit<Assignment, "id" | "status" | "createdAt" | "feedback">;

interface State {
  data: DemoData;
  session: Session;
  toasts: Toast[];
  sidebarCollapsed: boolean;

  login: (role: Role) => void;
  logout: () => void;
  setInstitution: (id: string) => void;
  setChild: (id: string) => void;
  setTeacher: (id: string) => void;
  toggleSidebar: () => void;
  toast: (text: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
  resetDemo: () => void;

  addStudent: (s: NewStudent) => string;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  assignTeacher: (studentId: string, teacherId: string) => void;

  addLesson: (l: NewLesson) => void;
  updateLesson: (id: string, patch: Partial<Lesson>) => void;
  completeLesson: (id: string, patch: Partial<Lesson>) => void;

  addAssignment: (a: NewAssignment) => void;
  setAssignmentStatus: (id: string, status: AssignmentStatus, feedback?: string) => void;

  setPieceStatus: (spId: string, status: PieceStatus) => void;
  toggleSkill: (studentId: string, skillId: string) => void;
  approveLevel: (studentId: string, note?: string) => void;
  addEvaluation: (studentId: string, text: string, rating: 1 | 2 | 3 | 4 | 5) => void;
  logPractice: (studentId: string, minutes: number) => void;

  markPaymentPaid: (id: string, method: PaymentMethod) => void;
  markPaymentUnpaid: (id: string) => void;
  remindPayment: (id: string) => void;
  addTeacherAbsence: (a: Omit<TeacherAbsence, "id">) => void;
  removeTeacherAbsence: (id: string) => void;
  setLessonAttendance: (lessonId: string, attendance: Attendance) => void;
}

const DEFAULT_SESSION: Session = {
  role: null,
  institutionId: "armoni",
  teacherId: "t1",
  studentId: "s1",
  parentId: "p1",
  childId: "s1",
};

let toastId = 0;
const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const activity = (institutionId: string, kind: ActivityKind, text: string, actor?: string): Activity => ({
        id: uid("ac"),
        institutionId,
        kind,
        text,
        actor,
        at: new Date().toISOString(),
      });
      const withActivity = (data: DemoData, a: Activity): DemoData => ({ ...data, activities: [a, ...data.activities].slice(0, 80) });
      const student = (id: string) => get().data.students.find((s) => s.id === id)!;
      const teacher = (id: string) => get().data.teachers.find((t) => t.id === id)!;

      return {
        data: createSeed(),
        session: DEFAULT_SESSION,
        toasts: [],
        sidebarCollapsed: false,

        login: (role) => set((st) => ({ session: { ...st.session, role } })),
        logout: () => set((st) => ({ session: { ...st.session, role: null } })),
        setInstitution: (id) => set((st) => ({ session: { ...st.session, institutionId: id } })),
        setChild: (id) => set((st) => ({ session: { ...st.session, childId: id } })),
        setTeacher: (id) => set((st) => ({ session: { ...st.session, teacherId: id } })),
        toggleSidebar: () => set((st) => ({ sidebarCollapsed: !st.sidebarCollapsed })),
        toast: (text, tone = "success") => {
          if (get().toasts.some((t) => t.text === text)) return;
          const id = ++toastId;
          set((st) => ({ toasts: [...st.toasts, { id, text, tone }] }));
          setTimeout(() => get().dismissToast(id), 3200);
        },
        dismissToast: (id) => set((st) => ({ toasts: st.toasts.filter((t) => t.id !== id) })),
        resetDemo: () => {
          set((st) => ({ data: createSeed(), session: { ...DEFAULT_SESSION, role: st.session.role } }));
          get().toast("Demo verileri sıfırlandı", "info");
        },

        addStudent: (input) => {
          const id = uid("s");
          const today = todayISO();
          const s: Student = {
            ...input,
            id,
            joinedAt: today,
            streak: 0,
            dailyGoal: 30,
            practiceWeek: [0, 0, 0, 0, 0, 0, 0],
            lastPractice: today,
            nextGoal: Object.values(skillById).find((k) => k.instrument === input.instrument && k.stage === input.level)?.title ?? "",
            skillsDone: Object.values(skillById)
              .filter((k) => k.instrument === input.instrument && k.stage < input.level)
              .map((k) => k.id),
            levelHistory: [{ level: input.level, date: today, approvedBy: input.teacherId, note: "Kayıt ve seviye belirleme" }],
            evaluations: [],
          };
          const inst = get().data.institutions.find((i) => i.id === input.institutionId)!;
          const period = today.slice(0, 7);
          const payment: Payment = {
            id: uid("pay"),
            institutionId: input.institutionId,
            studentId: id,
            period,
            amount: Math.round((inst.fee * (input.instrument === "theory" ? 0.7 : 1)) / 50) * 50,
            dueDate: today,
          };
          set((st) => ({
            data: withActivity(
              { ...st.data, students: [s, ...st.data.students], payments: [...st.data.payments, payment] },
              activity(input.institutionId, "student", `${s.name} kuruma kaydedildi`),
            ),
          }));
          get().toast(`${s.name} eklendi`);
          return id;
        },

        updateStudent: (id, patch) => {
          set((st) => ({ data: { ...st.data, students: st.data.students.map((s) => (s.id === id ? { ...s, ...patch } : s)) } }));
          get().toast("Öğrenci bilgileri güncellendi");
        },

        assignTeacher: (studentId, teacherId) => {
          const s = student(studentId);
          const t = teacher(teacherId);
          set((st) => ({
            data: withActivity(
              {
                ...st.data,
                students: st.data.students.map((x) => (x.id === studentId ? { ...x, teacherId } : x)),
                // Gelecek dersler ve açık ödevler yeni öğretmene geçer
                lessons: st.data.lessons.map((l) =>
                  l.studentId === studentId && l.status === "scheduled" ? { ...l, teacherId } : l,
                ),
                assignments: st.data.assignments.map((a) =>
                  a.studentId === studentId && a.status !== "done" ? { ...a, teacherId } : a,
                ),
              },
              activity(s.institutionId, "teacher", `${s.name} öğrencisi ${t.name} ile eşleştirildi`),
            ),
          }));
          get().toast(`${s.name} → ${t.name} ataması yapıldı`);
        },

        addLesson: (l) => {
          const lesson: Lesson = { ...l, id: uid("l"), status: "scheduled", gains: [], notes: "", nextGoal: "", pieceIds: l.pieceIds ?? [] };
          set((st) => ({
            data: withActivity(
              { ...st.data, lessons: [...st.data.lessons, lesson] },
              activity(l.institutionId, "lesson", `${student(l.studentId).name} için yeni ders planlandı`),
            ),
          }));
          get().toast("Ders takvime eklendi");
        },

        updateLesson: (id, patch) => {
          set((st) => ({ data: { ...st.data, lessons: st.data.lessons.map((l) => (l.id === id ? { ...l, ...patch } : l)) } }));
          get().toast("Ders güncellendi");
        },

        completeLesson: (id, patch) => {
          const l = get().data.lessons.find((x) => x.id === id)!;
          set((st) => ({
            data: withActivity(
              {
                ...st.data,
                lessons: st.data.lessons.map((x) =>
                  x.id === id ? { ...x, ...patch, status: "completed", attendance: patch.attendance ?? x.attendance ?? "present" } : x,
                ),
                students: patch.nextGoal
                  ? st.data.students.map((s) => (s.id === l.studentId ? { ...s, nextGoal: patch.nextGoal! } : s))
                  : st.data.students,
              },
              activity(l.institutionId, "lesson", `${teacher(l.teacherId).name} ${student(l.studentId).name} ile dersi tamamladı`, teacher(l.teacherId).name),
            ),
          }));
          get().toast("Ders tamamlandı olarak işaretlendi");
        },

        addAssignment: (a) => {
          const s = student(a.studentId);
          const item: Assignment = { ...a, id: uid("a"), status: "assigned", createdAt: todayISO() };
          set((st) => ({
            data: withActivity(
              { ...st.data, assignments: [item, ...st.data.assignments] },
              activity(s.institutionId, "assignment", `${teacher(a.teacherId).name} ${s.name} için "${a.title}" ödevini verdi`, teacher(a.teacherId).name),
            ),
          }));
          get().toast("Ödev oluşturuldu · öğrenci ve veli ekranında görünür");
        },

        setAssignmentStatus: (id, status, feedback) => {
          const a = get().data.assignments.find((x) => x.id === id)!;
          const s = student(a.studentId);
          const text =
            status === "submitted"
              ? `${s.name} "${a.title}" ödevini teslim etti`
              : status === "done"
                ? `"${a.title}" ödevi tamamlandı`
                : `${s.name} "${a.title}" ödevine başladı`;
          set((st) => ({
            data: withActivity(
              {
                ...st.data,
                assignments: st.data.assignments.map((x) => (x.id === id ? { ...x, status, feedback: feedback ?? x.feedback } : x)),
              },
              activity(s.institutionId, "assignment", text),
            ),
          }));
          get().toast(
            status === "submitted" ? "Ödev öğretmen onayına gönderildi" : status === "done" ? "Ödev tamamlandı" : status === "in_progress" ? "Ödev çalışılıyor olarak işaretlendi" : "Ödev güncellendi",
          );
        },

        setPieceStatus: (spId, status) => {
          const sp = get().data.studentPieces.find((x) => x.id === spId)!;
          const s = student(sp.studentId);
          const p = pieceById[sp.pieceId];
          set((st) => {
            const data = {
              ...st.data,
              studentPieces: st.data.studentPieces.map((x) =>
                x.id === spId
                  ? { ...x, status, completedAt: status === "done" ? todayISO() : undefined, currentTempo: status === "done" ? x.targetTempo : x.currentTempo }
                  : x,
              ),
            };
            return {
              data:
                status === "done"
                  ? withActivity(data, activity(s.institutionId, "piece", `${s.name} "${p.title}" parçasını tamamladı`))
                  : data,
            };
          });
          get().toast(status === "done" ? `"${p.title}" tamamlandı` : status === "review" ? "Parça öğretmen değerlendirmesine gönderildi" : "Parça durumu güncellendi");
        },

        toggleSkill: (studentId, skillId) => {
          set((st) => ({
            data: {
              ...st.data,
              students: st.data.students.map((s) =>
                s.id === studentId
                  ? { ...s, skillsDone: s.skillsDone.includes(skillId) ? s.skillsDone.filter((k) => k !== skillId) : [...s.skillsDone, skillId] }
                  : s,
              ),
            },
          }));
          const done = student(studentId).skillsDone.includes(skillId);
          get().toast(done ? `Kazanım onaylandı: ${skillById[skillId].title}` : "Kazanım onayı geri alındı", done ? "success" : "info");
        },

        approveLevel: (studentId, note) => {
          const s = student(studentId);
          if (s.level >= 4) return;
          const next = (s.level + 1) as Level;
          set((st) => ({
            data: withActivity(
              {
                ...st.data,
                students: st.data.students.map((x) =>
                  x.id === studentId
                    ? {
                        ...x,
                        level: next,
                        levelHistory: [...x.levelHistory, { level: next, date: todayISO(), approvedBy: x.teacherId, note: note || "Öğretmen değerlendirmesiyle onaylandı" }],
                        nextGoal: Object.values(skillById).find((k) => k.instrument === x.instrument && k.stage === next)?.title ?? x.nextGoal,
                      }
                    : x,
                ),
              },
              activity(s.institutionId, "level", `${s.name} ${levelName(next)} seviyesine geçti`, teacher(s.teacherId).name),
            ),
          }));
          get().toast(`${s.name} artık ${levelName(next)} seviyesinde`);
        },

        addEvaluation: (studentId, text, rating) => {
          set((st) => ({
            data: {
              ...st.data,
              students: st.data.students.map((s) =>
                s.id === studentId
                  ? { ...s, evaluations: [{ id: uid("ev"), date: todayISO(), teacherId: s.teacherId, text, rating }, ...s.evaluations] }
                  : s,
              ),
            },
          }));
          get().toast("Değerlendirme kaydedildi");
        },

        logPractice: (studentId, minutes) => {
          const today = todayISO();
          const idx = dayIndex(today);
          const s = student(studentId);
          const before = s.practiceWeek[idx];
          const after = before + minutes;
          const reachedGoal = before < s.dailyGoal && after >= s.dailyGoal;
          set((st) => {
            const data = {
              ...st.data,
              students: st.data.students.map((x) =>
                x.id === studentId
                  ? {
                      ...x,
                      practiceWeek: x.practiceWeek.map((m, i) => (i === idx ? after : m)),
                      lastPractice: today,
                      streak: x.lastPractice === today ? x.streak : x.streak + 1,
                    }
                  : x,
              ),
            };
            return { data: reachedGoal ? withActivity(data, activity(s.institutionId, "practice", `${s.name} günlük çalışma hedefine ulaştı`)) : data };
          });
          get().toast(reachedGoal ? "Günlük hedef tamamlandı!" : `${minutes} dakika çalışma kaydedildi`);
        },

        markPaymentPaid: (id, method) => {
          const p = get().data.payments.find((x) => x.id === id)!;
          const s = student(p.studentId);
          set((st) => ({
            data: withActivity(
              { ...st.data, payments: st.data.payments.map((x) => (x.id === id ? { ...x, paidAt: todayISO(), method } : x)) },
              activity(p.institutionId, "institution", `${s.name} için ${p.amount.toLocaleString("tr-TR")} TL ödeme alındı (${method})`),
            ),
          }));
          get().toast("Ödeme kaydedildi");
        },

        markPaymentUnpaid: (id) => {
          set((st) => ({ data: { ...st.data, payments: st.data.payments.map((x) => (x.id === id ? { ...x, paidAt: undefined, method: undefined } : x)) } }));
          get().toast("Ödeme kaydı geri alındı", "info");
        },

        remindPayment: (id) => {
          const p = get().data.payments.find((x) => x.id === id)!;
          const s = student(p.studentId);
          const parent = get().data.parents.find((x) => x.id === s.parentId);
          get().toast(`${parent ? parent.name : s.name} için ödeme hatırlatması oluşturuldu (demo)`, "info");
        },

        addTeacherAbsence: (a) => {
          const t = teacher(a.teacherId);
          const LABEL = { izin: "izinli", rapor: "raporlu", gelmedi: "gelmedi" } as const;
          let cancelled = 0;
          set((st) => ({
            data: withActivity(
              {
                ...st.data,
                teacherAbsences: [{ ...a, id: uid("ta") }, ...st.data.teacherAbsences],
                lessons: st.data.lessons.map((l) => {
                  if (l.teacherId !== a.teacherId || l.date !== a.date || l.status === "cancelled") return l;
                  cancelled++;
                  return { ...l, status: "cancelled", attendance: undefined, notes: `Öğretmen devamsızlığı: ${a.note || LABEL[a.type]}` };
                }),
              },
              activity(a.institutionId, "teacher", `${t.name} ${a.date} tarihinde ${LABEL[a.type]} olarak işaretlendi`),
            ),
          }));
          get().toast(cancelled ? `Devamsızlık kaydedildi · ${cancelled} ders iptal edildi` : "Devamsızlık kaydedildi");
        },

        removeTeacherAbsence: (id) => {
          set((st) => ({ data: { ...st.data, teacherAbsences: st.data.teacherAbsences.filter((a) => a.id !== id) } }));
          get().toast("Devamsızlık kaydı silindi", "info");
        },

        setLessonAttendance: (lessonId, attendance) => {
          set((st) => ({ data: { ...st.data, lessons: st.data.lessons.map((l) => (l.id === lessonId ? { ...l, attendance } : l)) } }));
          get().toast("Devam durumu güncellendi");
        },
      };
    },
    {
      name: "armoni-demo-v2",
      partialize: (st) => ({ data: st.data, session: st.session, sidebarCollapsed: st.sidebarCollapsed }),
    },
  ),
);

/** Bir parça ödevle ilişkili mi — parça detayında kullanılır */
export const pieceTitle = (id?: string) => (id ? pieceById[id]?.title : undefined);
