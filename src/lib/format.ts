/**
 * Formatadores para o dashboard Evuli BI.
 * Todos lidam com a localidade pt-BR e moeda BRL.
 */

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const NUM = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const NUM1 = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** R$ 1.392.069 */
export function formatBRL(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return BRL.format(value);
}

/**
 * Formata valores grandes de forma compacta, estilo Power BI:
 * 1.233.927 -> "R$ 1,23 Mi", 213.862 -> "R$ 213,86 Mil".
 */
export function formatBRLCompact(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    return `${sign}R$ ${NUM1.format(abs / 1_000_000)} Mi`;
  }
  if (abs >= 1_000) {
    return `${sign}R$ ${NUM1.format(abs / 1_000)} Mil`;
  }
  return formatBRL(value);
}

/** 1.392.069 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return NUM.format(value);
}

/** 0.9343 -> "93,43%" */
export function formatPct(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

/**
 * Calcula o delta percentual entre atual e anterior.
 * Retorna a variação absoluta (ex.: 0.21 -> +21%) e a direção.
 */
export function delta(
  current: number,
  previous: number
): { value: number; formatted: string; direction: "up" | "down" | "flat" } {
  if (!previous) {
    return { value: 0, formatted: "—", direction: "flat" };
  }
  const ratio = (current - previous) / previous;
  const direction = ratio > 0.0005 ? "up" : ratio < -0.0005 ? "down" : "flat";
  const sign = ratio > 0 ? "+" : "";
  return {
    value: ratio,
    formatted: `${sign}${(ratio * 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`,
    direction,
  };
}
