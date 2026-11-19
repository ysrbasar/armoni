import { useState, type FormEvent, type ReactNode } from "react";
import { Check, Eye, EyeOff, KeyRound, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { useStore } from "@/store/useStore";
import { api, ApiError, passwordRules } from "@/lib/api";
import { navigate } from "@/lib/router";
import { ROLE_META } from "@/lib/nav";
import { Button, Field, Input, cn } from "@/components/ui";

const errText = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : "Beklenmeyen bir hata oluştu");

function PasswordInput({ value, onChange, placeholder, autoComplete, invalid }: { value: string; onChange: (v: string) => void; placeholder?: string; autoComplete: string; invalid?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} invalid={invalid} className="pr-11" />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-muted hover:text-ink" aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}>
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

export function RuleList({ password, username }: { password: string; username: string }) {
  return (
    <ul className="mt-2 space-y-1">
      {passwordRules(password, username).map((r) => (
        <li key={r.text} className={cn("flex items-center gap-1.5 text-xs", r.ok ? "text-mint-700" : "text-muted")}>
          <Check size={13} className={r.ok ? "opacity-100" : "opacity-30"} /> {r.text}
        </li>
      ))}
    </ul>
  );
}

function Panel({ icon: Icon, title, text, children }: { icon: typeof LogIn; title: string; text: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <Icon size={21} />
        </span>
        <div>
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          <p className="text-[13px] leading-snug text-muted">{text}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return text ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] font-medium text-rose-700">{text}</p> : null;
}

function finish(user: Parameters<ReturnType<typeof useStore.getState>["applyUser"]>[0]) {
  // Oturum açıldı: veriyi sunucudan çekip rolün ana sayfasına git
  return useStore
    .getState()
    .boot()
    .then(() => navigate(ROLE_META[user.role].home));
}

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { user } = await api.login(username, password);
      if (user.mustChange) useStore.setState({ user });
      else await finish(user);
    } catch (err) {
      setError(errText(err));
      setPassword("");
    }
    setBusy(false);
  };

  return (
    <Panel icon={LogIn} title="Giriş yapın" text="Kurumdan aldığınız kullanıcı adı ve şifreyle girin.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Kullanıcı adı">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" placeholder="ör. ece.ornek" />
        </Field>
        <Field label="Şifre">
          <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
        </Field>
        <ErrorBox text={error} />
        <Button type="submit" className="w-full" disabled={busy || !username || !password}>
          {busy ? <Loader2 size={17} className="animate-spin" /> : <LogIn size={17} />} Giriş yap
        </Button>
        <p className="text-center text-xs text-faint">Şifrenizi unuttuysanız kurum yöneticisinden yeni geçici şifre isteyin.</p>
      </form>
    </Panel>
  );
}

function SetupForm() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const rulesOk = passwordRules(password, username).every((r) => r.ok);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== again) return setError("Şifreler aynı değil");
    setBusy(true);
    setError("");
    try {
      const { user } = await api.setup({ code, name, username, password });
      await finish(user);
    } catch (err) {
      setError(errText(err));
    }
    setBusy(false);
  };

  return (
    <Panel icon={ShieldCheck} title="İlk kurulum" text="Kurum yöneticisi hesabını oluşturun. Bu ekran yalnızca bir kez açılır.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Kurulum kodu" hint="Teknik destekten aldığınız kod">
          <Input value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" autoCapitalize="none" />
        </Field>
        <Field label="Adınız soyadınız">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </Field>
        <Field label="Kullanıcı adı" hint="Harf, rakam, nokta ya da tire">
          <Input value={username} onChange={(e) => setUsername(e.target.value.toLocaleLowerCase("tr"))} autoComplete="username" autoCapitalize="none" />
        </Field>
        <Field label="Şifre">
          <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
          <RuleList password={password} username={username} />
        </Field>
        <Field label="Şifre (tekrar)">
          <PasswordInput value={again} onChange={setAgain} autoComplete="new-password" invalid={!!again && again !== password} />
        </Field>
        <ErrorBox text={error} />
        <Button type="submit" className="w-full" disabled={busy || !code || !name || !username || !rulesOk || password !== again}>
          {busy ? <Loader2 size={17} className="animate-spin" /> : <ShieldCheck size={17} />} Hesabı oluştur
        </Button>
      </form>
    </Panel>
  );
}

export function ChangePasswordForm({ onDone, forced }: { onDone?: () => void; forced?: boolean }) {
  const user = useStore((s) => s.user)!;
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const rulesOk = passwordRules(next, user.username).every((r) => r.ok);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next !== again) return setError("Yeni şifreler aynı değil");
    setBusy(true);
    setError("");
    try {
      const r = await api.password(current, next);
      if (forced) await finish(r.user);
      else {
        useStore.setState({ user: r.user });
        useStore.getState().toast("Şifreniz değiştirildi");
      }
      onDone?.();
    } catch (err) {
      setError(errText(err));
    }
    setBusy(false);
  };

  const form = (
    <form onSubmit={submit} className="space-y-4">
      <Field label={forced ? "Geçici şifre" : "Mevcut şifre"}>
        <PasswordInput value={current} onChange={setCurrent} autoComplete="current-password" />
      </Field>
      <Field label="Yeni şifre">
        <PasswordInput value={next} onChange={setNext} autoComplete="new-password" />
        <RuleList password={next} username={user.username} />
      </Field>
      <Field label="Yeni şifre (tekrar)">
        <PasswordInput value={again} onChange={setAgain} autoComplete="new-password" invalid={!!again && again !== next} />
      </Field>
      <ErrorBox text={error} />
      <Button type="submit" className="w-full" disabled={busy || !current || !rulesOk || next !== again}>
        {busy ? <Loader2 size={17} className="animate-spin" /> : <KeyRound size={17} />} Şifremi kaydet
      </Button>
      {forced && (
        <button type="button" onClick={() => useStore.getState().logout()} className="w-full cursor-pointer text-center text-xs font-semibold text-muted hover:text-ink">
          Vazgeç ve çıkış yap
        </button>
      )}
    </form>
  );

  return forced ? (
    <Panel icon={KeyRound} title={`Hoş geldiniz, ${user.name.split(" ")[0]}`} text="Devam etmeden önce geçici şifrenizi kendi belirleyeceğiniz bir şifreyle değiştirin.">
      {form}
    </Panel>
  ) : (
    form
  );
}

/** Giriş ekranının sağ tarafı: duruma göre kurulum, giriş ya da zorunlu şifre değişikliği */
export default function AuthPanel() {
  const booted = useStore((s) => s.booted);
  const user = useStore((s) => s.user);
  const setupRequired = useStore((s) => s.setupRequired);

  if (!booted)
    return (
      <div className="grid h-60 place-items-center text-muted">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (user?.mustChange) return <ChangePasswordForm forced />;
  if (setupRequired) return <SetupForm />;
  return <LoginForm />;
}
