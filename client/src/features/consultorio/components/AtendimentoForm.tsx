import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";

interface Props {
  queixa: string;
  setQueixa: (v: string) => void;
  anamnese: string;
  setAnamnese: (v: string) => void;
}

export default function AtendimentoForm({
  queixa,
  setQueixa,
  anamnese,
  setAnamnese,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-teal-600" />
          Anamnese Clínica
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Queixa principal
          </label>
          <Textarea
            value={queixa}
            onChange={(e) => setQueixa(e.target.value)}
            rows={2}
            placeholder="Ex: ansiedade persistente há cerca de 3 meses"
            data-testid="input-queixa-form"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Anamnese
          </label>
          <Textarea
            value={anamnese}
            onChange={(e) => setAnamnese(e.target.value)}
            rows={12}
            placeholder="História da doença atual, evolução, impacto funcional, antecedentes relevantes..."
            data-testid="input-anamnese-form"
          />
        </div>
      </CardContent>
    </Card>
  );
}
