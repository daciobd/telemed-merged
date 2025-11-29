import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type AccountType = "marketplace" | "virtual_office" | "hybrid";

type DoctorDashboardData = {
  fullName: string;
  accountType: AccountType;
  customUrl?: string;
  totalConsultations?: number;
};

type DashboardResponse = {
  doctor: DoctorDashboardData;
};

export default function DoctorDashboardPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<DashboardResponse>({
    queryKey: ["doctor-dashboard"],
    queryFn: () => apiFetch("/api/doctor/dashboard"),
  });

  const changeModeMutation = useMutation({
    mutationFn: async (accountType: AccountType) => {
      return apiFetch("/api/doctor/account-type", {
        method: "PATCH",
        body: JSON.stringify({ accountType }),
      });
    },
    onSuccess: (_, accountType) => {
      queryClient.setQueryData<DashboardResponse>(["doctor-dashboard"], (old) =>
        old ? { doctor: { ...old.doctor, accountType } } : old
      );
      toast({
        title: "✅ Modo atualizado",
        description: "Seu tipo de conta foi alterado com sucesso.",
      });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "❌ Erro ao alterar modo",
        description: err?.message || "Não foi possível atualizar o modo.",
      });
    },
  });

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://telemed.com.br";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow p-6 space-y-4">
          <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-72 bg-slate-200 rounded animate-pulse" />
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.doctor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow p-6 space-y-3">
          <h1 className="text-lg font-semibold text-gray-900">Erro ao carregar painel</h1>
          <p className="text-sm text-gray-600">
            {(error as Error)?.message || "Tente atualizar a página ou fazer login novamente."}
          </p>
        </div>
      </div>
    );
  }

  const doctor = data.doctor;
  const modes: { id: AccountType; label: string; desc: string }[] = [
    {
      id: "marketplace",
      label: "Marketplace",
      desc: "Receba casos dos pacientes da plataforma.",
    },
    {
      id: "virtual_office",
      label: "Consultório virtual",
      desc: "Use a TeleMed como seu consultório online.",
    },
    {
      id: "hybrid",
      label: "Híbrido",
      desc: "Combine marketplace e consultório virtual.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Olá, {doctor.fullName}</h1>
            <p className="text-sm text-gray-600">Gerencie seus atendimentos e consultório.</p>
          </div>

          {doctor.customUrl && (
            <div className="text-xs text-gray-600 bg-white rounded-xl px-4 py-2 shadow-sm">
              <span className="font-medium text-gray-800">Link: </span>
              <a
                href={`${baseUrl}/dr/${doctor.customUrl}`}
                target="_blank"
                rel="noreferrer"
                className="text-teal-600 hover:underline"
                data-testid="link-doctor-office"
              >
                {baseUrl}/dr/{doctor.customUrl}
              </a>
            </div>
          )}
        </header>

        <section className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">Como você quer usar o TeleMed?</h2>
          <p className="text-xs text-gray-500">Escolha marketplace, consultório virtual ou ambos.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            {modes.map((mode) => {
              const active = doctor.accountType === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => !active && changeModeMutation.mutate(mode.id)}
                  className={`text-left p-4 rounded-2xl border transition shadow-sm ${
                    active ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white hover:border-teal-300"
                  }`}
                  data-testid={`button-mode-${mode.id}`}
                >
                  <p className={`text-sm font-semibold ${active ? "text-teal-700" : "text-gray-800"}`}>
                    {mode.label}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{mode.desc}</p>
                  {active && <p className="mt-2 text-[11px] font-medium text-teal-600">Ativo</p>}
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/doctor/virtual-office-setup">
            <a className="bg-white rounded-2xl shadow p-4 flex flex-col justify-between hover:border-teal-300 border border-transparent transition">
              <div>
                <p className="text-sm font-semibold text-gray-900">Configurar consultório</p>
                <p className="text-xs text-gray-600 mt-1">URL, preços e horários.</p>
              </div>
              <span className="text-xs font-medium text-teal-600 mt-3">Abrir →</span>
            </a>
          </Link>

          <Link href="/doctor/my-patients">
            <a className="bg-white rounded-2xl shadow p-4 flex flex-col justify-between hover:border-teal-300 border border-transparent transition">
              <div>
                <p className="text-sm font-semibold text-gray-900">Meus pacientes</p>
                <p className="text-xs text-gray-600 mt-1">Histórico de atendimentos.</p>
              </div>
              <span className="text-xs font-medium text-teal-600 mt-3">Ver →</span>
            </a>
          </Link>

          <Link href="/pricing">
            <a className="bg-white rounded-2xl shadow p-4 flex flex-col justify-between hover:border-teal-300 border border-transparent transition">
              <div>
                <p className="text-sm font-semibold text-gray-900">Planos TeleMed</p>
                <p className="text-xs text-gray-600 mt-1">Escolha seu plano.</p>
              </div>
              <span className="text-xs font-medium text-teal-600 mt-3">Ver →</span>
            </a>
          </Link>
        </div>
      </main>
    </div>
  );
}
