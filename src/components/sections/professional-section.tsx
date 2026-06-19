"use client";

import type { LucideIcon } from "lucide-react";
import { SectionHeader } from "./section-header";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { KpiCard } from "@/components/charts/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { funis, profissionais, metasPorIndicador, conversaoPorCanalProfissional, ticketMedioPeriodo, faturamentoPeriodo } from "@/data/report";
import { useFilteredData } from "@/lib/use-filtered-data";
import { useFilters } from "@/lib/filters";
import { EmptyState } from "./empty-state";
import { MetaTable } from "./meta-table";
import { formatBRL, formatNumber, formatPct } from "@/lib/format";

type KpiConfig = {
  label: string;
  valueKey: string;
  comparisonKey?: string;
  icon: LucideIcon;
  format?: (n: number) => string;
};

type ProfessionalSectionProps = {
  profKey: string;
  servico: string;
  description: string;
  kpis: KpiConfig[];
  extra?: React.ReactNode;
  /** Banner informativo sobre filtros que não se aplicam */
  notice?: React.ReactNode;
};

export function ProfessionalSection({
  profKey,
  servico,
  description,
  kpis,
  extra,
  notice,
}: ProfessionalSectionProps) {
  const { funis: funisFiltrados } = useFilteredData();
  const { filters, setFilters } = useFilters();

  const filterExclui = filters.servico !== "Todos" && !funisFiltrados[profKey as keyof typeof funisFiltrados];

  if (filterExclui) {
    return (
      <div className="space-y-6">
        <SectionHeader title={servico} description={`${profKey} — serviço filtrado.`} />
        <EmptyState
          title="Sem dados para o serviço selecionado"
          description={`Os filtros ativos excluem ${servico}. Limpe o filtro de serviço para ver os dados de ${profKey}.`}
          actionLabel="Limpar filtro de serviço"
          onAction={() => setFilters({ servico: "Todos" })}
        />
      </div>
    );
  }

  const pro = profissionais[profKey as keyof typeof profissionais];
  const funil = funis[profKey as keyof typeof funis]?.etapas ?? [];
  const metas = metasPorIndicador.detalhePorProfissional[profKey as keyof typeof metasPorIndicador.detalhePorProfissional] ?? [];
  const canalConv = conversaoPorCanalProfissional[profKey as keyof typeof conversaoPorCanalProfissional] || [];
  const tmPeriodo = ticketMedioPeriodo[profKey as keyof typeof ticketMedioPeriodo];
  const fatPeriodo = faturamentoPeriodo[profKey as keyof typeof faturamentoPeriodo];
  const totalLeadsCanal = canalConv.reduce((s, c) => s + c.leads, 0);

  return (
    <div className="space-y-6">
      <SectionHeader title={servico} description={description} />

      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-primary/15 text-primary hover:bg-primary/20">
          {profKey}
        </Badge>
        <Badge variant="secondary">{servico}</Badge>
      </div>

      {notice}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const record = pro as Record<string, unknown>;
          const value = record[kpi.valueKey] as number;
          const previous = kpi.comparisonKey
            ? (record[kpi.comparisonKey] as number)
            : undefined;
          return (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={(kpi.format ?? formatBRL)(value)}
              current={value}
              previous={previous}
              comparisonLabel={previous !== undefined ? "vs mês anterior" : undefined}
              icon={kpi.icon}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FunnelChart title={`Funil — ${profKey}`} steps={funil} format={formatNumber} />
        {extra}
      </div>

      {/* Ticket Médio + Faturamento por Período */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="glass">
          <CardContent className="p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Ticket Médio por Período
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular">
                {formatBRL(tmPeriodo.atual)}
              </span>
              <span className="text-xs text-muted-foreground">{tmPeriodo.periodo}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Faturamento por Período
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular">
                {formatBRL(fatPeriodo.atual)}
              </span>
              <span className="text-xs text-muted-foreground">{fatPeriodo.periodo}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversão por canal */}
      {canalConv.length > 0 && (
        <Card className="glass">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              Conversão por Canal — {profKey}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Canal</th>
                    <th className="pb-2 pr-4 text-right font-medium">Leads</th>
                    <th className="pb-2 pr-4 text-right font-medium">Marcados</th>
                    <th className="pb-2 text-right font-medium">Conversão</th>
                  </tr>
                </thead>
                <tbody>
                  {canalConv.map((c) => (
                    <tr key={c.canal} className="border-b border-border/40 last:border-0">
                      <td className="py-2.5 pr-4 font-medium">{c.canal}</td>
                      <td className="py-2.5 pr-4 text-right tabular">{formatNumber(c.leads)}</td>
                      <td className="py-2.5 pr-4 text-right tabular">{formatNumber(c.marcados)}</td>
                      <td className="py-2.5 text-right tabular">
                        <span className={c.conversao >= 0.2 ? "text-positive" : c.conversao > 0 ? "text-muted-foreground" : "text-negative"}>
                          {formatPct(c.conversao)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-border font-medium">
                    <td className="py-2.5 pr-4">Total</td>
                    <td className="py-2.5 pr-4 text-right tabular">{formatNumber(totalLeadsCanal)}</td>
                    <td className="py-2.5 pr-4 text-right tabular">{formatNumber(canalConv.reduce((s, c) => s + c.marcados, 0))}</td>
                    <td className="py-2.5 text-right tabular">
                      {formatPct(totalLeadsCanal > 0 ? canalConv.reduce((s, c) => s + c.marcados, 0) / totalLeadsCanal : 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <MetaTable title={`Metas por Indicador — ${profKey}`} rows={metas} />
    </div>
  );
}
