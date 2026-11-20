import { useState } from "react";
import {
  Award,
  CalendarCheck2,
  Check,
  ClipboardList,
  Flame,
  Lock,
  MessageSquarePlus,
  Music2,
  Pencil,
  ShieldAlert,
  TrendingUp,
  UserRoundCog,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/layout/AdminShell";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Field, Modal, ProgressBar, ProgressRing, Select, Stars, Tabs, Textarea, cn } from "@/components/ui";
import { AssignTeacherModal, AssignmentFormModal, LessonItem, LevelBadge, StudentFormModal } from "@/components/domain";
import { InstrumentBadge } from "@/components/InstrumentIcon";
import { LEVELS, instrumentById, levelName, pieceById } from "@/data/catalog";
import { attendanceOf, ASSIGNMENT_STATUS, PIECE_STATUS, assignmentsOf, piecesOf, progressOf, skillState, skillsFor, stageComplete , ageText, telHref } from "@/lib/selectors";
import { fmtDate, fmtDateShort, relativeDay, todayISO } from "@/lib/date";
import { navigate } from "@/lib/router";
import type { PieceStatus } from "@/data/types";

type Tab = "progress" | "pieces" | "assignments" | "lessons" | "history";

export default function StudentProfile({ id, back, asTeacher }: { id: string; back: string; asTeacher?: boolean }) {
  const data = useStore((s) => s.data);
  const session = useStore((s) => s.session);
  const toggleSkill = useStore((s) => s.toggleSkill);
  const setPieceStatus = useStore((s) => s.setPieceStatus);
  const setAssignmentStatus = useStore((s) => s.setAssignmentStatus);
  const [tab, setTab] = useState<Tab>("progress");
  const [modal, setModal] = useState<"edit" | "assign" | "assignment" | "eval" | "level" | null>(null);

  const s = data.students.find((x) => x.id === id);
  const allowed = s && (asTeacher ? s.teacherId === session.teacherId : s.institutionId === session.institutionId);
  if (!s || !allowed)
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Bu öğrenci profiline erişiminiz yok"
        text={asTeacher ? "Öğretmenler yalnızca kendilerine atanmış öğrencileri görebilir." : "Bu öğrenci seçili kuruma ait değil."}
        action={<Button onClick={() => navigate(back)}>Listeye dön</Button>}
        className="py-24"
      />
    );

  const teacher = data.teachers.find((t) => t.id === s.teacherId)!;
  const inst = data.institutions.find((i) => i.id === s.institutionId)!;
  const pieces = piecesOf(data, s.id);
  const assignments = assignmentsOf(data, s.id);
  const lessons = data.lessons.filter((l) => l.studentId === s.id).sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start));
  const progress = progressOf(s);
  const skills = skillsFor(s);
  const ready = stageComplete(s);
  const currentStage = skills.filter((k) => k.stage === s.level);

  return (
    <>
      <PageHeader
        back={{ label: asTeacher ? "Öğrencilerim" : "Öğrenciler", to: back }}
        title={
          <span className="flex items-center gap-4">
            <Avatar name={s.name} size={52} />
            <span>
              {s.name}
              <span className="mt-1 flex flex-wrap items-center gap-2 text-[13px] font-medium tracking-normal text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <InstrumentBadge id={s.instrument} size={22} rounded="rounded-md" /> {instrumentById[s.instrument].name}
                </span>
                · <LevelBadge level={s.level} /> · {ageText(s)} · {teacher.name}
                {!asTeacher && s.tc && <> · TC {s.tc}</>}
                {!asTeacher && s.phone && (
                  <>
                    {" "}
                    · <a href={telHref(s.phone)} className="text-brand-700 hover:underline">{s.phone}</a>
                  </>
                )}
                {!asTeacher && s.guardians?.[0]?.name && (
                  <>
                    {" "}
                    · {s.guardians[0].relation || "Veli"}: {s.guardians[0].name}
                    {s.guardians[0].phone && (
                      <a href={telHref(s.guardians[0].phone)} className="ml-1 text-brand-700 hover:underline">
                        {s.guardians[0].phone}
                      </a>
                    )}
                  </>
                )}
              </span>
            </span>
          </span>
        }
        actions={
          asTeacher ? (
            <>
              <Button variant="secondary" icon={MessageSquarePlus} onClick={() => setModal("eval")}>
                Değerlendirme
              </Button>
              <Button icon={ClipboardList} onClick={() => setModal("assignment")}>
                Ödev ver
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" icon={Pencil} onClick={() => setModal("edit")}>
                Düzenle
              </Button>
              <Button icon={UserRoundCog} onClick={() => setModal("assign")}>
                Öğretmen ata
              </Button>
            </>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="flex items-center gap-4 p-5">
          <ProgressRing value={progress} size={60}>
            <span className="text-sm font-bold">%{progress}</span>
          </ProgressRing>
          <div>
            <p className="text-[13px] font-medium text-muted">Eğitim ilerlemesi</p>
            <p className="text-sm font-semibold">
              {s.skillsDone.length}/{skills.length} kazanım
            </p>
          </div>
        </Card>
        <MiniStat icon={Music2} label="Tamamlanan parça" value={`${pieces.filter((p) => p.status === "done").length}/${pieces.length}`} />
        <MiniStat icon={CalendarCheck2} label="Devam oranı" value={`%${attendanceOf(data, s.id).rate}`} />
        <MiniStat icon={Flame} label="Çalışma serisi" value={`${s.streak} gün`} />
      </div>

      <Card className="mt-6 flex flex-col gap-4 p-5 md:flex-row md:items-center">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", ready ? "bg-mint-50 text-mint-600" : "bg-canvas text-ink-2")}>
          <TrendingUp size={20} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">
            Seviye geçişi: {levelName(s.level)} {s.level < 4 && <>→ {levelName((s.level + 1) as 0)}</>}
          </p>
          <p className="text-[13px] text-muted">
            {s.level === 4
              ? "Öğrenci en üst seviyede."
              : ready
                ? "Bu seviyedeki tüm kazanımlar tamamlandı. Seviye geçişi öğretmen onayı bekliyor."
                : `Bu seviyede ${currentStage.filter((k) => s.skillsDone.includes(k.id)).length}/${currentStage.length} kazanım tamamlandı. Geçiş, öğretmen onayıyla yapılır; otomatik yükseltme yoktur.`}
          </p>
        </div>
        {asTeacher && s.level < 4 && (
          <Button variant={ready ? "mint" : "secondary"} icon={Award} onClick={() => setModal("level")}>
            Seviye geçişini onayla
          </Button>
        )}
        {!asTeacher && s.level < 4 && <Badge tone={ready ? "sun" : "neutral"}>{ready ? "Onay bekliyor" : "Devam ediyor"}</Badge>}
      </Card>

      <div className="mt-6">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "progress", label: "Teknik kazanımlar" },
            { id: "pieces", label: "Parçalar", count: pieces.length },
            { id: "assignments", label: "Ödev geçmişi", count: assignments.length },
            { id: "lessons", label: "Dersler" },
            { id: "history", label: "Seviye ve değerlendirme" },
          ]}
        />
      </div>

      <div className="mt-4">
        {tab === "progress" && (
          <div className="grid gap-4 lg:grid-cols-2">
            {LEVELS.map((lv) => {
              const list = skills.filter((k) => k.stage === lv.id);
              const done = list.filter((k) => s.skillsDone.includes(k.id)).length;
              return (
                <Card key={lv.id} className={cn("p-5", lv.id > s.level && "bg-canvas/40")}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LevelBadge level={lv.id} />
                      <span className="text-[13px] font-semibold text-ink-2">{lv.stage}</span>
                    </div>
                    <span className="text-xs text-muted tabular-nums">
                      {done}/{list.length}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {list.map((k) => {
                      const state = skillState(s, k.id, k.stage);
                      return (
                        <li key={k.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5">
                          <span
                            className={cn(
                              "grid size-6 shrink-0 place-items-center rounded-full",
                              state === "done" ? "bg-mint-500 text-white" : state === "active" ? "border-2 border-brand-400" : "bg-canvas-2 text-faint",
                            )}
                          >
                            {state === "done" ? <Check size={13} strokeWidth={3} /> : state === "locked" ? <Lock size={11} /> : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={cn("block text-[13px] font-semibold", state === "locked" && "text-muted")}>{k.title}</span>
                            <span className="block truncate text-xs text-muted">{k.description}</span>
                          </span>
                          {asTeacher && state !== "locked" && (
                            <Button size="sm" variant={state === "done" ? "ghost" : "soft"} onClick={() => toggleSkill(s.id, k.id)}>
                              {state === "done" ? "Geri al" : "Onayla"}
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              );
            })}
          </div>
        )}

        {tab === "pieces" && (
          <Card className="divide-y divide-line">
            {pieces.length === 0 && <EmptyState icon={Music2} title="Henüz parça atanmadı" />}
            {pieces.map((sp) => {
              const p = pieceById[sp.pieceId];
              return (
                <div key={sp.id} className="flex flex-wrap items-center gap-4 p-4">
                  <InstrumentBadge id={p.instrument} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{p.title}</p>
                    <p className="text-xs text-muted">
                      {p.composer} · {levelName(p.level)} · {sp.currentTempo}/{sp.targetTempo} BPM
                    </p>
                  </div>
                  {asTeacher ? (
                    <Select value={sp.status} onChange={(e) => setPieceStatus(sp.id, e.target.value as PieceStatus)} className="w-48" aria-label="Parça durumu">
                      {Object.entries(PIECE_STATUS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Badge tone={PIECE_STATUS[sp.status].tone}>{PIECE_STATUS[sp.status].label}</Badge>
                  )}
                </div>
              );
            })}
          </Card>
        )}

        {tab === "assignments" && (
          <Card className="divide-y divide-line">
            {assignments.length === 0 && <EmptyState icon={ClipboardList} title="Ödev yok" />}
            {assignments.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="text-xs text-muted">
                    Son tarih: {fmtDate(a.dueDate)} {a.requiresApproval && "· Öğretmen onayı gerekli"}
                    {a.feedback && <> · “{a.feedback}”</>}
                  </p>
                </div>
                <Badge tone={ASSIGNMENT_STATUS[a.status].tone} dot>
                  {ASSIGNMENT_STATUS[a.status].label}
                </Badge>
                {asTeacher && a.status === "submitted" && (
                  <Button size="sm" variant="mint" onClick={() => setAssignmentStatus(a.id, "done", "Onaylandı, eline sağlık!")}>
                    Onayla
                  </Button>
                )}
              </div>
            ))}
          </Card>
        )}

        {tab === "lessons" && (
          <Card className="p-3">
            {lessons.map((l) => (
              <div key={l.id} className="flex items-center gap-2">
                <span className="w-24 shrink-0 pl-2 text-xs font-semibold text-muted">{relativeDay(l.date)}</span>
                <div className="min-w-0 flex-1">
                  <LessonItem lesson={l} show="teacher" onClick={asTeacher ? () => navigate(`/teacher/lessons/${l.id}`) : undefined} />
                </div>
              </div>
            ))}
          </Card>
        )}

        {tab === "history" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Seviye geçmişi" />
              <ol className="relative m-5 ml-8 border-l-2 border-line">
                {[...s.levelHistory].reverse().map((h, i) => (
                  <li key={i} className="mb-5 ml-5 last:mb-0">
                    <span className={cn("absolute -left-[7px] mt-1 size-3 rounded-full ring-4 ring-white", i === 0 ? "bg-brand-500" : "bg-line-strong")} />
                    <p className="text-sm font-semibold">{levelName(h.level)}</p>
                    <p className="text-xs text-muted">
                      {fmtDate(h.date)} · {data.teachers.find((t) => t.id === h.approvedBy)?.name ?? "—"} · {h.note}
                    </p>
                  </li>
                ))}
              </ol>
            </Card>
            <Card>
              <CardHeader title="Öğretmen değerlendirmeleri" action={asTeacher && <Button size="sm" variant="soft" onClick={() => setModal("eval")}>Ekle</Button>} />
              <ul className="space-y-3 p-5">
                {s.evaluations.map((e) => (
                  <li key={e.id} className="rounded-2xl bg-canvas p-4">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted">{fmtDateShort(e.date)} · {data.teachers.find((t) => t.id === e.teacherId)?.name}</span>
                      <Stars value={e.rating} />
                    </div>
                    <p className="text-[13.5px] leading-relaxed text-ink-2">{e.text}</p>
                  </li>
                ))}
                {s.evaluations.length === 0 && <EmptyState icon={MessageSquarePlus} title="Henüz değerlendirme yok" />}
              </ul>
            </Card>
          </div>
        )}
      </div>

      {modal === "edit" && <StudentFormModal open onClose={() => setModal(null)} institutionId={inst.id} student={s} />}
      {modal === "assign" && <AssignTeacherModal open onClose={() => setModal(null)} student={s} />}
      {modal === "assignment" && <AssignmentFormModal open onClose={() => setModal(null)} teacherId={s.teacherId} studentId={s.id} />}
      {modal === "eval" && <EvaluationModal studentId={s.id} onClose={() => setModal(null)} />}
      {modal === "level" && <LevelModal studentId={s.id} onClose={() => setModal(null)} />}
    </>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Music2; label: string; value: string }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className="grid size-[60px] place-items-center rounded-full bg-canvas text-ink-2">
        <Icon size={22} strokeWidth={1.8} />
      </span>
      <div>
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <p className="text-lg font-bold tabular-nums">{value}</p>
      </div>
    </Card>
  );
}

function EvaluationModal({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const add = useStore((s) => s.addEvaluation);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(4);
  const [err, setErr] = useState("");
  return (
    <Modal
      open
      onClose={onClose}
      title="Öğretmen değerlendirmesi"
      subtitle="Veli ekranında da görünür"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            onClick={() => {
              if (text.trim().length < 10) return setErr("En az 10 karakter yazın");
              add(studentId, text.trim(), rating as 1);
              onClose();
            }}
          >
            Kaydet
          </Button>
        </>
      }
    >
      <Field label="Genel değerlendirme">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} className={cn("h-9 flex-1 cursor-pointer rounded-xl border text-sm font-semibold transition", n <= rating ? "border-sun-500 bg-sun-50 text-sun-700" : "border-line text-muted")}>
              {n}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Not" error={err} className="mt-4">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Gelişim, güçlü yönler ve sonraki odak…" invalid={!!err} autoFocus />
      </Field>
    </Modal>
  );
}

function LevelModal({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const s = useStore((st) => st.data.students.find((x) => x.id === studentId))!;
  const approve = useStore((st) => st.approveLevel);
  const [note, setNote] = useState("");
  const ready = stageComplete(s);
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Seviye geçişini onayla"
      subtitle={`${s.name}: ${levelName(s.level)} → ${levelName((s.level + 1) as 0)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="mint"
            icon={Award}
            onClick={() => {
              approve(s.id, note.trim() || undefined);
              onClose();
            }}
          >
            Onayla
          </Button>
        </>
      }
    >
      {!ready && (
        <div className="mb-4 rounded-xl bg-sun-50 p-3 text-[13px] text-sun-700">
          Bu seviyedeki kazanımların tamamı henüz onaylanmadı. Yine de öğretmen kararıyla geçiş yapabilirsiniz.
        </div>
      )}
      <Field label="Değerlendirme notu (isteğe bağlı)">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Örn. Seviye sınavında başarılı performans" />
      </Field>
      <div className="mt-4">
        <p className="mb-1 text-xs text-muted">Mevcut seviye kazanımları</p>
        <ProgressBar value={(skillsFor(s).filter((k) => k.stage === s.level && s.skillsDone.includes(k.id)).length / 3) * 100} tone="mint" />
      </div>
      <p className="mt-3 text-xs text-muted">Geçiş tarihi: {fmtDate(todayISO())}</p>
    </Modal>
  );
}
