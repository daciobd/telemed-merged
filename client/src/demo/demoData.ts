export const DEMO_PATIENTS = [
  { id: "p1", name: "Maria Oliveira", age: 34 },
  { id: "p2", name: "João Santos", age: 42 },
  { id: "p3", name: "Camila Silva", age: 29 },
  { id: "p4", name: "Eduardo Lima", age: 50 },
  { id: "p5", name: "Patrícia Gomes", age: 37 },
  { id: "p6", name: "Rafael Moreira", age: 41 },
  { id: "p7", name: "Beatriz Andrade", age: 32 },
  { id: "p8", name: "Pedro Correia", age: 25 },
  { id: "p9", name: "Ana Paula Souza", age: 45 },
  { id: "p10", name: "Lucas Cardoso", age: 27 },
  { id: "p11", name: "Fernanda Rocha", age: 39 },
  { id: "p12", name: "Ricardo Menezes", age: 56 },
  { id: "p13", name: "Juliana Castro", age: 31 },
  { id: "p14", name: "André Pinto", age: 48 },
  { id: "p15", name: "Sabrina Costa", age: 36 },
];

export const DEMO_CONSULTAS = {
  hoje: [
    { patient: "Maria Oliveira", hora: "10:30" },
    { patient: "João Santos", hora: "11:15" },
    { patient: "Camila Silva", hora: "13:00" },
    { patient: "Eduardo Lima", hora: "14:45" },
    { patient: "Patrícia Gomes", hora: "15:30" },
  ],
  semana: 12,
  concluidas: 27,
};

export const DEMO_MARKETPLACE = [
  { id: "m1", motivo: "Dor de cabeça intensa", idade: 32 },
  { id: "m2", motivo: "Ansiedade", idade: 28 },
  { id: "m3", motivo: "Acompanhamento psiquiátrico", idade: 41 },
  { id: "m4", motivo: "Insônia", idade: 36 },
  { id: "m5", motivo: "Crise de ansiedade", idade: 22 },
];

export const isDemo = typeof window !== "undefined" && window.location.hostname.includes("onrender.com");
