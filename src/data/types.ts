export type Role = "platform" | "inst" | "teacher" | "student" | "parent";

/** Hazır gelen enstrümanlar; kurum bunlara yenilerini ekleyebilir */
export type BuiltinInstrumentId = "piano" | "guitar" | "violin" | "baglama" | "drums" | "voice" | "flute" | "theory";
export type InstrumentId = string;

/** 0: Başlangıç · 1: Temel · 2: Gelişen · 3: Orta · 4: İleri */
export type Level = 0 | 1 | 2 | 3 | 4;

/** Enstrüman ailesi: yeni enstrümanın müfredatı bu aileden türetilir */
export type InstrumentFamily = "klavye" | "telli" | "yayli" | "uflemeli" | "vurmali" | "ses" | "kuram";

export interface Instrument {
  id: InstrumentId;
  name: string;
  short: string;
  /** Arayüz vurgusu için açık ve koyu ton */
  tint: string;
  tone: string;
  goals: string[];
  family?: InstrumentFamily;
  /** Kurumun bu enstrümanda kullandığı program; boşsa Armoni temel programı */
  activeCurriculumId?: string;
  /** Kurumun eklediği enstrüman */
  custom?: boolean;
  hidden?: boolean;
}

/** Bir enstrüman için eğitim programı (ör. Armoni temel, ABRSM tipi, MEB GSL) */
export interface Curriculum {
  id: string;
  instrument: InstrumentId;
  name: string;
  /** Şablonun kaynağı (çerçeve kimliği) */
  frameworkId: string;
  region: "Dünya" | "Türkiye" | "Kurum";
  description: string;
  /** Uygulamadaki 5 seviyenin bu programdaki karşılığı (ör. "Grade 1–2") */
  levelLabels: string[];
  createdAt: string;
  hidden?: boolean;
}

/** Öğrencinin velisi / yakını (iletişim bilgisi) */
export interface Guardian {
  relation: string;
  name: string;
  phone: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  rooms: number;
}

export interface Institution {
  id: string;
  name: string;
  short: string;
  city: string;
  founded: number;
  plan: "Başlangıç" | "Profesyonel" | "Kurumsal";
  accent: string;
  branches: Branch[];
  courseIds: InstrumentId[];
  adminName: string;
  /** Aylık bireysel ders ücreti (TL) */
  fee: number;
  /** Derslik adları; takvim çakışmaları derslik bazında hesaplanır */
  rooms?: string[];
}

export interface Education {
  school: string;
  degree: string;
  year: number;
}

export interface Experience {
  role: string;
  place: string;
  years: string;
}

export interface Teacher {
  id: string;
  institutionId: string;
  name: string;
  title: string;
  bio: string;
  specialties: InstrumentId[];
  levels: Level[];
  education: Education[];
  certificates: string[];
  experience: Experience[];
  experienceYears: number;
  capacity: number;
  email: string;
  phone?: string;
  /** Öğretmenin genelde ders verdiği derslik; yeni derslerde varsayılan */
  room?: string;
}

export interface LevelRecord {
  level: Level;
  date: string;
  approvedBy: string;
  note?: string;
}

export interface Evaluation {
  id: string;
  date: string;
  teacherId: string;
  text: string;
  rating: 1 | 2 | 3 | 4 | 5;
}

export interface Student {
  id: string;
  institutionId: string;
  branchId: string;
  name: string;
  age: number;
  instrument: InstrumentId;
  teacherId: string;
  level: Level;
  joinedAt: string;
  parentId?: string;
  streak: number;
  dailyGoal: number;
  practiceWeek: number[];
  lastPractice: string;
  nextGoal: string;
  skillsDone: string[];
  levelHistory: LevelRecord[];
  evaluations: Evaluation[];
  levelUpRequested?: boolean;
  /** TC kimlik no (yalnızca kurum ve öğrencinin kendisi görür) */
  tc?: string;
  /** İletişim telefonu (öğrenci ya da veli); öğretmen ekranında görünmez */
  phone?: string;
  /** YYYY-AA-GG; yaş bundan hesaplanır */
  birthDate?: string;
  guardians?: Guardian[];
  notes?: string;
}

export interface Parent {
  id: string;
  name: string;
  childIds: string[];
  relation?: string;
  phone?: string;
}

export interface Piece {
  id: string;
  title: string;
  composer: string;
  instrument: InstrumentId;
  level: Level;
  tempo: number;
  /** Ait olduğu program; boşsa Armoni temel programı */
  curriculumId?: string;
  hidden?: boolean;
}

export type PieceStatus = "learning" | "practice" | "review" | "done";

export interface StudentPiece {
  id: string;
  studentId: string;
  pieceId: string;
  status: PieceStatus;
  goal: string;
  teacherNote: string;
  targetTempo: number;
  currentTempo: number;
  completedAt?: string;
}

export interface Skill {
  id: string;
  instrument: InstrumentId;
  stage: Level;
  title: string;
  description: string;
  curriculumId?: string;
  hidden?: boolean;
}

export type AssignmentStatus = "assigned" | "in_progress" | "submitted" | "done";

export interface Assignment {
  id: string;
  studentId: string;
  teacherId: string;
  title: string;
  description: string;
  pieceId?: string;
  skillId?: string;
  dueDate: string;
  tempo?: number;
  reps?: number;
  minutes?: number;
  status: AssignmentStatus;
  requiresApproval: boolean;
  feedback?: string;
  createdAt: string;
}

export type LessonStatus = "scheduled" | "completed" | "cancelled";
export type Attendance = "present" | "late" | "absent";

export interface Lesson {
  id: string;
  /** Tekrarlayan bir derse aitse serinin kimliği */
  seriesId?: string;
  institutionId: string;
  teacherId: string;
  studentId: string;
  instrument: InstrumentId;
  date: string;
  start: string;
  duration: number;
  room: string;
  topic: string;
  status: LessonStatus;
  pieceIds: string[];
  gains: string[];
  notes: string;
  attendance?: Attendance;
  nextGoal: string;
}

export type ActivityKind =
  | "assignment"
  | "lesson"
  | "piece"
  | "student"
  | "teacher"
  | "level"
  | "institution"
  | "practice";

export interface Activity {
  id: string;
  institutionId: string;
  kind: ActivityKind;
  text: string;
  at: string;
  actor?: string;
}

export type PaymentMethod = "Nakit" | "Kredi kartı" | "Havale/EFT";

export interface Payment {
  id: string;
  institutionId: string;
  studentId: string;
  /** YYYY-MM */
  period: string;
  amount: number;
  dueDate: string;
  paidAt?: string;
  method?: PaymentMethod;
}

export type TeacherAbsenceType = "izin" | "rapor" | "gelmedi";

export interface TeacherAbsence {
  id: string;
  institutionId: string;
  teacherId: string;
  date: string;
  type: TeacherAbsenceType;
  note: string;
}

export interface DemoData {
  /** Kurumun eklediği enstrümanlar ve hazır enstrümanlarda yaptığı değişiklikler */
  instruments: Instrument[];
  curricula: Curriculum[];
  institutions: Institution[];
  teachers: Teacher[];
  students: Student[];
  parents: Parent[];
  pieces: Piece[];
  studentPieces: StudentPiece[];
  skills: Skill[];
  assignments: Assignment[];
  lessons: Lesson[];
  activities: Activity[];
  payments: Payment[];
  teacherAbsences: TeacherAbsence[];
}
