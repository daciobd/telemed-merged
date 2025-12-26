import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Clock, User, FileEdit, CheckCircle, PenTool, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { apiRequest } from "@/lib/api";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className || ""}`} />;
}

interface AuditEvent {
  id: string;
  createdAt: string;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  changedFields: string[];
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
}

interface AuditResponse {
  ok: boolean;
  prontuarioId: string;
  paging: { limit: number; offset: number; total: number };
  events: AuditEvent[];
}

const actionLabels: Record<string, { label: string; icon: typeof FileEdit; color: string }> = {
  create: { label: "Criação", icon: FileEdit, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  update: { label: "Alteração", icon: FileEdit, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  finalize: { label: "Finalização", icon: CheckCircle, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  sign: { label: "Assinatura", icon: PenTool, color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200" },
  reopen: { label: "Reabertura", icon: AlertTriangle, color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
};

const fieldLabels: Record<string, string> = {
  status: "Status",
  queixa_principal: "Queixa Principal",
  anamnese: "Anamnese",
  hipoteses_texto: "Hipóteses",
  hipoteses_cid: "CID",
  exames: "Exames",
  prescricao: "Prescrição",
  encaminhamentos: "Encaminhamentos",
  alertas: "Alertas",
  seguimento: "Seguimento",
  finalized_at: "Data Finalização",
  signed_at: "Data Assinatura",
  ia_metadata: "Metadados IA",
};

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "(vazio)";
  if (typeof val === "object") {
    try {
      const str = JSON.stringify(val, null, 2);
      return str.length > 200 ? str.substring(0, 200) + "..." : str;
    } catch {
      return String(val);
    }
  }
  const str = String(val);
  return str.length > 200 ? str.substring(0, 200) + "..." : str;
}

function AuditEventCard({ event }: { event: AuditEvent }) {
  const [expanded, setExpanded] = useState(false);
  const actionInfo = actionLabels[event.action] || { label: event.action, icon: FileEdit, color: "bg-gray-100 text-gray-800" };
  const IconComponent = actionInfo.icon;
  
  const date = new Date(event.createdAt);
  const formattedDate = date.toLocaleDateString("pt-BR");
  const formattedTime = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  
  return (
    <Card className="mb-3" data-testid={`audit-event-${event.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${actionInfo.color}`}>
              <IconComponent className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge className={actionInfo.color}>{actionInfo.label}</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formattedDate} {formattedTime}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <User className="h-3 w-3" />
                {event.actorEmail || "Sistema"} ({event.actorRole || "system"})
              </div>
            </div>
          </div>
          
          {event.changedFields.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              data-testid={`btn-expand-${event.id}`}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {event.changedFields.length} campo(s)
            </button>
          )}
        </div>
        
        {event.changedFields.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {event.changedFields.map(field => (
              <Badge key={field} variant="outline" className="text-xs">
                {fieldLabels[field] || field}
              </Badge>
            ))}
          </div>
        )}
        
        {expanded && event.changedFields.length > 0 && (
          <div className="mt-4 space-y-3 border-t pt-3">
            {event.changedFields.map(field => (
              <div key={field} className="text-sm">
                <div className="font-medium mb-1">{fieldLabels[field] || field}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-red-50 dark:bg-red-950 p-2 rounded text-xs">
                    <span className="text-red-600 dark:text-red-400 font-medium">Antes:</span>
                    <pre className="mt-1 whitespace-pre-wrap break-words text-red-800 dark:text-red-300">
                      {formatValue(event.before?.[field])}
                    </pre>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950 p-2 rounded text-xs">
                    <span className="text-green-600 dark:text-green-400 font-medium">Depois:</span>
                    <pre className="mt-1 whitespace-pre-wrap break-words text-green-800 dark:text-green-300">
                      {formatValue(event.after?.[field])}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
            
            {event.ip && (
              <div className="text-xs text-muted-foreground mt-2">
                IP: {event.ip}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ManagerProntuarioAudit() {
  const [, params] = useRoute("/manager/prontuarios/:id/historico");
  const prontuarioId = params?.id;
  
  const { data, isLoading, error } = useQuery<AuditResponse>({
    queryKey: ["/api/manager/prontuarios", prontuarioId, "audit"],
    queryFn: () => apiRequest<AuditResponse>(`/api/manager/prontuarios/${prontuarioId}/audit?limit=100`),
    enabled: !!prontuarioId,
  });
  
  if (!prontuarioId) {
    return (
      <div className="p-6">
        <p className="text-red-500">ID do prontuário não informado</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/manager/pendencias" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4" data-testid="link-back-pendencias">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Pendências
        </Link>
        
        <h1 className="text-2xl font-bold text-foreground" data-testid="title-audit">
          Histórico de Auditoria
        </h1>
        <p className="text-muted-foreground mt-1" data-testid="text-prontuario-id">
          Prontuário: {prontuarioId}
        </p>
      </div>
      
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}
      
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950">
          <CardContent className="p-4 text-red-600 dark:text-red-400">
            Erro ao carregar histórico de auditoria
          </CardContent>
        </Card>
      )}
      
      {data && (
        <>
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total de eventos:</span>
                  <span className="ml-2 font-medium" data-testid="text-total-events">{data.paging.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {data.events.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhum evento de auditoria registrado para este prontuário.
              </CardContent>
            </Card>
          ) : (
            <div>
              {data.events.map(event => (
                <AuditEventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
