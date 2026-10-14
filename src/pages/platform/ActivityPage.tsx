import { useState } from "react";
import { Activity as ActivityIcon } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/layout/AdminShell";
import { Card, EmptyState, Select, Tabs } from "@/components/ui";
import { ActivityFeed } from "@/components/domain";
import type { ActivityKind } from "@/data/types";

const KINDS: { id: "all" | ActivityKind; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "lesson", label: "Dersler" },
  { id: "assignment", label: "Ödevler" },
  { id: "piece", label: "Parçalar" },
  { id: "level", label: "Seviye" },
  { id: "student", label: "Kayıtlar" },
];

export default function PlatformActivity() {
  const data = useStore((s) => s.data);
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("all");
  const [inst, setInst] = useState("all");
  const items = data.activities.filter((a) => (kind === "all" || a.kind === kind) && (inst === "all" || a.institutionId === inst));
  return (
    <>
      <PageHeader title="Sistem aktiviteleri" subtitle="Tüm kurumlardaki son hareketler" />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={kind} onChange={setKind} tabs={KINDS} />
        <Select value={inst} onChange={(e) => setInst(e.target.value)} className="w-full sm:w-56" aria-label="Kurum filtresi">
          <option value="all">Tüm kurumlar</option>
          {data.institutions.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </Select>
      </div>
      <Card className="p-3">{items.length ? <ActivityFeed items={items} showInstitution /> : <EmptyState icon={ActivityIcon} title="Bu filtrede aktivite yok" />}</Card>
    </>
  );
}
