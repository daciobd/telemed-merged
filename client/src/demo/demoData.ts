// client/src/demo/demoData.ts

// Flag para detectar ambiente Render (modo demo)
export const isDemo =
  typeof window !== "undefined" &&
  window.location.hostname.includes("onrender.com");

// ============================================
// DADOS DE MÉDICOS (para seção "Meus Médicos" do paciente)
// ============================================
export const DEMO_DOCTORS = [
  { id: "d1", name: "Dra. Ana Souza",        specialty: "Psiquiatria",     crm: "CRM/SP 123456", city: "São Paulo",      rating: 4.9, consultations: 12, lastConsult: "2025-12-05" },
  { id: "d2", name: "Dr. Carlos Mendes",     specialty: "Clínica Geral",   crm: "CRM/RJ 234567", city: "Rio de Janeiro", rating: 4.8, consultations: 8,  lastConsult: "2025-11-28" },
  { id: "d3", name: "Dra. Beatriz Lima",     specialty: "Neurologia",      crm: "CRM/SP 345678", city: "Campinas",       rating: 4.7, consultations: 5,  lastConsult: "2025-11-15" },
  { id: "d4", name: "Dr. Roberto Alves",     specialty: "Cardiologia",     crm: "CRM/MG 456789", city: "Belo Horizonte", rating: 4.9, consultations: 3,  lastConsult: "2025-10-20" },
  { id: "d5", name: "Dra. Fernanda Costa",   specialty: "Endocrinologia",  crm: "CRM/PR 567890", city: "Curitiba",       rating: 4.6, consultations: 4,  lastConsult: "2025-09-10" },
  { id: "d6", name: "Dr. Marcelo Santos",    specialty: "Nutrologia",      crm: "CRM/SP 678901", city: "São Paulo",      rating: 4.8, consultations: 2,  lastConsult: "2025-08-05" },
  { id: "d7", name: "Dra. Patricia Rocha",   specialty: "Dermatologia",    crm: "CRM/RS 789012", city: "Porto Alegre",   rating: 4.7, consultations: 1,  lastConsult: "2025-07-22" },
  { id: "d8", name: "Dr. Eduardo Pinto",     specialty: "Ortopedia",       crm: "CRM/BA 890123", city: "Salvador",       rating: 4.5, consultations: 1,  lastConsult: "2025-06-15" },
];

