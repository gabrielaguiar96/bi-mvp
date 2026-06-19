"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatBRL, formatNumber, formatPct } from "@/lib/format";

type Row = {
  indicador: string;
  meta: number;
  realizado: number;
  pctMeta: number;
};

/** Indicadores que devem ser formatados como moeda (BRL) */
const CURRENCY_PREFIXES = [
  "Faturamento Mensal",
  "Fat.",
  "Ticket Médio",
];

function isCurrencyIndicator(indicador: string): boolean {
  return CURRENCY_PREFIXES.some(
    (prefix) => indicador.startsWith(prefix) || indicador.includes(prefix)
  );
}

type MetaTableProps = {
  title: string;
  rows: Row[];
  /**
   * Quando true, todos os valores são formatados como BRL.
   * Quando false ou omitido, detecta automaticamente pelo nome do indicador:
   * indicadores com prefixo de faturamento/ticket usam BRL, demais usam inteiro.
   */
  valueIsCurrency?: boolean;
  className?: string;
  /** limita a altura (com scroll) */
  maxHeight?: string;
};

export function MetaTable({
  title,
  rows,
  valueIsCurrency,
  className,
  maxHeight = "24rem",
}: MetaTableProps) {
  /** Formata valor de acordo com o tipo do indicador */
  const fmt = (value: number, indicador: string) => {
    const isCurrency = valueIsCurrency ?? isCurrencyIndicator(indicador);
    return isCurrency ? formatBRL(value) : formatNumber(value);
  };

  return (
    <Card className={cn("glass", className)}>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ maxHeight }} className="pr-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Indicador</th>
                  <th className="pb-2 pr-3 text-right font-medium">Meta</th>
                  <th className="pb-2 pr-3 text-right font-medium">Realizado</th>
                  <th className="pb-2 pr-3 text-right font-medium">% Meta</th>
                  <th className="pb-2 font-medium">Progresso</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const atingiu = r.pctMeta >= 1;
                  const semMeta = r.meta === 0;
                  return (
                    <tr
                      key={r.indicador}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="py-2 pr-3 font-medium">{r.indicador}</td>
                      <td className="py-2 pr-3 text-right tabular text-muted-foreground">
                        {semMeta ? "—" : fmt(r.meta, r.indicador)}
                      </td>
                      <td className="py-2 pr-3 text-right tabular">{fmt(r.realizado, r.indicador)}</td>
                      <td
                        className={cn(
                          "py-2 pr-3 text-right tabular font-medium",
                          semMeta
                            ? "text-muted-foreground/60"
                            : atingiu
                              ? "text-positive"
                              : "text-negative"
                        )}
                      >
                        {semMeta ? "s/ meta" : formatPct(r.pctMeta)}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted/50">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                semMeta
                                  ? "bg-muted-foreground/30"
                                  : atingiu
                                    ? "bg-positive"
                                    : "bg-negative"
                              )}
                              style={{
                                width: `${Math.min(r.pctMeta * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
