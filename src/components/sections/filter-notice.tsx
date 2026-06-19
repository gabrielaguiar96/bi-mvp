"use client";

import { Info } from "lucide-react";
import { useFilters } from "@/lib/filters";

type FilterNoticeProps = {
  /**
   * Lista de filtros que NÃO se aplicam à seção atual.
   * ex.: ["Ano", "Mês"] — se esses filtros estiverem ativos, o banner aparece.
   */
  ignore?: Array<"ano" | "mes" | "canal" | "servico">;
};

/**
 * Banner discreto que aparece quando há filtros ativos
 * que não se aplicam à seção atual. Dá transparência ao usuário
 * sobre o que está sendo ignorado e por quê.
 */
export function FilterNotice({ ignore = [] }: FilterNoticeProps) {
  const { filters, resetFilters } = useFilters();

  const activeIgnored = ignore.filter((key) => {
    if (key === "ano") return filters.ano !== 2026;
    if (key === "mes") return filters.mes !== "Todos";
    if (key === "canal") return filters.canal !== "Todos";
    if (key === "servico") return filters.servico !== "Todos";
    return false;
  });

  if (activeIgnored.length === 0) return null;

  const labels: Record<string, string> = {
    ano: "Ano",
    mes: "Mês",
    canal: "Canal",
    servico: "Serviço",
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <Info className="size-3.5 shrink-0" />
      <span>
        {activeIgnored.map((k) => labels[k]).join(" / ")}{" "}
        {activeIgnored.length === 1 ? "não se aplica" : "não se aplicam"} a esta
        seção.
      </span>
      <button
        type="button"
        onClick={resetFilters}
        className="ml-auto text-primary hover:underline"
      >
        Limpar filtros
      </button>
    </div>
  );
}
