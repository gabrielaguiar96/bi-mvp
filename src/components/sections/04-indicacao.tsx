"use client";

import { Users, UserCheck, HeartHandshake, CalendarPlus } from "lucide-react";
import { SectionHeader } from "./section-header";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { KpiCard } from "@/components/charts/kpi-card";
import { MetaProgress } from "@/components/charts/meta-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { indicacaoPacientes } from "@/data/report";
import { formatNumber, formatPct } from "@/lib/format";
import { FilterNotice } from "./filter-notice";

export function IndicacaoSection() {
  const ip = indicacaoPacientes;

  const funilIndicacao = [
    { label: "Pacientes Ativos", valor: ip.pacientesAtivos.atual },
    { label: "Aptos a indicar", valor: ip.aptosAIndicar.atual },
    { label: "Pacientes que indicaram", valor: ip.pctIndicaram.atual },
    { label: "Leads de indicação", valor: ip.leadsIndicacao.atual },
    { label: "Marcados", valor: ip.marcadosIndicacao.atual },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Indicação de Pacientes"
        description="Funil de indicação: de pacientes ativos até agendamentos gerados por indicação."
      />
      <FilterNotice ignore={["canal", "servico", "mes", "ano"]} />

      {/* KPIs topo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Pacientes Ativos"
          value={formatNumber(ip.pacientesAtivos.atual)}
          icon={Users}
          hint={`Meta: ${formatNumber(ip.pacientesAtivos.meta)}`}
        />
        <KpiCard
          label="Aptos a indicar"
          value={formatNumber(ip.aptosAIndicar.atual)}
          icon={UserCheck}
          hint={`Meta: ${formatNumber(ip.aptosAIndicar.meta)}`}
        />
        <KpiCard
          label="Pacientes que indicaram"
          value={formatNumber(ip.pctIndicaram.atual)}
          icon={HeartHandshake}
          hint={`Meta: ${formatNumber(ip.pctIndicaram.meta)}`}
        />
        <KpiCard
          label="Marcados (indicação)"
          value={formatNumber(ip.marcadosIndicacao.atual)}
          icon={CalendarPlus}
          hint={`Meta: ${formatNumber(ip.marcadosIndicacao.meta)}`}
        />
      </div>

      {/* Funil + taxas vs meta */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FunnelChart
          title="Funil de Indicação"
          steps={funilIndicacao}
          format={formatNumber}
        />

        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxas de Conversão vs Meta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <MetaProgress
              label="Aptos a indicar"
              realizado={ip.taxas.aptosAIndicar}
              meta={ip.metasTaxas.aptosAIndicar}
              format={formatPct}
            />
            <MetaProgress
              label="Pacientes que indicaram"
              realizado={ip.taxas.pctIndicaram}
              meta={ip.metasTaxas.pctIndicaram}
              format={formatPct}
            />
            <MetaProgress
              label="Marcados por indicação"
              realizado={ip.taxas.marcados}
              meta={ip.metasTaxas.marcados}
              format={formatPct}
            />
            <MetaProgress
              label="Conversão de Upsell"
              realizado={ip.taxas.upsell}
              meta={ip.metasTaxas.upsell}
              format={formatPct}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
