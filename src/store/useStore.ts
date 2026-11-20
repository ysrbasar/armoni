import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TENANT } from "@/lib/tenant";
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
import { ALL_PIECES, ALL_SKILLS, CURRICULA, applyCatalog, armoniCurriculumId, instrumentById, pieceById, skillById, levelName } from "@/data/catalog";
import { copyCurriculum, generateCurriculum, INSTRUMENT_COLORS, slugify } from "@/data/curriculum";
import type { Curriculum, Instrument, InstrumentFamily, Piece, Skill } from "@/data/types";
import { api, type AppUser, type Changes } from "@/lib/api";
import type { Parent, Teacher } from "@/data/types";

export type NewTeacher = Pick<Teacher, "name" | "title" | "specialties" | "email">;

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

export type NewStudent = Pick<Student, "name" | "age" | "instrument" | "teacherId" | "level" | "branchId" | "institutionId" | "tc" | "phone">;
export type NewLesson = Omit<Lesson, "id" | "status" | "gains" | "notes" | "attendance" | "nextGoal" | "pieceIds"> & { pieceIds?: string[] };
export type NewAssignment = Omit<Assignment, "id" | "status" | "createdAt" | "feedback">;

interface State {
  data: DemoData;
  session: Session;
  toasts: Toast[];
  sidebarCollapsed: boolean;

  /** Sunucu oturumu */
  user: AppUser | null;
  setupRequired: boolean;
  booted: boolean;
  boot: () => Promise<void>;
  applyUser: (user: AppUser, data?: Partial<DemoData>) => void;
  addTeacher: (t: NewTeacher) => string;
  updateTeacher: (id: string, patch: Partial<Teacher>) => void;
  setRooms: (rooms: string[], rename?: { from: string; to: string }) => void;
  addParent: (studentId: string, name: string) => string;

  /* Müfredat (yalnızca kurum) */
  addCurriculum: (instrumentId: string, frameworkId: string) => string;
  duplicateCurriculum: (curriculumId: string) => string;
  setActiveCurriculum: (instrumentId: string, curriculumId: string) => void;
  updateCurriculum: (curriculumId: string, patch: Partial<Curriculum>) => void;
  removeCurriculum: (curriculumId: string) => void;
  saveSkill: (skill: Skill) => void;
  saveCatalogPiece: (piece: Piece) => void;
  addInstrument: (input: { name: string; family: InstrumentFamily; color: number; frameworkId: string }) => string;
  updateInstrument: (id: string, patch: Partial<Instrument>) => void;

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
  /** Aynı dersi verilen tarihlere seri olarak ekler; seri kimliğini döner */
  addLessonSeries: (l: NewLesson, dates: string[]) => string;
  updateLessonSeries: (lessonId: string, patch: Partial<Lesson>, dayShift: number) => number;
  deleteLessons: (ids: string[]) => void;
  deleteStudent: (id: string) => void;
  deleteTeacher: (id: string) => boolean;
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
  institutionId: TENANT?.institution.id ?? "armoni",
  teacherId: "t1",
  studentId: "s1",
  parentId: "p1",
  childId: "s1",
};

