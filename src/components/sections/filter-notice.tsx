"use client";

import { Info, AlertTriangle } from "lucide-react";
import { useFilters } from "@/lib/filters";

type FilterKey = "canal" | "servico" | "mes" | "ano";

type FilterNoticeProps = {
  /**
   * Lista de filtros que NÃO se aplicam à seção atual.
   * ex.: ["canal", "servico", "mes", "ano"] — se esses filtros estiverem ativos, o banner aparece.
   */
  ignore?: FilterKey[];
};

const LABELS: Record<FilterKey, string> = {
  canal: "Canal",
  servico: "Serviço",
  mes: "Mês",
  ano: "Ano",
};

/**
 * Banner discreto que aparece quando há filtros ativos
 * que não se aplicam à seção atual. Dá transparência ao usuário
 * sobre o que está sendo ignorado e por quê.
 *
 * O botão "Limpar" remove apenas os filtros ignorados, preservando
 * os filtros que a seção realmente utiliza.
 */
export function FilterNotice({ ignore = [] }: FilterNoticeProps) {
  const { filters, setFilters } = useFilters();

  const activeIgnored = ignore.filter((key) => {
    if (key === "canal") return filters.canal !== "Todos";
    if (key === "servico") return filters.servico !== "Todos";
    if (key === "mes") return filters.mes !== "Todos";
    if (key === "ano") return filters.ano !== "Todos";
    return false;
  });

  if (activeIgnored.length === 0) return null;

  /** Limpa apenas os filtros que não se aplicam a esta seção */
  const clearIgnored = () => {
    const partial: Partial<Record<FilterKey, string>> = {};
    for (const key of activeIgnored) {
      partial[key] = "Todos";
    }
    setFilters(partial);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <Info className="size-3.5 shrink-0" />
      <span>
        {activeIgnored.map((k) => LABELS[k]).join(" / ")}{" "}
        {activeIgnored.length === 1 ? "não se aplica" : "não se aplicam"} a esta
        seção.
      </span>
      <button
        type="button"
        onClick={clearIgnored}
        className="ml-auto text-primary hover:underline"
      >
        {activeIgnored.length === 1 ? "Limpar filtro" : "Limpar filtros"}
      </button>
    </div>
  );
}

/** Mês corrente (parcial) — atualizar conforme o snapshot */
const CURRENT_PARTIAL_MONTH = "junho";
const CURRENT_PARTIAL_YEAR = "2026";

/**
 * Aviso discreto quando o mês selecionado tem dados parciais
 * (mês corrente ainda em andamento). Só aplica ao ano corrente.
 */
export function PartialMonthNotice() {
  const { filters } = useFilters();

  // Only show for the current partial month in the current year
  const isPartial = filters.mes === CURRENT_PARTIAL_MONTH
    && (filters.ano === "Todos" || filters.ano === CURRENT_PARTIAL_YEAR);

  if (!isPartial) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-chart-3/30 bg-chart-3/5 px-3 py-2 text-xs text-chart-3">
      <AlertTriangle className="size-3.5 shrink-0" />
      <span>Dados parciais — mês ainda em andamento.</span>
    </div>
  );
}

/**
 * Aviso quando um mês de 2025 está selecionado.
 * O Power BI não fornece breakdown por canal/servico para meses de 2025,
 * então os gráficos de canal e serviço mostram dados gerais (não do mês).
 */
export function Month2025Notice() {
  const { filters } = useFilters();

  // Only show when year is explicitly 2025 (not when ano="Todos", which defaults to 2026)
  const is2025Month = filters.mes !== "Todos" && filters.ano === "2025";

  if (!is2025Month) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <Info className="size-3.5 shrink-0" />
      <span>
        Breakdown por canal e serviço não disponível para meses de 2025.
        Os gráficos mostram dados gerais.
      </span>
    </div>
  );
}

/**
 * Aviso quando a combinação Mês+Canal ou Mês+Serviço está ativa.
 * Nessa combinação, apenas o faturamento tem dado real por canal/serviço
 * no mês selecionado. Demais KPIs (leads, ocupação, comparecidos, upsell)
 * mostram "N/D" pois não há breakdown mensal por canal/serviço.
 */
export function ComboPartialNotice() {
  const { filters } = useFilters();

  const hasMes = filters.mes !== "Todos";
  const hasCanal = filters.canal !== "Todos";
  const hasServico = filters.servico !== "Todos";
  const isCombo = hasMes && (hasCanal || hasServico);

  if (!isCombo) return null;

  const tipo = hasCanal ? "canal" : "serviço";

  return (
    <div className="flex items-center gap-2 rounded-lg border border-chart-3/30 bg-chart-3/5 px-3 py-2 text-xs text-chart-3">
      <AlertTriangle className="size-3.5 shrink-0" />
      <span>
        Dados parciais — apenas faturamento disponível por {tipo} no mês
        selecionado. Demais indicadores mostram dados gerais.
      </span>
    </div>
  );
}

/**
 * Aviso quando Canal e Serviço estão ambos ativos (sem Mês).
 * Canal e Serviço são dimensões independentes no modelo de dados do Power BI.
 * Não existe interseção canal×serviço. KPIs refletem dados do canal,
 * gráficos filtram por serviço independentemente.
 */
export function CanalServicoNotice() {
  const { filters } = useFilters();

  const hasCanal = filters.canal !== "Todos";
  const hasServico = filters.servico !== "Todos";
  const hasMes = filters.mes !== "Todos";

  if (!hasCanal || !hasServico || hasMes) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <Info className="size-3.5 shrink-0" />
      <span>
        Canal e Serviço são dimensões independentes — não há dados de
        interseção. Indicadores refletem dados do canal selecionado.
      </span>
    </div>
  );
}
