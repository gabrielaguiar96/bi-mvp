import { describe, it, expect } from "vitest";
import {
  formatBRL,
  formatBRLCompact,
  formatNumber,
  formatPct,
  delta,
} from "@/lib/format";

describe("formatBRL", () => {
  it("formats a normal value as BRL currency", () => {
    const result = formatBRL(1392069);
    expect(result).toContain("1.392.069");
    expect(result).toContain("R$");
  });

  it("formats zero", () => {
    expect(formatBRL(0)).toContain("0");
  });

  it("returns — for NaN", () => {
    expect(formatBRL(NaN)).toBe("—");
  });

  it("returns — for Infinity", () => {
    expect(formatBRL(Infinity)).toBe("—");
  });

  it("formats negative values", () => {
    const result = formatBRL(-500);
    expect(result).toContain("500");
    expect(result).toContain("-");
  });
});

describe("formatBRLCompact", () => {
  it("formats millions as Mi", () => {
    const result = formatBRLCompact(1233927);
    expect(result).toContain("Mi");
    expect(result).toContain("1,2");
  });

  it("formats thousands as Mil", () => {
    const result = formatBRLCompact(213862);
    expect(result).toContain("Mil");
    expect(result).toContain("213,9");
  });

  it("formats small values as regular BRL", () => {
    const result = formatBRLCompact(500);
    expect(result).toContain("R$");
    expect(result).not.toContain("Mil");
  });

  it("returns — for NaN", () => {
    expect(formatBRLCompact(NaN)).toBe("—");
  });

  it("handles negative millions", () => {
    const result = formatBRLCompact(-1500000);
    expect(result).toContain("-");
    expect(result).toContain("Mi");
  });
});

describe("formatNumber", () => {
  it("formats with pt-BR thousand separators", () => {
    expect(formatNumber(1392069)).toBe("1.392.069");
  });

  it("returns — for NaN", () => {
    expect(formatNumber(NaN)).toBe("—");
  });
});

describe("formatPct", () => {
  it("formats 0.9343 as 93,43%", () => {
    expect(formatPct(0.9343)).toBe("93,43%");
  });

  it("formats 0 as 0,00%", () => {
    expect(formatPct(0)).toBe("0,00%");
  });

  it("returns — for NaN", () => {
    expect(formatPct(NaN)).toBe("—");
  });

  it("respects custom digits", () => {
    const result = formatPct(0.9343, 1);
    expect(result).toBe("93,4%");
  });
});

describe("delta", () => {
  it("computes positive delta (up)", () => {
    const result = delta(100, 80);
    expect(result.direction).toBe("up");
    expect(result.value).toBeCloseTo(0.25);
    expect(result.formatted).toContain("25");
    expect(result.formatted).toContain("+");
  });

  it("computes negative delta (down)", () => {
    const result = delta(80, 100);
    expect(result.direction).toBe("down");
    expect(result.value).toBeCloseTo(-0.2);
    expect(result.formatted).toContain("20");
    expect(result.formatted).toContain("-");
  });

  it("returns flat for equal values", () => {
    const result = delta(100, 100);
    expect(result.direction).toBe("flat");
  });

  it("returns — when previous is 0", () => {
    const result = delta(100, 0);
    expect(result.direction).toBe("flat");
    expect(result.formatted).toBe("—");
    expect(result.value).toBe(0);
  });

  it("returns — when previous is falsy (undefined-like)", () => {
    const result = delta(100, 0);
    expect(result.formatted).toBe("—");
  });
});
