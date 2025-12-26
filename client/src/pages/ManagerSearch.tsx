import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch, Link } from "wouter";
import { Search, FileText, User, Stethoscope, Clock, Loader2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  ok: boolean;
  q: string;
  tookMs: number;
  groups: {
    prontuarios: Array<{
      id: string;
      status: string;
      createdAt: string;
      finalizedAt: string | null;
      signedAt: string | null;
      pacienteId: string;
      medicoId: string;
      queixaPrincipal: string | null;
    }>;
    pacientes: Array<{
      id: number;
      nome: string;
      email: string;
      telefone: string | null;
    }>;
    medicos: Array<{
      id: number;
      nome: string;
      email: string;
      crm: string;
    }>;
  };
}

function getStatusBadge(status: string, signedAt: string | null) {
  if (signedAt) return <Badge className="bg-green-600">Assinado</Badge>;
  if (status === "final") return <Badge className="bg-yellow-600">Finalizado</Badge>;
  return <Badge variant="secondary">Rascunho</Badge>;
}

export default function ManagerSearch() {
  const searchParams = useSearch();
  const params = new URLSearchParams(searchParams);
  const initialQ = params.get("q") || "";
  
  const [, setLocation] = useLocation();
  const [searchInput, setSearchInput] = useState(initialQ);
  const [activeQuery, setActiveQuery] = useState(initialQ);

  const { data, isLoading, error } = useQuery<SearchResult>({
    queryKey: ["/api/manager/search", activeQuery],
    queryFn: async () => {
      const res = await fetch(`/api/manager/search?q=${encodeURIComponent(activeQuery)}`);
      return res.json();
    },
    enabled: activeQuery.length >= 2,
    staleTime: 30000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim().length >= 2) {
      setActiveQuery(searchInput.trim());
      setLocation(`/manager/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const totalResults = data?.groups ? 
    data.groups.prontuarios.length + data.groups.pacientes.length + data.groups.medicos.length : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/manager/dashboard">
            <Button variant="ghost" size="sm" data-testid="link-back-dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Busca Global</h1>
        </div>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por nome, email, telefone, UUID do prontuário..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 h-12 text-lg"
                data-testid="input-search-global"
              />
            </div>
            <Button type="submit" className="h-12 px-6" data-testid="button-search">
              Buscar
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Dica: Digite pelo menos 2 caracteres. Para telefone, pode omitir DDD e formatação.
          </p>
        </form>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <span className="ml-2 text-gray-600">Buscando...</span>
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">Erro ao buscar: {String(error)}</p>
            </CardContent>
          </Card>
        )}

        {data && !isLoading && (
          <>
            {activeQuery && (
              <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                <span>
                  {totalResults} resultado(s) para "<strong>{data.q}</strong>"
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {data.tookMs}ms
                </span>
              </div>
            )}

            {totalResults === 0 && activeQuery && (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <p>Nenhum resultado encontrado.</p>
                  <p className="text-sm mt-2">
                    Tente buscar por email, telefone sem DDD, ou parte do nome.
                  </p>
                </CardContent>
              </Card>
            )}

            {data.groups.prontuarios.length > 0 && (
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-teal-600" />
                    Prontuários ({data.groups.prontuarios.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.groups.prontuarios.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                        onClick={() => setLocation(`/manager/prontuarios?id=${p.id}`)}
                        data-testid={`card-prontuario-${p.id}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-gray-500">{p.id.substring(0, 8)}...</code>
                            {getStatusBadge(p.status, p.signedAt)}
                          </div>
                          {p.queixaPrincipal && (
                            <p className="text-sm text-gray-600 mt-1 truncate max-w-md">
                              {p.queixaPrincipal}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {data.groups.pacientes.length > 0 && (
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="w-5 h-5 text-blue-600" />
                    Pacientes ({data.groups.pacientes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.groups.pacientes.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                        data-testid={`card-paciente-${p.id}`}
                      >
                        <div>
                          <p className="font-medium">{p.nome}</p>
                          <p className="text-sm text-gray-500">{p.email}</p>
                        </div>
                        {p.telefone && (
                          <span className="text-sm text-gray-500">{p.telefone}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {data.groups.medicos.length > 0 && (
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Stethoscope className="w-5 h-5 text-purple-600" />
                    Médicos ({data.groups.medicos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.groups.medicos.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                        onClick={() => setLocation(`/manager/pendencias?medico_id=${m.id}`)}
                        data-testid={`card-medico-${m.id}`}
                      >
                        <div>
                          <p className="font-medium">{m.nome}</p>
                          <p className="text-sm text-gray-500">{m.email}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{m.crm}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
