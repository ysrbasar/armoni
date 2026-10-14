import { useState } from "react";
import { ArrowUpRight, CalendarCheck2, ClipboardCheck, ClipboardList, GraduationCap, Hourglass, Music2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/layout/AdminShell";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, StatCard } from "@/components/ui";
import { ActivityFeed, AssignmentFormModal, LessonItem } from "@/components/domain";
import { pieceById } from "@/data/catalog";
import { teacherStudents } from "@/lib/selectors";
import { navigate } from "@/lib/router";
import { addDays, fmtDateLong, relativeDay, todayISO } from "@/lib/date";
import { ReviewModal } from "./Assignments";
import type { Assignment } from "@/data/types";

export default function TeacherHome() {
  const data = useStore((s) => s.data);
  const tid = useStore((s) => s.session.teacherId);
  const setPieceStatus = useStore((s) => s.setPieceStatus);
  const [creating, setCreating] = useState(false);
  const [reviewing, setReviewing] = useState<Assignment | null>(null);
  const t = data.teachers.find((x) => x.id === tid)!;
  const students = teacherStudents(data, tid);
  const ids = new Set(students.map((s) => s.id));
  const today = todayISO();
  const mine = data.lessons.filter((l) => l.teacherId === tid && l.status !== "cancelled");
  const todays = mine.filter((l) => l.date === today).sort((a, b) => a.start.localeCompare(b.start));
  const upcoming = mine.filter((l) => l.date > today && l.date <= addDays(today, 7)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const pending = data.assignments.filter((a) => ids.has(a.studentId) && a.status === "submitted");
  const reviewPieces = data.studentPieces.filter((p) => ids.has(p.studentId) && p.status === "review");
  const names = students.map((s) => s.name);
  const feed = data.activities.filter((a) => names.some((n) => a.text.includes(n))).slice(0, 6);
  const sname = (id: string) => data.students.find((s) => s.id === id)?.name;

  return (
    <>
      <PageHeader
        title={`Merhaba, ${t.name.split(" ")[0]}`}
        subtitle={fmtDateLong(today)}
        actions={
          <Button icon={ClipboardList} onClick={() => setCreating(true)}>
            Ödev oluştur
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Bugünkü dersler" value={todays.length} icon={CalendarCheck2} tone="brand" hint={`${todays.filter((l) => l.status === "completed").length} tamamlandı`} onClick={() => navigate("/teacher/lessons")} />
        <StatCard label="Aktif öğrenci" value={students.length} icon={GraduationCap} tone="mint" hint={`Kapasite ${t.capacity}`} onClick={() => navigate("/teacher/students")} />
        <StatCard label="Bekleyen değerlendirme" value={pending.length + reviewPieces.length} icon={Hourglass} tone="sun" hint={`${pending.length} ödev · ${reviewPieces.length} parça`} onClick={() => navigate("/teacher/assignments")} />
        <StatCard label="Bu hafta" value={upcoming.length + todays.length} icon={ClipboardCheck} tone="sky" hint="Planlı ders" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="Bugünkü dersler" subtitle="Dersi açıp işleyin, notlarınızı ekleyin" />
          <div className="p-3">
            {todays.length === 0 && <EmptyState icon={CalendarCheck2} title="Bugün dersiniz yok" text="Yaklaşan derslerinizi sağda görebilirsiniz." />}
            {todays.map((l) => (
              <div key={l.id} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <LessonItem lesson={l} onClick={() => navigate(`/teacher/lessons/${l.id}`)} />
                </div>
                {l.status === "scheduled" && (
                  <Button size="sm" variant="soft" onClick={() => navigate(`/teacher/lessons/${l.id}`)}>
                    Dersi işle
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Değerlendirme bekleyenler" action={<Button size="sm" variant="ghost" iconRight={ArrowUpRight} onClick={() => navigate("/teacher/assignments")}>Ödevler</Button>} />
          <div className="space-y-1 p-3">
            {pending.length + reviewPieces.length === 0 && <EmptyState icon={ClipboardCheck} title="Her şey güncel" text="Bekleyen değerlendirme yok." />}
            {pending.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                <Avatar name={sname(a.studentId)!} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{a.title}</p>
                  <p className="text-xs text-muted">{sname(a.studentId)} · ödev teslimi</p>
                </div>
                <Button size="sm" variant="soft" onClick={() => setReviewing(a)}>
                  İncele
                </Button>
              </div>
            ))}
            {reviewPieces.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                <span className="grid size-8 place-items-center rounded-full bg-sky-50 text-sky-600">
                  <Music2 size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{pieceById[p.pieceId].title}</p>
                  <p className="text-xs text-muted">{sname(p.studentId)} · parça değerlendirmesi</p>
                </div>
                <Button size="sm" variant="mint" onClick={() => setPieceStatus(p.id, "done")}>
                  Tamamla
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Yaklaşan dersler" subtitle="Önümüzdeki 7 gün" />
          <div className="p-3">
            {upcoming.slice(0, 7).map((l) => (
              <div key={l.id} className="flex items-center">
                <span className="w-24 shrink-0 pl-2 text-[11px] font-semibold text-muted">{relativeDay(l.date)}</span>
                <div className="min-w-0 flex-1">
                  <LessonItem lesson={l} onClick={() => navigate(`/teacher/lessons/${l.id}`)} />
                </div>
              </div>
            ))}
            {upcoming.length === 0 && <EmptyState icon={CalendarCheck2} title="Planlı ders yok" />}
          </div>
        </Card>
        <Card>
          <CardHeader title="Son öğrenci aktiviteleri" />
          <div className="p-3">
            {feed.length ? <ActivityFeed items={feed} /> : <EmptyState icon={Music2} title="Henüz aktivite yok" />}
            <div className="mt-2 flex flex-wrap gap-2 px-2 pb-2">
              {students.slice(0, 4).map((s) => (
                <Badge key={s.id} tone="neutral">
                  {s.name.split(" ")[0]} · son çalışma {relativeDay(s.lastPractice).toLocaleLowerCase("tr")}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      </div>
      {creating && <AssignmentFormModal open onClose={() => setCreating(false)} teacherId={tid} />}
      {reviewing && <ReviewModal assignment={reviewing} onClose={() => setReviewing(null)} />}
    </>
  );
}
