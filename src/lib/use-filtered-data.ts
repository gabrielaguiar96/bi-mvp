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
 * Returns true when canal or servico filter is active and the KPI has no
 * real data for that filter (i.e., not in filterMeta.availableKpis).
 */
export function isKpiUnavailable(filterMeta: FilterMeta, key: KpiKey): boolean {
  return filterMeta.activeFilters.hasCanal || filterMeta.activeFilters.hasServico
    ? !filterMeta.availableKpis.has(key)
    : false;
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
    const mesKey = hasMes
      ? (hasAno && ano === "2026" ? `${mes}-${ano}` : mes)
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
      const prevKey = hasAno && ano === "2026" ? `${prevMes}-${ano}` : prevMes;
      return kpisMensal[prevKey as keyof typeof kpisMensal];
    })();

    // ---------- Meta real do mês (evita back-calculation com perda de precisão) ----------
    // Quando nenhum mês está selecionado, usa a meta acumulada do ano corrente (2026).
    const fatMensal2026 = faturamentoMensal.filter((m) => m.mes.includes("2026"));
    const metaMesReal = (() => {
      if (hasMes) {
        const mesLabel = mes.charAt(0).toUpperCase() + mes.slice(1, 3);
        const yearLabel = hasAno ? ano : "2025";
        const entry = faturamentoMensal.find(
          (m) => m.mes.toLowerCase().startsWith(mesLabel.toLowerCase()) && m.mes.includes(yearLabel)
        );
        return entry?.meta ?? 0;
      }
      return fatMensal2026.reduce((s, m) => s + m.meta, 0);
    })();

    // ---------- Faturamento mensal filtrado ----------
    const fatMensalFiltrado = hasMes
      ? faturamentoMensal.filter((m) => {
          const mesLower = mes.toLowerCase();
          const mesAbrev = mesLower.charAt(0).toUpperCase() + mesLower.slice(1, 3);
          const yearLabel = hasAno ? ano : (m.mes.includes("2025") ? "2025" : "2026");
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
    let kpis = kpisGeral;

    if (hasMes && mesData) {
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
      // Ano selecionado — nota: dados anuais não incluem todos os sub-indicadores
      kpis = {
        ...kpisGeral,
        faturamento: {
          atual: anoData.faturamento,
          mesAnterior: kpisGeral.faturamento.mesAnterior,
          metaMes: metaMesReal,
          pctMeta: Math.round(anoData.pctMeta * 100) / 100,
        },
        totalLeads: {
          atual: anoData.leads,
          mesAnterior: kpisGeral.totalLeads.mesAnterior,
        },
        ocupacaoAgenda: {
          atual: anoData.ocupacaoAgenda,
          mesAnterior: kpisGeral.ocupacaoAgenda.mesAnterior,
          anoAnterior: kpisGeral.ocupacaoAgenda.anoAnterior,
        },
        comparecidos: {
          atual: anoData.comparecidos,
          mesAnterior: undefined,
          anoAnterior: kpisGeral.comparecidos.anoAnterior,
        },
        // qtdUpsell e taxaConversaoTotal não disponíveis no dado anual — mantém defaults
      };
    } else if (hasCanal) {
      const dc = canal in dadosPorCanal ? dadosPorCanal[canal as keyof typeof dadosPorCanal] : undefined;
      if (dc && dc.faturamento != null) {
        kpis = {
          ...kpisGeral,
          faturamento: {
            atual: dc.faturamento,
            mesAnterior: kpisGeral.faturamento.mesAnterior,
            metaMes: 0,
            pctMeta: 0,
          },
          totalLeads: {
            atual: dc.leads,
            mesAnterior: kpisGeral.totalLeads.mesAnterior,
          },
          ticketMedioConsultas: {
            atual: dc.ticketMedio,
            mesAnterior: kpisGeral.ticketMedioConsultas.mesAnterior,
            anoAnterior: kpisGeral.ticketMedioConsultas.anoAnterior,
          },
          taxaConversaoTotal: {
            atual: dc.conversao,
          },
        };
      }
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
            mesAnterior: kpisGeral.faturamento.mesAnterior,
            metaMes: 0,
            pctMeta: 0,
          },
          totalLeads: {
            atual: ds.leads ?? 0,
            mesAnterior: kpisGeral.totalLeads.mesAnterior,
          },
          ticketMedioConsultas: {
            atual: ticketMedio,
            mesAnterior: kpisGeral.ticketMedioConsultas.mesAnterior,
            anoAnterior: kpisGeral.ticketMedioConsultas.anoAnterior,
          },
        };
      }
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

    if (hasMes && mesData) {
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
      // Canal: only KPIs present in dadosPorCanal
      availableKpis = new Set<KpiKey>([
        "faturamento",
        "totalLeads",
        "ticketMedioConsultas",
        "taxaConversaoTotal",
      ]);
    } else if (hasServico) {
      // Servico: only KPIs present in dadosPorServico
      availableKpis = new Set<KpiKey>([
        "faturamento",
        "totalLeads",
        "ticketMedioConsultas",
      ]);
    } else {
      // No filter — all KPIs available (global defaults)
      availableKpis = new Set(allKpiKeys);
    }

    const filterMeta: FilterMeta = {
      activeFilters: { hasCanal, hasServico, hasMes, hasAno },
      availableKpis,
    };

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
    };
  }, [filters]);
}
