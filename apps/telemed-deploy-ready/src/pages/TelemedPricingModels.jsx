// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Users, TrendingUp, CheckCircle, AlertCircle, Zap, Calendar } from "lucide-react";

/**
 * TelemedPricingModels
 * --------------------
 * Página de demonstração do BidConnect (3 modelos: Conservador, Sugestivo/IA, Dinâmico).
 *
 * ✅ Integração com API real (/api/auction/*) ou Mock local (USE_LOCAL_AUCTION_MOCK=true)
 * ✅ Telemetria simples no console (console.group/console.table)
 * ✅ Tailwind-safe (sem classes dinâmicas não safelisted)
 * ✅ URL param ?model=conservative|suggestive|dynamic para deep-link da landing
 *
 * Como usar (roteamento):
 * - Crie uma rota para "/pricing" apontando para este componente (React Router, Next.js, etc.).
 * - Na landing: botão "Testar o sistema" → href "/pricing?model=conservative".
 *
 * Mock backend (Express) — exemplo mínimo:
 * app.post('/api/auction/bids', (req,res)=> res.json({ ok:true, bid:{ id:"BID123", amount:req.body.amount||140 } }));
 * app.post('/api/auction/search', (req,res)=> res.json({ ok:true, immediate_doctors:[{id:"D1",name:"Dr. Silva"}], scheduled_doctors:[{id:"D9",name:"Dra. Souza",slot:"+45min"}] }));
 * app.post('/api/auction/accept', (req,res)=> res.json({ ok:true, consultation_id:"CONS-987" }));
 */

// -----------------------------------------
// Pequeno cliente de API com fallback de mock
// -----------------------------------------
const API = (() => {
  const useMock = (window?.TELEMED_CFG?.USE_LOCAL_AUCTION_MOCK === true)
    || (typeof process !== "undefined" && process.env?.USE_LOCAL_AUCTION_MOCK === "true");
  const base = window?.TELEMED_CFG?.AUCTION_URL || ""; // relativo por padrão

  const safeFetch = async (url, options) => {
    const r = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  };

  if (useMock) {
    console.info("[BidConnect] ⚙️ Usando MOCK local (USE_LOCAL_AUCTION_MOCK=true)");
    return {
      createBid: async ({ amount }) => ({ ok: true, bid: { id: "BID-DEMO", amount } }),
      search: async ({ bidId }) => {
        // Regras simples de mock: >=180 tem imediatos; >=160 tem agendados; <160 nada
        const amount =  Number((/BID/.test(bidId) ? 180 : 140));
        if (amount >= 180) {
          return {
            ok: true,
            immediate_doctors: [
              { id: "D1", name: "Dr. Silva", specialty: "Clínica Geral" },
              { id: "D2", name: "Dra. Santos", specialty: "Pediatria" },
            ],
            scheduled_doctors: [
              { id: "D9", name: "Dr. Souza", time: "+30 min" },
              { id: "D10", name: "Dra. Maia", time: "+60 min" },
            ],
          };
        }
        if (amount >= 160) {
          return {
            ok: true,
            immediate_doctors: [],
            scheduled_doctors: [
              { id: "D5", name: "Dr. Braga", time: "+45 min" },
              { id: "D6", name: "Dra. Lima", time: "+90 min" },
              { id: "D7", name: "Dr. Luiz", time: "+120 min" },
              { id: "D8", name: "Dra. Melo", time: "+150 min" },
            ],
          };
        }
        return { ok: true, immediate_doctors: [], scheduled_doctors: [] };
      },
      accept: async ({ doctorId, bidId }) => ({ ok: true, consultation_id: `CONS-${doctorId}-XYZ` }),
    };
  }

  // API real
  return {
    createBid: ({ amount }) => safeFetch(`${base}/api/auction/bids`, { method: "POST", body: JSON.stringify({ amount }) }),
    search: ({ bidId }) => safeFetch(`${base}/api/auction/search`, { method: "POST", body: JSON.stringify({ bid_id: bidId }) }),
    accept: ({ doctorId, bidId }) => safeFetch(`${base}/api/auction/accept`, { method: "POST", body: JSON.stringify({ bid_id: bidId, doctor_id: doctorId }) }),
  };
})();