// ============================================
// PACIENTES (25 para lista "Meus Pacientes" do médico)
// ============================================
export const DEMO_PATIENTS = [
  { id: "p1",  name: "Maria Oliveira",     age: 34, city: "São Paulo, SP",     specialty: "Psiquiatria",    lastConsult: "2025-12-08", totalConsults: 12 },
  { id: "p2",  name: "João Santos",        age: 42, city: "Rio de Janeiro, RJ", specialty: "Psiquiatria",    lastConsult: "2025-12-07", totalConsults: 8 },
  { id: "p3",  name: "Camila Silva",       age: 29, city: "Curitiba, PR",       specialty: "Clínica Geral",  lastConsult: "2025-12-06", totalConsults: 5 },
  { id: "p4",  name: "Eduardo Lima",       age: 50, city: "Porto Alegre, RS",   specialty: "Psiquiatria",    lastConsult: "2025-12-05", totalConsults: 15 },
  { id: "p5",  name: "Patrícia Gomes",     age: 37, city: "Campinas, SP",       specialty: "Neurologia",     lastConsult: "2025-12-04", totalConsults: 6 },
  { id: "p6",  name: "Rafael Moreira",     age: 41, city: "Salvador, BA",       specialty: "Psiquiatria",    lastConsult: "2025-12-03", totalConsults: 9 },
  { id: "p7",  name: "Beatriz Andrade",    age: 32, city: "Fortaleza, CE",      specialty: "Psiquiatria",    lastConsult: "2025-12-02", totalConsults: 7 },
  { id: "p8",  name: "Pedro Correia",      age: 25, city: "Belo Horizonte, MG", specialty: "Clínica Geral",  lastConsult: "2025-12-01", totalConsults: 3 },
  { id: "p9",  name: "Ana Paula Souza",    age: 45, city: "Recife, PE",         specialty: "Cardiologia",    lastConsult: "2025-11-30", totalConsults: 4 },
  { id: "p10", name: "Lucas Cardoso",      age: 27, city: "Florianópolis, SC",  specialty: "Psiquiatria",    lastConsult: "2025-11-28", totalConsults: 6 },
  { id: "p11", name: "Fernanda Rocha",     age: 39, city: "Niterói, RJ",        specialty: "Endocrinologia", lastConsult: "2025-11-25", totalConsults: 2 },
  { id: "p12", name: "Ricardo Menezes",    age: 56, city: "Santos, SP",         specialty: "Cardiologia",    lastConsult: "2025-11-20", totalConsults: 8 },
  { id: "p13", name: "Juliana Castro",     age: 31, city: "Vitória, ES",        specialty: "Psiquiatria",    lastConsult: "2025-11-18", totalConsults: 4 },
  { id: "p14", name: "André Pinto",        age: 48, city: "João Pessoa, PB",    specialty: "Neurologia",     lastConsult: "2025-11-15", totalConsults: 5 },
  { id: "p15", name: "Sabrina Costa",      age: 36, city: "Uberlândia, MG",     specialty: "Psiquiatria",    lastConsult: "2025-11-10", totalConsults: 7 },
  { id: "p16", name: "Thiago Ribeiro",     age: 32, city: "Brasília, DF",       specialty: "Clínica Geral",  lastConsult: "2025-11-08", totalConsults: 2 },
  { id: "p17", name: "Larissa Martins",    age: 27, city: "Goiânia, GO",        specialty: "Psiquiatria",    lastConsult: "2025-11-05", totalConsults: 3 },
  { id: "p18", name: "Carlos Eduardo",     age: 45, city: "Manaus, AM",         specialty: "Psiquiatria",    lastConsult: "2025-10-30", totalConsults: 6 },
  { id: "p19", name: "Mariana Teixeira",   age: 30, city: "Belém, PA",          specialty: "Dermatologia",   lastConsult: "2025-10-25", totalConsults: 1 },
  { id: "p20", name: "Gustavo Nogueira",   age: 38, city: "Cuiabá, MT",         specialty: "Psiquiatria",    lastConsult: "2025-10-20", totalConsults: 4 },
  { id: "p21", name: "Paula Almeida",      age: 29, city: "Campo Grande, MS",   specialty: "Nutrologia",     lastConsult: "2025-10-15", totalConsults: 2 },
  { id: "p22", name: "Fábio Cunha",        age: 40, city: "Aracaju, SE",        specialty: "Psiquiatria",    lastConsult: "2025-10-10", totalConsults: 5 },
  { id: "p23", name: "Renata Lopes",       age: 33, city: "Teresina, PI",       specialty: "Clínica Geral",  lastConsult: "2025-10-05", totalConsults: 1 },
  { id: "p24", name: "Sérgio Fonseca",     age: 52, city: "Natal, RN",          specialty: "Cardiologia",    lastConsult: "2025-09-28", totalConsults: 3 },
  { id: "p25", name: "Isabela Farias",     age: 24, city: "Maceió, AL",         specialty: "Psiquiatria",    lastConsult: "2025-09-20", totalConsults: 2 },
];

// ============================================
// CONSULTAS MÉDICO - Resumo para cards
// ============================================
export const DEMO_CONSULTAS_RESUMO = {
  hoje: 8,
  semana: 27,
  concluidasMes: 68,
  ganhosMes: 12480.0,
};

// ============================================
// CONSULTAS MÉDICO - Hoje (para tabela "Próximas consultas")
// ============================================
export const DEMO_CONSULTAS_HOJE = [
  { id: "c1",  horario: "08:30", paciente: "Maria Oliveira",   motivo: "Retorno - ajuste de medicação", status: "Confirmada" },
  { id: "c2",  horario: "09:15", paciente: "João Santos",      motivo: "Acompanhamento de ansiedade", status: "Confirmada" },
  { id: "c3",  horario: "10:00", paciente: "Camila Silva",     motivo: "Primeira consulta - insônia", status: "Aguardando" },
  { id: "c4",  horario: "10:45", paciente: "Eduardo Lima",     motivo: "Retorno - depressão", status: "Confirmada" },
  { id: "c5",  horario: "14:00", paciente: "Patrícia Gomes",   motivo: "Avaliação neurológica", status: "Paga" },
  { id: "c6",  horario: "14:45", paciente: "Beatriz Andrade",  motivo: "Crise de pânico - urgência", status: "Confirmada" },
  { id: "c7",  horario: "15:30", paciente: "Lucas Cardoso",    motivo: "Primeira consulta - TDAH", status: "Aguardando" },
  { id: "c8",  horario: "16:15", paciente: "Sabrina Costa",    motivo: "Retorno mensal", status: "Paga" },
];

