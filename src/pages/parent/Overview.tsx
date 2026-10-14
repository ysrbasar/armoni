import { ArrowRight, CalendarClock, ClipboardCheck, Music2, Quote, UserRound } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Avatar, Badge, Button, Card, CardHeader, ProgressRing, Stars } from "@/components/ui";
import type { AssignmentStatus } from "@/data/types";
import { InstrumentBadge } from "@/components/InstrumentIcon";
import { LEVELS, instrumentById, levelName } from "@/data/catalog";
import { ASSIGNMENT_STATUS, assignmentsOf, nextLessonOf, pieceCounts, progressOf } from "@/lib/selectors";
import { fmtDate, relativeDay } from "@/lib/date";
import { navigate } from "@/lib/router";

export function useChild() {
  const data = useStore((s) => s.data);
  const session = useStore((s) => s.session);
  const parent = data.parents.find((p) => p.id === session.parentId)!;
  const childId = parent.childIds.includes(session.childId) ? session.childId : parent.childIds[0];
  return data.students.find((s) => s.id === childId)!;
}

export default function ParentOverview() {
  const data = useStore((s) => s.data);
  const child = useChild();
  const teacher = data.teachers.find((t) => t.id === child.teacherId)!;
  const ins = instrumentById[child.instrument];
  const pc = pieceCounts(data, child.id);
  const active = assignmentsOf(data, child.id).filter((a) => a.status !== "done");
  const next = nextLessonOf(data, child.id);
  const lastEval = child.evaluations[0];
  const progress = progressOf(child);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-4 p-5 sm:flex-nowrap sm:gap-6 sm:p-8">
          <div className="relative w-fit">
            <Avatar name={child.name} size={64} className="sm:hidden" />
            <Avatar name={child.name} size={84} className="hidden sm:grid" />
            <span className="absolute -right-1 -bottom-1 rounded-xl ring-4 ring-white">
              <InstrumentBadge id={child.instrument} size={30} />
            </span>
          </div>
          <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
            <h1 className="hidden text-2xl font-extrabold tracking-tight sm:block">{child.name}</h1>
            <p className="mt-1 text-[14px] text-muted">
              {ins.name} · {levelName(child.level)} seviye · Öğretmeni: <b className="font-semibold text-ink-2">{teacher.name}</b>
            </p>
            <div className="mt-4 flex gap-1.5">
              {LEVELS.map((l) => (
                <div key={l.id} className="flex-1">
                  <div className={`h-2 rounded-full ${l.id < child.level ? "bg-mint-500" : l.id === child.level ? "bg-brand-500" : "bg-canvas-2"}`} />
                  <p className={`mt-1.5 hidden text-[11px] sm:block ${l.id === child.level ? "font-bold text-ink" : "text-muted"}`}>{l.name}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="min-w-0 flex-1 sm:hidden">
            <h1 className="text-xl font-extrabold tracking-tight">{child.name}</h1>
            <p className="text-[13px] text-muted">{ins.name} · {levelName(child.level)}</p>
          </div>
          <div className="flex items-center gap-4 sm:flex-col sm:gap-1">
            <ProgressRing value={progress} size={72} stroke={7} color="var(--color-mint-500)">
              <span className="text-lg font-bold">%{progress}</span>
            </ProgressRing>
            <span className="hidden text-xs text-muted sm:inline">Genel ilerleme</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <Card className="p-3.5 sm:p-5">
          <span className="grid size-9 place-items-center rounded-xl sm:size-10 bg-mint-50 text-mint-600">
            <Music2 size={19} />
          </span>
          <p className="mt-3 text-xl font-bold tabular-nums sm:mt-4 sm:text-2xl">{pc.done}</p>
          <p className="text-[11.5px] leading-snug text-muted sm:text-[13px]">Tamamlanan parça<span className="hidden sm:inline"> · {pc.open} devam ediyor</span></p>
        </Card>
        <Card as="button" onClick={() => navigate("/parent/assignments")} className="cursor-pointer p-3.5 text-left transition hover:shadow-lift active:scale-[0.98] sm:p-5">
          <span className="grid size-9 place-items-center rounded-xl sm:size-10 bg-brand-50 text-brand-600">
            <ClipboardCheck size={19} />
          </span>
          <p className="mt-3 text-xl font-bold tabular-nums sm:mt-4 sm:text-2xl">{active.length}</p>
          <p className="text-[11.5px] leading-snug text-muted sm:text-[13px]">Aktif ödev<span className="hidden sm:inline"> · {active.filter((a) => a.status === "submitted").length} onay bekliyor</span></p>
        </Card>
        <Card as="button" onClick={() => navigate("/parent/lessons")} className="cursor-pointer p-3.5 text-left transition hover:shadow-lift active:scale-[0.98] sm:p-5">
          <span className="grid size-9 place-items-center rounded-xl sm:size-10 bg-sun-50 text-sun-600">
            <CalendarClock size={19} />
          </span>
          <p className="mt-3 text-base leading-tight font-bold sm:mt-4 sm:text-2xl">{next ? <>{relativeDay(next.date)}<span className="block sm:inline">, {next.start}</span></> : "—"}</p>
          <p className="text-[11.5px] leading-snug text-muted sm:text-[13px]">Yaklaşan ders<span className="hidden sm:inline">{next && ` · ${next.room}`}</span></p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Son öğretmen değerlendirmesi" icon={UserRound} />
          {lastEval ? (
            <div className="p-5">
              <div className="relative rounded-2xl bg-canvas p-5">
                <Quote size={28} className="absolute top-4 right-4 text-line-strong" />
                <p className="pr-8 text-[14.5px] leading-relaxed text-ink-2">{lastEval.text}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-muted">
                    <Avatar name={teacher.name} size={26} /> {teacher.name} · {fmtDate(lastEval.date)}
                  </span>
                  <Stars value={lastEval.rating} />
                </div>
              </div>
            </div>
          ) : (
            <p className="p-5 text-sm text-muted">Henüz değerlendirme yok.</p>
          )}
        </Card>
        <Card>
          <CardHeader title="Aktif ödevler" action={<Button size="sm" variant="ghost" iconRight={ArrowRight} onClick={() => navigate("/parent/assignments")}>Tümü</Button>} />
          <ul className="space-y-1 p-3">
            {active.slice(0, 4).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold">{a.title}</p>
                  <p className="text-xs text-muted">Son tarih: {relativeDay(a.dueDate)}</p>
                </div>
                <ParentStatus status={a.status} />
              </li>
            ))}
            {active.length === 0 && <p className="p-3 text-sm text-muted">Aktif ödev yok.</p>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export function ParentStatus({ status }: { status: AssignmentStatus }) {
  return (
    <Badge tone={ASSIGNMENT_STATUS[status].tone} dot>
      {ASSIGNMENT_STATUS[status].parent}
    </Badge>
  );
}
