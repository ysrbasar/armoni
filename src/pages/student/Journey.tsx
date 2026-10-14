import { useState } from "react";
import { Check, ClipboardList, Lock, Music2, Sparkles } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Badge, Card, Modal, cn } from "@/components/ui";
import { InstrumentBadge } from "@/components/InstrumentIcon";
import { LEVELS, PIECES, instrumentById } from "@/data/catalog";
import { assignmentsOf, progressOf, skillState, skillsFor } from "@/lib/selectors";
import type { Skill } from "@/data/types";
import { ASSIGNMENT_STATUS } from "@/lib/selectors";

export default function Journey() {
  const data = useStore((s) => s.data);
  const sid = useStore((s) => s.session.studentId);
  const s = data.students.find((x) => x.id === sid)!;
  const [open, setOpen] = useState<Skill | null>(null);
  const ins = instrumentById[s.instrument];
  const skills = skillsFor(s);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted">Öğrenme yolculuğu</p>
          <h1 className="mt-1 flex items-center gap-3 text-3xl font-extrabold tracking-[-0.03em]">
            <InstrumentBadge id={s.instrument} size={44} rounded="rounded-2xl" />
            {ins.name} haritası
          </h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-mint-500" /> Tamamlandı
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full border-2 border-brand-500" /> Aktif
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-line-strong" /> Kilitli
          </span>
          <Badge tone="brand">%{progressOf(s)}</Badge>
        </div>
      </div>

      <ol className="relative">
        {LEVELS.map((lv, idx) => {
          const list = skills.filter((k) => k.stage === lv.id);
          const done = list.filter((k) => s.skillsDone.includes(k.id)).length;
          const status = lv.id < s.level || done === list.length ? "done" : lv.id === s.level ? "active" : "locked";
          return (
            <li key={lv.id} className="relative pb-10 pl-16 last:pb-0 sm:pl-20">
              {idx < LEVELS.length - 1 && (
                <span className={cn("absolute top-14 bottom-0 left-[23px] w-[3px] rounded-full sm:left-[27px]", status === "done" ? "bg-mint-500" : "bg-line")} />
              )}
              <span
                className={cn(
                  "absolute top-0 left-0 grid size-12 place-items-center rounded-2xl text-lg font-extrabold sm:size-14",
                  status === "done" && "bg-mint-500 text-white",
                  status === "active" && "bg-brand-600 text-white shadow-[0_0_0_6px_var(--color-brand-100)]",
                  status === "locked" && "bg-canvas-2 text-faint",
                )}
              >
                {status === "done" ? <Check size={22} strokeWidth={3} /> : status === "locked" ? <Lock size={18} /> : lv.id + 1}
              </span>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-1.5 sm:pt-2.5">
                <h2 className={cn("text-xl font-bold tracking-tight", status === "locked" && "text-muted")}>{lv.stage}</h2>
                <span className="text-xs font-semibold text-muted">
                  {done}/{list.length} kazanım
                </span>
                {status === "active" && <Badge tone="brand">Şu an buradasın</Badge>}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {list.map((k) => {
                  const st = skillState(s, k.id, k.stage);
                  return (
                    <button
                      key={k.id}
                      onClick={() => setOpen(k)}
                      className={cn(
                        "group flex cursor-pointer flex-col rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5",
                        st === "done" && "border-mint-100 bg-mint-50/60 hover:shadow-lift",
                        st === "active" && "border-brand-200 bg-surface shadow-card ring-4 ring-brand-50 hover:shadow-lift",
                        st === "locked" && "border-dashed border-line-strong bg-transparent",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-8 place-items-center rounded-full",
                          st === "done" && "bg-mint-500 text-white",
                          st === "active" && "bg-brand-50 text-brand-600",
                          st === "locked" && "bg-canvas-2 text-faint",
                        )}
                      >
                        {st === "done" ? <Check size={15} strokeWidth={3} /> : st === "active" ? <Sparkles size={15} /> : <Lock size={13} />}
                      </span>
                      <span className={cn("mt-3 text-[14px] font-semibold", st === "locked" && "text-muted")}>{k.title}</span>
                      <span className="mt-1 line-clamp-2 text-xs text-muted">{k.description}</span>
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      {open && <SkillModal skill={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function SkillModal({ skill, onClose }: { skill: Skill; onClose: () => void }) {
  const data = useStore((st) => st.data);
  const sid = useStore((st) => st.session.studentId);
  const s = data.students.find((x) => x.id === sid)!;
  const state = skillState(s, skill.id, skill.stage);
  const related = assignmentsOf(data, s.id).filter((a) => a.skillId === skill.id);
  const pieces = PIECES.filter((p) => p.instrument === s.instrument && p.level === skill.stage);
  return (
    <Modal open onClose={onClose} title={skill.title} subtitle={LEVELS[skill.stage].stage} size="sm">
      <Card className={cn("p-4", state === "done" ? "bg-mint-50" : state === "active" ? "bg-brand-50/60" : "bg-canvas")}>
        <p className="text-[13.5px] leading-relaxed text-ink-2">{skill.description}</p>
        <p className="mt-3 text-xs font-semibold">
          {state === "done" && <span className="text-mint-700">✓ Öğretmenin bu kazanımı onayladı.</span>}
          {state === "active" && <span className="text-brand-700">Üzerinde çalışıyorsun. Öğretmenin derste onayladığında tamamlanır.</span>}
          {state === "locked" && <span className="text-muted">Önceki seviyeyi tamamladığında açılacak.</span>}
        </p>
      </Card>
      <p className="mt-5 mb-2 flex items-center gap-2 text-[13px] font-semibold text-ink-2">
        <ClipboardList size={15} /> İlgili ödevler
      </p>
      {related.length ? (
        <ul className="space-y-2">
          {related.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 text-[13px]">
              <span className="truncate">{a.title}</span>
              <Badge tone={ASSIGNMENT_STATUS[a.status].tone}>{ASSIGNMENT_STATUS[a.status].label}</Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted">Bu kazanıma bağlı ödev yok.</p>
      )}
      <p className="mt-5 mb-2 flex items-center gap-2 text-[13px] font-semibold text-ink-2">
        <Music2 size={15} /> Bu seviyenin parçaları
      </p>
      <div className="flex flex-wrap gap-2">
        {pieces.map((p) => (
          <span key={p.id} className="rounded-full bg-canvas px-3 py-1 text-xs font-semibold">
            {p.title}
          </span>
        ))}
        {pieces.length === 0 && <p className="text-xs text-muted">Teknik çalışma odaklı seviye.</p>}
      </div>
    </Modal>
  );
}
