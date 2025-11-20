import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProtocolsPanel() {
  const { data: protocols, isLoading, error } = useQuery({
    queryKey: ["/api/protocols"],
    queryFn: api.getProtocols,
  });

  if (error) {
    return (
      <div className="clinical-card p-6">
        <div className="text-center text-red-600">
          <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
          <p>Erro ao carregar protocolos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="clinical-card p-6" data-testid="protocols-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Protocolos Clínicos Relacionados</h3>
        <Button variant="link" className="text-primary hover:text-primary/80 text-sm font-medium p-0">
          Ver todos os protocolos <i className="fas fa-arrow-right ml-1"></i>
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-border rounded-lg p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full mb-3" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {protocols?.map((protocol) => (
            <div 
              key={protocol.id} 
              className="border border-border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
              data-testid={`protocol-card-${protocol.id}`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <i className={`fas ${getProtocolIcon(protocol.name)} text-primary`}></i>
                <h5 className="font-medium text-foreground">{protocol.title}</h5>
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {protocol.summary}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Última atualização: {new Date(protocol.lastUpdated).toLocaleDateString('pt-BR', { 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </span>
                <span className={`protocol-badge ${protocol.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {protocol.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {protocols && protocols.length === 0 && (
        <div className="text-center text-muted-foreground py-8" data-testid="no-protocols">
          <i className="fas fa-file-medical text-2xl mb-2"></i>
          <p>Nenhum protocolo encontrado</p>
        </div>
      )}
    </div>
  );
}

function getProtocolIcon(protocolName: string): string {
  switch (protocolName) {
    case "dor_toracica":
      return "fa-file-medical";
    case "wells_score":
      return "fa-lungs";
    case "cefaleia_bandeiras":
      return "fa-head-side-virus";
    default:
      return "fa-file-medical";
  }
}
