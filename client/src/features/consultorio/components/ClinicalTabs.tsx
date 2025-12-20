import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  exames: string;
  setExames: (v: string) => void;
  prescricao: string;
  setPrescricao: (v: string) => void;
  encaminhamento: string;
  setEncaminhamento: (v: string) => void;
  notasPrivadas: string;
  setNotasPrivadas: (v: string) => void;
  disabled?: boolean;
}

export default function ClinicalTabs({
  exames,
  setExames,
  prescricao,
  setPrescricao,
  encaminhamento,
  setEncaminhamento,
  notasPrivadas,
  setNotasPrivadas,
  disabled = false,
}: Props) {
  return (
    <Card>
      <CardContent className="pt-4">
        <Tabs defaultValue="exames">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="exames" data-testid="tab-exames">Exames</TabsTrigger>
            <TabsTrigger value="prescricao" data-testid="tab-prescricao">Prescrição</TabsTrigger>
            <TabsTrigger value="encaminhamento" data-testid="tab-encaminhamento">Encaminhamento</TabsTrigger>
            <TabsTrigger value="arquivos" data-testid="tab-arquivos">Arquivos</TabsTrigger>
            <TabsTrigger value="notas" data-testid="tab-notas">Notas privadas</TabsTrigger>
          </TabsList>

          <TabsContent value="exames" className="mt-4">
            <Textarea
              value={exames}
              onChange={(e) => setExames(e.target.value)}
              rows={6}
              placeholder="Solicitações ou resultados de exames..."
              data-testid="textarea-exames"
              disabled={disabled}
            />
          </TabsContent>

          <TabsContent value="prescricao" className="mt-4">
            <Textarea
              value={prescricao}
              onChange={(e) => setPrescricao(e.target.value)}
              rows={6}
              placeholder="Prescrição registrada na consulta..."
              data-testid="textarea-prescricao"
              disabled={disabled}
            />
          </TabsContent>

          <TabsContent value="encaminhamento" className="mt-4">
            <Textarea
              value={encaminhamento}
              onChange={(e) => setEncaminhamento(e.target.value)}
              rows={6}
              placeholder="Encaminhamentos (psicoterapia, especialista, etc.)"
              data-testid="textarea-encaminhamento"
              disabled={disabled}
            />
          </TabsContent>

          <TabsContent value="arquivos" className="mt-4">
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload de arquivos será adicionado aqui.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="notas" className="mt-4">
            <Textarea
              value={notasPrivadas}
              onChange={(e) => setNotasPrivadas(e.target.value)}
              rows={6}
              placeholder="Notas privadas (visíveis apenas ao médico)"
              data-testid="textarea-notas"
              disabled={disabled}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
