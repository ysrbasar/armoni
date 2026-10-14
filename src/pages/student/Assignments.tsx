import { useState } from "react";
import { Check, ClipboardCheck, Clock3, Gauge, MessageCircle, Music2, Play, Repeat, ShieldCheck } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Badge, Button, Card, EmptyState, Tabs, cn } from "@/components/ui";
import { pieceById, skillById } from "@/data/catalog";
import { ASSIGNMENT_STATUS, assignmentsOf } from "@/lib/selectors";
import { addDays, diffDays, relativeDay, todayISO } from "@/lib/date";

type Tab = "active" | "soon" | "done" | "feedback";

export default function StudentAssignments() {
  const data = useStore((s) => s.data);
  const sid = useStore((s) => s.session.studentId);
  const setStatus = useStore((s) => s.setAssignmentStatus);
  const [tab, setTab] = useState<Tab>("active");
  const all = assignmentsOf(data, sid);
  const today = todayISO();
  const groups: Record<Tab, typeof all> = {
    active: all.filter((a) => a.status !== "done"),
    soon: all.filter((a) => a.status !== "done" && a.dueDate <= addDays(today, 3)),
    done: all.filter((a) => a.status === "done").reverse(),
    feedback: all.filter((a) => a.feedback),
  };
  const list = groups[tab];

  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-semibold text-muted">Çalışma planım</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.03em]">Ödevlerim</h1>
      </div>
      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "active", label: "Aktif", count: groups.active.length },
          { id: "soon", label: "Son tarihi yaklaşan", count: groups.soon.length },
          { id: "done", label: "Tamamlanan", count: groups.done.length },
          { id: "feedback", label: "Geri bildirimler", count: groups.feedback.length },
        ]}
      />
      {list.length === 0 ? (
        <Card>
          <EmptyState icon={ClipboardCheck} title={tab === "soon" ? "Yaklaşan son tarih yok" : "Bu listede ödev yok"} />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((a) => {
            const days = diffDays(a.dueDate, today);
            const late = a.status !== "done" && days < 0;
            return (
              <Card key={a.id} className="flex flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={ASSIGNMENT_STATUS[a.status].tone} dot>
                    {ASSIGNMENT_STATUS[a.status].label}
                  </Badge>
                  {a.requiresApproval && (
                    <Badge tone="neutral">
                      <ShieldCheck size={12} /> Öğretmen onayı gerekli
                    </Badge>
                  )}
                  <span className={cn("ml-auto inline-flex items-center gap-1 text-xs font-semibold", late ? "text-rose-600" : days <= 2 && a.status !== "done" ? "text-sun-700" : "text-muted")}>
                    <Clock3 size={13} /> {late ? "Gecikti · " : ""}
                    {relativeDay(a.dueDate)}
                  </span>
                </div>
                <h3 className="mt-3 text-[16px] font-bold tracking-tight">{a.title}</h3>
                <p className="mt-1 text-[13px] text-muted">{a.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {a.pieceId && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 font-semibold">
                      <Music2 size={12} /> {pieceById[a.pieceId].title}
                    </span>
                  )}
                  {a.skillId && <span className="rounded-full bg-canvas px-2.5 py-1 font-semibold">{skillById[a.skillId].title}</span>}
                  {a.tempo && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 font-semibold">
                      <Gauge size={12} /> {a.tempo} BPM
                    </span>
                  )}
                  {a.reps && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 font-semibold">
                      <Repeat size={12} /> {a.reps} tekrar
                    </span>
                  )}
                  {a.minutes && <span className="rounded-full bg-canvas px-2.5 py-1 font-semibold">Günde {a.minutes} dk</span>}
                </div>
                {a.feedback && (
                  <div className="mt-4 flex gap-2.5 rounded-2xl bg-brand-50/60 p-3">
                    <MessageCircle size={16} className="mt-0.5 shrink-0 text-brand-600" />
                    <p className="text-[13px] text-ink-2">
                      <b className="font-semibold text-brand-800">Öğretmenin:</b> {a.feedback}
                    </p>
                  </div>
                )}
                <div className="mt-auto flex justify-end gap-2 pt-4">
                  {a.status === "assigned" && (
                    <Button size="sm" variant="soft" icon={Play} onClick={() => setStatus(a.id, "in_progress")}>
                      Çalışmaya başla
                    </Button>
                  )}
                  {(a.status === "assigned" || a.status === "in_progress") && (
                    <Button size="sm" icon={Check} onClick={() => setStatus(a.id, a.requiresApproval ? "submitted" : "done")}>
                      {a.requiresApproval ? "Tamamladım, onaya gönder" : "Tamamlandı olarak işaretle"}
                    </Button>
                  )}
                  {a.status === "submitted" && <span className="rounded-xl bg-sun-50 px-3 py-2 text-xs font-semibold text-sun-700">Öğretmen onayı bekleniyor</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
