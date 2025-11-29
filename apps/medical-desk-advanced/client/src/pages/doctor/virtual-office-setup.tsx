import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type VirtualOfficeSettings = {
  customUrl?: string;
  consultationPricing?: Record<string, number>;
  autoAcceptBookings?: boolean;
  requirePrepayment?: boolean;
  cancellationHours?: number;
};

const WEEK_DAYS = [
  { id: "mon", label: "Seg" },
  { id: "tue", label: "Ter" },
  { id: "wed", label: "Qua" },
  { id: "thu", label: "Qui" },
  { id: "fri", label: "Sex" },
  { id: "sat", label: "Sáb" },
  { id: "sun", label: "Dom" },
];

export default function VirtualOfficeSetupPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [customUrl, setCustomUrl] = useState("");
  const [pricing, setPricing] = useState<Record<string, number>>({
    primeira_consulta: 300,
    retorno: 200,
    urgente: 450,
    check_up: 250,
  });

  // Fetch configurações atuais
  const { isLoading } = useQuery({
    queryKey: ["/api/virtual-office/settings"],
    queryFn: async () => {
      const res = await fetch("/api/virtual-office/settings", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok && res.status !== 404) throw new Error("Erro ao carregar");
      return res.json().catch(() => ({}));
    },
    onSuccess: (data) => {
      if (data.settings) {
        setCustomUrl(data.settings.customUrl || "");
        setPricing(data.settings.consultationPricing || pricing);
      }
    },
  });

  // Mutation para salvar
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!customUrl.trim()) {
        throw new Error("URL personalizada é obrigatória");
      }

      const res = await fetch("/api/virtual-office/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          customUrl: customUrl.toLowerCase(),
          consultationPricing: pricing,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Erro ao salvar");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("✅ Configurações salvas com sucesso!");
    },
    onError: (err: Error) => {
      toast.error(`❌ ${err.message}`);
    },
  });

  const handlePricingChange = (type: string, value: string) => {
    setPricing((prev) => ({
      ...prev,
      [type]: value ? parseFloat(value) : 0,
    }));
  };

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
          <CardContent className="pt-6 space-y-6">
            {/* URL Personalizada */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-800">URL do consultório</h2>
              <p className="text-xs text-gray-500">Essa é a página que você vai compartilhar com os pacientes.</p>
              <div className="flex gap-2 mt-2">
                <span className="text-sm text-gray-500 self-center">{baseUrl}/dr/</span>
                <input
                  type="text"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="seu-nome"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value.toLowerCase())}
                />
              </div>
              {customUrl && (
                <p className="text-xs text-teal-600">Link: {baseUrl}/dr/{customUrl}</p>
              )}
            </div>

            {/* Preços */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-800">Valores das consultas (R$)</h2>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(pricing).map(([type, price]) => (
                  <div key={type}>
                    <label className="text-xs font-medium text-gray-600 capitalize block mb-1">
                      {type.replace(/_/g, " ")}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      value={price}
                      onChange={(e) => handlePricingChange(type, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700"
                data-testid="button-save-settings"
              >
                {saveMutation.isPending ? "Salvando..." : "Salvar configurações"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
