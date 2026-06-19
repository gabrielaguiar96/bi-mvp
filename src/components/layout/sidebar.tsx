"use client";

import { NAV_ITEMS, type SectionId } from "@/lib/nav";
import { cn } from "@/lib/utils";

type SidebarProps = {
  active: SectionId;
  onNavigate: (id: SectionId) => void;
};

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden lg:flex h-screen sticky top-0 w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background ring-1 ring-border">
          {/* Logo 463x155 — o brand mark (E azul) ocupa o terço esquerdo */}
          <img
            src="/evuli-logo.png"
            alt="Evuli"
            className="h-7 w-[21px] object-cover object-left"
          />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">Evuli BI</p>
          <p className="text-[11px] text-muted-foreground">Painel Comercial</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Seções
        </p>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-sidebar-foreground"
                    )}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {isActive && (
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-5 py-3">
        <p className="text-[11px] text-muted-foreground">
          Snapshot 2026 — até o mês corrente
        </p>
      </div>
    </aside>
  );
}
