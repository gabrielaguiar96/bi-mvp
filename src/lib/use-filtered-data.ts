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
} from "@/data/report";

/**
 * Hook que retorna versões filtradas dos datasets exportados em `report.ts`.
 * - Ano: filtra a série temporal (faturamentoMensal) por ano quando aplicável.
 * - Mês: filtra a série temporal a um único mês.
 * - Canal: filtra as listas por canal (no snapshot, os totais são fixos; aqui
 *   filtramos para isolar a fatia e recalculamos o % de participação).
 * - Serviço: filtra listas por serviço (Nutrologia/Pediatria/Dermatologia).
 */
export function useFilteredData() {
  const { filters } = useFilters();

  return useMemo(() => {
    const { ano, mes, canal, servico } = filters;

    // ---------- Conversão por canal ----------
    const canalFiltrado =
      canal === "Todos"
        ? conversaoPorCanal
        : conversaoPorCanal.filter((c) => c.canal === canal);

    // ---------- Faturamento por canal ----------
    const fatCanalFiltrado =
      canal === "Todos"
        ? faturamentoPorCanal
        : faturamentoPorCanal.filter((c) => c.canal === canal);

    // ---------- Faturamento por serviço ----------
    // "By Evuli" representa agregado; quando o filtro for um serviço específico
    // retornamos só a linha daquele serviço, quando for "By Evuli" somamos todos.
    const fatServicoFiltrado =
      servico === "Todos"
        ? faturamentoPorServico
        : servico === "By Evuli"
          ? faturamentoPorServico
          : (() => {
              const match = faturamentoPorServico.find(
                (s) =>
                  s.servico.toLowerCase() === servico.toLowerCase() ||
                  // aceita variações (ex.: "Nutrologia 2" contém "Nutrologia")
                  s.servico.toLowerCase().includes(servico.toLowerCase())
              );
              return match ? [match] : [];
            })();

    // ---------- Série mensal (faturamento vs meta) ----------
    const serieMensal = (() => {
      // Filtra por ano: m.mes = "Dez 2025", "Jan 2026" — pega o último token
      const data = faturamentoMensal.filter((m) => {
        const anoEntry = m.mes.split(" ").pop();
        return Number(anoEntry) === ano;
      });
      if (mes === "Todos") return data;
      return data.filter((m) => {
        const nomeMes = m.mes.split(" ")[0].toLowerCase();
        return nomeMes === mes.toLowerCase();
      });
    })();

    // ---------- Funis por profissional (filtrar por serviço) ----------
    const funisFiltrados =
      servico === "Todos"
        ? funis
        : Object.fromEntries(
            Object.entries(funis).filter(([_, f]) =>
              f.servico.toLowerCase().includes(servico.toLowerCase())
            )
          );

    // ---------- Profissionais ----------
    const profissionaisFiltrados =
      servico === "Todos"
        ? profissionais
        : Object.fromEntries(
            Object.entries(profissionais).filter(([_, p]) =>
              p.servico.toLowerCase().includes(servico.toLowerCase())
            )
          );

    return {
      // derivados
      kpisGeral,
      indicacaoPacientes,
      // filtrados
      conversaoPorCanal: canalFiltrado,
      faturamentoPorCanal: fatCanalFiltrado,
      faturamentoPorServico: fatServicoFiltrado,
      faturamentoMensal: serieMensal,
      funis: funisFiltrados,
      profissionais: profissionaisFiltrados,
      // indicador de que algum filtro está ativo
      hasActiveFilter:
        ano !== 2026 || mes !== "Todos" || canal !== "Todos" || servico !== "Todos",
    };
  }, [filters]);
}
