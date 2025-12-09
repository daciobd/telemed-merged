import { useState } from 'react';
import { useRoute, Link } from 'wouter';
import PacienteLayout from '@/components/PacienteLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  UserCircle, 
  Star, 
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { DEMO_DOCTORS } from '@/demo/demoData';

export default function PatientDoctorScheduling() {
  const [, params] = useRoute('/paciente/agendar/:id');
  const { toast } = useToast();
  const doctorId = params?.id;

  const doctor = DEMO_DOCTORS.find(d => d.id === doctorId) || DEMO_DOCTORS[0];

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  const today = new Date();
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i + 1);
    if (date.getDay() === 0 || date.getDay() === 6) return null;
    return date.toISOString().split('T')[0];
  }).filter(Boolean) as string[];

  const availableTimes = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        variant: 'destructive',
        title: 'Selecione data e horário',
        description: 'Por favor, escolha uma data e horário disponíveis.'
      });
      return;
    }

    setIsConfirmed(true);
    toast({
      title: 'Consulta agendada!',
      description: `Sua consulta com ${doctor.name} foi confirmada.`
    });
  };

  if (isConfirmed) {
    return (
      <PacienteLayout>
        <div className="max-w-2xl mx-auto">
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2" data-testid="text-confirmation-title">
                Consulta Confirmada!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Sua consulta foi agendada com sucesso.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-left mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Médico</span>
                    <span className="font-medium text-gray-900 dark:text-white">{doctor.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Especialidade</span>
                    <span className="font-medium text-gray-900 dark:text-white">{doctor.specialty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Data</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedDate && new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Horário</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Valor</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">R$ 180,00</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Link href="/paciente/dashboard">
                  <Button variant="outline" data-testid="button-back-dashboard">
                    Voltar ao Dashboard
                  </Button>
                </Link>
                <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-view-appointments">
                  Ver Minhas Consultas
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PacienteLayout>
    );
  }

  return (
    <PacienteLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/paciente/medicos/${doctor.id}`}>
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Agendar Consulta
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                  <UserCircle className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white" data-testid="text-doctor-name">
                    {doctor.name}
                  </h2>
                  <p className="text-blue-600 dark:text-blue-400 text-sm">{doctor.specialty}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium">{doctor.rating}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Consulta Online</span>
                  <span className="font-bold text-blue-600">R$ 180</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Duração</span>
                  <span className="font-medium">30 minutos</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Escolha a Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {availableDates.slice(0, 10).map((date) => {
                    const d = new Date(date + 'T12:00:00');
                    const isSelected = selectedDate === date;
                    return (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          isSelected 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                        }`}
                        data-testid={`button-date-${date}`}
                      >
                        <p className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                          {d.toLocaleDateString('pt-BR', { weekday: 'short' })}
                        </p>
                        <p className="text-lg font-bold">{d.getDate()}</p>
                        <p className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                          {d.toLocaleDateString('pt-BR', { month: 'short' })}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Escolha o Horário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {availableTimes.map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 rounded-lg border text-center font-medium transition-colors ${
                          isSelected 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                        }`}
                        data-testid={`button-time-${time}`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Motivo da Consulta (opcional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Descreva brevemente o motivo da sua consulta..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                  data-testid="input-motivo"
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Link href="/paciente/dashboard">
                <Button variant="outline" data-testid="button-cancel">
                  Cancelar
                </Button>
              </Link>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleConfirm}
                disabled={!selectedDate || !selectedTime}
                data-testid="button-confirm"
              >
                Confirmar Agendamento
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PacienteLayout>
  );
}
