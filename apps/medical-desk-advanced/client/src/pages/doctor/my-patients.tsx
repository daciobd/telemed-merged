import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

type Patient = {
  id: number;
  fullName: string;
  email?: string;
  phone?: string;
  totalConsultations?: number;
};

export default function MyPatientsPage() {
  const { data: patientsData, isLoading, error } = useQuery({
    queryKey: ["/api/virtual-office/my-patients"],
    queryFn: async () => {
      const res = await fetch("/api/virtual-office/my-patients", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) throw new Error("Erro ao carregar");
      return res.json();
    },
  });

  const patients: Patient[] = patientsData?.patients || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">Meus pacientes</h1>
          <p className="text-sm text-gray-600">Pacientes que já foram atendidos no seu consultório.</p>
        </header>

        <Card>
          <CardContent className="pt-6">
            {isLoading && <p className="text-sm text-gray-600">Carregando pacientes...</p>}
            {error && <p className="text-sm text-red-600">Erro ao carregar pacientes</p>}

            {!isLoading && patients.length === 0 && !error && (
              <p className="text-sm text-gray-500">Nenhum paciente encontrado ainda.</p>
            )}

            {!isLoading && patients.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Paciente</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Contato</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Nº de consultas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2 px-3 text-gray-900">{p.fullName}</td>
                        <td className="py-2 px-3 text-gray-600">
                          <div className="text-sm">
                            {p.email && <p>{p.email}</p>}
                            {p.phone && <p className="text-xs text-gray-500">{p.phone}</p>}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-gray-600">{p.totalConsultations || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
