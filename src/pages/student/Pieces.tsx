import { useState } from "react";
import { Gauge, Music2, Send, Timer } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Badge, Button, Card, EmptyState, Modal, ProgressBar, Tabs, cn } from "@/components/ui";
import { InstrumentBadge } from "@/components/InstrumentIcon";
import { levelName, pieceById } from "@/data/catalog";
import { ASSIGNMENT_STATUS, PIECE_STATUS, piecesOf } from "@/lib/selectors";
import type { PieceStatus, StudentPiece } from "@/data/types";
import { navigate } from "@/lib/router";
import { fmtDate, relativeDay } from "@/lib/date";

const ORDER: PieceStatus[] = ["learning", "practice", "review", "done"];

export default function Pieces() {
  const data = useStore((s) => s.data);
  const sid = useStore((s) => s.session.studentId);
  const [filter, setFilter] = useState<"all" | PieceStatus>("all");
  const [open, setOpen] = useState<string | null>(null);
  const list = piecesOf(data, sid);
  const shown = filter === "all" ? list : list.filter((p) => p.status === filter);
  const done = list.filter((p) => p.status === "done").length;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted">Repertuvarım</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.03em]">Parçalarım</h1>
          <p className="mt-1 text-sm text-muted">
            {list.length} parçadan {done} tanesi tamamlandı
          </p>
        </div>
        <div className="w-full sm:w-56">
          <ProgressBar value={(done / Math.max(list.length, 1)) * 100} tone="mint" height={8} />
        </div>
      </div>
      <Tabs
        className="mb-5"
        value={filter}
        onChange={setFilter}
        tabs={[{ id: "all", label: "Tümü", count: list.length }, ...ORDER.map((o) => ({ id: o, label: PIECE_STATUS[o].label, count: list.filter((p) => p.status === o).length }))]}
      />
      {shown.length === 0 ? (
        <Card>
          <EmptyState icon={Music2} title="Bu durumda parça yok" />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown
            .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status))
            .map((sp) => {
              const p = pieceById[sp.pieceId];
              const tempoPct = Math.round((sp.currentTempo / sp.targetTempo) * 100);
              return (
                <Card key={sp.id} as="button" onClick={() => setOpen(sp.id)} className={cn("cursor-pointer p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lift", sp.status === "done" && "bg-mint-50/30")}>
                  <div className="flex items-start justify-between gap-3">
                    <InstrumentBadge id={p.instrument} size={44} rounded="rounded-2xl" />
                    <Badge tone={PIECE_STATUS[sp.status].tone} dot>
                      {PIECE_STATUS[sp.status].label}
                    </Badge>
                  </div>
                  <p className="mt-4 text-[16px] font-bold tracking-tight">{p.title}</p>
                  <p className="text-[13px] text-muted">
                    {p.composer} · {levelName(p.level)}
                  </p>
                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-muted">Tempo</span>
                      <span className="font-semibold tabular-nums">
                        {sp.currentTempo} / {sp.targetTempo} BPM
                      </span>
                    </div>
                    <ProgressBar value={tempoPct} tone={sp.status === "done" ? "mint" : "brand"} />
                  </div>
                </Card>
              );
            })}
        </div>
      )}
      {open && <PieceModal spId={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function PieceModal({ spId, onClose }: { spId: string; onClose: () => void }) {
  const data = useStore((s) => s.data);
  const setPieceStatus = useStore((s) => s.setPieceStatus);
  const sp = data.studentPieces.find((x) => x.id === spId) as StudentPiece;
  const p = pieceById[sp.pieceId];
  const related = data.assignments.filter((a) => a.studentId === sp.studentId && a.pieceId === sp.pieceId);
  return (
    <Modal
      open
      onClose={onClose}
      title={p.title}
      subtitle={`${p.composer} · ${levelName(p.level)}`}
      footer={
        <>
          <Button variant="secondary" icon={Timer} onClick={() => navigate(`/student/lab/metronome-${sp.targetTempo}`)}>
            Metronomu {sp.targetTempo} BPM aç
          </Button>
          {(sp.status === "learning" || sp.status === "practice") && (
            <Button
              icon={Send}
              onClick={() => {
                setPieceStatus(sp.id, "review");
                onClose();
              }}
            >
              Değerlendirmeye gönder
            </Button>
          )}
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-canvas p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
            <Gauge size={14} /> Önerilen tempo
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {sp.targetTempo} <span className="text-sm font-medium text-muted">BPM</span>
          </p>
          <p className="text-xs text-muted">Şu anki tempon: {sp.currentTempo} BPM</p>
        </div>
        <div className="rounded-2xl bg-canvas p-4">
          <p className="text-xs font-semibold text-muted">Durum</p>
          <div className="mt-2">
            <Badge tone={PIECE_STATUS[sp.status].tone} dot>
              {PIECE_STATUS[sp.status].label}
            </Badge>
          </div>
          {sp.completedAt && <p className="mt-2 text-xs text-muted">Tamamlanma: {fmtDate(sp.completedAt)}</p>}
          {sp.status === "review" && <p className="mt-2 text-xs text-muted">Öğretmenin değerlendiriyor.</p>}
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-muted">Çalışma hedefi</p>
          <p className="mt-1 text-[13.5px]">{sp.goal}</p>
        </div>
        <div className="rounded-2xl border-l-4 border-brand-400 bg-brand-50/50 p-4">
          <p className="text-xs font-semibold text-brand-700">Öğretmen notu</p>
          <p className="mt-1 text-[13.5px] text-ink-2">{sp.teacherNote}</p>
        </div>
      </div>
      <p className="mt-5 mb-2 text-[13px] font-semibold text-ink-2">İlgili ödevler</p>
      {related.length ? (
        <ul className="space-y-2">
          {related.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 text-[13px]">
              <span className="min-w-0 truncate">{a.title}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted">{relativeDay(a.dueDate)}</span>
                <Badge tone={ASSIGNMENT_STATUS[a.status].tone}>{ASSIGNMENT_STATUS[a.status].label}</Badge>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted">Bu parçaya bağlı ödev yok.</p>
      )}
    </Modal>
  );
}
