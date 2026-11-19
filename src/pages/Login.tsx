import { useState } from "react";
import { ArrowRight, Building2, Download, GraduationCap, HeartHandshake, ShieldCheck, Smartphone, Sparkles, type LucideIcon } from "lucide-react";
import { useInstallState } from "@/lib/pwa";
import { InstallSheet } from "@/components/layout/Mobile";
import { useStore } from "@/store/useStore";
import { navigate } from "@/lib/router";
import { ROLE_META } from "@/lib/nav";
import type { Role } from "@/data/types";
import { INSTRUMENTS } from "@/data/catalog";
import { Logo } from "@/components/Logo";
import { InstrumentBadge } from "@/components/InstrumentIcon";
import { DemoPill } from "@/components/layout/AdminShell";
import { TENANT } from "@/lib/tenant";
import AuthPanel from "./AuthPanel";

const ROLES: { role: Role; title: string; text: string; persona: string; icon: LucideIcon; tint: string; tone: string }[] = [
  { role: "inst", title: "Kurum yöneticisi", text: "Öğrenciler, öğretmen atamaları, kurslar, takvim ve raporlar.", persona: "Hande Uslu · Armoni Müzik Akademisi", icon: Building2, tint: "#e3eefc", tone: "#2672bd" },
  { role: "teacher", title: "Öğretmen", text: "Dersleri işle, ödev ver, öğrenci gelişimini ve seviye geçişlerini yönet.", persona: "Deniz Kaya · Piyano ve Teori", icon: GraduationCap, tint: "#e6f6f1", tone: "#0f8a75" },
  { role: "student", title: "Öğrenci", text: "Öğrenme yolculuğu, parçalar, ödevler ve etkileşimli müzik laboratuvarı.", persona: "Ada Yıldız · Piyano", icon: Sparkles, tint: "#fdf3e1", tone: "#b97f12" },
  { role: "parent", title: "Veli", text: "Çocuğunuzun derslerini, ödevlerini ve gelişimini sade bir ekranda izleyin.", persona: "Selin Yıldız · 2 çocuk", icon: HeartHandshake, tint: "#fdeef1", tone: "#c43d62" },
];

// Kuruma özel kurulumda henüz öğretmen, öğrenci ve veli kaydı yok; yalnızca kurum yöneticisi girer
const VISIBLE_ROLES = TENANT
  ? ROLES.filter((r) => r.role === "inst").map((r) => ({ ...r, persona: TENANT!.institution.name, text: "Öğretmen ve öğrenci kayıtlarıyla kurumu kurmaya buradan başlayın." }))
  : ROLES;

function HeroVisual() {
  // Porte üzerinde yükselen bir ezgi: platformun "ilerleme" fikrinin görsel karşılığı
  const notes = [
    { x: 46, y: 70, c: "#a99df8" },
    { x: 92, y: 62, c: "#8574ee" },
    { x: 138, y: 54, c: "#8574ee" },
    { x: 184, y: 46, c: "#5b4bdb" },
    { x: 230, y: 34, c: "#5b4bdb" },
    { x: 276, y: 26, c: "#4f3fd0" },
  ];
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted">Ada'nın bu ayki yolculuğu</p>
          <p className="mt-1 text-lg font-bold tracking-tight">Gelişen seviye · %68</p>
        </div>
        <span className="rounded-full bg-mint-50 px-2.5 py-1 text-xs font-bold text-mint-700">+3 kazanım</span>
      </div>
      <svg viewBox="0 0 320 100" className="mt-5 w-full" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="0" x2="320" y1={22 + i * 14} y2={22 + i * 14} stroke="#e8e8ec" strokeWidth="1.2" />
        ))}
        <path d="M46 70 C 120 66, 200 46, 276 26" stroke="#cbc3fd" strokeWidth="1.5" fill="none" strokeDasharray="3 4" />
        {notes.map((n, i) => (
          <g key={i}>
            <line x1={n.x + 6.5} x2={n.x + 6.5} y1={n.y} y2={n.y - 26} stroke={n.c} strokeWidth="1.8" strokeLinecap="round" />
            <ellipse cx={n.x} cy={n.y} rx="7.5" ry="5.5" transform={`rotate(-20 ${n.x} ${n.y})`} fill={n.c} />
          </g>
        ))}
      </svg>
      <div className="mt-5 flex flex-wrap gap-2">
        {INSTRUMENTS.map((i) => (
          <InstrumentBadge key={i.id} id={i.id} size={36} />
        ))}
      </div>
    </div>
  );
}

