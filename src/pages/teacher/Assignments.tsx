import { useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/layout/AdminShell";
import { Avatar, Badge, Button, Card, EmptyState, Field, Modal, Select, Tabs, Textarea } from "@/components/ui";
import { AssignmentFormModal } from "@/components/domain";
import { pieceById, skillById } from "@/data/catalog";
import { ASSIGNMENT_STATUS, teacherStudents } from "@/lib/selectors";
import { fmtDate, relativeDay, todayISO } from "@/lib/date";
import type { Assignment } from "@/data/types";
import { cn } from "@/components/ui";

export function ReviewModal({ assignment, onClose }: { assignment: Assignment; onClose: () => void }) {
  const data = useStore((s) => s.data);
  const setStatus = useStore((s) => s.setAssignmentStatus);
  const [feedback, setFeedback] = useState(assignment.feedback ?? "");
  const st = data.students.find((s) => s.id === assignment.studentId)!;
  return (
    <Modal
      open
      onClose={onClose}
      title="Ödevi incele"
      subtitle={`${st.name} · ${assignment.title}`}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              setStatus(assignment.id, "in_progress", feedback.trim() || "Biraz daha çalışalım, derste birlikte bakacağız.");
              onClose();
            }}
          >
            Tekrar çalışsın
          </Button>
          <Button
            variant="mint"
            onClick={() => {
              setStatus(assignment.id, "done", feedback.trim() || "Onaylandı, eline sağlık!");
              onClose();
            }}
          >
            Tamamlandı olarak onayla
          </Button>
        </>
      }
    >
      <div className="grid gap-3 rounded-2xl bg-canvas p-4 text-[13px] sm:grid-cols-2">
        <p>
          <span className="text-muted">Son tarih:</span> <b>{fmtDate(assignment.dueDate)}</b>
        </p>
        <p>
          <span className="text-muted">Durum:</span> <b>{ASSIGNMENT_STATUS[assignment.status].label}</b>
        </p>
        {assignment.pieceId && (
          <p>
            <span className="text-muted">Parça:</span> <b>{pieceById[assignment.pieceId].title}</b>
          </p>
        )}
        {assignment.skillId && (
          <p>
            <span className="text-muted">Kazanım:</span> <b>{skillById[assignment.skillId].title}</b>
          </p>
        )}
        {(assignment.tempo || assignment.reps) && (
          <p className="sm:col-span-2">
            <span className="text-muted">Hedef:</span> <b>{[assignment.tempo && `${assignment.tempo} BPM`, assignment.reps && `${assignment.reps} tekrar`, assignment.minutes && `günde ${assignment.minutes} dk`].filter(Boolean).join(" · ")}</b>
          </p>
        )}
        <p className="text-ink-2 sm:col-span-2">{assignment.description}</p>
      </div>
      <Field label="Geri bildirim" className="mt-4" hint="Öğrenci ve veli ekranında görünür">
        <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Neler iyi gitti, neye odaklanmalı?" autoFocus />
      </Field>
    </Modal>
  );
}

type Tab = "submitted" | "active" | "done";

export default function TeacherAssignments() {
  const data = useStore((s) => s.data);
  const tid = useStore((s) => s.session.teacherId);
  const [tab, setTab] = useState<Tab>("submitted");
  const [student, setStudent] = useState("all");
  const [creating, setCreating] = useState(false);
  const [reviewing, setReviewing] = useState<Assignment | null>(null);
  const students = teacherStudents(data, tid);
  const ids = new Set(students.map((s) => s.id));
  const all = data.assignments.filter((a) => ids.has(a.studentId) && (student === "all" || a.studentId === student));
  const groups: Record<Tab, Assignment[]> = {
    submitted: all.filter((a) => a.status === "submitted"),
    active: all.filter((a) => a.status === "assigned" || a.status === "in_progress"),
    done: all.filter((a) => a.status === "done"),
  };
  const list = [...groups[tab]].sort((a, b) => (tab === "done" ? b.dueDate.localeCompare(a.dueDate) : a.dueDate.localeCompare(b.dueDate)));
  const today = todayISO();

  return (
    <>
      <PageHeader
        title="Ödevler"
        subtitle="Ödev oluşturun, teslimleri inceleyin ve geri bildirim verin"
        actions={
          <Button icon={Plus} onClick={() => setCreating(true)}>
            Yeni ödev
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "submitted", label: "Onay bekleyen", count: groups.submitted.length },
            { id: "active", label: "Aktif", count: groups.active.length },
            { id: "done", label: "Tamamlanan", count: groups.done.length },
          ]}
        />
        <Select value={student} onChange={(e) => setStudent(e.target.value)} className="w-full sm:w-56" aria-label="Öğrenci filtresi">
          <option value="all">Tüm öğrencilerim</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>
      <Card className="divide-y divide-line">
        {list.length === 0 && <EmptyState icon={ClipboardList} title="Bu listede ödev yok" text={tab === "submitted" ? "Teslim edilen ödevler burada onayınızı bekler." : undefined} />}
        {list.map((a) => {
          const st = data.students.find((s) => s.id === a.studentId)!;
          const late = a.status !== "done" && a.dueDate < today;
          return (
            <div key={a.id} className="flex flex-wrap items-center gap-4 p-4">
              <Avatar name={st.name} size={38} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="text-xs text-muted">
                  {st.name} · <span className={cn(late && "font-semibold text-rose-600")}>{late ? "Gecikti · " : ""}{relativeDay(a.dueDate)}</span>
                  {a.requiresApproval && " · Onay gerekli"}
                  {a.feedback && <span className="text-ink-2"> · “{a.feedback}”</span>}
                </p>
              </div>
              <Badge tone={ASSIGNMENT_STATUS[a.status].tone} dot>
                {ASSIGNMENT_STATUS[a.status].label}
              </Badge>
              <Button size="sm" variant={a.status === "submitted" ? "primary" : "secondary"} onClick={() => setReviewing(a)}>
                {a.status === "submitted" ? "İncele" : a.status === "done" ? "Görüntüle" : "Geri bildirim"}
              </Button>
            </div>
          );
        })}
      </Card>
      {creating && <AssignmentFormModal open onClose={() => setCreating(false)} teacherId={tid} />}
      {reviewing && <ReviewModal assignment={reviewing} onClose={() => setReviewing(null)} />}
    </>
  );
}
