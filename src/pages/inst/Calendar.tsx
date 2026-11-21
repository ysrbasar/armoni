import { useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/layout/AdminShell";
import { Button, Card, IconButton, Select, Tabs, cn } from "@/components/ui";
import { LessonFormModal } from "@/components/domain";
import { instrumentById } from "@/data/catalog";
import { conflictIds, lessonEnd, roomsOf } from "@/lib/selectors";
import { DAYS_SHORT, addDays, fmtDate, fmtDateLong, fromMinutes, parseISO, toMinutes, todayISO, weekStart } from "@/lib/date";
import type { Lesson } from "@/data/types";

const HOUR_WEEK = 56;
const HOUR_DAY = 80;
/** Sütun başlıklarındaki ayırt edici renk şeritleri (derslik / öğretmen) */
const ACCENTS = ["#5b4bdb", "#14a38b", "#e0a126", "#3b8fe0", "#e2557a", "#8a5d0b", "#0b6b5b", "#8574ee", "#c43d62"];

/** Çakışan blokları yan yana dizmek için şerit hesabı */
function layoutLanes(list: Lesson[]) {
  const sorted = [...list].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  const result = new Map<string, { lane: number; lanes: number }>();
  let cluster: Lesson[] = [];
  let clusterEnd = -1;
  const lanesEnd: number[] = [];
  const flush = () => {
    const n = Math.max(1, ...cluster.map((l) => result.get(l.id)!.lane + 1));
    cluster.forEach((l) => (result.get(l.id)!.lanes = n));
    cluster = [];
    lanesEnd.length = 0;
  };
  for (const l of sorted) {
    const s = toMinutes(l.start);
    if (s >= clusterEnd && cluster.length) flush();
    let lane = lanesEnd.findIndex((e) => e <= s);
    if (lane === -1) lane = lanesEnd.length;
    lanesEnd[lane] = lessonEnd(l);
    result.set(l.id, { lane, lanes: 1 });
    cluster.push(l);
    clusterEnd = Math.max(clusterEnd, lessonEnd(l));
  }
  if (cluster.length) flush();
  return result;
}

export default function CalendarPage() {
  const data = useStore((s) => s.data);
  const instId = useStore((s) => s.session.institutionId);
  const inst = data.institutions.find((i) => i.id === instId)!;
  // Varsayılan: tek günde bütün derslikler yan yana
  const [view, setView] = useState<"week" | "day">("day");
  const [groupBy, setGroupBy] = useState<"room" | "teacher">("room");
  const [room, setRoom] = useState("all");
  const [anchor, setAnchor] = useState(todayISO());
  const [course, setCourse] = useState("all");
  const [teacher, setTeacher] = useState("all");
  const [modal, setModal] = useState<{ lesson?: Lesson; date?: string; start?: string; teacherId?: string; room?: string } | null>(null);

  const teachers = data.teachers.filter((t) => t.institutionId === instId);
  const all = data.lessons.filter((l) => l.institutionId === instId && l.status !== "cancelled");
  const conflicts = useMemo(() => conflictIds(all), [all]);
  const lessons = all.filter((l) => (course === "all" || l.instrument === course) && (teacher === "all" || l.teacherId === teacher) && (room === "all" || l.room === room));
  const HOUR = view === "day" ? HOUR_DAY : HOUR_WEEK;

  const ws = weekStart(anchor);
  const days = view === "week" ? Array.from({ length: 7 }, (_, i) => addDays(ws, i)) : [anchor];
  const visible = lessons.filter((l) => days.includes(l.date));
  const startHour = Math.min(13, ...visible.map((l) => Math.floor(toMinutes(l.start) / 60)));
  const endHour = Math.max(21, ...visible.map((l) => Math.ceil(lessonEnd(l) / 60)));
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const today = todayISO();

  // Derslikler: kurumun listesi + derslerde geçen ama listede olmayanlar
  const rooms = Array.from(new Set([...roomsOf(inst), ...all.map((l) => l.room)]));
  // Gün görünümünde sütunlar dersliklere (varsayılan) ya da öğretmenlere göre
  const columns =
    view === "week"
      ? days.map((d) => ({ key: d, label: `${DAYS_SHORT[(parseISO(d).getDay() + 6) % 7]} ${parseISO(d).getDate()}`, sub: "", lessons: visible.filter((l) => l.date === d), date: d, teacherId: undefined as string | undefined }))
      : groupBy === "room"
        ? (room === "all" ? rooms : [room]).map((r) => ({
            key: r,
            label: r,
            sub: `${visible.filter((l) => l.room === r).length} ders`,
            lessons: visible.filter((l) => l.room === r),
            date: anchor,
            teacherId: teachers.find((t) => t.room === r)?.id as string | undefined,
          }))
        : (teacher === "all" ? teachers : teachers.filter((t) => t.id === teacher)).map((t) => ({
            key: t.id,
            label: t.name,
            sub: t.room ?? "",
            lessons: visible.filter((l) => l.teacherId === t.id),
            date: anchor,
            teacherId: t.id as string | undefined,
          }));

  const shift = (n: number) => setAnchor(addDays(anchor, view === "week" ? n * 7 : n));
  const conflictCount = visible.filter((l) => conflicts.has(l.id)).length;

  return (
    <>
      <PageHeader
        title="Ders takvimi"
        subtitle={inst.name}
        actions={
          <Button icon={Plus} onClick={() => setModal({ date: anchor })}>
            Ders ekle
          </Button>
        }
      />
      <Card className="mb-4 flex flex-wrap items-center gap-3 p-3">
        <Tabs value={view} onChange={setView} tabs={[{ id: "day", label: "Günlük" }, { id: "week", label: "Haftalık" }]} />
        {view === "day" && (
          <Tabs size="sm" value={groupBy} onChange={setGroupBy} tabs={[{ id: "room", label: "Dersliğe göre" }, { id: "teacher", label: "Öğretmene göre" }]} />
        )}
        <div className="flex items-center gap-1">
          <IconButton icon={ChevronLeft} label="Önceki" onClick={() => shift(-1)} />
          <Button size="sm" variant="secondary" onClick={() => setAnchor(today)}>
            Bugün
          </Button>
          <IconButton icon={ChevronRight} label="Sonraki" onClick={() => shift(1)} />
        </div>
        <p className="text-sm font-semibold">{view === "week" ? `${fmtDate(ws)} – ${fmtDate(addDays(ws, 6))}` : fmtDateLong(anchor)}</p>
        {conflictCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
            <AlertTriangle size={13} /> {conflictCount} derste çakışma
          </span>
        )}
        <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">
          <Select value={course} onChange={(e) => setCourse(e.target.value)} className="h-9 flex-1 sm:w-40" aria-label="Kurs filtresi">
            <option value="all">Tüm kurslar</option>
            {inst.courseIds.map((c) => (
              <option key={c} value={c}>
                {instrumentById[c].name}
              </option>
            ))}
          </Select>
          <Select value={room} onChange={(e) => setRoom(e.target.value)} className="h-9 flex-1 sm:w-40" aria-label="Derslik filtresi">
            <option value="all">Tüm derslikler</option>
            {rooms.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
          <Select value={teacher} onChange={(e) => setTeacher(e.target.value)} className="h-9 flex-1 sm:w-44" aria-label="Öğretmen filtresi">
            <option value="all">Tüm öğretmenler</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="scrollbar-thin overflow-x-auto">
          <div style={{ minWidth: Math.max(720, columns.length * (view === "day" ? 170 : 130) + 60) }}>
            <div className="sticky top-0 z-20 grid border-b-2 border-line-strong bg-canvas-2" style={{ gridTemplateColumns: `60px repeat(${columns.length}, minmax(0,1fr))` }}>
              <div className="border-r border-line-strong bg-canvas-2" />
              {columns.map((c, i) => {
                const isToday = view === "week" && c.date === today;
                const weekend = view === "week" && parseISO(c.date).getDay() % 6 === 0;
                const accent = view === "week" ? (isToday ? "#5b4bdb" : "transparent") : ACCENTS[i % ACCENTS.length];
                return (
                  <div
                    key={c.key}
                    className={cn(
                      "relative truncate border-l border-line-strong px-2 pt-3.5 pb-2.5 text-center",
                      i % 2 === 1 ? "bg-canvas" : "bg-surface",
                      weekend && "bg-sun-50",
                      isToday && "bg-brand-50",
                    )}
                  >
                    <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accent }} />
                    <span className={cn("inline-flex max-w-full items-center gap-1.5 truncate text-[13px] font-bold text-ink", isToday && "text-brand-700")}>
                      {view === "day" && <span className="size-2 shrink-0 rounded-full" style={{ background: accent }} />}
                      {c.label}
                      {isToday && <span className="rounded-full bg-brand-600 px-1.5 py-px text-[10px] font-bold text-white">Bugün</span>}
                    </span>
                    {c.sub && (
                      <span className="mt-1 block">
                        <span className="inline-block max-w-full truncate rounded-full border border-line bg-surface px-2 py-px text-[11px] font-semibold text-muted">{c.sub}</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="relative grid" style={{ gridTemplateColumns: `60px repeat(${columns.length}, minmax(0,1fr))` }}>
              <div className="border-r border-line-strong bg-canvas">
                {hours.map((h) => (
                  <div key={h} className="border-b border-line-strong pt-1 pr-2 text-right text-[11px] font-semibold text-muted tabular-nums" style={{ height: HOUR }}>
                    {String(h).padStart(2, "0")}:00
                  </div>
                ))}
              </div>
              {/* Şu anki saat çizgisi */}
              {(view === "day" ? anchor === today : days.includes(today)) &&
                (() => {
                  const now = new Date();
                  const m = now.getHours() * 60 + now.getMinutes();
                  if (m < startHour * 60 || m > endHour * 60) return null;
                  return (
                    <div className="pointer-events-none absolute right-0 left-[52px] z-10 flex items-center" style={{ top: ((m - startHour * 60) / 60) * HOUR - 4 }}>
                      <span className="size-2 rounded-full bg-rose-500" />
                      <span className="h-[2px] flex-1 bg-rose-500/80" />
                    </div>
                  );
                })()}
              {columns.map((c, i) => {
                const lanes = layoutLanes(c.lessons);
                const weekend = view === "week" && parseISO(c.date).getDay() % 6 === 0;
                return (
                  <div
                    key={c.key}
                    className={cn(
                      "relative border-l border-line-strong",
                      i % 2 === 1 ? "bg-canvas/80" : "bg-surface",
                      weekend && "bg-sun-50/60",
                      c.date === today && view === "week" && "bg-brand-50/60",
                    )}
                  >
                    {hours.map((h) => (
                      <button
                        key={h}
                        aria-label={`${fromMinutes(h * 60)} için ders ekle`}
                        onClick={() => setModal({ date: c.date, start: fromMinutes(h * 60), teacherId: c.teacherId, room: view === "day" && groupBy === "room" ? c.key : undefined })}
                        className="relative block w-full cursor-copy border-b border-line-strong transition hover:bg-brand-50/70"
                        style={{ height: HOUR }}
                      >
                        {/* Yarım saat çizgisi */}
                        <span className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
                      </button>
                    ))}
                    {c.lessons.map((l) => {
                      const top = ((toMinutes(l.start) - startHour * 60) / 60) * HOUR;
                      const height = (l.duration / 60) * HOUR - 3;
                      const { lane, lanes: n } = lanes.get(l.id)!;
                      const ins = instrumentById[l.instrument];
                      const st = data.students.find((s) => s.id === l.studentId);
                      const te = data.teachers.find((t) => t.id === l.teacherId);
                      const conflict = conflicts.has(l.id);
                      return (
                        <button
                          key={l.id}
                          onClick={() => setModal({ lesson: l })}
                          className={cn(
                            "absolute z-[1] cursor-pointer overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left shadow-sm transition hover:z-10 hover:shadow-lift",
                            conflict ? "ring-2 ring-rose-500 ring-offset-1" : "ring-1 ring-black/5",
                            l.status === "completed" && "opacity-60",
                          )}
                          style={{
                            top: top + 1,
                            height,
                            left: `calc(${(lane / n) * 100}% + 3px)`,
                            width: `calc(${100 / n}% - 6px)`,
                            background: ins.tint,
                            borderColor: ins.tone,
                          }}
                          title={`${l.start}–${fromMinutes(lessonEnd(l))} · ${st?.name} · ${te?.name} · ${ins.name} · ${l.room}${conflict ? " · Çakışma: aynı derslik ya da aynı öğretmen" : ""}`}
                        >
                          <span className="flex items-center gap-1 text-[11px] font-bold tabular-nums" style={{ color: ins.tone }}>
                            {conflict && <AlertTriangle size={11} className="text-rose-600" />}
                            {l.start}–{fromMinutes(lessonEnd(l))}
                          </span>
                          <span className="block truncate text-[12px] leading-tight font-semibold text-ink">{st?.name}</span>
                          {view === "day" ? (
                            <>
                              <span className="block truncate text-[11px] leading-tight text-ink-2">{groupBy === "room" ? te?.name : l.room} · {ins.short}</span>
                            </>
                          ) : (
                            height > 40 && <span className="block truncate text-[11px] leading-tight text-ink-2">{te?.name} · {l.room}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
        {inst.courseIds.map((c) => (
          <span key={c} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px]" style={{ background: instrumentById[c].tone }} /> {instrumentById[c].name}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] ring-2 ring-rose-500" /> Aynı derslikte ya da aynı öğretmende çakışma
        </span>
        <span>Boş bir saate tıklayarak ders ekleyin.</span>
      </div>
      {modal && <LessonFormModal open onClose={() => setModal(null)} institutionId={instId} lesson={modal.lesson} defaults={modal} />}
    </>
  );
}
