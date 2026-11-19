import { useMemo, useState } from "react";
import { BookOpen, Check, Copy, Globe2, Landmark, Music2, Plus, Sparkles, Star, Trash2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { PageHeader } from "@/components/layout/AdminShell";
import { Badge, Button, Card, CardHeader, Field, Input, Modal, cn } from "@/components/ui";
import { InstrumentBadge } from "@/components/InstrumentIcon";
import { ALL_PIECES, ALL_SKILLS, CURRICULA, INSTRUMENTS, LEVELS, activeCurriculumOf, armoniCurriculumId, curriculumOf, instrumentById } from "@/data/catalog";
import { FAMILIES, FRAMEWORKS, INSTRUMENT_COLORS, isRecommended } from "@/data/curriculum";
import type { Curriculum, InstrumentFamily, Level, Piece, Skill } from "@/data/types";

const REGION_ICON = { Dünya: Globe2, Türkiye: Landmark, Kurum: Star } as const;
const familyName = (f?: InstrumentFamily) => FAMILIES.find((x) => x.id === f)?.name ?? "—";
const rid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/* ───────────── Program ekleme ───────────── */

function FrameworkPicker({ family, value, onChange }: { family?: InstrumentFamily; value: string; onChange: (id: string) => void }) {
  const sorted = [...FRAMEWORKS].sort((a, b) => Number(isRecommended(b, family)) - Number(isRecommended(a, family)));
  return (
    <div className="space-y-4">
      {(["Kurum", "Dünya", "Türkiye"] as const).map((region) => {
        const list = sorted.filter((f) => f.region === region);
        const Icon = REGION_ICON[region];
        return (
          <div key={region}>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wide text-faint uppercase">
              <Icon size={13} /> {region === "Kurum" ? "Sade başlangıç" : region}
            </p>
            <div className="grid gap-2">
              {list.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onChange(f.id)}
                  className={cn(
                    "cursor-pointer rounded-2xl border p-3.5 text-left transition",
                    value === f.id ? "border-brand-400 bg-brand-50/60 ring-2 ring-brand-100" : "border-line hover:border-line-strong",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-bold">{f.name}</span>
                    {isRecommended(f, family) && f.families && <Badge tone="mint">Bu aile için önerilir</Badge>}
                  </span>
                  <span className="mt-1 block text-[12.5px] leading-snug text-muted">{f.description}</span>
                  <span className="mt-2 block text-[11.5px] text-ink-2">Seviyeler: {f.levelLabels.join(" → ")}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
      <p className="text-xs text-faint">
        Bu programlar, bilinen eğitim sistemlerinin seviye yapısını ve odaklarını özetleyen şablonlardır; resmi sınav programının kopyası değildir. Eklendikten sonra her kazanım ve parça düzenlenebilir.
      </p>
    </div>
  );
}

function AddCurriculumModal({ instrumentId, open, onClose, onAdded }: { instrumentId: string; open: boolean; onClose: () => void; onAdded: (id: string) => void }) {
  const addCurriculum = useStore((s) => s.addCurriculum);
  const ins = instrumentById[instrumentId];
  const [fw, setFw] = useState("abrsm");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${ins.name} için program ekle`}
      subtitle={`Aile: ${familyName(ins.family)}. Program, ailenin teknik kazanımları ile seçilen sistemin odaklarından oluşturulur.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            icon={Plus}
            onClick={() => {
              onAdded(addCurriculum(instrumentId, fw));
              onClose();
            }}
          >
            Programı ekle
          </Button>
        </>
      }
    >
      <FrameworkPicker family={ins.family} value={fw} onChange={setFw} />
    </Modal>
  );
}

/* ───────────── Yeni enstrüman sihirbazı ───────────── */

function NewInstrumentModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const addInstrument = useStore((s) => s.addInstrument);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [family, setFamily] = useState<InstrumentFamily>("telli");
  const [color, setColor] = useState(0);
  const [fw, setFw] = useState("temel");
  const reset = () => {
    setStep(1);
    setName("");
    setFamily("telli");
    setColor(0);
    setFw("temel");
  };
  const close = () => {
    reset();
    onClose();
  };
  const exists = INSTRUMENTS.some((i) => i.name.toLocaleLowerCase("tr") === name.trim().toLocaleLowerCase("tr"));
  return (
    <Modal
      open={open}
      onClose={close}
      title="Yeni enstrüman"
      subtitle={`Adım ${step} / 2 · ${step === 1 ? "Enstrümanı tanımlayın" : "Başlangıç programını seçin"}`}
      footer={
        step === 1 ? (
          <>
            <Button variant="secondary" onClick={close}>
              Vazgeç
            </Button>
            <Button disabled={name.trim().length < 2 || exists} onClick={() => setStep(2)}>
              Devam
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setStep(1)}>
              Geri
            </Button>
            <Button
              icon={Sparkles}
              onClick={() => {
                const id = addInstrument({ name: name.trim(), family, color, frameworkId: fw });
                onCreated(id);
                close();
              }}
            >
              Enstrümanı ve programını oluştur
            </Button>
          </>
        )
      }
    >
      {step === 1 ? (
        <div className="space-y-4">
          <Field label="Enstrüman adı" error={exists ? "Bu enstrüman zaten var" : undefined}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ör. Ud, Çello, Ney, Darbuka" autoFocus />
          </Field>
          <Field label="Ailesi" hint="Teknik kazanımlar bu aileden gelir; sonradan düzenlenebilir">
            <div className="grid gap-2 sm:grid-cols-2">
              {FAMILIES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFamily(f.id)}
                  className={cn("cursor-pointer rounded-xl border p-3 text-left transition", family === f.id ? "border-brand-400 bg-brand-50/60" : "border-line hover:border-line-strong")}
                >
                  <span className="block text-[13.5px] font-bold">{f.name}</span>
                  <span className="block text-[11.5px] text-muted">{f.examples}</span>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Renk">
            <div className="flex flex-wrap gap-2">
              {INSTRUMENT_COLORS.map(([tint, tone], i) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setColor(i)}
                  className={cn("grid size-10 cursor-pointer place-items-center rounded-xl border-2 transition", color === i ? "border-ink" : "border-transparent")}
                  style={{ background: tint, color: tone }}
                  aria-label={`Renk ${i + 1}`}
                >
                  <Music2 size={18} />
                </button>
              ))}
            </div>
          </Field>
        </div>
      ) : (
        <FrameworkPicker family={family} value={fw} onChange={setFw} />
      )}
    </Modal>
  );
}

/* ───────────── Program düzenleyici ───────────── */

function SkillRow({ skill }: { skill: Skill }) {
  const saveSkill = useStore((s) => s.saveSkill);
  return (
    <div className="group flex items-start gap-2 py-1.5">
      <div className="grid min-w-0 flex-1 gap-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Input
          key={`${skill.id}-t-${skill.title}`}
          defaultValue={skill.title}
          onBlur={(e) => e.target.value.trim() && e.target.value !== skill.title && saveSkill({ ...skill, title: e.target.value.trim() })}
          className="h-9 font-semibold"
          aria-label="Kazanım adı"
        />
        <Input
          key={`${skill.id}-d-${skill.description}`}
          defaultValue={skill.description}
          onBlur={(e) => e.target.value !== skill.description && saveSkill({ ...skill, description: e.target.value })}
          className="h-9"
          placeholder="Açıklama"
          aria-label="Kazanım açıklaması"
        />
      </div>
      <button type="button" onClick={() => saveSkill({ ...skill, hidden: true })} className="mt-1 grid size-8 cursor-pointer place-items-center rounded-lg text-faint hover:bg-rose-50 hover:text-rose-600" aria-label="Kazanımı kaldır">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function PieceRow({ piece }: { piece: Piece }) {
  const savePiece = useStore((s) => s.saveCatalogPiece);
  return (
    <div className="flex items-center gap-2 py-1.5">
      <Input key={`${piece.id}-t-${piece.title}`} defaultValue={piece.title} onBlur={(e) => e.target.value.trim() && e.target.value !== piece.title && savePiece({ ...piece, title: e.target.value.trim() })} className="h-9 flex-[2] font-semibold" aria-label="Parça adı" />
      <Input key={`${piece.id}-c-${piece.composer}`} defaultValue={piece.composer} onBlur={(e) => e.target.value !== piece.composer && savePiece({ ...piece, composer: e.target.value })} className="h-9 flex-[1.5]" placeholder="Besteci" aria-label="Besteci" />
      <Input key={`${piece.id}-m-${piece.tempo}`} type="number" defaultValue={piece.tempo} onBlur={(e) => Number(e.target.value) > 0 && Number(e.target.value) !== piece.tempo && savePiece({ ...piece, tempo: Number(e.target.value) })} className="h-9 w-20" aria-label="Hedef tempo" title="Hedef tempo (BPM)" />
      <button type="button" onClick={() => savePiece({ ...piece, hidden: true })} className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-faint hover:bg-rose-50 hover:text-rose-600" aria-label="Parçayı kaldır">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function CurriculumEditor({ curriculum }: { curriculum: Curriculum }) {
  // Katalog değişince yeniden çiz
  useStore((s) => s.data.skills);
  useStore((s) => s.data.pieces);
  useStore((s) => s.data.curricula);
  const saveSkill = useStore((s) => s.saveSkill);
  const savePiece = useStore((s) => s.saveCatalogPiece);
  const updateCurriculum = useStore((s) => s.updateCurriculum);
  const mine = (x: { curriculumId?: string; instrument: string; hidden?: boolean }) => !x.hidden && x.instrument === curriculum.instrument && curriculumOf(x) === curriculum.id;
  const skills = ALL_SKILLS.filter(mine);
  const pieces = ALL_PIECES.filter(mine);
  const cidField = curriculum.id === armoniCurriculumId(curriculum.instrument) ? undefined : curriculum.id;

  return (
    <Card className="p-5">
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="Program adı">
          <Input key={`${curriculum.id}-${curriculum.name}`} defaultValue={curriculum.name} onBlur={(e) => e.target.value.trim() && e.target.value !== curriculum.name && updateCurriculum(curriculum.id, { name: e.target.value.trim() })} />
        </Field>
        <Badge tone={curriculum.region === "Türkiye" ? "rose" : curriculum.region === "Dünya" ? "sky" : "brand"}>{curriculum.region}</Badge>
      </div>
      {curriculum.description && <p className="mb-5 text-[13px] text-muted">{curriculum.description}</p>}

      <div className="space-y-5">
        {LEVELS.map((lv) => {
          const level = lv.id as Level;
          const ls = skills.filter((k) => k.stage === level);
          const lp = pieces.filter((p) => p.level === level);
          return (
            <section key={level} className="rounded-2xl border border-line p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">{lv.name}</span>
                <span className="text-xs text-muted">bu programda:</span>
                <Input
                  key={`${curriculum.id}-l${level}-${curriculum.levelLabels[level]}`}
                  defaultValue={curriculum.levelLabels[level] ?? lv.name}
                  onBlur={(e) => {
                    const labels = [...curriculum.levelLabels];
                    labels[level] = e.target.value;
                    if (e.target.value !== curriculum.levelLabels[level]) updateCurriculum(curriculum.id, { levelLabels: labels });
                  }}
                  className="h-8 w-48 text-[13px]"
                  aria-label="Seviyenin bu programdaki adı"
                />
              </div>
              <p className="mb-1 text-[12px] font-semibold text-ink-2">Kazanımlar ({ls.length})</p>
              <div>
                {ls.map((k) => (
                  <SkillRow key={k.id} skill={k} />
                ))}
              </div>
              <Button
                size="sm"
                variant="ghost"
                icon={Plus}
                onClick={() => saveSkill({ id: rid(`${curriculum.id}-k${level}x`), instrument: curriculum.instrument, stage: level, title: "Yeni kazanım", description: "", curriculumId: cidField })}
              >
                Kazanım ekle
              </Button>
              <p className="mt-3 mb-1 text-[12px] font-semibold text-ink-2">Repertuvar ({lp.length})</p>
              <div>
                {lp.map((p) => (
                  <PieceRow key={p.id} piece={p} />
                ))}
              </div>
              <Button
                size="sm"
                variant="ghost"
                icon={Plus}
                onClick={() => savePiece({ id: rid(`${curriculum.id}-p${level}x`), instrument: curriculum.instrument, level, title: "Yeni parça", composer: "", tempo: 80, curriculumId: cidField })}
              >
                Parça ekle
              </Button>
            </section>
          );
        })}
      </div>
    </Card>
  );
}

/* ───────────── Sayfa ───────────── */

export default function CurriculumPage({ teacherMode }: { teacherMode?: boolean }) {
  useStore((s) => s.data.instruments);
  // Öğretmen yalnızca kendi branşlarının programını görür ve düzenler
  const specialties = useStore((s) => s.data.teachers.find((t) => t.id === s.session.teacherId)?.specialties);
  const list = teacherMode ? INSTRUMENTS.filter((i) => specialties?.includes(i.id)) : INSTRUMENTS;
  useStore((s) => s.data.curricula);
  const setActive = useStore((s) => s.setActiveCurriculum);
  const duplicate = useStore((s) => s.duplicateCurriculum);
  const remove = useStore((s) => s.removeCurriculum);
  const [instrumentId, setInstrumentId] = useState(list[0]?.id ?? "piano");
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newIns, setNewIns] = useState(false);

  const ins = instrumentById[instrumentId];
  const programs = useMemo(() => CURRICULA.filter((c) => c.instrument === instrumentId), [instrumentId, CURRICULA.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const active = activeCurriculumOf(instrumentId);
  const current = programs.find((c) => c.id === (editing ?? active)) ?? programs[0];
  const used = useStore((s) => s.data.students.filter((x) => x.instrument === instrumentId).length);

  return (
    <>
      <PageHeader
        title="Müfredat"
        subtitle={
          teacherMode
            ? "Branşlarınızın programını seçin ve düzenleyin. Değişiklikler öğrencilerinizin kazanım ve parça listelerine yansır."
            : "Her enstrüman için programı seçin ve düzenleyin. Dünya ve Türkiye'deki yaygın sistemlerden program ekleyebilir, yeni enstrüman tanımlayabilirsiniz."
        }
        actions={
          !teacherMode && (
            <Button icon={Plus} onClick={() => setNewIns(true)}>
              Yeni enstrüman
            </Button>
          )
        }
      />
      {teacherMode && list.length === 0 && (
        <Card className="p-8 text-center text-[13.5px] text-muted">Profilinizde branş tanımlı değil. Kurum yöneticisi öğretmen bilgilerinize branş eklediğinde programlar burada görünür.</Card>
      )}

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {list.map((i) => (
          <button
            key={i.id}
            onClick={() => {
              setInstrumentId(i.id);
              setEditing(null);
            }}
            className={cn(
              "flex shrink-0 cursor-pointer items-center gap-2 rounded-2xl border py-1.5 pr-3.5 pl-1.5 text-[13px] font-semibold transition",
              instrumentId === i.id ? "border-brand-300 bg-surface shadow-card" : "border-transparent text-ink-2 hover:bg-surface",
            )}
          >
            <InstrumentBadge id={i.id} size={30} rounded="rounded-xl" />
            {i.name}
            {i.custom && <span className="text-[10px] font-bold text-brand-600">YENİ</span>}
          </button>
        ))}
      </div>

      {list.length > 0 && (
      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="p-5">
            <CardHeader title={ins.name} subtitle={`${familyName(ins.family)} · ${used} öğrenci`} icon={BookOpen} />
            <div className="space-y-2">
              {programs.map((c) => {
                const isActive = c.id === active;
                return (
                  <div
                    key={c.id}
                    className={cn("rounded-2xl border p-3.5 transition", current?.id === c.id ? "border-brand-300 bg-brand-50/40" : "border-line")}
                  >
                    <button type="button" onClick={() => setEditing(c.id)} className="block w-full cursor-pointer text-left">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[13.5px] font-bold">{c.name}</span>
                        {isActive && (
                          <Badge tone="mint" dot>
                            Aktif
                          </Badge>
                        )}
                      </span>
                      <span className="mt-1 block text-[11.5px] text-muted">{c.levelLabels.join(" · ")}</span>
                    </button>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {!isActive && (
                        <Button size="sm" variant="secondary" icon={Check} onClick={() => setActive(instrumentId, c.id)}>
                          Aktif yap
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" icon={Copy} onClick={() => setEditing(duplicate(c.id))}>
                        Kopyala
                      </Button>
                      {c.frameworkId !== "armoni" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Trash2}
                          onClick={() => {
                            if (confirm(`"${c.name}" kaldırılsın mı?`)) {
                              remove(c.id);
                              setEditing(null);
                            }
                          }}
                        >
                          Kaldır
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <Button className="mt-3 w-full" variant="soft" icon={Plus} onClick={() => setAdding(true)}>
              Dünya / Türkiye programı ekle
            </Button>
          </Card>
          <Card className="p-5 text-[12.5px] leading-relaxed text-muted">
            <p className="mb-1.5 font-semibold text-ink-2">Nasıl çalışır?</p>
            <p>Aktif program, öğretmen ve öğrenci ekranlarındaki kazanımları ve parçaları belirler. Programı değiştirmek öğrencilerin geçmiş kayıtlarını silmez.</p>
            <p className="mt-1.5">Hazır programı olduğu gibi kullanabilir ya da "Kopyala" ile kuruma özel bir sürüm oluşturup düzenleyebilirsiniz.</p>
          </Card>
        </div>

        {current && <CurriculumEditor key={current.id} curriculum={current} />}
      </div>
      )}

      <AddCurriculumModal instrumentId={instrumentId} open={adding} onClose={() => setAdding(false)} onAdded={(id) => setEditing(id)} />
      <NewInstrumentModal
        open={newIns}
        onClose={() => setNewIns(false)}
        onCreated={(id) => {
          setInstrumentId(id);
          setEditing(null);
        }}
      />
    </>
  );
}

