"use client";

import { useMemo } from "react";
import {
  DollarSign,
  Receipt,
  CalendarCheck,
  Repeat,
  Percent,
  Ticket,
} from "lucide-react";
import { SectionHeader } from "./section-header";
import { KpiCard } from "@/components/charts/kpi-card";
import { DonutChartCard } from "@/components/charts/donut-chart";
import { BarChartCard } from "@/components/charts/bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ticketMedioServico,
  dadosPorServico,
} from "@/data/report";
import { useFilteredData, isKpiUnavailable } from "@/lib/use-filtered-data";
import { PartialMonthNotice, Month2025Notice, ComboPartialNotice } from "./filter-notice";
import { formatBRL, formatNumber, formatPct } from "@/lib/format";

export function GeralSection() {
  const { kpisGeral, faturamentoPorCanal, faturamentoPorServico, filterMeta, comparisonLabel } = useFilteredData();

  // Helper: check if a KPI is unavailable for the current filter
  const isUnavailable = (key: string) => isKpiUnavailable(filterMeta, key as never);
  const donutCanal = useMemo(
    () => faturamentoPorCanal
      .filter((c) => c.faturamento > 0)
      .map((c) => ({ name: c.canal, value: c.faturamento })),
    [faturamentoPorCanal]
  );

  const barCanal = useMemo(
    () => faturamentoPorCanal.map((c) => ({
      canal: c.canal,
      ticket: Math.round(c.ticketMedio),
    })),
    [faturamentoPorCanal]
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Indicadores Gerais"
        description="Visão consolidada com comparativos frente ao mês e ano anteriores."
      />
      <PartialMonthNotice />
      <Month2025Notice />
      <ComboPartialNotice />

      {/* KPIs com comparativo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Faturamento"
          value={formatBRL(kpisGeral.faturamento.atual)}
          current={kpisGeral.faturamento.atual}
          previous={kpisGeral.faturamento.mesAnterior}
          comparisonLabel={comparisonLabel}
          icon={DollarSign}
          unavailable={isUnavailable("faturamento")}
          unavailableMessage="Não disponível para filtro selecionado"
        />
        <KpiCard
          label="Ticket Médio (Consultas)"
          value={formatBRL(kpisGeral.ticketMedioConsultas.atual)}
          current={kpisGeral.ticketMedioConsultas.atual}
          previous={kpisGeral.ticketMedioConsultas.mesAnterior}
          comparisonLabel={comparisonLabel}
          icon={Receipt}
          unavailable={isUnavailable("ticketMedioConsultas")}
          unavailableMessage="Não disponível para filtro selecionado"
        />
        <KpiCard
          label="Ocupação de Agenda"
          value={formatNumber(kpisGeral.ocupacaoAgenda.atual)}
          current={kpisGeral.ocupacaoAgenda.atual}
          previous={kpisGeral.ocupacaoAgenda.mesAnterior}
          comparisonLabel={comparisonLabel}
          icon={CalendarCheck}
          unavailable={isUnavailable("ocupacaoAgenda")}
          unavailableMessage="Não disponível por canal/serviço"
        />
        <KpiCard
          label="Comparecidos"
          value={formatNumber(kpisGeral.comparecidos.atual)}
          current={kpisGeral.comparecidos.atual}
          previous={kpisGeral.comparecidos.mesAnterior}
          comparisonLabel={comparisonLabel}
          icon={CalendarCheck}
          unavailable={isUnavailable("comparecidos")}
          unavailableMessage="Não disponível por canal/serviço"
        />
        <KpiCard
          label="Qtd Upsell"
          value={formatNumber(kpisGeral.qtdUpsell.atual)}
          icon={Repeat}
          unavailable={isUnavailable("qtdUpsell")}
          unavailableMessage="Não disponível por canal/serviço"
        />
        <KpiCard
          label="Taxa de Conversão Total"
          value={formatPct(kpisGeral.taxaConversaoTotal.atual)}
          icon={Percent}
          unavailable={isUnavailable("taxaConversaoTotal")}
          unavailableMessage="Não disponível por serviço"
        />
      </div>

      {/* Distribuições */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DonutChartCard
          title="Faturamento por Canal"
          data={donutCanal}
          centerLabel="Total"
          centerValue={formatBRL(
            faturamentoPorCanal.reduce((s, c) => s + c.faturamento, 0)
          ).replace("R$", "").trim()}
          valueFormat={formatBRL}
        />
        <BarChartCard
          title="Ticket Médio por Canal"
          data={barCanal}
          xKey="canal"
          layout="horizontal"
          series={[
            { key: "ticket", label: "Ticket Médio", format: formatBRL },
          ]}
        />
      </div>

      {/* Serviços detalhe */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChartCard
          title="Faturamento por Serviço"
          data={faturamentoPorServico.map((s) => ({
            servico: s.servico,
            faturamento: Math.round(s.faturamento),
          }))}
          xKey="servico"
          series={[
            { key: "faturamento", label: "Faturamento", format: formatBRL },
          ]}
          height={300}
        />

        {/* Ticket Médio por Serviço — dados do período (snapshot) */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Ticket className="size-4" />
              Ticket Médio por Serviço
              <span className="ml-auto text-[10px] font-normal text-muted-foreground/60">acumulado 2026</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular">
                {formatBRL(ticketMedioServico.geral)}
              </span>
              <span className="text-xs text-muted-foreground">Geral</span>
            </div>
            <div className="space-y-3">
              {Object.entries(ticketMedioServico.porServico).map(
                ([servico, valor]) => {
                  // Fallback: use ticketMedioConsultas from dadosPorServico when ticketMedioServico is 0
                  const ds = dadosPorServico[servico as keyof typeof dadosPorServico];
                  const displayValor = valor > 0 ? valor : (ds?.ticketMedioConsultas ?? 0);
                  return (
                    <div
                      key={servico}
                      className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-sm text-muted-foreground">
                        {servico}
                      </span>
                      <span className="font-semibold tabular">
                        {displayValor > 0 ? formatBRL(displayValor) : "—"}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela consolidada por serviço — dados do período (snapshot) */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            Dados Consolidados por Serviço
            <span className="ml-auto text-[10px] font-normal text-muted-foreground/60">acumulado 2026</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Serviço</th>
                  <th className="pb-2 pr-4 text-right font-medium">Faturamento</th>
                  <th className="pb-2 pr-4 text-right font-medium">Ticket Médio Serviço</th>
                  <th className="pb-2 pr-4 text-right font-medium">Ticket Médio Consultas</th>
                  <th className="pb-2 text-right font-medium">Leads</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(dadosPorServico).map(([servico, dados]) => (
                  <tr
                    key={servico}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="py-2.5 pr-4 font-medium">{servico}</td>
                    <td className="py-2.5 pr-4 text-right tabular">
                      {formatBRL(dados.faturamento)}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular">
                      {dados.ticketMedioServico > 0
                        ? formatBRL(dados.ticketMedioServico)
                        : "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular">
                      {dados.ticketMedioConsultas
                        ? formatBRL(dados.ticketMedioConsultas)
                        : "—"}
                    </td>
                    <td className="py-2.5 text-right tabular">
                      {dados.leads != null ? formatNumber(dados.leads) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
