import { useState, type ReactNode } from "react";
import { TENANT } from "@/lib/tenant";
import { BellButton, MobileTabBar } from "./Mobile";
import { Building2, Check, ChevronsLeft, ChevronsRight, ChevronDown, KeyRound, LogOut, RotateCcw, UserRoundCog } from "lucide-react";
import { ChangePasswordForm } from "@/pages/AuthPanel";
import { useStore } from "@/store/useStore";
import { NAV, ROLE_META, isActive } from "@/lib/nav";
import { navigate, usePath } from "@/lib/router";
import type { Role } from "@/data/types";
import { Avatar, Menu, MenuItem, Modal, cn } from "../ui";
import { Logo, LogoMark } from "../Logo";

export function useCurrentUser() {
  const session = useStore((s) => s.session);
  const data = useStore((s) => s.data);
  const account = useStore((s) => s.user);
  const inst = data.institutions.find((i) => i.id === session.institutionId);
  const fallback = account?.name ?? "";
  switch (session.role) {
    case "platform":
      return { name: "Elif Aydın", sub: "Platform yöneticisi" };
    case "inst":
      return { name: account?.name ?? inst?.adminName ?? "Yönetici", sub: `${inst?.short ?? ""} · Kurum yöneticisi` };
    case "teacher": {
      const t = data.teachers.find((x) => x.id === session.teacherId);
      return { name: t?.name ?? fallback, sub: t?.title ?? "Öğretmen" };
    }
    case "student": {
      const s = data.students.find((x) => x.id === session.studentId);
      return { name: s?.name ?? fallback, sub: "Öğrenci" };
    }
    default: {
      const p = data.parents.find((x) => x.id === session.parentId);
      return { name: p?.name ?? fallback, sub: "Veli" };
    }
  }
}

/** Kendi şifresini değiştirme penceresi (profil menüsü ve mobil "Daha" sayfasından açılır) */
export function PasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Şifremi değiştir" subtitle="Şifre değişince diğer cihazlardaki oturumlarınız kapanır." size="sm">
      <ChangePasswordForm onDone={onClose} />
    </Modal>
  );
}

export function ProfileMenu({ compact }: { compact?: boolean }) {
  const user = useCurrentUser();
  const logout = useStore((s) => s.logout);
  const reset = useStore((s) => s.resetDemo);
  const role = useStore((s) => s.session.role)!;
  const [pw, setPw] = useState(false);
  return (
    <>
    <PasswordModal open={pw} onClose={() => setPw(false)} />
    <Menu
      width={250}
      trigger={(open) => (
        <button className={cn("flex cursor-pointer items-center gap-2.5 rounded-xl p-1 pr-2 transition hover:bg-canvas-2/70", open && "bg-canvas-2/70")} aria-label="Profil menüsü">
          <Avatar name={user.name} size={34} />
          {!compact && (
            <span className="hidden text-left leading-tight md:block">
              <span className="block text-[13px] font-semibold text-ink">{user.name}</span>
              <span className="block text-[11px] text-muted">{ROLE_META[role].label}</span>
            </span>
          )}
          <ChevronDown size={15} className="hidden text-muted md:block" />
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="flex items-center gap-3 px-3 pt-2 pb-3">
            <Avatar name={user.name} size={38} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.sub}</p>
            </div>
          </div>
          <div className="my-1 h-px bg-line" />
          {TENANT ? (
            <MenuItem
              icon={KeyRound}
              onClick={() => {
                close();
                setPw(true);
              }}
            >
              Şifremi değiştir
            </MenuItem>
          ) : (
            <MenuItem
              icon={UserRoundCog}
              onClick={() => {
                close();
                logout();
                navigate("/");
              }}
            >
              Rol değiştir
            </MenuItem>
          )}
          {!TENANT && (
            <MenuItem
              icon={RotateCcw}
              onClick={() => {
                close();
                reset();
              }}
            >
              Demo verilerini sıfırla
            </MenuItem>
          )}
          <div className="my-1 h-px bg-line" />
          <MenuItem
            icon={LogOut}
            tone="danger"
            onClick={() => {
              close();
              logout();
              navigate("/");
            }}
          >
            Çıkış yap
          </MenuItem>
        </>
      )}
    </Menu>
    </>
  );
}

export function DemoPill({ className }: { className?: string }) {
  if (TENANT) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-dashed border-brand-200 bg-brand-50/60 px-2.5 py-1 text-[11px] font-semibold text-brand-700", className)}>
      <span className="size-1.5 animate-pulse rounded-full bg-brand-500" />
      Demo modu
    </span>
  );
}

