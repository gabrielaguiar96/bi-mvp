"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { filtros } from "@/data/report";

export type FilterState = {
  canal: string | "Todos";
  servico: string | "Todos";
};

const DEFAULT_FILTERS: FilterState = {
  canal: "Todos",
  servico: "Todos",
};

type FilterContextValue = {
  filters: FilterState;
  setFilters: (next: Partial<FilterState>) => void;
  resetFilters: () => void;
  /** opções disponíveis para os selects */
  options: typeof filtros;
};

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<FilterState>(DEFAULT_FILTERS);

  const value = useMemo<FilterContextValue>(
    () => ({
      filters,
      setFilters: (next) => setFiltersState((prev) => ({ ...prev, ...next })),
      resetFilters: () => setFiltersState(DEFAULT_FILTERS),
      options: filtros,
    }),
    [filters]
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters deve ser usado dentro de <FilterProvider>");
  return ctx;
}