// ============================================
// CONSULTAS MÉDICO - Próximas (7 dias)
// ============================================
export const DEMO_CONSULTAS_PROXIMAS = [
  ...DEMO_CONSULTAS_HOJE,
  { id: "c9",  horario: "09:00", paciente: "Ana Paula Souza",  motivo: "Avaliação cardiológica", status: "Confirmada", data: "2025-12-10" },
  { id: "c10", horario: "10:30", paciente: "Rafael Moreira",   motivo: "Retorno - transtorno bipolar", status: "Paga", data: "2025-12-10" },
  { id: "c11", horario: "14:00", paciente: "Fernanda Rocha",   motivo: "Acompanhamento hormonal", status: "Confirmada", data: "2025-12-10" },
  { id: "c12", horario: "09:30", paciente: "Ricardo Menezes",  motivo: "Check-up geral", status: "Aguardando", data: "2025-12-11" },
  { id: "c13", horario: "11:00", paciente: "Juliana Castro",   motivo: "Primeira consulta", status: "Confirmada", data: "2025-12-11" },
  { id: "c14", horario: "15:00", paciente: "André Pinto",      motivo: "Cefaleia crônica", status: "Paga", data: "2025-12-11" },
  { id: "c15", horario: "09:00", paciente: "Thiago Ribeiro",   motivo: "Avaliação inicial", status: "Confirmada", data: "2025-12-12" },
  { id: "c16", horario: "10:30", paciente: "Larissa Martins",  motivo: "Retorno - ansiedade", status: "Confirmada", data: "2025-12-12" },
];

// ============================================
// CONSULTAS MÉDICO - Passadas (histórico)
// ============================================
export const DEMO_CONSULTAS_PASSADAS = [
  { id: "cp1",  data: "2025-12-08", paciente: "Maria Oliveira",   motivo: "Ajuste de medicação", status: "Concluída", valor: 280 },
  { id: "cp2",  data: "2025-12-07", paciente: "João Santos",      motivo: "Retorno ansiedade", status: "Concluída", valor: 250 },
  { id: "cp3",  data: "2025-12-06", paciente: "Camila Silva",     motivo: "Avaliação inicial", status: "Concluída", valor: 350 },
  { id: "cp4",  data: "2025-12-05", paciente: "Eduardo Lima",     motivo: "Retorno depressão", status: "Concluída", valor: 250 },
  { id: "cp5",  data: "2025-12-04", paciente: "Beatriz Andrade",  motivo: "Crise de pânico", status: "Concluída", valor: 300 },
  { id: "cp6",  data: "2025-12-03", paciente: "Lucas Cardoso",    motivo: "Avaliação TDAH", status: "Concluída", valor: 380 },
  { id: "cp7",  data: "2025-12-02", paciente: "Sabrina Costa",    motivo: "Retorno mensal", status: "Concluída", valor: 220 },
  { id: "cp8",  data: "2025-12-01", paciente: "Ana Paula Souza",  motivo: "Check-up", status: "Concluída", valor: 280 },
  { id: "cp9",  data: "2025-11-30", paciente: "Rafael Moreira",   motivo: "Bipolar - ajuste", status: "Concluída", valor: 300 },
  { id: "cp10", data: "2025-11-28", paciente: "Fernanda Rocha",   motivo: "Hormônios", status: "Concluída", valor: 320 },
];

