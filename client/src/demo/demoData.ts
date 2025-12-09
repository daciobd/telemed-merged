// client/src/demo/demoData.ts

// Flag para detectar ambiente Render (modo demo)
export const isDemo =
  typeof window !== "undefined" &&
  window.location.hostname.includes("onrender.com");

// 15 pacientes para lista / prontuário
export const DEMO_PATIENTS = [
  { id: "p1", name: "Maria Oliveira",   age: 34,  city: "São Paulo" },
  { id: "p2", name: "João Santos",      age: 42,  city: "Rio de Janeiro" },
  { id: "p3", name: "Camila Silva",     age: 29,  city: "Curitiba" },
  { id: "p4", name: "Eduardo Lima",     age: 50,  city: "Porto Alegre" },
  { id: "p5", name: "Patrícia Gomes",   age: 37,  city: "Campinas" },
  { id: "p6", name: "Rafael Moreira",   age: 41,  city: "Salvador" },
  { id: "p7", name: "Beatriz Andrade",  age: 32,  city: "Fortaleza" },
  { id: "p8", name: "Pedro Correia",    age: 25,  city: "Belo Horizonte" },
  { id: "p9", name: "Ana Paula Souza",  age: 45,  city: "Recife" },
  { id: "p10", name: "Lucas Cardoso",   age: 27,  city: "Florianópolis" },
  { id: "p11", name: "Fernanda Rocha",  age: 39,  city: "Niterói" },
  { id: "p12", name: "Ricardo Menezes", age: 56,  city: "Santos" },
  { id: "p13", name: "Juliana Castro",  age: 31,  city: "Vitória" },
  { id: "p14", name: "André Pinto",     age: 48,  city: "João Pessoa" },
  { id: "p15", name: "Sabrina Costa",   age: 36,  city: "Uberlândia" },
];

// Consultas "resumo" pra cards do dashboard
export const DEMO_CONSULTAS_RESUMO = {
  hoje: 8,
  semana: 19,
  concluidasMes: 42,
  ganhosMes: 2340.0,
};

// Consultas do dia pra tabela "Próximas consultas"
export const DEMO_CONSULTAS_HOJE = [
  { id: "c1",  horario: "09:00", paciente: "Maria Oliveira",   motivo: "Dor de cabeça persistente" },
  { id: "c2",  horario: "09:45", paciente: "João Santos",      motivo: "Retorno ansiedade" },
  { id: "c3",  horario: "10:30", paciente: "Camila Silva",     motivo: "Insônia" },
  { id: "c4",  horario: "11:15", paciente: "Eduardo Lima",     motivo: "Ajuste de medicação" },
  { id: "c5",  horario: "14:00", paciente: "Patrícia Gomes",   motivo: "Primeira consulta" },
  { id: "c6",  horario: "15:00", paciente: "Beatriz Andrade",  motivo: "Crise de pânico" },
  { id: "c7",  horario: "16:00", paciente: "Lucas Cardoso",    motivo: "Avaliação inicial" },
  { id: "c8",  horario: "17:00", paciente: "Sabrina Costa",    motivo: "Retorno rotina" },
];

