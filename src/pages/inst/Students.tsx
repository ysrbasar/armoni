import { useState } from "react";
import { CalendarX2, ChevronRight, GraduationCap, Pencil, Plus, Search, Trash2, UserRoundCog } from "lucide-react";
import { flushSync, useStore } from "@/store/useStore";
import { deleteAccountsOf } from "@/lib/api";
import { TENANT } from "@/lib/tenant";
import { PageHeader } from "@/components/layout/AdminShell";
import { Avatar, Button, Card, EmptyState, IconButton, Input, ProgressBar, Select, Tabs } from "@/components/ui";
import { StudentAttendance } from "./Attendance";
import { AssignTeacherModal, LevelBadge, StudentFormModal } from "@/components/domain";
import { InstrumentBadge } from "@/components/InstrumentIcon";
import { LEVELS, instrumentById } from "@/data/catalog";
import { attendanceOf, instStudents, instTeachers, progressOf , ageText } from "@/lib/selectors";
import { navigate } from "@/lib/router";
import type { Student } from "@/data/types";
import { cn } from "@/components/ui";

export default function InstStudents() {
  const data = useStore((s) => s.data);
  const instId = useStore((s) => s.session.institutionId);
  const inst = data.institutions.find((i) => i.id === instId)!;
  const [q, setQ] = useState("");
  const [course, setCourse] = useState("all");
  const [teacher, setTeacher] = useState("all");
  const [level, setLevel] = useState("all");
  const [view, setView] = useState<"list" | "attendance">("list");
  const [modal, setModal] = useState<{ kind: "add" } | { kind: "edit" | "assign"; student: Student } | null>(null);
  const deleteStudent = useStore((s) => s.deleteStudent);
  const toast = useStore((s) => s.toast);

  /** Öğrenciyi; dersleri, ödevleri, ödemeleri, (başka çocuğu yoksa) velisi ve giriş hesaplarıyla birlikte siler */
  const removeStudent = async (id: string) => {
    const s = data.students.find((x) => x.id === id)!;
    const lessons = data.lessons.filter((l) => l.studentId === id).length;
    if (!confirm(`${s.name} silinsin mi?

${lessons} ders, ödevleri, parçaları, ödemeleri ve giriş hesabı da silinir. Velinin başka çocuğu yoksa veli kaydı ve hesabı da kalkar.

Bu işlem geri alınamaz.`)) return;
    const parentIds = data.parents.filter((p) => p.childIds.length === 1 && p.childIds[0] === id).map((p) => p.id);
    deleteStudent(id);
    if (!TENANT) return;
    try {
      await flushSync();
      await deleteAccountsOf([id, ...parentIds]);
    } catch (e) {
      toast(e instanceof Error ? `Hesap silinemedi: ${e.message}` : "Hesap silinemedi", "error");
    }
  };

  const students = instStudents(data, instId);
  const teachers = instTeachers(data, instId);
  const filtered = students.filter(
    (s) =>
      (course === "all" || s.instrument === course) &&
      (teacher === "all" || s.teacherId === teacher) &&
      (level === "all" || s.level === Number(level)) &&
      s.name.toLocaleLowerCase("tr").includes(q.trim().toLocaleLowerCase("tr")),
  );
  const anyFilter = q || course !== "all" || teacher !== "all" || level !== "all";

  return (
    <>
      <PageHeader
        title="Öğrenciler"
        subtitle={`${inst.name} · ${students.length} aktif öğrenci`}
        actions={
          <Button icon={Plus} onClick={() => setModal({ kind: "add" })}>
            Öğrenci ekle
          </Button>
        }
      />
      <Tabs
        className="mb-5"
        value={view}
        onChange={setView}
        tabs={[
          { id: "list", label: "Öğrenci listesi", icon: GraduationCap },
          { id: "attendance", label: "Devamsızlık", icon: CalendarX2 },
        ]}
      />
      {view === "attendance" ? (
        <StudentAttendance />
      ) : (
      <>
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_180px_200px_160px]">
        <div className="relative">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Öğrenci ara" className="pl-9" aria-label="Öğrenci ara" />
        </div>
        <Select value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Kurs filtresi">
          <option value="all">Tüm kurslar</option>
          {inst.courseIds.map((c) => (
            <option key={c} value={c}>
              {instrumentById[c].name}
            </option>
          ))}
        </Select>
        <Select value={teacher} onChange={(e) => setTeacher(e.target.value)} aria-label="Öğretmen filtresi">
          <option value="all">Tüm öğretmenler</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <Select value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Seviye filtresi">
          <option value="all">Tüm seviyeler</option>
          {LEVELS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Eşleşen öğrenci yok"
            text="Arama ya da filtreleri değiştirin."
            action={
              anyFilter && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQ("");
                    setCourse("all");
                    setTeacher("all");
                    setLevel("all");
                  }}
                >
                  Filtreleri temizle
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th className="px-5 py-3 font-semibold">Öğrenci</th>
                  <th className="px-4 py-3 font-semibold">Kurs</th>
                  <th className="px-4 py-3 font-semibold">Öğretmen</th>
                  <th className="px-4 py-3 font-semibold">Seviye</th>
                  <th className="px-4 py-3 font-semibold">Devam</th>
                  <th className="w-44 px-4 py-3 font-semibold">İlerleme</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const t = data.teachers.find((x) => x.id === s.teacherId);
                  const p = progressOf(s);
                  const att = attendanceOf(data, s.id).rate;
                  return (
                    <tr key={s.id} className="group cursor-pointer border-b border-line/70 last:border-0 hover:bg-canvas/60" onClick={() => navigate(`/inst/students/${s.id}`)}>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-3">
                          <Avatar name={s.name} size={34} />
                          <span>
                            <span className="block font-semibold">{s.name}</span>
                            <span className="text-xs text-muted">{ageText(s)} · {inst.branches.find((b) => b.id === s.branchId)?.name}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          <InstrumentBadge id={s.instrument} size={28} rounded="rounded-lg" />
                          {instrumentById[s.instrument].name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-2">{t?.name}</td>
                      <td className="px-4 py-3">
                        <LevelBadge level={s.level} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("font-semibold tabular-nums", att >= 90 ? "text-mint-700" : att >= 80 ? "text-ink-2" : "text-sun-700")}>%{att}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={p} />
                          <span className="w-9 text-right text-xs font-semibold text-muted tabular-nums">%{p}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <span className="flex items-center justify-end gap-0.5">
                          <IconButton icon={UserRoundCog} label="Öğretmen ata" onClick={() => setModal({ kind: "assign", student: s })} />
                          <IconButton icon={Pencil} label="Düzenle" onClick={() => setModal({ kind: "edit", student: s })} />
                          <IconButton icon={ChevronRight} label="Detay" onClick={() => navigate(`/inst/students/${s.id}`)} />
                          <button
                            type="button"
                            onClick={() => removeStudent(s.id)}
                            className="ml-1 inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                            aria-label={`${s.name} öğrencisini sil`}
                          >
                            <Trash2 size={15} /> Sil
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="mt-3 text-xs text-muted">{filtered.length} öğrenci gösteriliyor</p>
      </>
      )}

      {modal?.kind === "add" && <StudentFormModal open onClose={() => setModal(null)} institutionId={instId} />}
      {modal?.kind === "edit" && <StudentFormModal open onClose={() => setModal(null)} institutionId={instId} student={modal.student} />}
      {modal?.kind === "assign" && <AssignTeacherModal open onClose={() => setModal(null)} student={modal.student} />}
    </>
  );
}
