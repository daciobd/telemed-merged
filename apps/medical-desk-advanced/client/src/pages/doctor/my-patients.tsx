import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Patient = {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  lastConsultationDate?: string;
  totalConsultations?: number;
};

type MyPatientsResponse = {
  patients: Patient[];
};

export default function MyPatientsPage() {
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, error, refetch, isFetching } = useQuery<MyPatientsResponse>({
    queryKey: ["doctor-my-patients", searchTerm],
    queryFn: () => apiFetch(`/api/doctor/my-patients?search=${encodeURIComponent(searchTerm)}`),
  });

  const patients = data?.patients ?? [];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchTerm(search.trim());
    refetch();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Meus pacientes</h1>
            <p className="text-sm text-gray-600">Pacientes atendidos ou agendados no seu consultório.</p>
          </div>

          <form className="flex items-center gap-2 w-full md:w-auto" onSubmit={handleSearch}>
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-64"
              data-testid="input-search-patients"
            />
            <Button type="submit" variant="outline" size="sm" data-testid="button-search">
              {isFetching ? "Buscando..." : "Buscar"}
            </Button>
          </form>
        </header>

        <section className="bg-white rounded-2xl shadow p-6">
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-slate-200 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {error && !isLoading && (
            <p className="text-sm text-red-600" data-testid="text-error">
              {(error as Error)?.message || "Erro ao carregar lista de pacientes."}
            </p>
          )}

          {!isLoading && !error && patients.length === 0 && (
            <p className="text-sm text-gray-500" data-testid="text-empty">
              Nenhum paciente encontrado ainda.
            </p>
          )}

          {!isLoading && !error && patients.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left">
                    <th className="py-2 px-3 font-medium text-gray-700">Paciente</th>
                    <th className="py-2 px-3 font-medium text-gray-700">Contato</th>
                    <th className="py-2 px-3 font-medium text-gray-700">Última consulta</th>
                    <th className="py-2 px-3 font-medium text-gray-700">Nº de consultas</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 px-3 text-gray-900">{p.fullName}</td>
                      <td className="py-2 px-3 text-gray-600">
                        <div className="flex flex-col">
                          {p.email && <span>{p.email}</span>}
                          {p.phone && <span className="text-xs text-gray-500">{p.phone}</span>}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-gray-600">
                        {p.lastConsultationDate
                          ? new Date(p.lastConsultationDate).toLocaleDateString("pt-BR")
                          : "-"}
                      </td>
                      <td className="py-2 px-3 text-gray-600">{p.totalConsultations ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
