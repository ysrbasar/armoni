import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/layout/AdminShell";
import { Card } from "@/components/ui";
import { InstrumentBadge } from "@/components/InstrumentIcon";
import { INSTRUMENTS, PIECES, SKILLS } from "@/data/catalog";
import { LevelStrip } from "@/components/charts";

export default function PlatformCategories() {
  const data = useStore((s) => s.data);
  return (
    <>
      <PageHeader title="Kurs kategorileri" subtitle="Platform genelinde tanımlı branşlar ve kullanım durumu" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {INSTRUMENTS.map((ins) => {
          const st = data.students.filter((s) => s.instrument === ins.id);
          const offering = data.institutions.filter((i) => i.courseIds.includes(ins.id));
          return (
            <Card key={ins.id} className="p-5">
              <div className="flex items-center justify-between">
                <InstrumentBadge id={ins.id} size={52} rounded="rounded-2xl" />
                <span className="text-right">
                  <span className="block text-2xl font-bold tabular-nums">{st.length}</span>
                  <span className="text-xs text-muted">öğrenci</span>
                </span>
              </div>
              <h3 className="mt-4 text-[15px] font-bold">{ins.name}</h3>
              <p className="mt-0.5 text-xs text-muted">
                {SKILLS.filter((k) => k.instrument === ins.id).length} kazanım · {PIECES.filter((p) => p.instrument === ins.id).length} parça · 5 seviye
              </p>
              <div className="mt-4">
                <LevelStrip counts={[0, 1, 2, 3, 4].map((l) => st.filter((s) => s.level === l).length)} />
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {offering.map((i) => (
                  <span key={i.id} className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-semibold text-ink-2">
                    {i.short}
                  </span>
                ))}
                {offering.length === 0 && <span className="text-[11px] text-faint">Henüz kurum yok</span>}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
