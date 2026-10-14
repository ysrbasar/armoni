import { useMemo, useState } from "react";
import { Search, UsersRound } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/layout/AdminShell";
import { Avatar, Badge, Card, EmptyState, Input, Select, Tabs } from "@/components/ui";
import { instrumentById, levelName } from "@/data/catalog";
import type { Tone } from "@/lib/selectors";

type Row = { id: string; name: string; role: "admin" | "teacher" | "student" | "parent"; inst: string; detail: string };
const ROLE_LABEL: Record<Row["role"], [string, Tone]> = {
  admin: ["Kurum yöneticisi", "brand"],
  teacher: ["Öğretmen", "sky"],
  student: ["Öğrenci", "mint"],
  parent: ["Veli", "sun"],
};

export default function PlatformUsers() {
  const data = useStore((s) => s.data);
  const [role, setRole] = useState<"all" | Row["role"]>("all");
  const [inst, setInst] = useState("all");
  const [q, setQ] = useState("");

  const rows = useMemo<Row[]>(() => {
    const instName = (id: string) => data.institutions.find((i) => i.id === id)?.short ?? "";
    return [
      ...data.institutions.map((i) => ({ id: `adm-${i.id}`, name: i.adminName, role: "admin" as const, inst: i.id, detail: i.name })),
      ...data.teachers.map((t) => ({ id: t.id, name: t.name, role: "teacher" as const, inst: t.institutionId, detail: t.specialties.map((s) => instrumentById[s].name).join(", ") })),
      ...data.students.map((s) => ({ id: s.id, name: s.name, role: "student" as const, inst: s.institutionId, detail: `${instrumentById[s.instrument].name} · ${levelName(s.level)}` })),
      ...data.parents.map((p) => {
        const kids = p.childIds.map((c) => data.students.find((s) => s.id === c)!).filter(Boolean);
        return { id: p.id, name: p.name, role: "parent" as const, inst: kids[0]?.institutionId ?? "", detail: `Çocuk: ${kids.map((k) => k.name.split(" ")[0]).join(", ")} · ${instName(kids[0]?.institutionId ?? "")}` };
      }),
    ];
  }, [data]);

  const filtered = rows.filter(
    (r) => (role === "all" || r.role === role) && (inst === "all" || r.inst === inst) && r.name.toLocaleLowerCase("tr").includes(q.toLocaleLowerCase("tr")),
  );
  const count = (r: Row["role"]) => rows.filter((x) => x.role === r && (inst === "all" || x.inst === inst)).length;

  return (
    <>
      <PageHeader title="Genel kullanıcı görünümü" subtitle={`${rows.length} kullanıcı · tüm kurumlar`} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs
          value={role}
          onChange={setRole}
          tabs={[
            { id: "all", label: "Tümü" },
            { id: "admin", label: "Yönetici", count: count("admin") },
            { id: "teacher", label: "Öğretmen", count: count("teacher") },
            { id: "student", label: "Öğrenci", count: count("student") },
            { id: "parent", label: "Veli", count: count("parent") },
          ]}
        />
        <div className="flex flex-1 flex-wrap justify-end gap-2">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="İsimle ara" className="pl-9" aria-label="Kullanıcı ara" />
          </div>
          <Select value={inst} onChange={(e) => setInst(e.target.value)} className="w-full sm:w-52" aria-label="Kurum filtresi">
            <option value="all">Tüm kurumlar</option>
            {data.institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={UsersRound} title="Eşleşen kullanıcı yok" text="Arama veya filtreleri değiştirmeyi deneyin." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th className="px-5 py-3 font-semibold">Kullanıcı</th>
                  <th className="px-5 py-3 font-semibold">Rol</th>
                  <th className="px-5 py-3 font-semibold">Kurum</th>
                  <th className="px-5 py-3 font-semibold">Ayrıntı</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-line/70 last:border-0 hover:bg-canvas/50">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        <Avatar name={r.name} size={32} />
                        <span className="font-semibold">{r.name}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={ROLE_LABEL[r.role][1]}>{ROLE_LABEL[r.role][0]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-ink-2">{data.institutions.find((i) => i.id === r.inst)?.name}</td>
                    <td className="px-5 py-3 text-muted">{r.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