let toastId = 0;
/** Kimliğe göre ekle ya da değiştir */
const upsert = <T extends { id: string }>(arr: T[], rec: T): T[] => (arr.some((x) => x.id === rec.id) ? arr.map((x) => (x.id === rec.id ? rec : x)) : [...arr, rec]);
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

        user: null,
        setupRequired: false,
        booted: false,

        boot: async () => {
          // Demo: sunucu yok, veri tarayıcıda
          if (!TENANT) {
            applyCatalog(get().data);
            set({ booted: true });
            return;
          }
          try {
            const r = await api.state();
            if (r.user && !r.user.mustChange) get().applyUser(r.user, r.data);
            else set({ user: r.user, setupRequired: r.setupRequired });
          } catch (e) {
            get().toast(e instanceof Error ? e.message : "Sunucuya ulaşılamadı", "error");
          }
          set({ booted: true });
        },

        applyUser: (user, remote) => {
          const data: DemoData = { ...createSeed(), ...(remote ?? {}) };
          applyCatalog(data);
          const parent = user.role === "parent" ? data.parents.find((p) => p.id === user.entityId) : undefined;
          const child = parent?.childIds[0] ?? "";
          remoteApply(() =>
            set({
              user,
              setupRequired: false,
              data,
              session: {
                role: user.role,
                institutionId: data.institutions[0]?.id ?? DEFAULT_SESSION.institutionId,
                teacherId: user.role === "teacher" ? user.entityId : "",
                studentId: user.role === "student" ? user.entityId : "",
                parentId: user.role === "parent" ? user.entityId : "",
                childId: user.role === "student" ? user.entityId : child,
              },
            }),
          );
        },

        addTeacher: (input) => {
          const id = uid("t");
          const t: Teacher = {
            ...input,
            id,
            institutionId: get().session.institutionId,
            bio: "",
            levels: [0, 1, 2, 3, 4],
            education: [],
            certificates: [],
            experience: [],
            experienceYears: 0,
            capacity: 20,
          };
          set((st) => ({
            data: withActivity({ ...st.data, teachers: [...st.data.teachers, t] }, activity(t.institutionId, "teacher", `${t.name} kurum ekibine katıldı`)),
          }));
          get().toast(`${t.name} eklendi`);
          return id;
        },

        updateTeacher: (id, patch) => {
          set((st) => ({ data: { ...st.data, teachers: st.data.teachers.map((t) => (t.id === id ? { ...t, ...patch } : t)) } }));
          get().toast("Öğretmen bilgileri güncellendi");
        },

        setRooms: (rooms, rename) => {
          const instId = get().session.institutionId;
          const ren = (r?: string) => (rename && r === rename.from ? rename.to : r);
          set((st) => ({
            data: {
              ...st.data,
              institutions: st.data.institutions.map((i) => (i.id === instId ? { ...i, rooms } : i)),
              // Derslik yeniden adlandırıldıysa dersler ve öğretmenler de yeni adı alır
              lessons: rename ? st.data.lessons.map((l) => (l.room === rename.from ? { ...l, room: rename.to } : l)) : st.data.lessons,
              teachers: rename ? st.data.teachers.map((t) => (t.room === rename.from ? { ...t, room: ren(t.room) } : t)) : st.data.teachers,
            },
          }));
        },

        addParent: (studentId, name) => {
          const id = uid("p");
          const p: Parent = { id, name, childIds: [studentId] };
          set((st) => ({
            data: {
              ...st.data,
              parents: [...st.data.parents, p],
              students: st.data.students.map((s) => (s.id === studentId ? { ...s, parentId: id } : s)),
            },
          }));
          get().toast(`Veli eklendi: ${name}`);
          return id;
        },

        addCurriculum: (instrumentId, frameworkId) => {
          const { curriculum, skills, pieces } = generateCurriculum(instrumentById[instrumentId], frameworkId);
          set((st) => ({ data: { ...st.data, curricula: [...st.data.curricula, curriculum], skills: [...st.data.skills, ...skills], pieces: [...st.data.pieces, ...pieces] } }));
          get().toast(`Program eklendi: ${curriculum.name}`);
          return curriculum.id;
        },

        duplicateCurriculum: (cid) => {
          const src = CURRICULA.find((c) => c.id === cid)!;
          const of = (x: { curriculumId?: string; instrument: string; hidden?: boolean }) => !x.hidden && (x.curriculumId ?? armoniCurriculumId(x.instrument)) === cid;
          const copy = copyCurriculum(src, ALL_SKILLS.filter(of), ALL_PIECES.filter(of), `${src.name} (kurum kopyası)`);
          set((st) => ({ data: { ...st.data, curricula: [...st.data.curricula, copy.curriculum], skills: [...st.data.skills, ...copy.skills], pieces: [...st.data.pieces, ...copy.pieces] } }));
          get().toast("Program kopyalandı; kopyayı serbestçe düzenleyebilirsiniz");
          return copy.curriculum.id;
        },

        setActiveCurriculum: (instrumentId, cid) => {
          get().updateInstrument(instrumentId, { activeCurriculumId: cid });
          get().toast("Aktif program değişti; öğrenci ve öğretmen ekranları bu programı kullanır");
        },

        updateCurriculum: (cid, patch) => {
          const base = CURRICULA.find((c) => c.id === cid) ?? get().data.curricula.find((c) => c.id === cid)!;
          set((st) => ({ data: { ...st.data, curricula: upsert(st.data.curricula, { ...base, ...st.data.curricula.find((c) => c.id === cid), ...patch }) } }));
        },

        removeCurriculum: (cid) => {
          const c = CURRICULA.find((x) => x.id === cid)!;
          if (instrumentById[c.instrument].activeCurriculumId === cid) get().updateInstrument(c.instrument, { activeCurriculumId: undefined });
          get().updateCurriculum(cid, { hidden: true });
          get().toast("Program kaldırıldı", "info");
        },

        saveSkill: (skill) => set((st) => ({ data: { ...st.data, skills: upsert(st.data.skills, skill) } })),
        saveCatalogPiece: (piece) => set((st) => ({ data: { ...st.data, pieces: upsert(st.data.pieces, piece) } })),

        updateInstrument: (id, patch) => {
          const base = instrumentById[id];
          set((st) => ({ data: { ...st.data, instruments: upsert(st.data.instruments, { ...base, ...st.data.instruments.find((i) => i.id === id), ...patch }) } }));
        },

        addInstrument: ({ name, family, color, frameworkId }) => {
          let id = slugify(name) || "enstruman";
          const taken = (x: string) => get().data.instruments.some((i) => i.id === x) || ["piano", "guitar", "violin", "baglama", "drums", "voice", "flute", "theory"].includes(x);
          for (let n = 2; taken(id); n++) id = `${slugify(name) || "enstruman"}-${n}`;
          const [tint, tone] = INSTRUMENT_COLORS[color % INSTRUMENT_COLORS.length];
          const ins: Instrument = { id, name, short: name, tint, tone, goals: [], family, custom: true };
          const { curriculum, skills, pieces } = generateCurriculum(ins, frameworkId);
          ins.activeCurriculumId = curriculum.id;
          const instId = get().session.institutionId;
          set((st) => ({
            data: {
              ...st.data,
              instruments: [...st.data.instruments, ins],
              curricula: [...st.data.curricula, curriculum],
              skills: [...st.data.skills, ...skills],
              pieces: [...st.data.pieces, ...pieces],
              institutions: st.data.institutions.map((i) => (i.id === instId && !i.courseIds.includes(id) ? { ...i, courseIds: [...i.courseIds, id] } : i)),
            },
          }));
          get().toast(`${name} eklendi; programı hazır`);
          return id;
        },

        login: (role) => set((st) => ({ session: { ...st.session, role } })),
        logout: () => {
          if (!TENANT) {
            set((st) => ({ session: { ...st.session, role: null } }));
            return;
          }
          api.logout().catch(() => undefined);
          remoteApply(() => set({ user: null, data: createSeed(), session: { ...DEFAULT_SESSION, role: null } }));
        },
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

        addLessonSeries: (l, dates) => {
          const seriesId = dates.length > 1 ? uid("ser") : undefined;
          const items: Lesson[] = dates.map((date) => ({ ...l, date, id: uid("l"), seriesId, status: "scheduled", gains: [], notes: "", nextGoal: "", pieceIds: l.pieceIds ?? [] }));
          set((st) => ({
            data: withActivity(
              { ...st.data, lessons: [...st.data.lessons, ...items] },
              activity(l.institutionId, "lesson", `${student(l.studentId).name} için ${items.length > 1 ? `${items.length} derslik program` : "yeni ders"} planlandı`),
            ),
          }));
          get().toast(items.length > 1 ? `${items.length} ders takvime işlendi` : "Ders takvime eklendi");
          return seriesId ?? "";
        },

        updateLessonSeries: (lessonId, patch, dayShift) => {
          const base = get().data.lessons.find((x) => x.id === lessonId)!;
          const shift = (iso: string) => {
            const [y, m, d] = iso.split("-").map(Number);
            const t = new Date(y, m - 1, d + dayShift);
            return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
          };
          let n = 0;
          set((st) => ({
            data: {
              ...st.data,
              lessons: st.data.lessons.map((x) => {
                if (x.seriesId !== base.seriesId || x.date < base.date || x.status !== "scheduled") return x;
                n++;
                const { date: _d, ...rest } = patch;
                return { ...x, ...rest, date: dayShift ? shift(x.date) : x.date };
              }),
            },
          }));
          get().toast(`${n} ders güncellendi`);
          return n;
        },

        deleteLessons: (ids) => {
          set((st) => ({ data: { ...st.data, lessons: st.data.lessons.filter((x) => !ids.includes(x.id)) } }));
          get().toast(ids.length > 1 ? `${ids.length} ders silindi` : "Ders silindi", "info");
        },

        deleteStudent: (id) => {
          const s = student(id);
          set((st) => ({
            data: withActivity(
              {
                ...st.data,
                students: st.data.students.filter((x) => x.id !== id),
                lessons: st.data.lessons.filter((x) => x.studentId !== id),
                assignments: st.data.assignments.filter((x) => x.studentId !== id),
                studentPieces: st.data.studentPieces.filter((x) => x.studentId !== id),
                payments: st.data.payments.filter((x) => x.studentId !== id),
                // Velinin başka çocuğu yoksa veli kaydı da kalkar
                parents: st.data.parents
                  .map((p) => (p.childIds.includes(id) ? { ...p, childIds: p.childIds.filter((c) => c !== id) } : p))
                  .filter((p) => p.childIds.length > 0),
              },
              activity(s.institutionId, "student", `${s.name} kaydı silindi`),
            ),
          }));
          get().toast(`${s.name} silindi`, "info");
        },

        deleteTeacher: (id) => {
          const t = teacher(id);
          if (get().data.students.some((s) => s.teacherId === id)) return false;
          set((st) => ({
            data: withActivity(
              {
                ...st.data,
                teachers: st.data.teachers.filter((x) => x.id !== id),
                lessons: st.data.lessons.filter((x) => !(x.teacherId === id && x.status === "scheduled")),
                teacherAbsences: st.data.teacherAbsences.filter((x) => x.teacherId !== id),
              },
              activity(t.institutionId, "teacher", `${t.name} kurumdan çıkarıldı`),
            ),
          }));
          get().toast(`${t.name} silindi`, "info");
          return true;
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
      name: TENANT?.storageKey ?? "armoni-demo-v3",
      // Kurumda veri ve oturum sunucuda; demoda veri tarayıcıda saklanır
      partialize: (st) => (TENANT ? { sidebarCollapsed: st.sidebarCollapsed } : { data: st.data, session: st.session, sidebarCollapsed: st.sidebarCollapsed }),
      onRehydrateStorage: () => (st) => {
        if (st && !TENANT) applyCatalog(st.data);
      },
    },
  ),
);

