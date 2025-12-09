import { useRoute, Link } from 'wouter';
import PacienteLayout from '@/components/PacienteLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  UserCircle, 
  Star, 
  MapPin, 
  Clock, 
  Award,
  Calendar,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';
import { DEMO_DOCTORS } from '@/demo/demoData';

export default function PatientDoctorProfile() {
  const [, params] = useRoute('/paciente/medicos/:id');
  const doctorId = params?.id;

  const doctor = DEMO_DOCTORS.find(d => d.id === doctorId) || DEMO_DOCTORS[0];

  return (
    <PacienteLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/paciente/dashboard">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Perfil do Médico
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserCircle className="h-16 w-16 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white" data-testid="text-doctor-name">
                  {doctor.name}
                </h2>
                <p className="text-blue-600 dark:text-blue-400 font-medium" data-testid="text-doctor-specialty">
                  {doctor.specialty}
                </p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold" data-testid="text-doctor-rating">{doctor.rating}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    ({doctor.consultations} consultas)
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3 border-t pt-4">
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <span>São Paulo, SP</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>Seg a Sex, 8h às 18h</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <Award className="h-4 w-4 text-blue-500" />
                  <span>CRM/SP 123456</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Link href={`/paciente/agendar/${doctor.id}`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" data-testid="button-schedule">
                    <Calendar className="h-4 w-4 mr-2" />
                    Agendar Consulta
                  </Button>
                </Link>
                <Button variant="outline" className="w-full" data-testid="button-message">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar Mensagem
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sobre o Profissional</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400" data-testid="text-doctor-bio">
                  Médico(a) especialista em {doctor.specialty} com ampla experiência em atendimento 
                  presencial e por telemedicina. Formado(a) pela Universidade de São Paulo (USP) 
                  com residência no Hospital das Clínicas. Atende pacientes de todas as idades 
                  com foco em tratamento humanizado e baseado em evidências científicas.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico de Consultas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Consulta de Rotina</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(doctor.lastConsult).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">
                      Concluída
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Retorno</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(new Date(doctor.lastConsult).getTime() - 30*24*60*60*1000).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">
                      Concluída
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Valores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">R$ 180</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Consulta Online</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">R$ 250</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Consulta Presencial</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PacienteLayout>
  );
}
