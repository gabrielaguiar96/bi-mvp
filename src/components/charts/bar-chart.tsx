"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BarDatum = Record<string, string | number>;

type BarChartCardProps = {
  title?: string;
  data: BarDatum[];
  xKey: string;
  series: { key: string; label: string; color?: string; format?: (n: number) => string }[];
  /** layout horizontal (barras deitado) ou vertical */
  layout?: "vertical" | "horizontal";
  height?: number;
  className?: string;
};

export function BarChartCard({
  title,
  data,
  xKey,
  series,
  layout = "vertical",
  height = 280,
  className,
}: BarChartCardProps) {
  const config: ChartConfig = {};
  series.forEach((s, i) => {
    config[s.key] = {
      label: s.label,
      color: s.color ?? `var(--chart-${(i % 5) + 1})`,
    };
  });

  const isHorizontal = layout === "horizontal";

  return (
    <Card className={cn("glass", className)}>
      {title && (
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ChartContainer config={config} className="w-full" style={{ height }}>
          <BarChart
            data={data}
            layout={isHorizontal ? "vertical" : "horizontal"}
            margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={isHorizontal}
              horizontal={!isHorizontal}
            />
            {isHorizontal ? (
              <>
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis
                  dataKey={xKey}
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={90}
                  fontSize={11}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey={xKey}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  interval={0}
                />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={48} />
              </>
            )}
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    const s = series.find((x) => x.key === name || x.label === name);
                    const num = Number(value);
                    return (
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="text-muted-foreground">
                          {s?.label ?? name}
                        </span>
                        <span className="font-medium tabular">
                          {s?.format ? s.format(num) : num.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            {series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                fill={s.color ?? `var(--color-${s.key})`}
                radius={isHorizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
                maxBarSize={isHorizontal ? 26 : 48}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
