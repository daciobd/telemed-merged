import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { 
  AlertTriangle, Clock, Users, TrendingUp, TrendingDown, 
  Minus, Loader2, ArrowLeft, ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DoctorAlert {
  medicoId: string;
  medicoNome: string;
  medicoEmail: string;
  criticos: number;
  pendencias24h: number;
  pendenciasTotal: number;
  trend: {
    d7: number;
    d30: number;
    ratio: number;
  };
}

interface AlertsResponse {
  ok: boolean;
  range: {
    days: number;
    criticalHours: number;
  };
  top: {
    byCritical: DoctorAlert[];
    by24h: DoctorAlert[];
    byTotal: DoctorAlert[];
  };
}

function TrendIndicator({ ratio }: { ratio: number }) {
  if (ratio > 0.35) {
    return (
      <span className="flex items-center text-red-600 text-sm">
        <TrendingUp className="w-4 h-4 mr-1" />
        Piorando
      </span>
    );
  }
  if (ratio < 0.2) {
    return (
      <span className="flex items-center text-green-600 text-sm">
        <TrendingDown className="w-4 h-4 mr-1" />
        Melhorando
      </span>
    );
  }
  return (
    <span className="flex items-center text-gray-500 text-sm">
      <Minus className="w-4 h-4 mr-1" />
      Estável
    </span>
  );
}

function DoctorRow({ doctor, onDrillDown }: { doctor: DoctorAlert; onDrillDown: () => void }) {
  return (
    <div
      className="flex items-center justify-between p-4 bg-white rounded-lg border hover:border-teal-300 cursor-pointer transition-colors"
      onClick={onDrillDown}
      data-testid={`row-doctor-${doctor.medicoId}`}
    >
      <div className="flex-1">
        <p className="font-medium text-gray-900">{doctor.medicoNome}</p>
        <p className="text-sm text-gray-500">{doctor.medicoEmail}</p>
      </div>
      
      <div className="flex items-center gap-6 mr-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{doctor.criticos}</p>
          <p className="text-xs text-gray-500">Críticos</p>
        </div>
        
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">{doctor.pendencias24h}</p>
          <p className="text-xs text-gray-500">&gt;24h</p>
        </div>
        
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700">{doctor.pendenciasTotal}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        
        <div className="text-center min-w-[80px]">
          <TrendIndicator ratio={doctor.trend.ratio} />
          <p className="text-xs text-gray-400">{doctor.trend.d7}/{doctor.trend.d30}</p>
        </div>
      </div>
      
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </div>
  );
}

export default function ManagerDoctorAlerts() {
  const [, setLocation] = useLocation();
  const [criticalHours, setCriticalHours] = useState(48);
  const [days, setDays] = useState(30);

  const { data, isLoading, error } = useQuery<AlertsResponse>({
    queryKey: ["/api/manager/doctors/alerts", days, criticalHours],
    queryFn: async () => {
      const res = await fetch(
        `/api/manager/doctors/alerts?days=${days}&criticalHours=${criticalHours}&limit=15`
      );
      return res.json();
    },
  });

  const handleDrillDown = (medicoId: string, minHours?: number) => {
    const params = new URLSearchParams();
    params.set("medico_id", medicoId);
    if (minHours) params.set("minHours", String(minHours));
    setLocation(`/manager/pendencias?${params.toString()}`);
  };

  const summaryStats = data?.top.byCritical ? {
    totalCriticos: data.top.byCritical.reduce((sum, d) => sum + d.criticos, 0),
    total24h: data.top.by24h.reduce((sum, d) => sum + d.pendencias24h, 0),
    totalPendencias: data.top.byTotal.reduce((sum, d) => sum + d.pendenciasTotal, 0),
    medicosComCriticos: data.top.byCritical.filter(d => d.criticos > 0).length,
  } : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/manager/dashboard">
              <Button variant="ghost" size="sm" data-testid="link-back-dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Ranking de Pendências por Médico
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border">
              <span className="text-sm text-gray-500">Crítico:</span>
              <select
                value={criticalHours}
                onChange={(e) => setCriticalHours(Number(e.target.value))}
                className="text-sm font-medium border-none focus:outline-none"
                data-testid="select-critical-hours"
              >
                <option value={24}>24h</option>
                <option value={48}>48h</option>
                <option value={72}>72h</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border">
              <span className="text-sm text-gray-500">Período:</span>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="text-sm font-medium border-none focus:outline-none"
                data-testid="select-days"
              >
                <option value={7}>7 dias</option>
                <option value={30}>30 dias</option>
                <option value={90}>90 dias</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">Erro ao carregar: {String(error)}</p>
            </CardContent>
          </Card>
        )}

        {data && !isLoading && (
          <>
            {summaryStats && (
              <div className="grid grid-cols-4 gap-4 mb-6">
                <Card data-testid="card-summary-criticos">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-red-600" data-testid="text-total-criticos">
                          {summaryStats.totalCriticos}
                        </p>
                        <p className="text-sm text-gray-500">Críticos ({criticalHours}h+)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-summary-24h">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Clock className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-yellow-600" data-testid="text-total-24h">
                          {summaryStats.total24h}
                        </p>
                        <p className="text-sm text-gray-500">Pendências &gt;24h</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-summary-medicos">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Users className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-700" data-testid="text-medicos-criticos">
                          {summaryStats.medicosComCriticos}
                        </p>
                        <p className="text-sm text-gray-500">Médicos c/ críticos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-summary-total">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-teal-600" data-testid="text-total-pendencias">
                          {summaryStats.totalPendencias}
                        </p>
                        <p className="text-sm text-gray-500">Total pendências</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="critical">
                  <TabsList className="mb-4">
                    <TabsTrigger value="critical" data-testid="tab-critical">
                      🔴 Top Críticos ({criticalHours}h+)
                    </TabsTrigger>
                    <TabsTrigger value="24h" data-testid="tab-24h">
                      🟡 Top &gt;24h
                    </TabsTrigger>
                    <TabsTrigger value="total" data-testid="tab-total">
                      📊 Top Total
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="critical">
                    {data.top.byCritical.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        Nenhum médico com pendências críticas. Excelente!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {data.top.byCritical.map((doc) => (
                          <DoctorRow
                            key={doc.medicoId}
                            doctor={doc}
                            onDrillDown={() => handleDrillDown(doc.medicoId, criticalHours)}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="24h">
                    {data.top.by24h.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        Nenhum médico com pendências &gt;24h.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {data.top.by24h.map((doc) => (
                          <DoctorRow
                            key={doc.medicoId}
                            doctor={doc}
                            onDrillDown={() => handleDrillDown(doc.medicoId, 24)}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="total">
                    {data.top.byTotal.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        Nenhum médico com pendências no período.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {data.top.byTotal.map((doc) => (
                          <DoctorRow
                            key={doc.medicoId}
                            doctor={doc}
                            onDrillDown={() => handleDrillDown(doc.medicoId)}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
