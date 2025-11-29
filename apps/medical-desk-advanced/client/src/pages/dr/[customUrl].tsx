import { useRoute } from "wouter";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type DoctorPublicProfile = {
  id: number;
  fullName: string;
  specialties?: string[];
  bio?: string;
  rating?: number;
  totalConsultations?: number;
  isVerified?: boolean;
  consultationPricing?: Record<string, number>;
};

export default function DoctorPublicPage() {
  const [, params] = useRoute("/dr/:customUrl");
  const customUrl = params?.customUrl as string;
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [consultationType, setConsultationType] = useState<string>("primeira_consulta");

  // Fetch dados do médico
  const { data: doctorData, isLoading, error } = useQuery({
    queryKey: ["/api/virtual-office", customUrl],
    queryFn: async () => {
      const res = await fetch(`/api/virtual-office/${customUrl}`);
      if (!res.ok) throw new Error("Consultório não encontrado");
      return res.json();
    },
    enabled: !!customUrl,
  });

  const doctor: DoctorPublicProfile | undefined = doctorData?.doctor;

  // Mutation para agendar
  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTime) {
        throw new Error("Selecione data e horário");
      }

      const res = await fetch(`/api/virtual-office/${customUrl}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: 1, // TODO: obter do contexto autenticado
          consultationType,
          scheduledFor: `${selectedDate}T${selectedTime}:00`,
          chiefComplaint: "Agendamento via página pública",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Erro ao agendar");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("✅ Consulta agendada com sucesso!");
      setSelectedDate("");
      setSelectedTime("");
    },
    onError: (err: Error) => {
      toast.error(`❌ ${err.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Carregando consultório...</p>
      </div>
    );
  }

  if (!doctor || error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <h1 className="text-xl font-semibold text-gray-900">Consultório não encontrado</h1>
            <p className="text-gray-600 mt-2">Verifique se o link do médico está correto.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pricing = doctor.consultationPricing || {};

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">TeleMed Consultório</h1>
          <p className="text-xs text-gray-500">Atendimento online com médicos de confiança</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid gap-8 md:grid-cols-[2fr,1.5fr]">
        {/* Perfil do médico */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center">
                <span className="text-2xl text-teal-700 font-bold">
                  {doctor.fullName?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{doctor.fullName}</h2>
                {doctor.specialties && doctor.specialties.length > 0 && (
                  <p className="text-sm text-teal-700 font-medium">{doctor.specialties.join(", ")}</p>
                )}
                {doctor.rating && (
                  <p className="text-xs text-gray-500 mt-1">⭐ {doctor.rating} • {doctor.totalConsultations} consultas</p>
                )}
              </div>
            </div>

            {doctor.bio && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-700">{doctor.bio}</p>
              </div>
            )}

            {Object.keys(pricing).length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Valores das consultas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  {Object.entries(pricing).map(([type, price]) => (
                    <div key={type} className="bg-teal-50 rounded-xl p-3">
                      <p className="text-gray-600 capitalize">{type.replace(/_/g, " ")}</p>
                      <p className="text-lg font-semibold text-gray-900">R$ {Number(price).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agendamento */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Agendar consulta</h3>
            <p className="text-sm text-gray-600">Escolha data, horário e tipo de consulta.</p>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Tipo de consulta</label>
                <select
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={consultationType}
                  onChange={(e) => setConsultationType(e.target.value)}
                >
                  <option value="primeira_consulta">Primeira consulta</option>
                  <option value="retorno">Retorno</option>
                  <option value="urgente">Urgente</option>
                  <option value="check_up">Check-up</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Data</label>
                <input
                  type="date"
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Horário</label>
                <input
                  type="time"
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={() => bookMutation.mutate()}
              disabled={bookMutation.isPending}
              className="w-full bg-teal-600 hover:bg-teal-700"
              data-testid="button-book-consultation"
            >
              {bookMutation.isPending ? "Agendando..." : "Confirmar agendamento"}
            </Button>

            <p className="text-[11px] text-gray-500">
              Você receberá um e-mail com as instruções para acesso à teleconsulta.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
