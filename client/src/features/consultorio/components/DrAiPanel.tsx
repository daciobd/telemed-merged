import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, AlertTriangle, Plus, CheckCircle } from "lucide-react";

type DrAiResponse = {
  resumo?: string;
  hipoteses?: string[];
  exames?: string[];
  aviso?: string;
  error?: string;
};

type Props = {
  pacienteNome?: string;
  pacienteIdade?: number;
  pacienteSexo?: string;
  initialQueixaPrincipal?: string;
  onApplyResumoToEvolucao?: (texto: string) => void;
};

function formatSexo(sexo?: string) {
  if (!sexo) return undefined;
  const s = sexo.trim().toUpperCase();
  if (s === "M" || s === "MASCULINO") return "M";
  if (s === "F" || s === "FEMININO") return "F";
  return sexo;
}

export default function DrAiPanel({
  pacienteNome,
  pacienteIdade,
  pacienteSexo,
  initialQueixaPrincipal = "",
  onApplyResumoToEvolucao,
}: Props) {
  const [queixaPrincipal, setQueixaPrincipal] = useState(initialQueixaPrincipal);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DrAiResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const canRun = useMemo(() => Boolean(queixaPrincipal?.trim()), [queixaPrincipal]);

  async function handleGerar() {
    if (!canRun || loading) return;

    setLoading(true);
    setErr(null);
    setData(null);

    try {
      const res = await fetch("/api/consultorio/dr-ai/anamnese", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          queixaPrincipal,
          nome: pacienteNome,
          idade: pacienteIdade,
          sexo: formatSexo(pacienteSexo),
        }),
      });

      const json = (await res.json().catch(() => ({}))) as DrAiResponse;

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Acesso negado (401). Faça login novamente.");
        }
        if (res.status === 503) {
          throw new Error(json?.error || "IA temporariamente indisponível (503).");
        }
        throw new Error(json?.error || `Erro ao gerar (HTTP ${res.status}).`);
      }

      setData(json);
      setApplied(false);
    } catch (e: any) {
      setErr(e?.message || "Falha ao chamar o Dr. AI.");
    } finally {
      setLoading(false);
    }
  }

  function handleLimpar() {
    setData(null);
    setErr(null);
    setApplied(false);
  }

  function handleApply() {
    if (data?.resumo && onApplyResumoToEvolucao) {
      const textoCompleto = [
        data.resumo,
        "",
        "**Hipóteses diagnósticas:**",
        ...(data.hipoteses?.map((h, i) => `${i + 1}. ${h}`) || []),
        "",
        "**Exames sugeridos:**",
        ...(data.exames?.map(e => `• ${e}`) || []),
      ].join("\n");
      onApplyResumoToEvolucao(textoCompleto);
      setApplied(true);
    }
  }

  return (
    <Card className="rounded-2xl border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50/50 to-white dark:from-teal-950/30 dark:to-gray-900" data-testid="panel-dr-ai">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
          <Sparkles className="h-5 w-5" />
          Anamnese Inicial
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Apoio ao raciocínio clínico, com linguagem médica e foco em segurança.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Queixa principal / Observações iniciais
          </label>
          <Textarea
            value={queixaPrincipal}
            onChange={(e) => setQueixaPrincipal(e.target.value)}
            placeholder="Descreva a queixa principal e observações iniciais do paciente…"
            className="min-h-[100px] resize-none"
            data-testid="input-queixa-principal"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleGerar}
              disabled={!canRun || loading}
              className="rounded-xl bg-teal-600 hover:bg-teal-700"
              data-testid="button-gerar-dr-ai"
              title="Organiza a queixa em linguagem médica e sugere hipóteses e exames iniciais."
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              🤖 Dr. AI – Gerar pré-anamnese clínica
            </Button>

            {data && (
              <Button
                type="button"
                variant="outline"
                onClick={handleLimpar}
                disabled={loading}
                className="rounded-xl"
                data-testid="button-limpar"
              >
                Limpar resultado
              </Button>
            )}

            {!canRun && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Preencha a queixa principal para habilitar.
              </span>
            )}
          </div>
        </div>

        {err && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">Não foi possível gerar</p>
              <p className="text-sm text-red-700 dark:text-red-300">{err}</p>
            </div>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            <hr className="border-gray-200 dark:border-gray-700" />

            <div className="space-y-3">
              <div className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                Sugestão Clínica (Dr. AI)
              </div>

              {data.resumo && (
                <div className="rounded-xl border bg-white dark:bg-gray-800 p-3 text-sm whitespace-pre-wrap" data-testid="text-resumo">
                  {data.resumo}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hipóteses diferenciais
                  </div>
                  {data.hipoteses?.length ? (
                    <ul className="space-y-1.5 text-sm" data-testid="list-hipoteses">
                      {data.hipoteses.map((h, i) => (
                        <li key={`${h}-${i}`} className="flex items-start gap-2">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 text-xs font-medium flex-shrink-0">
                            {i + 1}
                          </span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">—</div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Exames iniciais sugeridos
                  </div>
                  {data.exames?.length ? (
                    <ul className="space-y-1 text-sm list-disc pl-5" data-testid="list-exames">
                      {data.exames.map((x, i) => (
                        <li key={`${x}-${i}`}>{x}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">—</div>
                  )}
                </div>
              </div>

              {data.aviso && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Aviso de segurança</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 whitespace-pre-wrap">{data.aviso}</p>
                  </div>
                </div>
              )}

              {onApplyResumoToEvolucao && (
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={handleApply}
                    disabled={applied}
                    variant={applied ? "outline" : "default"}
                    className={`rounded-xl ${applied ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300' : 'bg-teal-600 hover:bg-teal-700'}`}
                    data-testid="button-aplicar-prontuario"
                  >
                    {applied ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Aplicado ao prontuário
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Aplicar ao prontuário
                      </>
                    )}
                  </Button>
                  {applied && (
                    <span className="text-xs text-green-600 dark:text-green-400">
                      ✓ Texto adicionado à evolução clínica
                    </span>
                  )}
                </div>
              )}

              <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                Conteúdo gerado com apoio de Inteligência Artificial clínica.
                A decisão diagnóstica e terapêutica é exclusivamente do médico.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
