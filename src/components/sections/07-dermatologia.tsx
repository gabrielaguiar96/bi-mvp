"use client";

import { DollarSign, Stethoscope, Users, CalendarCheck } from "lucide-react";
import { SectionHeader } from "./section-header";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { KpiCard } from "@/components/charts/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LineChartCard } from "@/components/charts/line-chart";
import { funis, profissionais, metasPorIndicador } from "@/data/report";
import { useFilteredData } from "@/lib/use-filtered-data";
import { useFilters } from "@/lib/filters";
import { EmptyState } from "./empty-state";
import { FilterNotice } from "./filter-notice";
import { MetaTable } from "./meta-table";
import { formatBRL, formatNumber } from "@/lib/format";

const KEY = "Dra Thaís" as const;
const SERVICO = "Dermatologia";

export function DermatologiaSection() {
  const { funis: funisFiltrados, faturamentoMensal } = useFilteredData();
  const { filters, setFilters } = useFilters();

  const filterExclui = filters.servico !== "Todos" && !funisFiltrados[KEY];

  if (filterExclui) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Dermatologia"
          description="Dra. Thaís — serviço filtrado."
        />
        <FilterNotice ignore={["canal"]} />
        <EmptyState
          title="Sem dados para o serviço selecionado"
          description={`Os filtros ativos excluem ${SERVICO}. Limpe o filtro de serviço para ver os dados de Dra. Thaís.`}
          actionLabel="Limpar filtro de serviço"
          onAction={() => setFilters({ servico: "Todos" })}
        />
      </div>
    );
  }

  const pro = profissionais[KEY];
  const funil = funis[KEY].etapas;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Dermatologia"
        description="Dra. Thaís — funil comercial, ticket médio e faturamento por período."
      />
      <FilterNotice ignore={["canal"]} />

      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-primary/15 text-primary hover:bg-primary/20">
          Dra. Thaís
        </Badge>
        <Badge variant="secondary">Dermatologia</Badge>
      </div>

      {/* KPIs (rótulos alinhados com o Power BI) */}
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
          label="Ticket Médio Consulta"
          value={formatBRL(pro.ticketMedioConsulta)}
          current={pro.ticketMedioConsulta}
          previous={pro.ticketMedioConsultaLM}
          comparisonLabel="vs mês anterior"
          icon={Stethoscope}
        />
        <KpiCard
          label="Quantidade Consultas"
          value={formatNumber(pro.quantidadeConsultas)}
          current={pro.quantidadeConsultas}
          previous={pro.quantidadeConsultasLM}
          comparisonLabel="vs mês anterior"
          icon={Users}
        />
        <KpiCard
          label="Marcações"
          value={formatNumber(pro.marcacoes)}
          current={pro.marcacoes}
          previous={pro.marcacoesLM}
          comparisonLabel="vs mês anterior"
          icon={CalendarCheck}
        />
      </div>

      {/* Funil + evolução mensal */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FunnelChart
          title="Funil — Dra. Thaís"
          steps={funil}
          format={formatNumber}
        />
        {faturamentoMensal.length > 0 ? (
          <LineChartCard
            title="Faturamento por Período"
            data={faturamentoMensal.map((m) => ({
              mes: m.mes,
              faturamento: Math.round(m.realizado),
            }))}
            xKey="mes"
            area
            series={[
              { key: "faturamento", label: "Faturamento", format: formatBRL },
            ]}
          />
        ) : (
          <Card className="glass">
            <CardContent className="flex h-full min-h-[200px] items-center justify-center text-sm text-muted-foreground">
              Nenhum mês no período selecionado
            </CardContent>
          </Card>
        )}
      </div>

      <MetaTable
        title="Metas por Indicador — Dra. Thaís"
        rows={metasPorIndicador.detalhePorProfissional[KEY]}
        valueIsCurrency
      />
    </div>
  );
}
