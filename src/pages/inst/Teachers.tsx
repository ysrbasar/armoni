import { useState } from "react";
import { ArrowRight, CalendarX2, Search, Trash2, UserPlus, UsersRound } from "lucide-react";
import { deleteAccountsOf } from "@/lib/api";
import { TENANT } from "@/lib/tenant";
import { AddTeacherModal } from "./Accounts";
import { flushSync, useStore } from "@/store/useStore";
import { PageHeader } from "@/components/layout/AdminShell";
import { Avatar, Button, Card, EmptyState, Input, Select, Tabs } from "@/components/ui";
import { TeacherAttendance } from "./Attendance";
import { InstrumentBadge } from "@/components/InstrumentIcon";
import { LevelStrip } from "@/components/charts";
import { instrumentById, levelName } from "@/data/catalog";
import { instTeachers } from "@/lib/selectors";
import { navigate } from "@/lib/router";

export default function InstTeachers() {
  const data = useStore((s) => s.data);
  const instId = useStore((s) => s.session.institutionId);
  const inst = data.institutions.find((i) => i.id === instId)!;
  const [q, setQ] = useState("");
  const [view, setView] = useState<"list" | "attendance">("list");
  const [course, setCourse] = useState("all");
  const [adding, setAdding] = useState(false);
  const deleteTeacher = useStore((s) => s.deleteTeacher);
  const toast = useStore((s) => s.toast);

  /** Öğrencisi olan öğretmen silinmez; önce öğrencileri başka öğretmene atanmalı */
  const removeTeacher = async (id: string) => {
    const t = data.teachers.find((x) => x.id === id)!;
    const n = data.students.filter((s) => s.teacherId === id).length;
    if (n > 0) {
      alert(`${t.name} silinemez: ${n} öğrencisi var.

Önce bu öğrencileri Öğrenciler sayfasından “Öğretmen ata” ile başka bir öğretmene atayın.`);
      return;
    }
    if (!confirm(`${t.name} silinsin mi?

Planlı dersleri ve giriş hesabı da silinir. Bu işlem geri alınamaz.`)) return;
    if (!deleteTeacher(id)) return;
    if (!TENANT) return;
    try {
      await flushSync();
      await deleteAccountsOf([id]);
    } catch (e) {
      toast(e instanceof Error ? `Hesap silinemedi: ${e.message}` : "Hesap silinemedi", "error");
    }
  };
  const teachers = instTeachers(data, instId).filter(
    (t) => (course === "all" || t.specialties.includes(course as never)) && t.name.toLocaleLowerCase("tr").includes(q.toLocaleLowerCase("tr")),
  );
  return (
    <>
      <PageHeader
        title="Öğretmenler"
        subtitle={`${inst.name} · ${instTeachers(data, instId).length} öğretmen`}
        actions={<Button icon={UserPlus} onClick={() => setAdding(true)}>Öğretmen ekle</Button>}
      />
      <AddTeacherModal open={adding} onClose={() => setAdding(false)} />
      <Tabs
        className="mb-5"
        value={view}
        onChange={setView}
        tabs={[
          { id: "list", label: "Öğretmenler", icon: UsersRound },
          { id: "attendance", label: "Devamsızlık", icon: CalendarX2 },
        ]}
      />
      {view === "attendance" ? (
        <TeacherAttendance />
      ) : (
      <>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Öğretmen ara" className="pl-9" aria-label="Öğretmen ara" />
        </div>
        <Select value={course} onChange={(e) => setCourse(e.target.value)} className="w-full sm:w-52" aria-label="Branş filtresi">
          <option value="all">Tüm branşlar</option>
          {inst.courseIds.map((c) => (
            <option key={c} value={c}>
              {instrumentById[c].name}
            </option>
          ))}
        </Select>
      </div>
      {teachers.length === 0 ? (
        <Card>
          <EmptyState icon={UsersRound} title="Eşleşen öğretmen yok" />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teachers.map((t) => {
            const st = data.students.filter((s) => s.teacherId === t.id);
            return (
              <Card
                key={t.id}
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/inst/teachers/${t.id}`)}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/inst/teachers/${t.id}`)}
                className="group cursor-pointer p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="flex items-start gap-4">
                  <Avatar name={t.name} size={52} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold">{t.name}</p>
                    <p className="text-[13px] text-muted">{t.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {t.experienceYears} yıl deneyim · {levelName(t.levels[0])}–{levelName(t.levels[t.levels.length - 1])}
                    </p>
                  </div>
                  <ArrowRight size={18} className="text-faint transition group-hover:text-brand-600" />
                </div>
                <div className="mt-4 flex gap-1.5">
                  {t.specialties.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-canvas py-0.5 pr-2.5 pl-0.5 text-xs font-semibold">
                      <InstrumentBadge id={s} size={22} rounded="rounded-full" />
                      {instrumentById[s].name}
                    </span>
                  ))}
                </div>
                <div className="mt-4 border-t border-line pt-4">
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-muted">Öğrenci yükü</span>
                    <span className="font-semibold tabular-nums">
                      {st.length} / {t.capacity}
                    </span>
                  </div>
                  <LevelStrip counts={[0, 1, 2, 3, 4].map((l) => st.filter((s) => s.level === l).length)} />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void removeTeacher(t.id);
                      }}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                      aria-label={`${t.name} öğretmenini sil`}
                    >
                      <Trash2 size={15} /> Sil
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      </>
      )}
    </>
  );
}
