import PacienteLayout from '@/components/PacienteLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Heart, 
  Pill, 
  AlertTriangle, 
  Stethoscope, 
  FileText,
  ClipboardList,
  Calendar,
  User
} from 'lucide-react';

function Badge({ children, className = '', variant = 'default' }: { children: React.ReactNode; className?: string; variant?: 'default' | 'outline' }) {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
  const variantClasses = variant === 'outline' 
    ? 'border border-current bg-transparent' 
    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  return <span className={`${baseClasses} ${variantClasses} ${className}`}>{children}</span>;
}

const MOCK_PATIENT = {
  name: 'João da Silva',
  birthDate: '15/03/1985',
  cpf: '***.***.***-45',
  bloodType: 'O+',
};

const MOCK_CONDITIONS = [
  { name: 'Transtorno de Ansiedade Generalizada', since: '2022', status: 'Em tratamento' },
  { name: 'Hipertensão Arterial', since: '2019', status: 'Controlada' },
  { name: 'Dislipidemia', since: '2020', status: 'Em acompanhamento' },
];

const MOCK_MEDICATIONS = [
  { name: 'Losartana', dose: '50mg', frequency: '1x ao dia (manhã)', indication: 'Hipertensão', prescriber: 'Dr. Carlos Mendes' },
  { name: 'Escitalopram', dose: '10mg', frequency: '1x ao dia (noite)', indication: 'Ansiedade', prescriber: 'Dra. Ana Souza' },
  { name: 'Sinvastatina', dose: '20mg', frequency: '1x ao dia (noite)', indication: 'Colesterol', prescriber: 'Dr. Carlos Mendes' },
  { name: 'Rivotril', dose: '0,5mg', frequency: 'SOS (máx 2x/semana)', indication: 'Crises de ansiedade', prescriber: 'Dra. Ana Souza' },
];

const MOCK_ALLERGIES = [
  { substance: 'Dipirona', reaction: 'Reação cutânea (urticária)', year: '2018', severity: 'Moderada' },
  { substance: 'Amoxicilina', reaction: 'Náusea intensa e mal-estar', year: '2020', severity: 'Leve' },
];

const MOCK_SURGERIES = [
  { name: 'Apendicectomia', date: 'Março/2015', hospital: 'Hospital São Lucas', notes: 'Sem complicações' },
  { name: 'Internação - Crise hipertensiva', date: 'Agosto/2021', hospital: 'Hospital Albert Einstein', notes: '3 dias de internação, alta com ajuste medicamentoso' },
];

const MOCK_EXAMS = [
  { name: 'Hemograma Completo', date: '10/11/2024', result: 'Dentro da normalidade', status: 'OK' },
  { name: 'TSH e T4 Livre', date: '10/11/2024', result: 'TSH 2.5 / T4L 1.2', status: 'OK' },
  { name: 'Perfil Lipídico', date: '10/11/2024', result: 'LDL 145 mg/dL (meta < 130)', status: 'Acompanhamento' },
  { name: 'Glicemia de Jejum', date: '10/11/2024', result: '98 mg/dL', status: 'OK' },
  { name: 'Creatinina', date: '10/11/2024', result: '1.0 mg/dL', status: 'OK' },
  { name: 'Eletrocardiograma', date: '05/10/2024', result: 'Ritmo sinusal, sem alterações', status: 'OK' },
];

const MOCK_NOTES = `Paciente em acompanhamento regular para controle de hipertensão e ansiedade. 
Apresenta boa adesão ao tratamento medicamentoso. 
Recomendado manter atividade física regular (caminhada 30min/dia) e dieta com restrição de sódio.
Próximo retorno em 3 meses para reavaliação do perfil lipídico.
Encaminhado para nutricionista para orientação alimentar.`;

export default function PatientPhrDemo() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OK':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{status}</Badge>;
      case 'Acompanhamento':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">{status}</Badge>;
      case 'Controlada':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{status}</Badge>;
      case 'Em tratamento':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{status}</Badge>;
      case 'Em acompanhamento':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <PacienteLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-patient-name">
                Registro de Saúde de {MOCK_PATIENT.name}
              </h1>
              <p className="text-blue-100 mt-1">
                Resumo clínico consolidado • Nascimento: {MOCK_PATIENT.birthDate} • Tipo Sanguíneo: {MOCK_PATIENT.bloodType}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Condições Crônicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_CONDITIONS.map((condition, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    data-testid={`condition-${i}`}
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{condition.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Desde {condition.since}</p>
                    </div>
                    {getStatusBadge(condition.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Alergias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_ALLERGIES.map((allergy, i) => (
                  <div 
                    key={i} 
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                    data-testid={`allergy-${i}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-red-700 dark:text-red-400">{allergy.substance}</p>
                      <Badge variant="outline" className="text-red-600 border-red-300">{allergy.severity}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{allergy.reaction}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Identificada em {allergy.year}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="h-5 w-5 text-purple-500" />
              Medicamentos em Uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Medicamento</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Dose</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Frequência</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Indicação</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Prescrito por</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_MEDICATIONS.map((med, i) => (
                    <tr key={i} className="border-b dark:border-gray-800" data-testid={`medication-${i}`}>
                      <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">{med.name}</td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{med.dose}</td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{med.frequency}</td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{med.indication}</td>
                      <td className="py-3 px-2 text-blue-600 dark:text-blue-400">{med.prescriber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-teal-500" />
              Cirurgias e Internações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_SURGERIES.map((surgery, i) => (
                <div 
                  key={i} 
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  data-testid={`surgery-${i}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{surgery.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{surgery.hospital}</p>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {surgery.date}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{surgery.notes}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              Exames Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {MOCK_EXAMS.map((exam, i) => (
                <div 
                  key={i} 
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700"
                  data-testid={`exam-${i}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-gray-900 dark:text-white">{exam.name}</p>
                    {getStatusBadge(exam.status)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{exam.result}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{exam.date}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-gray-500" />
              Observações do Médico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line" data-testid="text-notes">
                {MOCK_NOTES}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                Última atualização: 15/11/2024 por Dra. Ana Souza
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PacienteLayout>
  );
}
