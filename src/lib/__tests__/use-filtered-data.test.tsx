import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { FilterProvider, useFilters } from "@/lib/filters";
import { useFilteredData } from "@/lib/use-filtered-data";

/**
 * Helper hook that exposes both useFilters and useFilteredData
 * so tests can change filters and read the resulting data.
 */
function useTestHarness() {
  const filters = useFilters();
  const data = useFilteredData();
  return { ...filters, data };
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <FilterProvider>{children}</FilterProvider>;
}

describe("useFilteredData", () => {
  it("returns full data with no filter (Todos view)", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper });

    act(() => {
      result.current.setFilters({ mes: "Todos" });
    });

    expect(result.current.data.conversaoPorCanal.length).toBe(6);
    expect(Object.keys(result.current.data.funis)).toHaveLength(3);
    expect(result.current.data.hasActiveFilter).toBe(false);
  });

  it("filters conversaoPorCanal by canal", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper });

    act(() => {
      result.current.setFilters({ mes: "Todos", canal: "Retenção" });
    });

    expect(result.current.data.conversaoPorCanal).toHaveLength(1);
    expect(result.current.data.conversaoPorCanal[0].canal).toBe("Retenção");
    expect(result.current.data.hasActiveFilter).toBe(true);
  });

  it("recalculates KPIs when canal filter is active", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper });

    act(() => {
      result.current.setFilters({ mes: "Todos", canal: "Retenção" });
    });

    const kpis = result.current.data.kpisGeral;
    expect(kpis.faturamento.atual).toBe(557344);
    expect(kpis.taxaConversaoTotal.atual).toBeCloseTo(0.9194, 2);
  });

  it("filters funis and profissionais by servico", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper });

    act(() => {
      result.current.setFilters({ mes: "Todos", servico: "Nutrologia" });
    });

    expect(Object.keys(result.current.data.funis)).toEqual(["Dr Fernando"]);
    expect(Object.keys(result.current.data.profissionais)).toEqual(["Dr Fernando"]);
    expect(result.current.data.faturamentoPorServico).toHaveLength(1);
    expect(result.current.data.faturamentoPorServico[0].servico).toBe("Nutrologia");
  });

  it("recalculates KPIs when servico filter is active", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper });

    act(() => {
      result.current.setFilters({ mes: "Todos", servico: "Nutrologia" });
    });

    const kpis = result.current.data.kpisGeral;
    expect(kpis.faturamento.atual).toBe(1020706);
  });

  it("canal filter takes priority over servico when both active", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper });

    act(() => {
      result.current.setFilters({ mes: "Todos", canal: "Retenção", servico: "Nutrologia" });
    });

    const kpis = result.current.data.kpisGeral;
    // Canal data should take priority
    expect(kpis.faturamento.atual).toBe(557344);
    expect(result.current.data.conversaoPorCanal).toHaveLength(1);
    expect(result.current.data.conversaoPorCanal[0].canal).toBe("Retenção");
  });

  it("handles servico filter case-insensitively", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper });

    act(() => {
      result.current.setFilters({ servico: "nutrologia" });
    });

    expect(Object.keys(result.current.data.funis)).toEqual(["Dr Fernando"]);
  });

  // --- filterMeta tests ---

  it("filterMeta: all KPIs available with no filter", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper });

    act(() => {
      result.current.setFilters({ mes: "Todos" });
    });

    const meta = result.current.data.filterMeta;
    expect(meta.activeFilters.hasCanal).toBe(false);
    expect(meta.activeFilters.hasServico).toBe(false);
    expect(meta.activeFilters.hasMes).toBe(false);
    expect(meta.activeFilters.hasAno).toBe(false);
    expect(meta.availableKpis.size).toBe(7);
    expect(meta.availableKpis.has("ocupacaoAgenda")).toBe(true);
    expect(meta.availableKpis.has("comparecidos")).toBe(true);
    expect(meta.availableKpis.has("qtdUpsell")).toBe(true);
  });

  it("filterMeta: canal filter marks unavailable KPIs", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper });

    act(() => {
      result.current.setFilters({ mes: "Todos", canal: "Retenção" });
    });

    const meta = result.current.data.filterMeta;
    expect(meta.activeFilters.hasCanal).toBe(true);
    // Canal data has: faturamento, totalLeads, ticketMedioConsultas, taxaConversaoTotal
    expect(meta.availableKpis.has("faturamento")).toBe(true);
    expect(meta.availableKpis.has("totalLeads")).toBe(true);
    expect(meta.availableKpis.has("ticketMedioConsultas")).toBe(true);
    expect(meta.availableKpis.has("taxaConversaoTotal")).toBe(true);
    // These are NOT available for canal:
    expect(meta.availableKpis.has("ocupacaoAgenda")).toBe(false);
    expect(meta.availableKpis.has("comparecidos")).toBe(false);
    expect(meta.availableKpis.has("qtdUpsell")).toBe(false);
  });

  it("filterMeta: servico filter marks unavailable KPIs", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper });

    act(() => {
      result.current.setFilters({ mes: "Todos", servico: "Nutrologia" });
    });

    const meta = result.current.data.filterMeta;
    expect(meta.activeFilters.hasServico).toBe(true);
    // Servico data has: faturamento, totalLeads, ticketMedioConsultas
    expect(meta.availableKpis.has("faturamento")).toBe(true);
    expect(meta.availableKpis.has("totalLeads")).toBe(true);
    expect(meta.availableKpis.has("ticketMedioConsultas")).toBe(true);
    // These are NOT available for servico:
    expect(meta.availableKpis.has("ocupacaoAgenda")).toBe(false);
    expect(meta.availableKpis.has("comparecidos")).toBe(false);
    expect(meta.availableKpis.has("qtdUpsell")).toBe(false);
    expect(meta.availableKpis.has("taxaConversaoTotal")).toBe(false);
  });

  it("filterMeta: mes filter has all KPIs available", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper });

    act(() => {
      result.current.setFilters({ mes: "janeiro" });
    });

    const meta = result.current.data.filterMeta;
    expect(meta.activeFilters.hasMes).toBe(true);
    expect(meta.availableKpis.size).toBe(7);
  });

  // --- Todos view tests (all filters = "Todos") ---

  it("Todos view uses anual 2026 accumulated data for KPIs", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper });

    act(() => {
      result.current.setFilters({ mes: "Todos" });
    });

    const kpis = result.current.data.kpisGeral;
    expect(kpis.faturamento.atual).toBe(6_315_993.99);
    expect(kpis.totalLeads.atual).toBe(2331);
    expect(kpis.ocupacaoAgenda.atual).toBe(1269);
    expect(kpis.comparecidos.atual).toBe(1142);
  });

  it("Todos view comparison label is 'vs 2025'", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper });

    act(() => {
      result.current.setFilters({ mes: "Todos" });
    });

    expect(result.current.data.comparisonLabel).toBe("vs 2025");
  });

  it("default view (mes=maio) comparison label is 'vs mês anterior'", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper });

    // Default is mes="maio"
    expect(result.current.data.comparisonLabel).toBe("vs mês anterior");
  });

  it("default view KPIs match kpisMensal maio-2026", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper });

    // Default is mes="maio"
    const kpis = result.current.data.kpisGeral;
    expect(kpis.faturamento.atual).toBe(1_392_068.50);
    expect(kpis.totalLeads.atual).toBe(489);
    expect(kpis.ocupacaoAgenda.atual).toBe(228);
    expect(kpis.comparecidos.atual).toBe(209);
  });
});