/* ───────────── Sunucuyla eşitleme ─────────────
   Her işlem önce ekranda uygulanır; değişen kayıtlar kısa bir gecikmeyle sunucuya gönderilir.
   Kayıtlar değiştirilmeden (immutable) güncellendiği için "değişti mi" sorusu referans karşılaştırmasıdır. */

const SYNCED = ["instruments", "curricula", "skills", "pieces", "institutions", "teachers", "students", "parents", "studentPieces", "assignments", "lessons", "activities", "payments", "teacherAbsences"] as const;

let lastSynced: DemoData | null = null;
let applyingRemote = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let inflight: Promise<void> = Promise.resolve();

function remoteApply(fn: () => void) {
  applyingRemote = true;
  try {
    fn();
  } finally {
    applyingRemote = false;
  }
  lastSynced = useStore.getState().data;
}

function diff(prev: DemoData, next: DemoData): Changes | null {
  const out: Changes = {};
  let any = false;
  for (const k of SYNCED) {
    const a = prev[k] as { id: string }[];
    const b = next[k] as { id: string }[];
    if (a === b) continue;
    const before = new Map(a.map((x) => [x.id, x]));
    const upsert = b.filter((x) => before.get(x.id) !== x);
    const after = new Set(b.map((x) => x.id));
    // Ekrandaki aktivite listesi kısaltılır; bu bir silme isteği değildir
    const del = k === "activities" ? [] : a.filter((x) => !after.has(x.id)).map((x) => x.id);
    if (upsert.length || del.length) {
      out[k] = { upsert, delete: del };
      any = true;
    }
  }
  return any ? out : null;
}

