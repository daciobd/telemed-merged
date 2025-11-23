export interface DadosEpidemiologicos {
  regiao: string;
  estado?: string;
  populacao: string;
  indicadores: {
    diabetes: number;
    hipertensao: number;
    obesidade: number;
    tabagismo: number;
    alcoolismo: number;
  };
  prevalencias: Array<{
    condicao: string;
    percentual: number;
    tendencia: 'subindo' | 'estavel' | 'descendo';
  }>;
}

export const dadosBrasil: DadosEpidemiologicos[] = [
  {
    regiao: 'Brasil',
    populacao: '215.3 milhões',
    indicadores: {
      diabetes: 8.4,
      hipertensao: 24.1,
      obesidade: 19.8,
      tabagismo: 9.8,
      alcoolismo: 14.2
    },
    prevalencias: [
      { condicao: 'Hipertensão', percentual: 24.1, tendencia: 'subindo' },
      { condicao: 'Obesidade', percentual: 19.8, tendencia: 'subindo' },
      { condicao: 'Diabetes', percentual: 8.4, tendencia: 'estavel' },
      { condicao: 'DPOC', percentual: 5.2, tendencia: 'descendo' },
      { condicao: 'Asma', percentual: 12.3, tendencia: 'estavel' }
    ]
  },
  {
    regiao: 'Sudeste',
    estado: 'São Paulo',
    populacao: '46.6 milhões',
    indicadores: {
      diabetes: 9.2,
      hipertensao: 25.8,
      obesidade: 20.1,
      tabagismo: 8.9,
      alcoolismo: 15.3
    },
    prevalencias: [
      { condicao: 'Hipertensão', percentual: 25.8, tendencia: 'subindo' },
      { condicao: 'Obesidade', percentual: 20.1, tendencia: 'subindo' },
      { condicao: 'Diabetes', percentual: 9.2, tendencia: 'estavel' },
      { condicao: 'IAM', percentual: 1.8, tendencia: 'descendo' },
      { condicao: 'AVC', percentual: 1.5, tendencia: 'descendo' }
    ]
  },
  {
    regiao: 'Sul',
    estado: 'Rio Grande do Sul',
    populacao: '11.5 milhões',
    indicadores: {
      diabetes: 9.8,
      hipertensao: 27.2,
      obesidade: 21.5,
      tabagismo: 12.1,
      alcoolismo: 16.8
    },
    prevalencias: [
      { condicao: 'Hipertensão', percentual: 27.2, tendencia: 'subindo' },
      { condicao: 'Obesidade', percentual: 21.5, tendencia: 'subindo' },
      { condicao: 'Diabetes', percentual: 9.8, tendencia: 'estavel' },
      { condicao: 'Câncer colorretal', percentual: 2.1, tendencia: 'subindo' }
    ]
  },
  {
    regiao: 'Nordeste',
    estado: 'Bahia',
    populacao: '14.9 milhões',
    indicadores: {
      diabetes: 7.1,
      hipertensao: 22.4,
      obesidade: 18.2,
      tabagismo: 8.2,
      alcoolismo: 11.5
    },
    prevalencias: [
      { condicao: 'Hipertensão', percentual: 22.4, tendencia: 'subindo' },
      { condicao: 'Obesidade', percentual: 18.2, tendencia: 'subindo' },
      { condicao: 'Diabetes', percentual: 7.1, tendencia: 'estavel' },
      { condicao: 'Doença de Chagas', percentual: 0.8, tendencia: 'descendo' }
    ]
  }
];

export interface TendenciaSazonal {
  mes: string;
  respiratorias: number;
  cardiovasculares: number;
  infecciosas: number;
  trauma: number;
}

export const tendenciasSazonais: TendenciaSazonal[] = [
  { mes: 'Jan', respiratorias: 22, cardiovasculares: 28, infecciosas: 18, trauma: 15 },
  { mes: 'Fev', respiratorias: 20, cardiovasculares: 26, infecciosas: 16, trauma: 17 },
  { mes: 'Mar', respiratorias: 18, cardiovasculares: 25, infecciosas: 14, trauma: 16 },
  { mes: 'Abr', respiratorias: 15, cardiovasculares: 24, infecciosas: 12, trauma: 14 },
  { mes: 'Mai', respiratorias: 18, cardiovasculares: 26, infecciosas: 13, trauma: 13 },
  { mes: 'Jun', respiratorias: 25, cardiovasculares: 30, infecciosas: 15, trauma: 12 },
  { mes: 'Jul', respiratorias: 28, cardiovasculares: 32, infecciosas: 16, trauma: 11 },
  { mes: 'Ago', respiratorias: 26, cardiovasculares: 31, infecciosas: 14, trauma: 12 },
  { mes: 'Set', respiratorias: 22, cardiovasculares: 28, infecciosas: 13, trauma: 14 },
  { mes: 'Out', respiratorias: 19, cardiovasculares: 26, infecciosas: 15, trauma: 15 },
  { mes: 'Nov', respiratorias: 20, cardiovasculares: 27, infecciosas: 17, trauma: 16 },
  { mes: 'Dez', respiratorias: 23, cardiovasculares: 29, infecciosas: 19, trauma: 18 }
];

export interface CausaMortalidade {
  causa: string;
  percentual: number;
  mortes_ano: string;
  cor: string;
}

export const causasMortalidade: CausaMortalidade[] = [
  { causa: 'Doenças Cardiovasculares', percentual: 28, mortes_ano: '400 mil', cor: '#ef4444' },
  { causa: 'Neoplasias', percentual: 17, mortes_ano: '243 mil', cor: '#8b5cf6' },
  { causa: 'Doenças Respiratórias', percentual: 12, mortes_ano: '172 mil', cor: '#3b82f6' },
  { causa: 'Causas Externas', percentual: 11, mortes_ano: '158 mil', cor: '#f59e0b' },
  { causa: 'Diabetes', percentual: 5, mortes_ano: '72 mil', cor: '#10b981' },
  { causa: 'Doenças Infecciosas', percentual: 4, mortes_ano: '57 mil', cor: '#06b6d4' },
  { causa: 'Outras', percentual: 23, mortes_ano: '329 mil', cor: '#6b7280' }
];

export interface AlertaEpidemiologico {
  id: string;
  titulo: string;
  descricao: string;
  regiao: string;
  severidade: 'alta' | 'media' | 'baixa';
  data: string;
}

export const alertasEpidemiologicos: AlertaEpidemiologico[] = [
  {
    id: '1',
    titulo: 'Aumento de Casos de Dengue',
    descricao: 'Surto sazonal em regiões com temperatura elevada',
    regiao: 'Sudeste e Centro-Oeste',
    severidade: 'alta',
    data: '2025-11-20'
  },
  {
    id: '2',
    titulo: 'Temporada de Influenza',
    descricao: 'Aumento esperado de casos de gripe no inverno',
    regiao: 'Sul e Sudeste',
    severidade: 'media',
    data: '2025-11-18'
  },
  {
    id: '3',
    titulo: 'Vacinação COVID-19',
    descricao: 'Campanha de reforço para grupos prioritários',
    regiao: 'Nacional',
    severidade: 'media',
    data: '2025-11-15'
  }
];
