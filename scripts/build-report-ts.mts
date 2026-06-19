/**
 * Build consolidated report.ts from decoded DSR data.
 *
 * Reads all decoded queries and produces a TypeScript module
 * that can replace src/data/report.ts.
 *
 * Usage: npx tsx scripts/build-report-ts.mts [decodedDir] [outputFile]
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DECODED_DIR = "/Users/gabriel/Documents/bi-mvp/extraction/decoded";
const OUTPUT = "/Users/gabriel/Documents/bi-mvp/src/data/report.ts";

interface DecodedQuery {
  file: string;
  measures: Array<{ id: string; name: string; format?: string }>;
  dimensions: Array<{ id: string; name: string }>;
  groups: Array<{ memberId: string; rows: Array<Record<string, unknown>> }>;
  directProperties: Record<string, unknown>;
  totalRows: number;
  timestamp?: string;
}

// --- Helpers ---

function findQuery(decoded: DecodedQuery[], measureName: string): DecodedQuery | undefined {
  // Prefer queries with fewer dimensions (more likely to be unfiltered/aggregated)
  const matches = decoded.filter((q) => q.measures.some((m) => m.name === measureName));
  if (matches.length === 0) return undefined;
  // Sort by dimension count (ascending), then by row count (ascending)
  matches.sort((a, b) => {
    const dimDiff = a.dimensions.length - b.dimensions.length;
    if (dimDiff !== 0) return dimDiff;
    return a.totalRows - b.totalRows;
  });
  return matches[0];
}

function getScalar(decoded: DecodedQuery[], measureName: string): number | string | undefined {
  const q = findQuery(decoded, measureName);
  if (!q) return undefined;
  // Find the index of the target measure within this query
  const measureIdx = q.measures.findIndex((m) => m.name === measureName);
  if (measureIdx < 0) return undefined;
  const key = `M${measureIdx}`;
  // Look in groups for the value
  for (const g of q.groups) {
    for (const row of g.rows) {
      if (row[key] !== undefined) return row[key] as number | string;
    }
  }
  // Fallback: try directProperties (DS-level values like title)
  if (q.directProperties && q.directProperties[key] !== undefined) {
    return q.directProperties[key] as number | string;
  }
  return undefined;
}

function getRowsByDimension(
  decoded: DecodedQuery[],
  measureName: string
): Array<Record<string, unknown>> {
  const q = findQuery(decoded, measureName);
  if (!q) return [];
  const rows: Array<Record<string, unknown>> = [];
  for (const g of q.groups) {
    if (g.memberId === "DM0") continue; // skip subtotals
    for (const row of g.rows) {
      rows.push(row);
    }
  }
  // If no DM1, try DM0
  if (rows.length === 0) {
    for (const g of q.groups) {
      for (const row of g.rows) {
        rows.push(row);
      }
    }
  }
  return rows;
}

function getMeasureValue(row: Record<string, unknown>, measureIdx: number): unknown {
  return row[`M${measureIdx}`];
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v);
  return 0;
}

function fmt(v: unknown): number {
  if (typeof v === "number") return Math.round(v * 100) / 100;
  if (typeof v === "string") return Math.round(parseFloat(v) * 100) / 100;
  return 0;
}

function fmtDate(ts: unknown): string {
  if (typeof ts === "number") {
    const d = new Date(ts);
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }
  if (typeof ts === "string" && ts.includes("-")) {
    const d = new Date(ts);
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }
  return String(ts);
}

// --- Main ---

function main() {
  const allDecodedFile = join(DECODED_DIR, "_all_decoded.json");
  if (!existsSync(allDecodedFile)) {
    console.error("Run dsr-decoder first to produce _all_decoded.json");
    process.exit(1);
  }

  const decoded: DecodedQuery[] = JSON.parse(readFileSync(allDecodedFile, "utf-8"));
  console.log(`Loaded ${decoded.length} decoded queries`);

  // --- Extract all data points ---

  // KPIs Geral
  const fatAtual = num(getScalar(decoded, "_MedidasGeral.Faturamento"));
  const fatLM = num(getScalar(decoded, "_MedidasGeral.Faturamento LM"));
  const pctMetaRaw = num(getScalar(decoded, "_MedidasGeral.% Meta Total"));
  const pctMeta = fmt(pctMetaRaw);
  const metaMes = Math.round(fatAtual / pctMetaRaw);

  const totalLeads = num(getScalar(decoded, "_MedidasFernando.Leads_Selecionados"));
  const leadsLM = num(getScalar(decoded, "_MedidasFernando.Leads Selecionados LM"));

  const ocupacao = num(getScalar(decoded, "_MedidasGeral.Ocupação Agenda"));
  const ocupacaoLM = num(getScalar(decoded, "_MedidasGeral.Ocupação Agenda LM"));
  const ocupacaoLY = num(getScalar(decoded, "_MedidasGeral.Ocupação Agenda LY"));

  const comparecidos = num(getScalar(decoded, "_MedidasGeral.Comparecidos_Consultas"));
  const comparecidosLY = num(getScalar(decoded, "_MedidasGeral.Consultas Realizadas LY"));

  const qtdUpsell = num(getScalar(decoded, "_MedidasGeral.Qtd Upsell"));
  const convUpsell = num(getScalar(decoded, "Sum(Acrescentar1.Conversão Upsell)"));
  const convUpsellLM = num(getScalar(decoded, "_MedidasGeral.Conversão Upsell LM"));

  const ticketMedio = fmt(getScalar(decoded, "_MedidasGeral.Ticket Medio Consultas"));
  const ticketMedioLM = fmt(getScalar(decoded, "_MedidasGeral.Ticket Medio LM"));
  const ticketMedioLY = fmt(getScalar(decoded, "_MedidasGeral.Ticket Medio LY"));

  const taxaConversaoTotal = fmt(getScalar(decoded, "_MedidasFernando.Taxa de Conversão Total Geral"));

  // Funis
  const funis: Record<string, { servico: string; etapas: Array<{ label: string; valor: number }> }> = {};

  // Dr Fernando funnel
  const fernandoFunil = getRowsByDimension(decoded, "_MedidasFernando.Valor Etapa Funil Dr Fernando");
  if (fernandoFunil.length > 0) {
    const etapaLabels = ["Horários disponíveis", "Ocupação Agenda", "Comparecidos", "Qtd Upsell"];
    funis["Dr Fernando"] = {
      servico: "Nutrologia",
      etapas: fernandoFunil.map((row, i) => ({
        label: etapaLabels[i] || `Etapa ${i}`,
        valor: num(row["M0"]),
      })),
    };
  }

  // Dra Isa funnel
  const isaFunil = getRowsByDimension(decoded, "_MedidasIsa.Valor Etapa Funil Dra Isa");
  if (isaFunil.length > 0) {
    const etapaLabels = ["Horários disponíveis", "Ocupação Agenda", "Comparecidos", "Qtd Upsell"];
    funis["Dra Isa"] = {
      servico: "Pediatria",
      etapas: isaFunil.map((row, i) => ({
        label: etapaLabels[i] || `Etapa ${i}`,
        valor: num(row["M0"]),
      })),
    };
  }

  // Dra Thaís funnel
  const thaisFunil = getRowsByDimension(decoded, "_MedidasThais.Valor Etapa Funil Dra Thais");
  if (thaisFunil.length > 0) {
    const etapaLabels = ["Horários disponíveis", "Ocupação Agenda", "Comparecidos"];
    funis["Dra Thaís"] = {
      servico: "Dermatologia",
      etapas: thaisFunil.map((row, i) => ({
        label: etapaLabels[i] || `Etapa ${i}`,
        valor: num(row["M0"]),
      })),
    };
  }

  // Conversão por canal
  const convCanalRows = getRowsByDimension(decoded, "_MedidasFernando.Taxa de Conversão");
  const conversaoPorCanal = convCanalRows
    .filter((r) => r["G0"] !== undefined)
    .map((r) => ({
      canal: String(r["G0"]),
      leads: num(r["M1"]),
      marcados: num(r["M2"]),
      conversao: fmt(r["M0"]),
    }));

  // Faturamento por canal
  const fatCanalRows = getRowsByDimension(decoded, "_MedidasGeral.Faturamento canal");
  const faturamentoPorCanal = fatCanalRows
    .filter((r) => r["G0"] !== undefined && typeof r["G0"] === "string")
    .map((r) => ({
      canal: String(r["G0"]),
      faturamento: num(r["M0"]),
      ticketMedio: num(r["M1"] || 0),
    }));

  // Faturamento por serviço
  const fatServicoRows = getRowsByDimension(decoded, "_MedidasFernando.Faturamento");
  const faturamentoPorServico = fatServicoRows
    .filter((r) => r["G0"] !== undefined)
    .map((r) => ({
      servico: String(r["G0"]),
      faturamento: num(r["M0"]),
    }));

  // Série mensal
  const serieMensal = getRowsByDimension(decoded, "Sum(Append metas.TOTAL DO MÊS)");
  const faturamentoMensal = serieMensal.map((r) => ({
    mes: fmtDate(r["G0"]),
    realizado: num(r["M0"]),
    meta: num(r["M1"]),
  }));

  // Indicação / Pacientes
  const pacientesAtivos = num(getScalar(decoded, "_MedidasGeral.Pacientes ativos"));
  const pacientesAptos = num(getScalar(decoded, "_MedidasGeral.Pacientes aptos"));
  const projAptos = num(getScalar(decoded, "_MedidasGeral.Projeção Pacientes Aptos"));
  const pacIndicaram = num(getScalar(decoded, "_MedidasGeral.Pacientes que indicaram"));
  const projIndicaram = num(getScalar(decoded, "_MedidasGeral.Projeção Pacientes que passaram indicação"));
  const leadsIndicacao = num(getScalar(decoded, "_MedidasGeral.Leads Indicação Nutrologia"));
  const projLeads = num(getScalar(decoded, "_MedidasGeral.Projeção Leads Indicação"));
  const marcadosIndicacao = num(getScalar(decoded, "_MedidasFernando.Marcados Indicação Nutrologia"));
  const projMarcados = num(getScalar(decoded, "_MedidasGeral.Projeção Marcados Indicaçao"));

  const taxas = {
    aptosAIndicar: fmt(getScalar(decoded, "_MedidasFernando.Taxa de Conversão Aptos a indicar")),
    pctIndicaram: fmt(getScalar(decoded, "_MedidasFernando.Taxa de Conversão Pcts indicaram")),
    marcados: fmt(getScalar(decoded, "_MedidasFernando.Taxa de Conversão Marcados")),
    upsell: fmt(getScalar(decoded, "_MedidasFernando.Taxa de Conversão Upsell")),
  };

  const metasTaxas = {
    aptosAIndicar: fmt(getScalar(decoded, "_MedidasFernando.Meta Taxa de Conversão Aptos a indicar")),
    pctIndicaram: fmt(getScalar(decoded, "_MedidasFernando.Meta Taxa de Conversão Pcts indicaram")),
    marcados: fmt(getScalar(decoded, "_MedidasFernando.Meta Taxa de Conversão Marcados")),
    upsell: fmt(getScalar(decoded, "_MedidasFernando.Meta Taxa de Conversão Upsell")),
  };

  // Meta pacotes
  const metaPacAptos = num(getScalar(decoded, "_MedidasGeral.Meta Pacientes Aptos"));
  const metaPacIndicaram = num(getScalar(decoded, "_MedidasGeral.Meta Pacientes que passaram indicação"));
  const metaLeadsInd = num(getScalar(decoded, "_MedidasGeral.Meta Leads Indicação"));
  const metaMarcadosInd = num(getScalar(decoded, "_MedidasGeral.Meta Marcados Indicaçao"));
  const metaUpsellInd = num(getScalar(decoded, "_MedidasGeral.Meta Upsell Indicaçao"));

  // Metas por profissional
  const metasPorProfissional: Record<string, Array<{ indicador: string; meta: number; realizado: number; pctMeta: number }>> = {};

  const fernandoMetas = getRowsByDimension(decoded, "Sum(Metas Dr Fernando.META DO MÊS)");
  if (fernandoMetas.length > 0) {
    metasPorProfissional["Dr Fernando"] = fernandoMetas.map((r) => ({
      indicador: String(r["G0"]),
      meta: num(r["M0"]),
      realizado: num(r["M1"]),
      pctMeta: fmt(r["M2"]),
    }));
  }

  const isaMetas = getRowsByDimension(decoded, "Sum(Metas Dra Isa.META DO MÊS)");
  if (isaMetas.length > 0) {
    metasPorProfissional["Dra Isa"] = isaMetas.map((r) => ({
      indicador: String(r["G0"]),
      meta: num(r["M1"]),
      realizado: num(r["M0"]),
      pctMeta: fmt(r["M2"]),
    }));
  }

  const thaisMetas = getRowsByDimension(decoded, "Sum(Metas Dra Thais.META DO MÊS)");
  if (thaisMetas.length > 0) {
    metasPorProfissional["Dra Thaís"] = thaisMetas.map((r) => ({
      indicador: String(r["G0"]),
      meta: num(r["M0"]),
      realizado: num(r["M1"]),
      pctMeta: fmt(r["M2"]),
    }));
  }

  // --- Generate TypeScript ---

  const ts = `/**
 * Evuli BI — Modelo de dados extraído do relatório Power BI original.
 *
 * Todos os valores abaixo são REAIS, capturados via interceptação das
 * chamadas de rede (endpoint querydata / DSR) feitas pelo app do Power BI
 * ao renderizar o relatório público em 2026-06-19.
 *
 * Gerado automaticamente por scripts/build-report-ts.mts a partir de
 * ${decoded.length} queries decodificadas.
 *
 * Snapshot: filtro padrão (Ano=2026, até o mês corrente).
 */

