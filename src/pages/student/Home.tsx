import { ArrowRight, AudioWaveform, CalendarClock, Check, Clock3, Play, Plus, Route } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Badge, Button, Card, CardHeader, EmptyState, ProgressRing, cn } from "@/components/ui";
import { InstrumentBadge } from "@/components/InstrumentIcon";
import { LEVELS, instrumentById, levelName, pieceById } from "@/data/catalog";
import { ASSIGNMENT_STATUS, assignmentsOf, nextLessonOf, progressOf } from "@/lib/selectors";
import { achievementsOf } from "@/lib/achievements";
import { DAYS_SHORT, dayIndex, fmtDateLong, relativeDay, todayISO } from "@/lib/date";
import { navigate } from "@/lib/router";

export default function StudentHome() {
  const data = useStore((s) => s.data);
  const sid = useStore((s) => s.session.studentId);
  const logPractice = useStore((s) => s.logPractice);
  const setStatus = useStore((s) => s.setAssignmentStatus);
  const s = data.students.find((x) => x.id === sid)!;
  const ins = instrumentById[s.instrument];
  const teacher = data.teachers.find((t) => t.id === s.teacherId)!;
  const progress = progressOf(s);
  const today = todayISO();
  const ti = dayIndex(today);
  const practiced = s.practiceWeek[ti];
  const goalPct = Math.min(100, Math.round((practiced / s.dailyGoal) * 100));
  const next = nextLessonOf(data, s.id);
  const open = assignmentsOf(data, s.id).filter((a) => a.status !== "done");
  const earned = achievementsOf(data, s).filter((a) => a.earned).slice(-3).reverse();
  const maxWeek = Math.max(s.dailyGoal, ...s.practiceWeek);

  return (
    <div className="space-y-6">
      {/* Karşılama */}
      <section className="relative overflow-hidden rounded-[28px] bg-ink p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full opacity-40 blur-3xl" style={{ background: ins.tone }} />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex-1">
            <p className="text-sm text-white/60">{fmtDateLong(today)}</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Merhaba {s.name.split(" ")[0]},</h1>
            <p className="mt-2 max-w-md text-[15px] text-white/75">
              Bugün <b className="text-white">{s.nextGoal.toLocaleLowerCase("tr")}</b> üzerine çalışmaya ne dersin?
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 py-1 pr-3 pl-1 text-[13px] font-semibold">
                <InstrumentBadge id={s.instrument} size={26} rounded="rounded-full" /> {ins.name}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold">{levelName(s.level)} seviye</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold">Öğretmen: {teacher.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-5 rounded-3xl bg-white/[0.07] p-4 pr-6 ring-1 ring-white/10">
            <ProgressRing value={progress} size={92} stroke={8} color="#7de3c4" track="rgba(255,255,255,.12)">
              <span className="text-center">
                <span className="block text-xl font-bold">%{progress}</span>
              </span>
            </ProgressRing>
            <div>
              <p className="text-xs text-white/60">Öğrenme ilerlemesi</p>
              <p className="text-sm font-semibold">{LEVELS[s.level].stage}</p>
              <button onClick={() => navigate("/student/journey")} className="mt-2 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#7de3c4] hover:underline">
                Yolculuğu gör <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Günlük hedef */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold">Günlük çalışma hedefi</p>
              <p className="text-xs text-muted">{s.dailyGoal} dakika</p>
            </div>
            {goalPct >= 100 && <Badge tone="mint">Tamamlandı</Badge>}
          </div>
          <div className="mt-5 flex items-center gap-5">
            <ProgressRing value={goalPct} size={96} stroke={9} color="var(--color-sun-500)">
              <span className="text-center leading-tight">
                <span className="block text-xl font-bold tabular-nums">{practiced}</span>
                <span className="text-[11px] text-muted">dk</span>
              </span>
            </ProgressRing>
            <div className="flex flex-1 flex-col gap-2">
              <Button size="sm" variant="soft" icon={Plus} onClick={() => logPractice(s.id, 10)}>
                10 dk çalıştım
              </Button>
              <Button size="sm" variant="secondary" icon={Plus} onClick={() => logPractice(s.id, 20)}>
                20 dk çalıştım
              </Button>
            </div>
          </div>
          <div className="mt-6 flex h-16 items-end gap-2">
            {s.practiceWeek.map((m, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="relative flex h-12 w-full items-end">
                  <div
                    title={`${DAYS_SHORT[i]}: ${m} dk`}
                    className={cn("w-full rounded-md transition-all", i === ti ? "bg-sun-500" : i > ti ? "bg-canvas-2" : m >= s.dailyGoal ? "bg-brand-400" : "bg-brand-100")}
                    style={{ height: `${Math.max(6, (m / maxWeek) * 100)}%` }}
                  />
                </div>
                <span className={cn("text-[10.5px] font-semibold", i === ti ? "text-ink" : "text-faint")}>{DAYS_SHORT[i]}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Sıradaki ders */}
        <Card className="flex flex-col p-6">
          <p className="text-sm font-semibold">Sıradaki ders</p>
          {next ? (
            <>
              <div className="mt-4 flex items-center gap-4">
                <span className="grid size-16 shrink-0 place-items-center rounded-2xl text-center" style={{ background: ins.tint, color: ins.tone }}>
                  <span>
                    <span className="block text-lg leading-none font-bold">{next.start}</span>
                    <span className="text-[10px] font-semibold">{next.duration} dk</span>
                  </span>
                </span>
                <div>
                  <p className="text-lg font-bold">{relativeDay(next.date)}</p>
                  <p className="text-[13px] text-muted">
                    {next.room} · {teacher.name}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-canvas p-4 text-[13px]">
                <p className="text-xs font-semibold text-muted">Ders hedefi</p>
                <p className="mt-1 font-semibold">{next.nextGoal || s.nextGoal}</p>
                {next.pieceIds.length > 0 && <p className="mt-2 text-xs text-muted">Parçalar: {next.pieceIds.map((p) => pieceById[p].title).join(", ")}</p>}
              </div>
            </>
          ) : (
            <EmptyState icon={CalendarClock} title="Planlı ders yok" />
          )}
          <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
            <button onClick={() => navigate("/student/lab")} className="flex cursor-pointer items-center gap-2 rounded-2xl bg-brand-50 p-3 text-left text-[13px] font-semibold text-brand-800 transition hover:bg-brand-100">
              <AudioWaveform size={18} /> Müzik Lab
            </button>
            <button onClick={() => navigate("/student/journey")} className="flex cursor-pointer items-center gap-2 rounded-2xl bg-mint-50 p-3 text-left text-[13px] font-semibold text-mint-700 transition hover:bg-mint-100">
              <Route size={18} /> Yolculuk
            </button>
          </div>
        </Card>

        {/* Başarılar */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Son kazanılan başarılar</p>
            <button onClick={() => navigate("/student/achievements")} className="cursor-pointer text-xs font-semibold text-brand-700 hover:underline">
              Tümü
            </button>
          </div>
          <ul className="mt-4 space-y-3">
            {earned.map((a) => (
              <li key={a.id} className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-2xl" style={{ background: a.tint, color: a.tone }}>
                  <a.icon size={22} strokeWidth={1.8} />
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold">{a.title}</p>
                  <p className="text-xs text-muted">{a.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Bugünkü ödevler */}
      <Card>
        <CardHeader title="Ödevlerim" subtitle={`${open.length} aktif ödev`} action={<Button size="sm" variant="ghost" iconRight={ArrowRight} onClick={() => navigate("/student/assignments")}>Tümü</Button>} />
        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
          {open.length === 0 && <EmptyState icon={Check} title="Tüm ödevler tamam!" className="md:col-span-3" />}
          {open.slice(0, 3).map((a) => (
            <div key={a.id} className="flex flex-col rounded-2xl border border-line p-4">
              <div className="flex items-center justify-between gap-2">
                <Badge tone={ASSIGNMENT_STATUS[a.status].tone} dot>
                  {ASSIGNMENT_STATUS[a.status].label}
                </Badge>
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <Clock3 size={13} /> {relativeDay(a.dueDate)}
                </span>
              </div>
              <p className="mt-3 text-[14px] font-semibold">{a.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted">{a.description}</p>
              <div className="mt-auto pt-4">
                {a.status === "assigned" && (
                  <Button size="sm" variant="soft" icon={Play} className="w-full" onClick={() => setStatus(a.id, "in_progress")}>
                    Çalışmaya başla
                  </Button>
                )}
                {a.status === "in_progress" && (
                  <Button size="sm" icon={Check} className="w-full" onClick={() => setStatus(a.id, a.requiresApproval ? "submitted" : "done")}>
                    Tamamladım
                  </Button>
                )}
                {a.status === "submitted" && <p className="rounded-xl bg-sun-50 px-3 py-2 text-center text-xs font-semibold text-sun-700">Öğretmen onayı bekleniyor</p>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
