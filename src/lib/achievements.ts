import {
  Award,
  BookOpenCheck,
  CalendarCheck2,
  CalendarHeart,
  Clock,
  Crown,
  Flame,
  Footprints,
  Gem,
  GraduationCap,
  Medal,
  Mountain,
  Music2,
  Rocket,
  Sparkles,
  Star,
  Target,
  Timer,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { DemoData, Student } from "@/data/types";
import { SKILLS } from "@/data/catalog";

export type AchievementGroup = "Başlangıç" | "Kazanımlar" | "Seviyeler" | "Repertuvar" | "Ödevler" | "Düzenli çalışma" | "Derse devam";

export interface Achievement {
  id: string;
  group: AchievementGroup;
  title: string;
  text: string;
  icon: LucideIcon;
  current: number;
  target: number;
  earned: boolean;
  tone: string;
  tint: string;
}

const C = {
  brand: ["#5b4bdb", "#efecff"],
  mint: ["#0f8a75", "#e6f6f1"],
  sun: ["#b97f12", "#fdf3e1"],
  rose: ["#c43d62", "#fdeef1"],
  sky: ["#2672bd", "#e8f1fc"],
} as const;

export const ACHIEVEMENT_GROUPS: AchievementGroup[] = ["Başlangıç", "Kazanımlar", "Seviyeler", "Repertuvar", "Ödevler", "Düzenli çalışma", "Derse devam"];

export function achievementsOf(d: DemoData, s: Student): Achievement[] {
  const donePieces = d.studentPieces.filter((p) => p.studentId === s.id && p.status === "done").length;
  const doneAsg = d.assignments.filter((a) => a.studentId === s.id && a.status === "done").length;
  const onTime = d.assignments.filter((a) => a.studentId === s.id && a.status === "done" && (!a.dueDate || a.createdAt <= a.dueDate)).length;
  const goalDays = s.practiceWeek.filter((m) => m >= s.dailyGoal).length;
  const weekMinutes = s.practiceWeek.reduce((a, b) => a + b, 0);
  const attended = d.lessons.filter((l) => l.studentId === s.id && l.status === "completed" && l.attendance !== "absent").length;
  const onTimeLessons = d.lessons.filter((l) => l.studentId === s.id && l.status === "completed" && l.attendance === "present").length;
  // Kazanımlar: etkin programdaki, öğrencinin enstrümanına ait olanlar
  const skills = SKILLS.filter((k) => k.instrument === s.instrument);
  const doneSkills = skills.filter((k) => s.skillsDone.includes(k.id)).length;
  const levelSkills = skills.filter((k) => k.stage === s.level);
  const levelDone = levelSkills.filter((k) => s.skillsDone.includes(k.id)).length;
  const fullLevels = [0, 1, 2, 3, 4].filter((lv) => {
    const ks = skills.filter((k) => k.stage === lv);
    return ks.length > 0 && ks.every((k) => s.skillsDone.includes(k.id));
  }).length;
  const eval5 = s.evaluations.filter((e) => e.rating === 5).length;

  type Def = Omit<Achievement, "earned" | "tone" | "tint"> & { color: keyof typeof C };
  const defs: Def[] = [
    { id: "start", group: "Başlangıç", title: "İlk adım", text: "Armoni'ye katıldın", icon: Footprints, current: 1, target: 1, color: "brand" },
    { id: "lesson1", group: "Başlangıç", title: "İlk ders", text: "İlk dersini tamamla", icon: CalendarCheck2, current: attended, target: 1, color: "mint" },
    { id: "practice1", group: "Başlangıç", title: "İlk çalışma", text: "Bir çalışma kaydı gir", icon: Timer, current: weekMinutes > 0 || s.streak > 0 ? 1 : 0, target: 1, color: "sun" },

    { id: "skill1", group: "Kazanımlar", title: "İlk kazanım", text: "Öğretmenin bir kazanımını onaylasın", icon: Sparkles, current: doneSkills, target: 1, color: "brand" },
    { id: "skill5", group: "Kazanımlar", title: "Kazanım avcısı", text: "5 kazanım edin", icon: Zap, current: doneSkills, target: 5, color: "brand" },
    { id: "skill10", group: "Kazanımlar", title: "Teknik usta", text: "10 kazanım edin", icon: Gem, current: doneSkills, target: 10, color: "sky" },
    { id: "skill20", group: "Kazanımlar", title: "Kazanım koleksiyoncusu", text: "20 kazanım edin", icon: Trophy, current: doneSkills, target: 20, color: "sun" },
    { id: "levelskills", group: "Kazanımlar", title: "Seviyeyi tamamla", text: "Bulunduğun seviyenin tüm kazanımlarını edin", icon: BookOpenCheck, current: levelDone, target: Math.max(levelSkills.length, 1), color: "mint" },
    { id: "alllevels", group: "Kazanımlar", title: "Program bitti", text: "Programdaki bütün seviyelerin kazanımlarını edin", icon: Mountain, current: fullLevels, target: 5, color: "rose" },

    { id: "lv1", group: "Seviyeler", title: "Temel seviye", text: "Temel seviyeye geç", icon: Star, current: s.level >= 1 ? 1 : 0, target: 1, color: "brand" },
    { id: "lv2", group: "Seviyeler", title: "Gelişen seviye", text: "Gelişen seviyeye geç", icon: Rocket, current: s.level >= 2 ? 1 : 0, target: 1, color: "mint" },
    { id: "lv3", group: "Seviyeler", title: "Orta seviye", text: "Orta seviyeye geç", icon: Medal, current: s.level >= 3 ? 1 : 0, target: 1, color: "sky" },
    { id: "lv4", group: "Seviyeler", title: "İleri seviye", text: "İleri seviyeye geç", icon: Crown, current: s.level >= 4 ? 1 : 0, target: 1, color: "sun" },
    { id: "eval5", group: "Seviyeler", title: "Tam puan", text: "Öğretmeninden 5 yıldızlı değerlendirme al", icon: Award, current: eval5, target: 1, color: "rose" },

    { id: "piece1", group: "Repertuvar", title: "İlk parça", text: "Bir parçayı tamamla", icon: Music2, current: donePieces, target: 1, color: "mint" },
    { id: "pieces3", group: "Repertuvar", title: "Repertuvar", text: "3 parçayı tamamla", icon: Medal, current: donePieces, target: 3, color: "mint" },
    { id: "pieces5", group: "Repertuvar", title: "Küçük konser", text: "5 parçayı tamamla", icon: Music2, current: donePieces, target: 5, color: "sky" },
    { id: "pieces10", group: "Repertuvar", title: "Konser programı", text: "10 parçayı tamamla", icon: Trophy, current: donePieces, target: 10, color: "sun" },

    { id: "asg1", group: "Ödevler", title: "İlk ödev", text: "Bir ödevi tamamla", icon: Award, current: doneAsg, target: 1, color: "sky" },
    { id: "asg3", group: "Ödevler", title: "Ödev ustası", text: "3 ödevi tamamla", icon: Award, current: doneAsg, target: 3, color: "sky" },
    { id: "asg10", group: "Ödevler", title: "Ödev şampiyonu", text: "10 ödevi tamamla", icon: Trophy, current: doneAsg, target: 10, color: "sun" },
    { id: "ontime5", group: "Ödevler", title: "Zamanında", text: "5 ödevi zamanında bitir", icon: Clock, current: onTime, target: 5, color: "mint" },

    { id: "streak3", group: "Düzenli çalışma", title: "Isınma", text: "3 gün üst üste çalış", icon: Flame, current: s.streak, target: 3, color: "sun" },
    { id: "streak7", group: "Düzenli çalışma", title: "Bir haftalık seri", text: "7 gün üst üste çalış", icon: Flame, current: s.streak, target: 7, color: "sun" },
    { id: "streak14", group: "Düzenli çalışma", title: "İki haftalık seri", text: "14 gün üst üste çalış", icon: CalendarHeart, current: s.streak, target: 14, color: "rose" },
    { id: "streak30", group: "Düzenli çalışma", title: "Bir ay boyunca", text: "30 gün üst üste çalış", icon: Crown, current: s.streak, target: 30, color: "rose" },
    { id: "goal5", group: "Düzenli çalışma", title: "Hedef haftası", text: "Bu hafta 5 gün günlük hedefe ulaş", icon: Target, current: goalDays, target: 5, color: "rose" },
    { id: "goal7", group: "Düzenli çalışma", title: "Kusursuz hafta", text: "Bu hafta her gün hedefe ulaş", icon: Gem, current: goalDays, target: 7, color: "brand" },
    { id: "min150", group: "Düzenli çalışma", title: "150 dakika", text: "Bir haftada 150 dakika çalış", icon: Timer, current: weekMinutes, target: 150, color: "sky" },
    { id: "min300", group: "Düzenli çalışma", title: "300 dakika", text: "Bir haftada 300 dakika çalış", icon: Zap, current: weekMinutes, target: 300, color: "brand" },

    { id: "att5", group: "Derse devam", title: "Düzenli öğrenci", text: "5 derse katıl", icon: CalendarCheck2, current: attended, target: 5, color: "mint" },
    { id: "att20", group: "Derse devam", title: "Sadık öğrenci", text: "20 derse katıl", icon: GraduationCap, current: attended, target: 20, color: "sky" },
    { id: "punctual10", group: "Derse devam", title: "Dakik", text: "10 derse zamanında gel", icon: Clock, current: onTimeLessons, target: 10, color: "sun" },
  ];
  return defs.map(({ color, ...a }) => ({
    ...a,
    tone: C[color][0],
    tint: C[color][1],
    current: Math.min(a.current, a.target),
    earned: a.current >= a.target,
  }));
}
