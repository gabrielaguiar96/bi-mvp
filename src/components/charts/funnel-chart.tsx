"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type FunnelStep = {
  label: string;
  valor: number;
};

type FunnelChartProps = {
  steps: FunnelStep[];
  title?: string;
  /** formatador dos valores, ex.: formatNumber */
  format?: (n: number) => string;
  /** mostra a taxa de conversão entre etapas */
  showConversion?: boolean;
  className?: string;
};

const FUNNEL_COLORS = [
  "var(--chart-1)",
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];

export function FunnelChart({
  steps,
  title,
  format = (n) => String(n),
  showConversion = true,
  className,
}: FunnelChartProps) {
  const max = Math.max(...steps.map((s) => s.valor), 1);

  return (
    <Card className={cn("glass", className)}>
      {title && (
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {steps.map((step, i) => {
          const widthPct = Math.max((step.valor / max) * 100, 6);
          const prev = steps[i - 1];
          const conv =
            prev && prev.valor > 0 ? (step.valor / prev.valor) * 100 : null;
          const color = FUNNEL_COLORS[i % FUNNEL_COLORS.length];

          return (
            <div key={step.label} className="group">
              <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate text-muted-foreground">
                  {step.label}
                </span>
                <span className="font-semibold tabular">{format(step.valor)}</span>
              </div>
              <div className="relative h-9 w-full overflow-hidden rounded-lg bg-muted/40">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.08,
                    ease: "easeOut",
                  }}
                  className="flex h-full items-center justify-end rounded-lg px-2"
                  style={{
                    background: `linear-gradient(90deg, color-mix(in oklch, ${color} 55%, transparent), ${color})`,
                  }}
                >
                  {showConversion && conv !== null && (
                    <span className="text-[11px] font-medium tabular text-primary-foreground/90 mix-blend-screen">
                      {conv.toLocaleString("pt-BR", {
                        maximumFractionDigits: 0,
                      })}
                      %
                    </span>
                  )}
                </motion.div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
