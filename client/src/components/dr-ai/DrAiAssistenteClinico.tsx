import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bot, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  FileText, 
  AlertTriangle,
  Stethoscope,
  ClipboardList,
  Loader2,
  Edit3
} from 'lucide-react';

interface DrAiAssistenteClinicoProps {
  queixaPrincipal?: string;
  observacoes?: string;
  pacienteNome?: string;
  pacienteIdade?: number;
  pacienteSexo?: string;
}

type DrAiData = {
  resumo: string;
  hipoteses: string[];
  exames: string[];
  aviso: string;
};

export default function DrAiAssistenteClinico({
  queixaPrincipal = 'Dor de cabeça persistente há 3 dias',
  pacienteNome = 'Paciente',
  pacienteIdade = 34,
  pacienteSexo = 'feminino'
}: DrAiAssistenteClinicoProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tab, setTab] = useState<'resumo' | 'hipoteses' | 'exames'>('resumo');
  const [data, setData] = useState<DrAiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [queixaEditavel, setQueixaEditavel] = useState(queixaPrincipal);
  const [mostrarEditor, setMostrarEditor] = useState(false);

  async function gerarComIA() {
    try {
      setLoading(true);
      setErro(null);

      const resp = await fetch('/api/consultorio/dr-ai/anamnese', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queixaPrincipal: queixaEditavel,
          nome: pacienteNome,
          idade: pacienteIdade,
          sexo: pacienteSexo
        })
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || 'Erro ao gerar anamnese');
      }

      const json: DrAiData = await resp.json();
      setData(json);
      setTab('resumo');
      setMostrarEditor(false);
    } catch (e: any) {
      setErro(e.message || 'Falha ao gerar conteúdo com IA');
    } finally {
      setLoading(false);
    }
  }

  const renderConteudo = () => {
    if (!data) return null;

    if (tab === 'resumo') {
      return (
        <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">
          {data.resumo}
        </div>
      );
    }

    if (tab === 'hipoteses') {
      return (
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3">
          <p className="font-semibold text-gray-800 dark:text-gray-200">Diagnóstico Diferencial</p>
          <ul className="space-y-1">
            {data.hipoteses.map((h, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-teal-600">•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (tab === 'exames') {
      return (
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3">
          <p className="font-semibold text-gray-800 dark:text-gray-200">Exames Iniciais Sugeridos</p>
          <ul className="space-y-1">
            {data.exames.map((e, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-teal-600">•</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 mt-3">
            * Sugestões automáticas apenas para apoio clínico.
          </p>
        </div>
      );
    }

    return null;
  };

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
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 bg-teal-100/50 dark:bg-teal-900/50 rounded-lg px-3 py-2">
              <Sparkles className="h-4 w-4" />
              <span>IA disponível para auxiliar no atendimento</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Queixa atual:</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarEditor(!mostrarEditor)}
                  className="h-6 px-2 text-xs text-teal-600 hover:bg-teal-100"
                  data-testid="button-editar-queixa"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Editar
                </Button>
              </div>
              
              {mostrarEditor ? (
                <Textarea
                  value={queixaEditavel}
                  onChange={(e) => setQueixaEditavel(e.target.value)}
                  className="text-xs min-h-[60px] resize-none"
                  placeholder="Digite a queixa do paciente..."
                  data-testid="input-queixa"
                />
              ) : (
                <p className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-md px-2 py-1.5 border">
                  "{queixaEditavel}"
                </p>
              )}
            </div>

            <Button
              onClick={gerarComIA}
              disabled={loading || !queixaEditavel.trim()}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              data-testid="button-gerar-ia"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando com IA...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {data ? 'Gerar Novamente' : 'Gerar com IA'}
                </>
              )}
            </Button>

            {erro && (
              <div className="text-[11px] text-red-600 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-md px-2 py-1.5">
                {erro}
              </div>
            )}

            <div className="flex gap-1">
              <Button
                variant={tab === 'resumo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTab('resumo')}
                className={`flex-1 text-xs ${tab === 'resumo' ? 'bg-teal-600 hover:bg-teal-700' : 'border-teal-200 hover:bg-teal-50 dark:border-teal-700'}`}
                data-testid="tab-resumo"
              >
                <FileText className="h-3 w-3 mr-1" />
                Resumo
              </Button>
              <Button
                variant={tab === 'hipoteses' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTab('hipoteses')}
                className={`flex-1 text-xs ${tab === 'hipoteses' ? 'bg-teal-600 hover:bg-teal-700' : 'border-teal-200 hover:bg-teal-50 dark:border-teal-700'}`}
                data-testid="tab-hipoteses"
              >
                <Stethoscope className="h-3 w-3 mr-1" />
                Hipóteses
              </Button>
              <Button
                variant={tab === 'exames' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTab('exames')}
                className={`flex-1 text-xs ${tab === 'exames' ? 'bg-teal-600 hover:bg-teal-700' : 'border-teal-200 hover:bg-teal-50 dark:border-teal-700'}`}
                data-testid="tab-exames"
              >
                <ClipboardList className="h-3 w-3 mr-1" />
                Exames
              </Button>
            </div>

            <div className="border rounded-xl p-3 bg-white dark:bg-gray-800 min-h-[200px] max-h-[280px] overflow-y-auto">
              {!data && !loading && (
                <div className="flex flex-col items-center justify-center h-[180px] text-center">
                  <Bot className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Clique em <strong>"Gerar com IA"</strong> para ver o resumo, hipóteses e exames sugeridos.
                  </p>
                </div>
              )}
              {loading && (
                <div className="flex flex-col items-center justify-center h-[180px]">
                  <Loader2 className="h-8 w-8 text-teal-600 animate-spin mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Gerando análise clínica com IA...
                  </p>
                </div>
              )}
              {data && !loading && renderConteudo()}
            </div>

            {data && (
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg p-2 text-[10px]">
                <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-800 dark:text-amber-200">
                  {data.aviso}
                </p>
              </div>
            )}

            <div className="text-center">
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                Dr. AI v1.0 • TeleMed
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </aside>
  );
}
