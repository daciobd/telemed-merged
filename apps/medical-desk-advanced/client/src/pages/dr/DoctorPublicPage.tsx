import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type DoctorPublicProfile = {
  id: string;
  fullName: string;
  specialties?: string[];
  bio?: string;
  consultationPricing?: Record<string, number>;
};

type DoctorPublicResponse = {
  doctor: DoctorPublicProfile;
};

type SlotsResponse = {
  slots: string[];
};

export default function DoctorPublicPage({ customUrl }: { customUrl: string }) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  const { data, isLoading, error } = useQuery<DoctorPublicResponse>({
    queryKey: ["doctor-public", customUrl],
    queryFn: () => apiFetch(`/api/virtual-office/${customUrl}`),
  });

  const { data: slotsData, isLoading: loadingSlots } = useQuery<SlotsResponse>({
    queryKey: ["slots", customUrl, selectedDate],
    queryFn: () =>
      apiFetch(`/api/virtual-office/${customUrl}/slots?date=${encodeURIComponent(selectedDate)}`),
    enabled: !!selectedDate,
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!data?.doctor || !selectedDate || !selectedTime) {
        throw new Error("Selecione uma data e um horário.");
      }
      return apiFetch(`/api/virtual-office/${customUrl}/book`, {
        method: "POST",
        body: JSON.stringify({
          doctorId: data.doctor.id,
          date: selectedDate,
          time: selectedTime,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Consulta agendada",
        description: "Você receberá os detalhes por e-mail.",
      });
      setSelectedTime("");
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "❌ Erro ao agendar",
        description: err?.message || "Não foi possível agendar a consulta.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow p-6 space-y-4">
          <div className="h-6 w-40 bg-slate-200 rounded animate-pulse" />
          <div className="h-5 w-60 bg-slate-200 rounded animate-pulse" />
          <div className="h-24 w-full bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data?.doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow p-6 space-y-3">
          <h1 className="text-lg font-semibold text-gray-900">Médico não encontrado</h1>
          <p className="text-sm text-gray-600">
            {(error as Error)?.message || "Verifique se o link do médico está correto."}
          </p>
        </div>
      </div>
    );
  }

  const doctor = data.doctor;
  const pricing = doctor.consultationPricing || {};
  const slots = slotsData?.slots ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">TeleMed Consultório</h1>
          <p className="text-xs text-gray-500">Agendamento online de consultas médicas</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid gap-8 md:grid-cols-[2fr,1.5fr]">
        <section className="bg-white rounded-2xl shadow p-6 space-y-4">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center">
              <span className="text-2xl text-teal-700 font-bold">{doctor.fullName.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{doctor.fullName}</h2>
              {doctor.specialties && doctor.specialties.length > 0 && (
                <p className="text-sm text-teal-700 font-medium">{doctor.specialties.join(", ")}</p>
              )}
            </div>
          </div>

          {doctor.bio && <p className="text-sm text-gray-700 mt-4">{doctor.bio}</p>}

          {Object.keys(pricing).length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Valores das consultas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(pricing).map(([type, price]) => (
                  <div key={type} className="bg-teal-50 rounded-xl p-3">
                    <p className="text-gray-600 capitalize text-sm">{type.replace(/_/g, " ")}</p>
                    <p className="text-lg font-semibold text-gray-900">R$ {Number(price).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Agendar consulta</h3>
          <p className="text-sm text-gray-600">Escolha uma data e horário disponível.</p>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Data</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTime("");
                }}
                data-testid="input-date"
              />
            </div>

            {selectedDate && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Horário</label>

                {loadingSlots && <p className="text-xs text-gray-500">Carregando horários...</p>}

                {!loadingSlots && slots.length === 0 && (
                  <p className="text-xs text-gray-500">Nenhum horário disponível nesta data.</p>
                )}

                {!loadingSlots && slots.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                          selectedTime === slot
                            ? "bg-teal-50 border-teal-500 text-teal-700"
                            : "bg-white border-slate-200 text-slate-600 hover:border-teal-300"
                        }`}
                        data-testid={`button-slot-${slot}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            className="w-full bg-teal-600 hover:bg-teal-700"
            disabled={!selectedDate || !selectedTime || bookMutation.isPending}
            onClick={() => bookMutation.mutate()}
            data-testid="button-book"
          >
            {bookMutation.isPending ? "Agendando..." : "Confirmar agendamento"}
          </Button>

          <p className="text-[11px] text-gray-500">
            Você receberá um e-mail com instruções para acessar a teleconsulta.
          </p>
        </section>
      </main>
    </div>
  );
}