// ============================================
// AGENDA (semana) para tela de calendário/agenda
// ============================================
export const DEMO_AGENDA = [
  { id: "a1",  data: "2025-12-09", hora: "08:30", paciente: "Maria Oliveira",   tipo: "Retorno",       link: "https://meet.demo/telemed-01" },
  { id: "a2",  data: "2025-12-09", hora: "09:15", paciente: "João Santos",      tipo: "Teleconsulta",  link: "https://meet.demo/telemed-02" },
  { id: "a3",  data: "2025-12-09", hora: "10:00", paciente: "Camila Silva",     tipo: "Primeira vez",  link: "https://meet.demo/telemed-03" },
  { id: "a4",  data: "2025-12-09", hora: "10:45", paciente: "Eduardo Lima",     tipo: "Retorno",       link: "https://meet.demo/telemed-04" },
  { id: "a5",  data: "2025-12-09", hora: "14:00", paciente: "Patrícia Gomes",   tipo: "Teleconsulta",  link: "https://meet.demo/telemed-05" },
  { id: "a6",  data: "2025-12-09", hora: "14:45", paciente: "Beatriz Andrade",  tipo: "Urgência",      link: "https://meet.demo/telemed-06" },
  { id: "a7",  data: "2025-12-09", hora: "15:30", paciente: "Lucas Cardoso",    tipo: "Primeira vez",  link: "https://meet.demo/telemed-07" },
  { id: "a8",  data: "2025-12-09", hora: "16:15", paciente: "Sabrina Costa",    tipo: "Retorno",       link: "https://meet.demo/telemed-08" },
  { id: "a9",  data: "2025-12-10", hora: "09:00", paciente: "Ana Paula Souza",  tipo: "Teleconsulta",  link: "https://meet.demo/telemed-09" },
  { id: "a10", data: "2025-12-10", hora: "10:30", paciente: "Rafael Moreira",   tipo: "Retorno",       link: "https://meet.demo/telemed-10" },
  { id: "a11", data: "2025-12-10", hora: "14:00", paciente: "Fernanda Rocha",   tipo: "Teleconsulta",  link: "https://meet.demo/telemed-11" },
  { id: "a12", data: "2025-12-11", hora: "09:30", paciente: "Ricardo Menezes",  tipo: "Teleconsulta",  link: "https://meet.demo/telemed-12" },
  { id: "a13", data: "2025-12-11", hora: "11:00", paciente: "Juliana Castro",   tipo: "Primeira vez",  link: "https://meet.demo/telemed-13" },
  { id: "a14", data: "2025-12-11", hora: "15:00", paciente: "André Pinto",      tipo: "Retorno",       link: "https://meet.demo/telemed-14" },
  { id: "a15", data: "2025-12-12", hora: "09:00", paciente: "Thiago Ribeiro",   tipo: "Primeira vez",  link: "https://meet.demo/telemed-15" },
  { id: "a16", data: "2025-12-12", hora: "10:30", paciente: "Larissa Martins",  tipo: "Retorno",       link: "https://meet.demo/telemed-16" },
];

