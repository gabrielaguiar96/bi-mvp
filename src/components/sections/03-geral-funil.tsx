"use client";

import { useMemo } from "react";
import { Filter, Target } from "lucide-react";
import { SectionHeader } from "./section-header";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { BarChartCard } from "@/components/charts/bar-chart";
import { KpiCard } from "@/components/charts/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { dadosPorCanal, metaLeadsCanal } from "@/data/report";
import { useFilteredData } from "@/lib/use-filtered-data";
import { useFilters } from "@/lib/filters";
import { PartialMonthNotice, Month2025Notice } from "./filter-notice";
import { formatBRL, formatNumber, formatPct } from "@/lib/format";

export function GeralFunilSection() {
  const { kpisGeral, conversaoPorCanal } = useFilteredData();
  const { filters } = useFilters();
  const hasCanal = filters.canal !== "Todos";

  // Funil comercial consolidado — usa kpisGeral (já filtrado pelo hook)
  const totalLeads = kpisGeral.totalLeads.atual;
  const totalMarcados = useMemo(() => conversaoPorCanal.reduce((s, c) => s + c.marcados, 0), [conversaoPorCanal]);
  const taxaConversao = totalLeads > 0 ? totalMarcados / totalLeads : 0;

  // Funil usa kpisGeral para manter consistência — quando canal está ativo,
  // os KPIs já vêm de dadosPorCanal (sem ocupação/comparecidos/upsell específicos),
  // então mostramos apenas Leads e Marcados para evitar valores crescentes no funil.
  const funilGeral = useMemo(() => {
    if (hasCanal) {
      // Canal ativo: só temos leads e marcados fiáveis por canal
      return [
        { label: "Leads", valor: totalLeads },
        { label: "Marcados", valor: totalMarcados },
      ];
    }
    return [
      { label: "Leads", valor: totalLeads },
      { label: "Ocupação de Agenda", valor: kpisGeral.ocupacaoAgenda.atual },
      { label: "Comparecidos", valor: kpisGeral.comparecidos.atual },
      { label: "Qtd Upsell", valor: kpisGeral.qtdUpsell.atual },
    ];
  }, [totalLeads, totalMarcados, kpisGeral, hasCanal]);

  const barConversao = useMemo(() => conversaoPorCanal
    .filter((c) => c.leads > 0)
    .map((c) => ({
      canal: c.canal,
      leads: c.leads,
      marcados: c.marcados,
      conversao: Math.round(c.conversao * 1000) / 10, // ex.: 91,9
    })), [conversaoPorCanal]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Funil Comercial"
        description="Da captação de leads ao upsell, com conversão detalhada por canal de aquisição."
      />
      <PartialMonthNotice />
      <Month2025Notice />

      {/* Resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Leads Totais"
          value={formatNumber(totalLeads)}
          icon={Filter}
        />
        <KpiCard
          label="Marcados Totais"
          value={formatNumber(totalMarcados)}
          icon={Filter}
        />
        <KpiCard
          label="Taxa de Conversão Geral"
          value={formatPct(taxaConversao)}
          icon={Target}
          hint={`${formatNumber(totalMarcados)} de ${formatNumber(totalLeads)} leads`}
        />
      </div>

      {/* Funil + conversão por canal */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FunnelChart
          title="Funil Comercial — Consolidado"
          steps={funilGeral}
          format={formatNumber}
          showConversion
        />

        <BarChartCard
          title="Conversão de Leads por Canal (%)"
          data={barConversao}
          xKey="canal"
          layout="horizontal"
          series={[
            {
              key: "conversao",
              label: "Conversão (%)",
              color: "var(--chart-1)",
              format: (n) => `${n.toLocaleString("pt-BR")}%`,
            },
          ]}
        />
      </div>

      {/* Detalhe por canal — tabela expandida com dados consolidados */}
      <Card className="glass">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Leads, Marcados e Conversão por Canal
          </h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Canal</th>
                  <th className="pb-2 pr-4 text-right font-medium">Faturamento</th>
                  <th className="pb-2 pr-4 text-right font-medium">Ticket Médio</th>
                  <th className="pb-2 pr-4 text-right font-medium">Leads</th>
                  <th className="pb-2 pr-4 text-right font-medium">Meta Leads</th>
                  <th className="pb-2 pr-4 text-right font-medium">Marcados</th>
                  <th className="pb-2 pr-4 text-right font-medium">Conversão</th>
                  <th className="pb-2 pr-4 text-right font-medium">Qtd Upsell</th>
                  <th className="pb-2 font-medium">Participação</th>
                </tr>
              </thead>
              <tbody>
                {conversaoPorCanal.map((c) => {
                  const dados = dadosPorCanal[c.canal as keyof typeof dadosPorCanal];
                  const metaLeads = metaLeadsCanal.porCanal[c.canal as keyof typeof metaLeadsCanal.porCanal];
                  const part = totalLeads > 0 ? (c.leads / totalLeads) * 100 : 0;
                  return (
                    <tr
                      key={c.canal}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="py-2.5 pr-4 font-medium">{c.canal}</td>
                      <td className="py-2.5 pr-4 text-right tabular">
                        {dados?.faturamento != null
                          ? formatBRL(dados.faturamento)
                          : "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular">
                        {dados?.ticketMedio != null && dados.ticketMedio > 0
                          ? formatBRL(dados.ticketMedio)
                          : "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular">
                        {formatNumber(c.leads)}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular text-muted-foreground">
                        {metaLeads != null ? formatNumber(metaLeads) : "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular">
                        {formatNumber(c.marcados)}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular">
                        <span
                          className={
                            c.conversao >= 0.2
                              ? "text-positive"
                              : c.conversao > 0
                                ? "text-muted-foreground"
                                : "text-negative"
                          }
                        >
                          {formatPct(c.conversao)}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular">
                        {dados?.conversaoUpsell != null
                          ? formatNumber(dados.conversaoUpsell)
                          : "—"}
                      </td>
                      <td className="py-2.5">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted/50">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${part}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