export type KpiComparison = {
  current: number;
  previous: number;
  previousLabel: "mês anterior" | "ano anterior";
};

export const meta = {
  empresa: "Evuli",
  area: "Comercial / Clínica de Saúde",
  snapshotLabel: "2026 — acumulado até o mês corrente",
  moeda: "BRL",
  extractedAt: "${new Date().toISOString()}",
  queryCount: ${decoded.length},
  uniqueMeasures: 130,
  uniqueDimensions: 16,
};

// ---------- KPIs Gerais (Página 1 / 3) ----------
export const kpisGeral = {
  faturamento: {
    atual: ${fatAtual},
    mesAnterior: ${fatLM},
    metaMes: ${Math.round(metaMes)},
    pctMeta: ${pctMeta},
  },
  totalLeads: { atual: ${totalLeads}, mesAnterior: ${num(leadsLM)} },
  ocupacaoAgenda: { atual: ${ocupacao}, mesAnterior: ${ocupacaoLM}, anoAnterior: ${ocupacaoLY} },
  comparecidos: { atual: ${comparecidos}, anoAnterior: ${comparecidosLY} },
  qtdUpsell: { atual: ${qtdUpsell} },
  conversaoUpsell: { atual: ${convUpsell}, mesAnterior: ${convUpsellLM} },
  ticketMedioConsultas: {
    atual: ${ticketMedio},
    mesAnterior: ${ticketMedioLM},
    anoAnterior: ${ticketMedioLY},
  },
  taxaConversaoTotal: { atual: ${taxaConversaoTotal} },
};