// ============================================
// MARKETPLACE - Pedidos de pacientes (15 leads)
// ============================================
export const DEMO_MARKETPLACE_PEDIDOS = [
  { id: "m1",  paciente: "Thiago Ribeiro",     idade: 32, motivo: "Ansiedade e insônia",               prioridade: "Alta",   orcamento: 200, horarios: "Manhã/Tarde", status: "Novo", propostas: 0 },
  { id: "m2",  paciente: "Larissa Martins",    idade: 27, motivo: "Crise de pânico recorrente",        prioridade: "Alta",   orcamento: 250, horarios: "Tarde",       status: "Novo", propostas: 0 },
  { id: "m3",  paciente: "Carlos Eduardo",     idade: 45, motivo: "Depressão moderada",                prioridade: "Média",  orcamento: 300, horarios: "Manhã",       status: "Novo", propostas: 0 },
  { id: "m4",  paciente: "Mariana Teixeira",   idade: 30, motivo: "Estresse e burnout no trabalho",    prioridade: "Média",  orcamento: 220, horarios: "Noite",       status: "Em análise", propostas: 1 },
  { id: "m5",  paciente: "Gustavo Nogueira",   idade: 38, motivo: "Transtorno de ansiedade general.",  prioridade: "Baixa",  orcamento: 180, horarios: "Flexível",    status: "Em análise", propostas: 2 },
  { id: "m6",  paciente: "Paula Almeida",      idade: 29, motivo: "Insônia crônica há 6 meses",        prioridade: "Média",  orcamento: 200, horarios: "Noite",       status: "Novo", propostas: 0 },
  { id: "m7",  paciente: "Fábio Cunha",        idade: 40, motivo: "Acompanhamento de medicação",       prioridade: "Baixa",  orcamento: 150, horarios: "Manhã",       status: "Proposta enviada", propostas: 3 },
  { id: "m8",  paciente: "Renata Lopes",       idade: 33, motivo: "Avaliação inicial - tristeza",      prioridade: "Média",  orcamento: 280, horarios: "Tarde",       status: "Novo", propostas: 0 },
  { id: "m9",  paciente: "Sérgio Fonseca",     idade: 52, motivo: "Sintomas de burnout severo",        prioridade: "Alta",   orcamento: 350, horarios: "Manhã",       status: "Novo", propostas: 0 },
  { id: "m10", paciente: "Isabela Farias",     idade: 24, motivo: "Crises de ansiedade frequentes",    prioridade: "Alta",   orcamento: 200, horarios: "Flexível",    status: "Novo", propostas: 0 },
  { id: "m11", paciente: "Rodrigo Prado",      idade: 47, motivo: "Transtorno bipolar (retorno)",      prioridade: "Média",  orcamento: 300, horarios: "Manhã/Tarde", status: "Em análise", propostas: 1 },
  { id: "m12", paciente: "Bruna Carvalho",     idade: 35, motivo: "Acompanhamento psicoterápico",      prioridade: "Baixa",  orcamento: 180, horarios: "Tarde",       status: "Novo", propostas: 0 },
  { id: "m13", paciente: "Diego Ferreira",     idade: 39, motivo: "Dificuldade de concentração/TDAH",  prioridade: "Média",  orcamento: 320, horarios: "Manhã",       status: "Novo", propostas: 0 },
  { id: "m14", paciente: "Patrícia Nunes",     idade: 31, motivo: "TAG e insônia combinados",          prioridade: "Alta",   orcamento: 250, horarios: "Noite",       status: "Proposta enviada", propostas: 2 },
  { id: "m15", paciente: "Henrique Silveira",  idade: 28, motivo: "Primeira avaliação psiquiátrica",   prioridade: "Média",  orcamento: 280, horarios: "Flexível",    status: "Novo", propostas: 0 },
];

// ============================================
// PACIENTE DEMO - Consultas futuras (com vários médicos)
// ============================================
export const DEMO_PATIENT_CONSULTAS_PROXIMAS = [
  { id: "pc1", data: "2025-12-11", hora: "10:00", medico: "Dra. Ana Souza",      specialty: "Psiquiatria",    motivo: "Retorno - ajuste de medicação", status: "Confirmada" },
  { id: "pc2", data: "2025-12-15", hora: "14:30", medico: "Dr. Carlos Mendes",   specialty: "Clínica Geral",  motivo: "Check-up anual", status: "Aguardando" },
  { id: "pc3", data: "2025-12-20", hora: "09:00", medico: "Dra. Beatriz Lima",   specialty: "Neurologia",     motivo: "Acompanhamento cefaleia", status: "Paga" },
];

// ============================================
// PACIENTE DEMO - Consultas passadas
// ============================================
export const DEMO_PATIENT_CONSULTAS_PASSADAS = [
  { id: "pp1", data: "2025-12-05", medico: "Dra. Ana Souza",       specialty: "Psiquiatria",    motivo: "Ansiedade - retorno", status: "Concluída", valor: 280 },
  { id: "pp2", data: "2025-11-28", medico: "Dr. Carlos Mendes",    specialty: "Clínica Geral",  motivo: "Gripe forte", status: "Concluída", valor: 180 },
  { id: "pp3", data: "2025-11-15", medico: "Dra. Beatriz Lima",    specialty: "Neurologia",     motivo: "Cefaleia tensional", status: "Concluída", valor: 350 },
  { id: "pp4", data: "2025-10-20", medico: "Dr. Roberto Alves",    specialty: "Cardiologia",    motivo: "Check-up cardíaco", status: "Concluída", valor: 400 },
  { id: "pp5", data: "2025-09-10", medico: "Dra. Fernanda Costa",  specialty: "Endocrinologia", motivo: "Exames hormonais", status: "Concluída", valor: 320 },
  { id: "pp6", data: "2025-08-05", medico: "Dr. Marcelo Santos",   specialty: "Nutrologia",     motivo: "Reeducação alimentar", status: "Concluída", valor: 250 },
  { id: "pp7", data: "2025-07-22", medico: "Dra. Patricia Rocha",  specialty: "Dermatologia",   motivo: "Acne adulta", status: "Concluída", valor: 280 },
  { id: "pp8", data: "2025-06-15", medico: "Dr. Eduardo Pinto",    specialty: "Ortopedia",      motivo: "Dor lombar", status: "Concluída", valor: 300 },
];

