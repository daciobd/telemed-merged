import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ConsultorioLayout from '@/components/ConsultorioLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Video, ShoppingCart } from 'lucide-react';
import { Link } from 'wouter';

interface AgendaConsultation {
  id: string;
  paciente: string;
  especialidade: string;
  dataHora: string;
  duracao: number;
  status: string;
}

export default function Agenda() {
  const [filterPeriod, setFilterPeriod] = useState('7dias');

  const { data: consultations, isLoading } = useQuery<AgendaConsultation[]>({
    queryKey: ['/api/consultorio/minhas-consultas'],
  });

  const now = new Date();
  const getFilterDate = () => {
    const date = new Date();
    switch (filterPeriod) {
      case 'hoje':
        date.setHours(23, 59, 59, 999);
        return date;
      case '7dias':
        date.setDate(date.getDate() + 7);
        return date;
      case '30dias':
        date.setDate(date.getDate() + 30);
        return date;
      default:
        date.setDate(date.getDate() + 7);
        return date;
    }
  };

  const filteredConsultations = consultations?.filter((c) => {
    const consultDate = new Date(c.dataHora);
    if (consultDate < now) return false;
    if (consultDate > getFilterDate()) return false;
    if (c.status === 'cancelada' || c.status === 'concluida') return false;
    return true;
  }).sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()) || [];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isToday = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <ConsultorioLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-teal-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Minha Agenda
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Suas próximas consultas agendadas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-40" data-testid="select-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="7dias">Próximos 7 dias</SelectItem>
                <SelectItem value="30dias">Próximos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredConsultations.length > 0 ? (
          <div className="grid gap-4">
            {filteredConsultations.map((consultation) => (
              <Card 
                key={consultation.id} 
                className={isToday(consultation.dataHora) ? 'border-teal-500 border-2' : ''}
                data-testid={`card-agenda-${consultation.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${isToday(consultation.dataHora) ? 'bg-teal-100 dark:bg-teal-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        <Calendar className={`h-6 w-6 ${isToday(consultation.dataHora) ? 'text-teal-600' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-lg flex items-center gap-2">
                          {formatDate(consultation.dataHora)}
                          {isToday(consultation.dataHora) && (
                            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                              HOJE
                            </span>
                          )}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {consultation.paciente}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          {consultation.especialidade} • {consultation.duracao} min
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/consultas/${consultation.id}`}>
                        <Button 
                          className="bg-teal-600 hover:bg-teal-700"
                          data-testid={`button-enter-${consultation.id}`}
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Entrar
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Você ainda não tem consultas agendadas
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Acesse o Marketplace para encontrar novas consultas
              </p>
              <Link href="/marketplace">
                <Button className="bg-teal-600 hover:bg-teal-700" data-testid="button-go-marketplace">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Ir para o Marketplace
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </ConsultorioLayout>
  );
}
