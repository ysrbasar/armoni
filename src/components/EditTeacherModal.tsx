import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Button, Field, Input, Modal, Select, Textarea, cn } from "@/components/ui";
import { roomsOf } from "@/lib/selectors";
import { INSTRUMENTS } from "@/data/catalog";
import type { InstrumentId, Teacher } from "@/data/types";

/** Kurum yöneticisinin öğretmen bilgilerini düzenlediği pencere */
export function EditTeacherModal({ teacher, open, onClose }: { teacher: Teacher; open: boolean; onClose: () => void }) {
  const updateTeacher = useStore((s) => s.updateTeacher);
  const rooms = useStore((s) => roomsOf(s.data.institutions.find((i) => i.id === teacher.institutionId)));
  const [f, setF] = useState(() => ({ ...teacher }));
  useEffect(() => {
    if (open) setF({ ...teacher });
  }, [open, teacher]);
  const set = <K extends keyof Teacher>(k: K, v: Teacher[K]) => setF((x) => ({ ...x, [k]: v }));
  const toggle = (id: InstrumentId) => set("specialties", f.specialties.includes(id) ? f.specialties.filter((x) => x !== id) : [...f.specialties, id]);
  const valid = f.name.trim().length >= 2;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Öğretmeni düzenle"
      subtitle="Bilgiler yalnızca kurum ekranlarında görünür; telefon ve e-posta öğrencilere gösterilmez."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            icon={Save}
            disabled={!valid}
            onClick={() => {
              updateTeacher(teacher.id, {
                name: f.name.trim(),
                title: f.title.trim(),
                specialties: f.specialties,
                email: f.email.trim(),
                phone: f.phone?.trim() || undefined,
                bio: f.bio.trim(),
                experienceYears: Math.max(0, Number(f.experienceYears) || 0),
                capacity: Math.max(1, Number(f.capacity) || 1),
                room: f.room || undefined,
              });
              onClose();
            }}
          >
            Kaydet
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ad soyad" className="sm:col-span-2">
          <Input value={f.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Unvan" className="sm:col-span-2">
          <Input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="ör. Piyano Eğitmeni" />
        </Field>
        <Field label="Branşlar" className="sm:col-span-2">
          <div className="flex flex-wrap gap-2">
            {INSTRUMENTS.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => toggle(i.id)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-[13px] font-semibold transition",
                  f.specialties.includes(i.id) ? "border-brand-400 bg-brand-50 text-brand-700" : "border-line text-ink-2 hover:border-line-strong",
                )}
              >
                {i.name}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Telefon">
          <Input type="tel" value={f.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="05XX XXX XX XX" />
        </Field>
        <Field label="E-posta">
          <Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Varsayılan derslik" hint="Yeni dersler bu dersliğe yazılır" className="sm:col-span-2">
          <Select value={f.room ?? ""} onChange={(e) => set("room", e.target.value || undefined)}>
            <option value="">Seçilmedi</option>
            {rooms.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </Field>
        <Field label="Deneyim (yıl)">
          <Input type="number" min={0} value={f.experienceYears} onChange={(e) => set("experienceYears", Number(e.target.value))} />
        </Field>
        <Field label="Öğrenci kontenjanı">
          <Input type="number" min={1} value={f.capacity} onChange={(e) => set("capacity", Number(e.target.value))} />
        </Field>
        <Field label="Kısa özgeçmiş" className="sm:col-span-2">
          <Textarea rows={4} value={f.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Eğitimi, deneyimi, ders yaklaşımı" />
        </Field>
      </div>
    </Modal>
  );
}
