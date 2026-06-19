"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  Users,
  Target,
  SlidersHorizontal,
} from "lucide-react";
import { SectionHeader } from "./section-header";
import { KpiCard } from "@/components/charts/kpi-card";
import { MetaProgress } from "@/components/charts/meta-progress";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  kpisGeral,
} from "@/data/report";
import { useFilteredData } from "@/lib/use-filtered-data";
import { FilterNotice } from "./filter-notice";
import {
  formatBRL,
  formatBRLCompact,
  formatNumber,
  formatPct,
} from "@/lib/format";

export function VisaoGeralSection() {
  const { conversaoPorCanal, faturamentoPorServico } = useFilteredData();

  // Simulator state — replicates the Power BI simulator:
  // base = 100 leads -> 5 marcados (taxa 5%) -> R$ 6.404,23 faturamento
  const [leads, setLeads] = useState(100);

  const { marcados, faturamento } = useMemo(() => {
    // taxa de conversão leads->marcados = 5% (5 / 100)
    const marcados = Math.round(leads * 0.05);
    // ticket proporcional ao simulado original (6404.23 p/ 5 marcados)
    const ticket = 6404.2253 / 5;
    const faturamento = marcados * ticket;
    return { marcados, faturamento };
  }, [leads]);

  const totalLeadsCanal = conversaoPorCanal.reduce((s, c) => s + c.leads, 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Visão Geral"
        description="Simule o funil comercial e acompanhe os principais indicadores da Evuli."
      />
      <FilterNotice ignore={["ano", "mes"]} />

      {/* Top KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Faturamento"
          value={formatBRL(kpisGeral.faturamento.atual)}
          current={kpisGeral.faturamento.atual}
          previous={kpisGeral.faturamento.mesAnterior}
          icon={DollarSign}
          hint={`Meta: ${formatPct(kpisGeral.faturamento.pctMeta)}`}
        />
        <KpiCard
          label="Total de Leads"
          value={formatNumber(kpisGeral.totalLeads.atual)}
          current={kpisGeral.totalLeads.atual}
          previous={kpisGeral.totalLeads.mesAnterior}
          icon={Users}
        />
        <KpiCard
          label="Ocupação de Agenda"
          value={formatNumber(kpisGeral.ocupacaoAgenda.atual)}
          current={kpisGeral.ocupacaoAgenda.atual}
          previous={kpisGeral.ocupacaoAgenda.mesAnterior}
          icon={TrendingUp}
        />
        <KpiCard
          label="Taxa de Conversão Total"
          value={formatPct(kpisGeral.taxaConversaoTotal.atual)}
          icon={Target}
          hint="Leads → marcados"
        />
      </div>

      {/* Faturamento vs Meta — progresso */}
      <Card className="glass">
        <CardContent className="p-5">
          <MetaProgress
            label="Faturamento do Dia vs Meta"
            realizado={kpisGeral.faturamento.atual}
            meta={kpisGeral.faturamento.metaMes}
            format={formatBRL}
          />
        </CardContent>
      </Card>

      {/* Simulator + distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Simulator */}
        <Card className="glass lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-primary" />
              <h3 className="text-sm font-medium">Simulador de Funil</h3>
              <Badge variant="secondary" className="ml-auto">
                Interativo
              </Badge>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              <SimColumn
                label="Leads"
                value={leads}
                format={formatNumber}
                accent="var(--chart-1)"
              />
              <SimColumn
                label="Marcados"
                value={marcados}
                format={formatNumber}
                accent="var(--chart-2)"
                hint={`${formatPct(0.05)} taxa`}
              />
              <SimColumn
                label="Faturamento"
                value={faturamento}
                format={formatBRLCompact}
                accent="var(--chart-3)"
              />
            </div>

            {/* Slider */}
            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Simule a quantidade de Leads</span>
                <span className="font-semibold tabular">{leads}</span>
              </div>
              <Slider
                value={[leads]}
                onValueChange={(v) => setLeads(v[0])}
                min={0}
                max={300}
                step={1}
                aria-label="Quantidade de leads"
              />
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>0</span>
                <span>150</span>
                <span>300</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Serviços */}
        <Card className="glass">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">
              Faturamento por Serviço
            </h3>
            <div className="mt-4 space-y-3">
              {faturamentoPorServico.map((s, i) => {
                const total = faturamentoPorServico.reduce(
                  (sum, x) => sum + x.faturamento,
                  0
                );
                const pct = total > 0 ? (s.faturamento / total) * 100 : 0;
                const colors = [
                  "var(--chart-1)",
                  "var(--chart-2)",
                  "var(--chart-3)",
                ];
                return (
                  <div key={s.servico}>
                    <div className="mb-1 flex items-baseline justify-between text-sm">
                      <span className="truncate text-muted-foreground">
                        {s.servico}
                      </span>
                      <span className="font-medium tabular">
                        {formatBRL(s.faturamento)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: colors[i % colors.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel mini-table */}
      <Card className="glass">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Leads por Canal
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {conversaoPorCanal.map((c) => {
              const pct = totalLeadsCanal > 0 ? (c.leads / totalLeadsCanal) * 100 : 0;
              return (
                <div
                  key={c.canal}
                  className="rounded-lg border border-border/60 bg-muted/30 p-3"
                >
                  <p className="truncate text-xs text-muted-foreground">{c.canal}</p>
                  <p className="mt-1 text-lg font-semibold tabular">
                    {formatNumber(c.leads)}
                  </p>
                  <p className="text-[10px] tabular text-muted-foreground">
                    {pct.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SimColumn({
  label,
  value,
  format,
  accent,
  hint,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-muted/20 p-4">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <motion.p
        key={value}
        initial={{ opacity: 0.4, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="mt-2 text-2xl font-semibold tabular md:text-3xl"
      >
        {format(value)}
      </motion.p>
      {hint && (
        <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
