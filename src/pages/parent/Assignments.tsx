import { ClipboardCheck, MessageCircle } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Card, EmptyState } from "@/components/ui";
import { pieceById } from "@/data/catalog";
import { ASSIGNMENT_STATUS, assignmentsOf } from "@/lib/selectors";
import { fmtDate, relativeDay } from "@/lib/date";
import type { AssignmentStatus } from "@/data/types";
import { ParentStatus, useChild } from "./Overview";

const ORDER: AssignmentStatus[] = ["submitted", "in_progress", "assigned", "done"];

export default function ParentAssignments() {
  const data = useStore((s) => s.data);
  const child = useChild();
  const all = assignmentsOf(data, child.id);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Ödevler</h1>
        <p className="mt-1 text-sm text-muted">{child.name} için verilen tüm ödevler ve durumları</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ORDER.map((st) => (
          <Card key={st} className="p-4">
            <p className="text-2xl font-bold tabular-nums">{all.filter((a) => a.status === st).length}</p>
            <p className="text-xs text-muted">{ASSIGNMENT_STATUS[st].parent}</p>
          </Card>
        ))}
      </div>
      {all.length === 0 && (
        <Card>
          <EmptyState icon={ClipboardCheck} title="Henüz ödev yok" />
        </Card>
      )}
      {ORDER.map((st) => {
        const list = all.filter((a) => a.status === st);
        if (!list.length) return null;
        return (
          <section key={st}>
            <h2 className="mb-3 text-sm font-semibold text-ink-2">{ASSIGNMENT_STATUS[st].parent}</h2>
            <Card className="divide-y divide-line">
              {list.map((a) => (
                <div key={a.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold">{a.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {a.status === "done" ? `Son tarih: ${fmtDate(a.dueDate)}` : `Son tarih: ${relativeDay(a.dueDate)}`}
                        {a.pieceId && ` · ${pieceById[a.pieceId].title}`}
                        {a.minutes && ` · günde ${a.minutes} dk`}
                      </p>
                    </div>
                    <ParentStatus status={a.status} />
                  </div>
                  {a.feedback && (
                    <p className="mt-3 flex gap-2 rounded-xl bg-canvas p-3 text-[13px] text-ink-2">
                      <MessageCircle size={15} className="mt-0.5 shrink-0 text-brand-500" /> {a.feedback}
                    </p>
                  )}
                </div>
              ))}
            </Card>
          </section>
        );
      })}
    </div>
  );
}
