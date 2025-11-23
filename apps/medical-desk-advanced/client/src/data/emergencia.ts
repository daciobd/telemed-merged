export interface AcessoRapido {
  id: string;
  nome: string;
  categoria: 'triagem' | 'abcde' | 'drogas' | 'scores';
  descricao: string;
  icon: string;
  conteudo: any;
}

export const acessosRapidos: AcessoRapido[] = [
  {
    id: 'triagem-manchester',
    nome: 'Triagem Manchester',
    categoria: 'triagem',
    descricao: 'Sistema de classificação por prioridade',
    icon: 'AlertCircle',
    conteudo: {
      niveis: [
        { cor: 'Vermelho', prioridade: 'Emergência', tempo: 'Imediato', exemplos: ['PCR', 'Choque', 'Via aérea comprometida'] },
        { cor: 'Laranja', prioridade: 'Muito Urgente', tempo: '10 minutos', exemplos: ['Dor torácica', 'AVC', 'Trauma grave'] },
        { cor: 'Amarelo', prioridade: 'Urgente', tempo: '60 minutos', exemplos: ['Fratura exposta', 'Cefaleia intensa', 'Febre alta'] },
        { cor: 'Verde', prioridade: 'Pouco Urgente', tempo: '120 minutos', exemplos: ['Entorse', 'Resfriado', 'Ferimentos leves'] },
        { cor: 'Azul', prioridade: 'Não Urgente', tempo: '240 minutos', exemplos: ['Atestado', 'Orientação', 'Consulta de rotina'] }
      ]
    }
  },
  {
    id: 'abcde-primary',
    nome: 'ABCDE Primary Survey',
    categoria: 'abcde',
    descricao: 'Avaliação sistemática inicial de trauma',
    icon: 'Activity',
    conteudo: {
      passos: [
        {
          letra: 'A',
          nome: 'Airway + Cervical Spine',
          acoes: ['Permeabilidade via aérea', 'Proteção cervical', 'Considerar IOT se Glasgow ≤ 8'],
          sinais_alerta: ['Estridor', 'Rouquidão', 'Cianose']
        },
        {
          letra: 'B',
          nome: 'Breathing',
          acoes: ['Ausculta pulmonar', 'FR e SatO2', 'Descomprimir pneumotórax hipertensivo'],
          sinais_alerta: ['Tiragem', 'Taquipneia > 30', 'Desvio de traqueia']
        },
        {
          letra: 'C',
          nome: 'Circulation',
          acoes: ['2 acessos calibrosos', 'Controle de hemorragia', 'Cristaloide aquecido'],
          sinais_alerta: ['Hipotensão', 'Taquicardia', 'Extremidades frias']
        },
        {
          letra: 'D',
          nome: 'Disability',
          acoes: ['Glasgow', 'Pupilas', 'Glicemia capilar'],
          sinais_alerta: ['Glasgow < 9', 'Anisocoria', 'Hipoglicemia']
        },
        {
          letra: 'E',
          nome: 'Exposure',
          acoes: ['Despir completamente', 'Prevenir hipotermia', 'Examinar dorso'],
          sinais_alerta: ['Equimoses', 'Deformidades', 'Temperatura < 35°C']
        }
      ]
    }
  },
  {
    id: 'drogas-emergency',
    nome: 'Drogas de Emergência',
    categoria: 'drogas',
    descricao: 'Medicações críticas com doses',
    icon: 'Pill',
    conteudo: {
      drogas: [
        {
          nome: 'Adrenalina',
          indicacoes: ['PCR', 'Anafilaxia', 'Choque'],
          doses: {
            pcr: '1mg IV/IO a cada 3-5 min',
            anafilaxia: '0.3-0.5mg IM (1:1000)',
            choque: '0.05-0.5 mcg/kg/min infusão'
          }
        },
        {
          nome: 'Amiodarona',
          indicacoes: ['FV/TV refratária', 'Taquiarritmia estável'],
          doses: {
            pcr: '300mg IV bolus, depois 150mg',
            arritmia: '150mg IV em 10 min'
          }
        },
        {
          nome: 'Atropina',
          indicacoes: ['Bradicardia sintomática', 'Intoxicação colinérgica'],
          doses: {
            bradicardia: '0.5mg IV, repetir até 3mg',
            intoxicacao: '2-5mg IV em bolus'
          }
        },
        {
          nome: 'Fentanil',
          indicacoes: ['Analgesia', 'Sedação para IOT'],
          doses: {
            analgesia: '0.5-1 mcg/kg IV',
            iot: '2-3 mcg/kg IV'
          }
        },
        {
          nome: 'Midazolam',
          indicacoes: ['Sedação', 'Status epilepticus'],
          doses: {
            sedacao: '0.05-0.1 mg/kg IV',
            convulsao: '0.2 mg/kg IM ou 5-10mg IV'
          }
        },
        {
          nome: 'Noradrenalina',
          indicacoes: ['Choque distributivo', 'Choque séptico'],
          doses: {
            infusao: '0.05-3 mcg/kg/min (titular PAM ≥ 65)'
          }
        }
      ]
    }
  },
  {
    id: 'scores-rapidos',
    nome: 'Scores Rápidos',
    categoria: 'scores',
    descricao: 'Calculadoras de risco instantâneas',
    icon: 'Calculator',
    conteudo: {
      scores: [
        {
          nome: 'NEWS2',
          descricao: 'National Early Warning Score',
          uso: 'Detectar deterioração clínica',
          parametros: ['FR', 'SatO2', 'O2 suplementar', 'Temperatura', 'PAS', 'FC', 'Consciência']
        },
        {
          nome: 'APACHE II',
          descricao: 'Acute Physiology and Chronic Health Evaluation',
          uso: 'Predição de mortalidade em UTI',
          parametros: ['Idade', 'Doença crônica', '12 variáveis fisiológicas']
        },
        {
          nome: 'SOFA',
          descricao: 'Sequential Organ Failure Assessment',
          uso: 'Avaliar disfunção orgânica em sepse',
          parametros: ['Respiração', 'Coagulação', 'Fígado', 'Cardiovascular', 'SNC', 'Renal']
        }
      ]
    }
  }
];

export interface MetricaEmergencia {
  label: string;
  valor: string | number;
  variacao?: string;
  tipo: 'casos' | 'tempo' | 'precisao' | 'lotacao';
}

export const metricas: MetricaEmergencia[] = [
  { label: 'Casos Hoje', valor: 42, variacao: '+8% vs ontem', tipo: 'casos' },
  { label: 'Tempo Médio de Atendimento', valor: '18 min', variacao: '-12% vs média semanal', tipo: 'tempo' },
  { label: 'Precisão Diagnóstica', valor: '94.2%', variacao: '+2.1% este mês', tipo: 'precisao' },
  { label: 'Taxa de Ocupação', valor: '78%', variacao: 'Capacidade adequada', tipo: 'lotacao' }
];

export const distribuicaoPrioridade = [
  { nivel: 'Vermelho', quantidade: 3, percentual: 7 },
  { nivel: 'Laranja', quantidade: 12, percentual: 29 },
  { nivel: 'Amarelo', quantidade: 18, percentual: 43 },
  { nivel: 'Verde', quantidade: 7, percentual: 17 },
  { nivel: 'Azul', quantidade: 2, percentual: 4 }
];
