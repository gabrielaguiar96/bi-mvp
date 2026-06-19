import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { FilterProvider, useFilters } from "@/lib/filters";

function wrapper({ children }: { children: React.ReactNode }) {
  return <FilterProvider>{children}</FilterProvider>;
}

describe("FilterProvider", () => {
  it("starts with default filters (Todos/Todos)", () => {
    const { result } = renderHook(() => useFilters(), { wrapper });
    expect(result.current.filters).toEqual({ canal: "Todos", servico: "Todos", mes: "Todos", ano: "Todos" });
  });

  it("setFilters merges with current state", () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.setFilters({ canal: "Retenção" });
    });

    expect(result.current.filters).toEqual({ canal: "Retenção", servico: "Todos", mes: "Todos", ano: "Todos" });
  });

  it("setFilters only updates specified keys", () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.setFilters({ canal: "Retenção" });
    });
    act(() => {
      result.current.setFilters({ servico: "Nutrologia" });
    });

    expect(result.current.filters).toEqual({ canal: "Retenção", servico: "Nutrologia", mes: "Todos", ano: "Todos" });
  });

  it("resetFilters restores defaults", () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.setFilters({ canal: "Retenção", servico: "Pediatria" });
    });
    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters).toEqual({ canal: "Todos", servico: "Todos", mes: "Todos", ano: "Todos" });
  });

  it("provides options from filtros", () => {
    const { result } = renderHook(() => useFilters(), { wrapper });
    expect(result.current.options).toBeDefined();
    expect(result.current.options.canais).toBeInstanceOf(Array);
    expect(result.current.options.servicos).toBeInstanceOf(Array);
  });

  it("throws when used outside FilterProvider", () => {
    expect(() => {
      renderHook(() => useFilters());
    }).toThrow("useFilters deve ser usado dentro de <FilterProvider>");
  });
});
