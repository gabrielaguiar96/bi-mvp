"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFilters, type FilterState } from "@/lib/filters";

type FilterLabel = {
  key: keyof FilterState;
  label: string;
  value: string;
};

/**
 * Barra de status que mostra os filtros ativos como badges.
 * Oculta quando nenhum filtro está ativo.
 *
 * Cada badge mostra o nome do filtro e o valor selecionado
 * (ex.: "Canal: Pago", "Serviço: Nutrologia").
 * Clicar no X de um badge remove aquele filtro específico.
 */
export function FilterStatus() {
  const { filters, setFilters } = useFilters();

  const activeFilters: FilterLabel[] = [];

  if (filters.canal !== "Todos") {
    activeFilters.push({ key: "canal", label: "Canal", value: filters.canal });
  }
  if (filters.servico !== "Todos") {
    activeFilters.push({ key: "servico", label: "Serviço", value: filters.servico });
  }
  if (filters.ano !== "Todos") {
    activeFilters.push({ key: "ano", label: "Ano", value: filters.ano });
  }
  if (filters.mes !== "Todos") {
    activeFilters.push({
      key: "mes",
      label: "Mês",
      value: filters.mes.charAt(0).toUpperCase() + filters.mes.slice(1),
    });
  }

  if (activeFilters.length === 0) return null;

  const clearFilter = (key: keyof FilterState) => {
    setFilters({ [key]: "Todos" });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 md:px-6" role="status" aria-label="Filtros ativos">
      <span className="text-xs text-muted-foreground">Filtros:</span>
      {activeFilters.map((f) => (
        <Badge
          key={f.key}
          variant="secondary"
          className="gap-1 pr-1"
        >
          <span className="text-muted-foreground">{f.label}:</span>
          <span>{f.value}</span>
          <button
            type="button"
            onClick={() => clearFilter(f.key)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
            aria-label={`Remover filtro ${f.label}`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
