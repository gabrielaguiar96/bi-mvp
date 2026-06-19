"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type MetaProgressProps = {
  label: string;
  realizado: number;
  meta: number;
  /** formato dos números */
  format?: (n: number) => string;
  /** invertido: meta atingida quando realizado <= meta */
  invert?: boolean;
  className?: string;
};

export function MetaProgress({
  label,
  realizado,
  meta,
  format = (n) => n.toLocaleString("pt-BR"),
  invert = false,
  className,
}: MetaProgressProps) {
  const semMeta = meta === 0;
  const ratio = semMeta ? 0 : Math.min(realizado / meta, 1.5);
  const pctOfMeta = semMeta ? 0 : (realizado / meta) * 100;
  const atingiu = semMeta ? false : invert ? realizado <= meta : realizado >= meta;
  const displayPct = Math.min(ratio * 100, 100);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate text-muted-foreground">{label}</span>
        <span className="tabular text-xs text-muted-foreground">
          {format(realizado)} / {format(meta)}
        </span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
        {/* marca de 100% */}
        {!semMeta && (
          <div
            className="absolute inset-y-0 left-1/2 w-px bg-border"
            aria-hidden
            style={{ left: `${Math.min((meta / Math.max(meta, realizado)) * 100, 100)}%` }}
          />
        )}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${displayPct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            semMeta
              ? "bg-muted-foreground/30"
              : atingiu
                ? "bg-positive"
                : "bg-negative"
          )}
        />
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className={cn("font-medium tabular", semMeta ? "text-muted-foreground/60" : atingiu ? "text-positive" : "text-negative")}>
          {semMeta ? "s/ meta" : `${pctOfMeta.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`}
        </span>
        <span className="text-muted-foreground">
          {semMeta ? "Sem meta definida" : atingiu ? "Meta atingida" : "Abaixo da meta"}
        </span>
      </div>
    </div>
  );
}
