"use client";

import { useMemo } from "react";
import { DollarSign, Ticket, Users } from "lucide-react";
import { ProfessionalSection } from "./professional-section";
import { FilterNotice } from "./filter-notice";
import { BarChartCard } from "@/components/charts/bar-chart";
import { useFilteredData } from "@/lib/use-filtered-data";
import { formatBRL, formatNumber } from "@/lib/format";

export function NutrologiaSection() {
  const { faturamentoPorCanal } = useFilteredData();

  const barCanal = useMemo(
    () => faturamentoPorCanal
      .filter((c) => c.faturamento > 0)
      .map((c) => ({ canal: c.canal, faturamento: Math.round(c.faturamento) })),
    [faturamentoPorCanal]
  );

  return (
    <ProfessionalSection
      profKey="Dr Fernando"
      servico="Nutrologia"
      description="Dr. Fernando — funil comercial, faturamento e indicadores do serviço."
      notice={<FilterNotice ignore={["mes", "ano"]} />}
      kpis={[
        { label: "Faturamento Mensal", valueKey: "faturamentoDia", comparisonKey: "faturamentoDiaLM", icon: DollarSign },
        { label: "Faturamento Protocolo", valueKey: "faturamentoProtocolo", icon: DollarSign },
        { label: "Ticket Médio Upsell", valueKey: "ticketMedioUpsell", comparisonKey: "ticketMedioUpsellLM", icon: Ticket },
        { label: "Total de Leads", valueKey: "totalLeads", comparisonKey: "totalLeadsLM", icon: Users, format: formatNumber },
      ]}
      extra={
        <BarChartCard
          title="Faturamento por Canal"
          data={barCanal}
          xKey="canal"
          layout="horizontal"
          series={[{ key: "faturamento", label: "Faturamento", format: formatBRL }]}
        />
      }
    />
  );
}
