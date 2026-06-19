import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCard } from "@/components/charts/kpi-card";

describe("KpiCard", () => {
  it("renders value and label normally", () => {
    render(<KpiCard label="Faturamento" value="R$ 1.000" />);
    expect(screen.getByText("Faturamento")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.000")).toBeInTheDocument();
  });

  it("renders unavailable state with N/D", () => {
    render(
      <KpiCard
        label="Ocupação"
        value="100"
        unavailable
        unavailableMessage="Não disponível por canal"
      />
    );
    expect(screen.getByText("N/D")).toBeInTheDocument();
    expect(screen.getByText("Não disponível por canal")).toBeInTheDocument();
    // Should NOT show the value
    expect(screen.queryByText("100")).not.toBeInTheDocument();
  });

  it("renders default unavailable message when unavailable=true but no message", () => {
    render(<KpiCard label="Test" value="42" unavailable />);
    expect(screen.getByText("N/D")).toBeInTheDocument();
    expect(screen.getByText("Sem dados para o filtro selecionado")).toBeInTheDocument();
  });

  it("shows filter icon badge when unavailable", () => {
    render(
      <KpiCard label="Test" value="42" unavailable unavailableMessage="No data" />
    );
    // The Filter icon badge container has the unavailableMessage as title
    expect(screen.getByTitle("No data")).toBeInTheDocument();
    // N/D is rendered as the value
    expect(screen.getByText("N/D")).toBeInTheDocument();
  });

  it("does not show delta when unavailable", () => {
    render(
      <KpiCard
        label="Test"
        value="100"
        current={100}
        previous={80}
        unavailable
      />
    );
    // Should show N/D, not the delta
    expect(screen.getByText("N/D")).toBeInTheDocument();
    expect(screen.queryByText("+25,0%")).not.toBeInTheDocument();
  });

  it("renders normal value when unavailable is false", () => {
    render(<KpiCard label="Test" value="R$ 500" unavailable={false} />);
    expect(screen.getByText("R$ 500")).toBeInTheDocument();
    expect(screen.queryByText("N/D")).not.toBeInTheDocument();
  });

  it("renders normal value when unavailable is undefined (default)", () => {
    render(<KpiCard label="Test" value="R$ 500" />);
    expect(screen.getByText("R$ 500")).toBeInTheDocument();
    expect(screen.queryByText("N/D")).not.toBeInTheDocument();
  });
});
