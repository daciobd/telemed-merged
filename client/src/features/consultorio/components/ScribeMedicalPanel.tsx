import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mic, Upload, FileAudio, AlertTriangle, CheckCircle, Copy, FileText, Pill, UserPlus, TestTube } from "lucide-react";

type StructuredScribe = {
  queixa_principal?: string;
  hda?: string;
  antecedentes_medicacoes_alergias?: string;
  revisao_sistemas_exame?: string;
  avaliacao_hipoteses?: string[];
  exames_sugeridos?: string[];
  plano_conduta?: string;
  prescricao_mencionada?: string;
  encaminhamentos?: string;
  alertas_seguranca?: string;
  seguimento?: string;
  observacao?: string;
};

type ScribeResponse = {
  texto?: string;
  structured?: StructuredScribe | null;
  error?: string;
};

type Props = {
  consultaId?: string;
  onApplyToEvolucao?: (texto: string) => void;
  onApplyToAnamnese?: (bloco: string) => void;
  onApplyToPrescricao?: (bloco: string) => void;
  onApplyToEncaminhamento?: (bloco: string) => void;
  onApplyToExames?: (bloco: string) => void;
  initialTexto?: string;
};

export default function ScribeMedicalPanel({
  consultaId,
  onApplyToEvolucao,
  onApplyToAnamnese,
  onApplyToPrescricao,
  onApplyToEncaminhamento,
  onApplyToExames,
  initialTexto = "",
}: Props) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [texto, setTexto] = useState(initialTexto);
  const [structured, setStructured] = useState<StructuredScribe | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [appliedSections, setAppliedSections] = useState<Set<string>>(new Set());

  const canProcess = useMemo(() => Boolean(audioFile) && !loading, [audioFile, loading]);
  const hasStructured = structured !== null;

  function resetMsgs() {
    setErr(null);
    setInfo(null);
    setAppliedSections(new Set());
  }

  async function handleProcessar() {
    if (!audioFile || loading) return;

    setLoading(true);
    resetMsgs();
    setStructured(null);

    try {
      const form = new FormData();
      form.append("audio", audioFile);
      if (consultaId) form.append("consultaId", consultaId);

      const res = await fetch("/api/consultorio/scribe/processar", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        let payload: any = {};
        try {
          payload = await res.json();
        } catch {}

        if (res.status === 404) {
          throw new Error(
            "Scribe ainda não está habilitado no backend. A interface está pronta para quando o endpoint for implementado."
          );
        }
        if (res.status === 401) {
          throw new Error("Acesso negado (401). Faça login novamente.");
        }

        throw new Error(payload?.error || `Erro ao processar (HTTP ${res.status}).`);
      }

      const json = (await res.json()) as ScribeResponse;

      if (!json?.texto) {
        throw new Error("Resposta inválida do Scribe: campo 'texto' não retornou.");
      }

      setTexto(json.texto);
      if (json.structured) {
        setStructured(json.structured);
        setInfo("Evolução gerada com sucesso! Use os botões abaixo para aplicar cada seção ao prontuário.");
      } else {
        setInfo("Evolução gerada com sucesso. Revise e valide antes de salvar.");
      }
    } catch (e: any) {
      setErr(e?.message || "Falha ao processar o áudio.");
    } finally {
      setLoading(false);
    }
  }

  function buildAnamneseBlock(): string {
    if (!structured) return "";
    const parts: string[] = [];
    if (structured.queixa_principal && structured.queixa_principal !== "Não informado") {
      parts.push(`**Queixa Principal:** ${structured.queixa_principal}`);
    }
    if (structured.hda && structured.hda !== "Não informado") {
      parts.push(`**HDA:** ${structured.hda}`);
    }
    if (structured.antecedentes_medicacoes_alergias && structured.antecedentes_medicacoes_alergias !== "Não informado") {
      parts.push(`**Antecedentes/Medicações/Alergias:** ${structured.antecedentes_medicacoes_alergias}`);
    }
    if (structured.revisao_sistemas_exame && structured.revisao_sistemas_exame !== "Não informado") {
      parts.push(`**Revisão de Sistemas/Exame:** ${structured.revisao_sistemas_exame}`);
    }
    if (structured.avaliacao_hipoteses && structured.avaliacao_hipoteses.length > 0) {
      parts.push(`**Hipóteses:** ${structured.avaliacao_hipoteses.join("; ")}`);
    }
    if (structured.plano_conduta && structured.plano_conduta !== "Não informado") {
      parts.push(`**Plano/Conduta:** ${structured.plano_conduta}`);
    }
    if (structured.alertas_seguranca && structured.alertas_seguranca !== "Não informado") {
      parts.push(`**Alertas:** ${structured.alertas_seguranca}`);
    }
    if (structured.seguimento && structured.seguimento !== "Não informado") {
      parts.push(`**Seguimento:** ${structured.seguimento}`);
    }
    return parts.join("\n\n");
  }

  function buildPrescricaoBlock(): string {
    if (!structured) return "";
    return structured.prescricao_mencionada && structured.prescricao_mencionada !== "Não informado"
      ? structured.prescricao_mencionada
      : "";
  }

  function buildEncaminhamentoBlock(): string {
    if (!structured) return "";
    return structured.encaminhamentos && structured.encaminhamentos !== "Não informado"
      ? structured.encaminhamentos
      : "";
  }

  function buildExamesBlock(): string {
    if (!structured) return "";
    if (structured.exames_sugeridos && structured.exames_sugeridos.length > 0) {
      return structured.exames_sugeridos.join("\n");
    }
    return "";
  }

  function handleApplyAnamnese() {
    const bloco = buildAnamneseBlock();
    if (bloco && onApplyToAnamnese) {
      onApplyToAnamnese(bloco);
      setAppliedSections(prev => new Set(prev).add("anamnese"));
      setInfo("Anamnese aplicada ao prontuário.");
    }
  }

  function handleApplyPrescricao() {
    const bloco = buildPrescricaoBlock();
    if (bloco && onApplyToPrescricao) {
      onApplyToPrescricao(bloco);
      setAppliedSections(prev => new Set(prev).add("prescricao"));
      setInfo("Prescrição aplicada.");
    }
  }

  function handleApplyEncaminhamento() {
    const bloco = buildEncaminhamentoBlock();
    if (bloco && onApplyToEncaminhamento) {
      onApplyToEncaminhamento(bloco);
      setAppliedSections(prev => new Set(prev).add("encaminhamento"));
      setInfo("Encaminhamento aplicado.");
    }
  }

  function handleApplyExames() {
    const bloco = buildExamesBlock();
    if (bloco && onApplyToExames) {
      onApplyToExames(bloco);
      setAppliedSections(prev => new Set(prev).add("exames"));
      setInfo("Exames aplicados.");
    }
  }

  function handleApplyAll() {
    if (!texto?.trim()) return;
    if (onApplyToEvolucao) {
      onApplyToEvolucao(texto.trim());
      setAppliedSections(prev => new Set(prev).add("all"));
      setInfo("Texto completo aplicado ao prontuário.");
    }
  }

  function handleCopy() {
    navigator.clipboard?.writeText(texto || "");
    setInfo("Copiado para a área de transferência.");
  }

  const anamneseBloco = buildAnamneseBlock();
  const prescricaoBloco = buildPrescricaoBlock();
  const encaminhamentoBloco = buildEncaminhamentoBlock();
  const examesBloco = buildExamesBlock();

  return (
    <Card className="rounded-2xl border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/30 dark:to-gray-900" data-testid="panel-scribe">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <Mic className="h-5 w-5" />
          Scribe Medical – Documentação Automática
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Registre e estruture automaticamente a consulta enquanto você atende.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Áudio da consulta</div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="inline-flex items-center gap-2 rounded-xl border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors">
              <Upload className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span>{audioFile ? "Trocar arquivo" : "Enviar áudio"}</span>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  resetMsgs();
                  const f = e.target.files?.[0] || null;
                  setAudioFile(f);
                  setStructured(null);
                }}
                data-testid="input-audio-file"
              />
            </label>

            {audioFile ? (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FileAudio className="h-4 w-4 text-purple-500" />
                <span className="truncate max-w-[200px]">{audioFile.name}</span>
              </div>
            ) : (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Formatos: .mp3, .m4a, .wav, .webm
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleProcessar}
              disabled={!canProcess}
              className="rounded-xl bg-purple-600 hover:bg-purple-700"
              data-testid="button-processar-scribe"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
              ⏹️ Finalizar e gerar evolução
            </Button>

            <Button
              variant="outline"
              className="rounded-xl"
              disabled={loading}
              onClick={() => {
                setAudioFile(null);
                setTexto("");
                setStructured(null);
                resetMsgs();
              }}
              data-testid="button-limpar-scribe"
            >
              Limpar
            </Button>

            {!audioFile && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Envie um áudio para habilitar a geração.
              </span>
            )}
          </div>
        </div>

        {err && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">Não foi possível gerar a evolução</p>
              <p className="text-sm text-red-700 dark:text-red-300">{err}</p>
            </div>
          </div>
        )}

        {info && (
          <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-3 flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300">{info}</p>
          </div>
        )}

        <hr className="border-gray-200 dark:border-gray-700" />

        <div className="space-y-3">
          <div className="text-sm font-semibold text-purple-700 dark:text-purple-300">
            Evolução Clínica Gerada Automaticamente
          </div>

          <Textarea
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setAppliedSections(new Set());
            }}
            placeholder="O texto gerado pelo Scribe aparecerá aqui. Você poderá revisar e editar antes de aplicar ao prontuário."
            className="min-h-[150px] resize-none"
            data-testid="textarea-evolucao-scribe"
          />

          <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Texto gerado automaticamente a partir do áudio da consulta.
            Revisar, editar e validar antes de salvar.
          </div>

          {hasStructured && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                Aplicar por seção:
              </div>
              <div className="flex flex-wrap gap-2">
                {onApplyToAnamnese && anamneseBloco && (
                  <Button
                    size="sm"
                    variant={appliedSections.has("anamnese") ? "outline" : "secondary"}
                    className={`rounded-xl ${appliedSections.has("anamnese") ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300" : ""}`}
                    onClick={handleApplyAnamnese}
                    disabled={appliedSections.has("anamnese")}
                    data-testid="button-apply-anamnese"
                  >
                    {appliedSections.has("anamnese") ? <CheckCircle className="mr-1 h-3 w-3" /> : <FileText className="mr-1 h-3 w-3" />}
                    Anamnese
                  </Button>
                )}

                {onApplyToPrescricao && prescricaoBloco && (
                  <Button
                    size="sm"
                    variant={appliedSections.has("prescricao") ? "outline" : "secondary"}
                    className={`rounded-xl ${appliedSections.has("prescricao") ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300" : ""}`}
                    onClick={handleApplyPrescricao}
                    disabled={appliedSections.has("prescricao")}
                    data-testid="button-apply-prescricao"
                  >
                    {appliedSections.has("prescricao") ? <CheckCircle className="mr-1 h-3 w-3" /> : <Pill className="mr-1 h-3 w-3" />}
                    Prescrição
                  </Button>
                )}

                {onApplyToEncaminhamento && encaminhamentoBloco && (
                  <Button
                    size="sm"
                    variant={appliedSections.has("encaminhamento") ? "outline" : "secondary"}
                    className={`rounded-xl ${appliedSections.has("encaminhamento") ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300" : ""}`}
                    onClick={handleApplyEncaminhamento}
                    disabled={appliedSections.has("encaminhamento")}
                    data-testid="button-apply-encaminhamento"
                  >
                    {appliedSections.has("encaminhamento") ? <CheckCircle className="mr-1 h-3 w-3" /> : <UserPlus className="mr-1 h-3 w-3" />}
                    Encaminhamento
                  </Button>
                )}

                {onApplyToExames && examesBloco && (
                  <Button
                    size="sm"
                    variant={appliedSections.has("exames") ? "outline" : "secondary"}
                    className={`rounded-xl ${appliedSections.has("exames") ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300" : ""}`}
                    onClick={handleApplyExames}
                    disabled={appliedSections.has("exames")}
                    data-testid="button-apply-exames"
                  >
                    {appliedSections.has("exames") ? <CheckCircle className="mr-1 h-3 w-3" /> : <TestTube className="mr-1 h-3 w-3" />}
                    Exames
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            {onApplyToEvolucao && (
              <Button
                onClick={handleApplyAll}
                disabled={!texto?.trim() || appliedSections.has("all")}
                variant={appliedSections.has("all") ? "outline" : "default"}
                className={`rounded-xl ${appliedSections.has("all") ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300' : 'bg-purple-600 hover:bg-purple-700'}`}
                data-testid="button-aplicar-scribe"
              >
                {appliedSections.has("all") ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aplicado ao prontuário
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Aplicar texto completo
                  </>
                )}
              </Button>
            )}

            <Button
              variant="outline"
              className="rounded-xl"
              disabled={!texto?.trim()}
              onClick={handleCopy}
              data-testid="button-copiar-scribe"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
