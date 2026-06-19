"use client";

import { Area, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LineDatum = Record<string, string | number>;

type LineChartCardProps = {
  title?: string;
  data: LineDatum[];
  xKey: string;
  series: { key: string; label: string; color?: string; format?: (n: number) => string }[];
  /** preenche a área sob a primeira série */
  area?: boolean;
  height?: number;
  className?: string;
};

export function LineChartCard({
  title,
  data,
  xKey,
  series,
  area = false,
  height = 300,
  className,
}: LineChartCardProps) {
  const config: ChartConfig = {};
  series.forEach((s, i) => {
    config[s.key] = {
      label: s.label,
      color: s.color ?? `var(--chart-${(i % 5) + 1})`,
    };
  });

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
          <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
            <defs>
              {series.map((s, i) => (
                <linearGradient
                  key={s.key}
                  id={`fill-${s.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={s.color ?? `var(--chart-${(i % 5) + 1})`}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor={s.color ?? `var(--chart-${(i % 5) + 1})`}
                    stopOpacity={0}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              fontSize={11}
              dy={8}
            />
            <YAxis tickLine={false} axisLine={false} fontSize={11} width={52} />
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
            {area &&
              series[0] &&
              (() => {
                const s = series[0];
                return (
                  <Area
                    type="monotone"
                    dataKey={s.key}
                    stroke="none"
                    fill={`url(#fill-${s.key})`}
                  />
                );
              })()}
            {series.map((s, i) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color ?? `var(--color-${s.key})`}
                strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 0, fill: s.color ?? `var(--chart-${(i % 5) + 1})` }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
