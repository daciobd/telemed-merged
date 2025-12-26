import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, DollarSign, Plus, Trash2, RefreshCw } from "lucide-react";

type Spend = {
  id: string;
  date: string;
  channel: string;
  campaign_name: string | null;
  amount: number;
  currency: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function MarketingSpendPage() {
  const [, setLocation] = useLocation();

  const [from, setFrom] = useState<string>(daysAgoISO(30));
  const [to, setTo] = useState<string>(todayISO());
  const [channelFilter, setChannelFilter] = useState<string>("all");

  const [spends, setSpends] = useState<Spend[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [date, setDate] = useState<string>(todayISO());
  const [newChannel, setNewChannel] = useState<string>("meta");
  const [campaignName, setCampaignName] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const total = useMemo(
    () => spends.reduce((acc, s) => acc + Number(s.amount || 0), 0),
    [spends]
  );

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ from, to });
      if (channelFilter && channelFilter !== "all") qs.set("channel", channelFilter);

      const token = localStorage.getItem("consultorio_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const r = await fetch(`/api/manager/marketing/spend?${qs.toString()}`, { 
        credentials: "include",
        headers 
      });
      const j = await r.json();

      if (!r.ok) throw new Error(j?.error || "Erro ao carregar gastos");
      setSpends((j?.spends || []) as Spend[]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao carregar gastos";
      alert(msg);
      setSpends([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [from, to, channelFilter]);

  async function createSpend(e: React.FormEvent) {
    e.preventDefault();

    const parsedAmount = Number(String(amount).replace(",", "."));
    if (!date || !newChannel || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      alert("Preencha: data, canal e valor (numérico maior que zero).");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("consultorio_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const r = await fetch("/api/manager/marketing/spend", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          date,
          channel: newChannel,
          campaignName: campaignName || null,
          amount: parsedAmount,
          currency: "BRL",
          notes: notes || null,
        }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        alert(j?.error || "Erro ao salvar gasto");
        return;
      }

      setCampaignName("");
      setAmount("");
      setNotes("");
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function removeSpend(id: string) {
    if (!confirm("Remover este lançamento?")) return;

    const token = localStorage.getItem("consultorio_token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const r = await fetch(`/api/manager/marketing/spend/${id}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    });

    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      alert(j?.error || "Erro ao remover");
      return;
    }

    await load();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2" data-testid="title-spend">
            <DollarSign className="w-6 h-6 text-teal-600" />
            Gastos de Marketing
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Lançamento e controle de gastos com campanhas de Ads
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setLocation("/manager")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Dashboard
          </Button>
          <Button variant="outline" size="sm" onClick={() => setLocation("/manager/cac")} data-testid="button-cac">
            CAC
          </Button>
          <Button variant="outline" size="sm" onClick={() => load()} disabled={loading} data-testid="button-refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <Card data-testid="card-filters">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label className="text-xs">De</Label>
              <Input 
                type="date" 
                value={from} 
                onChange={(e) => setFrom(e.target.value)} 
                className="w-40"
                data-testid="input-from"
              />
            </div>
            <div>
              <Label className="text-xs">Até</Label>
              <Input 
                type="date" 
                value={to} 
                onChange={(e) => setTo(e.target.value)} 
                className="w-40"
                data-testid="input-to"
              />
            </div>
            <div>
              <Label className="text-xs">Canal</Label>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-32" data-testid="select-channel-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="meta">Meta</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs text-gray-500">Total no período</div>
              <div className="text-xl font-bold text-teal-600" data-testid="text-total">
                {formatCurrency(total)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-create">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Lançamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createSpend} className="flex flex-wrap gap-3 items-end">
            <div>
              <Label className="text-xs">Data</Label>
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="w-36"
                data-testid="input-date"
              />
            </div>
            <div>
              <Label className="text-xs">Canal</Label>
              <Select value={newChannel} onValueChange={setNewChannel}>
                <SelectTrigger className="w-28" data-testid="select-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meta">Meta</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <Label className="text-xs">Campanha (opcional)</Label>
              <Input 
                value={campaignName} 
                onChange={(e) => setCampaignName(e.target.value)} 
                placeholder="Ex: Psiquiatria 24h"
                data-testid="input-campaign"
              />
            </div>
            <div>
              <Label className="text-xs">Valor (R$)</Label>
              <Input 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="120.50"
                className="w-28"
                data-testid="input-amount"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <Label className="text-xs">Observação</Label>
              <Input 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="cartão, nota, etc"
                data-testid="input-notes"
              />
            </div>
            <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700" data-testid="button-add">
              <Plus className="w-4 h-4 mr-1" />
              {submitting ? "Salvando..." : "Adicionar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card data-testid="card-list">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Lançamentos ({spends.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Carregando...</div>
          ) : spends.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Nenhum lançamento no período selecionado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Data</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Canal</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Campanha</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-600">Valor</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Obs</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-600">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {spends.map((s) => (
                    <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800" data-testid={`row-spend-${s.id}`}>
                      <td className="py-3 px-2 text-gray-600">{String(s.date).slice(0, 10)}</td>
                      <td className="py-3 px-2 text-gray-700 capitalize">{s.channel}</td>
                      <td className="py-3 px-2 text-gray-900 dark:text-white font-medium">{s.campaign_name || "-"}</td>
                      <td className="py-3 px-2 text-right font-medium text-teal-600">{formatCurrency(Number(s.amount))}</td>
                      <td className="py-3 px-2 text-gray-500 text-xs">{s.notes || ""}</td>
                      <td className="py-3 px-2 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeSpend(s.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          data-testid={`button-remove-${s.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