/** Bekleyen değişiklikleri hemen gönderir (ör. hesap açmadan önce kaydın sunucuda olması için) */
export function flushSync(): Promise<void> {
  clearTimeout(timer);
  inflight = inflight.then(async () => {
    const st = useStore.getState();
    if (!lastSynced || !st.user || st.user.mustChange) return;
    const snapshot = st.data;
    const changes = diff(lastSynced, snapshot);
    if (!changes) return;
    try {
      const r = await api.sync(changes);
      lastSynced = snapshot;
      if (r.rejected) st.toast("Bazı değişiklikler için yetkiniz yok; kaydedilmedi", "error");
    } catch (e) {
      st.toast(e instanceof Error ? `Kaydedilemedi: ${e.message}` : "Kaydedilemedi", "error");
      // Ekranı sunucudaki doğru hale döndür
      if (e && typeof e === "object" && "status" in e && (e as { status: number }).status === 401) st.logout();
      else await useStore.getState().boot();
    }
  });
  return inflight;
}

useStore.subscribe((s, p) => {
  // Katalog değiştiyse ekrandaki enstrüman/kazanım/parça listelerini yenile (ekran çizilmeden önce)
  if (s.data.instruments !== p.data.instruments || s.data.skills !== p.data.skills || s.data.pieces !== p.data.pieces || s.data.curricula !== p.data.curricula) applyCatalog(s.data);
  if (s.data === p.data || applyingRemote || !s.user) return;
  clearTimeout(timer);
  timer = setTimeout(() => void flushSync(), 400);
});

if (typeof window !== "undefined") {
  // Sekme kapanırken bekleyen değişiklik kalmasın
  window.addEventListener("pagehide", () => void flushSync());
}

/** Bir parça ödevle ilişkili mi — parça detayında kullanılır */
export const pieceTitle = (id?: string) => (id ? pieceById[id]?.title : undefined);
