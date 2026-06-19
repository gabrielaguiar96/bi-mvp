"use client";

import { DollarSign, Users, CalendarCheck, TrendingUp, Database, CalendarRange } from "lucide-react";
import { SectionHeader } from "./section-header";
import { KpiCard } from "@/components/charts/kpi-card";
import { LineChartCard } from "@/components/charts/line-chart";
import { BarChartCard } from "@/components/charts/bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  anual,
  faturamentoMensal2026,
  faturamentoPorCanalAno,
  meta,
  extractionMeta,
} from "@/data/report";
import { formatBRL, formatNumber } from "@/lib/format";

export function ResumoAnualSection() {
  // Dados anuais comparativos
  const y2025 = anual["2025"];
  const y2026 = anual["2026"];

  // Faturamento por canal 2026 (converter objeto em array para o BarChart)
  const canalAno = Object.entries(faturamentoPorCanalAno["2026"]).map(
    ([canal, valor]) => ({
      canal,
      faturamento: Math.round(valor),
    })
  );

  // Faturamento mensal 2026 para o gráfico de linhas
  const serieMensal = faturamentoMensal2026.map((m) => ({
    mes: m.mes,
    faturamento: Math.round(m.valor),
  }));

  // Média mensal 2026
  const mediaMensal2026 =
    faturamentoMensal2026.length > 0
      ? y2026.faturamento / faturamentoMensal2026.length
      : 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Resumo Anual"
        description="Comparativo 2025 vs 2026 acumulado e detalhamento mensal do ano corrente."
      />

      {/* KPIs comparativos 2025 vs 2026 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Faturamento"
          value={formatBRL(y2026.faturamento)}
          current={y2026.faturamento}
          previous={y2025.faturamento}
          comparisonLabel="vs 2025 total"
          icon={DollarSign}
          hint={`2025: ${formatBRL(y2025.faturamento)}`}
        />
        <KpiCard
          label="Total Leads"
          value={formatNumber(y2026.leads)}
          current={y2026.leads}
          previous={y2025.leads}
          comparisonLabel="vs 2025 total"
          icon={Users}
          hint={`2025: ${formatNumber(y2025.leads)}`}
        />
        <KpiCard
          label="Ocupação Agenda"
          value={formatNumber(y2026.ocupacaoAgenda)}
          current={y2026.ocupacaoAgenda}
          previous={y2025.ocupacaoAgenda}
          comparisonLabel="vs 2025 total"
          icon={CalendarCheck}
          hint={`2025: ${formatNumber(y2025.ocupacaoAgenda)}`}
        />
        <KpiCard
          label="Comparecidos"
          value={formatNumber(y2026.comparecidos)}
          current={y2026.comparecidos}
          previous={y2025.comparecidos}
          comparisonLabel="vs 2025 total"
          icon={TrendingUp}
          hint={`2025: ${formatNumber(y2025.comparecidos)}`}
        />
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="glass">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              % Meta 2026
            </p>
            <p className="mt-2 text-3xl font-semibold tabular text-primary">
              {(y2026.pctMeta * 100).toLocaleString("pt-BR", {
                maximumFractionDigits: 1,
              })}
              %
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Acumulado até o mês corrente
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Média Mensal 2026
            </p>
            <p className="mt-2 text-3xl font-semibold tabular">
              {formatBRL(mediaMensal2026)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {faturamentoMensal2026.length} meses de dados
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              % Meta 2025
            </p>
            <p className="mt-2 text-3xl font-semibold tabular text-positive">
              {(y2025.pctMeta * 100).toLocaleString("pt-BR", {
                maximumFractionDigits: 1,
              })}
              %
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ano completo — meta batida
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de faturamento mensal 2026 */}
      <LineChartCard
        title="Faturamento Mensal — 2026"
        data={serieMensal}
        xKey="mes"
        area
        height={340}
        series={[
          {
            key: "faturamento",
            label: "Faturamento",
            color: "var(--chart-1)",
            format: formatBRL,
          },
        ]}
      />

      {/* Faturamento por canal em 2026 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChartCard
          title="Faturamento por Canal — 2026"
          data={canalAno}
          xKey="canal"
          layout="horizontal"
          series={[
            {
              key: "faturamento",
              label: "Faturamento",
              color: "var(--chart-1)",
              format: formatBRL,
            },
          ]}
          height={300}
        />

        {/* Tabela detalhada por canal */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ranking por Canal — 2026
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Canal</th>
                    <th className="pb-2 pr-4 text-right font-medium">Faturamento</th>
                    <th className="pb-2 text-right font-medium">% Total</th>
                  </tr>
                </thead>
                <tbody>
                  {canalAno
                    .sort((a, b) => b.faturamento - a.faturamento)
                    .map((c) => {
                      const total = canalAno.reduce((s, x) => s + x.faturamento, 0);
                      const pct = total > 0 ? (c.faturamento / total) * 100 : 0;
                      return (
                        <tr
                          key={c.canal}
                          className="border-b border-border/40 last:border-0"
                        >
                          <td className="py-2.5 pr-4 font-medium">{c.canal}</td>
                          <td className="py-2.5 pr-4 text-right tabular">
                            {formatBRL(c.faturamento)}
                          </td>
                          <td className="py-2.5 text-right tabular">
                            {pct.toLocaleString("pt-BR", {
                              maximumFractionDigits: 1,
                            })}
                            %
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

      {/* Metadados da extração */}
      <Card className="glass">
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Database className="size-3" />
            Extraído via {extractionMeta.method}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarRange className="size-3" />
            Snapshot: {extractionMeta.capturedAt}
          </span>
          <span>
            {extractionMeta.querydataResponses} respostas Playwright +{" "}
            {extractionMeta.apiQueries} queries API
          </span>
          <span>{extractionMeta.uniqueMeasures} measures únicas</span>
          <span className="ml-auto">
            <Badge variant="secondary">{meta.snapshotLabel}</Badge>
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
