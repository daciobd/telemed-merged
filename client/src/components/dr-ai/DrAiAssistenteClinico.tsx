import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  FileText, 
  AlertTriangle,
  Stethoscope,
  ClipboardList
} from 'lucide-react';

interface DrAiAssistenteClinicoProps {
  queixaPrincipal?: string;
  observacoes?: string;
  pacienteNome?: string;
  pacienteIdade?: number;
  pacienteSexo?: string;
}

export default function DrAiAssistenteClinico({
  queixaPrincipal = 'Dor de cabeça persistente há 3 dias',
  observacoes = 'Paciente relata histórico de enxaqueca',
  pacienteNome = 'Paciente',
  pacienteIdade = 34,
  pacienteSexo = 'feminino'
}: DrAiAssistenteClinicoProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showPreAnamnese, setShowPreAnamnese] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGerarResumo = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowPreAnamnese(true);
    }, 1500);
  };

  const preAnamneseTexto = `
**Pré-Anamnese Automatizada - Dr. AI**

**Paciente:** ${pacienteNome}, ${pacienteIdade} anos, sexo ${pacienteSexo}

**Queixa Principal:**
${queixaPrincipal}

**Histórico Relevante:**
${observacoes}

**Sugestões de Investigação:**
• Verificar padrão da dor (frequência, intensidade, gatilhos)
• Avaliar sinais de alarme neurológico
• Revisar medicamentos em uso
• Considerar fatores emocionais/estresse

**Diagnósticos Diferenciais:**
1. Cefaleia tensional
2. Enxaqueca sem aura
3. Cefaleia cervicogênica

**Sinais de Alerta a Monitorar:**
⚠️ Piora súbita da dor
⚠️ Rigidez de nuca
⚠️ Alterações visuais persistentes
⚠️ Febre associada
  `.trim();

  return (
    <aside 
      className={`w-full lg:w-80 xl:w-96 transition-all duration-300 ${isCollapsed ? 'lg:w-16' : ''}`}
      data-testid="panel-dr-ai"
    >
      <Card className="border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-white dark:from-teal-950 dark:to-gray-900 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
              <Bot className="h-5 w-5" />
              {!isCollapsed && (
                <span className="text-sm font-semibold" data-testid="text-dr-ai-title">
                  Assistente Clínico – Dr. AI
                </span>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 p-0 text-teal-600 hover:bg-teal-100 dark:hover:bg-teal-900"
              data-testid="button-toggle-panel"
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>

        {!isCollapsed && (
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 bg-teal-100/50 dark:bg-teal-900/50 rounded-lg px-3 py-2">
              <Sparkles className="h-4 w-4" />
              <span>IA disponível para auxiliar no atendimento</span>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleGerarResumo}
                disabled={isGenerating || showPreAnamnese}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                data-testid="button-gerar-resumo"
              >
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    {showPreAnamnese ? 'Resumo Gerado' : 'Gerar Pré-Anamnese'}
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-teal-200 hover:bg-teal-50 dark:border-teal-700 dark:hover:bg-teal-900"
                  data-testid="button-hipoteses"
                >
                  <Stethoscope className="h-3 w-3 mr-1" />
                  Hipóteses
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-teal-200 hover:bg-teal-50 dark:border-teal-700 dark:hover:bg-teal-900"
                  data-testid="button-exames"
                >
                  <ClipboardList className="h-3 w-3 mr-1" />
                  Exames
                </Button>
              </div>
            </div>

            {showPreAnamnese && (
              <section 
                className="bg-white dark:bg-gray-800 rounded-lg border border-teal-100 dark:border-teal-800 p-4 space-y-3"
                data-testid="section-pre-anamnese"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-teal-700 dark:text-teal-300">
                  <FileText className="h-4 w-4" />
                  Pré-Anamnese Gerada
                </div>
                
                <div className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed max-h-64 overflow-y-auto" data-testid="text-pre-anamnese">
                  {preAnamneseTexto}
                </div>

                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3 text-xs">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-800 dark:text-amber-200">
                    <strong>Aviso:</strong> Este conteúdo é gerado por IA e serve apenas como sugestão. 
                    A decisão clínica final é sempre do médico responsável.
                  </p>
                </div>
              </section>
            )}

            <div className="text-center">
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                Dr. AI v1.0 • Modo Demo • TeleMed
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </aside>
  );
}
