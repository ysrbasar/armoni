import { ageText } from "@/lib/selectors";
import { useCallback, useEffect, useState } from "react";
import { Check, Copy, GraduationCap, HeartHandshake, KeyRound, Plus, RotateCcw, Trash2, UserPlus, UsersRound } from "lucide-react";
import { flushSync, useStore } from "@/store/useStore";
import { api, suggestUsername, type Account, type AppUser } from "@/lib/api";
import { TENANT } from "@/lib/tenant";
import { PageHeader } from "@/components/layout/AdminShell";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Field, Input, Modal } from "@/components/ui";
import { INSTRUMENTS, instrumentById } from "@/data/catalog";
import type { InstrumentId } from "@/data/types";

const ROLE_LABEL: Record<AppUser["role"], string> = { inst: "Kurum yöneticisi", teacher: "Öğretmen", student: "Öğrenci", parent: "Veli" };

/* ───────────── Öğretmen ekleme ───────────── */

export function AddTeacherModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addTeacher = useStore((s) => s.addTeacher);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [specialties, setSpecialties] = useState<InstrumentId[]>([]);
  const toggle = (id: InstrumentId) => setSpecialties((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const valid = name.trim().split(/\s+/).length >= 2 && specialties.length > 0;
  const save = () => {
    addTeacher({
      name: name.trim(),
      title: title.trim() || `${specialties.map((s) => instrumentById[s].name).join(" ve ")} Eğitmeni`,
      email: email.trim(),
      specialties,
    });
    setName("");
    setTitle("");
    setEmail("");
    setSpecialties([]);
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yeni öğretmen"
      subtitle="Öğretmen eklendikten sonra Giriş hesapları sayfasından hesabını açabilirsiniz."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button onClick={save} disabled={!valid} icon={Plus}>
            Öğretmeni ekle
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Ad soyad" error={name && name.trim().split(/\s+/).length < 2 ? "Ad ve soyadı birlikte yazın" : undefined}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Branşlar">
          <div className="flex flex-wrap gap-2">
            {INSTRUMENTS.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => toggle(i.id)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-[13px] font-semibold transition ${specialties.includes(i.id) ? "border-brand-400 bg-brand-50 text-brand-700" : "border-line text-ink-2 hover:border-line-strong"}`}
              >
                {i.name}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Unvan" hint="Boş bırakılırsa branştan oluşturulur">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ör. Piyano Eğitmeni" />
        </Field>
        <Field label="E-posta" hint="İsteğe bağlı; yalnızca kurum görür">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

/* ───────────── Geçici şifre gösterimi ───────────── */

function CredentialsModal({ info, onClose }: { info: { name: string; username: string; password: string; role: AppUser["role"] } | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  if (!info) return null;
  const site = location.origin;
  const message = `Merhaba ${info.name}, ${TENANT?.institution.name ?? "Armoni"} paneli için giriş bilgileriniz:

🔗 ${site}
👤 Kullanıcı adı: ${info.username}
🔑 Geçici şifre: ${info.password}

İlk girişte kendi şifrenizi belirlemeniz istenecek. Geçici şifreyi kimseyle paylaşmayın.`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* pano izni yoksa metin elle seçilebilir */
    }
  };
  return (
    <Modal open onClose={onClose} title="Giriş bilgileri hazır" subtitle={`${info.name} · ${ROLE_LABEL[info.role]}`} size="sm" footer={<Button onClick={onClose}>Tamam</Button>}>
      <div className="space-y-4">
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-2xl bg-canvas p-4 text-sm">
          <span className="text-muted">Kullanıcı adı</span>
          <b className="font-mono select-all">{info.username}</b>
          <span className="text-muted">Geçici şifre</span>
          <b className="font-mono text-base select-all">{info.password}</b>
        </div>
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
          Geçici şifre yalnızca şimdi görünür; pencereyi kapatınca bir daha gösterilmez. Kişiye birebir iletin, grup mesajı ya da ekran görüntüsüyle paylaşmayın.
        </p>
        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-ink-2">Gönderilecek mesaj</p>
          <pre className="max-h-48 overflow-auto rounded-xl border border-line p-3 font-sans text-[13px] whitespace-pre-wrap select-all">{message}</pre>
          <Button variant="secondary" size="sm" className="mt-2" icon={copied ? Check : Copy} onClick={copy}>
            {copied ? "Kopyalandı" : "Mesajı kopyala"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ───────────── Hesap açma ───────────── */

function CreateAccountModal({
  target,
  taken,
  onClose,
  onCreated,
}: {
  target: { role: AppUser["role"]; entityId: string; name: string } | null;
  taken: Set<string>;
  onClose: () => void;
  onCreated: (username: string, password: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const students = useStore((s) => s.data.students);
  useEffect(() => {
    if (!target) return;
    // Öğrencinin TC si kayıtlıysa kullanıcı adı odur (kılavuzdaki düzen)
    const tc = target.role === "student" ? students.find((x) => x.id === target.entityId)?.tc : undefined;
    if (tc && !taken.has(tc)) {
      setUsername(tc);
      setError("");
      return;
    }
    let base = suggestUsername(target.name) || "kullanici";
    if (base.length < 3) base = `${base}.sm`;
    let u = base;
    for (let i = 2; taken.has(u); i++) u = `${base}${i}`;
    setUsername(u);
    setError("");
  }, [target, taken, students]);
  if (!target) return null;
  const create = async () => {
    setBusy(true);
    setError("");
    try {
      await flushSync(); // yeni eklenen kayıt sunucuda olsun
      const r = await api.createAccount({ role: target.role, entityId: target.entityId, username, name: target.name });
      onCreated(r.account.username, r.tempPassword);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hesap açılamadı");
    }
    setBusy(false);
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="Giriş hesabı aç"
      subtitle={`${target.name} · ${ROLE_LABEL[target.role]}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button onClick={create} disabled={busy || username.length < 3} icon={KeyRound}>
            Hesabı aç
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Kullanıcı adı" error={error} hint="Harf, rakam, nokta, tire ya da 11 haneli TC. Kişi girişte bunu yazacak.">
          <Input value={username} onChange={(e) => setUsername(e.target.value.toLocaleLowerCase("tr").replace(/\s/g, ""))} autoCapitalize="none" />
        </Field>
        <p className="text-[13px] text-muted">Sistem rastgele bir geçici şifre üretir. Kişi ilk girişte kendi şifresini belirler; kurum o şifreyi göremez.</p>
      </div>
    </Modal>
  );
}

function AddParentModal({ studentId, onClose }: { studentId: string | null; onClose: () => void }) {
  const addParent = useStore((s) => s.addParent);
  const student = useStore((s) => s.data.students.find((x) => x.id === studentId));
  const [name, setName] = useState("");
  if (!studentId || !student) return null;
  const valid = name.trim().split(/\s+/).length >= 2;
  return (
    <Modal
      open
      onClose={onClose}
      title="Veli ekle"
      subtitle={`${student.name} öğrencisinin velisi`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            disabled={!valid}
            icon={Plus}
            onClick={() => {
              addParent(studentId, name.trim());
              setName("");
              onClose();
            }}
          >
            Veliyi ekle
          </Button>
        </>
      }
    >
      <Field label="Veli adı soyadı">
        <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
    </Modal>
  );
}

/* ───────────── Sayfa ───────────── */

function StatusBadge({ acc }: { acc?: Account }) {
  if (!acc) return <Badge>Hesap yok</Badge>;
  if (acc.mustChange) return <Badge tone="sun">İlk giriş bekleniyor</Badge>;
  return <Badge tone="mint">Aktif</Badge>;
}

export default function Accounts() {
  const data = useStore((s) => s.data);
  const me = useStore((s) => s.user);
  const toast = useStore((s) => s.toast);
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [creating, setCreating] = useState<{ role: AppUser["role"]; entityId: string; name: string } | null>(null);
  const [creds, setCreds] = useState<{ name: string; username: string; password: string; role: AppUser["role"] } | null>(null);
  const [parentFor, setParentFor] = useState<string | null>(null);
  const [addingTeacher, setAddingTeacher] = useState(false);

  const load = useCallback(() => {
    api
      .accounts()
      .then((r) => setAccounts(r.accounts))
      .catch((e) => toast(e.message, "error"));
  }, [toast]);
  useEffect(load, [load]);

  const accFor = (role: AppUser["role"], entityId: string) => accounts?.find((a) => a.role === role && a.entityId === entityId);
  const taken = new Set((accounts ?? []).map((a) => a.username));

  const reset = async (acc: Account) => {
    if (!confirm(`${acc.name} için yeni geçici şifre üretilsin mi? Kişinin şu anki şifresi geçersiz olur ve açık oturumları kapanır.`)) return;
    try {
      const r = await api.resetAccount(acc.id);
      setCreds({ name: acc.name, username: acc.username, password: r.tempPassword, role: acc.role });
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Sıfırlanamadı", "error");
    }
  };
  const remove = async (acc: Account) => {
    if (!confirm(`${acc.name} (${acc.username}) hesabı silinsin mi? Kişi artık giriş yapamaz; kayıtları silinmez.`)) return;
    try {
      await api.deleteAccount(acc.id);
      toast("Hesap silindi", "info");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Silinemedi", "error");
    }
  };

  const Row = ({ role, entityId, name, sub, extra }: { role: AppUser["role"]; entityId: string; name: string; sub?: string; extra?: React.ReactNode }) => {
    const acc = accFor(role, entityId);
    return (
      <div className="flex flex-wrap items-center gap-3 py-3">
        <Avatar name={name} size={38} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold">{name}</p>
          <p className="truncate text-xs text-muted">
            {acc ? <span className="font-mono">{acc.username}</span> : sub}
            {acc?.lastLogin && !acc.mustChange && ` · son giriş ${new Date(acc.lastLogin).toLocaleDateString("tr-TR")}`}
          </p>
        </div>
        <StatusBadge acc={acc} />
        {extra}
        {accounts &&
          (acc ? (
            <div className="flex gap-1.5">
              <Button size="sm" variant="secondary" icon={RotateCcw} onClick={() => reset(acc)}>
                Şifre sıfırla
              </Button>
              <Button size="sm" variant="ghost" icon={Trash2} onClick={() => remove(acc)} aria-label="Hesabı sil" />
            </div>
          ) : (
            <Button size="sm" icon={KeyRound} onClick={() => setCreating({ role, entityId, name })}>
              Hesap aç
            </Button>
          ))}
      </div>
    );
  };

  const admins = (accounts ?? []).filter((a) => a.role === "inst");

  return (
    <>
      <PageHeader
        title="Giriş hesapları"
        subtitle="Öğretmen, öğrenci ve velilerin sisteme girişi. Herkes yalnızca kendi bilgilerini görür."
        actions={
          <Button icon={UserPlus} onClick={() => setAddingTeacher(true)}>
            Öğretmen ekle
          </Button>
        }
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <CardHeader title="Öğretmenler" subtitle="Kendi öğrencilerini, derslerini ve ödevlerini görür" icon={UsersRound} />
          {data.teachers.length === 0 ? (
            <EmptyState icon={UsersRound} title="Henüz öğretmen yok" text="Önce öğretmen ekleyin, sonra hesabını açın." action={<Button icon={UserPlus} onClick={() => setAddingTeacher(true)}>Öğretmen ekle</Button>} />
          ) : (
            <div className="divide-y divide-line">
              {data.teachers.map((t) => (
                <Row key={t.id} role="teacher" entityId={t.id} name={t.name} sub={t.title} />
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <CardHeader title="Öğrenciler ve veliler" subtitle="Öğrenci kendi panelini, veli çocuğunun gelişimini ve ödemelerini görür" icon={GraduationCap} />
          {data.students.length === 0 ? (
            <EmptyState icon={GraduationCap} title="Henüz öğrenci yok" text="Öğrenciler sayfasından öğrenci ekleyin." />
          ) : (
            <div className="divide-y divide-line">
              {data.students.map((s) => {
                const parent = data.parents.find((p) => p.id === s.parentId);
                return (
                  <div key={s.id} className="py-1">
                    <Row role="student" entityId={s.id} name={s.name} sub={`${instrumentById[s.instrument]?.name ?? ""} · ${ageText(s)}`} />
                    {parent ? (
                      <div className="ml-6 border-l-2 border-line pl-4">
                        <Row role="parent" entityId={parent.id} name={parent.name} sub="Veli" />
                      </div>
                    ) : (
                      <div className="mb-2 ml-6 border-l-2 border-line pl-4">
                        <Button size="sm" variant="ghost" icon={HeartHandshake} onClick={() => setParentFor(s.id)}>
                          Veli ekle
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5 xl:col-span-2">
          <CardHeader title="Kurum yöneticileri" subtitle="Tüm kayıtları görür ve hesapları yönetir" icon={KeyRound} />
          <div className="divide-y divide-line">
            {admins.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-3">
                <Avatar name={a.name} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">
                    {a.name} {a.id === me?.id && <span className="text-xs font-medium text-muted">(siz)</span>}
                  </p>
                  <p className="font-mono text-xs text-muted">{a.username}</p>
                </div>
                {a.id !== me?.id && (
                  <Button size="sm" variant="ghost" icon={Trash2} onClick={() => remove(a)} aria-label="Hesabı sil" />
                )}
              </div>
            ))}
          </div>
          <SecondAdmin taken={taken} onCreated={(name, username, password) => (setCreds({ name, username, password, role: "inst" }), load())} />
        </Card>
      </div>

      <AddTeacherModal open={addingTeacher} onClose={() => setAddingTeacher(false)} />
      <AddParentModal studentId={parentFor} onClose={() => setParentFor(null)} />
      <CreateAccountModal
        target={creating}
        taken={taken}
        onClose={() => setCreating(null)}
        onCreated={(username, password) => {
          setCreds({ name: creating!.name, username, password, role: creating!.role });
          setCreating(null);
          load();
        }}
      />
      <CredentialsModal info={creds} onClose={() => setCreds(null)} />
    </>
  );
}

function SecondAdmin({ taken, onCreated }: { taken: Set<string>; onCreated: (name: string, username: string, password: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const create = async () => {
    setError("");
    try {
      const r = await api.createAccount({ role: "inst", entityId: "", username, name: name.trim() });
      onCreated(name.trim(), r.account.username, r.tempPassword);
      setOpen(false);
      setName("");
      setUsername("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hesap açılamadı");
    }
  };
  return (
    <>
      <Button size="sm" variant="ghost" icon={Plus} className="mt-2" onClick={() => setOpen(true)}>
        Yönetici ekle
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Yeni kurum yöneticisi"
        subtitle="Bu kişi tüm kayıtları görür ve hesap açabilir."
        size="sm"
        footer={
          <Button onClick={create} disabled={name.trim().length < 3 || username.length < 3 || taken.has(username)} icon={KeyRound}>
            Hesabı aç
          </Button>
        }
      >
        <div className="space-y-4">
          <Field label="Ad soyad">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setUsername(suggestUsername(e.target.value));
              }}
            />
          </Field>
          <Field label="Kullanıcı adı" error={error || (taken.has(username) ? "Bu kullanıcı adı kullanılıyor" : undefined)}>
            <Input value={username} onChange={(e) => setUsername(e.target.value.toLocaleLowerCase("tr"))} autoCapitalize="none" />
          </Field>
        </div>
      </Modal>
    </>
  );
}

