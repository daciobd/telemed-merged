import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

type Plan = {
  id: string;
  name: string;
  priceMonthly: number;
  description: string;
  highlight?: boolean;
  features: string[];
};

const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Gratuito",
    priceMonthly: 0,
    description: "Comece a atender usando a infraestrutura da TeleMed.",
    features: [
      "Atendimentos via marketplace",
      "Prontuário eletrônico básico",
      "Agenda simplificada",
      "Suporte por e-mail",
    ],
  },
  {
    id: "professional",
    name: "Profissional",
    priceMonthly: 197,
    highlight: true,
    description: "Transforme a TeleMed no seu consultório virtual.",
    features: [
      "Tudo do Básico",
      "Consultório virtual com URL própria",
      "Agenda avançada",
      "Área de pacientes",
      "Relatórios mensais",
      "Suporte prioritário",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    priceMonthly: 397,
    description: "Para consultórios com alto volume de atendimentos.",
    features: [
      "Tudo do Profissional",
      "Equipe multiusuário",
      "Relatórios avançados",
      "API de integração",
      "White-label",
      "Suporte dedicado",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <header className="text-center space-y-3">
          <h1 className="text-3xl font-semibold text-gray-900">Planos para seu consultório TeleMed</h1>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Comece gratuitamente e evolua para um plano que transforma a TeleMed no seu consultório virtual.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${plan.highlight ? "border-2 border-teal-500 md:scale-105" : ""}`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 right-4 text-[10px] font-semibold bg-teal-600 text-white px-2 py-1 rounded-full">
                  Mais escolhido
                </span>
              )}

              <CardContent className="pt-6 flex flex-col flex-1 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{plan.name}</h2>
                  <p className="text-xs text-gray-600 mt-1">{plan.description}</p>
                </div>

                <div>
                  {plan.priceMonthly === 0 ? (
                    <p className="text-2xl font-semibold text-gray-900">Gratuito</p>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">
                      R$ {plan.priceMonthly.toFixed(2).replace(".", ",")}
                      <span className="text-xs text-gray-500 font-normal ml-1">/mês</span>
                    </p>
                  )}
                </div>

                <ul className="space-y-2 text-xs text-gray-700 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-0.5 text-teal-500 font-bold">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.highlight
                      ? "bg-teal-600 hover:bg-teal-700"
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                  data-testid={`button-plan-${plan.id}`}
                >
                  Começar com {plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-[11px] text-gray-500 text-center">
          Valores para o ambiente de desenvolvimento. Ajuste conforme sua estratégia de preço.
        </p>
      </main>
    </div>
  );
}
