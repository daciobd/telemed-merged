export interface Protocolo {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  ultimaAtualizacao: string;
  status: 'ativo' | 'revisao' | 'arquivado';
  passos?: string[];
  criterios?: { [key: string]: string | string[] };
  scoring?: { [key: string]: any };
  referencias?: string[];
}

export const protocolosClinicosCompletos: Protocolo[] = [
  {
    id: 'sca',
    nome: 'Síndrome Coronariana Aguda',
    categoria: 'Cardiologia',
    descricao: 'Avaliação sistemática de dor torácica com foco em causas graves',
    ultimaAtualizacao: 'nov. de 2025',
    status: 'ativo',
    passos: [
      'ECG de 12 derivações em até 10 minutos',
      'Troponina seriada (0h, 1h, 3h)',
      'Estratificação de risco (HEART, GRACE)',
      'AAS 200mg VO + Clopidogrel 300mg',
      'Considerar anticoagulação',
      'Encaminhar para hemodinâmica se IAMCSST'
    ],
    criterios: {
      'Sinais de Alerta': [
        'Dor torácica típica em repouso',
        'Alterações isquêmicas no ECG',
        'Troponina elevada',
        'Instabilidade hemodinâmica',
        'Dispneia associada'
      ],
      'Fatores de Risco': [
        'Idade > 65 anos',
        'Diabetes',
        'Hipertensão',
        'Tabagismo',
        'História familiar'
      ]
    },
    referencias: ['ESC Guidelines 2023', 'AHA/ACC 2021']
  },
  {
    id: 'wells-tep',
    nome: 'Escore de Wells para TEP',
    categoria: 'Pneumologia',
    descricao: 'Avaliação de probabilidade para tromboembolismo pulmonar',
    ultimaAtualizacao: 'nov. de 2025',
    status: 'ativo',
    scoring: {
      criterios: [
        { item: 'Sintomas clínicos de TVP', pontos: 3 },
        { item: 'TEP é diagnóstico mais provável', pontos: 3 },
        { item: 'FC > 100 bpm', pontos: 1.5 },
        { item: 'Imobilização ≥ 3 dias ou cirurgia em 4 semanas', pontos: 1.5 },
        { item: 'História prévia de TEP ou TVP', pontos: 1.5 },
        { item: 'Hemoptise', pontos: 1 },
        { item: 'Câncer ativo', pontos: 1 }
      ],
      interpretacao: {
        baixo: '≤ 4 pontos: TEP improvável (D-dímero)',
        alto: '> 4 pontos: TEP provável (AngioTC)'
      }
    },
    passos: [
      'Calcular escore de Wells',
      'Se ≤ 4: solicitar D-dímero',
      'Se > 4 ou D-dímero positivo: AngioTC',
      'Anticoagulação se confirmado'
    ],
    referencias: ['Wells PS et al. Lancet 1997']
  },
  {
    id: 'cefaleia-bandeiras',
    nome: 'Cefaleia - Bandeiras Vermelhas',
    categoria: 'Neurologia',
    descricao: 'Identificação de causas secundárias perigosas',
    ultimaAtualizacao: 'nov. de 2025',
    status: 'ativo',
    criterios: {
      'Bandeiras Vermelhas': [
        'Cefaleia súbita e explosiva (pior da vida)',
        'Início após 50 anos',
        'Alteração do padrão habitual',
        'Sintomas neurológicos focais',
        'Papiledema ou rigidez de nuca',
        'Febre associada',
        'Trauma craniano recente',
        'Imunodeficiência ou câncer',
        'Gravidez ou puerpério'
      ]
    },
    passos: [
      'Anamnese detalhada (SNOOP10)',
      'Exame neurológico completo',
      'TC crânio sem contraste se bandeira vermelha',
      'Considerar punção lombar se TC normal e suspeita HSA'
    ],
    referencias: ['American Headache Society 2019']
  },
  {
    id: 'qsofa-sepse',
    nome: 'qSOFA Score para Sepse (2016)',
    categoria: 'Infectologia',
    descricao: 'Triagem rápida para sepse em pacientes com suspeita de infecção',
    ultimaAtualizacao: 'nov. de 2025',
    status: 'ativo',
    scoring: {
      criterios: [
        { item: 'FR ≥ 22 irpm', pontos: 1 },
        { item: 'Alteração do estado mental (Glasgow < 15)', pontos: 1 },
        { item: 'PAS ≤ 100 mmHg', pontos: 1 }
      ],
      interpretacao: {
        baixo: '0-1 ponto: Baixo risco',
        alto: '≥ 2 pontos: Alto risco - considerar sepse'
      }
    },
    passos: [
      'Identificar foco infeccioso',
      'Se qSOFA ≥ 2: protocolo sepse',
      'Hemoculturas e lactato',
      'Antibiótico em até 1 hora',
      'Ressuscitação volêmica agressiva'
    ],
    referencias: ['Singer M et al. JAMA 2016']
  },
  {
    id: 'ottawa-tornozelo',
    nome: 'Regras de Ottawa - Tornozelo',
    categoria: 'Ortopedia',
    descricao: 'Critérios para indicar radiografia em trauma de tornozelo',
    ultimaAtualizacao: 'nov. de 2025',
    status: 'ativo',
    criterios: {
      'Indicação de Raio-X se': [
        'Dor na zona maleolar + impossibilidade de apoiar o peso',
        'Dor óssea no maléolo posterior (6cm distais)',
        'Dor no mediopé + impossibilidade de apoiar',
        'Dor no navicular ou base do 5º metatarso'
      ]
    },
    passos: [
      'Avaliar mecanismo do trauma',
      'Inspeção e palpação óssea',
      'Testar capacidade de apoio',
      'RX apenas se critérios positivos'
    ],
    referencias: ['Stiell IG et al. JAMA 1994']
  },
  {
    id: 'curb65-pneumonia',
    nome: 'CURB-65 Score para Pneumonia',
    categoria: 'Pneumologia',
    descricao: 'Estratificação de risco em pneumonia comunitária',
    ultimaAtualizacao: 'nov. de 2025',
    status: 'ativo',
    scoring: {
      criterios: [
        { item: 'Confusion (confusão mental)', pontos: 1 },
        { item: 'Ureia > 50 mg/dL', pontos: 1 },
        { item: 'Respiratory rate ≥ 30 irpm', pontos: 1 },
        { item: 'Blood pressure: PAS < 90 ou PAD ≤ 60', pontos: 1 },
        { item: 'Age ≥ 65 anos', pontos: 1 }
      ],
      interpretacao: {
        '0-1': 'Baixo risco: tratamento ambulatorial',
        '2': 'Risco intermediário: considerar internação',
        '3-5': 'Alto risco: internação (UTI se ≥4)'
      }
    },
    passos: [
      'Avaliar critérios CURB-65',
      'RX tórax para confirmar',
      'Hemograma, ureia, PCR',
      'Iniciar antibiótico conforme local'
    ],
    referencias: ['Lim WS et al. Thorax 2003']
  },
  {
    id: 'glasgow-coma',
    nome: 'Escala de Coma de Glasgow',
    categoria: 'Neurologia',
    descricao: 'Avaliação padronizada do nível de consciência',
    ultimaAtualizacao: 'nov. de 2025',
    status: 'ativo',
    scoring: {
      abertura_ocular: [
        { resposta: 'Espontânea', pontos: 4 },
        { resposta: 'Ao comando verbal', pontos: 3 },
        { resposta: 'À dor', pontos: 2 },
        { resposta: 'Ausente', pontos: 1 }
      ],
      resposta_verbal: [
        { resposta: 'Orientado', pontos: 5 },
        { resposta: 'Confuso', pontos: 4 },
        { resposta: 'Palavras inapropriadas', pontos: 3 },
        { resposta: 'Sons incompreensíveis', pontos: 2 },
        { resposta: 'Ausente', pontos: 1 }
      ],
      resposta_motora: [
        { resposta: 'Obedece comandos', pontos: 6 },
        { resposta: 'Localiza dor', pontos: 5 },
        { resposta: 'Retirada à dor', pontos: 4 },
        { resposta: 'Flexão anormal', pontos: 3 },
        { resposta: 'Extensão anormal', pontos: 2 },
        { resposta: 'Ausente', pontos: 1 }
      ],
      interpretacao: {
        leve: '13-15: TCE leve',
        moderado: '9-12: TCE moderado',
        grave: '3-8: TCE grave (IOT se ≤8)'
      }
    },
    referencias: ['Teasdale G. Lancet 1974']
  },
  {
    id: 'sirs-criteria',
    nome: 'Critérios SIRS',
    categoria: 'Infectologia',
    descricao: 'Síndrome da Resposta Inflamatória Sistêmica',
    ultimaAtualizacao: 'nov. de 2025',
    status: 'ativo',
    criterios: {
      'SIRS presente se ≥ 2 critérios': [
        'Temperatura > 38°C ou < 36°C',
        'FC > 90 bpm',
        'FR > 20 irpm ou PaCO2 < 32 mmHg',
        'Leucócitos > 12.000 ou < 4.000 ou > 10% bastões'
      ]
    },
    passos: [
      'Identificar foco infeccioso',
      'SIRS + infecção = Sepse',
      'Iniciar protocolo sepse se confirmado'
    ],
    referencias: ['Bone RC et al. Chest 1992']
  }
];
