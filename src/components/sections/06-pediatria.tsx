"use client";

import { useMemo } from "react";
import { DollarSign, Syringe, Ticket, Users } from "lucide-react";
import { ProfessionalSection } from "./professional-section";
import { FilterNotice } from "./filter-notice";
import { Card, CardContent } from "@/components/ui/card";
import { metasPorIndicador } from "@/data/report";
import { formatNumber } from "@/lib/format";

const KEY = "Dra Isa" as const;

export function PediatriaSection() {
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
    <ProfessionalSection
      profKey="Dra Isa"
      servico="Pediatria"
      description="Dra. Isa — funil comercial e indicadores do serviço."
      notice={<FilterNotice ignore={["mes", "ano"]} />}
      kpis={[
        { label: "Faturamento Mensal", valueKey: "faturamentoDia", comparisonKey: "faturamentoDiaLM", icon: DollarSign },
        { label: "Faturamento Vacina", valueKey: "faturamentoVacina", comparisonKey: "faturamentoVacinaLM", icon: Syringe },
        { label: "Ticket Médio Geral", valueKey: "ticketMedioGeral", comparisonKey: "ticketMedioGeralLM", icon: Ticket },
        { label: "Total de Leads", valueKey: "totalLeads", comparisonKey: "totalLeadsLM", icon: Users, format: formatNumber },
      ]}
      extra={
        <Card className="glass">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">
              Marcações por canal
              <span className="ml-2 text-[10px] font-normal text-muted-foreground/60">acumulado 2026</span>
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
      }
    />
  );
}
