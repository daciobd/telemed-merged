import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/apiClient";
import { virtualOfficeSchema, VirtualOfficeFormData } from "@/schemas/virtualOfficeSchema";

const WEEK_DAYS = [
  { id: "mon", label: "Seg" },
  { id: "tue", label: "Ter" },
  { id: "wed", label: "Qua" },
  { id: "thu", label: "Qui" },
  { id: "fri", label: "Sex" },
  { id: "sat", label: "Sáb" },
  { id: "sun", label: "Dom" },
] as const;

type SettingsResponse = {
  customUrl?: string;
  primeira_consulta?: number | null;
  retorno?: number | null;
  urgente?: number | null;
  check_up?: number | null;
  autoAccept?: boolean;
  workDays?: string[];
  startTime?: string;
  endTime?: string;
};

export default function VirtualOfficeSetupPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://telemed.com.br";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VirtualOfficeFormData>({
    resolver: zodResolver(virtualOfficeSchema),
    defaultValues: {
      customUrl: "",
      primeira_consulta: null,
      retorno: null,
      urgente: null,
      check_up: null,
      autoAccept: true,
      workDays: ["mon", "tue", "wed", "thu", "fri"],
      startTime: "08:00",
      endTime: "18:00",
    },
  });

  const workDaysWatch = watch("workDays");
  const autoAcceptWatch = watch("autoAccept");

  // Carrega configurações
  const {
    data: settings,
    isLoading,
    error,
  } = useQuery<SettingsResponse>({
    queryKey: ["virtual-office-settings"],
    queryFn: async () => {
      const res = await apiFetch("/api/virtual-office/settings");
      return res.settings || {};
    },
  });

  // Preenche form quando carregar
  useEffect(() => {
    if (settings) {
      reset({
        customUrl: settings.customUrl || "",
        primeira_consulta:
          typeof settings.primeira_consulta === "number"
            ? settings.primeira_consulta
            : null,
        retorno:
          typeof settings.retorno === "number" ? settings.retorno : null,
        urgente:
          typeof settings.urgente === "number" ? settings.urgente : null,
        check_up:
          typeof settings.check_up === "number" ? settings.check_up : null,
        autoAccept: settings.autoAccept ?? true,
        workDays:
          settings.workDays && settings.workDays.length > 0
            ? settings.workDays
            : ["mon", "tue", "wed", "thu", "fri"],
        startTime: settings.startTime || "08:00",
        endTime: settings.endTime || "18:00",
      });
    }
  }, [settings, reset]);

  // Mutação para salvar
  const saveMutation = useMutation({
    mutationFn: async (values: VirtualOfficeFormData) => {
      const payload = {
        ...values,
        customUrl: values.customUrl.toLowerCase(),
        primeira_consulta: values.primeira_consulta ?? undefined,
        retorno: values.retorno ?? undefined,
        urgente: values.urgente ?? undefined,
        check_up: values.check_up ?? undefined,
      };

      return apiFetch("/api/virtual-office/settings", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["virtual-office-settings"] });
      toast({
        title: "✅ Configurações salvas",
        description: "Seu consultório virtual foi atualizado com sucesso.",
      });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "❌ Erro ao salvar",
        description: err?.message || "Não foi possível salvar as configurações.",
      });
    },
  });

  function toggleWorkDay(dayId: string) {
    const current = new Set(workDaysWatch || []);
    if (current.has(dayId)) current.delete(dayId);
    else current.add(dayId);
    setValue("workDays", Array.from(current), { shouldDirty: true });
  }

  async function onSubmit(values: VirtualOfficeFormData) {
    await saveMutation.mutateAsync(values);
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow p-6 space-y-4">
          <div className="h-6 w-40 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-slate-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-10 w-full bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-10 w-full bg-slate-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 space-y-3">
            <h1 className="text-lg font-semibold text-gray-900">Erro ao carregar o consultório</h1>
            <p className="text-sm text-gray-600">
              {(error as Error).message || "Tente atualizar a página ou entrar novamente."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">Configuração do consultório virtual</h1>
          <p className="text-sm text-gray-600">
            Defina sua URL pública, valores de consulta, dias de atendimento e horários.
          </p>
        </header>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* URL */}
              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-gray-800">URL do consultório</h2>
                <p className="text-xs text-gray-500">Essa é a página que você vai compartilhar com os pacientes.</p>
                <div className="flex flex-col sm:flex-row items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">{baseUrl}/dr/</span>
                  <div className="flex-1 w-full">
                    <Input
                      {...register("customUrl")}
                      placeholder="seu-nome"
                      onChange={(e) =>
                        setValue("customUrl", e.target.value.toLowerCase(), { shouldDirty: true })
                      }
                      data-testid="input-custom-url"
                    />
                    {errors.customUrl && (
                      <p className="text-xs text-red-600 mt-1">{errors.customUrl.message}</p>
                    )}
                  </div>
                </div>
                {watch("customUrl") && (
                  <p className="text-xs text-teal-600">Link: {baseUrl}/dr/{watch("customUrl")}</p>
                )}
              </section>

              {/* Preços */}
              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-gray-800">Valores das consultas (R$)</h2>
                <p className="text-xs text-gray-500">
                  Você pode deixar em branco se não oferecer aquele tipo de atendimento.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {[
                    { key: "primeira_consulta", label: "1ª consulta" },
                    { key: "retorno", label: "Retorno" },
                    { key: "urgente", label: "Urgência" },
                    { key: "check_up", label: "Check-up" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
                      <Input
                        type="number"
                        step={10}
                        {...register(key as any, { valueAsNumber: true })}
                        placeholder="Ex: 300"
                        data-testid={`input-price-${key}`}
                      />
                      {errors[key as any] && (
                        <p className="text-xs text-red-600 mt-1">{errors[key as any]?.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Agenda */}
              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-gray-800">Agenda padrão</h2>
                <p className="text-xs text-gray-500">
                  Esses dias e horários serão usados para gerar os slots disponíveis.
                </p>

                {/* Dias */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {WEEK_DAYS.map((day) => {
                    const active = workDaysWatch?.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleWorkDay(day.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                          active
                            ? "bg-teal-50 border-teal-500 text-teal-700"
                            : "bg-white border-slate-200 text-slate-600 hover:border-teal-300"
                        }`}
                        data-testid={`button-day-${day.id}`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                {errors.workDays && (
                  <p className="text-xs text-red-600">{errors.workDays.message as string}</p>
                )}

                {/* Horários */}
                <div className="flex flex-wrap gap-4 items-center mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">De</span>
                    <Input
                      type="time"
                      {...register("startTime")}
                      className="w-24"
                      data-testid="input-start-time"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">até</span>
                    <Input
                      type="time"
                      {...register("endTime")}
                      className="w-24"
                      data-testid="input-end-time"
                    />
                  </div>
                </div>
                {errors.startTime && (
                  <p className="text-xs text-red-600 mt-1">{errors.startTime.message}</p>
                )}
                {errors.endTime && (
                  <p className="text-xs text-red-600 mt-1">{errors.endTime.message}</p>
                )}
              </section>

              {/* Auto-aceitar */}
              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-gray-800">Aprovação de agendamentos</h2>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("autoAccept")}
                    className="w-4 h-4 rounded border-gray-300"
                    data-testid="input-auto-accept"
                  />
                  Aprovar automaticamente agendamentos dentro dos horários disponíveis
                </label>
              </section>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700"
                  disabled={saveMutation.isPending || isSubmitting}
                  data-testid="button-save-settings"
                >
                  {saveMutation.isPending ? "Salvando..." : "Salvar configurações"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
