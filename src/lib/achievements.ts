import { Award, CalendarHeart, Crown, Flame, Footprints, Medal, Music2, Sparkles, Target, type LucideIcon } from "lucide-react";
import type { DemoData, Student } from "@/data/types";

export interface Achievement {
  id: string;
  title: string;
  text: string;
  icon: LucideIcon;
  current: number;
  target: number;
  earned: boolean;
  tone: string;
  tint: string;
}

export function achievementsOf(d: DemoData, s: Student): Achievement[] {
  const donePieces = d.studentPieces.filter((p) => p.studentId === s.id && p.status === "done").length;
  const doneAsg = d.assignments.filter((a) => a.studentId === s.id && a.status === "done").length;
  const goalDays = s.practiceWeek.filter((m) => m >= s.dailyGoal).length;
  const defs: Omit<Achievement, "earned">[] = [
    { id: "start", title: "İlk adım", text: "Armoni'ye katıldın", icon: Footprints, current: 1, target: 1, tone: "#5b4bdb", tint: "#efecff" },
    { id: "piece1", title: "İlk parça", text: "Bir parçayı tamamla", icon: Music2, current: donePieces, target: 1, tone: "#0f8a75", tint: "#e6f6f1" },
    { id: "streak7", title: "Bir haftalık seri", text: "7 gün üst üste çalış", icon: Flame, current: s.streak, target: 7, tone: "#b97f12", tint: "#fdf3e1" },
    { id: "goal5", title: "Hedef haftası", text: "Bu hafta 5 gün günlük hedefe ulaş", icon: Target, current: goalDays, target: 5, tone: "#c43d62", tint: "#fdeef1" },
    { id: "asg3", title: "Ödev ustası", text: "3 ödevi tamamla", icon: Award, current: doneAsg, target: 3, tone: "#2672bd", tint: "#e8f1fc" },
    { id: "pieces3", title: "Repertuvar", text: "3 parçayı tamamla", icon: Medal, current: donePieces, target: 3, tone: "#0f8a75", tint: "#e6f6f1" },
    { id: "skills10", title: "Kazanım avcısı", text: "10 teknik kazanım edin", icon: Sparkles, current: s.skillsDone.length, target: 10, tone: "#5b4bdb", tint: "#efecff" },
    { id: "levelup", title: "Seviye atladın", text: "Öğretmen onayıyla seviye geç", icon: Crown, current: s.levelHistory.length - 1, target: 1, tone: "#b97f12", tint: "#fdf3e1" },
    { id: "streak14", title: "İki haftalık seri", text: "14 gün üst üste çalış", icon: CalendarHeart, current: s.streak, target: 14, tone: "#c43d62", tint: "#fdeef1" },
  ];
  return defs.map((a) => ({ ...a, current: Math.min(a.current, a.target), earned: a.current >= a.target }));
}
