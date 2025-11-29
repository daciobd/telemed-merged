import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/apiClient";
import { virtualOfficeSchema, VirtualOfficeFormData } from "@/schemas/virtualOfficeSchema";

export default function VirtualOfficeSetupPage() {
  const { toast } = useToast();

  const form = useForm<VirtualOfficeFormData>({
    resolver: zodResolver(virtualOfficeSchema),
    defaultValues: {
      customUrl: "",
      primeira_consulta: 300,
      retorno: 200,
      urgente: 450,
      check_up: 250,
    },
  });

  // Fetch configurações atuais
  const { isLoading } = useQuery({
    queryKey: ["/api/virtual-office/settings"],
    queryFn: () => apiFetch("/api/virtual-office/settings"),
    onSuccess: (data) => {
      if (data?.settings) {
        form.reset({
          customUrl: data.settings.customUrl || "",
          primeira_consulta: data.settings.consultationPricing?.primeira_consulta || 300,
          retorno: data.settings.consultationPricing?.retorno || 200,
          urgente: data.settings.consultationPricing?.urgente || 450,
          check_up: data.settings.consultationPricing?.check_up || 250,
        });
      }
    },
    onError: (err) => {
      console.error("Erro ao carregar configurações:", err);
    },
  });

  // Mutation para salvar
  const saveMutation = useMutation({
    mutationFn: async (values: VirtualOfficeFormData) => {
      return apiFetch("/api/virtual-office/settings", {
        method: "PATCH",
        body: JSON.stringify({
          customUrl: values.customUrl.toLowerCase(),
          consultationPricing: {
            primeira_consulta: values.primeira_consulta,
            retorno: values.retorno,
            urgente: values.urgente,
            check_up: values.check_up,
          },
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Sucesso!",
        description: "Configurações salvas com sucesso!",
      });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "❌ Erro",
        description: err.message || "Erro ao salvar configurações.",
      });
    },
  });

  async function onSubmit(values: VirtualOfficeFormData) {
    await saveMutation.mutateAsync(values);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Carregando configurações...</p>
      </div>
    );
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://telemed.com.br";

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">Configuração do consultório</h1>
          <p className="text-sm text-gray-600">Defina sua URL, preços e configurações.</p>
        </header>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* URL Personalizada */}
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-gray-800">URL do consultório</h2>
                <p className="text-xs text-gray-500">Essa é a página que você vai compartilhar com os pacientes.</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-sm text-gray-500 self-center">{baseUrl}/dr/</span>
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="seu-nome"
                      {...form.register("customUrl")}
                      data-testid="input-custom-url"
                    />
                    {form.formState.errors.customUrl && (
                      <p className="text-xs text-red-600 mt-1">
                        {form.formState.errors.customUrl.message}
                      </p>
                    )}
                  </div>
                </div>
                {form.watch("customUrl") && (
                  <p className="text-xs text-teal-600">Link: {baseUrl}/dr/{form.watch("customUrl").toLowerCase()}</p>
                )}
              </div>

              {/* Preços */}
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-gray-800">Valores das consultas (R$)</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "primeira_consulta", label: "1ª consulta" },
                    { key: "retorno", label: "Retorno" },
                    { key: "urgente", label: "Urgente" },
                    { key: "check_up", label: "Check-up" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
                      <Input
                        type="number"
                        min={0}
                        step={10}
                        {...form.register(key as any, { valueAsNumber: true })}
                        data-testid={`input-price-${key}`}
                      />
                      {form.formState.errors[key as any] && (
                        <p className="text-xs text-red-600 mt-1">
                          {form.formState.errors[key as any]?.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700"
                  disabled={saveMutation.isPending}
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
