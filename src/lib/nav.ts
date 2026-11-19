import { TENANT } from "@/lib/tenant";
import {
  Activity,
  AudioWaveform,
  Award,
  BarChart3,
  BookOpen,
  Building2,
  CalendarCheck2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  HeartHandshake,
  Home,
  KeyRound,
  ListChecks,
  LayoutDashboard,
  LayoutGrid,
  Music2,
  Route,
  Settings2,
  Sparkles,
  TrendingUp,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/data/types";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const ROLE_META: Record<Role, { label: string; home: string; icon: LucideIcon }> = {
  platform: { label: "Platform yöneticisi", home: "/platform", icon: LayoutDashboard },
  inst: { label: "Kurum yöneticisi", home: "/inst", icon: Building2 },
  teacher: { label: "Öğretmen", home: "/teacher", icon: GraduationCap },
  student: { label: "Öğrenci", home: "/student", icon: Sparkles },
  parent: { label: "Veli", home: "/parent", icon: HeartHandshake },
};

/** Rol bazlı navigasyonun tek kaynağı */
export const NAV: Record<Role, NavItem[]> = {
  platform: [
    { path: "/platform", label: "Genel bakış", icon: LayoutDashboard },
    { path: "/platform/institutions", label: "Kurumlar", icon: Building2 },
    { path: "/platform/users", label: "Kullanıcılar", icon: UsersRound },
    { path: "/platform/categories", label: "Kurs kategorileri", icon: LayoutGrid },
    { path: "/platform/activity", label: "Sistem aktiviteleri", icon: Activity },
  ],
  inst: [
    { path: "/inst", label: "Genel bakış", icon: LayoutDashboard },
    { path: "/inst/students", label: "Öğrenciler", icon: GraduationCap },
    { path: "/inst/teachers", label: "Öğretmenler", icon: UsersRound },
    { path: "/inst/courses", label: "Kurslar", icon: Music2 },
    { path: "/inst/curriculum", label: "Müfredat", icon: BookOpen },
    { path: "/inst/calendar", label: "Ders takvimi", icon: CalendarDays },
    { path: "/inst/payments", label: "Ödemeler", icon: Wallet },
    { path: "/inst/reports", label: "Raporlar", icon: BarChart3 },
    ...(TENANT ? [{ path: "/inst/accounts", label: "Giriş hesapları", icon: KeyRound }] : []),
    { path: "/inst/settings", label: "Kurum ayarları", icon: Settings2 },
    { path: "/inst/tasks", label: "Görevler", icon: ListChecks },
  ],
  teacher: [
    { path: "/teacher", label: "Ana sayfa", icon: Home },
    { path: "/teacher/students", label: "Öğrencilerim", icon: GraduationCap },
    { path: "/teacher/lessons", label: "Derslerim", icon: CalendarCheck2 },
    { path: "/teacher/assignments", label: "Ödevler", icon: ClipboardList },
    { path: "/teacher/curriculum", label: "Müfredat", icon: BookOpen },
    { path: "/teacher/tasks", label: "Görevler", icon: ListChecks },
    { path: "/teacher/lab", label: "Müzik Lab", icon: AudioWaveform },
  ],
  student: [
    { path: "/student", label: "Bugün", icon: Home },
    { path: "/student/journey", label: "Yolculuk", icon: Route },
    { path: "/student/pieces", label: "Parçalarım", icon: Music2 },
    { path: "/student/assignments", label: "Ödevlerim", icon: ClipboardCheck },
    { path: "/student/achievements", label: "Başarılar", icon: Award },
    { path: "/student/lab", label: "Müzik Lab", icon: AudioWaveform },
  ],
  parent: [
    { path: "/parent", label: "Genel bakış", icon: Home },
    { path: "/parent/progress", label: "Gelişim", icon: TrendingUp },
    { path: "/parent/assignments", label: "Ödevler", icon: ClipboardCheck },
    { path: "/parent/lessons", label: "Dersler", icon: CalendarDays },
  ],
};

export const isActive = (current: string, item: string, home: string) =>
  item === home ? current === home : current === item || current.startsWith(item + "/");

/** Mobil alt sekme çubuğunda doğrudan görünen sekmeler; kalanlar "Daha" sayfasında */
export const MOBILE_TABS: Record<Role, string[]> = {
  platform: ["/platform", "/platform/institutions", "/platform/users", "/platform/activity"],
  inst: ["/inst", "/inst/students", "/inst/calendar", "/inst/payments"],
  teacher: ["/teacher", "/teacher/students", "/teacher/lessons", "/teacher/assignments"],
  student: ["/student", "/student/journey", "/student/lab", "/student/assignments"],
  parent: ["/parent", "/parent/progress", "/parent/assignments", "/parent/lessons"],
};
