import { useState } from "react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/layout/AdminShell";
import { Card, CardHeader, Select, Tabs } from "@/components/ui";
import { Donut, LEVEL_RAMP, SimpleBars } from "@/components/charts";
import { LEVELS, instrumentById } from "@/data/catalog";
import { instStudents, instTeachers, shortName, ASSIGNMENT_STATUS, PIECE_STATUS } from "@/lib/selectors";
import type { AssignmentStatus, PieceStatus } from "@/data/types";

export default function Reports() {
  const data = useStore((s) => s.data);
  const instId = useStore((s) => s.session.institutionId);
  const inst = data.institutions.find((i) => i.id === instId)!;
  const [course, setCourse] = useState("all");
  const [table, setTable] = useState<"chart" | "table">("chart");

  const students = instStudents(data, instId).filter((s) => course === "all" || s.instrument === course);
  const teachers = instTeachers(data, instId);
  const ids = new Set(students.map((s) => s.id));
  const asg = data.assignments.filter((a) => ids.has(a.studentId));
  const sp = data.studentPieces.filter((p) => ids.has(p.studentId));

  const byInstrument = inst.courseIds.map((c) => ({ name: instrumentById[c].short, value: instStudents(data, instId).filter((s) => s.instrument === c).length, color: instrumentById[c].tone }));
  const perTeacher = teachers
    .map((t) => ({ name: shortName(t.name), value: students.filter((s) => s.teacherId === t.id).length }))
    .filter((t) => t.value > 0 || course === "all")
    .sort((a, b) => b.value - a.value);
  const levels = LEVELS.map((l) => ({ name: l.name, value: students.filter((s) => s.level === l.id).length }));
  const doneRate = Math.round((asg.filter((a) => a.status === "done").length / Math.max(asg.length, 1)) * 100);
  const asgStatus = (Object.keys(ASSIGNMENT_STATUS) as AssignmentStatus[]).map((k) => ({ name: ASSIGNMENT_STATUS[k].label, value: asg.filter((a) => a.status === k).length }));
  const pieceStatus = (Object.keys(PIECE_STATUS) as PieceStatus[]).map((k) => ({ name: PIECE_STATUS[k].label, value: sp.filter((p) => p.status === k).length }));

  return (
    <>
      <PageHeader
        title="Raporlar"
        subtitle={`${inst.name} · ${students.length} öğrenci kapsamında`}
        actions={
          <>
            <Tabs value={table} onChange={setTable} tabs={[{ id: "chart", label: "Grafik" }, { id: "table", label: "Tablo" }]} />
            <Select value={course} onChange={(e) => setCourse(e.target.value)} className="w-44" aria-label="Kurs filtresi">
              <option value="all">Tüm kurslar</option>
              {inst.courseIds.map((c) => (
                <option key={c} value={c}>
                  {instrumentById[c].name}
                </option>
              ))}
            </Select>
          </>
        }
      />

      {table === "table" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {[
            ["Enstrümana göre öğrenci", byInstrument],
            ["Öğretmen başına öğrenci", perTeacher],
            ["Seviye dağılımı", levels],
            ["Ödev durumları", asgStatus],
            ["Parça durumları", pieceStatus],
          ].map(([title, rows]) => (
            <Card key={title as string}>
              <CardHeader title={title as string} />
              <table className="m-5 mt-3 w-[calc(100%-2.5rem)] text-[13.5px]">
                <tbody>
                  {(rows as { name: string; value: number }[]).map((r) => (
                    <tr key={r.name} className="border-b border-line/70 last:border-0">
                      <td className="py-2 text-ink-2">{r.name}</td>
                      <td className="py-2 text-right font-semibold tabular-nums">{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader title="Enstrümana göre öğrenci dağılımı" subtitle="Tüm kurs" />
              <div className="px-3 pt-4 pb-3">
                <SimpleBars data={byInstrument} colors={byInstrument.map((b) => b.color)} valueLabel="Öğrenci" height={240} />
              </div>
            </Card>
            <Card>
              <CardHeader title="Öğretmen başına öğrenci" />
              <div className="px-3 pt-4 pb-3">
                <SimpleBars data={perTeacher} layout="horizontal" valueLabel="Öğrenci" height={Math.max(200, perTeacher.length * 34)} />
              </div>
            </Card>
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <Card>
              <CardHeader title="Seviye dağılımı" />
              <div className="p-5">
                <Donut data={levels} colors={LEVEL_RAMP} size={140} />
              </div>
            </Card>
            <Card>
              <CardHeader title="Ödev tamamlama oranı" subtitle={`${asg.length} ödev`} />
              <div className="p-5">
                <Donut
                  data={asgStatus}
                  colors={["#d9d9e0", "#8574ee", "#e0a126", "#14a38b"]}
                  size={140}
                  unit="ödev"
                  center={
                    <div>
                      <div className="text-2xl font-bold tabular-nums">%{doneRate}</div>
                      <div className="text-[11px] text-muted">tamamlandı</div>
                    </div>
                  }
                />
              </div>
            </Card>
            <Card>
              <CardHeader title="Parça tamamlama istatistikleri" subtitle={`${sp.length} öğrenci–parça kaydı`} />
              <div className="space-y-3.5 p-5">
                {pieceStatus.map((p, i) => (
                  <div key={p.name}>
                    <div className="mb-1.5 flex justify-between text-[13px]">
                      <span className="text-ink-2">{p.name}</span>
                      <span className="font-semibold tabular-nums">
                        {p.value} <span className="text-xs font-normal text-muted">· %{Math.round((p.value / Math.max(sp.length, 1)) * 100)}</span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-canvas-2">
                      <div className="h-full rounded-full" style={{ width: `${(p.value / Math.max(sp.length, 1)) * 100}%`, background: ["#8574ee", "#e0a126", "#3b8fe0", "#14a38b"][i] }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
