import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type AccountType = "marketplace" | "virtual_office" | "hybrid";

type DoctorDashboard = {
  id: number;
  fullName: string;
  accountType: AccountType;
  customUrl?: string;
  totalConsultations?: number;
};

export default function DoctorDashboardPage() {
  const { toast } = useToast();

  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ["/api/doctor/dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/doctor/dashboard", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) throw new Error("Erro ao carregar");
      return res.json();
    },
  });

  const doctor: DoctorDashboard | undefined = dashboardData?.doctor;

  const changeModeMutation = useMutation({
    mutationFn: async (newMode: AccountType) => {
      const res = await fetch("/api/doctor/account-type", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ accountType: newMode }),
      });

      if (!res.ok) throw new Error("Erro ao alterar modo");
      return res.json();
    },
    onSuccess: () => {
      toast.success("✅ Modo alterado com sucesso!");
      refetch();
    },
    onError: (err: Error) => {
      toast.error(`❌ ${err.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Carregando painel...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Médico não encontrado</p>
      </div>
    );
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://telemed.com.br";

  const modes: Array<{ id: AccountType; label: string; desc: string }> = [
    {
      id: "marketplace",
      label: "Marketplace",
      desc: "Receba casos da plataforma e responda conforme sua disponibilidade.",
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
            <div className="text-xs text-gray-600 bg-white rounded-lg px-4 py-2 shadow-sm">
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

        {/* Toggle de modo */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-800">Como você quer usar o TeleMed?</h2>
            <p className="text-xs text-gray-500">Escolha marketplace, consultório virtual ou ambos.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {modes.map((mode) => {
                const active = doctor.accountType === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => changeModeMutation.mutate(mode.id)}
                    disabled={changeModeMutation.isPending}
                    className={`text-left p-4 rounded-lg border transition ${
                      active
                        ? "border-teal-500 bg-teal-50"
                        : "border-slate-200 bg-white hover:border-teal-300"
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
          </CardContent>
        </Card>

        {/* Atalhos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/doctor/virtual-office-setup">
            <Card className="cursor-pointer hover:border-teal-300 transition">
              <CardContent className="pt-6 flex flex-col justify-between h-full">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Configurar consultório</p>
                  <p className="text-xs text-gray-600 mt-1">URL, preços e horários.</p>
                </div>
                <span className="mt-3 text-xs font-medium text-teal-600">Abrir →</span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/doctor/my-patients">
            <Card className="cursor-pointer hover:border-teal-300 transition">
              <CardContent className="pt-6 flex flex-col justify-between h-full">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Meus pacientes</p>
                  <p className="text-xs text-gray-600 mt-1">Histórico de atendimentos.</p>
                </div>
                <span className="mt-3 text-xs font-medium text-teal-600">Ver →</span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pricing">
            <Card className="cursor-pointer hover:border-teal-300 transition">
              <CardContent className="pt-6 flex flex-col justify-between h-full">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Planos TeleMed</p>
                  <p className="text-xs text-gray-600 mt-1">Escolha seu plano.</p>
                </div>
                <span className="mt-3 text-xs font-medium text-teal-600">Ver →</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
