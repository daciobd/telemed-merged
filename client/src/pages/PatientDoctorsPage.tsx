import { Link } from 'wouter';
import PacienteLayout from '@/components/PacienteLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  UserCircle, 
  Star, 
  MapPin,
  Calendar
} from 'lucide-react';
import { DEMO_DOCTORS } from '@/demo/demoData';

export default function PatientDoctorsPage() {
  return (
    <PacienteLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
            Meus Médicos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Profissionais com quem você já se consultou
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEMO_DOCTORS.map((doctor) => (
            <Card 
              key={doctor.id}
              className="hover:shadow-lg transition-shadow"
              data-testid={`card-doctor-${doctor.id}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserCircle className="h-10 w-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {doctor.name}
                    </h3>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                      {doctor.specialty}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold text-sm">{doctor.rating}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">
                        ({doctor.consultations} consultas)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>São Paulo, SP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Última consulta: {new Date(doctor.lastConsult).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/paciente/medicos/${doctor.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" data-testid={`button-profile-${doctor.id}`}>
                      Ver perfil
                    </Button>
                  </Link>
                  <Link href={`/paciente/agendar/${doctor.id}`} className="flex-1">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" data-testid={`button-schedule-${doctor.id}`}>
                      Agendar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PacienteLayout>
  );
}
