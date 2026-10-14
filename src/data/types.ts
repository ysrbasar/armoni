export type Role = "platform" | "inst" | "teacher" | "student" | "parent";

export type InstrumentId =
  | "piano"
  | "guitar"
  | "violin"
  | "baglama"
  | "drums"
  | "voice"
  | "flute"
  | "theory";

/** 0: Başlangıç · 1: Temel · 2: Gelişen · 3: Orta · 4: İleri */
export type Level = 0 | 1 | 2 | 3 | 4;

export interface Instrument {
  id: InstrumentId;
  name: string;
  short: string;
  /** Arayüz vurgusu için açık ve koyu ton */
  tint: string;
  tone: string;
  goals: string[];
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
}

export interface Parent {
  id: string;
  name: string;
  childIds: string[];
}

export interface Piece {
  id: string;
  title: string;
  composer: string;
  instrument: InstrumentId;
  level: Level;
  tempo: number;
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
