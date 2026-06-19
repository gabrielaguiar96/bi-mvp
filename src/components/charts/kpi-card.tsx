"use client";

import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { delta } from "@/lib/format";

type KpiCardProps = {
  label: string;
  value: string;
  /** valor anterior p/ comparação (mês/ano). Se omitido, não mostra delta. */
  previous?: number;
  current?: number;
  /** texto da comparação, ex.: "vs mês anterior" */
  comparisonLabel?: string;
  /** quando a métrica é positiva ao SUBIR (default) ou ao DESCER (ex.: custo) */
  positiveDirection?: "up" | "down";
  /** ícone opcional no topo */
  icon?: LucideIcon;
  /** subtexto extra, ex.: meta */
  hint?: string;
  className?: string;
};

export function KpiCard({
  label,
  value,
  previous,
  current,
  comparisonLabel = "vs mês anterior",
  positiveDirection = "up",
  icon: Icon,
  hint,
  className,
}: KpiCardProps) {
  const hasComparison =
    previous !== undefined && current !== undefined && previous !== 0;
  const d = hasComparison ? delta(current!, previous!) : null;

  // cor do delta: verde se a direção é a desejada
  const isPositive = d
    ? positiveDirection === "up"
      ? d.direction === "up"
      : d.direction === "down"
    : false;
  const isNeutral = d?.direction === "flat";

  const DeltaIcon =
    d?.direction === "up"
      ? ArrowUpRight
      : d?.direction === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <Card className={cn("glass relative overflow-hidden p-5", className)}>
      {/* glow accent */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-primary/10 blur-2xl"
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </div>
        )}
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight tabular md:text-3xl">
        {value}
      </p>

      <div className="mt-2 flex items-center gap-1.5 text-xs">
        {d && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular",
              isNeutral
                ? "bg-muted text-muted-foreground"
                : isPositive
                  ? "bg-positive/15 text-positive"
                  : "bg-negative/15 text-negative"
            )}
          >
            <DeltaIcon className="size-3" />
            {d.formatted}
          </span>
        )}
        {d && (
          <span className="text-muted-foreground">{comparisonLabel}</span>
        )}
        {!d && hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </Card>
  );
}