// ---------- Funis por profissional ----------
export const funis = ${JSON.stringify(
    Object.fromEntries(
      Object.entries(funis).map(([name, f]) => [
        name,
        { servico: f.servico, etapas: f.etapas },
      ])
    ),
    null,
    2
  ).replace(/"/g, "\"").replace(/(\d+),/g, "$1,")};

// ---------- Conversão por canal ----------
export const conversaoPorCanal = ${JSON.stringify(conversaoPorCanal, null, 2)
    };

// ---------- Faturamento por canal ----------
export const faturamentoPorCanal = ${JSON.stringify(faturamentoPorCanal, null, 2)
    };

// ---------- Faturamento por serviço ----------
export const faturamentoPorServico = ${JSON.stringify(faturamentoPorServico, null, 2)
    };

// ---------- Série histórica: Faturamento realizado vs Meta ----------
export const faturamentoMensal = ${JSON.stringify(faturamentoMensal, null, 2)
    };

// ---------- Indicação / Pacientes ----------
export const indicacaoPacientes = {
  pacientesAtivos: { atual: ${pacientesAtivos}, meta: ${metaPacAptos}, projecao: ${projAptos} },
  aptosAIndicar: { atual: ${pacientesAptos}, meta: ${metaPacAptos}, projecao: ${projAptos} },
  pctIndicaram: { atual: ${pacIndicaram}, meta: ${metaPacIndicaram}, projecao: ${projIndicaram} },
  leadsIndicacao: { atual: ${leadsIndicacao}, meta: ${metaLeadsInd}, projecao: ${projLeads} },
  marcadosIndicacao: { atual: ${marcadosIndicacao}, meta: ${metaMarcadosInd}, projecao: ${projMarcados} },
  taxas: ${JSON.stringify(taxas, null, 4).replace(/"/g, "\"")},
  metasTaxas: ${JSON.stringify(metasTaxas, null, 4).replace(/"/g, "\"")},
};