// ============================================
// PACIENTE DEMO - Pedidos (bids) com ofertas
// ============================================
export const DEMO_PATIENT_PEDIDOS = [
  {
    id: "req1",
    motivo: "Dor de cabeça persistente e insônia",
    dataEnvio: "2025-12-07",
    status: "em_andamento",
    ofertas: [
      { id: "o1", medico: "Dr. Carlos Mendes", specialty: "Clínica Geral", valor: 180, mensagem: "Posso atender amanhã às 10h" },
      { id: "o2", medico: "Dra. Beatriz Lima", specialty: "Neurologia",    valor: 320, mensagem: "Especialista em cefaleia. Atendo quinta-feira" },
      { id: "o3", medico: "Dra. Ana Souza",    specialty: "Psiquiatria",   valor: 250, mensagem: "Pode ser psicossomático. Disponível sexta" },
    ]
  },
  {
    id: "req2",
    motivo: "Dor lombar com formigamento na perna",
    dataEnvio: "2025-12-08",
    status: "em_andamento",
    ofertas: [
      { id: "o4", medico: "Dr. Eduardo Pinto", specialty: "Ortopedia",  valor: 350, mensagem: "Preciso avaliar possível hérnia" },
      { id: "o5", medico: "Dra. Beatriz Lima", specialty: "Neurologia", valor: 380, mensagem: "Sugiro eletroneuromiografia" },
    ]
  },
  {
    id: "req3",
    motivo: "Ansiedade antes de reuniões importantes",
    dataEnvio: "2025-12-06",
    status: "concluido",
    ofertas: [
      { id: "o6", medico: "Dra. Ana Souza", specialty: "Psiquiatria", valor: 280, mensagem: "Aceito!" },
    ]
  },
];

// ============================================
// PACIENTE DEMO - Registro de saúde (PHR)
// ============================================
export const DEMO_PATIENT_PHR = {
  alergias: ["Dipirona", "Frutos do mar"],
  medicacoes: [
    { nome: "Escitalopram 10mg", posologia: "1x ao dia (manhã)" },
    { nome: "Clonazepam 0,5mg", posologia: "Se necessário (SOS)" },
  ],
  diagnosticos: [
    { nome: "Transtorno de Ansiedade Generalizada (TAG)", cid: "F41.1", desde: "2023" },
    { nome: "Insônia não orgânica", cid: "F51.0", desde: "2024" },
  ],
  examesRecentes: [
    { nome: "Hemograma completo", data: "2025-11-15", resultado: "Normal" },
    { nome: "TSH e T4 livre", data: "2025-11-15", resultado: "Normal" },
    { nome: "Glicemia de jejum", data: "2025-11-15", resultado: "92 mg/dL" },
  ],
};

// ============================================
// INDICADORES PARA PAINEL ANALÍTICO
// ============================================
export const DEMO_ANALYTICS = {
  totalPacientesAtivos: 152,
  consultasMes: 87,
  receitasEmitidasMes: 73,
  ticketMedio: 270.5,
  taxaRetorno: 0.64,
  novosPacientesMes: 18,
};

// ============================================
// DADOS LEGADOS PARA COMPATIBILIDADE
// ============================================
export const DEMO_CONSULTAS = {
  hoje: DEMO_CONSULTAS_HOJE.map(c => ({ patient: c.paciente, hora: c.horario })),
  semana: DEMO_CONSULTAS_RESUMO.semana,
  concluidas: DEMO_CONSULTAS_RESUMO.concluidasMes,
};

export const DEMO_MARKETPLACE = DEMO_MARKETPLACE_PEDIDOS.slice(0, 5).map(p => ({
  id: p.id,
  motivo: p.motivo,
  idade: p.idade,
}));