// -----------------------------------------
// Utilidades
// -----------------------------------------
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const formatBRL = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

// Tailwind-safe color variants (sem classes dinâmicas)
const colorBlock = {
  blue: {
    wrap: "border-blue-500 bg-blue-50",
    title: "text-blue-900",
    badge: "bg-blue-600 text-white",
    borderLite: "border-blue-200 bg-blue-50",
    button: "bg-blue-600 hover:bg-blue-700",
  },
  purple: {
    wrap: "border-purple-500 bg-purple-50",
    title: "text-purple-900",
    badge: "bg-purple-600 text-white",
    borderLite: "border-purple-200 bg-purple-50",
    button: "bg-purple-600 hover:bg-purple-700",
  },
  green: {
    wrap: "border-green-500 bg-green-50",
    title: "text-green-900",
    badge: "bg-green-600 text-white",
    borderLite: "border-green-200 bg-green-50",
    button: "bg-green-600 hover:bg-green-700",
  },
  gray: {
    wrap: "border-gray-300 bg-gray-50",
    title: "text-gray-900",
    badge: "bg-gray-700 text-white",
    borderLite: "border-gray-200 bg-gray-50",
    button: "bg-gray-700 hover:bg-gray-800",
  }
};

// -----------------------------------------
// Componente principal
// -----------------------------------------
export default function TelemedPricingModels() {
  const urlModel = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("model");
  const [currentModel, setCurrentModel] = useState(urlModel || "conservative");

  const models = useMemo(() => ({
    conservative: {
      key: "conservative",
      name: "Modelo Conservador",
      subtitle: "Transparência Total — Sem Gamificação",
      description: "Paciente propõe, o sistema busca e você decide aumentar se necessário.",
      color: "blue",
    },
    suggestive: {
      key: "suggestive",
      name: "Modelo Sugestivo (IA)",
      subtitle: "IA Recomenda — Equilíbrio",
      description: "IA sugere valores com base em demanda e histórico para acelerar o atendimento.",
      color: "purple",
    },
    dynamic: {
      key: "dynamic",
      name: "Modelo Dinâmico",
      subtitle: "Mercado em Tempo Real",
      description: "Oferta/demanda por faixas de preço. Você escolhe preço vs. velocidade.",
      color: "green",
    },
  }), []);

  const active = models[currentModel];
  const activeColors = colorBlock[active.color];

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Selector de Modelos */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Precificação Dinâmica — BidConnect</h1>
        <p className="text-sm text-gray-600 mb-4">Demonstração com API real + modo mock de emergência.</p>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(models).map((m) => (
            <button
              key={m.key}
              onClick={() => setCurrentModel(m.key)}
              className={`p-3 rounded-lg border-2 transition-all ${currentModel === m.key ? activeColors.wrap : "border-gray-200 bg-white hover:border-gray-300"}`}
            >
              <div className={`text-sm font-bold ${currentModel === m.key ? activeColors.title : "text-gray-700"}`}>{m.name}</div>
              <div className="text-xs text-gray-600 mt-1">{m.subtitle}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Descrição do Modelo Atual */}
      <div className={`rounded-lg p-4 mb-6 border ${activeColors.borderLite}`}>
        <p className="text-sm text-gray-700">{active.description}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {currentModel === "conservative" && <ConservativeModel />}
        {currentModel === "suggestive" && <SuggestiveModel />}
        {currentModel === "dynamic" && <DynamicModel />}
      </div>
    </div>
  );
}

