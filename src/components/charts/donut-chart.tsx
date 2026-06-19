"use client";

import { Cell, Label, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DonutDatum = { name: string; value: number; fill?: string };

type DonutChartCardProps = {
  title?: string;
  data: DonutDatum[];
  /** valor central (ex.: total) */
  centerLabel?: string;
  centerValue?: string;
  height?: number;
  className?: string;
  valueFormat?: (n: number) => string;
};

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
];

export function DonutChartCard({
  title,
  data,
  centerLabel,
  centerValue,
  height = 280,
  className,
  valueFormat = (n) => n.toLocaleString("pt-BR"),
}: DonutChartCardProps) {
  const config: ChartConfig = {};
  data.forEach((d, i) => {
    config[d.name] = { label: d.name, color: d.fill ?? PALETTE[i % PALETTE.length] };
  });

  const total = data.reduce((sum, d) => sum + d.value, 0);

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
        <ChartContainer config={config} className="mx-auto aspect-square" style={{ height }}>
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="name"
                  hideLabel
                  formatter={(value, name) => {
                    const num = Number(value);
                    const pct = total > 0 ? (num / total) * 100 : 0;
                    return (
                      <div className="flex w-full flex-col gap-0.5">
                        <span className="font-medium">{name}</span>
                        <span className="tabular text-muted-foreground">
                          {valueFormat(num)} ·{" "}
                          {pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={d.fill ?? PALETTE[i % PALETTE.length]} />
              ))}
              {centerValue && (
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !("cx" in viewBox)) return null;
                    const { cx, cy } = viewBox as { cx: number; cy: number };
                    return (
                      <g>
                        <text
                          x={cx}
                          y={cy - 6}
                          textAnchor="middle"
                          className="fill-foreground text-lg font-semibold tabular"
                        >
                          {centerValue}
                        </text>
                        {centerLabel && (
                          <text
                            x={cx}
                            y={cy + 12}
                            textAnchor="middle"
                            className="fill-muted-foreground text-[10px] uppercase tracking-wide"
                          >
                            {centerLabel}
                          </text>
                        )}
                      </g>
                    );
                  }}
                />
              )}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
