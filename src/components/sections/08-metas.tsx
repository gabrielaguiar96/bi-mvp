"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, Target, TrendingUp } from "lucide-react";
import { SectionHeader } from "./section-header";
import { LineChartCard } from "@/components/charts/line-chart";
import { KpiCard } from "@/components/charts/kpi-card";
import { MetaProgress } from "@/components/charts/meta-progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { metasPorIndicador } from "@/data/report";
import { useFilteredData } from "@/lib/use-filtered-data";
import { useFilters } from "@/lib/filters";
import { formatBRL, formatNumber, formatPct } from "@/lib/format";
import { FilterNotice, PartialMonthNotice } from "./filter-notice";

type ProfKey = keyof typeof metasPorIndicador.detalhePorProfissional;

const PROFS: { key: ProfKey; label: string }[] = [
  { key: "Dr Fernando", label: "Dr Fernando" },
  { key: "Dra Isa", label: "Dra Isa" },
  { key: "Dra Thaís", label: "Dra Thaís" },
];

/** Indicadores de faturamento que devem ser formatados como moeda */
const CURRENCY_INDICATORS = [
  "Faturamento do dia",
  "Faturamento Mensal",
  "Fat.",
  "Ticket Médio",
];

function indicatorFormat(indicador: string) {
  return CURRENCY_INDICATORS.some((k) => indicador.startsWith(k) || indicador.includes(k))
    ? formatBRL
    : formatNumber;
}

export function MetasSection() {
  const { kpisGeral, faturamentoMensal } = useFilteredData();
  const { filters } = useFilters();
  const [activeTab, setActiveTab] = useState<ProfKey>("Dr Fernando");

  const hasMes = filters.mes !== "Todos";

  // faturamentoMensal tem labels corrigidos e meta incluída
  const lineData = faturamentoMensal.map((m) => ({
    mes: m.mes,
    realizado: Math.round(m.realizado),
    meta: m.meta,
  }));

  const acumulado = faturamentoMensal.reduce((s, m) => s + m.realizado, 0);
  const mesesNoAlvo = faturamentoMensal.filter(
    (m) => m.realizado >= m.meta
  ).length;

  const bateram = useMemo(() => {
    return Object.entries(metasPorIndicador.detalhePorProfissional).flatMap(
      ([prof, indicadores]) =>
        indicadores
          .filter((ind) => ind.meta > 0 && ind.pctMeta >= 1)
          .map((ind) => `${ind.indicador} (${prof})`)
    );
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Metas & Desempenho"
        description="Faturamento realizado vs meta ao longo dos meses e indicadores que bateram a meta."
      />
      <FilterNotice ignore={["canal", "servico"]} />
      <PartialMonthNotice />

      {/* KPIs resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={hasMes ? "% Meta do Mês" : "% Meta Acumulada"}
          value={formatPct(kpisGeral.faturamento.pctMeta)}
          icon={Target}
          hint={`${hasMes ? "Meta mensal" : "Meta acumulada"}: ${formatBRL(kpisGeral.faturamento.metaMes)}`}
        />
        <KpiCard
          label="Meses no alvo"
          value={`${mesesNoAlvo}/${faturamentoMensal.length}`}
          icon={TrendingUp}
          hint="Realizado ≥ meta"
        />
        <KpiCard
          label="Indicadores no alvo"
          value={formatNumber(bateram.length)}
          icon={CheckCircle2}
        />
        <KpiCard
          label="Acumulado realizado"
          value={formatBRL(acumulado)}
          icon={Target}
          hint={`${faturamentoMensal.length} meses`}
        />
      </div>

      {/* Série histórica — Realizado vs Meta */}
      <LineChartCard
        title="Faturamento Realizado vs Meta por Mês"
        data={lineData}
        xKey="mes"
        height={340}
        series={[
          {
            key: "realizado",
            label: "Realizado",
            color: "var(--chart-1)",
            format: formatBRL,
          },
          {
            key: "meta",
            label: "Meta",
            color: "var(--chart-4)",
            format: formatBRL,
          },
        ]}
      />

      {/* Indicadores */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center gap-2">
            <CheckCircle2 className="size-4 text-positive" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Indicadores que bateram a meta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72 pr-3">
              <ul className="space-y-1.5">
                {bateram.map((ind) => (
                  <li
                    key={ind}
                    className="flex items-center gap-2 rounded-md bg-positive/5 px-3 py-2 text-sm"
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-positive" />
                    <span className="truncate">{ind}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center gap-2">
            <Target className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Detalhe — Realizado vs Meta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as ProfKey)}
            >
              <TabsList className="mb-4">
                {PROFS.map((p) => (
                  <TabsTrigger key={p.key} value={p.key} className="text-xs">
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {PROFS.map((p) => (
                <TabsContent key={p.key} value={p.key}>
                  <ScrollArea className="h-72 pr-3">
                    <div className="space-y-4">
                      {metasPorIndicador.detalhePorProfissional[p.key].map(
                        (d) => (
                          <MetaProgress
                            key={d.indicador}
                            label={d.indicador}
                            realizado={d.realizado}
                            meta={d.meta}
                            format={indicatorFormat(d.indicador)}
                          />
                        )
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Legenda de status */}
      <Card className="glass">
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-positive" /> Meta atingida
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-negative" /> Abaixo da meta
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <XCircle className="size-3" />
            Acumulado {faturamentoMensal.length} meses
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
