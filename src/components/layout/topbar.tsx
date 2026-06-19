"use client";

import { Menu, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFilters, type FilterState } from "@/lib/filters";
import { NAV_ITEMS, type NavItem, type SectionId } from "@/lib/nav";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FilterStatus } from "./filter-status";
import { useState } from "react";
import { cn } from "@/lib/utils";

type TopbarProps = {
  active: SectionId;
  onNavigate: (id: SectionId) => void;
};

export function Topbar({ active, onNavigate }: TopbarProps) {
  const { filters, setFilters, resetFilters, options } = useFilters();
  const [mobileOpen, setMobileOpen] = useState(false);

  const current = NAV_ITEMS.find((n) => n.id === active);
  if (!current) return null;

  const hasActiveFilter =
    filters.canal !== "Todos" || filters.servico !== "Todos" || filters.mes !== "Todos" || filters.ano !== "Todos";

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
    <header className="flex h-16 items-center gap-3 px-4 md:px-6">
      {/* Mobile nav trigger */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="px-5 py-4 border-b">
            <SheetTitle className="text-left">Evuli BI</SheetTitle>
          </SheetHeader>
          <nav className="p-3">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item: NavItem) => {
                const Icon = item.icon;
                const isActive = active === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate(item.id);
                        setMobileOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/60"
                      )}
                    >
                      <Icon className="size-4" />
                      <span className="flex-1 truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Title */}
      <div className="min-w-0 flex-1 lg:flex-none">
        <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">
          {current.label}
        </h1>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">
          {current.subtitle}
        </p>
      </div>

      {/* Filters */}
      <div className="ml-auto hidden items-center gap-2 md:flex">
        <FilterSelect
          label="Canal"
          value={filters.canal}
          onChange={(v) => setFilters({ canal: v as FilterState["canal"] })}
          items={[{ value: "Todos", label: "Todos" }, ...options.canais.map((c) => ({ value: c, label: c }))]}
        />
        <FilterSelect
          label="Serviço"
          value={filters.servico}
          onChange={(v) => setFilters({ servico: v as FilterState["servico"] })}
          items={[{ value: "Todos", label: "Todos" }, ...options.servicos.map((s) => ({ value: s, label: s }))]}
        />
        <FilterSelect
          label="Ano"
          value={filters.ano}
          onChange={(v) => {
            const newAno = v as FilterState["ano"];
            // Reset month if the selected month doesn't exist in the new year
            if (newAno === "2026" && filters.mes !== "Todos") {
              const availableMonths2026 = ["janeiro", "fevereiro", "março", "abril", "maio", "junho"];
              if (!availableMonths2026.includes(filters.mes)) {
                setFilters({ ano: newAno, mes: "Todos" });
                return;
              }
            }
            setFilters({ ano: newAno });
          }}
          items={[
            { value: "Todos", label: "Todos" },
            ...options.anos.map((a) => ({ value: String(a), label: String(a) })),
          ]}
        />
        <FilterSelect
          label="Mês"
          value={filters.mes}
          onChange={(v) => setFilters({ mes: v as FilterState["mes"] })}
          items={[
            { value: "Todos", label: "Todos" },
            ...options.meses
              .filter((m) => {
                // 2026 only has data through June
                if (filters.ano === "2026") {
                  const months2026 = ["janeiro", "fevereiro", "março", "abril", "maio", "junho"];
                  return months2026.includes(m);
                }
                return true;
              })
              .map((m) => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) })),
          ]}
        />

        <Button
          variant={hasActiveFilter ? "default" : "ghost"}
          size="sm"
          aria-label="Limpar filtros"
          onClick={resetFilters}
          className={cn(
            "gap-1.5",
            !hasActiveFilter && "text-muted-foreground"
          )}
        >
          <RotateCcw className="size-3.5" />
          <span className="hidden xl:inline">Limpar</span>
        </Button>
      </div>

      <ModeToggle />
    </header>
    <FilterStatus />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  items: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-[180px] gap-2" aria-label={label}>
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((it) => (
          <SelectItem key={it.value} value={it.value}>
            {it.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
