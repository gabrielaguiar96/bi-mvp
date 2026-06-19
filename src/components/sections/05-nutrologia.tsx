"use client";

import { DollarSign, Ticket, Users, CalendarCheck } from "lucide-react";
import { SectionHeader } from "./section-header";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { KpiCard } from "@/components/charts/kpi-card";
import { BarChartCard } from "@/components/charts/bar-chart";
import { Badge } from "@/components/ui/badge";
import { funis, profissionais, metasPorIndicador } from "@/data/report";
import { useFilteredData } from "@/lib/use-filtered-data";
import { useFilters } from "@/lib/filters";
import { EmptyState } from "./empty-state";
import { FilterNotice } from "./filter-notice";
import { MetaTable } from "./meta-table";
import { formatBRL, formatNumber } from "@/lib/format";

const KEY = "Dr Fernando" as const;
const SERVICO = "Nutrologia";

export function NutrologiaSection() {
  const { faturamentoPorCanal, funis: funisFiltrados } = useFilteredData();
  const { filters, setFilters } = useFilters();

  // Se o filtro de serviço escondeu este profissional, mostra empty state
  const filterExclui = filters.servico !== "Todos" && !funisFiltrados[KEY];

  if (filterExclui) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Nutrologia"
          description={`Dr. ${KEY.replace("Dr ", "")} — serviço filtrado.`}
        />
        <FilterNotice ignore={["ano", "mes"]} />
        <EmptyState
          title="Sem dados para o serviço selecionado"
          description={`Os filtros ativos excluem ${SERVICO}. Limpe o filtro de serviço para ver os dados de Dr. Fernando.`}
          actionLabel="Limpar filtro de serviço"
          onAction={() => setFilters({ servico: "Todos" })}
        />
      </div>
    );
  }

  const pro = profissionais[KEY];
  const funil = funis[KEY].etapas;
  const barCanal = faturamentoPorCanal
    .filter((c) => c.faturamento > 0)
    .map((c) => ({ canal: c.canal, faturamento: Math.round(c.faturamento) }));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Nutrologia"
        description="Dr. Fernando — funil comercial, faturamento e indicadores do serviço."
      />
      <FilterNotice ignore={["ano", "mes"]} />

      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-primary/15 text-primary hover:bg-primary/20">
          Dr. Fernando
        </Badge>
        <Badge variant="secondary">Nutrologia</Badge>
      </div>

      {/* KPIs (rótulos alinhados com o original Power BI) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Faturamento dia"
          value={formatBRL(pro.faturamentoDia)}
          current={pro.faturamentoDia}
          previous={pro.faturamentoDiaLM}
          comparisonLabel="vs mês anterior"
          icon={DollarSign}
        />
        <KpiCard
          label="Faturamento Protocolo"
          value={formatBRL(pro.faturamentoProtocolo)}
          icon={DollarSign}
        />
        <KpiCard
          label="Ticket Médio Upsell"
          value={formatBRL(pro.ticketMedioUpsell)}
          current={pro.ticketMedioUpsell}
          previous={pro.ticketMedioUpsellLM}
          comparisonLabel="vs mês anterior"
          icon={Ticket}
        />
        <KpiCard
          label="Total de Leads"
          value={formatNumber(pro.totalLeads)}
          current={pro.totalLeads}
          previous={pro.totalLeadsLM}
          comparisonLabel="vs mês anterior"
          icon={Users}
        />
      </div>

      {/* Funil + faturamento por canal */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FunnelChart
          title="Funil — Dr. Fernando"
          steps={funil}
          format={formatNumber}
        />
        <BarChartCard
          title="Faturamento por Canal"
          data={barCanal}
          xKey="canal"
          layout="horizontal"
          series={[
            { key: "faturamento", label: "Faturamento", format: formatBRL },
          ]}
        />
      </div>

      {/* Tabela de metas por indicador (dados granulares do Power BI) */}
      <MetaTable
        title="Metas por Indicador — Dr. Fernando"
        rows={metasPorIndicador.detalhePorProfissional[KEY]}
        valueIsCurrency
      />
    </div>
  );
}
