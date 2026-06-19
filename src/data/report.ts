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
  comparecidos: { atual: 209, anoAnterior: 216 },
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
export const faturamentoPorCanal = [
  {
    "canal": "Retenção",
    "faturamento": 557344,
    "ticketMedio": 17417
  },
  {
    "canal": "Orgânico",
    "faturamento": 236878,
    "ticketMedio": 23687.8
  },
  {
    "canal": "Ativo",
    "faturamento": 153120,
    "ticketMedio": 15312
  },
  {
    "canal": "Indicação",
    "faturamento": 109164,
    "ticketMedio": 18194
  },
  {
    "canal": "Crossell",
    "faturamento": 50700,
    "ticketMedio": 0
  },
  {
    "canal": "Pago",
    "faturamento": 0,
    "ticketMedio": 0
  }
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
  {
    "mes": "Dez 2025",
    "realizado": 1233927.99,
    "meta": 1210000
  },
  {
    "mes": "Jan 2026",
    "realizado": 953173,
    "meta": 950000
  },
  {
    "mes": "Fev 2026",
    "realizado": 1243831.1600000001,
    "meta": 1065000
  },
  {
    "mes": "Mar 2026",
    "realizado": 952838.39,
    "meta": 1065000
  },
  {
    "mes": "Abr 2026",
    "realizado": 1392068.5,
    "meta": 1490000
  },
  {
    "mes": "Mai 2026",
    "realizado": 540154.95,
    "meta": 960000
  }
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
      "pctMeta": 3349
    },
    {
      "indicador": "Qde de Upsell - Vacinas",
      "meta": 0,
      "realizado": 9,
      "pctMeta": 3349
    },
    {
      "indicador": "Qde de Upsell - Plano de Acomp Geral",
      "meta": 0,
      "realizado": 39,
      "pctMeta": 3349
    },
    {
      "indicador": "Qde de Upsell - Pago",
      "meta": 0,
      "realizado": 0,
      "pctMeta": 3349
    },
    {
      "indicador": "Qde de Upsell - Orgânico",
      "meta": 0,
      "realizado": 19,
      "pctMeta": 3349
    },
    {
      "indicador": "Qde de Upsell - Indicação",
      "meta": 0,
      "realizado": 0,
      "pctMeta": 3349
    },
    {
      "indicador": "Qde de Upsell - Acompanhamento",
      "meta": 0,
      "realizado": 20,
      "pctMeta": 3349
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
      "indicador": "Fat. Protocolo Acompahamento",
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
      "pctMeta": 0
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
    faturamentoProtocolo: 0,
    ticketMedioUpsell: 12649.56,
    ticketMedioUpsellLM: 17518.75,
    ticketMedioAgenda: 10904.79,
    ticketMedioAgendaLM: 11511.39,
    totalLeads: 0,
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
    faturamento: 6_468_578.12,
    faturamentoLM: 1_007_114.80,
    pctMeta: 0.96,
    ocupacaoAgenda: 1269,
    comparecidos: 1142,
    leads: 2331,
  },
};

export const faturamentoMensal2026 = [
  { mes: "Janeiro", valor: 1_260_872.30 },
  { mes: "Fevereiro", valor: 988_562.82 },
  { mes: "Março", valor: 1_243_831.16 },
  { mes: "Abril", valor: 952_838.39 },
  { mes: "Maio", valor: 1_392_068.50 },
  { mes: "Junho", valor: 630_404.95 },
];

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
