import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Download, Ellipsis, LogOut, RotateCcw, Share, SquarePlus, UserRoundCog, type LucideIcon } from "lucide-react";
import { useStore } from "@/store/useStore";
import { MOBILE_TABS, NAV, ROLE_META, isActive } from "@/lib/nav";
import { navigate, usePath } from "@/lib/router";
import type { Role } from "@/data/types";
import { promptInstall, useInstallState } from "@/lib/pwa";
import { checkLocalReminders, disableReminders, enableReminders, loadSettings, notificationsSupported, remindersFor, sendTest } from "@/lib/notifications";
import { fmtDateShort, relativeDay } from "@/lib/date";
import { Badge, Button, Modal, cn } from "../ui";
import { useCurrentUser } from "./AdminShell";

/** Uygulama hissi veren alt sekme çubuğu (mobil) */
export function MobileTabBar({ role, className }: { role: Role; className?: string }) {
  const path = usePath();
  const [more, setMore] = useState(false);
  const home = ROLE_META[role].home;
  const tabs = MOBILE_TABS[role].map((p) => NAV[role].find((n) => n.path === p)!).filter(Boolean);
  const rest = NAV[role].filter((n) => !MOBILE_TABS[role].includes(n.path));
  const moreActive = rest.some((n) => isActive(path, n.path, home));

  return (
    <>
      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-line/80 bg-surface/92 pt-1.5 backdrop-blur-xl short:pt-0.5",
          "pr-[max(8px,env(safe-area-inset-right))] pb-[max(8px,env(safe-area-inset-bottom))] pl-[max(8px,env(safe-area-inset-left))]",
          className,
        )}
        aria-label="Alt menü"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {tabs.map((item) => (
            <TabButton key={item.path} icon={item.icon} label={item.label} active={isActive(path, item.path, home)} onClick={() => navigate(item.path)} />
          ))}
          <TabButton icon={Ellipsis} label="Daha" active={moreActive || more} onClick={() => setMore(true)} />
        </div>
      </nav>
      <MoreSheet open={more} onClose={() => setMore(false)} role={role} />
    </>
  );
}

function TabButton({ icon: Icon, label, active, onClick }: { icon: LucideIcon; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn("flex min-w-0 cursor-pointer flex-col items-center gap-0.5 rounded-xl py-1 text-[10.5px] font-semibold transition select-none active:scale-95", active ? "text-brand-700" : "text-muted")}
    >
      <span className={cn("grid h-8 w-14 place-items-center rounded-full transition-colors", active && "bg-brand-50")}>
        <Icon size={21} strokeWidth={active ? 2.2 : 1.8} />
      </span>
      <span className="max-w-full truncate px-0.5 short:hidden">{label}</span>
    </button>
  );
}

/** "Daha" sayfası: kalan bölümler, bildirimler, uygulama kurulumu ve hesap işlemleri */
export function MoreSheet({ open, onClose, role }: { open: boolean; onClose: () => void; role: Role }) {
  const path = usePath();
  const user = useCurrentUser();
  const logout = useStore((s) => s.logout);
  const reset = useStore((s) => s.resetDemo);
  const [notif, setNotif] = useState(false);
  const [install, setInstall] = useState(false);
  const installState = useInstallState();
  const rest = NAV[role].filter((n) => !MOBILE_TABS[role].includes(n.path));
  useEffect(() => onClose(), [path]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Modal open={open} onClose={onClose} title={user.name} subtitle={ROLE_META[role].label}>
        {rest.length > 0 && (
          <div className="mb-5 grid grid-cols-3 gap-2">
            {rest.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-line p-3 text-center text-[12.5px] font-semibold text-ink-2 transition active:scale-95"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <item.icon size={20} />
                </span>
                {item.label}
              </button>
            ))}
          </div>
        )}
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
          {role !== "platform" && role !== "inst" && <SheetRow icon={Bell} label="Ders hatırlatmaları" hint="1 gün önce bildirim" onClick={() => setNotif(true)} />}
          {installState !== "installed" && <SheetRow icon={Download} label="Uygulamayı yükle" hint="Ana ekrana ekle" onClick={() => setInstall(true)} />}
          <SheetRow
            icon={UserRoundCog}
            label="Rol değiştir"
            onClick={() => {
              onClose();
              logout();
              navigate("/");
            }}
          />
          <SheetRow
            icon={RotateCcw}
            label="Demo verilerini sıfırla"
            onClick={() => {
              onClose();
              reset();
            }}
          />
          <SheetRow
            icon={LogOut}
            label="Çıkış yap"
            danger
            onClick={() => {
              onClose();
              logout();
              navigate("/");
            }}
          />
        </div>
        <p className="mt-4 text-center text-[11px] text-faint">Armoni · Demo sürümü</p>
      </Modal>
      {notif && <NotificationSheet onClose={() => setNotif(false)} />}
      {install && <InstallSheet onClose={() => setInstall(false)} />}
    </>
  );
}