function InstitutionSwitcher() {
  const institutions = useStore((s) => s.data.institutions);
  const current = useStore((s) => s.session.institutionId);
  const setInstitution = useStore((s) => s.setInstitution);
  const toast = useStore((s) => s.toast);
  const inst = institutions.find((i) => i.id === current)!;
  return (
    <Menu
      align="left"
      width={300}
      trigger={(open) => (
        <button className={cn("flex h-10 max-w-[min(230px,52vw)] min-w-0 cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-surface pr-2.5 pl-1.5 text-left transition hover:border-line-strong", open && "border-line-strong")}>
          <span className="grid size-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-white" style={{ background: inst.accent }}>
            {inst.short[0]}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{inst.name}</span>
          <ChevronDown size={15} className="shrink-0 text-muted" />
        </button>
      )}
    >
      {(close) => (
        <>
          <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold tracking-wide text-faint uppercase">Demo kurum seçimi</p>
          {institutions.map((i) => (
            <button
              key={i.id}
              onClick={() => {
                setInstitution(i.id);
                close();
                toast(`${i.name} paneline geçildi`, "info");
              }}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-canvas"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold text-white" style={{ background: i.accent }}>
                {i.short[0]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{i.name}</span>
                <span className="block text-[11px] text-muted">{i.city} · {i.branches.length} şube</span>
              </span>
              {i.id === current && <Check size={16} className="text-brand-600" />}
            </button>
          ))}
        </>
      )}
    </Menu>
  );
}

function SidebarNav({ role, collapsed, onNavigate }: { role: Role; collapsed: boolean; onNavigate?: () => void }) {
  const path = usePath();
  const home = ROLE_META[role].home;
  return (
    <nav className="flex flex-col gap-1" aria-label="Ana menü">
      {NAV[role].map((item) => {
        const active = isActive(path, item.path, home);
        return (
          <button
            key={item.path}
            onClick={() => {
              navigate(item.path);
              onNavigate?.();
            }}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex h-10 cursor-pointer items-center gap-3 rounded-xl text-[13.5px] font-semibold transition",
              collapsed ? "justify-center px-0" : "px-3",
              active ? "bg-brand-50 text-brand-700" : "text-ink-2 hover:bg-canvas-2/70 hover:text-ink",
            )}
          >
            <item.icon size={19} strokeWidth={active ? 2.1 : 1.8} className="shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {collapsed && (
              <span className="pointer-events-none absolute left-full z-50 ml-3 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-pop transition group-hover:opacity-100">
                {item.label}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const role = useStore((s) => s.session.role)!;
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggle = useStore((s) => s.toggleSidebar);
  const RoleIcon = ROLE_META[role].icon;

  return (
    <div className="min-h-dvh">
      {/* Masaüstü kenar çubuğu */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-surface transition-[width] duration-200 lg:flex",
          collapsed ? "w-[76px]" : "w-[248px]",
        )}
      >
        <div className={cn("flex h-16 items-center", collapsed ? "justify-center" : "px-5")}>
          <button onClick={() => navigate(ROLE_META[role].home)} className="cursor-pointer" aria-label="Ana sayfa">
            {collapsed ? <LogoMark /> : <Logo />}
          </button>
        </div>
        <div className={cn("mb-4", collapsed ? "px-3" : "px-4")}>
          <div className={cn("flex items-center gap-2.5 rounded-xl bg-canvas py-2", collapsed ? "justify-center" : "px-3")} title={ROLE_META[role].label}>
            <RoleIcon size={16} className="shrink-0 text-brand-600" />
            {!collapsed && <span className="truncate text-xs font-semibold text-ink-2">{ROLE_META[role].label}</span>}
          </div>
        </div>
        <div className={cn("flex-1", collapsed ? "overflow-visible px-3" : "scrollbar-thin overflow-y-auto px-4")}>
          <SidebarNav role={role} collapsed={collapsed} />
        </div>
        <div className={cn("border-t border-line py-3", collapsed ? "px-3" : "px-4")}>
          <button
            onClick={toggle}
            className={cn("flex h-9 w-full cursor-pointer items-center gap-3 rounded-xl text-[13px] font-medium text-muted transition hover:bg-canvas-2/70 hover:text-ink", collapsed ? "justify-center" : "px-3")}
            aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
            title={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            {!collapsed && "Menüyü daralt"}
          </button>
        </div>
      </aside>

      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[76px]" : "lg:pl-[248px]")}>
        <header className="sticky top-0 z-20 flex h-[calc(56px+env(safe-area-inset-top))] items-center gap-2 border-b border-line bg-canvas/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:gap-3 sm:px-6 lg:h-16 lg:px-8 lg:pt-0">
          <button onClick={() => navigate(ROLE_META[role].home)} className="shrink-0 cursor-pointer lg:hidden" aria-label="Ana sayfa">
            <LogoMark size={30} />
          </button>
          {role === "inst" && <InstitutionSwitcher />}
          {role === "platform" && (
            <span className="hidden items-center gap-2 text-[13px] font-medium text-muted sm:flex">
              <Building2 size={16} /> Tüm kurumlar
            </span>
          )}
          <div className="flex-1" />
          <DemoPill className="hidden sm:inline-flex" />
          <BellButton />
          <ProfileMenu />
        </header>
        <main className="mx-auto w-full max-w-[1400px] px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
      <MobileTabBar role={role} className="lg:hidden" />
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, back }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; back?: { label: string; to: string } }) {
  return (
    <div className="mb-5 lg:mb-8">
      {back && (
        <button onClick={() => navigate(back.to)} className="mb-3 inline-flex cursor-pointer items-center gap-1 text-[13px] font-semibold text-muted transition hover:text-ink">
          <ChevronsLeft size={15} /> {back.label}
        </button>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[24px] leading-tight font-bold tracking-[-0.02em] text-ink sm:text-[28px]">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
