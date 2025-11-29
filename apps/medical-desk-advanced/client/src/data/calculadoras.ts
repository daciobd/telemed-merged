export interface Calculadora {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  campos: Campo[];
  formula: (valores: any) => ResultadoCalculo;
  interpretacao: (resultado: number) => string;
}

export interface Campo {
  id: string;
  label: string;
  tipo: 'number' | 'select';
  unidade?: string;
  opcoes?: { value: string; label: string }[];
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface ResultadoCalculo {
  valor: number;
  unidade: string;
  formula?: string;
}

export const calculadoras: Calculadora[] = [
  {
    id: 'clearance-creatinina',
    nome: 'Clearance de Creatinina',
    categoria: 'Nefrologia',
    descricao: 'Fórmula de Cockcroft-Gault para estimar função renal',
    campos: [
      { id: 'idade', label: 'Idade', tipo: 'number', unidade: 'anos', min: 1, max: 120 },
      { id: 'peso', label: 'Peso', tipo: 'number', unidade: 'kg', min: 1, max: 300 },
      { id: 'creatinina', label: 'Creatinina sérica', tipo: 'number', unidade: 'mg/dL', min: 0.1, max: 20, placeholder: '0.8-1.2' },
      { 
        id: 'sexo', 
        label: 'Sexo', 
        tipo: 'select',
        opcoes: [
          { value: 'M', label: 'Masculino' },
          { value: 'F', label: 'Feminino' }
        ]
      }
    ],
    formula: (v) => {
      const fatorSexo = v.sexo === 'F' ? 0.85 : 1;
      const clcr = ((140 - v.idade) * v.peso * fatorSexo) / (72 * v.creatinina);
      return {
        valor: Math.round(clcr * 10) / 10,
        unidade: 'mL/min',
        formula: 'ClCr = [(140-idade) × peso × 0.85(se F)] / (72 × Cr)'
      };
    },
    interpretacao: (resultado) => {
      if (resultado >= 90) return '✅ Função renal normal';
      if (resultado >= 60) return '⚠️ Leve diminuição da função renal';
      if (resultado >= 30) return '⚠️ Moderada diminuição - ajustar doses';
      if (resultado >= 15) return '🔴 Grave - necessário ajuste significativo';
      return '🔴 Insuficiência renal terminal';
    }
  },
  {
    id: 'imc',
    nome: 'IMC (Índice de Massa Corporal)',
    categoria: 'Clínica Geral',
    descricao: 'Avaliação do estado nutricional',
    campos: [
      { id: 'peso', label: 'Peso', tipo: 'number', unidade: 'kg', min: 1, max: 300 },
      { id: 'altura', label: 'Altura', tipo: 'number', unidade: 'cm', min: 50, max: 250 }
    ],
    formula: (v) => {
      const alturaM = v.altura / 100;
      const imc = v.peso / (alturaM * alturaM);
      return {
        valor: Math.round(imc * 10) / 10,
        unidade: 'kg/m²',
        formula: 'IMC = peso (kg) / altura² (m)'
      };
    },
    interpretacao: (resultado) => {
      if (resultado < 18.5) return '⚠️ Abaixo do peso';
      if (resultado < 25) return '✅ Peso normal';
      if (resultado < 30) return '⚠️ Sobrepeso';
      if (resultado < 35) return '🔴 Obesidade Grau I';
      if (resultado < 40) return '🔴 Obesidade Grau II';
      return '🔴 Obesidade Grau III (mórbida)';
    }
  },
  {
    id: 'dose-peso',
    nome: 'Dose por Peso Corporal',
    categoria: 'Farmacologia',
    descricao: 'Cálculo de dose de medicação baseada no peso',
    campos: [
      { id: 'peso', label: 'Peso', tipo: 'number', unidade: 'kg', min: 1, max: 300 },
      { id: 'dose', label: 'Dose prescrita', tipo: 'number', unidade: 'mg/kg', min: 0.1, max: 1000, placeholder: 'ex: 10' }
    ],
    formula: (v) => {
      const doseTotal = v.peso * v.dose;
      return {
        valor: Math.round(doseTotal * 10) / 10,
        unidade: 'mg',
        formula: 'Dose total = peso × dose/kg'
      };
    },
    interpretacao: (resultado) => {
      return `💊 Administrar ${resultado} mg (dose total)`;
    }
  }
];
