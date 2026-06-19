"use client";

import { useMemo } from "react";
import { DollarSign, Stethoscope, Users, CalendarCheck } from "lucide-react";
import { ProfessionalSection } from "./professional-section";
import { FilterNotice } from "./filter-notice";
import { BarChartCard } from "@/components/charts/bar-chart";
import { metasPorIndicador } from "@/data/report";
import { formatBRL, formatNumber } from "@/lib/format";

const KEY = "Dra Thaís" as const;

export function DermatologiaSection() {
  const fatPorProtocolo = useMemo(
    () => metasPorIndicador.detalhePorProfissional[KEY]
      .filter((ind) => ind.indicador.startsWith("Fat."))
      .map((ind) => ({
        protocolo: ind.indicador.replace("Fat. ", ""),
        valor: Math.round(ind.realizado),
      })),
    []
  );

  return (
    <ProfessionalSection
      profKey="Dra Thaís"
      servico="Dermatologia"
      description="Dra. Thaís — funil comercial, ticket médio e faturamento por protocolo."
      notice={<FilterNotice ignore={["mes", "ano"]} />}
      kpis={[
        { label: "Faturamento Mensal", valueKey: "faturamentoDia", comparisonKey: "faturamentoDiaLM", icon: DollarSign },
        { label: "Ticket Médio Consulta", valueKey: "ticketMedioConsulta", comparisonKey: "ticketMedioConsultaLM", icon: Stethoscope },
        { label: "Quantidade Consultas", valueKey: "quantidadeConsultas", comparisonKey: "quantidadeConsultasLM", icon: Users, format: formatNumber },
        { label: "Marcações", valueKey: "marcacoes", comparisonKey: "marcacoesLM", icon: CalendarCheck, format: formatNumber },
      ]}
      extra={
        fatPorProtocolo.length > 0 ? (
          <BarChartCard
            title="Faturamento por Protocolo"
            data={fatPorProtocolo}
            xKey="protocolo"
            layout="horizontal"
            series={[{ key: "valor", label: "Faturamento", format: formatBRL }]}
            height={260}
          />
        ) : undefined
      }
    />
  );
}
