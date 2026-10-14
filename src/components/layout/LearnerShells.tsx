import type { ReactNode } from "react";
import { Flame } from "lucide-react";
import { useStore } from "@/store/useStore";
import { NAV, ROLE_META, isActive } from "@/lib/nav";
import { navigate, usePath } from "@/lib/router";
import { instrumentById } from "@/data/catalog";
import { Avatar, cn } from "../ui";
import { Logo } from "../Logo";
import { DemoPill, ProfileMenu } from "./AdminShell";
import { BellButton, MobileTabBar } from "./Mobile";

/** Öğrenci: yönetim paneli hissi vermeyen, üstte sekmeli, mobilde alt çubuklu uygulama */
export function StudentShell({ children }: { children: ReactNode }) {
  const path = usePath();
  const sid = useStore((s) => s.session.studentId);
  const student = useStore((s) => s.data.students.find((x) => x.id === sid))!;
  const nav = NAV.student;
  return (
    <div className="min-h-dvh pb-28 md:pb-10">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6 md:h-16 short:h-12">
          <button onClick={() => navigate("/student")} className="cursor-pointer" aria-label="Ana sayfa">
            <Logo />
          </button>
          <nav className="mx-auto hidden items-center gap-1 rounded-2xl bg-surface p-1 shadow-card ring-1 ring-line md:flex" aria-label="Öğrenci menüsü">
            {nav.map((item) => {
              const active = isActive(path, item.path, ROLE_META.student.home);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-9 cursor-pointer items-center gap-2 rounded-xl px-3.5 text-[13px] font-semibold transition",
                    active ? "bg-ink text-white" : "text-ink-2 hover:bg-canvas",
                  )}
                >
                  <item.icon size={16} strokeWidth={2} />
                  <span className="hidden lg:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-sun-50 px-3 text-[13px] font-bold text-sun-700" title="Çalışma serisi">
              <Flame size={16} strokeWidth={2.2} /> {student.streak}
            </span>
            <BellButton />
            <ProfileMenu compact />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:py-8 short:py-2">{children}</main>

      <MobileTabBar role="student" className="md:hidden" />
    </div>
  );
}

/** Veli: sade, güven veren, tek sütun ağırlıklı */
export function ParentShell({ children }: { children: ReactNode }) {
  const path = usePath();
  const session = useStore((s) => s.session);
  const data = useStore((s) => s.data);
  const setChild = useStore((s) => s.setChild);
  const parent = data.parents.find((p) => p.id === session.parentId)!;
  const children_ = parent.childIds.map((id) => data.students.find((s) => s.id === id)!).filter(Boolean);

  return (
    <div className="min-h-dvh pb-28 md:pb-10">
      <header className="border-b border-line bg-surface pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6 md:h-16">
          <button onClick={() => navigate("/parent")} className="cursor-pointer" aria-label="Ana sayfa">
            <Logo />
          </button>
          <span className="hidden rounded-full bg-mint-50 px-2.5 py-1 text-[11px] font-semibold text-mint-700 sm:inline">Veli paneli</span>
          <div className="flex-1" />
          <DemoPill className="hidden sm:inline-flex" />
          <BellButton />
          <ProfileMenu />
        </div>
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-3 md:pb-4">
            <span className="mr-1 text-xs font-semibold text-muted">Çocuğum:</span>
            {children_.map((c) => {
              const active = c.id === session.childId;
              return (
                <button
                  key={c.id}
                  onClick={() => setChild(c.id)}
                  className={cn(
                    "flex shrink-0 cursor-pointer items-center gap-2 rounded-full border py-1 pr-3.5 pl-1 text-[13px] font-semibold transition",
                    active ? "border-brand-200 bg-brand-50 text-brand-800" : "border-line bg-surface text-ink-2 hover:border-line-strong",
                  )}
                  aria-pressed={active}
                >
                  <Avatar name={c.name} size={28} />
                  {c.name.split(" ")[0]}
                  <span className="text-[11px] font-medium text-muted">· {instrumentById[c.instrument].name}</span>
                </button>
              );
            })}
          </div>
          <nav className="no-scrollbar -mb-px hidden gap-6 overflow-x-auto md:flex" aria-label="Veli menüsü">
            {NAV.parent.map((item) => {
              const active = isActive(path, item.path, ROLE_META.parent.home);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex shrink-0 cursor-pointer items-center gap-2 border-b-2 pb-3 text-[13.5px] font-semibold transition",
                    active ? "border-brand-600 text-ink" : "border-transparent text-muted hover:text-ink",
                  )}
                >
                  <item.icon size={16} /> {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 lg:py-8">{children}</main>
      <MobileTabBar role="parent" className="md:hidden" />
    </div>
  );
}