// Agenda (semana) pra tela de calendário/agenda
export const DEMO_AGENDA = [
  { id: "a1", data: "2025-12-09", hora: "09:00",  paciente: "Maria Oliveira",   tipo: "Teleconsulta",   link: "https://meet.demo/telemed-01" },
  { id: "a2", data: "2025-12-09", hora: "10:30",  paciente: "Camila Silva",     tipo: "Teleconsulta",   link: "https://meet.demo/telemed-02" },
  { id: "a3", data: "2025-12-09", hora: "14:00",  paciente: "Patrícia Gomes",   tipo: "Primeira vez",   link: "https://meet.demo/telemed-03" },
  { id: "a4", data: "2025-12-10", hora: "09:30",  paciente: "Ana Paula Souza",  tipo: "Retorno",        link: "https://meet.demo/telemed-04" },
  { id: "a5", data: "2025-12-10", hora: "11:00",  paciente: "Rafael Moreira",   tipo: "Teleconsulta",   link: "https://meet.demo/telemed-05" },
  { id: "a6", data: "2025-12-10", hora: "16:00",  paciente: "Beatriz Andrade",  tipo: "Teleconsulta",   link: "https://meet.demo/telemed-06" },
  { id: "a7", data: "2025-12-11", hora: "09:00",  paciente: "João Santos",      tipo: "Retorno",        link: "https://meet.demo/telemed-07" },
  { id: "a8", data: "2025-12-11", hora: "10:00",  paciente: "Juliana Castro",   tipo: "Primeira vez",   link: "https://meet.demo/telemed-08" },
  { id: "a9", data: "2025-12-11", hora: "15:30",  paciente: "Ricardo Menezes",  tipo: "Teleconsulta",   link: "https://meet.demo/telemed-09" },
  { id: "a10", data: "2025-12-12", hora: "08:30", paciente: "Lucas Cardoso",    tipo: "Retorno",        link: "https://meet.demo/telemed-10" },
  { id: "a11", data: "2025-12-12", hora: "11:30", paciente: "Fernanda Rocha",   tipo: "Teleconsulta",   link: "https://meet.demo/telemed-11" },
  { id: "a12", data: "2025-12-12", hora: "17:00", paciente: "Sabrina Costa",    tipo: "Teleconsulta",   link: "https://meet.demo/telemed-12" },
];

// Pedidos de marketplace (15 "leads")
export const DEMO_MARKETPLACE_PEDIDOS = [
  { id: "m1",  paciente: "Thiago Ribeiro",     idade: 32,  motivo: "Ansiedade e insônia",               status: "Novo" },
  { id: "m2",  paciente: "Larissa Martins",    idade: 27,  motivo: "Crise de pânico recorrente",        status: "Novo" },
  { id: "m3",  paciente: "Carlos Eduardo",     idade: 45,  motivo: "Depressão moderada",                status: "Novo" },
  { id: "m4",  paciente: "Mariana Teixeira",   idade: 30,  motivo: "Estresse no trabalho",              status: "Em análise" },
  { id: "m5",  paciente: "Gustavo Nogueira",   idade: 38,  motivo: "Transtorno de ansiedade general.",  status: "Em análise" },
  { id: "m6",  paciente: "Paula Almeida",      idade: 29,  motivo: "Insônia crônica",                   status: "Novo" },
  { id: "m7",  paciente: "Fábio Cunha",        idade: 40,  motivo: "Acompanhamento de medicação",       status: "Proposta enviada" },
  { id: "m8",  paciente: "Renata Lopes",       idade: 33,  motivo: "Avaliação inicial",                 status: "Novo" },
  { id: "m9",  paciente: "Sérgio Fonseca",     idade: 52,  motivo: "Sintomas de burnout",               status: "Novo" },
  { id: "m10", paciente: "Isabela Farias",     idade: 24,  motivo: "Crises de ansiedade",               status: "Novo" },
  { id: "m11", paciente: "Rodrigo Prado",      idade: 47,  motivo: "Transtorno bipolar (retorno)",      status: "Em análise" },
  { id: "m12", paciente: "Bruna Carvalho",     idade: 35,  motivo: "Acompanhamento psicoterápico",     status: "Novo" },
  { id: "m13", paciente: "Diego Ferreira",     idade: 39,  motivo: "Dificuldade de concentração",       status: "Novo" },
  { id: "m14", paciente: "Patrícia Nunes",     idade: 31,  motivo: "TAG e insônia",                     status: "Proposta enviada" },
  { id: "m15", paciente: "Henrique Silveira",  idade: 28,  motivo: "Primeira avaliação psiquiátrica",   status: "Novo" },
];

// Indicadores para Painel Analítico
export const DEMO_ANALYTICS = {
  totalPacientesAtivos: 152,
  consultasMes: 87,
  receitasEmitidasMes: 73,
  ticketMedio: 270.5,
  taxaRetorno: 0.64,       // 64%
  novosPacientesMes: 18,
};

// Dados legados para compatibilidade
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