// -----------------------------------------
// MODELO 1: CONSERVADOR
// -----------------------------------------
function ConservativeModel() {
  const [userBid, setUserBid] = useState(140);
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [bidId, setBidId] = useState(null);

  const searchDoctors = async () => {
    try {
      setSearching(true);
      setResult(null);

      const amount = clamp(userBid, 100, 300);
      const created = await API.createBid({ amount });
      const newBidId = created?.bid?.id || "BID-LOCAL";
      setBidId(newBidId);

      console.group("[BidConnect] 🔎 Busca de médicos (Conservador)");
      console.log("proposta", amount, "bidId", newBidId);

      const found = await API.search({ bidId: newBidId });
      console.table({ immediate: found.immediate_doctors?.length || 0, scheduled: found.scheduled_doctors?.length || 0 });
      console.groupEnd();

      setResult({
        immediate: found.immediate_doctors || [],
        scheduled: found.scheduled_doctors || [],
      });
    } catch (e) {
      console.error("[BidConnect] erro na busca:", e);
      setResult({ error: "Falha ao buscar médicos. Tente novamente." });
    } finally {
      setSearching(false);
    }
  };

  const acceptDoctor = async (docId) => {
    try {
      const r = await API.accept({ doctorId: docId, bidId });
      console.group("[BidConnect] ✅ Aceite de médico");
      console.log("doctorId", docId, "bidId", bidId, r);
      console.groupEnd();
      alert(`Consulta confirmada! ID: ${r.consultation_id}`);
    } catch (e) {
      console.error("[BidConnect] erro no aceite:", e);
      alert("Não foi possível confirmar a consulta agora.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-6">
        <h3 className="text-xl font-bold text-blue-900 mb-2">Como funciona</h3>
        <ol className="list-decimal list-inside text-sm text-blue-900 space-y-1">
          <li>Você propõe um valor</li>
          <li>Buscamos médicos disponíveis neste valor</li>
          <li>Se não houver, você pode aumentar e tentar novamente</li>
        </ol>
      </div>

      <div className="border-2 border-gray-200 rounded-lg p-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Quanto deseja pagar?</label>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-3xl font-bold text-blue-600">{formatBRL(userBid)}</span>
          <input type="range" min={100} max={300} step={10} value={userBid} onChange={(e)=>setUserBid(Number(e.target.value))} className="flex-1" disabled={searching} />
        </div>
        <div className="flex gap-2 mb-4">
          {[140,160,180,200,220].map((val)=> (
            <button key={val} onClick={()=>setUserBid(val)} disabled={searching}
              className={`px-3 py-1 rounded text-sm font-medium transition ${userBid===val?"bg-blue-600 text-white":"bg-gray-100 text-gray-800 hover:bg-gray-200"}`}>
              {formatBRL(val)}
            </button>
          ))}
        </div>
        <button onClick={searchDoctors} disabled={searching}
          className="w-full bg-blue-600 text-white rounded-lg py-4 font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
          {searching ? (<>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Buscando médicos...
          </>) : (<>
            <Users size={20} /> Buscar Médicos Disponíveis
          </>)}
        </button>
      </div>

      {result && !result.error && (
        <div className={`border-2 rounded-lg p-6 ${result.immediate.length>0?"bg-green-50 border-green-200":"bg-yellow-50 border-yellow-200"}`}>
          <div className="flex items-start gap-3 mb-4">
            {result.immediate.length>0 ? <CheckCircle className="text-green-600" size={24} /> : <AlertCircle className="text-yellow-600" size={24} />}
            <div>
              <h4 className="font-bold text-lg mb-1">{result.immediate.length>0?"Encontramos médicos disponíveis!":"Sem atendimento imediato, mas há opções para agendar."}</h4>
              {result.immediate.length>0 && <p className="text-green-800 font-semibold">⚡ {result.immediate.length} médico(s) pode(m) atender agora</p>}
              {result.scheduled.length>0 && <p className="text-gray-800">📅 {result.scheduled.length} médico(s) com horário nas próximas horas</p>}
            </div>
          </div>

          {result.immediate.length>0 && (
            <div className="space-y-2 mb-4">
              {result.immediate.map((d)=> (
                <div key={d.id} className="flex items-center justify-between bg-white rounded border p-3">
                  <div>
                    <div className="font-semibold text-gray-900">{d.name}</div>
                    <div className="text-xs text-gray-600">{d.specialty || "Clínico"} — disponível agora</div>
                  </div>
                  <button onClick={()=>acceptDoctor(d.id)} className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-3 py-2 rounded flex items-center gap-1">
                    <Zap size={14}/> Aceitar
                  </button>
                </div>
              ))}
            </div>
          )}

          {result.scheduled.length>0 && (
            <details className="bg-white rounded border p-3">
              <summary className="cursor-pointer font-semibold">Ver opções para agendar</summary>
              <div className="mt-2 space-y-2">
                {result.scheduled.map((d)=> (
                  <div key={d.id} className="flex items-center justify-between bg-gray-50 rounded border p-3">
                    <div>
                      <div className="font-semibold text-gray-900">{d.name}</div>
                      <div className="text-xs text-gray-600">Horário: {d.time || "em breve"}</div>
                    </div>
                    <button onClick={()=>acceptDoctor(d.id)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-3 py-2 rounded flex items-center gap-1">
                      <Calendar size={14}/> Agendar
                    </button>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {result && result.error && (
        <div className="border-2 border-red-200 bg-red-50 rounded-lg p-4 text-sm text-red-800">{result.error}</div>
      )}

      <div className="border rounded-lg p-4 text-xs text-gray-600">
        <p className="font-semibold mb-2">Dicas:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Valor sugerido inicial: {formatBRL(140)}</li>
          <li>Em horários de pico (18h–21h) normalmente é preciso aumentar a proposta</li>
          <li>Você só paga se aceitar a consulta</li>
        </ul>
      </div>
    </div>
  );
}

// -----------------------------------------
// MODELO 2: SUGESTIVO (IA)
// -----------------------------------------
function SuggestiveModel() {
  const [userBid, setUserBid] = useState(140);
  const [searching, setSearching] = useState(false);
  const [aiSuggest, setAiSuggest] = useState(null);
  const [result, setResult] = useState(null);

  const searchWithAI = async () => {
    setSearching(true); setAiSuggest(null); setResult(null);
    try {
      // Heurística simples local para demo de IA
      if (userBid < 180) {
        setTimeout(()=>{
          setAiSuggest({ suggested: 195, confidence: 0.85, nowWaiting: 2 });
          setSearching(false);
        }, 900);
        return;
      }
      const created = await API.createBid({ amount: userBid });
      const found = await API.search({ bidId: created?.bid?.id || "BID-LOCAL" });
      setResult({ success: true, doctors: (found.immediate_doctors||[]).slice(0,2) });
    } catch (e) {
      setResult({ error: "Falha ao consultar IA/mercado." });
    } finally {
      setSearching(false);
    }
  };

  const acceptAISuggestion = () => { setUserBid(195); setAiSuggest(null); setTimeout(searchWithAI, 50); };

  return (
    <div className="space-y-6">
      <div className="border-2 border-purple-200 bg-purple-50 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="text-purple-700" />
          <h3 className="text-xl font-bold text-purple-900">IA Inteligente</h3>
        </div>
        <p className="text-sm text-purple-900">Sugestões baseadas na demanda atual e histórico de sucesso.</p>
      </div>

      <div className="border-2 border-gray-200 rounded-lg p-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Valor da sua consulta</label>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-3xl font-bold text-purple-700">{formatBRL(userBid)}</span>
          <input type="range" min={100} max={300} step={5} value={userBid} onChange={(e)=>setUserBid(Number(e.target.value))} className="flex-1" disabled={searching} />
        </div>
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Chance de atendimento imediato</span>
            <span className="font-semibold">
              {userBid<140?"Muito baixa":userBid<170?"Baixa":userBid<190?"Média":userBid<210?"Alta":"Muito alta"}
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className={
              "h-full transition-all duration-300 " +
              (userBid<140?"w-1/5 bg-red-500":userBid<170?"w-2/5 bg-orange-500":userBid<190?"w-3/5 bg-yellow-500":userBid<210?"w-4/5 bg-lime-500":"w-full bg-green-500")
            }/>
          </div>
        </div>
        <button onClick={searchWithAI} disabled={searching}
          className="w-full bg-purple-600 text-white rounded-lg py-4 font-bold text-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
          {searching ? (<>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Analisando disponibilidade...
          </>) : (<>
            <TrendingUp size={20} /> Buscar com IA
          </>)}
        </button>
      </div>

      {aiSuggest && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-6">
          <h4 className="font-bold text-lg text-purple-900 mb-2">💡 Sugestão Inteligente</h4>
          <p className="text-gray-700 mb-3">{Math.round(aiSuggest.confidence*100)}% de chance de atendimento imediato com:</p>
          <div className="bg-white rounded-lg p-4 mb-4 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xl font-bold text-purple-700">{formatBRL(aiSuggest.suggested)}</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">+{formatBRL(aiSuggest.suggested - userBid)}</span>
            </div>
            <p className="text-sm text-gray-600">{aiSuggest.nowWaiting} médico(s) aguardando consultas</p>
          </div>
          <div className="flex gap-3">
            <button onClick={acceptAISuggestion} className="flex-1 bg-purple-600 text-white rounded-lg py-3 font-bold hover:bg-purple-700">Aceitar Sugestão</button>
            <button onClick={()=>setAiSuggest(null)} className="flex-1 bg-white border-2 border-gray-300 text-gray-700 rounded-lg py-3 font-bold hover:bg-gray-50">Manter {formatBRL(userBid)}</button>
          </div>
        </div>
      )}

      {result?.success && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3"><CheckCircle className="text-green-700"/><h4 className="font-bold text-lg text-green-900">Médicos encontrados</h4></div>
          <div className="space-y-2">
            {result.doctors.map((d)=> (
              <div key={d.id||d.name} className="bg-white rounded border p-3">
                <div className="font-semibold text-gray-900">{d.name}</div>
                <div className="text-xs text-gray-600">Disponível agora ⚡</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result?.error && (
        <div className="border-2 border-red-200 bg-red-50 rounded-lg p-4 text-sm text-red-800">{result.error}</div>
      )}
    </div>
  );
}

// -----------------------------------------
// MODELO 3: DINÂMICO (Mercado)
// -----------------------------------------
function DynamicModel() {
  const [selected, setSelected] = useState(null);
  const tiers = [
    { key:"econ", min:140, max:159, immediate:0, scheduled:2, wait:"2–4 h", label:"Econômico", color:"gray" },
    { key:"std",  min:160, max:179, immediate:1, scheduled:5, wait:"30–60 min", label:"Padrão", color:"blue" },
    { key:"fast", min:180, max:199, immediate:3, scheduled:8, wait:"5–15 min", label:"Rápido", color:"purple" },
    { key:"prem", min:200, max:250, immediate:7, scheduled:12, wait:"Imediato", label:"Premium", color:"green" },
  ];

  const badge = (c)=> ({ gray:"bg-gray-200 text-gray-700", blue:"bg-blue-200 text-blue-700", purple:"bg-purple-200 text-purple-700", green:"bg-green-200 text-green-700"}[c]);
  const focus = (c)=> ({ gray:"border-gray-400 bg-gray-50", blue:"border-blue-500 bg-blue-50", purple:"border-purple-500 bg-purple-50", green:"border-green-500 bg-green-50"}[c]);

  return (
    <div className="space-y-6">
      <div className="border-2 border-green-200 bg-green-50 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2"><TrendingUp className="text-green-700"/><h3 className="text-xl font-bold text-green-900">Mercado Transparente</h3></div>
        <p className="text-sm text-green-900">Disponibilidade por faixa de preço, em tempo quase real.</p>
      </div>

      <div className="border-2 border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-gray-600">Agora</p>
            <p className="text-lg font-bold">{new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Demanda</p>
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                {[1,2,3,4].map(i=> <div key={i} className="w-2 h-4 bg-orange-500 rounded-sm"/>) }
                <div className="w-2 h-4 bg-gray-200 rounded-sm"/>
              </div>
              <span className="text-xs font-semibold text-orange-600">Alta</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-gray-700 bg-orange-50 border border-orange-200 rounded p-2">⚠️ Horário de pico — valores maiores aceleram o atendimento</p>
      </div>

      <div className="space-y-3">
        <h4 className="font-bold text-gray-900">Escolha sua faixa:</h4>
        {tiers.map((t)=> (
          <div key={t.key} onClick={()=>setSelected(t.key)} className={`border-2 rounded-lg p-4 cursor-pointer transition ${selected===t.key?focus(t.color):"border-gray-200 bg-white hover:border-gray-300"}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-1 rounded text-[11px] font-bold ${badge(t.color)}`}>{t.label}</span>
                  {t.immediate>0 && <span className="flex items-center gap-1 text-[11px] font-semibold text-green-700"><Zap size={12}/> Imediato</span>}
                </div>
                <div className="text-2xl font-bold">{formatBRL(t.min)} – {formatBRL(t.max)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-600 mb-1">Tempo estimado</div>
                <div className="font-bold text-lg">{t.wait}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white rounded-lg p-2 border border-gray-200">
                <div className="flex items-center gap-1 text-gray-600 mb-1"><Zap size={14}/><span className="text-xs">Agora</span></div>
                <div className="font-bold text-lg">{t.immediate>0?t.immediate:"—"}</div>
                <div className="text-[11px] text-gray-500">{t.immediate===0?"Nenhum":t.immediate===1?"médico":"médicos"}</div>
              </div>
              <div className="bg-white rounded-lg p-2 border border-gray-200">
                <div className="flex items-center gap-1 text-gray-600 mb-1"><Calendar size={14}/><span className="text-xs">Agendar</span></div>
                <div className="font-bold text-lg">{t.scheduled}</div>
                <div className="text-[11px] text-gray-500">médicos</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
          <h4 className="font-bold text-lg mb-2">Faixa selecionada: {tiers.find(x=>x.key===selected)?.label}</h4>
          <p className="text-gray-700 mb-4">
            {tiers.find(x=>x.key===selected)?.immediate>0 ? (
              <>
                <strong>{tiers.find(x=>x.key===selected)?.immediate} médico(s)</strong> disponível(is) para atendimento imediato nesta faixa.
              </>
            ) : (
              <>
                Nenhum médico imediato agora, mas <strong>{tiers.find(x=>x.key===selected)?.scheduled} médico(s)</strong> para agendar.
              </>
            )}
          </p>
          <div className="flex gap-3">
            {tiers.find(x=>x.key===selected)?.immediate>0 && (
              <button className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg py-3 font-bold flex items-center justify-center gap-2"><Zap size={18}/> Atender Agora</button>
            )}
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-bold flex items-center justify-center gap-2"><Calendar size={18}/> Ver horários</button>
          </div>
        </div>
      )}

      <div className="border rounded-lg p-4 text-xs text-gray-600">
        <p className="font-semibold mb-2">Estatísticas de hoje</p>
        <div className="grid grid-cols-3 gap-2">
          <div><span className="text-gray-600">Valor médio:</span> <span className="font-bold">{formatBRL(175)}</span></div>
          <div><span className="text-gray-600">Médicos ativos:</span> <span className="font-bold">23</span></div>
          <div><span className="text-gray-600">Consultas:</span> <span className="font-bold">147</span></div>
        </div>
      </div>
    </div>
  );
}
