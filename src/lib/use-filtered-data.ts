"use client";

import { useMemo } from "react";
import { useFilters } from "./filters";
import {
  conversaoPorCanal,
  faturamentoPorCanal,
  faturamentoPorServico,
  faturamentoMensal,
  funis,
  indicacaoPacientes,
  kpisGeral,
  profissionais,
  dadosPorCanal,
  dadosPorServico,
  kpisMensal,
  anual,
  filtros,
  type KpisMes,
} from "@/data/report";

/**
 * Hook que retorna versões filtradas dos datasets e KPIs recalculados.
 *
 * - Canal: filtra listas por canal e recalcula KPIs usando `dadosPorCanal`.
 * - Serviço: filtra listas por serviço e recalcula KPIs usando `dadosPorServico`.
 * - Mês: filtra KPIs usando `kpisMensal` (dados extraídos por mês via API).
 * - Ano: filtra KPIs usando `anual` (dados anuais 2025/2026).
 * - Quando múltiplos filtros estão ativos, mês tem prioridade sobre ano/canal/serviço.
 */

/**
 * KPI keys that appear in sections using useFilteredData.
 * Used by filterMeta.availableKpis to indicate which KPIs have real data
 * for the active filter(s).
 */
export type KpiKey =
  | "faturamento"
  | "totalLeads"
  | "ocupacaoAgenda"
  | "comparecidos"
  | "qtdUpsell"
  | "ticketMedioConsultas"
  | "taxaConversaoTotal";

/**
 * Metadata describing which filters are active and which KPIs were
 * actually recalculated (vs. kept at global defaults).
 */
export type FilterMeta = {
  activeFilters: {
    hasCanal: boolean;
    hasServico: boolean;
    hasMes: boolean;
    hasAno: boolean;
  };
  /** KPIs that have real data for the current filter combination. */
  availableKpis: Set<KpiKey>;
};

/**
 * Helper: check if a KPI is unavailable for the current filter combination.
 * Returns true when any filter is active and the KPI has no real data for
 * that filter (i.e., not in filterMeta.availableKpis).
 */
export function isKpiUnavailable(filterMeta: FilterMeta, key: KpiKey): boolean {
  const { hasCanal, hasServico, hasMes, hasAno } = filterMeta.activeFilters;
  const hasAnyFilter = hasCanal || hasServico || hasMes || hasAno;
  return hasAnyFilter ? !filterMeta.availableKpis.has(key) : false;
}

