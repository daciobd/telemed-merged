import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, AlertTriangle, Loader2, ArrowRight } from "lucide-react";

interface ChecklistIssue {
  code: string;
  label: string;
  field: string;
  mode: "block" | "warn";
}

interface ValidateResult {
  ok: boolean;
  mode: "block" | "warn" | "ok";
  issues: ChecklistIssue[];
  warnings: ChecklistIssue[];
}

interface ChecklistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultaId: string;
  onProceed: () => void;
  onScrollToField?: (field: string) => void;
}

const FIELD_LABELS: Record<string, string> = {
  queixa_principal: "Queixa Principal",
  anamnese: "Anamnese / HDA",
  hipoteses_cid: "Hipótese Diagnóstica (CID)",
  seguimento: "Conduta / Seguimento",
  prescricao: "Prescrição",
  alertas: "Orientações / Alertas",
  exames: "Exames",
  encaminhamentos: "Encaminhamentos",
};

export default function ChecklistModal({
  open,
  onOpenChange,
  consultaId,
  onProceed,
  onScrollToField,
}: ChecklistModalProps) {
  const [result, setResult] = useState<ValidateResult | null>(null);

  const validateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/consultorio/prontuario/${consultaId}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao validar");
      }
      return res.json() as Promise<ValidateResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.ok && data.warnings.length === 0) {
        onProceed();
        onOpenChange(false);
      }
    },
  });

  useEffect(() => {
    if (open) {
      setResult(null);
      validateMutation.reset();
      validateMutation.mutate();
    }
  }, [open]);

  const handleProceedAnyway = () => {
    if (result && result.ok) {
      onProceed();
      onOpenChange(false);
    }
  };

  const handleGoToField = (field: string) => {
    setResult(null);
    onScrollToField?.(field);
    onOpenChange(false);
  };

  const renderIcon = (mode: "block" | "warn") => {
    if (mode === "block") {
      return <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
    }
    return <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-checklist">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="title-checklist">
            <CheckCircle2 className="h-5 w-5 text-teal-600" />
            Checklist de Qualidade
          </DialogTitle>
        </DialogHeader>

        {validateMutation.isPending && (
          <div className="py-8 flex flex-col items-center gap-3" data-testid="status-validating">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <p className="text-sm text-gray-500">Verificando prontuário...</p>
          </div>
        )}

        {validateMutation.isError && (
          <div className="py-4" data-testid="status-error">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-300" data-testid="text-error-message">
                {validateMutation.error?.message || "Erro ao validar"}
              </p>
            </div>
            <Button 
              onClick={() => validateMutation.mutate()} 
              className="w-full mt-4"
              variant="outline"
              data-testid="button-retry-validate"
            >
              Tentar Novamente
            </Button>
          </div>
        )}

        {result && (
          <div className="py-2 space-y-4" data-testid="checklist-results">
            {result.ok && result.warnings.length === 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2" data-testid="status-success">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  Tudo certo! Finalizando...
                </p>
              </div>
            )}

            {result.issues.length > 0 && (
              <div data-testid="issues-block-list">
                <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2" data-testid="text-issues-title">
                  Campos obrigatórios faltando ({result.issues.length}):
                </p>
                <ul className="space-y-2" data-testid="list-issues">
                  {result.issues.map((issue) => (
                    <li
                      key={issue.code}
                      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 flex items-center justify-between"
                      data-testid={`issue-item-${issue.code}`}
                    >
                      <div className="flex items-center gap-2">
                        {renderIcon(issue.mode)}
                        <span className="text-sm text-red-700 dark:text-red-300" data-testid={`text-issue-${issue.code}`}>
                          {FIELD_LABELS[issue.field] || issue.label}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGoToField(issue.field)}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-goto-${issue.field}`}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.warnings.length > 0 && (
              <div data-testid="warnings-list">
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2" data-testid="text-warnings-title">
                  Campos recomendados ({result.warnings.length}):
                </p>
                <ul className="space-y-2" data-testid="list-warnings">
                  {result.warnings.map((warn) => (
                    <li
                      key={warn.code}
                      className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2 flex items-center justify-between"
                      data-testid={`warn-item-${warn.code}`}
                    >
                      <div className="flex items-center gap-2">
                        {renderIcon(warn.mode)}
                        <span className="text-sm text-amber-700 dark:text-amber-300" data-testid={`text-warn-${warn.code}`}>
                          {FIELD_LABELS[warn.field] || warn.label}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGoToField(warn.field)}
                        className="text-amber-600 hover:text-amber-700"
                        data-testid={`button-goto-${warn.field}`}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {result && (
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-checklist"
            >
              {result.ok ? "Editar Prontuário" : "Corrigir Campos"}
            </Button>
            {result.ok && result.warnings.length > 0 && (
              <Button
                onClick={handleProceedAnyway}
                className="bg-teal-600 hover:bg-teal-700"
                data-testid="button-proceed-anyway"
              >
                Finalizar Mesmo Assim
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
