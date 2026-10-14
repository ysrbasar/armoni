import { useState } from "react";
import { Building2, CalendarDays, GraduationCap, MapPin, Music2, UsersRound } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/layout/AdminShell";
import { Avatar, Badge, Button, Card, CardHeader, Field, Input, Tabs } from "@/components/ui";
import { InstrumentBadge } from "@/components/InstrumentIcon";
import { instrumentById } from "@/data/catalog";
import { instStudents, instTeachers } from "@/lib/selectors";
import { navigate } from "@/lib/router";
import { DAYS } from "@/lib/date";

type Section = "branches" | "courses" | "teachers" | "students" | "schedule";

export default function Settings() {
  const data = useStore((s) => s.data);
  const instId = useStore((s) => s.session.institutionId);
  const toast = useStore((s) => s.toast);
  const inst = data.institutions.find((i) => i.id === instId)!;
  const [section, setSection] = useState<Section>("branches");
  const [hours, setHours] = useState({ open: "10:00", close: "21:00", slot: "45" });
  const [days, setDays] = useState([true, true, true, true, true, true, false]);

  return (
    <>
      <PageHeader title="Kurum ayarları" subtitle={`${inst.name} · ${inst.plan} plan`} />
      <Tabs
        value={section}
        onChange={setSection}
        className="mb-5"
        tabs={[
          { id: "branches", label: "Şubeler", icon: MapPin },
          { id: "courses", label: "Kurslar", icon: Music2 },
          { id: "teachers", label: "Öğretmenler", icon: UsersRound },
          { id: "students", label: "Öğrenciler", icon: GraduationCap },
          { id: "schedule", label: "Ders programı", icon: CalendarDays },
        ]}
      />

      {section === "branches" && (
        <div className="grid gap-4 md:grid-cols-2">
          {inst.branches.map((b) => (
            <Card key={b.id} className="p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-canvas text-ink-2">
                  <Building2 size={18} />
                </span>
                <div className="flex-1">
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-[13px] text-muted">{b.address}</p>
                </div>
                <Badge tone="mint" dot>
                  Aktif
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4 text-center">
                <div>
                  <p className="text-lg font-bold">{b.rooms}</p>
                  <p className="text-[11px] text-muted">Derslik</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{instStudents(data, instId).filter((s) => s.branchId === b.id).length}</p>
                  <p className="text-[11px] text-muted">Öğrenci</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{inst.courseIds.length}</p>
                  <p className="text-[11px] text-muted">Kurs</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {section === "courses" && (
        <Card className="divide-y divide-line">
          {inst.courseIds.map((c) => (
            <div key={c} className="flex items-center gap-4 p-4">
              <InstrumentBadge id={c} size={42} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{instrumentById[c].name}</p>
                <p className="text-xs text-muted">5 seviye · bireysel ders · 45 dk</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigate(`/inst/courses/${c}`)}>
                Detay
              </Button>
            </div>
          ))}
        </Card>
      )}

      {section === "teachers" && (
        <Card className="divide-y divide-line">
          {instTeachers(data, instId).map((t) => (
            <div key={t.id} className="flex items-center gap-4 p-4">
              <Avatar name={t.name} size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="truncate text-xs text-muted">{t.email}</p>
              </div>
              <span className="hidden text-xs text-muted sm:block">Kapasite {t.capacity}</span>
              <Button size="sm" variant="secondary" onClick={() => navigate(`/inst/teachers/${t.id}`)}>
                Profil
              </Button>
            </div>
          ))}
        </Card>
      )}

      {section === "students" && (
        <Card className="p-6">
          <CardHeader title="Kayıt kuralları" className="px-0 pt-0" />
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Minimum yaş">
              <Input type="number" defaultValue={6} />
            </Field>
            <Field label="Öğretmen başı varsayılan kapasite">
              <Input type="number" defaultValue={7} />
            </Field>
            <Field label="Deneme dersi süresi (dk)">
              <Input type="number" defaultValue={30} />
            </Field>
          </div>
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-canvas p-4">
            <p className="text-[13px] text-ink-2">
              Toplam <b>{instStudents(data, instId).length}</b> aktif öğrenci
            </p>
            <Button size="sm" variant="secondary" onClick={() => navigate("/inst/students")}>
              Öğrenci listesi
            </Button>
          </div>
          <div className="mt-5 flex justify-end">
            <Button onClick={() => toast("Kayıt kuralları kaydedildi")}>Kaydet</Button>
          </div>
        </Card>
      )}

      {section === "schedule" && (
        <Card className="p-6">
          <CardHeader title="Çalışma saatleri ve ders şablonu" className="px-0 pt-0" />
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Açılış">
              <Input type="time" value={hours.open} onChange={(e) => setHours({ ...hours, open: e.target.value })} />
            </Field>
            <Field label="Kapanış">
              <Input type="time" value={hours.close} onChange={(e) => setHours({ ...hours, close: e.target.value })} />
            </Field>
            <Field label="Varsayılan ders süresi (dk)">
              <Input type="number" value={hours.slot} onChange={(e) => setHours({ ...hours, slot: e.target.value })} />
            </Field>
          </div>
          <p className="mt-5 mb-2 text-[13px] font-semibold text-ink-2">Ders günleri</p>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d, i) => (
              <button
                key={d}
                onClick={() => setDays(days.map((v, j) => (j === i ? !v : v)))}
                className={`h-9 cursor-pointer rounded-xl border px-3.5 text-[13px] font-semibold transition ${days[i] ? "border-brand-300 bg-brand-50 text-brand-700" : "border-line text-muted"}`}
                aria-pressed={days[i]}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => navigate("/inst/calendar")}>
              Takvime git
            </Button>
            <Button
              onClick={() => {
                if (hours.open >= hours.close) return toast("Kapanış saati açılıştan sonra olmalı", "error");
                toast("Ders programı ayarları kaydedildi");
              }}
            >
              Kaydet
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