export function useFilteredData() {
  const { filters } = useFilters();

  return useMemo(() => {
    const { canal, servico, mes, ano } = filters;
    const hasCanal = canal !== "Todos";
    const hasServico = servico !== "Todos";
    const hasMes = mes !== "Todos";
    const hasAno = ano !== "Todos";

    // ---------- Mês selecionado (year-aware) ----------
    // Keys: "janeiro" = 2025, "janeiro-2026" = 2026
    // Default year is 2026 (current year); only use 2025 when explicitly selected.
    const mesKey = hasMes
      ? (ano === "2025" ? mes : `${mes}-2026`)
      : undefined;
    const mesData: KpisMes | undefined = hasMes
      ? kpisMensal[mesKey as keyof typeof kpisMensal]
      : undefined;

    // ---------- Mês anterior (para comparativos dinâmicos) ----------
    const mesAnteriorData: KpisMes | undefined = (() => {
      if (!hasMes) return undefined;
      const idx = filtros.meses.indexOf(mes);
      if (idx <= 0) return undefined;
      const prevMes = filtros.meses[idx - 1];
      const prevKey = ano === "2025" ? prevMes : `${prevMes}-2026`;
      return kpisMensal[prevKey as keyof typeof kpisMensal];
    })();

    // ---------- Meta real do mês (evita back-calculation com perda de precisão) ----------
    const metaMesReal = (() => {
      if (hasMes) {
        const mesLabel = mes.charAt(0).toUpperCase() + mes.slice(1, 3);
        const yearLabel = ano === "2025" ? "2025" : "2026";
        const entry = faturamentoMensal.find(
          (m) => m.mes.toLowerCase().startsWith(mesLabel.toLowerCase()) && m.mes.includes(yearLabel)
        );
        return entry?.meta ?? 0;
      }
      if (hasAno) {
        // Sum metas for the selected year
        const yearEntries = faturamentoMensal.filter((m) => m.mes.includes(ano));
        return yearEntries.reduce((s, m) => s + m.meta, 0);
      }
      if (hasCanal || hasServico) {
        // No meaningful meta for per-filter views
        return 0;
      }
      // Default (no filter): accumulated 2026 meta
      return faturamentoMensal.filter((m) => m.mes.includes("2026")).reduce((s, m) => s + m.meta, 0);
    })();

    // ---------- Faturamento mensal filtrado ----------
    const fatMensalFiltrado = hasMes
      ? faturamentoMensal.filter((m) => {
          const mesLower = mes.toLowerCase();
          const mesAbrev = mesLower.charAt(0).toUpperCase() + mesLower.slice(1, 3);
          const yearLabel = ano === "2025" ? "2025" : "2026";
          return m.mes.toLowerCase().startsWith(mesAbrev.toLowerCase()) && m.mes.includes(yearLabel);
        })
      : faturamentoMensal;

    // ---------- Ano selecionado ----------
    const anoData = hasAno ? anual[ano as keyof typeof anual] : undefined;

    // ---------- Conversão por canal ----------
    const canalFiltrado = hasCanal
      ? conversaoPorCanal.filter((c) => c.canal === canal)
      : conversaoPorCanal;

    // ---------- Faturamento por canal ----------
    let fatCanalFiltrado = hasCanal
      ? faturamentoPorCanal.filter((c) => c.canal === canal)
      : faturamentoPorCanal;

    // Se mês selecionado E o mês tem breakdown por canal, usar dados mensais por canal
    // (2025 months don't have per-canal breakdown, so we fall back to the default data)
    if (hasMes && mesData && Object.keys(mesData.faturamentoPorCanal).length > 0) {
      const canais = hasCanal ? [canal] : ["Retenção", "Ativo", "Orgânico", "Indicação", "Crossell", "Pago"];
      fatCanalFiltrado = canais
        .map((c) => ({
          canal: c,
          faturamento: mesData.faturamentoPorCanal[c] ?? 0,
          ticketMedio: 0, // não temos ticket médio por canal por mês
        }))
        .filter((c) => c.faturamento > 0);
    }

    // ---------- Faturamento por serviço ----------
    let fatServicoFiltrado = hasServico
      ? (() => {
          const match = faturamentoPorServico.find(
            (s) =>
              s.servico.toLowerCase() === servico.toLowerCase() ||
              s.servico.toLowerCase().includes(servico.toLowerCase())
          );
          return match ? [match] : [];
        })()
      : faturamentoPorServico;

    // Se mês selecionado E o mês tem breakdown por serviço, usar dados mensais por serviço
    if (hasMes && mesData && Object.keys(mesData.faturamentoPorServico).length > 0) {
      const servicos = hasServico ? [servico] : ["Nutrologia", "Pediatria", "Dermatologia"];
      fatServicoFiltrado = servicos
        .map((s) => ({
          servico: s,
          faturamento: mesData.faturamentoPorServico[s] ?? 0,
        }))
        .filter((s) => s.faturamento > 0);
    }

    // ---------- Funis por profissional ----------
    const funisFiltrados = hasServico
      ? Object.fromEntries(
          Object.entries(funis).filter(([, f]) =>
            f.servico.toLowerCase().includes(servico.toLowerCase())
          )
        )
      : funis;

    // ---------- Profissionais ----------
    const profissionaisFiltrados = hasServico
      ? Object.fromEntries(
          Object.entries(profissionais).filter(([, p]) =>
            p.servico.toLowerCase().includes(servico.toLowerCase())
          )
        )
      : profissionais;

    // ---------- KPIs recalculados ----------
    // Use a type with optional fields so we can set undefined for
    // Canal/Servico branches where comparison data doesn't exist.
    type KpiFields = { atual: number; mesAnterior?: number; metaMes?: number; pctMeta?: number; anoAnterior?: number };
    type KpisFiltered = {
      faturamento: KpiFields;
      totalLeads: KpiFields;
      ocupacaoAgenda: KpiFields;
      comparecidos: KpiFields;
      qtdUpsell: KpiFields;
      conversaoUpsell: KpiFields;
      ticketMedioConsultas: KpiFields;
      taxaConversaoTotal: KpiFields;
    };
    let kpis = kpisGeral as unknown as KpisFiltered;

    if (hasMes && hasCanal && mesData) {
      // Combinação Mês + Canal: apenas faturamento disponível por canal no mês
      const canalFat = mesData.faturamentoPorCanal[canal] ?? 0;
      kpis = {
        ...kpisGeral,
        faturamento: {
          atual: canalFat,
          mesAnterior: undefined as number | undefined,
          metaMes: metaMesReal,
          pctMeta: 0,
        },
        totalLeads: { atual: kpisGeral.totalLeads.atual },
        ocupacaoAgenda: { atual: kpisGeral.ocupacaoAgenda.atual },
        comparecidos: { atual: kpisGeral.comparecidos.atual },
        qtdUpsell: { atual: kpisGeral.qtdUpsell.atual },
        ticketMedioConsultas: {
          atual: kpisGeral.ticketMedioConsultas.atual,
          mesAnterior: undefined as number | undefined,
          anoAnterior: undefined as number | undefined,
        },
        taxaConversaoTotal: { atual: kpisGeral.taxaConversaoTotal.atual },
      };
    } else if (hasMes && hasServico && mesData) {
      // Combinação Mês + Serviço: apenas faturamento disponível por serviço no mês
      const servicoFat = mesData.faturamentoPorServico[servico] ?? 0;
      kpis = {
        ...kpisGeral,
        faturamento: {
          atual: servicoFat,
          mesAnterior: undefined as number | undefined,
          metaMes: metaMesReal,
          pctMeta: 0,
        },
        totalLeads: { atual: kpisGeral.totalLeads.atual },
        ocupacaoAgenda: { atual: kpisGeral.ocupacaoAgenda.atual },
        comparecidos: { atual: kpisGeral.comparecidos.atual },
        qtdUpsell: { atual: kpisGeral.qtdUpsell.atual },
        ticketMedioConsultas: {
          atual: kpisGeral.ticketMedioConsultas.atual,
          mesAnterior: undefined as number | undefined,
          anoAnterior: undefined as number | undefined,
        },
        taxaConversaoTotal: { atual: kpisGeral.taxaConversaoTotal.atual },
      };
    } else if (hasMes && mesData) {
      // Prioridade: mês selecionado — comparativos dinâmicos com mês anterior real
      kpis = {
        ...kpisGeral,
        faturamento: {
          atual: mesData.faturamento,
          mesAnterior: mesAnteriorData?.faturamento ?? mesData.faturamentoLM,
          metaMes: metaMesReal,
          pctMeta: Math.round(mesData.pctMeta * 100) / 100,
        },
        totalLeads: {
          atual: mesData.leads,
          mesAnterior: mesAnteriorData?.leads ?? kpisGeral.totalLeads.mesAnterior,
        },
        ocupacaoAgenda: {
          atual: mesData.ocupacaoAgenda,
          mesAnterior: mesAnteriorData?.ocupacaoAgenda ?? kpisGeral.ocupacaoAgenda.mesAnterior,
          anoAnterior: kpisGeral.ocupacaoAgenda.anoAnterior,
        },
        comparecidos: {
          atual: mesData.comparecidos,
          mesAnterior: mesAnteriorData?.comparecidos,
          anoAnterior: kpisGeral.comparecidos.anoAnterior,
        },
        qtdUpsell: { atual: mesData.qtdUpsell },
        ticketMedioConsultas: {
          atual: Math.round(mesData.ticketMedio * 100) / 100,
          mesAnterior: mesAnteriorData?.ticketMedio ?? kpisGeral.ticketMedioConsultas.mesAnterior,
          anoAnterior: kpisGeral.ticketMedioConsultas.anoAnterior,
        },
        taxaConversaoTotal: {
          atual: mesData.leads > 0 ? Math.round((mesData.marcados / mesData.leads) * 10000) / 10000 : 0,
        },
      };
    } else if (hasAno && anoData) {
      // Ano selecionado — comparação com ano anterior (vs ano anterior)
      const prevYear = String(Number(ano) - 1);
      const prevAnoData = anual[prevYear as keyof typeof anual];
      kpis = {
        ...kpisGeral,
        faturamento: {
          atual: anoData.faturamento,
          mesAnterior: prevAnoData?.faturamento as number | undefined,
          metaMes: metaMesReal,
          pctMeta: Math.round(anoData.pctMeta * 100) / 100,
        },
        totalLeads: {
          atual: anoData.leads,
          mesAnterior: prevAnoData?.leads as number | undefined,
        },
        ocupacaoAgenda: {
          atual: anoData.ocupacaoAgenda,
          mesAnterior: prevAnoData?.ocupacaoAgenda as number | undefined,
          anoAnterior: prevAnoData?.ocupacaoAgenda as number | undefined,
        },
        comparecidos: {
          atual: anoData.comparecidos,
          mesAnterior: prevAnoData?.comparecidos as number | undefined,
          anoAnterior: prevAnoData?.comparecidos as number | undefined,
        },
        ticketMedioConsultas: {
          atual: kpisGeral.ticketMedioConsultas.atual,
          mesAnterior: undefined as number | undefined,
          anoAnterior: undefined as number | undefined,
        },
      };
    } else if (hasCanal) {
      const dc = canal in dadosPorCanal ? dadosPorCanal[canal as keyof typeof dadosPorCanal] : undefined;
      if (dc && dc.faturamento != null) {
        kpis = {
          ...kpisGeral,
          faturamento: {
            atual: dc.faturamento,
            mesAnterior: undefined as number | undefined,
            metaMes: 0,
            pctMeta: 0,
          },
          totalLeads: {
            atual: dc.leads,
            mesAnterior: undefined as number | undefined,
          },
          ticketMedioConsultas: {
            atual: dc.ticketMedio,
            mesAnterior: undefined as number | undefined,
            anoAnterior: undefined as number | undefined,
          },
          taxaConversaoTotal: {
            atual: dc.conversao,
          },
        };
      }
      // Google/Meta: dc exists but faturamento is null → kpis stays as kpisGeral,
      // but filterMeta will mark KPIs as unavailable (see availableKpis below)
    } else if (hasServico) {
      const ds = servico in dadosPorServico ? dadosPorServico[servico as keyof typeof dadosPorServico] : undefined;
      if (ds) {
        const ticketMedio = ds.ticketMedioServico > 0
          ? ds.ticketMedioServico
          : ds.ticketMedioConsultas ?? 0;
        kpis = {
          ...kpisGeral,
          faturamento: {
            atual: ds.faturamento,
            mesAnterior: undefined as number | undefined,
            metaMes: 0,
            pctMeta: 0,
          },
          totalLeads: {
            atual: ds.leads ?? 0,
            mesAnterior: undefined as number | undefined,
          },
          ticketMedioConsultas: {
            atual: ticketMedio,
            mesAnterior: undefined as number | undefined,
            anoAnterior: undefined as number | undefined,
          },
        };
      }
    } else {
      // Todos view (no filters active): use accumulated 2026 data
      const todosAno = anual["2026"];
      const prevAno = anual["2025"];
      kpis = {
        ...kpisGeral,
        faturamento: {
          atual: todosAno.faturamento,
          mesAnterior: prevAno.faturamento as number | undefined,
          metaMes: metaMesReal,
          pctMeta: Math.round(todosAno.pctMeta * 100) / 100,
        },
        totalLeads: {
          atual: todosAno.leads,
          mesAnterior: prevAno.leads as number | undefined,
        },
        ocupacaoAgenda: {
          atual: todosAno.ocupacaoAgenda,
          mesAnterior: prevAno.ocupacaoAgenda as number | undefined,
          anoAnterior: prevAno.ocupacaoAgenda as number | undefined,
        },
        comparecidos: {
          atual: todosAno.comparecidos,
          mesAnterior: prevAno.comparecidos as number | undefined,
          anoAnterior: prevAno.comparecidos as number | undefined,
        },
        ticketMedioConsultas: {
          atual: kpisGeral.ticketMedioConsultas.atual,
          mesAnterior: undefined as number | undefined,
          anoAnterior: undefined as number | undefined,
        },
      };
    }

    // ---------- filterMeta: which KPIs have real data ----------
    const allKpiKeys: KpiKey[] = [
      "faturamento",
      "totalLeads",
      "ocupacaoAgenda",
      "comparecidos",
      "qtdUpsell",
      "ticketMedioConsultas",
      "taxaConversaoTotal",
    ];

    let availableKpis: Set<KpiKey>;

    if (hasMes && hasCanal && mesData) {
      // Mês + Canal: apenas faturamento tem dado per-canal no mês
      availableKpis = new Set<KpiKey>(["faturamento"]);
    } else if (hasMes && hasServico && mesData) {
      // Mês + Serviço: apenas faturamento tem dado per-service no mês
      availableKpis = new Set<KpiKey>(["faturamento"]);
    } else if (hasMes && mesData) {
      // Mês has data for all KPIs
      availableKpis = new Set(allKpiKeys);
    } else if (hasAno && anoData) {
      // Ano has most KPIs but not qtdUpsell, taxaConversaoTotal, or ticketMedioConsultas
      // (ticketMedioConsultas is not recalculated in the ano branch)
      availableKpis = new Set<KpiKey>([
        "faturamento",
        "totalLeads",
        "ocupacaoAgenda",
        "comparecidos",
      ]);
    } else if (hasCanal) {
      const dc = canal in dadosPorCanal ? dadosPorCanal[canal as keyof typeof dadosPorCanal] : undefined;
      if (dc && dc.faturamento != null) {
        availableKpis = new Set<KpiKey>([
          "faturamento",
          "totalLeads",
          "ticketMedioConsultas",
          "taxaConversaoTotal",
        ]);
      } else {
        // Google/Meta: all null values → no KPIs available
        availableKpis = new Set<KpiKey>();
      }
    } else if (hasServico) {
      // Servico: only KPIs present in dadosPorServico, check actual data availability
      const ds = servico in dadosPorServico ? dadosPorServico[servico as keyof typeof dadosPorServico] : undefined;
      const servicoKpis: KpiKey[] = ["faturamento"];
      if (ds?.leads != null) servicoKpis.push("totalLeads");
      const tm = ds ? (ds.ticketMedioServico > 0 ? ds.ticketMedioServico : ds.ticketMedioConsultas ?? 0) : 0;
      if (tm > 0) servicoKpis.push("ticketMedioConsultas");
      availableKpis = new Set<KpiKey>(servicoKpis);
    } else {
      // No filter — all KPIs available (global defaults)
      availableKpis = new Set(allKpiKeys);
    }

    const filterMeta: FilterMeta = {
      activeFilters: { hasCanal, hasServico, hasMes, hasAno },
      availableKpis,
    };

    // ---------- comparisonLabel: dynamic label for KPI comparisons ----------
    const comparisonLabel: string | undefined = (() => {
      if (hasMes) return "vs mês anterior";
      if (hasAno) return "vs ano anterior";
      // Canal/Servico without Mes/Ano → suppress comparison
      if (hasCanal || hasServico) return undefined;
      // No filter (Todos view) → compare with 2025 annual data
      return "vs 2025";
    })();

    return {
      kpisGeral: kpis,
      indicacaoPacientes,
      conversaoPorCanal: canalFiltrado,
      faturamentoPorCanal: fatCanalFiltrado,
      faturamentoPorServico: fatServicoFiltrado,
      faturamentoMensal: fatMensalFiltrado,
      funis: funisFiltrados,
      profissionais: profissionaisFiltrados,
      hasActiveFilter: hasCanal || hasServico || hasMes || hasAno,
      filterMeta,
      comparisonLabel,
    };
  }, [filters]);
}
