"use client";

import { useMemo } from "react";
import { DollarSign, Syringe, Ticket, Users, CalendarCheck } from "lucide-react";
import { SectionHeader } from "./section-header";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { KpiCard } from "@/components/charts/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { funis, profissionais, metasPorIndicador } from "@/data/report";
import { useFilteredData } from "@/lib/use-filtered-data";
import { useFilters } from "@/lib/filters";
import { EmptyState } from "./empty-state";
import { FilterNotice } from "./filter-notice";
import { MetaTable } from "./meta-table";
import { formatBRL, formatNumber } from "@/lib/format";

const KEY = "Dra Isa" as const;
const SERVICO = "Pediatria";

export function PediatriaSection() {
  const { funis: funisFiltrados } = useFilteredData();
  const { filters, setFilters } = useFilters();

  const filterExclui = filters.servico !== "Todos" && !funisFiltrados[KEY];

  if (filterExclui) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Pediatria"
          description="Dra. Isa — serviço filtrado."
        />
        <FilterNotice ignore={["ano", "mes", "canal"]} />
        <EmptyState
          title="Sem dados para o serviço selecionado"
          description={`Os filtros ativos excluem ${SERVICO}. Limpe o filtro de serviço para ver os dados de Dra. Isa.`}
          actionLabel="Limpar filtro de serviço"
          onAction={() => setFilters({ servico: "Todos" })}
        />
      </div>
    );
  }

  const pro = profissionais[KEY];
  const funil = funis[KEY].etapas;

  // Extrair marcações por canal de metasPorIndicador (indicadores "Marcação - X")
  const marcacoesPorCanal = useMemo(() => {
    const indicadores = metasPorIndicador.detalhePorProfissional[KEY];
    return indicadores
      .filter((ind) => ind.indicador.startsWith("Marcação -"))
      .map((ind) => ({
        canal: ind.indicador.replace("Marcação - ", ""),
        realizado: ind.realizado,
        meta: ind.meta,
      }));
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Pediatria"
        description="Dra. Isa — funil comercial e indicadores do serviço."
      />
      <FilterNotice ignore={["ano", "mes", "canal"]} />

      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-primary/15 text-primary hover:bg-primary/20">
          Dra. Isa
        </Badge>
        <Badge variant="secondary">Pediatria</Badge>
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
          label="Faturamento Vacina"
          value={formatBRL(pro.faturamentoVacina)}
          current={pro.faturamentoVacina}
          previous={pro.faturamentoVacinaLM}
          comparisonLabel="vs mês anterior"
          icon={Syringe}
        />
        <KpiCard
          label="Ticket Médio Geral"
          value={formatBRL(pro.ticketMedioGeral)}
          current={pro.ticketMedioGeral}
          previous={pro.ticketMedioGeralLM}
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

      {/* Funil + tabela de metas por indicador */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FunnelChart
          title="Funil — Dra. Isa"
          steps={funil}
          format={formatNumber}
        />
        <Card className="glass">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">
              Marcações por canal (mês atual)
            </h3>
            <div className="mt-4 space-y-3">
              {marcacoesPorCanal.map((row) => (
                <div
                  key={row.canal}
                  className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-sm text-muted-foreground">{row.canal}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tabular">{row.realizado}</span>
                    <span className="text-xs tabular text-muted-foreground">
                      / {row.meta}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <MetaTable
        title="Metas por Indicador — Dra. Isa"
        rows={metasPorIndicador.detalhePorProfissional[KEY]}
        valueIsCurrency
      />
    </div>
  );
}