export default function Login() {
  const login = useStore((s) => s.login);
  const data = useStore((s) => s.data);

  const installState = useInstallState();
  const [installing, setInstalling] = useState(false);

  const enter = (role: Role) => {
    login(role);
    navigate(ROLE_META[role].home);
  };

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* Yumuşak arka plan dokusu */}
      <div className="pointer-events-none absolute -top-40 -left-40 size-[520px] rounded-full bg-brand-100/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 size-[460px] rounded-full bg-mint-100/50 blur-3xl" />

      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between">
          <Logo />
          {TENANT ? <span className="truncate text-[13px] font-semibold text-ink-2">{TENANT.institution.name}</span> : <DemoPill />}
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:py-12">
          <section className="animate-slide-up">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-ink-2 ring-1 ring-line">
              <ShieldCheck size={14} className="text-mint-600" /> Müzik okulları ve sanat merkezleri için
            </p>
            <h1 className="text-[34px] leading-[1.05] font-extrabold tracking-[-0.035em] text-ink sm:text-5xl lg:text-[54px]">
              Her öğrencinin
              <br />
              müzik yolculuğu,
              <br />
              <span className="text-brand-600">tek bir sahnede.</span>
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
              Armoni; ders programından ödev takibine, öğretmen eşleştirmesinden etkileşimli müzik laboratuvarına kadar kurumunuzun tüm eğitim akışını
              bir araya getirir.
            </p>
            <div className={`mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm ${TENANT ? "hidden" : ""}`}>
              {[
                [data.institutions.length, "kurum"],
                [data.teachers.length, "öğretmen"],
                [data.students.length, "öğrenci"],
                [8, "branş"],
              ].map(([n, l]) => (
                <span key={l} className="text-muted">
                  <b className="text-base font-bold text-ink tabular-nums">{n}</b> {l}
                </span>
              ))}
            </div>
            <div className="mt-8 hidden max-w-md lg:block">
              <HeroVisual />
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "60ms" }}>
            {TENANT && <AuthPanel />}
            <div className={`mb-4 flex items-end justify-between ${TENANT ? "hidden" : ""}`}>
              <div>
                <h2 className="text-lg font-bold tracking-tight">Demo rolünü seçin</h2>
                <p className="text-[13px] text-muted">Şifre gerekmez. Her rol kendi çalışma alanını açar.</p>
              </div>
            </div>
            <div className={`grid gap-3 sm:grid-cols-2 ${TENANT ? "hidden" : ""}`}>
              {VISIBLE_ROLES.map((r) => (
                <button
                  key={r.role}
                  onClick={() => enter(r.role)}
                  className="group relative flex cursor-pointer flex-row items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift focus-visible:border-brand-300 active:scale-[0.99] sm:flex-col sm:items-stretch sm:gap-0 sm:p-5"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl" style={{ background: r.tint, color: r.tone }}>
                    <r.icon size={22} strokeWidth={1.8} />
                  </span>
                  <span className="block min-w-0 flex-1 sm:mt-4">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[15px] font-bold tracking-tight text-ink">{r.title}</span>
                      <ArrowRight size={17} className="shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                    </span>
                    <span className="mt-1 block text-[13px] leading-snug text-muted">{r.text}</span>
                    <span className="mt-2 block truncate text-[11.5px] font-semibold text-ink-2 sm:mt-3">{r.persona}</span>
                  </span>
                </button>
              ))}
            </div>
            {installState !== "installed" && (
              <button
                onClick={() => setInstalling(true)}
                className="mt-4 flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-4 text-left transition hover:bg-brand-50"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
                  <Smartphone size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold text-brand-800">Uygulamayı telefona yükle</span>
                  <span className="block text-xs text-muted">Ana ekrandan açılır, ders hatırlatmalarını bildirim olarak alırsınız</span>
                </span>
                <Download size={18} className="text-brand-600" />
              </button>
            )}
          </section>
        </div>
        {installing && <InstallSheet onClose={() => setInstalling(false)} />}

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-5 text-xs text-faint">
          {TENANT ? (
            <span>© 2026 {TENANT.institution.name} · Armoni altyapısıyla</span>
          ) : (
            <>
              <span>© 2026 Armoni · Demo sürümü. Veriler örnektir ve tarayıcınızda saklanır.</span>
              <span>İzmir · Alsancak · Karşıyaka · Bornova · Buca · Göztepe · Bostanlı</span>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
