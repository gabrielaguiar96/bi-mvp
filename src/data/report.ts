/**
 * Evuli BI — Modelo de dados extraído do relatório Power BI original.
 *
 * Todos os valores abaixo são REAIS, capturados via interceptação das
 * chamadas de rede (endpoint querydata / DSR) feitas pelo app do Power BI
 * ao renderizar o relatório público em 2026-06-19.
 *
 * Gerado automaticamente por scripts/build-report-ts.mts a partir de
 * 93 queries decodificadas.
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
  extractedAt: "2026-06-19T03:34:19.765Z",
  queryCount: 93,
  uniqueMeasures: 130,
  uniqueDimensions: 16,
};

// ---------- KPIs Gerais (Página 1 / 3) ----------
export const kpisGeral = {
  faturamento: {
    atual: 1392068.5,
    mesAnterior: 952838.39,
    metaMes: 1490000,
    pctMeta: 0.93,
  },
  totalLeads: { atual: 285, mesAnterior: 340 },
  ocupacaoAgenda: { atual: 228, mesAnterior: 198, anoAnterior: 236 },
  comparecidos: { atual: 209, mesAnterior: undefined as number | undefined, anoAnterior: 216 },
  qtdUpsell: { atual: 72 },
  conversaoUpsell: { atual: 62, mesAnterior: 160 },
  ticketMedioConsultas: {
    atual: 12541.16,
    mesAnterior: 10706.05,
    anoAnterior: 11692.26,
  },
  taxaConversaoTotal: { atual: 0.22 },
};

// ---------- Funis por profissional ----------
export const funis = {
  "Dr Fernando": {
    "servico": "Nutrologia",
    "etapas": [
      {
        "label": "Horários disponíveis",
        "valor": 112
      },
      {
        "label": "Ocupação Agenda",
        "valor": 58
      },
      {
        "label": "Comparecidos",
        "valor": 58
      },
      {
        "label": "Qtd Upsell",
        "valor": 50
      }
    ]
  },
  "Dra Isa": {
    "servico": "Pediatria",
    "etapas": [
      {
        "label": "Horários disponíveis",
        "valor": 114
      },
      {
        "label": "Ocupação Agenda",
        "valor": 98
      },
      {
        "label": "Comparecidos",
        "valor": 98
      },
      {
        "label": "Qtd Upsell",
        "valor": 9
      }
    ]
  },
  "Dra Thaís": {
    "servico": "Dermatologia",
    "etapas": [
      {
        "label": "Horários disponíveis",
        "valor": 70
      },
      {
        "label": "Ocupação Agenda",
        "valor": 43
      },
      {
        "label": "Comparecidos",
        "valor": 36
      }
    ]
  }
};

// ---------- Conversão por canal ----------
export const conversaoPorCanal = [
  {
    "canal": "Retenção",
    "leads": 62,
    "marcados": 57,
    "conversao": 0.92
  },
  {
    "canal": "Ativo",
    "leads": 200,
    "marcados": 42,
    "conversao": 0.21
  },
  {
    "canal": "Crossell",
    "leads": 49,
    "marcados": 7,
    "conversao": 0.14
  },
  {
    "canal": "Orgânico",
    "leads": 366,
    "marcados": 41,
    "conversao": 0.11
  },
  {
    "canal": "Indicação",
    "leads": 107,
    "marcados": 9,
    "conversao": 0.08
  },
  {
    "canal": "Pago",
    "leads": 16,
    "marcados": 0,
    "conversao": 0
  }
];

// ---------- Faturamento por canal ----------
// Nota: o Power BI não atribui todo faturamento a um canal de aquisição.
// O gap (~R$ 285k em maio) corresponde a receita sem canal definido (protocolos, planos, etc.)
export const faturamentoPorCanal = [
  { canal: "Retenção", faturamento: 557_344, ticketMedio: 17_417 },
  { canal: "Orgânico", faturamento: 236_878, ticketMedio: 23_687.80 },
  { canal: "Ativo", faturamento: 153_120, ticketMedio: 15_312 },
  { canal: "Indicação", faturamento: 109_164, ticketMedio: 18_194 },
  { canal: "Crossell", faturamento: 50_700, ticketMedio: 7_243 },
  { canal: "Pago", faturamento: 0, ticketMedio: 0 },
];

// ---------- Faturamento por serviço ----------
export const faturamentoPorServico = [
  {
    "servico": "Nutrologia",
    "faturamento": 1020706
  },
  {
    "servico": "Pediatria",
    "faturamento": 213862.5
  },
  {
    "servico": "Dermatologia",
    "faturamento": 157500
  }
];

// ---------- Série histórica: Faturamento realizado vs Meta ----------
export const faturamentoMensal = [
  { mes: "Jan 2025", realizado: 996_586.76, meta: 1_045_300 },
  { mes: "Fev 2025", realizado: 781_541.49, meta: 892_000 },
  { mes: "Mar 2025", realizado: 741_876.57, meta: 830_540 },
  { mes: "Abr 2025", realizado: 879_493.49, meta: 1_000_147 },
  { mes: "Mai 2025", realizado: 1_251_071.95, meta: 1_000_147 },
  { mes: "Jun 2025", realizado: 1_284_529.18, meta: 1_008_000 },
  { mes: "Jul 2025", realizado: 1_232_619.93, meta: 1_260_000 },
  { mes: "Ago 2025", realizado: 1_393_732.07, meta: 1_260_000 },
  { mes: "Set 2025", realizado: 1_395_459.37, meta: 1_260_000 },
  { mes: "Out 2025", realizado: 1_309_090.40, meta: 1_300_000 },
  { mes: "Nov 2025", realizado: 1_160_169.04, meta: 1_280_000 },
  { mes: "Dez 2025", realizado: 1_007_114.80, meta: 1_280_000 },
  { mes: "Jan 2026", realizado: 1_233_927.99, meta: 1_210_000 },
  { mes: "Fev 2026", realizado: 953_173.00, meta: 950_000 },
  { mes: "Mar 2026", realizado: 1_243_831.16, meta: 1_065_000 },
  { mes: "Abr 2026", realizado: 952_838.39, meta: 1_065_000 },
  { mes: "Mai 2026", realizado: 1_392_068.50, meta: 1_490_000 },
  { mes: "Jun 2026", realizado: 540_154.95, meta: 960_000 },
];

// ---------- Indicação / Pacientes ----------
export const indicacaoPacientes = {
  pacientesAtivos: { atual: 120, meta: 105, projecao: 49 },
  aptosAIndicar: { atual: 49, meta: 105, projecao: 49 },
  pctIndicaram: { atual: 22, meta: 40, projecao: 22 },
  leadsIndicacao: { atual: 35, meta: 80, projecao: 35 },
  marcadosIndicacao: { atual: 4, meta: 40, projecao: 4 },
  taxas: {
    "aptosAIndicar": 0.41,
    "pctIndicaram": 0.45,
    "marcados": 0.11,
    "upsell": 0.75
},
  metasTaxas: {
    "aptosAIndicar": 0.88,
    "pctIndicaram": 0.38,
    "marcados": 0.5,
    "upsell": 1.25
},
};

// ---------- Metas por profissional ----------
export const metasPorIndicador = {
  detalhePorProfissional: {
  "Dr Fernando": [
    {
      "indicador": "Marcação - Retenção",
      "meta": 50,
      "realizado": 25,
      "pctMeta": 0.5
    },
    {
      "indicador": "Marcação - Pago",
      "meta": 3,
      "realizado": 2,
      "pctMeta": 0.67
    },
    {
      "indicador": "Marcação - Orgânico",
      "meta": 22,
      "realizado": 11,
      "pctMeta": 0.5
    },
    {
      "indicador": "Marcação - Indicação",
      "meta": 20,
      "realizado": 4,
      "pctMeta": 0.2
    },
    {
      "indicador": "Marcação - Ativo",
      "meta": 20,
      "realizado": 7,
      "pctMeta": 0.35
    },
    {
      "indicador": "Leads - Orgânicos",
      "meta": 150,
      "realizado": 119,
      "pctMeta": 0.79
    },
    {
      "indicador": "Leads - Indicação Sucesso - Upsell",
      "meta": 80,
      "realizado": 26,
      "pctMeta": 0.33
    },
    {
      "indicador": "Leads - Indicação Dr. Fernando",
      "meta": 0,
      "realizado": 0,
      "pctMeta": 0
    },
    {
      "indicador": "Faturamento do dia",
      "meta": 800000,
      "realizado": 632478,
      "pctMeta": 0.79
    }
  ],
  "Dra Isa": [
    {
      "indicador": "Ticket Médio Upsell",
      "meta": 0,
      "realizado": 4127.178571428572,
      "pctMeta": 0
    },
    {
      "indicador": "Qde de Upsell - Vacinas",
      "meta": 0,
      "realizado": 9,
      "pctMeta": 0
    },
    {
      "indicador": "Qde de Upsell - Plano de Acomp Geral",
      "meta": 0,
      "realizado": 39,
      "pctMeta": 0
    },
    {
      "indicador": "Qde de Upsell - Pago",
      "meta": 0,
      "realizado": 0,
      "pctMeta": 0
    },
    {
      "indicador": "Qde de Upsell - Orgânico",
      "meta": 0,
      "realizado": 19,
      "pctMeta": 0
    },
    {
      "indicador": "Qde de Upsell - Indicação",
      "meta": 0,
      "realizado": 0,
      "pctMeta": 0
    },
    {
      "indicador": "Qde de Upsell - Acompanhamento",
      "meta": 0,
      "realizado": 20,
      "pctMeta": 0
    },
    {
      "indicador": "Marcação - Retenção",
      "meta": 50,
      "realizado": 27,
      "pctMeta": 0.54
    },
    {
      "indicador": "Marcação - Pago",
      "meta": 5,
      "realizado": 0,
      "pctMeta": 0
    },
    {
      "indicador": "Marcação - Orgânico",
      "meta": 25,
      "realizado": 21,
      "pctMeta": 0.84
    },
    {
      "indicador": "Marcação - Indicação",
      "meta": 5,
      "realizado": 0,
      "pctMeta": 0
    },
    {
      "indicador": "Marcação - Ativo",
      "meta": 10,
      "realizado": 7,
      "pctMeta": 0.7
    },
    {
      "indicador": "Leads Pagos - Google",
      "meta": 80,
      "realizado": 15,
      "pctMeta": 0.19
    },
    {
      "indicador": "Leads - Orgânicos",
      "meta": 100,
      "realizado": 199,
      "pctMeta": 1.99
    },
    {
      "indicador": "Leads - Indicação",
      "meta": 15,
      "realizado": 0,
      "pctMeta": 0
    },
    {
      "indicador": "Faturamento do dia",
      "meta": 240000,
      "realizado": 213862.5,
      "pctMeta": 0.89
    },
    {
      "indicador": "Fat. Vacina",
      "meta": 40000,
      "realizado": 10380,
      "pctMeta": 0.26
    },
    {
      "indicador": "Fat. Planos de Acompanhamento - Pago",
      "meta": 3600,
      "realizado": 0,
      "pctMeta": 0
    },
    {
      "indicador": "Fat. Planos de Acompanhamento - Orgânico",
      "meta": 50000,
      "realizado": 90110,
      "pctMeta": 1.8
    },
    {
      "indicador": "Fat. Planos de Acompanhamento - Indicação",
      "meta": 3600,
      "realizado": 0,
      "pctMeta": 0
    },
    {
      "indicador": "Fat. Planos de Acompanhamento - Acompanhamentos",
      "meta": 128700,
      "realizado": 83231.5,
      "pctMeta": 0.65
    },
    {
      "indicador": "Fat. Consulta",
      "meta": 40000,
      "realizado": 30141,
      "pctMeta": 0.75
    },
    {
      "indicador": "Conversão Vacina",
      "meta": 0,
      "realizado": 10,
      "pctMeta": 0
    },
    {
      "indicador": "Conversão Upsell - Pago",
      "meta": 0,
      "realizado": 0,
      "pctMeta": 0
    },
    {
      "indicador": "Conversão Upsell - Orgânico",
      "meta": 0,
      "realizado": 16,
      "pctMeta": 0
    },
    {
      "indicador": "Conversão Upsell - Indicação",
      "meta": 0,
      "realizado": 0,
      "pctMeta": 0
    },
    {
      "indicador": "Conversão Upsell - Acompanhamento",
      "meta": 0,
      "realizado": 26,
      "pctMeta": 0
    },
    {
      "indicador": "Conversão - Plano de Acomp Geral",
      "meta": 50,
      "realizado": 42,
      "pctMeta": 0.84
    }
  ],
  "Dra Thaís": [
    {
      "indicador": "Conversão Upsell - Acompanhamento",
      "meta": 0,
      "realizado": 8,
      "pctMeta": 0
    },
    {
      "indicador": "Conversão Upsell - Crossell",
      "meta": 0,
      "realizado": 4,
      "pctMeta": 0
    },
    {
      "indicador": "Conversão Upsell - Indicação",
      "meta": 0,
      "realizado": 2,
      "pctMeta": 0
    },
    {
      "indicador": "Conversão Upsell - Orgânico",
      "meta": 0,
      "realizado": 2,
      "pctMeta": 0
    },
    {
      "indicador": "Conversão Upsell Geral",
      "meta": 36,
      "realizado": 16,
      "pctMeta": 0.44
    },
    {
      "indicador": "Fat. Consulta",
      "meta": 10000,
      "realizado": 9600,
      "pctMeta": 0.96
    },
    {
      "indicador": "Fat. Protocolo Acompanhamento",
      "meta": 54000,
      "realizado": 32000,
      "pctMeta": 0.59
    },
    {
      "indicador": "Fat. Protocolo Crossell",
      "meta": 40000,
      "realizado": 26460,
      "pctMeta": 0.66
    },
    {
      "indicador": "Fat. Protocolo Indicação",
      "meta": 33600,
      "realizado": 11300,
      "pctMeta": 0.34
    },
    {
      "indicador": "Fat. Protocolo Orgânico",
      "meta": 32000,
      "realizado": 15350,
      "pctMeta": 0.48
    },
    {
      "indicador": "Faturamento do dia",
      "meta": 105000,
      "realizado": 94710,
      "pctMeta": 0.9
    },
    {
      "indicador": "Leads - Crossell",
      "meta": 14,
      "realizado": 5,
      "pctMeta": 0.36
    },
    {
      "indicador": "Leads - Indicação",
      "meta": 14,
      "realizado": 4,
      "pctMeta": 0.29
    },
    {
      "indicador": "Leads - Orgânicos",
      "meta": 150,
      "realizado": 42,
      "pctMeta": 0.28
    },
    {
      "indicador": "Leads - Pagos",
      "meta": 50,
      "realizado": 4,
      "pctMeta": 0.08
    },
    {
      "indicador": "Marcação - Ativo",
      "meta": 16,
      "realizado": 18,
      "pctMeta": 1.13
    },
    {
      "indicador": "Marcação - Crossell",
      "meta": 11,
      "realizado": 2,
      "pctMeta": 0.18
    },
    {
      "indicador": "Marcação - Indicação",
      "meta": 9,
      "realizado": 4,
      "pctMeta": 0.44
    },
    {
      "indicador": "Marcação - Orgânico",
      "meta": 7,
      "realizado": 2,
      "pctMeta": 0.29
    },
    {
      "indicador": "Marcação - Pago",
      "meta": 1,
      "realizado": 0,
      "pctMeta": 0
    },
    {
      "indicador": "Qde de Upsell - Acompanhamento",
      "meta": 0,
      "realizado": 18,
      "pctMeta": 0
    },
    {
      "indicador": "Qde de Upsell - Crossell",
      "meta": 0,
      "realizado": 5,
      "pctMeta": 0
    },
    {
      "indicador": "Qde de Upsell - Geral",
      "meta": 40,
      "realizado": 30,
      "pctMeta": 0.75
    },
    {
      "indicador": "Qde de Upsell - Indicação",
      "meta": 0,
      "realizado": 4,
      "pctMeta": 0
    },
    {
      "indicador": "Qde de Upsell - Orgânico",
      "meta": 0,
      "realizado": 3,
      "pctMeta": 0
    },
    {
      "indicador": "Ticket Médio Upsell",
      "meta": 5919.375,
      "realizado": 5919.375,
      "pctMeta": 1
    }
  ]
},
};

// ---------- Detalhe por profissional ----------
export const profissionais = {
  "Dr Fernando": {
    servico: "Nutrologia",
    faturamentoDia: 632478,
    faturamentoDiaLM: 1243831.16,
    faturamentoProtocolo: 632478,
    ticketMedioUpsell: 12649.56,
    ticketMedioUpsellLM: 17518.75,
    ticketMedioAgenda: 10904.79,
    ticketMedioAgendaLM: 11511.39,
    totalLeads: 413,
    totalLeadsLM: 340,
    marcacoes: 38,
    marcacoesLM: 52,
  },
  "Dra Isa": {
    servico: "Pediatria",
    faturamentoDia: 213862.5,
    faturamentoDiaLM: 225650.39,
    faturamentoVacina: 10380,
    faturamentoVacinaLM: 10570.42,
    ticketMedioGeral: 307.56,
    ticketMedioGeralLM: 353.65,
    ticketMedioUpsell: 0,
    ticketMedioUpsellLM: 0,
    totalLeads: 214,
    totalLeadsLM: 170,
    marcacoes: 21,
    marcacoesLM: 23,
  },
  "Dra Thaís": {
    servico: "Dermatologia",
    faturamentoDia: 94710,
    faturamentoDiaLM: 119165,
    ticketMedioConsulta: 266.67,
    ticketMedioConsultaLM: 353.65,
    quantidadeConsultas: 36,
    quantidadeConsultasLM: 35,
    marcacoes: 24,
    marcacoesLM: 11,
  },
};

// ---------- Filtros disponíveis ----------
// Nota: canais e servicos incluem apenas os que têm dados no dashboard.
// O Power BI original tem mais opções (Google, Meta, By Evuli, etc.) mas sem dados extraídos.
export const filtros = {
  anos: [2025, 2026],
  meses: [
    "janeiro", "fevereiro", "março", "abril",
    "maio", "junho", "julho", "agosto",
    "setembro", "outubro", "novembro", "dezembro",
  ],
  canais: ["Ativo", "Crossell", "Indicação", "Orgânico", "Pago", "Retenção"],
  servicos: ["Dermatologia", "Nutrologia", "Pediatria"],
  periodos: ["Realizado", "Simulado"],
};

// ---------- Dados exaustivos via API (querydata direto) ----------
// Extraídos em 2026-06-19 via replay de chamadas querydata à API do Power BI.
// 159 queries, 40+ combinações de filtros.

export const anual = {
  "2025": {
    faturamento: 13_433_285.05,
    pctMeta: 1.0013,
    ocupacaoAgenda: 2636,
    comparecidos: 2438,
    leads: 5000,
  },
  "2026": {
    faturamento: 6_315_993.99,
    faturamentoLM: 1_007_114.80,
    pctMeta: 0.96,
    ocupacaoAgenda: 1269,
    comparecidos: 1142,
    leads: 2331,
  },
};

export const faturamentoPorCanalAno = {
  "2026": {
    "Retenção": 2_309_959,
    "Orgânico": 1_180_953,
    "Indicação": 597_493,
    "Ativo": 558_628,
    "Crossell": 145_000,
    "Pago": 40_500,
  },
};

export const ticketMedioServico = {
  geral: 10_430.75,
  porServico: {
    "Nutrologia": 10_230.04,
    "Pediatria": 0,
    "Dermatologia": 2_463.80,
  },
};

export const metaLeadsCanal = {
  geral: 0,
  porCanal: {
    "Pago": 4_650,
    "Orgânico": 1_930,
    "Meta": 1_440,
    "Google": 1_240,
    "Indicação": 560,
    "Crossell": 104,
    "Ativo": null,
    "Retenção": null,
  },
};

export const dadosPorCanal = {
  "Retenção": {
    faturamento: 557_344,
    ticketMedio: 17_417,
    leads: 62,
    marcados: 57,
    conversao: 0.9194,
    conversaoUpsell: 32,
  },
  "Ativo": {
    faturamento: 153_120,
    ticketMedio: 15_312,
    leads: 200,
    marcados: 42,
    conversao: 0.21,
    conversaoUpsell: 10,
  },
  "Orgânico": {
    faturamento: 236_878,
    ticketMedio: 23_687.80,
    leads: 366,
    marcados: 41,
    conversao: 0.112,
    conversaoUpsell: 10,
  },
  "Indicação": {
    faturamento: 109_164,
    ticketMedio: 18_194,
    leads: 107,
    marcados: 9,
    conversao: 0.0841,
    conversaoUpsell: 6,
  },
  "Crossell": {
    faturamento: 50_700,
    ticketMedio: 0,
    leads: 49,
    marcados: 7,
    conversao: 0.1429,
    conversaoUpsell: 0,
  },
  "Pago": {
    faturamento: 0,
    ticketMedio: 0,
    leads: 16,
    marcados: 0,
    conversao: 0,
    conversaoUpsell: 0,
  },
  "Google": {
    faturamento: null,
    ticketMedio: null,
    leads: null,
    marcados: null,
    conversao: null,
    conversaoUpsell: null,
  },
  "Meta": {
    faturamento: null,
    ticketMedio: null,
    leads: null,
    marcados: null,
    conversao: null,
    conversaoUpsell: null,
  },
};

export const dadosPorServico = {
  "Nutrologia": {
    faturamento: 1_020_706,
    ticketMedioServico: 10_230.04,
    ticketMedioConsultas: null,
    leads: null,
  },
  "Pediatria": {
    faturamento: 213_862.50,
    ticketMedioServico: 0,
    ticketMedioConsultas: 307.56,
    leads: 214,
  },
  "Dermatologia": {
    faturamento: 157_500,
    ticketMedioServico: 2_463.80,
    ticketMedioConsultas: 266.67,
    leads: null,
  },
};

export const extractionMeta = {
  method: "Playwright + direct API replay",
  capturedAt: "2026-06-19",
  querydataResponses: 93,
  apiQueries: 159,
  totalDataPoints: 252,
  uniqueMeasures: 132,
  uniqueDimensions: 16,
  filterCombosExercised: 40,
  pages: 10,
  slicers: 26,
  completeness: "100% of accessible measures via public API",
  notes: [
    "2 measures only accessible via direct API (hidden page 8)",
    "Year filters require 'L' suffix (e.g., '2026L')",
    "Month filters use Portuguese names (e.g., 'maio')",
    "2 queries returned 0 rows (Dra Thaís: upsell, procedimentos) — legitimate empty",
  ],
};

// ---------- Dados de Fase 2: Medidas que faltavam ----------

// Taxas de conversão por etapa do funil (Dr Fernando)
export const conversaoEtapas = {
  etapa1: 0.6211, // Leads → Ocupação Agenda
  etapa2: 0.9209, // Ocupação → Comparecidos
  etapa3: 0.4417, // Comparecidos → Upsell
  etapa4: 0.8611, // Upsell → Faturamento
};

// Conversão por canal por profissional (extraído das páginas 5, 6, 7 do Power BI)
export const conversaoPorCanalProfissional = {
  "Dr Fernando": [
    { canal: "Retenção", leads: 68, marcados: 25, conversao: 0.3676 },
    { canal: "Orgânico", leads: 119, marcados: 11, conversao: 0.0924 },
    { canal: "Ativo", leads: 200, marcados: 7, conversao: 0.035 },
    { canal: "Indicação", leads: 26, marcados: 7, conversao: 0.2692 },
    { canal: "Pago", leads: 0, marcados: 2, conversao: 0 },
  ],
  "Dra Isa": [
    { canal: "Indicação", leads: 0, marcados: 0, conversao: 0 },
    { canal: "Orgânico", leads: 199, marcados: 21, conversao: 0.1055 },
    { canal: "Pago", leads: 15, marcados: 0, conversao: 0 },
  ],
  "Dra Thaís": [
    // Nota: Dermatologia não tem dados de leads por canal no Power BI.
    // Os marcados são extraídos mas leads=0, resultando em conversão=0 (fallback no simulador).
    { canal: "Ativo", leads: 0, marcados: 18, conversao: 0 },
    { canal: "Crossell", leads: 0, marcados: 2, conversao: 0 },
    { canal: "Indicação", leads: 0, marcados: 4, conversao: 0 },
    { canal: "Orgânico", leads: 0, marcados: 2, conversao: 0 },
    { canal: "Pago", leads: 0, marcados: 0, conversao: 0 },
  ],
};

// Ticket Médio por período (Selecionado) — dados do Power BI
export const ticketMedioPeriodo = {
  "Dr Fernando": { atual: 12_649.56, periodo: "Abr 2026" },
  "Dra Isa": { atual: 307.56, periodo: "Mai 2026" },
  "Dra Thaís": { atual: 266.67, periodo: "Abr 2026" },
};

// Faturamento por período (Selecionado) — dados do Power BI
export const faturamentoPeriodo = {
  "Dr Fernando": { atual: 21_750, periodo: "Abr 2026" },
  "Dra Isa": { atual: 213_862.50, periodo: "Mai 2026" },
  "Dra Thaís": { atual: 9_600, periodo: "Abr 2026" },
};

// ---------- Dados mensais completos (extraídos via API) ----------
// Cada mês tem TODOS os KPIs principais + faturamento por canal.
// Usado para filtros de período e gráficos interativos.

export type KpisMes = {
  faturamento: number;
  faturamentoLM: number;
  leads: number;
  ocupacaoAgenda: number;
  comparecidos: number;
  qtdUpsell: number;
  ticketMedio: number;
  pctMeta: number;
  marcados: number;
  faturamentoPorCanal: Record<string, number>;
  faturamentoPorServico: Record<string, number>;
};

export const kpisMensal: Record<string, KpisMes> = {
  // ---------- 2025 ----------
  janeiro: {
    faturamento: 996_586.76,
    faturamentoLM: 0,
    leads: 500,
    ocupacaoAgenda: 222,
    comparecidos: 211,
    qtdUpsell: 190,
    ticketMedio: 9_313.89,
    pctMeta: 0.953,
    marcados: 68,
    faturamentoPorCanal: {},
    faturamentoPorServico: {},
  },
  fevereiro: {
    faturamento: 781_541.49,
    faturamentoLM: 996_586.76,
    leads: 506,
    ocupacaoAgenda: 191,
    comparecidos: 182,
    qtdUpsell: 113,
    ticketMedio: 9_416.16,
    pctMeta: 0.876,
    marcados: 37,
    faturamentoPorCanal: {},
    faturamentoPorServico: {},
  },
  março: {
    faturamento: 741_876.57,
    faturamentoLM: 781_541.49,
    leads: 661,
    ocupacaoAgenda: 153,
    comparecidos: 146,
    qtdUpsell: 104,
    ticketMedio: 10_598.24,
    pctMeta: 0.893,
    marcados: 53,
    faturamentoPorCanal: {},
    faturamentoPorServico: {},
  },
  abril: {
    faturamento: 879_493.49,
    faturamentoLM: 741_876.57,
    leads: 504,
    ocupacaoAgenda: 228,
    comparecidos: 215,
    qtdUpsell: 177,
    ticketMedio: 8_143.46,
    pctMeta: 0.879,
    marcados: 64,
    faturamentoPorCanal: {},
    faturamentoPorServico: {},
  },
  maio: {
    faturamento: 1_251_071.95,
    faturamentoLM: 879_493.49,
    leads: 488,
    ocupacaoAgenda: 236,
    comparecidos: 216,
    qtdUpsell: 222,
    ticketMedio: 11_692.26,
    pctMeta: 1.251,
    marcados: 72,
    faturamentoPorCanal: {},
    faturamentoPorServico: {},
  },
  junho: {
    faturamento: 1_284_529.18,
    faturamentoLM: 1_251_071.95,
    leads: 335,
    ocupacaoAgenda: 225,
    comparecidos: 217,
    qtdUpsell: 158,
    ticketMedio: 11_367.51,
    pctMeta: 1.274,
    marcados: 64,
    faturamentoPorCanal: {},
    faturamentoPorServico: {},
  },
  julho: {
    faturamento: 1_232_619.93,
    faturamentoLM: 1_284_529.18,
    leads: 337,
    ocupacaoAgenda: 262,
    comparecidos: 240,
    qtdUpsell: 164,
    ticketMedio: 9_130.52,
    pctMeta: 0.978,
    marcados: 96,
    faturamentoPorCanal: {},
    faturamentoPorServico: {},
  },
  agosto: {
    faturamento: 1_393_732.07,
    faturamentoLM: 1_232_619.93,
    leads: 315,
    ocupacaoAgenda: 224,
    comparecidos: 208,
    qtdUpsell: 146,
    ticketMedio: 11_518.45,
    pctMeta: 1.106,
    marcados: 75,
    faturamentoPorCanal: {},
    faturamentoPorServico: {},
  },
  setembro: {
    faturamento: 1_395_459.37,
    faturamentoLM: 1_393_732.07,
    leads: 372,
    ocupacaoAgenda: 266,
    comparecidos: 232,
    qtdUpsell: 128,
    ticketMedio: 10_413.88,
    pctMeta: 1.108,
    marcados: 81,
    faturamentoPorCanal: {},
    faturamentoPorServico: {},
  },
  outubro: {
    faturamento: 1_309_090.40,
    faturamentoLM: 1_395_459.37,
    leads: 353,
    ocupacaoAgenda: 250,
    comparecidos: 225,
    qtdUpsell: 111,
    ticketMedio: 10_227.27,
    pctMeta: 1.007,
    marcados: 93,
    faturamentoPorCanal: {},
    faturamentoPorServico: {},
  },
  novembro: {
    faturamento: 1_160_169.04,
    faturamentoLM: 1_309_090.40,
    leads: 344,
    ocupacaoAgenda: 202,
    comparecidos: 183,
    qtdUpsell: 98,
    ticketMedio: 10_001.46,
    pctMeta: 0.906,
    marcados: 65,
    faturamentoPorCanal: {},
    faturamentoPorServico: {},
  },
  dezembro: {
    faturamento: 1_007_114.80,
    faturamentoLM: 1_160_169.04,
    leads: 285,
    ocupacaoAgenda: 177,
    comparecidos: 163,
    qtdUpsell: 72,
    ticketMedio: 10_829.19,
    pctMeta: 0.787,
    marcados: 40,
    faturamentoPorCanal: {},
    faturamentoPorServico: {},
  },
  // ---------- 2026 (ano corrente) ----------
  // Nota: os meses de 2026 abaixo têm faturamentoPorCanal e faturamentoPorServico
  // porque o Power BI só fornece breakdown por canal/serviço no ano corrente.
  "janeiro-2026": {
    faturamento: 1_233_927.99,
    faturamentoLM: 1_007_114.80,
    leads: 478,
    ocupacaoAgenda: 272,
    comparecidos: 244,
    qtdUpsell: 7,
    ticketMedio: 9_271.12,
    pctMeta: 1.0198,
    marcados: 88,
    faturamentoPorCanal: { "Retenção": 361_875, "Ativo": 90_250, "Orgânico": 347_850, "Indicação": 103_800, "Crossell": 25_800, "Pago": 0 },
    faturamentoPorServico: { "Nutrologia": 900_225, "Pediatria": 202_802.99, "Dermatologia": 130_900 },
  },
  "fevereiro-2026": {
    faturamento: 953_173.00,
    faturamentoLM: 1_233_927.99,
    leads: 355,
    ocupacaoAgenda: 204,
    comparecidos: 186,
    qtdUpsell: 7,
    ticketMedio: 10_405.92,
    pctMeta: 1.003,
    marcados: 71,
    faturamentoPorCanal: { "Retenção": 262_850, "Ativo": 113_750, "Orgânico": 191_825, "Indicação": 167_440, "Crossell": 20_700, "Pago": 0 },
    faturamentoPorServico: { "Nutrologia": 725_025, "Pediatria": 147_808, "Dermatologia": 80_340 },
  },
  "março-2026": {
    faturamento: 1_243_831.16,
    faturamentoLM: 953_173.00,
    leads: 415,
    ocupacaoAgenda: 243,
    comparecidos: 212,
    qtdUpsell: 13,
    ticketMedio: 11_734.26,
    pctMeta: 1.168,
    marcados: 79,
    faturamentoPorCanal: { "Retenção": 518_900, "Ativo": 25_500, "Orgânico": 270_050, "Indicação": 82_625, "Crossell": 17_440, "Pago": 10_500 },
    faturamentoPorServico: { "Nutrologia": 909_400, "Pediatria": 215_266.16, "Dermatologia": 119_165 },
  },
  "abril-2026": {
    faturamento: 952_838.39,
    faturamentoLM: 1_243_831.16,
    leads: 365,
    ocupacaoAgenda: 198,
    comparecidos: 180,
    qtdUpsell: 12,
    ticketMedio: 10_706.05,
    pctMeta: 0.895,
    marcados: 84,
    faturamentoPorCanal: { "Retenção": 357_678, "Ativo": 50_000, "Orgânico": 125_600, "Indicação": 83_100, "Crossell": 26_460, "Pago": 21_000 },
    faturamentoPorServico: { "Nutrologia": 632_478, "Pediatria": 225_650.39, "Dermatologia": 94_710 },
  },
  "maio-2026": {
    faturamento: 1_392_068.50,
    faturamentoLM: 952_838.39,
    leads: 489,
    ocupacaoAgenda: 228,
    comparecidos: 209,
    qtdUpsell: 9,
    ticketMedio: 12_541.16,
    pctMeta: 0.934,
    marcados: 99,
    faturamentoPorCanal: { "Retenção": 557_344, "Ativo": 153_120, "Orgânico": 236_878, "Indicação": 109_164, "Crossell": 50_700, "Pago": 0 },
    faturamentoPorServico: { "Nutrologia": 1_020_706, "Pediatria": 213_862.50, "Dermatologia": 157_500 },
  },
  "junho-2026": {
    faturamento: 540_154.95,
    faturamentoLM: 1_392_068.50,
    leads: 229,
    ocupacaoAgenda: 124,
    comparecidos: 111,
    qtdUpsell: 7,
    ticketMedio: 11_257.23,
    pctMeta: 0.5627,
    marcados: 61,
    faturamentoPorCanal: { "Retenção": 251_312, "Ativo": 126_008, "Orgânico": 8_750, "Indicação": 51_364, "Crossell": 3_900, "Pago": 9_000 },
    faturamentoPorServico: { "Nutrologia": 457_934, "Pediatria": 82_220.95, "Dermatologia": 90_250 },
  },
};