// ---------- Metas por profissional ----------
export const metasPorIndicador = {
  detalhePorProfissional: ${JSON.stringify(metasPorProfissional, null, 2)
    },
};

// ---------- Detalhe por profissional ----------
export const profissionais = {
  "Dr Fernando": {
    servico: "Nutrologia",
    faturamentoDia: ${num(getScalar(decoded, "_MedidasFernando.Faturamento dia"))},
    faturamentoDiaLM: ${num(getScalar(decoded, "_MedidasFernando.Faturamento Fernando LM"))},
    faturamentoProtocolo: ${num(getScalar(decoded, "_MedidasFernando.Faturamento canal Dr Fernando"))},
    ticketMedioUpsell: ${fmt(getScalar(decoded, "_MedidasFernando.Ticket Medio Upsell Dr Fernando"))},
    ticketMedioUpsellLM: ${fmt(getScalar(decoded, "_MedidasFernando.Ticket Medio Geral Dr Fernando LM"))},
    ticketMedioAgenda: ${fmt(getScalar(decoded, "_MedidasGeral.Ticket Médio Agenda"))},
    ticketMedioAgendaLM: ${fmt(getScalar(decoded, "_MedidasFernando.Ticket Médio Agenda LM"))},
    totalLeads: ${num(getScalar(decoded, "_MedidasFernando.Leads_Selecionados Dr Fernando"))},
    totalLeadsLM: ${num(getScalar(decoded, "_MedidasFernando.Leads Selecionados LM"))},
    marcacoes: ${num(getScalar(decoded, "_MedidasFernando.Marcados Selecionados Dr Fernando"))},
    marcacoesLM: ${num(getScalar(decoded, "_MedidasFernando.Marcações Selecionados Fernando LM"))},
  },
  "Dra Isa": {
    servico: "Pediatria",
    faturamentoDia: ${num(getScalar(decoded, "_MedidasIsa.Faturamento Geral Dra Isa"))},
    faturamentoDiaLM: ${num(getScalar(decoded, "_MedidasIsa.Faturamento Geral Dra Isa LM"))},
    faturamentoVacina: ${num(getScalar(decoded, "_MedidasIsa.Faturamento Vacina"))},
    faturamentoVacinaLM: ${num(getScalar(decoded, "_MedidasIsa.Faturamento Vacina LM"))},
    ticketMedioGeral: ${fmt(getScalar(decoded, "_MedidasIsa.Ticket Medio Consulta Dra Isa"))},
    ticketMedioGeralLM: ${fmt(getScalar(decoded, "_MedidasIsa.Ticket Medio Consulta Dra Isa LM"))},
    ticketMedioUpsell: ${fmt(getScalar(decoded, "_MedidasIsa.Ticket Medio Upsell Dra Isa"))},
    ticketMedioUpsellLM: ${fmt(getScalar(decoded, "_MedidasIsa.Ticket Medio Upsell Dra Isa LM"))},
    totalLeads: ${num(getScalar(decoded, "_MedidasIsa.Leads_Selecionados Dra Isa"))},
    totalLeadsLM: ${num(getScalar(decoded, "_MedidasIsa.Leads_Selecionados Dra Isa LM"))},
    marcacoes: ${num(getScalar(decoded, "_MedidasIsa.Marcados Selecionados Dra Isa"))},
    marcacoesLM: ${num(getScalar(decoded, "_MedidasIsa.Marcados Selecionados Dra Isa LM"))},
  },
  "Dra Thaís": {
    servico: "Dermatologia",
    faturamentoDia: ${num(getScalar(decoded, "_MedidasThais.Faturamento Geral Dra Thaís"))},
    faturamentoDiaLM: ${num(getScalar(decoded, "_MedidasThais.Faturamento Geral Dra Thaís LM"))},
    ticketMedioConsulta: ${fmt(getScalar(decoded, "_MedidasThais.Ticket Medio Consulta Dra Thaís"))},
    ticketMedioConsultaLM: ${fmt(getScalar(decoded, "_MedidasIsa.Ticket Medio Consulta Dra Isa LM"))},
    quantidadeConsultas: ${num(getScalar(decoded, "_MedidasThais.Qtd Consultas Dra Thaís"))},
    quantidadeConsultasLM: ${num(getScalar(decoded, "_MedidasThais.Qtd Consultas Dra Thaís LM"))},
    marcacoes: ${num(getScalar(decoded, "_MedidasThais.Marcados Selecionados Dra Thaís"))},
    marcacoesLM: ${num(getScalar(decoded, "_MedidasThais.Marcados Selecionados Dra Thaís LM"))},
  },
};

// ---------- Filtros disponíveis ----------
export const filtros = {
  anos: [2025, 2026],
  meses: [
    "janeiro", "fevereiro", "março", "abril",
    "maio", "junho", "julho", "agosto",
    "setembro", "outubro", "novembro", "dezembro",
  ],
  canais: ["Ativo", "Crossell", "Google", "Indicação", "Meta", "Orgânico", "Pago", "Retenção"],
  servicos: ["By Evuli", "Cirurgia Plástica", "Dermatologia", "Evuli Dietas", "Nutrologia", "Nutrologia 2", "Pediatria", "Suplementação"],
  periodos: ["Realizado", "Simulado"],
};
`;

  writeFileSync(OUTPUT, ts);
  console.log(`Written to ${OUTPUT}`);
  console.log(`Size: ${ts.length} bytes`);
}

main();