function SheetRow({ icon: Icon, label, hint, onClick, danger }: { icon: LucideIcon; label: string; hint?: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={cn("flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition active:bg-canvas", danger ? "text-rose-600" : "text-ink")}>
      <Icon size={19} className={danger ? "" : "text-ink-2"} />
      <span className="flex-1 text-[14px] font-semibold">{label}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </button>
  );
}

/** Üst bardaki bildirim zili */
export function BellButton() {
  const role = useStore((s) => s.session.role);
  const [open, setOpen] = useState(false);
  const [on, setOn] = useState(() => loadSettings().enabled);
  if (role !== "student" && role !== "parent" && role !== "teacher") return null;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative grid size-9 cursor-pointer place-items-center rounded-xl text-ink-2 transition hover:bg-canvas-2 active:scale-95"
        aria-label="Ders hatırlatmaları"
        title="Ders hatırlatmaları"
      >
        {on ? <BellRing size={19} /> : <Bell size={19} />}
        {on && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-mint-500 ring-2 ring-surface" />}
      </button>
      {open && (
        <NotificationSheet
          onClose={() => {
            setOpen(false);
            setOn(loadSettings().enabled);
          }}
        />
      )}
    </>
  );
}

export function NotificationSheet({ onClose }: { onClose: () => void }) {
  const data = useStore((s) => s.data);
  const session = useStore((s) => s.session);
  const toast = useStore((s) => s.toast);
  const [settings, setSettings] = useState(loadSettings);
  const [busy, setBusy] = useState(false);
  const reminders = remindersFor(data, session);
  const supported = notificationsSupported();

  const toggle = async () => {
    setBusy(true);
    if (settings.enabled) {
      await disableReminders();
      toast("Ders hatırlatmaları kapatıldı", "info");
    } else {
      const res = await enableReminders(reminders);
      if (res.ok && res.mode === "local") checkLocalReminders(reminders);
      if (!res.ok) toast(res.error!, "error");
      else toast(res.mode === "push" ? "Hatırlatmalar açıldı · uygulama kapalıyken de gelir" : "Hatırlatmalar açıldı (yerel mod)");
    }
    setSettings(loadSettings());
    setBusy(false);
  };

  return (
    <Modal open onClose={onClose} title="Ders hatırlatmaları" subtitle="Her dersten 1 gün önce bildirim gönderilir" size="sm">
      <div className="flex items-center gap-4 rounded-2xl bg-canvas p-4">
        <span className={cn("grid size-11 place-items-center rounded-2xl", settings.enabled ? "bg-mint-500 text-white" : "bg-surface text-muted")}>
          {settings.enabled ? <BellRing size={20} /> : <BellOff size={20} />}
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">{settings.enabled ? "Açık" : "Kapalı"}</p>
          <p className="text-xs text-muted">
            {!supported
              ? "Bu tarayıcı bildirimleri desteklemiyor"
              : settings.enabled
                ? settings.mode === "push"
                  ? "Anlık bildirim (push) · uygulama kapalıyken de gelir"
                  : "Yerel mod · uygulama açıldığında gösterilir"
                : "Açmak için bildirim izni istenecek"}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={settings.enabled}
          disabled={!supported || busy}
          onClick={toggle}
          className={cn("relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition disabled:opacity-40", settings.enabled ? "bg-mint-500" : "bg-line-strong")}
          aria-label="Hatırlatmaları aç/kapat"
        >
          <span className={cn("absolute top-1 size-5 rounded-full bg-white shadow transition-all", settings.enabled ? "left-6" : "left-1")} />
        </button>
      </div>

      <p className="mt-5 mb-2 text-[13px] font-semibold text-ink-2">Planlanan hatırlatmalar</p>
      <ul className="space-y-2">
        {reminders.slice(0, 5).map((r) => {
          const passed = r.at <= new Date().toISOString();
          return (
            <li key={r.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">
                  {relativeDay(localISO(r.lessonAt))} · {r.body.split(" · ").slice(0, 2).join(" · ")}
                </span>
                <span className="block truncate text-xs text-muted">
                  Hatırlatma: {fmtDateShort(localISO(r.at))} {localTime(r.at)}
                </span>
              </span>
              <Badge tone={passed ? "neutral" : "mint"}>{passed ? "Zamanı geçti" : "Planlandı"}</Badge>
            </li>
          );
        })}
        {reminders.length === 0 && <li className="text-xs text-muted">Önümüzdeki günlerde planlı ders yok.</li>}
      </ul>
      <Button
        variant="secondary"
        className="mt-5 w-full"
        icon={Bell}
        disabled={!supported || !settings.enabled}
        onClick={async () => {
          const mode = await sendTest(reminders[0]);
          toast(mode === "push" ? "Test bildirimi sunucudan gönderildi" : "Test bildirimi gösterildi");
        }}
      >
        Test bildirimi gönder
      </Button>
      <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
        iPhone'da bildirimler yalnızca uygulama ana ekrana eklendiğinde çalışır (iOS 16.4+). Android ve masaüstü Chrome'da tarayıcıdan da çalışır.
      </p>
    </Modal>
  );
}

const localTime = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const localISO = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function InstallSheet({ onClose }: { onClose: () => void }) {
  const state = useInstallState();
  const toast = useStore((s) => s.toast);
  return (
    <Modal open onClose={onClose} title="Armoni'yi yükle" subtitle="Ana ekrandan tek dokunuşla açılır, tam ekran çalışır" size="sm">
      {state === "native" && (
        <Button
          className="w-full"
          size="lg"
          icon={Download}
          onClick={async () => {
            const r = await promptInstall();
            if (r === "accepted") toast("Armoni yüklendi");
            onClose();
          }}
        >
          Şimdi yükle
        </Button>
      )}
      {state === "ios" && (
        <ol className="space-y-3 text-[14px]">
          <li className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-canvas text-sky-600">
              <Share size={18} />
            </span>
            Safari'de alttaki <b>Paylaş</b> düğmesine dokunun
          </li>
          <li className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-canvas text-ink-2">
              <SquarePlus size={18} />
            </span>
            <b>Ana Ekrana Ekle</b>'yi seçin
          </li>
        </ol>
      )}
      {state === "installed" && <p className="text-sm">Armoni bu cihazda yüklü.</p>}
      {state === "none" && (
        <p className="text-[13.5px] leading-relaxed text-ink-2">
          Tarayıcı menüsünden (⋮) <b>Uygulamayı yükle</b> veya <b>Ana ekrana ekle</b> seçeneğini kullanın. Chrome, Edge ve Samsung Internet'te kurulum desteklenir.
        </p>
      )}
    </Modal>
  );
}
