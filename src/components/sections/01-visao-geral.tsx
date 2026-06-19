"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  Users,
  Target,
  SlidersHorizontal,
  Percent,
} from "lucide-react";
import { SectionHeader } from "./section-header";
import { KpiCard } from "@/components/charts/kpi-card";
import { MetaProgress } from "@/components/charts/meta-progress";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFilteredData, isKpiUnavailable } from "@/lib/use-filtered-data";
import { useFilters } from "@/lib/filters";
import { conversaoEtapasPorServico, dadosPorServico, conversaoPorCanalProfissional } from "@/data/report";
import { PartialMonthNotice, Month2025Notice } from "./filter-notice";
import {
  formatBRL,
  formatBRLCompact,
  formatNumber,
  formatPct,
} from "@/lib/format";

export function VisaoGeralSection() {
  const { kpisGeral, conversaoPorCanal, faturamentoPorServico, filterMeta, comparisonLabel } = useFilteredData();
  const { filters } = useFilters();
  const hasMes = filters.mes !== "Todos";

  // Helper: check if a KPI is unavailable for the current filter
  const isUnavailable = (key: string) => isKpiUnavailable(filterMeta, key as never);

  // Simulator — enhanced with Marcados slider and service selector
  const [leads, setLeads] = useState(100);
  const [marcadosInput, setMarcadosInput] = useState(20);
  const [servicoSim, setServicoSim] = useState("Todos");

  // Per-service metrics for the simulator
  const servicoMetrics = useMemo(() => {
    if (servicoSim === "Todos") {
      const taxa = kpisGeral.taxaConversaoTotal.atual;
      const ticket = kpisGeral.ocupacaoAgenda.atual > 0
        ? kpisGeral.faturamento.atual / kpisGeral.ocupacaoAgenda.atual
        : 0;
      return { taxa, ticket, isFallback: false };
    }
    const ds = dadosPorServico[servicoSim as keyof typeof dadosPorServico];
    const ticket = ds
      ? (ds.ticketMedioServico > 0 ? ds.ticketMedioServico : ds.ticketMedioConsultas ?? 0)
      : 0;
    // Calculate conversion from per-professional canal data
    const profKey = servicoSim === "Nutrologia" ? "Dr Fernando"
      : servicoSim === "Pediatria" ? "Dra Isa" : "Dra Thaís";
    const canais = conversaoPorCanalProfissional[profKey as keyof typeof conversaoPorCanalProfissional] || [];
    const totalLeads = canais.reduce((s, c) => s + c.leads, 0);
    const totalMarcados = canais.reduce((s, c) => s + c.marcados, 0);
    // Use canal data if available; otherwise use funnel-derived rate (e.g. Dermatologia ~61%)
    const isFallback = totalLeads === 0;
    const funnelRate = conversaoEtapasPorServico[servicoSim]?.etapas[0]?.taxa ?? kpisGeral.taxaConversaoTotal.atual;
    const taxa = totalLeads > 0 ? totalMarcados / totalLeads : funnelRate;
    return { taxa, ticket, isFallback };
  }, [servicoSim, kpisGeral]);

  // Dynamic conversion steps based on selected service
  const convSteps = conversaoEtapasPorServico[servicoSim]?.etapas
    ?? conversaoEtapasPorServico["Todos"].etapas;

  const ticketMedio = servicoMetrics.ticket;

  const { taxaCalc } = useMemo(() => {
    const taxaCalc = leads > 0 ? marcadosInput / leads : 0;
    return { taxaCalc };
  }, [leads, marcadosInput]);

  const faturamentoSimulado = useMemo(() => {
    return marcadosInput * ticketMedio;
  }, [marcadosInput, ticketMedio]);

  const totalLeadsCanal = conversaoPorCanal.reduce((s, c) => s + c.leads, 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Visão Geral"
        description="Simule o funil comercial e acompanhe os principais indicadores da Evuli."
      />
      <PartialMonthNotice />
      <Month2025Notice />
      {/* Top KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Faturamento"
          value={formatBRL(kpisGeral.faturamento.atual)}
          current={kpisGeral.faturamento.atual}
          previous={kpisGeral.faturamento.mesAnterior}
          comparisonLabel={comparisonLabel}
          icon={DollarSign}
          hint={`Meta: ${formatPct(kpisGeral.faturamento.pctMeta ?? 0)}`}
        />
        <KpiCard
          label="Total de Leads"
          value={formatNumber(kpisGeral.totalLeads.atual)}
          current={kpisGeral.totalLeads.atual}
          previous={kpisGeral.totalLeads.mesAnterior}
          comparisonLabel={comparisonLabel}
          icon={Users}
        />
        <KpiCard
          label="Ocupação de Agenda"
          value={formatNumber(kpisGeral.ocupacaoAgenda.atual)}
          current={kpisGeral.ocupacaoAgenda.atual}
          previous={kpisGeral.ocupacaoAgenda.mesAnterior}
          icon={TrendingUp}
          unavailable={isUnavailable("ocupacaoAgenda")}
          unavailableMessage="Não disponível por canal/serviço"
        />
        <KpiCard
          label="Taxa de Conversão Total"
          value={formatPct(kpisGeral.taxaConversaoTotal.atual)}
          icon={Target}
          hint="Leads → marcados"
          unavailable={isUnavailable("taxaConversaoTotal")}
          unavailableMessage="Não disponível por serviço"
        />
      </div>

      {/* Faturamento vs Meta — progresso */}
      <Card className="glass">
        <CardContent className="p-5">
          <MetaProgress
            label={hasMes ? "Faturamento Mensal vs Meta" : "Faturamento Acumulado vs Meta"}
            realizado={kpisGeral.faturamento.atual}
            meta={kpisGeral.faturamento.metaMes ?? 0}
            format={formatBRL}
          />
        </CardContent>
      </Card>

      {/* Simulator + distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Simulator — enhanced */}
        <Card className="glass lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-primary" />
              <h3 className="text-sm font-medium">Simulador de Funil</h3>
              <Badge variant="secondary" className="ml-auto">
                Interativo
              </Badge>
            </div>

            {/* Service selector */}
            <div className="mt-4">
              <Select value={servicoSim} onValueChange={setServicoSim}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os serviços</SelectItem>
                  <SelectItem value="Nutrologia">Nutrologia</SelectItem>
                  <SelectItem value="Pediatria">Pediatria</SelectItem>
                  <SelectItem value="Dermatologia">Dermatologia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4">
              <SimColumn
                label="Leads"
                value={leads}
                format={formatNumber}
                accent="var(--chart-1)"
              />
              <SimColumn
                label="Marcados"
                value={marcadosInput}
                format={formatNumber}
                accent="var(--chart-2)"
                hint={`${formatPct(taxaCalc)} taxa`}
              />
              <SimColumn
                label="Faturamento"
                value={faturamentoSimulado}
                format={formatBRLCompact}
                accent="var(--chart-3)"
              />
              <SimColumn
                label="Taxa Conversão"
                value={taxaCalc * 100}
                format={(n) => `${n.toFixed(1)}%`}
                accent="var(--chart-4)"
                icon={<Percent className="size-3" />}
              />
            </div>

            {/* Sliders */}
            <div className="mt-8 space-y-6">
              <div>
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
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Simule a quantidade de Marcados</span>
                  <span className="font-semibold tabular">{marcadosInput}</span>
                </div>
                <Slider
                  value={[marcadosInput]}
                  onValueChange={(v) => setMarcadosInput(v[0])}
                  min={0}
                  max={Math.max(leads, 100)}
                  step={1}
                  aria-label="Quantidade de marcados"
                />
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>0</span>
                  <span>{Math.round(Math.max(leads, 100) / 2)}</span>
                  <span>{Math.max(leads, 100)}</span>
                </div>
              </div>
            </div>

            {/* Conversion steps from Power BI — dynamic per service */}
            <div className="mt-6 rounded-lg border border-border/40 bg-muted/20 p-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-3">
                Taxas de Conversão — {servicoSim === "Todos" ? "Todos os Serviços" : servicoSim}
              </h4>
              <div className={`grid grid-cols-2 gap-3 ${convSteps.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                {convSteps.map((step) => (
                  <ConvStep key={step.label} label={step.label} taxa={step.taxa} />
                ))}
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
  icon,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  accent: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-muted/20 p-4">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
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

function ConvStep({ label, taxa }: { label: string; taxa: number }) {
  return (
    <div className="rounded-md border border-border/40 bg-muted/30 p-2 text-center">
      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular text-primary">
        {formatPct(taxa)}
      </p>
    </div>
  );
}
