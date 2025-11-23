export interface CadeiaCuidado {
  id: string;
  nome: string;
  sigla: string;
  descricao: string;
  prioridade: 'emergencia' | 'timing-critico' | 'urgente' | 'eletivo';
  tempoEstimado: string;
  janelaOtima?: string;
  passos: Array<{
    ordem: number;
    nome: string;
    tempo: string;
    critico: boolean;
  }>;
  acoes: string[];
  alertas: string[];
  indicadores?: {
    pacientesAtivos: number;
    tempoMedio: string;
    taxa_sucesso: number;
  };
}

export const cadeiasCompletas: CadeiaCuidado[] = [
  {
    id: 'sca',
    nome: 'Cadeia SCA - Síndrome Coronariana Aguda',
    sigla: 'SCA',
    descricao: 'Protocolo Bundle Hora-1 para avaliação rápida de dor torácica',
    prioridade: 'emergencia',
    tempoEstimado: '15-20 minutos para avaliação inicial',
    janelaOtima: 'ECG em 10min | Reperfusão em 90min',
    passos: [
      { ordem: 1, nome: 'Triagem e identificação', tempo: '2 min', critico: true },
      { ordem: 2, nome: 'ECG de 12 derivações', tempo: '10 min', critico: true },
      { ordem: 3, nome: 'Coleta de troponina', tempo: '5 min', critico: false },
      { ordem: 4, nome: 'Estratificação de risco', tempo: '3 min', critico: false }
    ],
    acoes: [
      'AAS 200mg VO mastigável',
      'Clopidogrel 300mg ou Ticagrelor 180mg',
      'Morfina 2-4mg IV se dor persistente',
      'Heparina/Enoxaparina conforme protocolo',
      'Acionar hemodinâmica se IAMCSST'
    ],
    alertas: [
      'Supra de ST > 1mm em 2 derivações contíguas',
      'Bloqueio de ramo esquerdo novo',
      'Instabilidade hemodinâmica',
      'Dor torácica refratária'
    ],
    indicadores: {
      pacientesAtivos: 3,
      tempoMedio: '18 min',
      taxa_sucesso: 94
    }
  },
  {
    id: 'sepse',
    nome: 'Cadeia Sepse - Protocolo Bundle Hora-1',
    sigla: 'SEPSE',
    descricao: 'Bundle completo em 1 hora para sepse/choque séptico',
    prioridade: 'emergencia',
    tempoEstimado: 'Bundle completo em 1 hora',
    janelaOtima: 'Antibiótico em 60min',
    passos: [
      { ordem: 1, nome: 'Reconhecimento (qSOFA/SOFA)', tempo: '5 min', critico: true },
      { ordem: 2, nome: 'Hemoculturas (2 sítios)', tempo: '10 min', critico: true },
      { ordem: 3, nome: 'Lactato sérico', tempo: '5 min', critico: true },
      { ordem: 4, nome: 'Antibiótico de amplo espectro', tempo: '60 min', critico: true }
    ],
    acoes: [
      'Reposição volêmica: 30mL/kg cristaloide em 3h',
      'Vasopressor se PAM < 65 mmHg após volume',
      'Reavaliação clínica e lactato em 2-4h',
      'Identificar e controlar foco infeccioso'
    ],
    alertas: [
      'qSOFA ≥ 2 pontos',
      'Lactato > 2 mmol/L',
      'Hipotensão refratária a volume',
      'Disfunção orgânica progressiva'
    ],
    indicadores: {
      pacientesAtivos: 2,
      tempoMedio: '52 min',
      taxa_sucesso: 89
    }
  },
  {
    id: 'tep',
    nome: 'Cadeia TEP - Investigação Tromboembolismo Pulmonar',
    sigla: 'TEP',
    descricao: 'Avaliação de probabilidade e investigação diagnóstica estratificada',
    prioridade: 'timing-critico',
    tempoEstimado: 'Avaliação e início tratamento: 2-4 horas',
    janelaOtima: 'AngioTC em 4h se alto risco',
    passos: [
      { ordem: 1, nome: 'Avaliar estabilidade hemodinâmica', tempo: '5 min', critico: true },
      { ordem: 2, nome: 'Calcular escore de Wells', tempo: '5 min', critico: false },
      { ordem: 3, nome: 'Solicitar D-dímero ou AngioTC', tempo: '15 min', critico: false },
      { ordem: 4, nome: 'Iniciar anticoagulação se indicado', tempo: '30 min', critico: true }
    ],
    acoes: [
      'O2 suplementar se SatO2 < 90%',
      'Anticoagulação plena se confirmado ou alta probabilidade',
      'Considerar trombolítico se instabilidade',
      'Ecocardiograma para avaliar disfunção VD'
    ],
    alertas: [
      'Instabilidade hemodinâmica',
      'Sinais de disfunção VD',
      'Wells > 4 pontos',
      'Contraindicação para anticoagulação'
    ],
    indicadores: {
      pacientesAtivos: 1,
      tempoMedio: '3.2 horas',
      taxa_sucesso: 92
    }
  },
  {
    id: 'trauma',
    nome: 'Cadeia Trauma - Protocolo ATLS',
    sigla: 'TRAUMA',
    descricao: 'Primary survey completo: 20-30 minutos para avaliação inicial',
    prioridade: 'emergencia',
    tempoEstimado: '20-30 minutos',
    janelaOtima: 'Golden Hour',
    passos: [
      { ordem: 1, nome: 'A - Via aérea + proteção cervical', tempo: '2 min', critico: true },
      { ordem: 2, nome: 'B - Ventilação e oxigenação', tempo: '3 min', critico: true },
      { ordem: 3, nome: 'C - Circulação e controle hemorragia', tempo: '5 min', critico: true },
      { ordem: 4, nome: 'D - Avaliação neurológica (Glasgow)', tempo: '2 min', critico: true },
      { ordem: 5, nome: 'E - Exposição e controle térmico', tempo: '3 min', critico: false }
    ],
    acoes: [
      'Acesso venoso calibroso (2 vias)',
      'Reposição volêmica guiada',
      'Considerar ácido tranexâmico se hemorragia',
      'TC body total se estável',
      'Acionar cirurgia/hemodinâmica conforme lesões'
    ],
    alertas: [
      'Via aérea comprometida',
      'Pneumotórax hipertensivo',
      'Choque hemorrágico',
      'Glasgow < 9'
    ],
    indicadores: {
      pacientesAtivos: 0,
      tempoMedio: '25 min',
      taxa_sucesso: 88
    }
  },
  {
    id: 'avc',
    nome: 'Cadeia AVC - Stroke Code',
    sigla: 'AVC',
    descricao: 'Door-to-needle < 60min para trombólise',
    prioridade: 'timing-critico',
    tempoEstimado: '45-60 minutos door-to-needle',
    janelaOtima: 'Trombólise em 4.5h | Trombectomia em 24h',
    passos: [
      { ordem: 1, nome: 'Acionamento Código AVC', tempo: '0 min', critico: true },
      { ordem: 2, nome: 'TC crânio sem contraste', tempo: '25 min', critico: true },
      { ordem: 3, nome: 'Avaliação neurológica (NIHSS)', tempo: '10 min', critico: true },
      { ordem: 4, nome: 'Decisão trombólise/trombectomia', tempo: '15 min', critico: true }
    ],
    acoes: [
      'Glicemia capilar imediata',
      'PA monitorizada (evitar redução abrupta)',
      'rtPA 0.9mg/kg se critérios + sem contraindicações',
      'Transferência para centro com trombectomia se LVO'
    ],
    alertas: [
      'Janela terapêutica estreita (4.5h)',
      'Hemorragia na TC',
      'PA > 185/110 mmHg',
      'Uso recente de anticoagulante'
    ],
    indicadores: {
      pacientesAtivos: 1,
      tempoMedio: '52 min',
      taxa_sucesso: 78
    }
  },
  {
    id: 'pcr',
    nome: 'Cadeia PCR - Protocolo ACLS',
    sigla: 'PCR',
    descricao: 'Reanimação cardiopulmonar de alta qualidade',
    prioridade: 'emergencia',
    tempoEstimado: 'Ciclos de 2 minutos até RCE ou decisão',
    janelaOtima: 'RCE em 20 minutos',
    passos: [
      { ordem: 1, nome: 'Reconhecimento e acionar equipe', tempo: '30 seg', critico: true },
      { ordem: 2, nome: 'RCP de alta qualidade + DEA', tempo: 'contínuo', critico: true },
      { ordem: 3, nome: 'Via aérea avançada', tempo: '5 min', critico: true },
      { ordem: 4, nome: 'Acesso vascular e drogas', tempo: '3 min', critico: true }
    ],
    acoes: [
      'Compressões: 100-120/min, profundidade 5-6cm',
      'Minimizar interrupções (< 10 seg)',
      'Adrenalina 1mg IV/IO a cada 3-5 min',
      'Amiodarona 300mg IV se FV/TV refratária',
      'Tratar causas reversíveis (5H5T)'
    ],
    alertas: [
      'Ritmo desfibrilável (FV/TV)',
      'Hipoxemia durante RCP',
      'Tempo prolongado sem RCE (>20 min)',
      'Considerar ECMO/transporte para centro especializado'
    ],
    indicadores: {
      pacientesAtivos: 0,
      tempoMedio: '18 min até RCE',
      taxa_sucesso: 42
    }
  },
  {
    id: 'pneumonia',
    nome: 'Cadeia Pneumonia - Estratificação CURB-65',
    sigla: 'PNEUMONIA',
    descricao: 'Avaliação e início de tratamento: 2-4 horas',
    prioridade: 'urgente',
    tempoEstimado: '2-4 horas',
    janelaOtima: 'Antibiótico em 4h',
    passos: [
      { ordem: 1, nome: 'Avaliação clínica e CURB-65', tempo: '10 min', critico: false },
      { ordem: 2, nome: 'RX tórax', tempo: '30 min', critico: false },
      { ordem: 3, nome: 'Hemograma, ureia, PCR', tempo: '45 min', critico: false },
      { ordem: 4, nome: 'Iniciar antibioticoterapia', tempo: '4 horas', critico: true }
    ],
    acoes: [
      'Antibiótico empírico conforme gravidade',
      'Oxigenioterapia se SatO2 < 90%',
      'Considerar UTI se CURB-65 ≥ 3',
      'Reavaliação em 48-72h'
    ],
    alertas: [
      'CURB-65 ≥ 3',
      'Insuficiência respiratória',
      'Derrame pleural volumoso',
      'Sem resposta clínica em 72h'
    ],
    indicadores: {
      pacientesAtivos: 4,
      tempoMedio: '3.5 horas',
      taxa_sucesso: 91
    }
  },
  {
    id: 'dka',
    nome: 'Cadeia DKA - Cetoacidose Diabética',
    sigla: 'DKA',
    descricao: 'Estabilização: 6-12h; Resolução completa: 12-24h',
    prioridade: 'timing-critico',
    tempoEstimado: '12-24 horas',
    janelaOtima: 'Reversão acidose em 12-24h',
    passos: [
      { ordem: 1, nome: 'Hidratação vigorosa (SF 0.9%)', tempo: 'contínuo', critico: true },
      { ordem: 2, nome: 'Insulina regular IV contínua', tempo: 'contínuo', critico: true },
      { ordem: 3, nome: 'Reposição de potássio', tempo: 'conforme', critico: true },
      { ordem: 4, nome: 'Monitorização gasométrica', tempo: 'a cada 2-4h', critico: false }
    ],
    acoes: [
      'Expansão inicial: 1L SF 0.9% em 1h',
      'Insulina: 0.1 UI/kg/h após expansão',
      'K+ conforme níveis (manter 4-5 mEq/L)',
      'Adicionar glicose quando glicemia < 250mg/dL',
      'Investigar fator desencadeante'
    ],
    alertas: [
      'pH < 7.0 ou HCO3 < 10 mEq/L',
      'Glicemia > 800 mg/dL',
      'Alteração do nível de consciência',
      'Hipocalemia grave (K+ < 3.3 mEq/L)'
    ],
    indicadores: {
      pacientesAtivos: 1,
      tempoMedio: '16 horas',
      taxa_sucesso: 96
    }
  }
];
